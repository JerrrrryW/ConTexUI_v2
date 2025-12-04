const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '127.0.0.1';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'REDACTED_OPENAI_API_KEY';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.siliconflow.cn/v1';
const MODEL = process.env.OPENAI_MODEL || 'Qwen/Qwen3-235B-A22B-Instruct-2507';
const PARSE_MODEL = process.env.PARSE_MODEL || MODEL;
const RECO_MODEL = process.env.RECO_MODEL || MODEL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';

// -------- EXPERIMENTS (in-memory) --------
const experiments = [
  {
    id: 'exp-flight-dashboard',
    name: '航班态势仪表盘',
    description: '预设的航班态势需求模型与组件库示例，便于快速演示',
    requirement: {
      phases: [
        { id: 'phase-prep', name: '起飞前' },
        { id: 'phase-flight', name: '巡航中' }
      ],
      roles: [
        { id: 'role-captain', name: '机长' },
        { id: 'role-fo', name: '副驾驶' }
      ],
      conditions: [
        { id: 'cond-normal', name: '正常状态' },
        { id: 'cond-alert', name: '告警状态' }
      ],
      infoItems: [
        { id: 'info-alt', name: '当前高度', dataType: 'numeric', semanticTags: ['altitude'] },
        { id: 'info-speed', name: '对地速度', dataType: 'numeric', semanticTags: ['speed'] },
        { id: 'info-fuel', name: '剩余燃油', dataType: 'numeric', semanticTags: ['fuel'] },
        { id: 'info-weather', name: '前方天气', dataType: 'text', semanticTags: ['weather'] },
        { id: 'info-alerts', name: '系统告警', dataType: 'alert', semanticTags: ['alert'] }
      ],
      pages: [
        {
          id: 'page-overview',
          phaseId: 'phase-flight',
          roleId: 'role-captain',
          conditionId: 'cond-normal',
          name: '飞行态势总览',
          notes: '正常态的飞行关键指标总览',
          infoPriorities: [
            { infoItemId: 'info-alerts', priority: 1 },
            { infoItemId: 'info-speed', priority: 2 },
            { infoItemId: 'info-alt', priority: 3 },
            { infoItemId: 'info-fuel', priority: 4 },
            { infoItemId: 'info-weather', priority: 5 }
          ],
          preferredBindings: [
            { infoItemId: 'info-alerts', componentId: 'comp-alert-list' },
            { infoItemId: 'info-speed', componentId: 'comp-metric-speed' },
            { infoItemId: 'info-alt', componentId: 'comp-metric-alt' },
            { infoItemId: 'info-fuel', componentId: 'comp-metric-fuel' },
            { infoItemId: 'info-weather', componentId: 'comp-weather' }
          ]
        },
        {
          id: 'page-alert',
          phaseId: 'phase-flight',
          roleId: 'role-fo',
          conditionId: 'cond-alert',
          name: '告警应对面板',
          notes: '聚焦异常与分工的告警处理视图',
          infoPriorities: [
            { infoItemId: 'info-alerts', priority: 1 },
            { infoItemId: 'info-alt', priority: 2 },
            { infoItemId: 'info-speed', priority: 3 },
            { infoItemId: 'info-fuel', priority: 4 }
          ],
          preferredBindings: [
            { infoItemId: 'info-alerts', componentId: 'comp-alert-list' },
            { infoItemId: 'info-alt', componentId: 'comp-metric-alt' },
            { infoItemId: 'info-speed', componentId: 'comp-metric-speed' },
            { infoItemId: 'info-fuel', componentId: 'comp-metric-fuel' }
          ]
        }
      ],
      updatedAt: Date.now()
    },
    library: [
      {
        id: 'comp-metric-alt',
        nodeId: 'exp-node-alt',
        name: '高度指标卡片',
        width: 320,
        height: 180,
        primaryColor: '#0EA5E9',
        sampleText: '高度 12000 ft',
        description: '用于展示当前高度/爬升趋势的指标卡片',
        tags: ['altitude', 'status'],
        supportedDataTypes: ['numeric', 'text'],
        slots: [
          { slotName: 'title', slotType: 'label', nodeId: 'exp-node-alt-title', dataType: 'text' },
          { slotName: 'value', slotType: 'numericValue', nodeId: 'exp-node-alt-value', dataType: 'numeric' },
          { slotName: 'unit', slotType: 'unit', nodeId: 'exp-node-alt-unit', dataType: 'text' }
        ],
        lastUpdated: Date.now()
      },
      {
        id: 'comp-metric-speed',
        nodeId: 'exp-node-speed',
        name: '速度指标卡片',
        width: 320,
        height: 180,
        primaryColor: '#22C55E',
        sampleText: '速度 245 kts',
        description: '展示对地速度的指标卡片',
        tags: ['speed', 'status'],
        supportedDataTypes: ['numeric', 'trend'],
        slots: [
          { slotName: 'title', slotType: 'label', nodeId: 'exp-node-speed-title', dataType: 'text' },
          { slotName: 'value', slotType: 'numericValue', nodeId: 'exp-node-speed-value', dataType: 'numeric' },
          { slotName: 'unit', slotType: 'unit', nodeId: 'exp-node-speed-unit', dataType: 'text' }
        ],
        lastUpdated: Date.now()
      },
      {
        id: 'comp-metric-fuel',
        nodeId: 'exp-node-fuel',
        name: '燃油剩余卡片',
        width: 320,
        height: 180,
        primaryColor: '#F59E0B',
        sampleText: '燃油 65 %',
        description: '剩余燃油/续航时间的状态卡片',
        tags: ['fuel', 'status'],
        supportedDataTypes: ['numeric', 'state'],
        slots: [
          { slotName: 'title', slotType: 'label', nodeId: 'exp-node-fuel-title', dataType: 'text' },
          { slotName: 'value', slotType: 'numericValue', nodeId: 'exp-node-fuel-value', dataType: 'numeric' }
        ],
        lastUpdated: Date.now()
      },
      {
        id: 'comp-alert-list',
        nodeId: 'exp-node-alerts',
        name: '告警列表',
        width: 360,
        height: 220,
        primaryColor: '#EF4444',
        sampleText: 'APU Fault',
        description: '按照严重度排序的告警列表，带状态色',
        tags: ['alert', 'list'],
        supportedDataTypes: ['alert', 'list'],
        slots: [
          { slotName: 'item', slotType: 'listItem', nodeId: 'exp-node-alert-item', dataType: 'alert' }
        ],
        lastUpdated: Date.now()
      },
      {
        id: 'comp-weather',
        nodeId: 'exp-node-weather',
        name: '气象卡片',
        width: 360,
        height: 200,
        primaryColor: '#6366F1',
        sampleText: '前方 50km 小雨',
        description: '前方气象与能见度概览',
        tags: ['weather', 'text'],
        supportedDataTypes: ['text', 'state'],
        slots: [
          { slotName: 'title', slotType: 'label', nodeId: 'exp-node-weather-title', dataType: 'text' },
          { slotName: 'status', slotType: 'state', nodeId: 'exp-node-weather-state', dataType: 'state' }
        ],
        lastUpdated: Date.now()
      }
    ]
  }
];

// -------- EXPERIMENT ENDPOINTS --------
app.get('/api/experiments', (_req, res) => {
  try {
    const items = experiments.map(({ id, name, description }) => ({ id, name, description }));
    return res.json({ items });
  } catch (error) {
    console.error('[experiments] list failed', error);
    return res
      .status(500)
      .json({ error: 'experiments_list_failed', message: '无法加载实验场景列表' });
  }
});

app.get('/api/experiments/:id', (req, res) => {
  const { id } = req.params || {};
  try {
    const found = experiments.find((item) => item.id === id);
    if (!found) {
      console.warn('[experiments] not found', id);
      return res
        .status(404)
        .json({ error: 'experiment_not_found', message: '未找到对应实验场景' });
    }
    return res.json(found);
  } catch (error) {
    console.error('[experiments] detail failed', id, error);
    return res
      .status(500)
      .json({ error: 'experiments_detail_failed', message: '加载实验场景失败' });
  }
});

// -------- ENRICH LIBRARY --------
app.post('/api/enrich-library', async (req, res) => {
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Missing OPENAI_API_KEY in .env' });

  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: 'items required' });

  try {
    const prompt = buildPrompt(items);
    console.log('[enrich] items:', items.length);
    console.log('[enrich] prompt sample:', prompt.slice(0, 400));

    const completion = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: ENRICH_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]
      })
    });

    const raw = await completion.text();
    if (!completion.ok) {
      console.error('LLM enrich error', completion.status, raw.slice(0, 500));
      return res.status(completion.status).json({ error: 'LLM error', detail: raw });
    }
    console.log('[enrich] LLM raw:', raw.slice(0, 800));
    const data = JSON.parse(raw);
    const content = data.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: 'Empty LLM response' });
    const parsed = parseContent(content);
    return res.json({ items: parsed });
  } catch (error) {
    console.error('enrich failed', error);
    return res.status(500).json({ error: 'enrich failed', detail: String(error) });
  }
});

// -------- PARSE DOC --------
app.post('/api/parse-doc', async (req, res) => {
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Missing OPENAI_API_KEY in .env' });

  const docText = req.body?.docText;
  if (!docText || typeof docText !== 'string' || !docText.trim()) {
    return res.status(400).json({ error: 'docText required' });
  }

  try {
    const prompt = buildParsePrompt(docText);
    console.log('[parse-doc] prompt sample:', prompt.slice(0, 500));

    const completion = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: PARSE_MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: PARSE_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]
      })
    });

    const raw = await completion.text();
    if (!completion.ok) {
      console.error('parse-doc LLM error', completion.status, raw.slice(0, 500));
      return res.status(completion.status).json({ error: 'LLM error', detail: raw });
    }
    console.log('[parse-doc] LLM raw:', raw.slice(0, 800));
    const data = JSON.parse(raw);
    const content = data.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: 'Empty LLM response' });
    const parsed = parseContent(content);
    if (!parsed?.pages) {
      const fallback = buildFallbackModel(docText);
      return res.json(fallback);
    }
    return res.json(parsed);
  } catch (error) {
    console.error('parse-doc failed', error);
    const fallback = buildFallbackModel(docText);
    return res.status(200).json(fallback);
  }
});

// -------- RECOMMEND COMPONENTS --------
app.post('/api/recommend-components', async (req, res) => {
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Missing OPENAI_API_KEY in .env' });
  const infoItems = Array.isArray(req.body?.infoItems) ? req.body.infoItems : [];
  const library = Array.isArray(req.body?.library) ? req.body.library : [];
  if (!infoItems.length || !library.length) {
    return res.status(400).json({ error: 'infoItems and library required' });
  }

  try {
    const prompt = buildRecommendPrompt(infoItems, library);
    console.log('[recommend] infoItems:', infoItems.length, 'library:', library.length);
    const completion = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: RECO_MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: RECO_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]
      })
    });

    const raw = await completion.text();
    if (!completion.ok) {
      console.error('recommend LLM error', completion.status, raw.slice(0, 500));
      const fallback = buildRecommendFallback(infoItems, library);
      return res.status(200).json(fallback);
    }
    console.log('[recommend] LLM raw:', raw.slice(0, 800));
    const data = JSON.parse(raw);
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      const fallback = buildRecommendFallback(infoItems, library);
      return res.status(200).json(fallback);
    }
    const parsed = parseContent(content);
    return res.json({ bindings: parsed?.bindings || parsed || [] });
  } catch (error) {
    console.error('recommend failed', error);
    const fallback = buildRecommendFallback(infoItems, library);
    return res.status(200).json(fallback);
  }
});

// -------- EDIT PAGE (UI 自然语言编辑) --------
app.post('/api/edit-page', async (req, res) => {
  const userPrompt = req.body?.prompt;
  const frameSnapshot = req.body?.frameSnapshot;
  if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
    return res.status(400).json({ error: 'prompt required' });
  }
  if (!frameSnapshot || typeof frameSnapshot !== 'object') {
    return res.status(400).json({ error: 'frameSnapshot required' });
  }
  const provider = req.body?.provider || 'openai';
  const apiKey = req.body?.apiKey || (provider === 'gemini' ? GEMINI_API_KEY : OPENAI_API_KEY);
  const baseUrl = req.body?.baseUrl || OPENAI_BASE_URL;
  const model = req.body?.model || MODEL;

  if (!apiKey) return res.status(500).json({ error: 'Missing API key for provider' });

  const systemPrompt = buildEditOpsSystemPrompt();
  const prompt = buildEditOpsUserPrompt(userPrompt, frameSnapshot);

  try {
    console.log('[edit-page] provider:', provider, 'model:', model);
    console.log('[edit-page] frame snapshot nodes:', countNodes(frameSnapshot));
    console.log('[edit-page] prompt sample:', userPrompt.slice(0, 400));

    if (provider === 'gemini') {
      const geminiModel = req.body?.model || GEMINI_MODEL;
      const url = `${GEMINI_BASE_URL}/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const completion = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5 }
        })
      });
      const raw = await completion.text();
      console.log('[edit-page] gemini raw:', raw.slice(0, 800));
      if (!completion.ok) {
        return res.status(completion.status).json({ error: 'LLM error', detail: raw.slice(0, 800) });
      }
      const data = JSON.parse(raw);
      const contentText = (data.candidates || [])
        .flatMap((c) => c.content?.parts || [])
        .map((p) => p.text || '')
        .filter(Boolean)
        .join('');
      if (!contentText) return res.status(502).json({ error: 'Empty LLM response' });
      const parsed = parseContent(contentText);
      return res.json(parsed);
    }

    const completion = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    });
    const raw = await completion.text();
    console.log('[edit-page] raw:', raw.slice(0, 800));
    if (!completion.ok) {
      return res.status(completion.status).json({ error: 'LLM error', detail: raw.slice(0, 800) });
    }
    const data = JSON.parse(raw);
    const content = data.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: 'Empty LLM response' });
    const parsed = parseContent(content);
    return res.json(parsed);
  } catch (error) {
    console.error('edit-page failed', error);
    return res.status(500).json({ error: 'edit-page failed', detail: String(error) });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, HOST, () => {
  console.log(`enrich-library server listening on http://${HOST}:${PORT}`);
});

// -------- SYSTEM PROMPTS --------
const ENRICH_SYSTEM_PROMPT = `
You enrich UI components metadata. Respond with JSON only.
For each item: fill description (short Chinese/English ok), tags (3-8), supportedDataTypes (subset of: numeric, trend, alert, state, text, map, list), and optional slots.
Slots: only include if the text previews clearly map to label/value/unit/state/alert/listItem; keep slotName concise. Use nodeId from input.
Never change id or name. If unsure, leave fields empty.
`;

const PARSE_SYSTEM_PROMPT = `
You are a product design analyst. Extract a structured model for UI generation.
Respond with JSON only, following this shape:
{
  "phases": [{"id":"","name":"","description":""}],
  "roles": [{"id":"","name":"","description":""}],
  "conditions": [{"id":"","name":"","description":""}],
  "infoItems": [{"id":"","name":"","description":"","dataType":"numeric|trend|alert|state|text|map|list","semanticTags":[""]}],
  "pages": [{
    "id": "",
    "phaseId": "",
    "roleId": "",
    "conditionId": "",
    "name": "",
    "notes": "",
    "infoPriorities": [{"infoItemId":"","priority":1,"note":""}]
  }]
}
- IDs must be unique and stable strings (you can generate).
- Priorities start at 1, lower = higher priority.
- Keep names concise; descriptions 1-2 sentences.
- If something is missing, leave arrays empty.
`;

const RECO_SYSTEM_PROMPT = `
You match info items to UI components from a library. Respond with JSON only:
{"bindings":[{"infoItemId":"","componentId":"","slotHints":{}}]}
Rules:
- componentId must come from provided library.
- Prefer components whose supportedDataTypes or tags match infoItem dataType/semanticTags.
- If uncertain, leave componentId empty.
`;

function buildEditOpsSystemPrompt() {
  return `You are a UI diff planner. Given the current frame tree (with node IDs) and a natural language edit request, output JSON only with concrete operations to apply on the canvas.
Allowed operations (array "operations"):
- update: {"op":"update","targetId":"","props":{"name?":"","text?":"","fill?","#hex","x?":0,"y?":0,"width?":200,"height?":120,"visible?":true}}
- remove: {"op":"remove","targetId":""}
- reorder: {"op":"reorder","targetId":"","parentId?":"","insertIndex?":0}
- add-text: {"op":"add-text","parentId?":"","insertIndex?":0,"text?":"","fill?":"#111827","width?":140,"height?":32,"x?":0,"y?":0}
- add-rectangle: {"op":"add-rectangle","parentId?":"","insertIndex?":0,"fill?":"#E5E7EB","width?":200,"height?":120,"x?":0,"y?":0}
Rules:
- Use only existing node ids when updating/removing/reordering.
- Keep changes minimal and specific; avoid rewriting the whole tree.
- If unsure about a field, omit it.
Respond JSON only: {"operations":[...],"summary":"optional short summary"}.`;
}

function buildEditOpsUserPrompt(editRequest, frameSnapshot) {
  const snapshotText = JSON.stringify(frameSnapshot, null, 2);
  return `Current frame snapshot (id + children):
${snapshotText}

Edit request:
${editRequest}

Plan concrete operations (update/remove/reorder/add-text/add-rectangle) referencing node ids above. JSON only.`;
}

function countNodes(snapshot) {
  let count = 0;
  const walk = (node) => {
    count += 1;
    if (Array.isArray(node?.children)) {
      node.children.forEach(walk);
    }
  };
  walk(snapshot);
  return count;
}

// -------- HELPERS --------
function buildPrompt(items) {
  const lines = items.map((item) => {
    const texts = (item.textPreviews || [])
      .map((t) => `${t.id}:${t.name}:${t.preview || ''}`)
      .join('; ');
    const slots = (item.slots || [])
      .map((s) => `${s.slotName}:${s.slotType}:${s.nodeId}`)
      .join('; ');
    return `id:${item.id} | name:${item.name} | size:${Math.round(item.width)}x${Math.round(
      item.height
    )} | color:${item.primaryColor || ''} | sample:${item.sampleText || ''} | desc:${
      item.description || ''
    } | tags:${(item.tags || []).join(',')} | dataTypes:${(item.supportedDataTypes || []).join(
      ','
    )} | texts:${texts} | slots:${slots}`;
  });

  return `Enrich these components:\n${lines.join(
    '\n'
  )}\nReturn JSON: {"items":[{"id":"","description":"","tags":[],"supportedDataTypes":[],"slots":[{"slotName":"","slotType":"","nodeId":"","dataType":""}]}]}`;
}

function parseContent(content) {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed?.items)) return parsed.items;
    if (Array.isArray(parsed)) return parsed;
    return parsed;
  } catch (error) {
    console.warn('parseContent fallback', error);
    const first = content.indexOf('{');
    const last = content.lastIndexOf('}');
    if (first !== -1 && last !== -1) {
      try {
        const sliced = content.slice(first, last + 1);
        const parsed = JSON.parse(sliced);
        if (Array.isArray(parsed?.items)) return parsed.items;
        if (Array.isArray(parsed)) return parsed;
        return parsed;
      } catch (_err) {
        return [];
      }
    }
    return [];
  }
}

function buildParsePrompt(docText) {
  return `
  你是一名资深 UX 信息架构分析助手，专门从复杂的产品/设计需求文档中，抽取与“界面设计”相关的结构化信息。

本次任务中，需要你从「需求文档」中抽取 5 类实体：
- phases：任务阶段（Phase）
- roles：角色（Role）
- conditions：情境 / 条件（Condition）
- infoItems：信息项（InfoItem）
- pages：页面定义（PageDefinition）

其中这 3 类实体共同定义一个页面：
- phase：当前任务所处的阶段，例如“起飞前检查”“着陆阶段”
- role：使用界面的角色，例如“飞行员”“副驾驶员”
- condition：在该阶段 + 角色 下，界面设计需要特别区分的“情境 / 状态 / 触发条件”

请特别注意 **condition（情境）** 的定义和边界：

1. condition 是「在什么情况下」的描述  
   - 通常出现在文档中的“当……时 / 如果…… / 在……情况下 / 一旦……”等句式后面。  
   - 例如：“当飞行姿态出现异常时”，“在夜间着陆条件下”，“当自动驾驶失效时”。

2. condition 用来区分“同一阶段 + 同一角色下的不同情境页面”  
   - 同一个阶段 + 角色，可能在不同情境下需要不同界面：  
     - 例：着陆阶段 + 副驾驶员  
       - condition A：正常状态  
       - condition B：飞行姿态异常  
       - condition C：能见度极低  
   - 这些不同情境应该对应不同的 condition 条目，从而形成多个 pages。

3. condition 不用过于细碎的技术条件  
   - 像“俯仰角 > 10° 且高度 < 100m”这类细节，可以合并抽象为“飞行姿态异常”这一情境描述。  
   - 你可以在 condition.description 中补充这些细节，但 name 要保持简洁概括。

4. 当文档没有明确情境区分时  
   - 可以只抽取一个通用的 condition，例如：  
     - id: "cond_default"，name: "默认情境"  
   - 不要强行虚构复杂情境。

---

需求文档如下（仅作为解析依据）：
${docText}
请返回 JSON，仅使用上述字段。`;
}

function buildFallbackModel(docText) {
  const now = Date.now();
  const id = (name) => `${name}-${now}`;
  const phaseId = id('phase');
  const roleId = id('role');
  const conditionId = id('condition');
  const info1 = id('info-1');
  const info2 = id('info-2');
  return {
    phases: [{ id: phaseId, name: '默认阶段', description: '' }],
    roles: [{ id: roleId, name: '默认角色', description: '' }],
    conditions: [{ id: conditionId, name: '默认条件', description: '' }],
    infoItems: [
      { id: info1, name: '占位信息1', description: '', dataType: 'text', semanticTags: [] },
      { id: info2, name: '占位信息2', description: '', dataType: 'numeric', semanticTags: [] }
    ],
    pages: [
      {
        id: id('page'),
        phaseId,
        roleId,
        conditionId,
        name: '占位页面',
        notes: 'LLM 解析失败，使用兜底示例',
        infoPriorities: [
          { infoItemId: info1, priority: 1, note: '' },
          { infoItemId: info2, priority: 2, note: '' }
        ]
      }
    ],
    sourceSnippet: docText.slice(0, 500)
  };
}

function buildRecommendPrompt(infoItems, library) {
  const infos = infoItems
    .map(
      (i) =>
        `id:${i.id}|name:${i.name}|dataType:${i.dataType}|tags:${(i.semanticTags || []).join(',')}`
    )
    .join('\n');
  const comps = library
    .map(
      (c) =>
        `id:${c.id}|name:${c.name}|dataTypes:${(c.supportedDataTypes || []).join(
          ','
        )}|tags:${(c.tags || []).join(',')}`
    )
    .join('\n');
  return `Info items:\n${infos}\nComponents:\n${comps}\nReturn JSON with bindings array.`;
}

function buildRecommendFallback(infoItems, library) {
  const bindings = infoItems.map((info) => {
    const match =
      library.find((c) => c.supportedDataTypes?.includes(info.dataType)) || library[0] || {};
    return { infoItemId: info.id, componentId: match.id };
  });
  return { bindings };
}
