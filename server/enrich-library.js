const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 4000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'REDACTED_OPENAI_API_KEY';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.siliconflow.cn/v1';
const MODEL = process.env.OPENAI_MODEL || 'Qwen/Qwen3-30B-A3B-Thinking-2507';

app.post('/api/enrich-library', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY in .env' });
  }

  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) {
    return res.status(400).json({ error: 'items required' });
  }

  try {
    const prompt = buildPrompt(items);
    const completion = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]
      })
    });

    const raw = await completion.text();
    if (!completion.ok) {
      console.error('LLM error', completion.status, raw.slice(0, 200));
      return res.status(completion.status).json({ error: 'LLM error', detail: raw });
    }
    const data = JSON.parse(raw);
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(502).json({ error: 'Empty LLM response' });
    }
    const parsed = parseContent(content);
    return res.json({ items: parsed });
  } catch (error) {
    console.error('enrich failed', error);
    return res.status(500).json({ error: 'enrich failed', detail: String(error) });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`enrich-library server listening on http://localhost:${PORT}`);
});

const SYSTEM_PROMPT = `
You enrich UI components metadata. Respond with JSON only.
For each item: fill description (short Chinese/English ok), tags (3-8), supportedDataTypes (subset of: numeric, trend, alert, state, text, map, list), and optional slots.
Slots: only include if the text previews clearly map to label/value/unit/state/alert/listItem; keep slotName concise. Use nodeId from input.
Never change id or name. If unsure, leave fields empty.
`;

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

  return `Enrich these components:\n${lines.join('\n')}\nReturn JSON: {"items":[{"id":"","description":"","tags":[],"supportedDataTypes":[],"slots":[{"slotName":"","slotType":"","nodeId":"","dataType":""}]}]}`;
}

function parseContent(content) {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed?.items)) return parsed.items;
    if (Array.isArray(parsed)) return parsed;
    return [];
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
      } catch (_err) {
        return [];
      }
    }
    return [];
  }
}
