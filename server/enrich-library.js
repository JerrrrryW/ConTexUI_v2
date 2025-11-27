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
const MODEL = process.env.OPENAI_MODEL || 'Qwen/Qwen3-30B-A3B-Thinking-2507';
const PARSE_MODEL = process.env.PARSE_MODEL || MODEL;

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
  return `需求文档如下，请解析为结构化模型（阶段/角色/条件/信息项/页面与优先级）：
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
