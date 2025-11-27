type Provider = 'openai' | 'siliconflow' | 'gemini';
type StatusMessage = {
  type: 'status';
  state: 'loading' | 'idle' | 'success' | 'error';
  message?: string;
};

type Phase = { id: string; name: string; description?: string };
type Role = { id: string; name: string; description?: string };
type Condition = { id: string; name: string; description?: string };
type DataType = 'numeric' | 'trend' | 'alert' | 'state' | 'text' | 'map' | 'list';

type InfoItem = {
  id: string;
  name: string;
  description?: string;
  dataType: DataType;
  semanticTags?: string[];
};

type PageInfoPriority = { infoItemId: string; priority: number; note?: string };

type PageDefinition = {
  id: string;
  phaseId: string;
  roleId: string;
  conditionId: string;
  name: string;
  infoPriorities: PageInfoPriority[];
  notes?: string;
};

type RequirementModel = {
  phases: Phase[];
  roles: Role[];
  conditions: Condition[];
  infoItems: InfoItem[];
  pages: PageDefinition[];
  updatedAt: number;
};

type ComponentSlotType = 'label' | 'numericValue' | 'unit' | 'state' | 'alert' | 'listItem';
type ComponentSlot = { slotName: string; nodeId: string; slotType: ComponentSlotType; dataType?: DataType };

type GenerateDesignMessage = {
  type: 'generate-design';
  prompt: string;
  apiKey: string;
  provider: Provider;
  useLibrary?: boolean;
};
type ImportMessage = { type: 'import-section' };
type RequestLibraryMessage = { type: 'request-library' };
type ExportLibraryMessage = { type: 'export-library' };
type ParseDocumentMessage = { type: 'parse-doc'; docText: string };
type RequestRequirementMessage = { type: 'request-requirement' };
type UpdateComponentMetaMessage = {
  type: 'update-component-meta';
  id: string;
  name?: string;
  description?: string;
  tags?: string[];
  supportedDataTypes?: DataType[];
};
type RequestSlotsMessage = { type: 'request-slots'; id: string };
type SaveSlotsMessage = { type: 'save-slots'; id: string; slots: ComponentSlot[] };
type EnrichLibraryMessage = { type: 'enrich-library' };
type UpdateNoteMessage = { type: 'update-note'; id: string; note: string };
type RemoveComponentMessage = { type: 'remove-component'; id: string };
type PluginMessage =
  | GenerateDesignMessage
  | ImportMessage
  | RequestLibraryMessage
  | ExportLibraryMessage
  | ParseDocumentMessage
  | RequestRequirementMessage
  | UpdateComponentMetaMessage
  | RequestSlotsMessage
  | SaveSlotsMessage
  | EnrichLibraryMessage
  | UpdateNoteMessage
  | RemoveComponentMessage;

type ComponentExample = {
  id: string;
  nodeId: string;
  sectionId?: string;
  name: string;
  width: number;
  height: number;
  primaryColor?: string;
  sampleText?: string;
  note?: string;
  description?: string;
  tags?: string[];
  supportedDataTypes?: DataType[];
  slots?: ComponentSlot[];
  lastUpdated?: number;
};

type LayerSpec = {
  type: 'text' | 'button' | 'input' | 'rectangle' | 'component';
  label?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  size?: number;
  color?: string;
  background?: string;
  align?: 'left' | 'center' | 'right';
  cornerRadius?: number;
  componentId?: string;
  componentName?: string;
  note?: string;
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
const FILE_KEY = figma.root?.id || 'figma-file';
const LIBRARY_KEY = `ctx:${FILE_KEY}:library`;
const REQUIREMENT_KEY = `ctx:${FILE_KEY}:requirement`;
const LAYOUT_KEY = `ctx:${FILE_KEY}:layouts`;
let componentLibrary: ComponentExample[] = [];
let requirementModel: RequirementModel | null = null;

figma.showUI(__html__, { width: 540, height: 720 });

initializeLibrary();
initializeRequirement();

figma.ui.onmessage = async (msg: PluginMessage) => {
  if (msg.type === 'import-section') {
    await importSelectedSection();
    return;
  }

  if (msg.type === 'request-library') {
    sendLibraryToUI();
    return;
  }

  if (msg.type === 'export-library') {
    exportLibrary();
    return;
  }

  if (msg.type === 'parse-doc') {
    await handleParseDocument(msg.docText);
    return;
  }

  if (msg.type === 'request-requirement') {
    sendRequirementToUI();
    return;
  }

  if (msg.type === 'update-component-meta') {
    await updateComponentMeta(msg);
    return;
  }

  if (msg.type === 'request-slots') {
    await sendSlots(msg.id);
    return;
  }

  if (msg.type === 'save-slots') {
    await saveSlots(msg.id, msg.slots);
    return;
  }

  if (msg.type === 'enrich-library') {
    await handleEnrichLibrary();
    return;
  }

  if (msg.type === 'update-note') {
    await updateNote(msg.id, msg.note);
    return;
  }

  if (msg.type === 'remove-component') {
    await removeComponent(msg.id);
    return;
  }

  if (msg.type !== 'generate-design') return;

  const prompt = msg.prompt?.trim();
  const apiKey = msg.apiKey?.trim();
  const provider: Provider = msg.provider || 'openai';
  const useLibrary = msg.useLibrary ?? false;

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
    const libraryContext = useLibrary ? buildLibraryContext(componentLibrary) : '';
    const spec = await fetchDesignSpec(prompt, apiKey, provider, libraryContext);
    await loadFonts();
    const componentMap = useLibrary ? await loadComponentNodes(spec.layers) : new Map();
    const frame = buildUiFromSpec(spec, componentMap);
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

async function initializeLibrary() {
  try {
    const saved = await figma.clientStorage.getAsync(LIBRARY_KEY);
    if (Array.isArray(saved)) {
      componentLibrary = saved as ComponentExample[];
    }
  } catch (_error) {
    componentLibrary = [];
  }
  sendLibraryToUI();
}

function sendLibraryToUI() {
  figma.ui.postMessage({ type: 'library', items: componentLibrary });
}

async function persistLibrary() {
  try {
    await figma.clientStorage.setAsync(LIBRARY_KEY, componentLibrary);
  } catch (_error) {
    // ignore storage errors
  }
  sendLibraryToUI();
}

async function importSelectedSection() {
  const selection = figma.currentPage.selection;
  const section = selection.find((node) => node.type === 'SECTION') as SectionNode | undefined;

  if (!section) {
    figma.notify('请先选中一个 Section');
    sendStatus('error', '请先选中一个 Section');
    return;
  }

  const frames = section.children.filter((child) => child.type === 'FRAME') as FrameNode[];

  if (!frames.length) {
    figma.notify('Section 下没有 Frame 可导入');
    return;
  }

  componentLibrary = frames.map(toComponentExample);
  await persistLibrary();
  figma.notify(`已导入 ${componentLibrary.length} 个组件`);
}

async function sendSlots(id: string) {
  const component = componentLibrary.find((item) => item.id === id);
  if (!component) return;
  const node = await figma.getNodeByIdAsync(component.nodeId);
  if (!node || !('children' in node)) {
    figma.notify('未找到组件节点');
    return;
  }

  const candidates = collectSlotCandidates(node as ChildrenMixin);
  figma.ui.postMessage({
    type: 'slots',
    componentId: id,
    candidates,
    slots: component.slots || []
  });
}

async function saveSlots(id: string, slots: ComponentSlot[]) {
  const component = componentLibrary.find((item) => item.id === id);
  if (!component) return;
  component.slots = slots;
  component.lastUpdated = Date.now();
  await persistLibrary();

  const node = await figma.getNodeByIdAsync(component.nodeId);
  if (node && 'setPluginData' in node) {
    try {
      (node as BaseNode & PluginDataMixin).setPluginData('slots', JSON.stringify(slots));
    } catch (_error) {
      // ignore plugin data errors
    }
  }

  figma.notify('已保存插槽配置');
}

async function handleEnrichLibrary() {
  if (!componentLibrary.length) {
    figma.notify('请先导入组件库');
    return;
  }

  try {
    sendStatus('loading', '正在生成组件元数据');
    const summaries = await buildLibrarySummaries();
    const result = await callEnrichLibrary(summaries);
    const applied = applyEnrichResult(result);
    await persistLibrary();
    sendLibraryToUI();
    figma.notify(`已应用 ${applied} 个组件的元数据推荐`);
    figma.ui.postMessage({ type: 'library-enriched', applied });
    sendStatus('success');
  } catch (error) {
    figma.notify(`生成失败：${getErrorMessage(error)}`);
    sendStatus('error', getErrorMessage(error));
  } finally {
    sendStatus('idle');
  }
}

async function updateNote(id: string, note: string) {
  const target = componentLibrary.find((item) => item.id === id);
  if (!target) return;
  target.note = note;
  await persistLibrary();
}

async function removeComponent(id: string) {
  const next = componentLibrary.filter((item) => item.id !== id);
  if (next.length === componentLibrary.length) return;
  componentLibrary = next;
  await persistLibrary();
}

async function updateComponentMeta(msg: UpdateComponentMetaMessage) {
  const target = componentLibrary.find((item) => item.id === msg.id);
  if (!target) return;
  if (typeof msg.name === 'string') target.name = msg.name;
  if (typeof msg.description === 'string') target.description = msg.description;
  if (Array.isArray(msg.tags)) target.tags = msg.tags;
  if (Array.isArray(msg.supportedDataTypes)) target.supportedDataTypes = msg.supportedDataTypes;
  target.lastUpdated = Date.now();
  await persistLibrary();
}

async function initializeRequirement() {
  try {
    const saved = await figma.clientStorage.getAsync(REQUIREMENT_KEY);
    if (saved && typeof saved === 'object') {
      requirementModel = saved as RequirementModel;
    }
  } catch (_error) {
    requirementModel = null;
  }
  sendRequirementToUI();
}

async function persistRequirement(model: RequirementModel) {
  requirementModel = model;
  try {
    await figma.clientStorage.setAsync(REQUIREMENT_KEY, requirementModel);
  } catch (_error) {
    // ignore storage errors
  }
}

function exportLibrary() {
  const payload = {
    exportedAt: Date.now(),
    count: componentLibrary.length,
    items: componentLibrary
  };
  figma.ui.postMessage({ type: 'library-export', data: payload });
}

function sendRequirementToUI() {
  figma.ui.postMessage({ type: 'requirement', data: requirementModel });
}

function toComponentExample(frame: FrameNode): ComponentExample {
  const texts = collectTexts(frame);
  return {
    id: frame.id,
    nodeId: frame.id,
    sectionId: frame.parent?.id,
    name: frame.name || '组件',
    width: frame.width,
    height: frame.height,
    primaryColor: getPrimaryFill(frame),
    sampleText: texts[0],
    note: '',
    description: '',
    tags: [],
    supportedDataTypes: [],
    slots: [],
    lastUpdated: Date.now()
  };
}

async function fetchDesignSpec(
  prompt: string,
  apiKey: string,
  provider: Provider,
  libraryContext: string
): Promise<UISpec> {
  if (provider === 'gemini') {
    return fetchGeminiSpec(prompt, apiKey, libraryContext);
  }

  const config = provider === 'openai' ? PROVIDERS.openai : PROVIDERS.siliconflow;
  return fetchOpenAICompatSpec(prompt, apiKey, config.baseUrl, config.model, libraryContext);
}

async function fetchOpenAICompatSpec(
  prompt: string,
  apiKey: string,
  baseUrl: string,
  model: string,
  libraryContext: string
): Promise<UISpec> {
  const systemPrompt = buildSystemPrompt(libraryContext);
  const userPrompt = prompt;

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
        { role: 'user', content: userPrompt }
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

async function fetchGeminiSpec(prompt: string, apiKey: string, libraryContext: string): Promise<UISpec> {
  const { baseUrl, model } = PROVIDERS.gemini;
  const systemPrompt = buildSystemPrompt(libraryContext);
  const userPrompt = prompt;

  const url = `${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
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

function buildSystemPrompt(libraryContext: string): string {
  if (!libraryContext) {
    return `You are a product designer who outputs compact JSON for a small layout (3-6 layers).
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
  }

  return `You are a layout planner who must ONLY place existing components from a library.
Library inventory (id, name, size, color, note, sample text):
${libraryContext}

Rules:
- Output 3-8 layers, type must be "component" only (no rectangles/text/buttons/inputs).
- Reuse components exactly as-is; do NOT change colors, sizing, or internal structure.
- You only decide which component to use, how many times, and layout order/stacking.
- If text copy needs to differ, keep the component unchanged and add a short "note" to describe the change (e.g., "标题改为 对地速度").
- Prefer componentId when referencing; include componentName too for clarity.
- Respond with JSON only, no Markdown.

Shape:
{
  "title": "screen name",
  "padding": 24,
  "spacing": 12,
  "layers": [
    { "type": "component", "componentId": "id-from-library", "componentName": "name", "note": "optional text tweak" }
  ]
}`;
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

function buildUiFromSpec(spec: UISpec, componentMap: Map<string, SceneNode>): FrameNode {
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
    const node = createLayerNode(layer, componentMap);
    frame.appendChild(node);
  });

  figma.currentPage.appendChild(frame);
  return frame;
}

function createLayerNode(layer: LayerSpec, componentMap: Map<string, SceneNode>): SceneNode {
  switch (layer.type) {
    case 'component':
      return createComponentNode(layer, componentMap);
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

function createComponentNode(layer: LayerSpec, componentMap: Map<string, SceneNode>): SceneNode {
  const sourceId =
    layer.componentId || findComponentIdByName(layer.componentName || layer.label || '');
  if (sourceId) {
    const source = componentMap.get(sourceId);
    if (source && 'clone' in source) {
      const clone = (source as SceneNode).clone();
      const name = layer.componentName || layer.label || clone.name;
      clone.name = layer.note ? `${name}【${layer.note}】` : name;
      if ('layoutAlign' in clone) {
        (clone as LayoutMixin).layoutAlign = 'STRETCH';
      }
      if ('x' in clone) {
        (clone as BaseNodeMixin & SceneNode).x = 0;
        (clone as BaseNodeMixin & SceneNode).y = 0;
      }
      return clone;
    }
  }

  const fallback = figma.createFrame();
  fallback.name = layer.componentName || layer.label || '组件占位';
  fallback.layoutMode = 'VERTICAL';
  fallback.primaryAxisSizingMode = 'AUTO';
  fallback.counterAxisSizingMode = 'AUTO';
  fallback.paddingLeft = 12;
  fallback.paddingRight = 12;
  fallback.paddingTop = 12;
  fallback.paddingBottom = 12;
  fallback.itemSpacing = 6;
  fallback.strokes = [{ type: 'SOLID', color: hexToRgb('#F59E0B') }];
  fallback.strokeWeight = 1;
  fallback.fills = [{ type: 'SOLID', color: hexToRgb('#FFF7ED') }];

  const title = createTextNode({
    type: 'text',
    label: `未找到组件: ${layer.componentName || layer.label || '未知'}`,
    color: '#9A3412',
    size: 12
  });

  const noteText = layer.note
    ? createTextNode({
        type: 'text',
        label: `备注: ${layer.note}`,
        color: '#9A3412',
        size: 11
      })
    : null;

  fallback.appendChild(title);
  if (noteText) fallback.appendChild(noteText);

  return fallback;
}

function collectTexts(node: SceneNode): string[] {
  const result: string[] = [];
  if (node.type === 'TEXT') {
    result.push((node as TextNode).characters);
  }
  if ('children' in node) {
    for (const child of (node as ChildrenMixin).children) {
      result.push(...collectTexts(child as SceneNode));
    }
  }
  return result;
}

function getPrimaryFill(node: FrameNode): string | undefined {
  const fills = Array.isArray(node.fills) ? (node.fills as Paint[]) : [];
  const solid = fills.find((paint) => paint.type === 'SOLID' && (paint as SolidPaint).visible !== false);
  if (solid && solid.type === 'SOLID') {
    return rgbToHex(solid.color);
  }
  return undefined;
}

function findComponentIdByName(name: string): string | undefined {
  if (!name) return undefined;
  const target = componentLibrary.find(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );
  return target?.id;
}

type SlotCandidate = { id: string; name: string; type: string; preview?: string };

function collectSlotCandidates(root: ChildrenMixin): SlotCandidate[] {
  const items: SlotCandidate[] = [];
  const walk = (node: SceneNode) => {
    if (node.type === 'TEXT') {
      items.push({
        id: node.id,
        name: node.name || 'Text',
        type: 'TEXT',
        preview: (node as TextNode).characters.slice(0, 20)
      });
    }
    if ('children' in node) {
      for (const child of (node as ChildrenMixin).children) {
        walk(child as SceneNode);
      }
    }
  };
  for (const child of root.children) {
    walk(child as SceneNode);
  }
  return items;
}

async function buildLibrarySummaries() {
  const summaries = await Promise.all(
    componentLibrary.map(async (comp) => {
      const node = await figma.getNodeByIdAsync(comp.nodeId);
      const textPreviews =
        node && 'children' in node ? collectSlotCandidates(node as ChildrenMixin) : [];
      return {
        id: comp.id,
        name: comp.name,
        primaryColor: comp.primaryColor,
        sampleText: comp.sampleText,
        description: comp.description,
        tags: comp.tags,
        supportedDataTypes: comp.supportedDataTypes,
        width: comp.width,
        height: comp.height,
        slots: comp.slots,
        textPreviews
      };
    })
  );
  return summaries;
}

function applyEnrichResult(result: EnrichLibraryResponse): number {
  if (!result?.items?.length) return 0;
  let applied = 0;
  const map = new Map(result.items.map((i) => [i.id, i]));
  componentLibrary = componentLibrary.map((comp) => {
    const rec = map.get(comp.id);
    if (!rec) return comp;
    applied += 1;
    return {
      ...comp,
      description: rec.description ?? comp.description,
      tags: mergeArrays(comp.tags, rec.tags),
      supportedDataTypes: rec.supportedDataTypes?.length
        ? Array.from(new Set(rec.supportedDataTypes))
        : comp.supportedDataTypes,
      slots: rec.slots?.length ? rec.slots : comp.slots,
      lastUpdated: Date.now()
    };
  });
  return applied;
}

function mergeArrays(a?: string[], b?: string[]): string[] | undefined {
  const merged = new Set<string>();
  (a || []).forEach((v) => merged.add(v));
  (b || []).forEach((v) => merged.add(v));
  return merged.size ? Array.from(merged) : undefined;
}

function buildLibraryContext(items: ComponentExample[]): string {
  if (!items.length) return '';
  return items
    .slice(0, 12)
    .map((item) => {
      const parts = [
        `id:${item.id}`,
        `名称:${item.name}`,
        `尺寸:${Math.round(item.width)}x${Math.round(item.height)}`
      ];
      if (item.primaryColor) parts.push(`主色:${item.primaryColor}`);
      if (item.sampleText) parts.push(`文案:${item.sampleText}`);
      if (item.note) parts.push(`备注:${item.note}`);
      return parts.join(' | ');
    })
    .join('\n');
}

async function loadComponentNodes(layers: LayerSpec[]): Promise<Map<string, SceneNode>> {
  const componentMap = new Map<string, SceneNode>();
  const ids = new Set<string>();

  layers.forEach((layer) => {
    if (layer.type !== 'component') return;
    if (layer.componentId) {
      ids.add(layer.componentId);
    } else {
      const found = findComponentIdByName(layer.componentName || layer.label || '');
      if (found) ids.add(found);
    }
  });

  const tasks = Array.from(ids).map(async (id) => {
    const node = await figma.getNodeByIdAsync(id);
    if (node && 'clone' in node) {
      componentMap.set(id, node as SceneNode);
    }
  });

  await Promise.all(tasks);
  return componentMap;
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

function rgbToHex(color: RGB | RGBA): string {
  const r = Math.max(0, Math.min(255, Math.round(color.r * 255)));
  const g = Math.max(0, Math.min(255, Math.round(color.g * 255)));
  const b = Math.max(0, Math.min(255, Math.round(color.b * 255)));
  const toHex = (v: number) => {
    const hex = v.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
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

// --- Backend stubs (to be wired to real endpoints) ---

type ParseDocResponse = RequirementModel;
type RecommendComponentsResponse = {
  bindings: { infoItemId: string; componentId: string; slotHints?: Record<string, string> }[];
};
type EnrichLibraryResponse = {
  items: {
    id: string;
    description?: string;
    tags?: string[];
    supportedDataTypes?: DataType[];
    slots?: ComponentSlot[];
  }[];
};

const API_BASE = 'http://localhost:4000';
const ENRICH_BASE = API_BASE;
const PARSE_BASE = API_BASE;

async function callParseDocument(docText: string): Promise<ParseDocResponse> {
  const response = await fetch(`${PARSE_BASE}/api/parse-doc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ docText, fileId: FILE_KEY })
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`解析失败 (${response.status}): ${raw.slice(0, 160)}`);
  }
  const data = JSON.parse(raw) as ParseDocResponse;
  await persistRequirement({ ...data, updatedAt: Date.now() });
  return data;
}

async function callRecommendComponents(
  infoItems: InfoItem[],
  library: ComponentExample[]
): Promise<RecommendComponentsResponse> {
  const response = await fetch('/api/recommend-components', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ infoItems, library })
  });
  if (!response.ok) {
    throw new Error(`组件推荐失败 (${response.status})`);
  }
  return (await response.json()) as RecommendComponentsResponse;
}

async function callEnrichLibrary(
  summaries: {
    id: string;
    name: string;
    primaryColor?: string;
    sampleText?: string;
    description?: string;
    tags?: string[];
    supportedDataTypes?: DataType[];
    width: number;
    height: number;
    slots?: ComponentSlot[];
    textPreviews?: SlotCandidate[];
  }[]
): Promise<EnrichLibraryResponse> {
  const response = await fetch(`${ENRICH_BASE}/api/enrich-library`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: FILE_KEY, items: summaries })
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`元数据生成失败 (${response.status}): ${raw.slice(0, 160)}`);
  }
  return JSON.parse(raw) as EnrichLibraryResponse;
}

async function handleParseDocument(docText: string) {
  if (!docText || !docText.trim()) {
    figma.notify('请输入需求文档文本');
    return;
  }
  try {
    sendStatus('loading', '正在解析文档');
    const model = await callParseDocument(docText);
    sendRequirementToUI();
    figma.notify('文档解析完成');
    sendStatus('success');
  } catch (error) {
    sendStatus('error', getErrorMessage(error));
    figma.notify(`解析失败：${getErrorMessage(error)}`);
  } finally {
    sendStatus('idle');
  }
}
