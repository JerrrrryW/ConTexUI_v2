type Provider = 'openai' | 'siliconflow' | 'gemini';
type StatusMessage = {
  type: 'status';
  state: 'loading' | 'idle' | 'success' | 'error';
  message?: string;
};

type GenerateDesignMessage = {
  type: 'generate-design';
  prompt: string;
  apiKey: string;
  provider: Provider;
};

type LayerSpec = {
  type: 'text' | 'button' | 'input' | 'rectangle';
  label?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  size?: number;
  color?: string;
  background?: string;
  align?: 'left' | 'center' | 'right';
  cornerRadius?: number;
};

type UISpec = {
  title?: string;
  background?: string;
  padding?: number;
  spacing?: number;
  layers: LayerSpec[];
};

type OpenAIResponse = {
  choices?: { message?: { content?: string } }[];
};

const PROVIDERS = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  siliconflow: { baseUrl: 'https://api.siliconflow.cn/v1', model: 'Qwen/Qwen3-30B-A3B-Thinking-2507' },
  gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-1.5-flash-latest' }
} as const;

const DEFAULT_FONT: FontName = { family: 'Inter', style: 'Regular' };
const FALLBACK_FONT: FontName = { family: 'Roboto', style: 'Regular' };
const DEFAULT_BACKGROUND = '#F7F9FC';
const DEFAULT_TEXT_COLOR = '#111827';
let activeFont: FontName = DEFAULT_FONT;

figma.showUI(__html__, { width: 340, height: 320 });

figma.ui.onmessage = async (msg: GenerateDesignMessage) => {
  if (msg.type !== 'generate-design') return;

  const prompt = msg.prompt?.trim();
  const apiKey = msg.apiKey?.trim();
  const provider: Provider = msg.provider || 'openai';

  if (!prompt) {
    figma.notify('请输入指令');
    return;
  }

  if (!apiKey) {
    figma.notify('请输入 OpenAI API Key');
    return;
  }

  try {
    sendStatus('loading');
    figma.notify('正在向模型请求设计…');
    const spec = await fetchDesignSpec(prompt, apiKey, provider);
    await loadFonts();
    const frame = buildUiFromSpec(spec);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);
    sendStatus('success');
    figma.notify('生成完成 🎨');
  } catch (error) {
    sendStatus('error', getErrorMessage(error));
    figma.notify(`生成失败：${getErrorMessage(error)}`);
  } finally {
    sendStatus('idle');
  }
};

async function fetchDesignSpec(prompt: string, apiKey: string, provider: Provider): Promise<UISpec> {
  if (provider === 'gemini') {
    return fetchGeminiSpec(prompt, apiKey);
  }

  const config = provider === 'openai' ? PROVIDERS.openai : PROVIDERS.siliconflow;
  return fetchOpenAICompatSpec(prompt, apiKey, config.baseUrl, config.model);
}

async function fetchOpenAICompatSpec(
  prompt: string,
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<UISpec> {
  const systemPrompt = `
You are a product designer who outputs compact JSON for a small layout (3-6 layers).
Use this shape:
{
  "title": "short screen name",
  "background": "#F7F9FC",
  "padding": 24,
  "spacing": 12,
  "layers": [
    {
      "type": "text|button|input|rectangle",
      "label": "content for the component",
      "placeholder": "only for input",
      "width": 280,
      "height": 48,
      "size": 16,
      "color": "#111827",
      "background": "#FACC15",
      "cornerRadius": 12,
      "align": "center"
    }
  ]
}
Numbers only, hex colors, no Markdown — respond with JSON only.`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    })
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(`模型请求失败 (${response.status}): ${truncate(raw)}`);
  }

  const data = JSON.parse(raw) as OpenAIResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('模型没有返回内容');
  }

  const parsed = safeJsonParse<UISpec>(content);

  if (!Array.isArray(parsed.layers)) {
    throw new Error('模型返回格式不正确');
  }

  return normalizeSpec(parsed);
}

async function fetchGeminiSpec(prompt: string, apiKey: string): Promise<UISpec> {
  const { baseUrl, model } = PROVIDERS.gemini;
  const systemPrompt = `
You are a product designer who outputs compact JSON for a small layout (3-6 layers).
Use the schema described earlier. Numbers only, hex colors, no Markdown — respond with JSON only.
`;

  const url = `${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6 }
    })
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(`Gemini 请求失败 (${response.status}): ${truncate(raw)}`);
  }

  const data = JSON.parse(raw);
  const contentText: string | undefined = data.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text)
    .filter(Boolean)
    .join('');

  if (!contentText) {
    throw new Error('Gemini 没有返回内容');
  }

  const parsed = safeJsonParse<UISpec>(contentText);

  if (!Array.isArray(parsed.layers)) {
    throw new Error('Gemini 返回格式不正确');
  }

  return normalizeSpec(parsed);
}

function safeJsonParse<T>(value: string): T {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    const firstBrace = value.indexOf('{');
    const lastBrace = value.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      const sliced = value.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(sliced) as T;
      } catch (innerError) {
        throw innerError;
      }
    }

    throw error;
  }
}

function normalizeSpec(spec: UISpec): UISpec {
  const padding = typeof spec.padding === 'number' ? spec.padding : 24;
  const spacing = typeof spec.spacing === 'number' ? spec.spacing : 12;
  const layers = (spec.layers || []).slice(0, 8).map((layer) => ({
    ...layer,
    type: layer.type ?? 'text',
    width: layer.width,
    height: layer.height
  }));

  return {
    title: spec.title || 'LLM 生成 UI',
    background: spec.background || DEFAULT_BACKGROUND,
    padding,
    spacing,
    layers
  };
}

async function loadFonts() {
  try {
    await figma.loadFontAsync(DEFAULT_FONT);
    activeFont = DEFAULT_FONT;
  } catch (_error) {
    await figma.loadFontAsync(FALLBACK_FONT);
    activeFont = FALLBACK_FONT;
  }
}

function buildUiFromSpec(spec: UISpec): FrameNode {
  const frame = figma.createFrame();
  frame.name = spec.title ?? 'LLM UI';
  frame.layoutMode = 'VERTICAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.itemSpacing = spec.spacing ?? 12;
  frame.paddingLeft = spec.padding ?? 24;
  frame.paddingRight = spec.padding ?? 24;
  frame.paddingTop = spec.padding ?? 24;
  frame.paddingBottom = spec.padding ?? 24;
  frame.cornerRadius = 16;
  frame.fills = [{ type: 'SOLID', color: hexToRgb(spec.background || DEFAULT_BACKGROUND) }];

  spec.layers.forEach((layer) => {
    const node = createLayerNode(layer);
    frame.appendChild(node);
  });

  figma.currentPage.appendChild(frame);
  return frame;
}

function createLayerNode(layer: LayerSpec): SceneNode {
  switch (layer.type) {
    case 'button':
      return createButton(layer);
    case 'input':
      return createInput(layer);
    case 'rectangle':
      return createRectangle(layer);
    case 'text':
    default:
      return createTextNode(layer);
  }
}

function createTextNode(layer: LayerSpec): TextNode {
  const text = figma.createText();
  text.fontName = activeFont;
  text.characters = layer.label ?? '文本内容';
  text.fontSize = layer.size ?? 16;
  text.fills = [{ type: 'SOLID', color: hexToRgb(layer.color || DEFAULT_TEXT_COLOR) }];

  if (layer.align === 'center') {
    text.textAlignHorizontal = 'CENTER';
  } else if (layer.align === 'right') {
    text.textAlignHorizontal = 'RIGHT';
  } else {
    text.textAlignHorizontal = 'LEFT';
  }

  return text;
}

function createButton(layer: LayerSpec): FrameNode {
  const button = figma.createFrame();
  button.name = layer.label ?? '按钮';
  button.layoutMode = 'HORIZONTAL';
  button.primaryAxisSizingMode = 'AUTO';
  button.counterAxisSizingMode = 'AUTO';
  button.paddingLeft = 16;
  button.paddingRight = 16;
  button.paddingTop = 12;
  button.paddingBottom = 12;
  button.itemSpacing = 8;
  button.cornerRadius = layer.cornerRadius ?? 12;
  button.layoutAlign = 'STRETCH';
  button.fills = [
    { type: 'SOLID', color: hexToRgb(layer.background || layer.color || '#111827') }
  ];

  const label = createTextNode({
    type: 'text',
    label: layer.label ?? '开始',
    color: '#FFFFFF',
    size: layer.size ?? 16,
    align: 'center'
  });

  button.appendChild(label);

  if (typeof layer.width === 'number') {
    button.counterAxisSizingMode = 'FIXED';
    button.resize(layer.width, button.height);
  }

  if (typeof layer.height === 'number') {
    button.primaryAxisSizingMode = 'FIXED';
    button.resize(button.width, layer.height);
  }

  return button;
}

function createInput(layer: LayerSpec): FrameNode {
  const input = figma.createFrame();
  input.name = layer.label ?? '输入框';
  input.layoutMode = 'HORIZONTAL';
  input.primaryAxisSizingMode = 'AUTO';
  input.counterAxisSizingMode = 'AUTO';
  input.paddingLeft = 12;
  input.paddingRight = 12;
  input.paddingTop = 10;
  input.paddingBottom = 10;
  input.itemSpacing = 8;
  input.cornerRadius = layer.cornerRadius ?? 10;
  input.layoutAlign = 'STRETCH';
  input.strokes = [{ type: 'SOLID', color: hexToRgb('#D1D5DB') }];
  input.strokeWeight = 1;
  input.fills = [{ type: 'SOLID', color: hexToRgb(layer.background || '#FFFFFF') }];

  const placeholder = createTextNode({
    type: 'text',
    label: layer.placeholder || layer.label || '请输入…',
    color: '#6B7280',
    size: layer.size ?? 14
  });

  input.appendChild(placeholder);

  if (typeof layer.width === 'number') {
    input.counterAxisSizingMode = 'FIXED';
    input.resize(layer.width, input.height);
  }

  if (typeof layer.height === 'number') {
    input.primaryAxisSizingMode = 'FIXED';
    input.resize(input.width, layer.height);
  }

  return input;
}

function createRectangle(layer: LayerSpec): RectangleNode {
  const rect = figma.createRectangle();
  rect.name = layer.label ?? '容器';
  rect.cornerRadius = layer.cornerRadius ?? 12;
  rect.layoutAlign = 'STRETCH';
  rect.resize(layer.width ?? 320, layer.height ?? 160);
  rect.fills = [
    { type: 'SOLID', color: hexToRgb(layer.background || layer.color || '#E5E7EB') }
  ];
  return rect;
}

function hexToRgb(hex: string): RGB {
  const sanitized = hex.replace('#', '');
  const full = sanitized.length === 3
    ? sanitized
        .split('')
        .map((char) => char + char)
        .join('')
    : sanitized;

  const value = parseInt(full.slice(0, 6), 16) || 0;

  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '未知错误';
}

function truncate(text: string, limit = 160): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}…`;
}

function sendStatus(state: StatusMessage['state'], message?: string) {
  const payload: StatusMessage = { type: 'status', state };
  if (message) payload.message = message;
  figma.ui.postMessage(payload);
}
