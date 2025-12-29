const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

// Load env from project root .env, then fallback to server/.env if still missing
dotenv.config();
if (!process.env.OPENAI_API_KEY) {
  dotenv.config({ path: path.join(__dirname, '.env') });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '127.0.0.1';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.siliconflow.cn/v1';
const MODEL = process.env.OPENAI_MODEL || 'Qwen/Qwen3-30B-A3B';
const PARSE_MODEL = process.env.PARSE_MODEL || MODEL;
const RECO_MODEL = process.env.RECO_MODEL || MODEL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';

const COMPONENT_LIB_PATH = path.join(__dirname, '..', 'data', 'component_lib.md');
const LLM_LOG_DIR = path.join(__dirname, 'llm_logs');
const TRACE_DIR = path.join(__dirname, 'traces');

function ensureLLMLogDir() {
  try {
    fs.mkdirSync(LLM_LOG_DIR, { recursive: true });
  } catch (error) {
    console.error('[llm] create log dir failed', error);
  }
}

ensureLLMLogDir();
function ensureTraceDir() {
  try {
    fs.mkdirSync(TRACE_DIR, { recursive: true });
  } catch (error) {
    console.error('[trace] create dir failed', error);
  }
}

ensureTraceDir();

function summarizeShape(obj) {
  if (obj === null || obj === undefined) return { type: typeof obj };
  if (typeof obj === 'string') return { type: 'string', length: obj.length };
  if (Array.isArray(obj)) return { type: 'array', length: obj.length };
  if (typeof obj === 'object') return { type: 'object', keys: Object.keys(obj), jsonSize: JSON.stringify(obj).length };
  return { type: typeof obj };
}

function logLLMInteraction(name, payload) {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      requestSummary: summarizeShape(payload.request),
      responseSummary: summarizeShape(payload.responseRaw),
      parsedPreview: payload.parsed ? JSON.stringify(payload.parsed).slice(0, 600) : undefined,
      error: payload.error ? String(payload.error) : undefined
    };
    const filePath = path.join(LLM_LOG_DIR, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf8');
    console.log(
      `[llm:${name}] req:${entry.requestSummary.type} size=${entry.requestSummary.jsonSize || entry.requestSummary.length || '-'} | res:${entry.responseSummary.type} size=${entry.responseSummary.jsonSize || entry.responseSummary.length || '-'}${entry.error ? ' | error:' + entry.error : ''}`
    );
  } catch (err) {
    console.error(`[llm:${name}] log failed`, err);
  }
}

function logAgent(agent, phase, detail) {
  console.log(`[agent:${agent}] ${phase} | ${detail}`);
}

function loadComponentLibFromFile() {
  try {
    const raw = fs.readFileSync(COMPONENT_LIB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.items)) return parsed.items;
    console.warn('[component-lib] parsed but missing items array');
    return [];
  } catch (error) {
    console.warn('[component-lib] load failed', error);
    return [];
  }
}

// -------- EXPERIMENTS --------
const experiments = require('../data/experiments');


// Sync production/safety experiment library with latest component_lib.md
const externalComponentLib = loadComponentLibFromFile();
if (externalComponentLib.length) {
  const prodExp = experiments.find((exp) => exp.id === 'exp-prod-safety-v1');
  if (prodExp) {
    prodExp.library = externalComponentLib;
    console.log(
      '[component-lib] injected file library into exp-prod-safety-v1, items:',
      externalComponentLib.length
    );
  } else {
    console.warn('[component-lib] exp-prod-safety-v1 not found; skip inject');
  }
}

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
    logAgent('enrich', 'request', `items=${items.length}`);

    const llmUrl = `${OPENAI_BASE_URL}/chat/completions`;
    const llmBody = {
      model: MODEL,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: ENRICH_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]
    };

    const completion = await fetch(llmUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify(llmBody)
    });

    const raw = await completion.text();
    if (!completion.ok) {
      console.error('LLM enrich error', completion.status);
      logLLMInteraction('enrich-library', {
        request: { url: llmUrl, body: llmBody },
        responseRaw: { length: raw.length },
        error: `status_${completion.status}`
      });
      return res.status(completion.status).json({ error: 'LLM error', detail: raw });
    }
    const data = JSON.parse(raw);
    const content = data.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: 'Empty LLM response' });
    const parsed = parseContent(content);
    const sourceById = new Map(items.map((item) => [item.id, item]));
    const withErgonomics = Array.isArray(parsed)
      ? parsed.map((item) => {
          const source = sourceById.get(item.id) || {};
          const ergonomics = computeErgonomicsFromComponent({ ...source, ...item });
          return { ...item, ergonomics };
        })
      : [];
    logLLMInteraction('enrich-library', {
      request: { url: llmUrl, body: llmBody },
      responseRaw: { length: raw.length },
      parsed: withErgonomics
    });
    logAgent('enrich', 'response', `items=${withErgonomics?.length || 0}`);
    return res.json({ items: withErgonomics });
  } catch (error) {
    console.error('enrich failed', error);
    return res.status(500).json({ error: 'enrich failed', detail: String(error) });
  }
});

// -------- PARSE DOC --------
app.post('/api/parse-doc', async (req, res) => {
  const docText = req.body?.docText;
  if (!docText || typeof docText !== 'string' || !docText.trim()) {
    return res.status(400).json({ error: 'docText required' });
  }

  try {
    const parsed = await runParseDocumentInternal(docText);
    const normalized = ensurePagePriorities(parsed);
    const completeness = ensureRequirementCompleteness(normalized.requirement);
    return res.json({ ...normalized.requirement, completeness });
  } catch (error) {
    console.error('parse-doc failed', error);
    const fallback = buildFallbackModel(docText);
    const normalized = ensurePagePriorities(fallback);
    const completeness = ensureRequirementCompleteness(normalized.requirement);
    return res.status(200).json({ ...normalized.requirement, completeness });
  }
});

// -------- RECOMMEND COMPONENTS --------
app.post('/api/recommend-components', async (req, res) => {
  const infoItems = Array.isArray(req.body?.infoItems) ? req.body.infoItems : [];
  const library = Array.isArray(req.body?.library) ? req.body.library : [];
  if (!infoItems.length || !library.length) {
    return res.status(400).json({ error: 'infoItems and library required' });
  }

  try {
    const stage1 = buildTwoStageCandidates(infoItems, library);
    const finalSelection = await runFinalSelectionWithLLM(stage1, infoItems);
    const bindings = infoItems.map((info) => {
      const chosen = (finalSelection.decisions || []).find((d) => d.infoItemId === info.id);
      if (chosen?.chosen) {
        return { infoItemId: info.id, componentId: chosen.chosen, slotHints: {} };
      }
      const first = (stage1.find((c) => c.infoItemId === info.id)?.candidates || [])[0];
      return { infoItemId: info.id, componentId: first?.componentId || '', slotHints: {} };
    });
    return res.json({
      bindings,
      meta: {
        stage1CandidateCount: stage1.reduce((acc, c) => acc + c.candidates.length, 0),
        usedLLM: finalSelection.usedLLM,
        llmError: finalSelection.error
      },
      stage1,
      stage2: finalSelection
    });
  } catch (error) {
    console.error('recommend failed', error);
    const fallback = buildRecommendFallback(infoItems, library);
    return res.status(200).json(fallback);
  }
});

// -------- ORCHESTRATED MULTI-AGENT RUN --------
app.post('/api/orchestrate-run', async (req, res) => {
  const docText = req.body?.docText;
  const library = Array.isArray(req.body?.library) ? req.body.library : [];
  const screenType = req.body?.screenType || 'dashboard';
  if (!docText || typeof docText !== 'string' || !docText.trim()) {
    return res.status(400).json({ error: 'docText required' });
  }
  try {
    const result = await orchestrateRun({ docText, library, screenType });
    return res.json(result);
  } catch (error) {
    console.error('[orchestrate-run] failed', error);
    return res.status(500).json({ error: 'orchestrate_failed', message: String(error) });
  }
});

app.get('/api/traces/:id', (req, res) => {
  const { id } = req.params || {};
  if (!id) return res.status(400).json({ error: 'trace_id_required' });
  const trace = loadTrace(id);
  if (!trace) return res.status(404).json({ error: 'trace_not_found' });
  return res.json(trace);
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
    logAgent('edit-page', 'request', `provider=${provider} model=${model} nodes=${countNodes(frameSnapshot)}`);

    if (provider === 'gemini') {
      const geminiModel = req.body?.model || GEMINI_MODEL;
      const url = `${GEMINI_BASE_URL}/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const llmBody = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5 }
      };
      const completion = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(llmBody)
      });
      const raw = await completion.text();
      if (!completion.ok) {
        logLLMInteraction('edit-page-gemini', {
          request: { url, body: llmBody, provider: 'gemini', model: geminiModel },
          responseRaw: { length: raw.length },
          error: `status_${completion.status}`
        });
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
      logLLMInteraction('edit-page-gemini', {
        request: { url, body: llmBody, provider: 'gemini', model: geminiModel },
        responseRaw: { length: raw.length },
        parsed
      });
      return res.json(parsed);
    }

    const llmUrl = `${baseUrl}/chat/completions`;
    const llmBody = {
      model,
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    };

    const completion = await fetch(llmUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(llmBody)
    });
    const raw = await completion.text();
    if (!completion.ok) {
      logLLMInteraction('edit-page-openai', {
        request: { url: llmUrl, body: llmBody, provider: 'openai', model },
        responseRaw: { length: raw.length },
        error: `status_${completion.status}`
      });
      return res.status(completion.status).json({ error: 'LLM error', detail: raw.slice(0, 800) });
    }
    const data = JSON.parse(raw);
    const content = data.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: 'Empty LLM response' });
    const parsed = parseContent(content);
    logLLMInteraction('edit-page-openai', {
      request: { url: llmUrl, body: llmBody, provider: 'openai', model },
      responseRaw: { length: raw.length },
      parsed
    });
    logAgent('edit-page', 'response', `ops=${Array.isArray(parsed?.operations) ? parsed.operations.length : 0}`);
    return res.json(parsed);
  } catch (error) {
    console.error('edit-page failed', error);
    return res.status(500).json({ error: 'edit-page failed', detail: String(error) });
  }
});

// -------- LAYOUT PLAN (LLM / heuristic stub) --------
app.post('/api/layout-plan', async (req, res) => {
  try {
    const page = req.body?.page;
    const requirement = req.body?.requirement;
    const library = Array.isArray(req.body?.library) ? req.body.library : [];
    const background = req.body?.background || {};
    const screenType = req.body?.screenType || 'dashboard';
    if (!page || !requirement) {
      return res.status(400).json({ error: 'page_and_requirement_required', message: '缺少页面或需求模型' });
    }

    const infoItems = Array.isArray(requirement?.infoItems) ? requirement.infoItems : [];
    const pages = Array.isArray(requirement?.pages) ? requirement.pages : [];
    const fullPage = pages.find((p) => p.id === page.id) || page;
    const result = await buildLayoutPlanWithLLM(fullPage, infoItems, library, screenType, background);
    return res.json({ plan: result.plan, usedLLM: result.usedLLM, warning: result.warning });
  } catch (error) {
    console.error('[layout-plan] failed', error);
    return res.status(500).json({ error: 'layout_plan_failed', message: '生成布局方案失败' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// -------- LAYOUT CLOSED-LOOP (评审+修正) --------
app.post('/api/layout-closed-loop', async (req, res) => {
  try {
    const requirement = req.body?.requirement;
    const library = Array.isArray(req.body?.library) ? req.body.library : [];
    const pageIds = Array.isArray(req.body?.pageIds) ? req.body.pageIds : [];
    const background = req.body?.background || {};
    const screenType = req.body?.screenType || 'dashboard';
    if (!requirement?.pages?.length || !requirement?.infoItems?.length) {
      return res.status(400).json({ error: 'requirement_required', message: '缺少需求模型' });
    }
    if (!library.length) {
      return res.status(400).json({ error: 'library_required', message: '缺少组件库' });
    }
    const targets = pageIds.length
      ? requirement.pages.filter((p) => pageIds.includes(p.id))
      : requirement.pages.slice(0, 1);
    if (!targets.length) {
      return res.status(400).json({ error: 'pages_required', message: '未找到页面' });
    }

    const trace = {
      id: randomUUID(),
      mode: 'layout-closed-loop',
      startedAt: new Date().toISOString(),
      agentOrder: ['initial-mapping', 'initial-layout', 'review', 'repair'],
      steps: [],
      pages: []
    };

    const plans = [];
    const finalPlans = [];
    const changeLogAll = [];
    const metricsBeforeAfter = [];
    const reviewSummary = [];

    for (const page of targets) {
      logAgent('layout-loop', 'initial-layout', `page=${page.id}`);
      const initialPlan = await buildLayoutPlanWithLLM(page, requirement.infoItems, library, screenType, background);
      const metricsBefore = computeLayoutMetrics(initialPlan.plan, page, requirement.infoItems, library);
      plans.push({ pageId: page.id, plan: initialPlan.plan });

      const review = runLayoutReview(initialPlan.plan, page, requirement, library);
      logAgent('layout-loop', 'review', `page=${page.id} issues=${review.issues.length}`);

      const repaired = applyLayoutRepair(initialPlan.plan, page, review, requirement, library);
      const metricsAfter = computeLayoutMetrics(repaired.plan, page, requirement.infoItems, library);
      finalPlans.push({ pageId: page.id, plan: repaired.plan });
      changeLogAll.push(...repaired.changeLog);
      metricsBeforeAfter.push({ pageId: page.id, before: metricsBefore, after: metricsAfter });
      reviewSummary.push({ pageId: page.id, summary: review.summary, issues: review.issues.slice(0, 5) });
    }

    trace.steps.push({
      agent: 'initial-mapping',
      summary: '绑定来自 requirement.preferredBindings 只读',
      pages: targets.map((p) => ({ id: p.id, bindings: summarizeBindings(p) }))
    });
    trace.steps.push({
      agent: 'initial-layout',
      summary: plans.map((p) => ({ pageId: p.pageId, plan: summarizePlan(p.plan) }))
    });
    trace.steps.push({
      agent: 'review',
      summary: reviewSummary
    });
    trace.steps.push({
      agent: 'repair',
      changeLog: changeLogAll,
      metrics: metricsBeforeAfter
    });
    const traceId = saveTrace(trace);

    logAgent('layout-loop', 'done', `pages=${targets.length} trace=${traceId}`);
    return res.json({
      traceId,
      initialPlans: plans,
      finalPlans,
      changeLog: changeLogAll,
      reviewSummary,
      metrics: metricsBeforeAfter
    });
  } catch (error) {
    console.error('[layout-closed-loop] failed', error);
    return res.status(500).json({ error: 'layout_closed_loop_failed', message: '闭环生成失败' });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`enrich-library server listening on http://${HOST}:${PORT}`);
  verifyOpenAIKeyOnStartup();
});

async function verifyOpenAIKeyOnStartup() {
  if (!OPENAI_API_KEY) {
    console.warn('[startup] OPENAI_API_KEY missing, skip LLM verification');
    return;
  }

  const llmUrl = `${OPENAI_BASE_URL}/chat/completions`;
  const llmBody = {
    model: 'Qwen/Qwen2-7B-Instruct',
    temperature: 0,
    messages: [
      { role: 'system', content: 'You are a lightweight health check.' },
      { role: 'user', content: '请简单回复“ok”。' }
    ]
  };

  try {
    console.log('[startup] verifying OPENAI_API_KEY with Qwen/Qwen2-7B-Instruct...');
    const completion = await fetch(llmUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify(llmBody)
    });
    const raw = await completion.text();
    if (!completion.ok) {
      console.error('[startup] LLM healthcheck failed', completion.status, raw.slice(0, 400));
      return;
    }
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.warn('[startup] LLM healthcheck response is not valid JSON');
      return;
    }
    const content = data.choices?.[0]?.message?.content || '';
    console.log('[startup] LLM healthcheck ok, len:', String(content).length);
  } catch (error) {
    console.error('[startup] LLM healthcheck exception', error);
  }
}

// -------- SYSTEM PROMPTS --------
const ENRICH_SYSTEM_PROMPT = `
You enrich UI components metadata for high-information-density monitoring/control UIs (dashboards, ops, alert handling). Respond with JSON only.
For each item, infer:
- description (short CN/EN ok), tags (3-8), supportedDataTypes (subset of: numeric, trend, alert, state, text, map, list)
- slots: only when clear mapping; keep slotName concise; use provided nodeId
- infoCategory: status|metric|trend|alert|navigation|context|control|composite
- taskStageAffinity: array of overview|monitoring|drilldown|investigation|recovery
- priorityAffinity: high|medium|low|flexible (prefer flexible when uncertain)
- criticalitySupport: good|limited|not-suitable
- visualFootprint: small|medium|large
- infoDensityProfile: sparse|normal|dense
- layoutRole: hero|summary|sidebar|toolbar|inline
- recommendedViewportZone: top-left|top|center|bottom|any
- recommendedMaxInstancesPerPage: integer or null
- dynamicBehavior: static|frequent-update|event-driven
- interactionSupport: string list (short, e.g., hover, drilldown)
Use size, layerStats, sample texts, and existing hints; if uncertain, use null/flexible/any/static.
Respond JSON only, shape:
{"items":[{"id":"","description":"","tags":[],"supportedDataTypes":[],"slots":[{"slotName":"","slotType":"","nodeId":"","dataType":""}],"infoCategory":null,"taskStageAffinity":[],"priorityAffinity":"flexible","criticalitySupport":null,"visualFootprint":null,"infoDensityProfile":null,"layoutRole":null,"recommendedViewportZone":null,"recommendedMaxInstancesPerPage":null,"dynamicBehavior":null,"interactionSupport":[]}]}
Never change id or name.
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

const LAYOUT_PLAN_SYSTEM_PROMPT = `
You are a layout strategist for high-density dashboards. Plan a full screen layout using provided info items, their priority, and a component library (with slots).
Output JSON only.
Rules:
- Keep screen size around 1920x1080 unless specified.
- Define 3-6 regions with semantic roles (hero, summary, sidebar, toolbar, main).
- Map EACH info item to a region and a componentId from library; prefer consistency per dataType.
- Use existing bindings/slot hints when provided; otherwise create slotBindings using title/value/unit/label.
- Layout fields x,y,width,height are ratios (0-1).
- Regions should not overlap; sums of widths/heights should fit within screen.
- componentDefaults: per dataType recommended componentId.
Respond with JSON only.`;

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
    const stats = item.layerStats || {};
    const statsText = `text=${stats.textNodeCount || 0},shape=${stats.shapeNodeCount || 0},depth=${stats.groupDepth || 1
      },auto=${stats.autoLayoutEnabled ? 'y' : 'n'},font=${stats.dominantFontSize || '-'},colors=${stats.colorChannelCount || 0
      }`;
    const metaHints = [
      item.infoCategory ? `infoCategory:${item.infoCategory}` : '',
      item.priorityAffinity ? `priority:${item.priorityAffinity}` : '',
      item.visualFootprint ? `footprint:${item.visualFootprint}` : '',
      item.infoDensityProfile ? `density:${item.infoDensityProfile}` : '',
      item.layoutRole ? `layout:${item.layoutRole}` : ''
    ]
      .filter(Boolean)
      .join(' | ');
    return `id:${item.id} | name:${item.name} | size:${Math.round(item.width)}x${Math.round(
      item.height
    )} | color:${item.primaryColor || ''} | sample:${item.sampleText || ''} | desc:${item.description || ''
      } | tags:${(item.tags || []).join(',')} | dataTypes:${(item.supportedDataTypes || []).join(
        ','
      )} | stats:${statsText} | texts:${texts} | slots:${slots} | meta:${metaHints}`;
  });

  return `Enrich these components:\n${lines.join(
    '\n'
  )}\nReturn JSON: {"items":[{"id":"","description":"","tags":[],"supportedDataTypes":[],"slots":[{"slotName":"","slotType":"","nodeId":"","dataType":""}],"infoCategory":null,"taskStageAffinity":[],"priorityAffinity":"flexible","criticalitySupport":null,"visualFootprint":null,"infoDensityProfile":null,"layoutRole":null,"recommendedViewportZone":null,"recommendedMaxInstancesPerPage":null,"dynamicBehavior":null,"interactionSupport":[]}]}`
    ;
}

async function buildLayoutPlanWithLLM(page, infoItems, library, screenType, background) {
  const stub = buildLayoutPlanHeuristic(page, infoItems, library, screenType, background);
  if (!OPENAI_API_KEY) {
    return { plan: stub, usedLLM: false, warning: 'missing api key, fallback to heuristic' };
  }
  try {
    const prompt = buildLayoutPlanPrompt(page, infoItems, library, screenType, background);
    const llmUrl = `${OPENAI_BASE_URL}/chat/completions`;
    const llmBody = {
      model: MODEL,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: LAYOUT_PLAN_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]
    };
    const completion = await fetch(llmUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify(llmBody)
    });
    const raw = await completion.text();
    if (!completion.ok) {
      console.error('[layout-plan] llm error', completion.status);
      logLLMInteraction('layout-plan', {
        request: { url: llmUrl, body: llmBody },
        responseRaw: { length: raw.length },
        error: `status_${completion.status}`
      });
      return { plan: stub, usedLLM: false, warning: 'llm_failed' };
    }
    const data = JSON.parse(raw);
    const content = data.choices?.[0]?.message?.content;
    const parsed = parseContent(content);
    if (parsed?.screen && Array.isArray(parsed?.regions)) {
      logLLMInteraction('layout-plan', {
        request: { url: llmUrl, body: llmBody },
        responseRaw: { length: raw.length },
        parsed
      });
      return { plan: parsed, usedLLM: true };
    }
    logLLMInteraction('layout-plan', {
      request: { url: llmUrl, body: llmBody },
      responseRaw: { length: raw.length },
      parsed: parsed || null,
      error: 'llm_parse_failed'
    });
    return { plan: stub, usedLLM: false, warning: 'llm_parse_failed' };
  } catch (error) {
    console.error('[layout-plan] llm failed', error);
    return { plan: stub, usedLLM: false, warning: 'llm_exception' };
  }
}

function buildLayoutPlanPrompt(page, infoItems, library, screenType, background) {
  const sorted = (page.infoPriorities || []).slice().sort((a, b) => a.priority - b.priority);
  const infoText = sorted
    .map((p, idx) => {
      const item = infoItems.find((i) => i.id === p.infoItemId) || {};
      return `${idx + 1}. ${item.name || p.infoItemId} | dataType:${item.dataType} | priority:${p.priority} | desc:${item.description || ''}`;
    })
    .join('\n');
  const libText = library
    .slice(0, 20)
    .map(
      (c) =>
        `id:${c.id}|name:${c.name}|dataTypes:${(c.supportedDataTypes || []).join(',')}|slots:${(c.slots || []).length}|infoCategory:${c.infoCategory || ''}|layoutRole:${c.layoutRole || ''}`
    )
    .join('\n');
  return `目标屏幕类型:${screenType}
背景节点:${background?.nodeId || '无'}
页面名称:${page.name}
优先级信息项(按序):\n${infoText}
组件库:\n${libText}
请输出JSON: {"screen":{"width":1920,"height":1080,"background":{"hint":"","nodeId":""}},"regions":[{"id":"","name":"","role":"","x":0,"y":0,"width":0.5,"height":0.5,"layout":"vertical|horizontal|grid","columns":2,"items":[{"infoItemId":"","componentId":"","slotBindings":[{"slotName":"","content":""}]}]}],"componentDefaults":{"numeric":"","trend":"","alert":"","state":"","text":""}}`;
}

function buildLayoutPlanHeuristic(page, infoItems, library, screenType, background) {
  const screenWidth = 1920;
  const screenHeight = 1080;
  const priorities = Array.isArray(page?.infoPriorities) ? page.infoPriorities.slice() : [];
  const bindingMap = new Map();
  (page?.preferredBindings || []).forEach((b) => {
    bindingMap.set(b.infoItemId, b);
  });

  const sorted = priorities.slice().sort((a, b) => a.priority - b.priority);
  const pickComponentForType = (dataType) => {
    const direct = library.find((c) => Array.isArray(c.supportedDataTypes) && c.supportedDataTypes.includes(dataType));
    if (direct) return direct.id;
    const fallback = library.find((c) => Array.isArray(c.supportedDataTypes) && c.supportedDataTypes.length);
    return fallback ? fallback.id : null;
  };

  const componentDefaults = {
    numeric: pickComponentForType('numeric'),
    trend: pickComponentForType('trend'),
    alert: pickComponentForType('alert'),
    state: pickComponentForType('state'),
    text: pickComponentForType('text')
  };

  const regions = [
    {
      id: 'region-left',
      name: '左侧指标区',
      role: 'summary',
      x: 0,
      y: 0,
      width: 0.28,
      height: 1,
      layout: 'vertical',
      columns: 1,
      items: []
    },
    {
      id: 'region-main',
      name: '主视图',
      role: 'hero',
      x: 0.28,
      y: 0,
      width: 0.54,
      height: 0.72,
      layout: 'grid',
      columns: 2,
      items: []
    },
    {
      id: 'region-right',
      name: '右侧状态区',
      role: 'sidebar',
      x: 0.82,
      y: 0,
      width: 0.18,
      height: 0.72,
      layout: 'vertical',
      columns: 1,
      items: []
    },
    {
      id: 'region-bottom',
      name: '底部入口区',
      role: 'toolbar',
      x: 0.28,
      y: 0.72,
      width: 0.72,
      height: 0.28,
      layout: 'horizontal',
      columns: 3,
      items: []
    }
  ];

  const slotTemplates = (info, compId) => {
    const item = infoItems.find((i) => i.id === info.infoItemId);
    const label = item?.name || info.infoItemId;
    const value =
      item?.dataType === 'numeric' || item?.dataType === 'trend'
        ? '123.4'
        : item?.dataType === 'alert'
        ? '3 条'
        : item?.dataType === 'state'
        ? '正常'
        : item?.description || label;
    return [
      { slotName: 'title', content: label },
      { slotName: 'label', content: label },
      { slotName: 'value', content: value },
      { slotName: 'numericValue', content: value },
      { slotName: 'unit', content: 'unit' }
    ].filter(Boolean);
  };

  const assign = (targetRegion, info, componentId) => {
    const binding = bindingMap.get(info.infoItemId);
    const slotHints = binding?.slotHints || null;
    const slots = slotHints
      ? Object.keys(slotHints).map((slotName) => ({ slotName, content: slotHints[slotName] }))
      : slotTemplates(info, componentId);
    targetRegion.items.push({
      infoItemId: info.infoItemId,
      componentId: componentId || binding?.componentId || componentDefaults[info.dataType] || null,
      slotBindings: slots
    });
  };

  sorted.forEach((info, idx) => {
    const item = infoItems.find((i) => i.id === info.infoItemId);
    const dataType = item?.dataType || 'text';
    const compId = pickComponentForType(dataType);
    const region = idx === 0 && regions[1] ? regions[1] : dataType === 'alert' ? regions[2] : regions[0];
    assign(region || regions[0], info, compId);
  });

  return {
    screen: {
      width: screenWidth,
      height: screenHeight,
      background: { required: screenType === 'hud', hint: screenType, nodeId: background?.nodeId }
    },
    screenType,
    regions,
    componentDefaults
  };
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

// -------- ORCHESTRATOR HELPERS --------
function summarizeLibrary(library = []) {
  return {
    count: Array.isArray(library) ? library.length : 0,
    ids: (library || []).slice(0, 5).map((c) => c.id)
  };
}

function clamp01(value) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function roundMetric(value) {
  return Number(clamp01(value).toFixed(2));
}

function computeErgonomicsFromComponent(comp = {}) {
  const stats = comp.layerStats || {};
  const slots = Array.isArray(comp.slots) ? comp.slots.length : 0;
  const area = Math.max(1, (comp.width || 0) * (comp.height || 0));
  const densitySignal =
    (stats.textNodeCount || 0) +
    (stats.shapeNodeCount || 0) * 0.6 +
    (stats.colorChannelCount || 0) * 0.8 +
    (stats.groupDepth || 1) * 0.4 +
    slots * 0.5;
  const vVis = roundMetric(densitySignal / Math.log(area + 10) / 6);

  const interactionCount = Array.isArray(comp.interactionSupport) ? comp.interactionSupport.length : 0;
  const interactionLoad = clamp01(interactionCount / 4);
  const fontScore = stats.dominantFontSize
    ? clamp01((stats.dominantFontSize - 10) / 10)
    : 0.5;
  const densityPenalty =
    comp.infoDensityProfile === 'dense' ? 0.8 : comp.infoDensityProfile === 'normal' ? 0.5 : 0.2;
  const vInt = roundMetric(0.4 * interactionLoad + 0.35 * densityPenalty + 0.25 * (1 - fontScore));

  const footprintPenalty = comp.visualFootprint === 'large' ? 0.4 : comp.visualFootprint === 'medium' ? 0.2 : 0;
  const densityBoost =
    comp.infoDensityProfile === 'dense' ? 0.4 : comp.infoDensityProfile === 'normal' ? 0.25 : 0.1;
  const slotBoost = Math.min(0.6, slots * 0.15);
  const maxInstanceBoost =
    typeof comp.recommendedMaxInstancesPerPage === 'number'
      ? clamp01(comp.recommendedMaxInstancesPerPage / 6) * 0.3
      : 0;
  const cap = roundMetric(densityBoost + slotBoost + maxInstanceBoost - footprintPenalty);

  return { vVis, vInt, cap };
}

function ensureRequirementCompleteness(model) {
  const missing = [];
  if (!model?.phases?.length) missing.push('phases');
  if (!model?.roles?.length) missing.push('roles');
  if (!model?.conditions?.length) missing.push('conditions');
  if (!model?.infoItems?.length) missing.push('infoItems');
  if (!model?.pages?.length) missing.push('pages');
  return { ok: missing.length === 0, missing };
}

function buildDefaultPriorities(infoItems = []) {
  const scored = (infoItems || []).map((info) => {
    const name = String(info.name || '').toLowerCase();
    const tags = (info.semanticTags || []).map((t) => String(t).toLowerCase());
    let score = 5;
    const isAlert =
      info.dataType === 'alert' ||
      tags.includes('alert') ||
      name.includes('告警') ||
      name.includes('报警') ||
      name.includes('风险') ||
      name.includes('安全') ||
      name.includes('异常');
    const isKpi =
      tags.includes('kpi') ||
      name.includes('kpi') ||
      name.includes('达标率') ||
      name.includes('完成率') ||
      name.includes('产量') ||
      name.includes('产能') ||
      name.includes('连续');
    if (isAlert) score -= 3;
    if (isKpi) score -= 1;
    if (info.dataType === 'trend') score += 0.5;
    if (info.dataType === 'text') score += 1.2;
    return { ...info, _score: score };
  });
  scored.sort((a, b) => a._score - b._score || String(a.name || '').localeCompare(String(b.name || '')));
  return scored.map((info, idx) => ({
    infoItemId: info.id,
    priority: idx + 1,
    note: info._score <= 3 ? 'auto: high-signal' : 'auto: default'
  }));
}

function ensurePagePriorities(requirement) {
  if (!requirement?.pages?.length || !requirement?.infoItems?.length) {
    return { requirement, filledPages: [] };
  }
  const defaultPriorities = buildDefaultPriorities(requirement.infoItems || []);
  const filledPages = [];
  const pages = requirement.pages.map((page) => {
    const existing = Array.isArray(page.infoPriorities) ? page.infoPriorities.slice() : [];
    const seen = new Set(existing.map((p) => p.infoItemId));
    let next = existing
      .filter((p) => p && p.infoItemId)
      .slice()
      .sort((a, b) => a.priority - b.priority);
    if (!next.length) {
      filledPages.push(page.id);
      next = defaultPriorities.map((p) => ({ ...p }));
    } else {
      defaultPriorities.forEach((p) => {
        if (!seen.has(p.infoItemId)) next.push({ ...p });
      });
    }
    next = next.map((p, idx) => ({ ...p, priority: idx + 1 }));
    return { ...page, infoPriorities: next };
  });
  return { requirement: { ...requirement, pages }, filledPages };
}

function saveTrace(trace) {
  const id = trace?.id || randomUUID();
  const payload = { ...trace, id };
  const file = path.join(TRACE_DIR, `${id}.json`);
  try {
    fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
  } catch (error) {
    console.error('[trace] save failed', error);
  }
  return id;
}

function loadTrace(id) {
  if (!id) return null;
  const file = path.join(TRACE_DIR, `${id}.json`);
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function createSeededRandom(seed) {
  let value = seed || 1;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function perturbPriorities(priorities, rand) {
  const base = Array.isArray(priorities)
    ? priorities.slice().sort((a, b) => a.priority - b.priority).map((p) => ({ ...p }))
    : [];
  if (base.length <= 1) return base;
  const swapCount = Math.max(1, Math.min(base.length - 1, Math.floor(rand() * 3) + 1));
  for (let i = 0; i < swapCount; i += 1) {
    const a = Math.floor(rand() * base.length);
    let b = Math.floor(rand() * base.length);
    if (a === b) b = (b + 1) % base.length;
    const temp = base[a];
    base[a] = base[b];
    base[b] = temp;
  }
  return base.map((p, index) => ({ ...p, priority: index + 1 }));
}

const OBJECTIVE_KEYS = ['density', 'overload', 'semanticRisk', 'instability', 'readabilityRisk'];

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function hasSemanticSignal(text, signals) {
  return signals.some((sig) => text.includes(sig));
}

function evaluateSemanticFit(candidate, infoItems, baseline) {
  const priorityMap = new Map(candidate.map((p) => [p.infoItemId, p.priority]));
  const baseMap = new Map((baseline || []).map((p) => [p.infoItemId, p.priority]));
  const mustKeep = [];
  const risks = [];
  let riskScore = 0;

  (infoItems || []).forEach((info) => {
    const tags = (info.semanticTags || []).map((t) => normalizeText(t));
    const name = normalizeText(info.name || '');
    const priority = priorityMap.get(info.id) ?? 99;
    const basePriority = baseMap.get(info.id);
    const isAlert =
      info.dataType === 'alert' ||
      tags.includes('alert') ||
      hasSemanticSignal(name, ['告警', '报警', '预警', '异常', '故障', '安全', '风险', '消防', '环保']);
    const isKpi =
      tags.includes('kpi') ||
      hasSemanticSignal(name, ['kpi', '指标', '达标率', '完成率', '连续', '效率']);
    if (isAlert) {
      mustKeep.push({ id: info.id, name: info.name || info.id, reason: '安全/告警类信息' });
      if (priority > 2) {
        risks.push({
          id: info.id,
          name: info.name || info.id,
          reason: `优先级降至 ${priority}，应保持在前两级`
        });
        riskScore += 2;
      }
    } else if (isKpi && priority > 4) {
      risks.push({
        id: info.id,
        name: info.name || info.id,
        reason: `核心 KPI 优先级 ${priority}，建议保留在中高优先级`
      });
      riskScore += 1;
    }
    if (typeof basePriority === 'number' && priority - basePriority >= 3) {
      risks.push({
        id: info.id,
        name: info.name || info.id,
        reason: `相对基线下调 ${priority - basePriority} 级`
      });
      riskScore += 0.5;
    }
  });

  return {
    satisfied: risks.length === 0,
    mustKeep,
    risks,
    riskScore: Number(riskScore.toFixed(2)),
    summary: risks.length
      ? `存在 ${risks.length} 项语义风险`
      : '满足关键语义要求'
  };
}

function scoreCandidate(candidate, infoItems, baseline) {
  const baseMap = new Map((baseline || []).map((p) => [p.infoItemId, p.priority]));
  const semantic = evaluateSemanticFit(candidate, infoItems, baseline);
  let overload = 0;
  let density = 0;
  let instability = 0;
  let readabilityRisk = 0;

  candidate.forEach((p) => {
    density += p.priority;
    if (p.priority <= 3) overload += 0.5;
    if (p.priority <= 5) overload += 0.2;
    const base = baseMap.get(p.infoItemId);
    if (typeof base === 'number') {
      instability += Math.abs(p.priority - base);
    }
  });

  const total = Math.max(1, candidate.length);
  const topCount = candidate.filter((p) => p.priority <= 3).length;
  const midCount = candidate.filter((p) => p.priority <= 5).length;
  readabilityRisk =
    (topCount * 0.6 + midCount * 0.3 + Math.max(0, total - midCount) * 0.1) / total;

  const objectives = {
    density: Number((density / total).toFixed(2)),
    overload: Number(overload.toFixed(2)),
    semanticRisk: semantic.riskScore,
    instability: Number((instability / Math.max(1, total)).toFixed(2)),
    readabilityRisk: Number(readabilityRisk.toFixed(2))
  };
  return { objectives, semantic };
}

function nonDominatedSort(population) {
  const fronts = [[]];
  population.forEach((p) => {
    p.dominationCount = 0;
    p.dominatedSet = [];
    population.forEach((q) => {
      if (p === q) return;
      const dominates =
        OBJECTIVE_KEYS.every((key) => p.objectives[key] <= q.objectives[key]) &&
        OBJECTIVE_KEYS.some((key) => p.objectives[key] < q.objectives[key]);
      const dominatedBy =
        OBJECTIVE_KEYS.every((key) => q.objectives[key] <= p.objectives[key]) &&
        OBJECTIVE_KEYS.some((key) => q.objectives[key] < p.objectives[key]);
      if (dominates) p.dominatedSet.push(q);
      else if (dominatedBy) p.dominationCount += 1;
    });
    if (p.dominationCount === 0) {
      p.rank = 1;
      fronts[0].push(p);
    }
  });

  let i = 0;
  while (fronts[i]?.length) {
    const next = [];
    fronts[i].forEach((p) => {
      p.dominatedSet.forEach((q) => {
        q.dominationCount -= 1;
        if (q.dominationCount === 0) {
          q.rank = i + 2;
          next.push(q);
        }
      });
    });
    if (next.length) fronts.push(next);
    i += 1;
  }
  return fronts.filter((f) => f.length);
}

function assignCrowdingDistance(front) {
  if (!front.length) return;
  OBJECTIVE_KEYS.forEach((key) => {
    front.sort((a, b) => a.objectives[key] - b.objectives[key]);
    front[0].crowding = front[front.length - 1].crowding = Infinity;
    const min = front[0].objectives[key];
    const max = front[front.length - 1].objectives[key];
    if (max === min) return;
    for (let i = 1; i < front.length - 1; i += 1) {
      const prev = front[i - 1].objectives[key];
      const next = front[i + 1].objectives[key];
      const distance = (next - prev) / (max - min);
      front[i].crowding = (front[i].crowding || 0) + distance;
    }
  });
}

function selectBestCandidate(fronts) {
  if (!fronts.length) return null;
  const first = fronts[0];
  assignCrowdingDistance(first);
  const sorted = first
    .slice()
    .sort((a, b) => {
      if ((b.crowding || 0) !== (a.crowding || 0)) return (b.crowding || 0) - (a.crowding || 0);
      if (a.objectives.semanticRisk !== b.objectives.semanticRisk) {
        return a.objectives.semanticRisk - b.objectives.semanticRisk;
      }
      if (a.objectives.overload !== b.objectives.overload) return a.objectives.overload - b.objectives.overload;
      if (a.objectives.readabilityRisk !== b.objectives.readabilityRisk) {
        return a.objectives.readabilityRisk - b.objectives.readabilityRisk;
      }
      if (a.objectives.instability !== b.objectives.instability) {
        return a.objectives.instability - b.objectives.instability;
      }
      return a.objectives.density - b.objectives.density;
    });
  return sorted[0];
}

function buildSelectionReason(winner, candidates = []) {
  if (!winner) return '无可用候选';
  if (!candidates.length) return '候选数量不足，选择当前最优方案';
  const labels = {
    semanticRisk: '语义风险',
    overload: '超载',
    density: '密度',
    instability: '稳定性变化',
    readabilityRisk: '可读性风险'
  };
  const highlights = [];
  Object.keys(labels).forEach((key) => {
    const sorted = candidates.slice().sort((a, b) => a.objectives[key] - b.objectives[key]);
    const rank = sorted.findIndex((c) => c.id === winner.id) + 1;
    if (rank > 0 && rank <= 2) highlights.push(labels[key]);
  });
  const prefix = highlights.length
    ? `在${highlights.join('、')}指标上排名靠前`
    : '综合帕累托最优';
  const semanticNote = winner.semantic?.summary ? `；语义评估：${winner.semantic.summary}` : '';
  return `${prefix}${semanticNote}`;
}

function runNsgaForPage(page, infoItems) {
  const seed = Math.abs(page.id?.length || page.infoPriorities?.length || 7) + 1;
  const rand = createSeededRandom(seed);
  const base = Array.isArray(page.infoPriorities) ? page.infoPriorities.slice() : [];
  const populationSize = Math.max(4, Math.min(10, base.length + 2));
  let population = [];
  for (let i = 0; i < populationSize; i += 1) {
    const mutated = perturbPriorities(base, rand);
    population.push(mutated);
  }

  const iterations = [];
  for (let gen = 1; gen <= 3; gen += 1) {
    const scored = population.map((candidate, idx) => {
      const { objectives, semantic } = scoreCandidate(candidate, infoItems, base);
      return {
        id: `cand-${gen}-${idx + 1}`,
        candidate,
        objectives,
        semantic,
        rank: null,
        crowding: 0
      };
    });
    const fronts = nonDominatedSort(scored);
    const best = selectBestCandidate(fronts);
    iterations.push({
      round: gen,
      candidates: scored.map((c) => ({
        id: c.id,
        objectives: c.objectives,
        semantic: c.semantic,
        rank: c.rank,
        crowding: Number((c.crowding || 0).toFixed(3))
      })),
      best: best
        ? { id: best.id, objectives: best.objectives, semantic: best.semantic, rank: best.rank, crowding: best.crowding }
        : null
    });
    const survivors = [];
    fronts.forEach((front) => {
      assignCrowdingDistance(front);
      front
        .sort((a, b) => {
          if (a.rank !== b.rank) return a.rank - b.rank;
          return (b.crowding || 0) - (a.crowding || 0);
        })
        .forEach((c) => survivors.push(c));
    });
    population = survivors.slice(0, populationSize).map((c) => c.candidate);
  }
  const finalScores = population.map((candidate, idx) => {
    const { objectives, semantic } = scoreCandidate(candidate, infoItems, base);
    return { id: `final-${idx + 1}`, candidate, objectives, semantic, rank: 1, crowding: 0 };
  });
  const finalFronts = nonDominatedSort(finalScores);
  const winner = selectBestCandidate(finalFronts) || finalScores[0];
  return { winner, iterations, finalCandidates: finalScores };
}

function computeLayoutMetrics(plan, page, infoItems, library) {
  const regionCrowding = Math.max(
    0,
    ...(plan.regions || []).map((r) => (Array.isArray(r.items) ? r.items.length : 0))
  );
  const infoMap = new Map();
  (infoItems || []).forEach((i) => infoMap.set(i.id, i));
  const priorityMap = new Map();
  (page.infoPriorities || []).forEach((p) => priorityMap.set(p.infoItemId, p.priority));
  const libraryMap = new Map();
  (library || []).forEach((c) => libraryMap.set(c.id, c));
  let overloadCount = 0;
  let mismatchCount = 0;
  (plan.regions || []).forEach((region) => {
    (region.items || []).forEach((item) => {
      const priority = priorityMap.get(item.infoItemId) || 99;
      if (priority <= 3 && region.role !== 'hero' && region.role !== 'summary') overloadCount += 1;
      const info = infoMap.get(item.infoItemId);
      const comp = item.componentId ? libraryMap.get(item.componentId) : null;
      if (info?.dataType === 'alert' && region.role === 'sidebar') mismatchCount += 1;
      if (!item.componentId) mismatchCount += 1;
      if (info?.dataType && comp?.supportedDataTypes && !comp.supportedDataTypes.includes(info.dataType)) {
        mismatchCount += 1;
      }
    });
  });
  return {
    regionCrowding,
    overloadCount,
    mismatchCount
  };
}

function summarizePlan(plan) {
  return {
    regionCount: (plan.regions || []).length,
    items: (plan.regions || []).reduce((acc, r) => acc + (r.items || []).length, 0),
    hero: (plan.regions || []).find((r) => r.role === 'hero')?.items?.length || 0
  };
}

function summarizeBindings(page) {
  const bindings = page.preferredBindings || [];
  return bindings.map((b) => ({
    infoItemId: b.infoItemId,
    componentId: b.componentId || null
  }));
}

function buildTwoStageCandidates(infoItems, library) {
  const results = [];
  infoItems.forEach((info) => {
    const scored = (library || []).map((comp) => {
      const dataTypeScore = comp.supportedDataTypes?.includes(info.dataType) ? 3 : 0;
      const tagOverlap = (info.semanticTags || []).filter((t) => (comp.tags || []).includes(t));
      const tagScore = tagOverlap.length ? 2 + tagOverlap.length * 0.5 : 0;
      const densityScore = comp.infoDensityProfile === 'dense' ? 1 : comp.infoDensityProfile === 'normal' ? 0.5 : 0;
      const priorityScore = comp.priorityAffinity === 'high' ? 1 : 0;
      const ergonomics = comp.ergonomics || computeErgonomicsFromComponent(comp);
      const vVisScore = typeof ergonomics?.vVis === 'number' ? (1 - ergonomics.vVis) * 0.8 : 0;
      const vIntScore = typeof ergonomics?.vInt === 'number' ? (1 - ergonomics.vInt) * 0.6 : 0;
      const capScore = typeof ergonomics?.cap === 'number' ? ergonomics.cap * 0.8 : 0;
      const total = dataTypeScore + tagScore + densityScore + priorityScore + vVisScore + vIntScore + capScore;
      const reasons = [];
      if (dataTypeScore) reasons.push('数据类型匹配');
      if (tagScore) reasons.push(`语义标签 ${tagOverlap.join('/')}`);
      if (densityScore) reasons.push('信息密度适配');
      if (priorityScore) reasons.push('高优先级适配');
      if (ergonomics?.vVis <= 0.35) reasons.push('低视觉复杂度');
      if (ergonomics?.vInt <= 0.35) reasons.push('交互负担低');
      if (ergonomics?.cap >= 0.6) reasons.push('承载能力强');
      return { componentId: comp.id, score: Number(total.toFixed(2)), reasons, name: comp.name, ergonomics };
    });
    scored.sort((a, b) => b.score - a.score);
    results.push({ infoItemId: info.id, candidates: scored.slice(0, 5) });
  });
  return results;
}

async function runFinalSelectionWithLLM(candidatesByInfo, infoItems) {
  if (!OPENAI_API_KEY) {
    return {
      decisions: candidatesByInfo.map((c) => ({
        infoItemId: c.infoItemId,
        chosen: c.candidates[0]?.componentId || '',
        reason: c.candidates[0] ? `基于候选分数 ${c.candidates[0].score}` : '无候选'
      })),
      usedLLM: false
    };
  }
  const prompt = candidatesByInfo
    .map((c) => {
      const info = infoItems.find((i) => i.id === c.infoItemId);
      const list = c.candidates
        .map((cand, idx) => `${idx + 1}. ${cand.componentId} (${cand.name || ''}) · 分数:${cand.score} · 理由:${cand.reasons.join(';')}`)
        .join('\n');
      return `信息项 ${info?.name || info?.id || c.infoItemId} 候选：\n${list}\n请选择最合适的组件ID，理由简述。`;
    })
    .join('\n---\n');

  const llmUrl = `${OPENAI_BASE_URL}/chat/completions`;
  const llmBody = {
    model: MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: '你是 UI 组件裁决 Agent，根据候选分数与语义，输出 {"decisions":[{"infoItemId":"","chosen":"","reason":""}]}' },
      { role: 'user', content: prompt }
    ]
  };
  try {
    const completion = await fetch(llmUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify(llmBody)
    });
    const raw = await completion.text();
    if (!completion.ok) {
      logLLMInteraction('retrieval-final', { request: { url: llmUrl, body: llmBody }, responseRaw: { length: raw.length }, error: `status_${completion.status}` });
      return {
        decisions: candidatesByInfo.map((c) => ({
          infoItemId: c.infoItemId,
          chosen: c.candidates[0]?.componentId || '',
          reason: c.candidates[0] ? `基于候选分数 ${c.candidates[0].score}` : '无候选'
        })),
        usedLLM: false,
        error: `status_${completion.status}`
      };
    }
    const data = JSON.parse(raw);
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = parseContent(content);
    const decisions = Array.isArray(parsed?.decisions) ? parsed.decisions : [];
    return { decisions, usedLLM: true, llmPreview: raw.slice(0, 400) };
  } catch (error) {
    console.error('[retrieval-final] llm failed', error);
    return {
      decisions: candidatesByInfo.map((c) => ({
        infoItemId: c.infoItemId,
        chosen: c.candidates[0]?.componentId || '',
        reason: c.candidates[0] ? `基于候选分数 ${c.candidates[0].score}` : '无候选'
      })),
      usedLLM: false,
      error: String(error)
    };
  }
}

function runLayoutReview(plan, page, requirement, library) {
  const infoMap = new Map();
  (requirement.infoItems || []).forEach((i) => infoMap.set(i.id, i));
  const priorityMap = new Map();
  (page.infoPriorities || []).forEach((p) => priorityMap.set(p.infoItemId, p.priority));
  const libraryMap = new Map();
  (library || []).forEach((c) => libraryMap.set(c.id, c));

  const issues = [];
  (plan.regions || []).forEach((region) => {
    const items = region.items || [];
    if (items.length > 6) {
      issues.push({
        type: 'usability',
        severity: 'medium',
        message: `区域 ${region.name || region.id} 过于拥挤（${items.length} 项）`,
        suggestion: { type: 'reflow-region', regionId: region.id }
      });
    }
    items.forEach((item) => {
      const info = infoMap.get(item.infoItemId);
      const comp = item.componentId ? libraryMap.get(item.componentId) : null;
      const priority = priorityMap.get(item.infoItemId) || 99;
      if (priority <= 3 && region.role !== 'hero' && region.role !== 'summary') {
        issues.push({
          type: 'semantic',
          severity: 'high',
          infoItemId: item.infoItemId,
          regionId: region.id,
          message: `高优先级信息 ${info?.name || item.infoItemId} 未突出展示`,
          suggestion: { type: 'promote', infoItemId: item.infoItemId }
        });
      }
      if (!item.componentId) {
        issues.push({
          type: 'ergonomics',
          severity: 'medium',
          infoItemId: item.infoItemId,
          message: `信息 ${info?.name || item.infoItemId} 缺少组件绑定`,
          suggestion: { type: 'replace-component', infoItemId: item.infoItemId }
        });
      } else if (comp && info?.dataType && comp.supportedDataTypes && !comp.supportedDataTypes.includes(info.dataType)) {
        issues.push({
          type: 'ergonomics',
          severity: 'medium',
          infoItemId: item.infoItemId,
          componentId: item.componentId,
          message: `组件 ${comp.name} 与数据类型 ${info.dataType} 不匹配`,
          suggestion: { type: 'replace-component', infoItemId: item.infoItemId }
        });
      }
    });
  });

  // simple cross-page consistency: keep first region role for same infoId
  const consistency = [];
  (requirement.pages || []).forEach((p) => {
    if (p.id === page.id) return;
    (p.infoPriorities || []).forEach((info) => {
      const existsInPage = (page.infoPriorities || []).find((x) => x.infoItemId === info.infoItemId);
      if (existsInPage) consistency.push(info.infoItemId);
    });
  });
  if (consistency.length) {
    issues.push({
      type: 'consistency',
      severity: 'low',
      message: '存在跨页面共享的信息项，请保持位置一致',
      suggestion: { type: 'anchor', infoItemIds: Array.from(new Set(consistency)) }
    });
  }

  const summary = {
    counts: {
      semantic: issues.filter((i) => i.type === 'semantic').length,
      usability: issues.filter((i) => i.type === 'usability').length,
      consistency: issues.filter((i) => i.type === 'consistency').length,
      ergonomics: issues.filter((i) => i.type === 'ergonomics').length
    },
    topIssues: issues.slice(0, 5)
  };
  return { issues, summary };
}

function applyLayoutRepair(plan, page, review, requirement, library) {
  const infoMap = new Map();
  (requirement.infoItems || []).forEach((i) => infoMap.set(i.id, i));
  const priorityMap = new Map();
  (page.infoPriorities || []).forEach((p) => priorityMap.set(p.infoItemId, p.priority));
  const libraryMap = new Map();
  (library || []).forEach((c) => libraryMap.set(c.id, c));

  const changeLog = [];
  const clone = JSON.parse(JSON.stringify(plan));
  const regionById = new Map();
  (clone.regions || []).forEach((r) => regionById.set(r.id, r));

  const promote = (infoItemId) => {
    const currentRegion = (clone.regions || []).find((r) => (r.items || []).some((it) => it.infoItemId === infoItemId));
    const hero =
      (clone.regions || []).find((r) => r.role === 'hero') ||
      (clone.regions || []).find((r) => r.role === 'summary') ||
      clone.regions?.[0];
    if (!hero) return;
    if (currentRegion && currentRegion.id === hero.id) return;
    if (currentRegion) {
      currentRegion.items = (currentRegion.items || []).filter((it) => it.infoItemId !== infoItemId);
    }
    hero.items = hero.items || [];
    hero.items.unshift({ infoItemId, componentId: null, slotBindings: [] });
    changeLog.push({ pageId: page.id, type: 'move', detail: `信息 ${infoItemId} 提升到 ${hero.name || hero.id}` });
  };

  const replaceComponent = (infoItemId) => {
    const region = (clone.regions || []).find((r) => (r.items || []).some((it) => it.infoItemId === infoItemId));
    if (!region) return;
    const item = (region.items || []).find((it) => it.infoItemId === infoItemId);
    const candidates = buildTwoStageCandidates([infoMap.get(infoItemId) || { id: infoItemId }], library);
    const best = candidates[0]?.candidates?.find((c) => c.componentId !== item.componentId);
    if (best) {
      const from = item.componentId;
      item.componentId = best.componentId;
      changeLog.push({ pageId: page.id, type: 'replace', detail: `${infoItemId}: ${from || '空'} → ${best.componentId}` });
    }
  };

  const reflowRegion = (regionId) => {
    const region = regionById.get(regionId);
    if (!region || !(region.items || []).length) return;
    const half = Math.ceil(region.items.length / 2);
    const newRegion = {
      id: `${region.id}-split`,
      name: `${region.name || '区域'}-调整`,
      role: region.role || 'summary',
      x: Math.min(0.9, region.x + region.width * 0.5),
      y: region.y,
      width: Math.max(0.2, region.width * 0.5),
      height: region.height,
      layout: region.layout,
      items: region.items.splice(half)
    };
    clone.regions.push(newRegion);
    changeLog.push({ pageId: page.id, type: 'reflow', detail: `${region.name || region.id} 拆分为两块` });
  };

  const anchorPositions = new Map();
  const applyAnchor = (infoItemIds) => {
    (clone.regions || []).forEach((region) => {
      (region.items || []).forEach((item) => {
        if (!infoItemIds.includes(item.infoItemId)) return;
        if (!anchorPositions.has(item.infoItemId)) {
          anchorPositions.set(item.infoItemId, region.role || region.id);
        } else {
          const targetRole = anchorPositions.get(item.infoItemId);
          if (region.role !== targetRole) {
            const targetRegion =
              (clone.regions || []).find((r) => r.role === targetRole) || regionById.get(region.id);
            if (targetRegion && targetRegion.id !== region.id) {
              region.items = (region.items || []).filter((it) => it.infoItemId !== item.infoItemId);
              targetRegion.items = targetRegion.items || [];
              targetRegion.items.push(item);
              changeLog.push({
                pageId: page.id,
                type: 'anchor',
                detail: `${item.infoItemId} 位置对齐到 ${targetRole}`
              });
            }
          }
        }
      });
    });
  };

  const applied = new Set();
  (review.issues || []).forEach((issue) => {
    if (applied.has(issue)) return;
    applied.add(issue);
    if (issue.suggestion?.type === 'promote' && issue.suggestion.infoItemId) {
      promote(issue.suggestion.infoItemId);
    } else if (issue.suggestion?.type === 'replace-component' && issue.suggestion.infoItemId) {
      replaceComponent(issue.suggestion.infoItemId);
    } else if (issue.suggestion?.type === 'reflow-region' && issue.suggestion.regionId) {
      reflowRegion(issue.suggestion.regionId);
    } else if (issue.suggestion?.type === 'anchor' && Array.isArray(issue.suggestion.infoItemIds)) {
      applyAnchor(issue.suggestion.infoItemIds);
    }
  });

  return { plan: clone, changeLog };
}

async function orchestrateRun({ docText, library, screenType }) {
  logAgent('orchestrator', 'start', `docLen=${docText?.length || 0} lib=${library?.length || 0} screenType=${screenType}`);
  const trace = {
    id: randomUUID(),
    startedAt: new Date().toISOString(),
    mode: 'multi-agent-nsga',
    agentOrder: ['extract', 'priority-balance', 'retrieval'],
    input: {
      docSnippet: (docText || '').slice(0, 240),
      library: summarizeLibrary(library)
    },
    steps: [],
    iterations: 0
  };

  // Extract Agent
  const extractStart = Date.now();
  logAgent('extract', 'start', `docLen=${docText?.length || 0}`);
  const parseResult = await runParseDocumentInternal(docText);
  const normalized = ensurePagePriorities(parseResult);
  const completeness = ensureRequirementCompleteness(normalized.requirement);
  const priorityFilledPages = normalized.filledPages || [];
  logAgent('extract', 'done', `phases=${parseResult.phases?.length || 0} roles=${parseResult.roles?.length || 0} conditions=${parseResult.conditions?.length || 0} info=${parseResult.infoItems?.length || 0} pages=${parseResult.pages?.length || 0}`);
  trace.steps.push({
    agent: 'extract',
    durationMs: Date.now() - extractStart,
    inputSummary: `doc length ${docText?.length || 0}`,
    outputSummary: `phases:${parseResult.phases?.length || 0}, roles:${parseResult.roles?.length || 0}, conditions:${parseResult.conditions?.length || 0}, info:${parseResult.infoItems?.length || 0}, pages:${parseResult.pages?.length || 0}`,
    completeness,
    priorityAutoFilledPages: priorityFilledPages
  });

  // NSGA-II Priority Balance Agent
  const adjustStart = Date.now();
  logAgent('priority-balance', 'start', `pages=${normalized.requirement.pages?.length || 0}`);
  const adjustedRequirement = { ...normalized.requirement, pages: [] };
  const iterations = [];
  const priorityBalancePreview = { pages: [] };
  (normalized.requirement.pages || []).forEach((page) => {
    const { winner, iterations: rounds, finalCandidates } = runNsgaForPage(page, normalized.requirement.infoItems || []);
    rounds.forEach((r) => {
      iterations.push({ ...r, pageId: page.id, pageName: page.name });
    });
    const selectionReason = buildSelectionReason(winner, finalCandidates || []);
    priorityBalancePreview.pages.push({
      pageId: page.id,
      pageName: page.name,
      candidateCount: finalCandidates?.length || 0,
      winner: winner ? { id: winner.id, objectives: winner.objectives, semantic: winner.semantic } : null,
      selectionReason,
      candidates: finalCandidates || []
    });
    adjustedRequirement.pages.push({
      ...page,
      infoPriorities: winner?.candidate || page.infoPriorities || []
    });
  });
  trace.iterations = iterations.length;
  trace.steps.push({
    agent: 'priority-balance',
    durationMs: Date.now() - adjustStart,
    rounds: iterations.length,
    candidatesPerRound: iterations.map((r) => ({
      pageId: r.pageId,
      round: r.round,
      candidateCount: r.candidates.length,
      best: r.best,
      candidates: r.candidates
    })),
    selection: priorityBalancePreview
  });
  logAgent('priority-balance', 'done', `rounds=${iterations.length}`);

  // Retrieval Agent (two-stage)
  const retrievalStart = Date.now();
  logAgent('retrieval', 'start', `infoItems=${normalized.requirement.infoItems?.length || 0} library=${library?.length || 0}`);
  const algoCandidates = buildTwoStageCandidates(normalized.requirement.infoItems || [], library || []);
  const finalSelection = await runFinalSelectionWithLLM(algoCandidates, normalized.requirement.infoItems || []);
  const bindings = (finalSelection.decisions || []).map((d) => ({
    infoItemId: d.infoItemId,
    componentId: d.chosen,
    reason: d.reason
  }));
  logAgent('retrieval', 'done', `bindings=${bindings.length} llm=${finalSelection.usedLLM ? 'yes' : 'no'}`);
  trace.steps.push({
    agent: 'retrieval',
    durationMs: Date.now() - retrievalStart,
    stage1Candidates: algoCandidates,
    stage2: { usedLLM: finalSelection.usedLLM, error: finalSelection.error, llmPreview: finalSelection.llmPreview }
  });

  const traceId = saveTrace(trace);
  logAgent('orchestrator', 'done', `trace=${traceId}`);
  return {
    traceId,
    tracePreview: {
      id: traceId,
      agentOrder: trace.agentOrder,
      iterations: trace.iterations,
      priorityBalance: priorityBalancePreview,
      completeness,
      steps: trace.steps.map((s) => ({ agent: s.agent, summary: s.outputSummary || s.durationMs }))
    },
    requirement: { ...normalized.requirement, completeness },
    adjustedRequirement: { ...adjustedRequirement, completeness },
    bindings
  };
}

async function runParseDocumentInternal(docText) {
  if (!OPENAI_API_KEY) {
    return buildFallbackModel(docText);
  }
  const prompt = buildParsePrompt(docText);
  const llmUrl = `${OPENAI_BASE_URL}/chat/completions`;
  const llmBody = {
    model: PARSE_MODEL,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: PARSE_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ]
  };
  try {
    const completion = await fetch(llmUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify(llmBody)
    });
    const raw = await completion.text();
    if (!completion.ok) {
    logLLMInteraction('parse-doc', { request: { url: llmUrl, body: llmBody }, responseRaw: { length: raw.length }, error: `status_${completion.status}` });
      return buildFallbackModel(docText);
    }
    const data = JSON.parse(raw);
    const content = data.choices?.[0]?.message?.content;
    const parsed = parseContent(content);
    if (!parsed?.pages) {
      logLLMInteraction('parse-doc', {
        request: { url: llmUrl, body: llmBody },
        responseRaw: { length: raw.length },
        parsed,
        error: 'parse_invalid'
      });
      return buildFallbackModel(docText);
    }
    logLLMInteraction('parse-doc', { request: { url: llmUrl, body: llmBody }, responseRaw: { length: raw.length }, parsed });
    return parsed;
  } catch (error) {
    console.error('[parse-doc] internal failed', error);
    return buildFallbackModel(docText);
  }
}
