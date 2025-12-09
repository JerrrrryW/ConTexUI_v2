type Provider = 'openai' | 'siliconflow' | 'gemini';
type StatusMessage = {
  type: 'status';
  state: 'loading' | 'idle' | 'success' | 'error';
  message?: string;
};
declare const atob: (data: string) => string;

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
  preferredBindings?: InfoBinding[];
};

type RequirementModel = {
  phases: Phase[];
  roles: Role[];
  conditions: Condition[];
  infoItems: InfoItem[];
  pages: PageDefinition[];
  updatedAt: number;
};

type InfoBinding = { infoItemId: string; componentId?: string; slotHints?: Record<string, string> };

type ComponentSlotType = 'label' | 'numericValue' | 'unit' | 'state' | 'alert' | 'listItem';
type ComponentSlot = { slotName: string; nodeId: string; slotType: ComponentSlotType; dataType?: DataType };
type InfoCategory =
  | 'status'
  | 'metric'
  | 'trend'
  | 'alert'
  | 'navigation'
  | 'context'
  | 'control'
  | 'composite';
type TaskStageAffinity = 'overview' | 'monitoring' | 'drilldown' | 'investigation' | 'recovery';
type PriorityAffinity = 'high' | 'medium' | 'low' | 'flexible';
type CriticalitySupport = 'good' | 'limited' | 'not-suitable';
type VisualFootprint = 'small' | 'medium' | 'large';
type InfoDensityProfile = 'sparse' | 'normal' | 'dense';
type DynamicBehavior = 'static' | 'frequent-update' | 'event-driven';
type LayoutRole = 'hero' | 'summary' | 'sidebar' | 'toolbar' | 'inline';
type ViewportZone = 'top-left' | 'top' | 'center' | 'bottom' | 'any';
type LayerStats = {
  textNodeCount: number;
  shapeNodeCount: number;
  groupDepth: number;
  autoLayoutEnabled: boolean;
  dominantFontSize?: number;
  colorChannelCount?: number;
};
type InteractionSupport = string;
type SlotBinding = { slotName: string; content: string };
type LayoutRegion = {
  id: string;
  name: string;
  role?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  items: {
    infoItemId: string;
    componentId?: string | null;
    slotBindings?: SlotBinding[];
  }[];
};
type LayoutPlan = {
  screen: {
    width: number;
    height: number;
    background?: { required?: boolean; hint?: string; nodeId?: string };
  };
  screenType?: string;
  regions: LayoutRegion[];
  componentDefaults?: Record<string, string | null | undefined>;
};
type ExperimentSummary = { id: string; name: string; description?: string };
type ExperimentDetail = ExperimentSummary & {
  requirement: RequirementModel;
  library: ComponentExample[];
  layoutPlan?: LayoutPlan;
  layoutPlanPageId?: string;
};

type GenerateDesignMessage = {
  type: 'generate-design';
  prompt: string;
  apiKey: string;
  provider: Provider;
  useLibrary?: boolean;
};
type GeneratePagesMessage = {
  type: 'generate-pages';
  pageIds: string[];
  template: LayoutTemplate;
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
  infoCategory?: InfoCategory | null;
  taskStageAffinity?: TaskStageAffinity[];
  priorityAffinity?: PriorityAffinity | null;
  criticalitySupport?: CriticalitySupport | null;
  visualFootprint?: VisualFootprint | null;
  infoDensityProfile?: InfoDensityProfile | null;
  recommendedMaxInstancesPerPage?: number | null;
  dynamicBehavior?: DynamicBehavior | null;
  layoutRole?: LayoutRole | null;
  recommendedViewportZone?: ViewportZone | null;
  interactionSupport?: InteractionSupport[];
};
type RequestSlotsMessage = { type: 'request-slots'; id: string };
type SaveSlotsMessage = { type: 'save-slots'; id: string; slots: ComponentSlot[] };
type EnrichLibraryMessage = { type: 'enrich-library' };
type UpdateRequirementMessage = { type: 'update-requirement'; data: RequirementModel };
type RecommendBindingsMessage = { type: 'recommend-bindings'; pageId?: string; pageIds?: string[] };
type UpdateNoteMessage = { type: 'update-note'; id: string; note: string };
type RemoveComponentMessage = { type: 'remove-component'; id: string };
type EditPageMessage = {
  type: 'edit-page';
  prompt: string;
  apiKey: string;
  provider: Provider;
};
type UndoEditMessage = { type: 'undo-edit' };
type LoadExperimentMessage = { type: 'load-experiment'; experimentId: string };
type GenerateLayoutPlanMessage = {
  type: 'generate-layout-plan';
  pageId?: string;
  pageIds?: string[];
  screenType?: string;
  backgroundNodeId?: string;
};
type ApplyLayoutPlanMessage = { type: 'apply-layout-plan'; pageIds?: string[] };
type SetBackgroundFromSelectionMessage = { type: 'set-background-from-selection' };
type PluginMessage =
  | GenerateDesignMessage
  | GeneratePagesMessage
  | ImportMessage
  | RequestLibraryMessage
  | ExportLibraryMessage
  | ParseDocumentMessage
  | RequestRequirementMessage
  | UpdateComponentMetaMessage
  | RequestSlotsMessage
  | SaveSlotsMessage
  | EnrichLibraryMessage
  | UpdateRequirementMessage
  | RecommendBindingsMessage
  | UpdateNoteMessage
  | RemoveComponentMessage
  | EditPageMessage
  | UndoEditMessage
  | LoadExperimentMessage
  | GenerateLayoutPlanMessage
  | ApplyLayoutPlanMessage
  | SetBackgroundFromSelectionMessage;

type EditOperation =
  | {
      op: 'update';
      targetId: string;
      props: {
        name?: string;
        text?: string;
        fill?: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        visible?: boolean;
      };
    }
  | { op: 'remove'; targetId: string }
  | {
      op: 'reorder';
      targetId: string;
      parentId?: string;
      insertIndex?: number;
    }
  | {
      op: 'add-text';
      parentId?: string;
      insertIndex?: number;
      text?: string;
      fill?: string;
      width?: number;
      height?: number;
      x?: number;
      y?: number;
    }
  | {
      op: 'add-rectangle';
      parentId?: string;
      insertIndex?: number;
      fill?: string;
      width?: number;
      height?: number;
      x?: number;
      y?: number;
    };

type EditApiResponse = { operations?: EditOperation[]; summary?: string };

type SerializedNode = {
  id: string;
  type: SceneNode['type'];
  name?: string;
  text?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  visible?: boolean;
  children?: SerializedNode[];
};

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
  infoCategory?: InfoCategory | null;
  taskStageAffinity?: TaskStageAffinity[];
  priorityAffinity?: PriorityAffinity | null;
  criticalitySupport?: CriticalitySupport | null;
  visualFootprint?: VisualFootprint | null;
  infoDensityProfile?: InfoDensityProfile | null;
  recommendedMaxInstancesPerPage?: number | null;
  dynamicBehavior?: DynamicBehavior | null;
  layoutRole?: LayoutRole | null;
  recommendedViewportZone?: ViewportZone | ViewportZone[] | null;
  interactionSupport?: InteractionSupport[];
  layerStats?: LayerStats;
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
const API_BASE = 'http://localhost:4000';
const ENRICH_BASE = API_BASE;
const PARSE_BASE = API_BASE;
const RECO_BASE = API_BASE;
const EDIT_BASE = API_BASE;

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
let lastEditBackup: { frameId: string; backupId: string } | null = null;
let currentExperimentId: string | null = null;
let lastLayoutPlans: Record<string, LayoutPlan> = {};
let lastBackgroundNodeId: string | null = null;
type LayoutTemplate = 'two-col' | 'three-col' | 'main-side' | 'dashboard';

const DEFAULT_LAYER_STATS: LayerStats = {
  textNodeCount: 0,
  shapeNodeCount: 0,
  groupDepth: 1,
  autoLayoutEnabled: false,
  dominantFontSize: undefined,
  colorChannelCount: undefined
};

function defaultLayerStats(): LayerStats {
  return { ...DEFAULT_LAYER_STATS };
}

function inferVisualFootprint(width: number, height: number): VisualFootprint {
  const area = Math.max(0, width || 0) * Math.max(0, height || 0);
  if (area <= 50000) return 'small';
  if (area <= 150000) return 'medium';
  return 'large';
}

function inferInfoDensityProfile(stats?: LayerStats | null, slotCount = 0): InfoDensityProfile {
  const s = stats || defaultLayerStats();
  const score = (s.textNodeCount || 0) + (s.shapeNodeCount || 0) * 0.5 + slotCount;
  if (score <= 2) return 'sparse';
  if (score <= 6) return 'normal';
  return 'dense';
}

function applyComponentDefaults(comp: ComponentExample): ComponentExample {
  const stats = comp.layerStats || defaultLayerStats();
  const slots = comp.slots || [];
  const viewportZone = Array.isArray(comp.recommendedViewportZone)
    ? comp.recommendedViewportZone[0]
    : comp.recommendedViewportZone;
  return {
    ...comp,
    tags: comp.tags || [],
    supportedDataTypes: comp.supportedDataTypes || [],
    taskStageAffinity: comp.taskStageAffinity || [],
    interactionSupport: comp.interactionSupport || [],
    priorityAffinity: comp.priorityAffinity ?? 'flexible',
    visualFootprint: comp.visualFootprint ?? inferVisualFootprint(comp.width, comp.height),
    infoDensityProfile: comp.infoDensityProfile ?? inferInfoDensityProfile(stats, slots.length),
    recommendedMaxInstancesPerPage:
      typeof comp.recommendedMaxInstancesPerPage === 'number'
        ? comp.recommendedMaxInstancesPerPage
        : null,
    infoCategory: comp.infoCategory ?? null,
    criticalitySupport: comp.criticalitySupport ?? null,
    dynamicBehavior: comp.dynamicBehavior ?? 'static',
    layoutRole: comp.layoutRole ?? null,
    recommendedViewportZone: viewportZone ?? 'any',
    layerStats: stats
  };
}

function computeLayerStatsFromNode(node: SceneNode): LayerStats {
  let textNodeCount = 0;
  let shapeNodeCount = 0;
  let groupDepth = 1;
  let autoLayoutEnabled = false;
  const fontSizes: number[] = [];
  const colorSet = new Set<string>();

  const visit = (target: SceneNode, depth: number) => {
    groupDepth = Math.max(groupDepth, depth);
    if ('layoutMode' in target && (target as FrameNode).layoutMode !== 'NONE') {
      autoLayoutEnabled = true;
    }
    if ('fills' in target) {
      const fills = (target as GeometryMixin).fills as Paint[] | typeof figma.mixed | undefined;
      if (Array.isArray(fills)) {
        fills.forEach((paint) => {
          if (paint && paint.type === 'SOLID') {
            colorSet.add(rgbToHex((paint as SolidPaint).color));
          }
        });
      }
    }

    if (target.type === 'TEXT') {
      textNodeCount += 1;
      const size = (target as TextNode).fontSize;
      if (typeof size === 'number' && Number.isFinite(size)) fontSizes.push(size);
    } else if (
      target.type === 'RECTANGLE' ||
      target.type === 'ELLIPSE' ||
      target.type === 'POLYGON' ||
      target.type === 'STAR' ||
      target.type === 'VECTOR' ||
      target.type === 'LINE' ||
      target.type === 'BOOLEAN_OPERATION'
    ) {
      shapeNodeCount += 1;
    }

    if ('children' in target) {
      for (const child of (target as ChildrenMixin).children) {
        visit(child as SceneNode, depth + 1);
      }
    }
  };

  visit(node, 1);

  const dominantFontSize =
    fontSizes.length > 0 ? Math.round(fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length) : undefined;

  return {
    textNodeCount,
    shapeNodeCount,
    groupDepth,
    autoLayoutEnabled,
    dominantFontSize,
    colorChannelCount: colorSet.size || undefined
  };
}

async function hydrateLayerStats() {
  let updated = false;
  for (let i = 0; i < componentLibrary.length; i += 1) {
    const comp = componentLibrary[i];
    if (!comp.layerStats || comp.layerStats.textNodeCount === 0) {
      const node = await figma.getNodeByIdAsync(comp.nodeId);
      if (node && 'children' in node) {
        const stats = computeLayerStatsFromNode(node as SceneNode);
        componentLibrary[i] = applyComponentDefaults({ ...comp, layerStats: stats });
        updated = true;
      }
    }
  }
  if (updated) {
    try {
      await figma.clientStorage.setAsync(LIBRARY_KEY, componentLibrary);
    } catch (_error) {
      // ignore storage errors during hydration
    }
  }
}

// Enlarged UI to accommodate multi-step layout and modal
figma.showUI(__html__, { width: 960, height: 760 });

initializeLibrary();
initializeRequirement();
fetchExperimentsList();

figma.ui.onmessage = async (msg: PluginMessage) => {
  if (msg.type === 'generate-pages') {
    await generatePages(msg.template, msg.pageIds, msg.useLibrary ?? true);
    return;
  }
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

  if (msg.type === 'load-experiment') {
    await handleLoadExperiment(msg.experimentId);
    return;
  }

  if (msg.type === 'generate-layout-plan') {
    await handleGenerateLayoutPlan(msg);
    return;
  }

  if (msg.type === 'apply-layout-plan') {
    await handleApplyLayoutPlan();
    return;
  }

  if (msg.type === 'set-background-from-selection') {
    await handleSetBackgroundFromSelection();
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

  if (msg.type === 'update-requirement') {
    await persistRequirement(msg.data);
    sendRequirementToUI();
    return;
  }

  if (msg.type === 'recommend-bindings') {
    await handleRecommendBindings(msg.pageId);
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

  if (msg.type === 'edit-page') {
    await handleEditPage(msg);
    return;
  }

  if (msg.type === 'undo-edit') {
    await handleUndoEdit();
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
      componentLibrary = (saved as ComponentExample[]).map(applyComponentDefaults);
    }
  } catch (_error) {
    componentLibrary = [];
  }
  await hydrateLayerStats();
  sendLibraryToUI();
}

function sendLibraryToUI() {
  figma.ui.postMessage({ type: 'library', items: componentLibrary });
}

async function persistLibrary() {
  componentLibrary = componentLibrary.map(applyComponentDefaults);
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

async function handleRecommendBindings(pageId?: string) {
  if (!requirementModel) {
    figma.notify('请先解析需求文档');
    return;
  }
  try {
    sendStatus('loading', '正在推荐组件');
    const result = await callRecommendComponents(requirementModel.infoItems, componentLibrary);
    applyRecommendedBindings(result, pageId ? [pageId] : undefined);
    await persistRequirement(requirementModel);
    sendRequirementToUI();
    figma.notify('已更新推荐组件');
    sendStatus('success');
  } catch (error) {
    figma.notify(`推荐失败：${getErrorMessage(error)}`);
    sendStatus('error', getErrorMessage(error));
  } finally {
    sendStatus('idle');
  }
}

async function handleEditPage(msg: EditPageMessage) {
  const prompt = msg.prompt?.trim();
  const apiKey = msg.apiKey?.trim();
  const provider: Provider = msg.provider || 'openai';

  const selection = figma.currentPage.selection;
  const frame = selection.find((node) => node.type === 'FRAME') as FrameNode | undefined;

  if (!prompt) {
    figma.notify('请输入编辑指令');
    sendEditStatus('error', '请输入编辑指令');
    return;
  }

  if (!frame) {
    figma.notify('请先选中一个 Frame（页面）');
    sendEditStatus('error', '需要选择一个 Frame');
    return;
  }

  try {
    sendEditStatus('loading', '正在向模型请求编辑方案');
    const snapshot = buildFrameSnapshot(frame);
    const result = await callEditPage({
      prompt,
      apiKey,
      provider,
      frameSnapshot: snapshot
    });
    const operations = Array.isArray(result.operations) ? result.operations : [];
    if (!operations.length) {
      throw new Error('模型未返回操作');
    }
    await loadFonts();
    const { clone, idMap } = cloneFrameWithMapping(frame);
    await storeEditBackup(clone);
    const remapped = remapOperations(operations, idMap);
    const applied = applyEditOperations(clone, remapped);
    figma.currentPage.selection = [clone];
    figma.viewport.scrollAndZoomIntoView([clone]);
    figma.ui.postMessage({ type: 'edit-ops', operations: applied, summary: result.summary });
    figma.notify('页面已更新');
    sendEditStatus('success', '编辑完成');
  } catch (error) {
    figma.notify(`编辑失败：${getErrorMessage(error)}`);
    sendEditStatus('error', getErrorMessage(error));
  } finally {
    sendEditStatus('idle');
  }
}

async function handleUndoEdit() {
  if (!lastEditBackup?.backupId) {
    figma.notify('没有可撤销的编辑');
    sendEditStatus('error', '无可恢复的内容');
    return;
  }
  const backup = (await figma.getNodeByIdAsync(lastEditBackup.backupId)) as FrameNode | null;
  const target = (await figma.getNodeByIdAsync(lastEditBackup.frameId)) as FrameNode | null;
  if (!backup || backup.type !== 'FRAME') {
    figma.notify('未找到备份');
    await cleanupEditBackup();
    sendEditStatus('error', '备份已丢失');
    return;
  }
  const parent = (target?.parent || backup.parent) as ChildrenMixin | null;
  if (!parent || typeof (parent as ChildrenMixin).appendChild !== 'function') {
    figma.notify('无法恢复页面');
    sendEditStatus('error', '无法恢复页面');
    await cleanupEditBackup();
    return;
  }
  const insertIndex = target ? parent.children.indexOf(target) : parent.children.length;
  backup.visible = true;
  backup.locked = false;
  if (target) {
    backup.name = target.name;
    backup.x = target.x;
    backup.y = target.y;
  }
  parent.insertChild(Math.max(0, insertIndex), backup);
  if (target) target.remove();
  figma.currentPage.selection = [backup];
  figma.viewport.scrollAndZoomIntoView([backup]);
  figma.notify('已恢复到上一次编辑前');
  sendEditStatus('success', '已恢复到上一次编辑前');
  await cleanupEditBackup();
  sendEditStatus('idle');
}

function applySpecToFrame(
  frame: FrameNode,
  spec: UISpec,
  componentMap: Map<string, SceneNode>
) {
  while (frame.children.length) {
    frame.children[0].remove();
  }

  frame.name = spec.title || frame.name || '编辑后的页面';
  frame.layoutMode = 'VERTICAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.itemSpacing = spec.spacing ?? 12;
  frame.paddingLeft = spec.padding ?? 24;
  frame.paddingRight = spec.padding ?? 24;
  frame.paddingTop = spec.padding ?? 24;
  frame.paddingBottom = spec.padding ?? 24;
  frame.cornerRadius =
    typeof frame.cornerRadius === 'number' && !Number.isNaN(frame.cornerRadius)
      ? frame.cornerRadius
      : 16;
  frame.fills = [{ type: 'SOLID', color: hexToRgb(spec.background || DEFAULT_BACKGROUND) }];

  spec.layers.forEach((layer) => {
    const node = createLayerNode(layer, componentMap);
    frame.appendChild(node);
  });
}

function createBindingNode(
  page: PageDefinition,
  item: PageInfoPriority,
  componentMap: Map<string, SceneNode>,
  width: number,
  height: number
): FrameNode {
  const binding = (page.preferredBindings || []).find((b) => b.infoItemId === item.infoItemId);
  if (binding?.componentId) {
    const comp = componentMap.get(binding.componentId);
    if (comp && 'clone' in comp) {
      const clone = (comp as SceneNode).clone() as FrameNode;
      clone.name = binding.componentId;
      clone.resizeWithoutConstraints(width, height);
      if ('layoutAlign' in clone) {
        (clone as LayoutMixin).layoutAlign = 'INHERIT';
      }
      return clone;
    }
  }

  const placeholder = figma.createFrame();
  placeholder.name = `未绑定 · ${item.infoItemId}`;
  placeholder.resize(width, height);
  placeholder.fills = [{ type: 'SOLID', color: hexToRgb('#F9FAFB') }];
  placeholder.strokes = [{ type: 'SOLID', color: hexToRgb('#E5E7EB') }];
  placeholder.strokeWeight = 1;
  placeholder.layoutMode = 'VERTICAL';
  placeholder.primaryAxisSizingMode = 'AUTO';
  placeholder.counterAxisSizingMode = 'AUTO';
  placeholder.paddingTop = 12;
  placeholder.paddingBottom = 12;
  placeholder.paddingLeft = 12;
  placeholder.paddingRight = 12;
  placeholder.itemSpacing = 6;

  const info = requirementModel?.infoItems.find((i) => i.id === item.infoItemId);

  const title = figma.createText();
  title.fontName = activeFont;
  title.characters = info?.name || item.infoItemId;
  title.fontSize = 14;
  title.fills = [{ type: 'SOLID', color: hexToRgb('#111827') }];

  const desc = figma.createText();
  desc.fontName = activeFont;
  desc.characters = info?.description || '未绑定组件';
  desc.fontSize = 12;
  desc.fills = [{ type: 'SOLID', color: hexToRgb('#6B7280') }];

  placeholder.appendChild(title);
  placeholder.appendChild(desc);
  return placeholder;
}

async function storeEditBackup(frame: FrameNode) {
  await cleanupEditBackup();
  const clone = frame.clone();
  clone.visible = false;
  clone.locked = true;
  clone.name = `${frame.name || 'Frame'} · Backup`;
  const parent = frame.parent;
  if (parent && 'appendChild' in parent) {
    (parent as ChildrenMixin).appendChild(clone);
  } else {
    figma.currentPage.appendChild(clone);
  }
  clone.x = frame.x;
  clone.y = frame.y;
  lastEditBackup = { frameId: frame.id, backupId: clone.id };
}

async function cleanupEditBackup() {
  if (!lastEditBackup?.backupId) return;
  const node = await figma.getNodeByIdAsync(lastEditBackup.backupId);
  if (node && 'remove' in node) {
    node.remove();
  }
  lastEditBackup = null;
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
  if ('infoCategory' in msg) target.infoCategory = msg.infoCategory ?? null;
  if (Array.isArray(msg.taskStageAffinity)) target.taskStageAffinity = msg.taskStageAffinity;
  if ('priorityAffinity' in msg) target.priorityAffinity = msg.priorityAffinity ?? null;
  if ('criticalitySupport' in msg) target.criticalitySupport = msg.criticalitySupport ?? null;
  if ('visualFootprint' in msg) target.visualFootprint = msg.visualFootprint ?? null;
  if ('infoDensityProfile' in msg) target.infoDensityProfile = msg.infoDensityProfile ?? null;
  if ('recommendedMaxInstancesPerPage' in msg) {
    target.recommendedMaxInstancesPerPage =
      typeof msg.recommendedMaxInstancesPerPage === 'number'
        ? msg.recommendedMaxInstancesPerPage
        : null;
  }
  if ('dynamicBehavior' in msg) target.dynamicBehavior = msg.dynamicBehavior ?? null;
  if ('layoutRole' in msg) target.layoutRole = msg.layoutRole ?? null;
  if ('recommendedViewportZone' in msg)
    target.recommendedViewportZone = msg.recommendedViewportZone ?? null;
  if (Array.isArray(msg.interactionSupport)) target.interactionSupport = msg.interactionSupport;
  Object.assign(target, applyComponentDefaults(target));
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
    schemaVersion: 2,
    exportedAt: Date.now(),
    count: componentLibrary.length,
    items: componentLibrary.map(applyComponentDefaults)
  };
  figma.ui.postMessage({ type: 'library-export', data: payload });
}

function sendRequirementToUI() {
  figma.ui.postMessage({ type: 'requirement', data: requirementModel });
}

function toComponentExample(frame: FrameNode): ComponentExample {
  const texts = collectTexts(frame);
  const base: ComponentExample = {
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
    layerStats: computeLayerStatsFromNode(frame),
    lastUpdated: Date.now()
  };
  return applyComponentDefaults(base);
}

async function fetchDesignSpec(
  prompt: string,
  apiKey: string,
  provider: Provider,
  libraryContext: string
): Promise<UISpec> {
  const systemPrompt = buildSystemPrompt(libraryContext);
  if (provider === 'gemini') {
    return fetchGeminiSpec(prompt, apiKey, libraryContext, systemPrompt, provider);
  }

  const config = provider === 'openai' ? PROVIDERS.openai : PROVIDERS.siliconflow;
  return fetchOpenAICompatSpec(
    prompt,
    apiKey,
    config.baseUrl,
    config.model,
    libraryContext,
    systemPrompt,
    provider
  );
}

async function fetchOpenAICompatSpec(
  prompt: string,
  apiKey: string,
  baseUrl: string,
  model: string,
  libraryContext: string,
  systemPromptOverride?: string,
  providerName?: Provider
): Promise<UISpec> {
  const systemPrompt = systemPromptOverride ?? buildSystemPrompt(libraryContext);
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
  logModelIO(providerName || 'openai', model, systemPrompt, userPrompt, raw);

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

async function fetchGeminiSpec(
  prompt: string,
  apiKey: string,
  libraryContext: string,
  systemPromptOverride?: string,
  providerName?: Provider
): Promise<UISpec> {
  const { baseUrl, model } = PROVIDERS.gemini;
  const systemPrompt = systemPromptOverride ?? buildSystemPrompt(libraryContext);
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
  logModelIO(providerName || 'gemini', model, systemPrompt, userPrompt, raw);

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

async function generatePages(template: LayoutTemplate, pageIds: string[], useLibrary: boolean) {
  if (!requirementModel) {
    figma.notify('请先解析需求文档');
    return;
  }
  const pages = requirementModel.pages.filter((p) => pageIds.indexOf(p.id) !== -1);
  if (!pages.length) {
    figma.notify('未找到页面');
    return;
  }

  await loadFonts();

  const bindingIds = new Set<string>();
  pages.forEach((page) => {
    (page.preferredBindings || []).forEach((b) => {
      if (b.componentId) {
        // Avoid includes because lib is es6; using indexOf
        if (bindingIds.has(b.componentId) === false) bindingIds.add(b.componentId);
      }
    });
  });
  const componentMap = useLibrary
    ? await loadComponentsByIds(Array.from(bindingIds))
    : new Map<string, SceneNode>();

  const created: FrameNode[] = [];

  pages.forEach((page) => {
    const frame = buildPageFrame(template, page, componentMap);
    figma.currentPage.appendChild(frame);
    created.push(frame);
  });

  if (created.length) {
    figma.currentPage.selection = created;
    figma.viewport.scrollAndZoomIntoView(created);
  }
}

function buildPageFrame(
  template: LayoutTemplate,
  page: PageDefinition,
  componentMap: Map<string, SceneNode>
): FrameNode {
  const frame = figma.createFrame();
  const phase = requirementModel?.phases.find((p) => p.id === page.phaseId);
  const role = requirementModel?.roles.find((r) => r.id === page.roleId);
  const condition = requirementModel?.conditions.find((c) => c.id === page.conditionId);
  frame.name = `${page.name || '页面'} · ${phase?.name || ''}·${role?.name || ''}·${
    condition?.name || ''
  }`;
  frame.layoutMode = 'NONE';
  frame.clipsContent = false;
  frame.fills = [];
  const padding = 24;
  const gap = 24;
  const cardWidth = 320;
  const cardHeight = 200;

  const columns =
    template === 'three-col'
      ? 3
      : template === 'dashboard'
      ? 3
      : 2; // two-col / main-side default 2

  let x = padding;
  let y = padding;
  let col = 0;
  const maxWidths: number[] = [];

  const sorted = page.infoPriorities.slice().sort((a, b) => a.priority - b.priority);

  sorted.forEach((item, index) => {
    const isFirst = index === 0 && template === 'main-side';
    const span = isFirst ? columns : 1;
    const width = span * cardWidth + (span - 1) * gap;
    const node = createBindingNode(page, item, componentMap, width, cardHeight);
    node.x = x;
    node.y = y;
    frame.appendChild(node);

    col += span;
    x += width + gap;
    maxWidths.push(node.x + node.width);

    if (col >= columns) {
      col = 0;
      x = padding;
      y += cardHeight + gap;
    }
  });

  frame.resize(Math.max(...maxWidths, padding * 2 + columns * cardWidth + (columns - 1) * gap), y + cardHeight + padding);
  return frame;
}

async function applyLayoutPlanToCanvas(plan: LayoutPlan, page: PageDefinition) {
  await loadFonts();
  const screen = figma.createFrame();
  screen.name = `${page.name || 'Screen'} · 智能布局`;
  screen.resize(plan.screen.width || 1920, plan.screen.height || 1080);
  screen.clipsContent = false;
  screen.fills = [];
  const bgNodeId = plan.screen.background?.nodeId || lastBackgroundNodeId;
  const appliedBg = await applyBackgroundFillFromNode(bgNodeId, screen);
  if (!appliedBg) {
    screen.fills = [{ type: 'SOLID', color: hexToRgb('#0F172A') }];
  }

  const ids = new Set<string>();
  plan.regions.forEach((region) => {
    region.items.forEach((item) => {
      if (item.componentId) ids.add(item.componentId);
    });
  });
  if (plan.componentDefaults) {
    Object.keys(plan.componentDefaults).forEach((key) => {
      const id = (plan.componentDefaults as Record<string, string | null | undefined>)[key];
      if (id) ids.add(id);
    });
  }
  const componentMap = await loadComponentsByIds(Array.from(ids));
  const padding = 16;

  plan.regions.forEach((region) => {
    const frame = figma.createFrame();
    frame.name = region.name || region.id;
    frame.x = Math.round(screen.width * region.x);
    frame.y = Math.round(screen.height * region.y);
    frame.resize(
      Math.round(screen.width * region.width),
      Math.round(screen.height * region.height)
    );
    frame.clipsContent = false;
    frame.cornerRadius = 12;
    frame.paddingLeft = padding;
    frame.paddingRight = padding;
    frame.paddingTop = padding;
    frame.paddingBottom = padding;
    frame.itemSpacing = 8;
    frame.strokes = [{ type: 'SOLID', color: hexToRgb('#CBD5E1') }];
    frame.strokeWeight = 1;
    frame.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF'), opacity: 0 }];

    if (region.layout === 'horizontal') {
      frame.layoutMode = 'HORIZONTAL';
      frame.primaryAxisSizingMode = 'AUTO';
      frame.counterAxisSizingMode = 'AUTO';
    } else if (region.layout === 'vertical') {
      frame.layoutMode = 'VERTICAL';
      frame.primaryAxisSizingMode = 'AUTO';
      frame.counterAxisSizingMode = 'AUTO';
    } else {
      frame.layoutMode = 'NONE';
    }

    const regionInfoItems = region.items || [];
    if (region.layout === 'grid') {
      frame.layoutMode = 'NONE';
      layoutItemsFlow(frame, regionInfoItems, plan, componentMap, page, padding, 8);
    } else if (frame.layoutMode !== 'NONE') {
      regionInfoItems.forEach((item) => {
        const compNode = getComponentNodeForItem(item, plan, componentMap, regionInfoItems, page);
        const clone = cloneComponentWithSlots(compNode, item, plan, componentLibrary, page);
        if ('layoutAlign' in clone) {
          (clone as LayoutMixin).layoutAlign = 'STRETCH';
        }
        frame.appendChild(clone);
      });
    } else {
      // absolute fallback
      layoutItemsFlow(frame, regionInfoItems, plan, componentMap, page, padding, 8);
    }

    screen.appendChild(frame);
  });

  figma.currentPage.appendChild(screen);
  figma.currentPage.selection = [screen];
  figma.viewport.scrollAndZoomIntoView([screen]);
}

function getComponentNodeForItem(
  item: LayoutRegion['items'][number],
  plan: LayoutPlan,
  componentMap: Map<string, SceneNode>,
  items: LayoutRegion['items'],
  page: PageDefinition
): SceneNode | null {
  const info = requirementModel?.infoItems.find((i) => i.id === item.infoItemId);
  const dataType = info?.dataType || 'text';
  const pageBinding = (page.preferredBindings || []).find((b) => b.infoItemId === item.infoItemId);
  const preferred =
    item.componentId ||
    pageBinding?.componentId ||
    plan.componentDefaults?.[dataType] ||
    plan.componentDefaults?.[info?.dataType || ''] ||
    null;
  if (preferred && componentMap.has(preferred)) return componentMap.get(preferred) as SceneNode;
  const existing = componentLibrary.find((c) => c.id === preferred);
  if (existing) {
    return null;
  }
  if (componentLibrary[0]) {
    const node = componentMap.get(componentLibrary[0].id);
    if (node) return node;
  }
  return null;
}

function cloneComponentWithSlots(
  source: SceneNode | null,
  item: LayoutRegion['items'][number],
  plan: LayoutPlan,
  library: ComponentExample[],
  page: PageDefinition
): FrameNode | SceneNode {
  const info = requirementModel?.infoItems.find((i) => i.id === item.infoItemId);
  const infoName = info?.name || item.infoItemId;
  if (!source) {
    const placeholder = figma.createFrame();
    placeholder.name = `占位 · ${infoName}`;
    placeholder.layoutMode = 'VERTICAL';
    placeholder.primaryAxisSizingMode = 'AUTO';
    placeholder.counterAxisSizingMode = 'AUTO';
    placeholder.paddingLeft = 12;
    placeholder.paddingRight = 12;
    placeholder.paddingTop = 10;
    placeholder.paddingBottom = 10;
    placeholder.itemSpacing = 6;
    placeholder.strokes = [{ type: 'SOLID', color: hexToRgb('#F59E0B') }];
    placeholder.strokeWeight = 1;
    placeholder.fills = [{ type: 'SOLID', color: hexToRgb('#FFF7ED') }];
    const title = createTextNode({ type: 'text', label: infoName, color: '#9A3412', size: 12 });
    placeholder.appendChild(title);
    const desc = createTextNode({
      type: 'text',
      label: info?.description || '未绑定组件',
      color: '#9A3412',
      size: 11
    });
    placeholder.appendChild(desc);
    return placeholder;
  }

  const { clone, idMap } = cloneNodeWithMap(source);
  const compMeta = library.find((c) => c.id === (item.componentId || '') || c.nodeId === source.id);
  const pageBinding = (page.preferredBindings || []).find((b) => b.infoItemId === item.infoItemId);
  const slotBindings = item.slotBindings?.length
    ? item.slotBindings
    : pageBinding?.slotHints
    ? Object.keys(pageBinding.slotHints).map((slotName) => ({
        slotName,
        content: (pageBinding.slotHints as Record<string, string>)[slotName]
      }))
    : [];
  applySlotBindings(clone, compMeta, idMap, slotBindings, infoName, info?.description);
  return clone;
}

function cloneNodeWithMap(node: SceneNode): { clone: SceneNode; idMap: Map<string, string> } {
  const clone = node.clone();
  const idMap = new Map<string, string>();
  const walk = (a: SceneNode, b: SceneNode) => {
    idMap.set(a.id, b.id);
    if ('children' in a && 'children' in b) {
      const aChildren = (a as ChildrenMixin).children || [];
      const bChildren = (b as ChildrenMixin).children || [];
      const len = Math.min(aChildren.length, bChildren.length);
      for (let i = 0; i < len; i += 1) {
        walk(aChildren[i] as SceneNode, bChildren[i] as SceneNode);
      }
    }
  };
  walk(node, clone);
  return { clone, idMap };
}

function applySlotBindings(
  clone: SceneNode,
  compMeta: ComponentExample | undefined,
  idMap: Map<string, string>,
  bindings: SlotBinding[],
  fallbackTitle?: string,
  fallbackDesc?: string
) {
  if (!compMeta || !Array.isArray(compMeta.slots) || !compMeta.slots.length) return;
  const byName = new Map<string, ComponentSlot>();
  compMeta.slots.forEach((s) => byName.set(s.slotName, s));
  const setText = (nodeId: string, content: string) => {
    if ('findOne' in clone) {
      const target = (clone as ChildrenMixin).findOne((n) => (n as SceneNode).id === nodeId);
      if (target && target.type === 'TEXT') {
        ensureTextFontLoaded(target as TextNode);
        (target as TextNode).characters = content;
      }
    }
  };
  bindings.forEach((b) => {
    const slot = byName.get(b.slotName);
    if (!slot) return;
    const mappedId = idMap.get(slot.nodeId) || slot.nodeId;
    setText(mappedId, b.content);
  });
  if (!bindings.length && fallbackTitle) {
    const titleSlot = compMeta.slots.find((s) => s.slotType === 'label' || s.slotName === 'title');
    if (titleSlot) {
      const mappedId = idMap.get(titleSlot.nodeId) || titleSlot.nodeId;
      setText(mappedId, fallbackTitle);
    }
    const valueSlot = compMeta.slots.find((s) => s.slotType === 'numericValue');
    if (valueSlot && fallbackDesc) {
      const mappedId = idMap.get(valueSlot.nodeId) || valueSlot.nodeId;
      setText(mappedId, fallbackDesc);
    }
  }
}

function ensureTextFontLoaded(text: TextNode) {
  try {
    text.fontName = activeFont;
  } catch (_error) {
    // ignore
  }
}

function layoutItemsFlow(
  frame: FrameNode,
  items: LayoutRegion['items'],
  plan: LayoutPlan,
  componentMap: Map<string, SceneNode>,
  page: PageDefinition,
  padding: number,
  gap: number
) {
  const maxWidth = Math.max(1, frame.width - padding * 2);
  let x = padding;
  let y = padding;
  let rowHeight = 0;

  items.forEach((item) => {
    const compNode = getComponentNodeForItem(item, plan, componentMap, items, page);
    const clone = cloneComponentWithSlots(compNode, item, plan, componentLibrary, page);
    if ('resize' in clone && typeof clone.resize === 'function') {
      const desiredWidth = Math.min((clone as LayoutMixin).width, maxWidth);
      if (desiredWidth < (clone as LayoutMixin).width) {
        const ratio = desiredWidth / (clone as LayoutMixin).width;
        const desiredHeight = (clone as LayoutMixin).height * ratio;
        try {
          (clone as LayoutMixin).resize(desiredWidth, desiredHeight);
        } catch (_error) {
          // ignore
        }
      }
    }
    const nodeWidth = Math.min((clone as LayoutMixin).width, maxWidth);
    if (x > padding && x + nodeWidth > frame.width - padding) {
      x = padding;
      y += rowHeight + gap;
      rowHeight = 0;
    }
    (clone as LayoutMixin).x = x;
    (clone as LayoutMixin).y = y;
    frame.appendChild(clone);
    x += nodeWidth + gap;
    rowHeight = Math.max(rowHeight, (clone as LayoutMixin).height);
  });

  const finalHeight = y + rowHeight + padding;
  if (finalHeight > frame.height) {
    frame.resize(frame.width, finalHeight);
  }
}

async function applyBackgroundFillFromNode(nodeId: string | null | undefined, target: FrameNode) {
  if (!nodeId) return false;
  const node = (await figma.getNodeByIdAsync(nodeId)) as SceneNode | null;
  if (node && 'fills' in node) {
    const fills = (node as GeometryMixin).fills;
    if (Array.isArray(fills) && fills.length) {
      try {
        (target as GeometryMixin).fills = JSON.parse(JSON.stringify(fills)) as Paint[];
        return true;
      } catch (_error) {
        return false;
      }
    }
  }
  return false;
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

function buildFrameSnapshot(frame: FrameNode): SerializedNode {
  const maxNodes = 120;
  let count = 0;
  const walk = (node: SceneNode): SerializedNode | null => {
    if (count >= maxNodes) return null;
    count += 1;
    const snap: SerializedNode = {
      id: node.id,
      type: node.type,
      name: node.name,
      visible: 'visible' in node ? (node as GeometryMixin & SceneNode).visible !== false : true
    };
    if ('width' in node) snap.width = Math.round((node as LayoutMixin & SceneNode).width);
    if ('height' in node) snap.height = Math.round((node as LayoutMixin & SceneNode).height);
    if ('x' in node) snap.x = Math.round((node as LayoutMixin & SceneNode).x);
    if ('y' in node) snap.y = Math.round((node as LayoutMixin & SceneNode).y);
    if (node.type === 'TEXT') {
      snap.text = (node as TextNode).characters.slice(0, 200).replace(/\s+/g, ' ');
    }
    if ('children' in node) {
      const children: SerializedNode[] = [];
      for (const child of (node as ChildrenMixin).children) {
        const next = walk(child as SceneNode);
        if (next) children.push(next);
      }
      if (children.length) snap.children = children;
    }
    return snap;
  };
  return walk(frame) as SerializedNode;
}

function cloneFrameWithMapping(frame: FrameNode): { clone: FrameNode; idMap: Map<string, string> } {
  const clone = frame.clone();
  // place clone to the right
  clone.x = frame.x + frame.width + 80;
  clone.y = frame.y;
  if (frame.parent && 'appendChild' in frame.parent) {
    (frame.parent as ChildrenMixin).appendChild(clone);
  } else {
    figma.currentPage.appendChild(clone);
  }

  const idMap = new Map<string, string>();
  const walk = (source: SceneNode, target: SceneNode) => {
    idMap.set(source.id, target.id);
    if ('children' in source && 'children' in target) {
      const sourceChildren = (source as ChildrenMixin).children || [];
      const targetChildren = (target as ChildrenMixin).children || [];
      const len = Math.min(sourceChildren.length, targetChildren.length);
      for (let i = 0; i < len; i += 1) {
        walk(sourceChildren[i] as SceneNode, targetChildren[i] as SceneNode);
      }
    }
  };
  walk(frame, clone);
  return { clone, idMap };
}

function remapOperations(ops: EditOperation[], idMap: Map<string, string>): EditOperation[] {
  return ops.map((op) => {
    const mapId = (id?: string) => (id && idMap.has(id) ? (idMap.get(id) as string) : id);
    if (op.op === 'update') {
      return { ...op, targetId: mapId(op.targetId) as string };
    }
    if (op.op === 'remove') {
      return { ...op, targetId: mapId(op.targetId) as string };
    }
    if (op.op === 'reorder') {
      return { ...op, targetId: mapId(op.targetId) as string, parentId: mapId(op.parentId) };
    }
    if (op.op === 'add-text' || op.op === 'add-rectangle') {
      return { ...op, parentId: mapId(op.parentId) };
    }
    return op;
  });
}

function applyEditOperations(frame: FrameNode, operations: EditOperation[]) {
  const logs: { op: string; detail: string }[] = [];
  const findNode = (id: string): SceneNode | null => {
    if (frame.id === id) return frame;
    const found = frame.findOne((node) => (node as SceneNode).id === id);
    return (found as SceneNode) || null;
  };

  const ensureParent = (parentId?: string): ChildrenMixin => {
    if (parentId) {
      const parent = findNode(parentId);
      if (parent && 'children' in parent) return parent as unknown as ChildrenMixin;
    }
    return frame as unknown as ChildrenMixin;
  };

  operations.forEach((op) => {
    try {
      if (op.op === 'update') {
        const node = findNode(op.targetId);
        if (!node) {
          logs.push({ op: 'update', detail: `未找到 ${op.targetId}` });
          return;
        }
        if (op.props.name && 'name' in node) node.name = op.props.name;
        if (typeof op.props.visible === 'boolean' && 'visible' in node) {
          (node as BaseNodeMixin & SceneNode).visible = op.props.visible;
        }
        if (node.type === 'TEXT' && typeof op.props.text === 'string') {
          (node as TextNode).characters = op.props.text;
        }
        if ('fills' in node && op.props.fill) {
          const fills = Array.isArray((node as GeometryMixin).fills)
            ? ((node as GeometryMixin).fills as Paint[])
            : [];
          const next = fills.slice();
          next[0] = { type: 'SOLID', color: hexToRgb(op.props.fill) } as SolidPaint;
          (node as GeometryMixin).fills = next as Paint[];
        }
        if ('resize' in node) {
          const w = typeof op.props.width === 'number' ? op.props.width : (node as LayoutMixin).width;
          const h = typeof op.props.height === 'number' ? op.props.height : (node as LayoutMixin).height;
          try {
            (node as LayoutMixin).resize(w, h);
          } catch (_error) {
            // ignore resize errors
          }
        }
        if ('x' in node && typeof op.props.x === 'number') (node as LayoutMixin).x = op.props.x;
        if ('y' in node && typeof op.props.y === 'number') (node as LayoutMixin).y = op.props.y;
        logs.push({ op: 'update', detail: `更新 ${node.name || node.id}` });
      } else if (op.op === 'remove') {
        const node = findNode(op.targetId);
        if (node && 'remove' in node) {
          const name = node.name || node.id;
          node.remove();
          logs.push({ op: 'remove', detail: `删除 ${name}` });
        } else {
          logs.push({ op: 'remove', detail: `未找到 ${op.targetId}` });
        }
      } else if (op.op === 'reorder') {
        const node = findNode(op.targetId);
        const parent = ensureParent(op.parentId || (node?.parent as any)?.id);
        if (!node || !parent || !('appendChild' in parent)) {
          logs.push({ op: 'reorder', detail: `无法移动 ${op.targetId}` });
          return;
        }
        const insertIndex =
          typeof op.insertIndex === 'number'
            ? Math.max(0, Math.min(op.insertIndex, parent.children.length))
            : parent.children.length;
        (parent as ChildrenMixin).insertChild(insertIndex, node as SceneNode);
        logs.push({ op: 'reorder', detail: `移动 ${node.name || node.id}` });
      } else if (op.op === 'add-text') {
        const parent = ensureParent(op.parentId);
        const text = figma.createText();
        text.fontName = activeFont;
        text.characters = op.text || '新文本';
        if (op.fill) text.fills = [{ type: 'SOLID', color: hexToRgb(op.fill) }];
        if (typeof op.width === 'number' || typeof op.height === 'number') {
          const w = op.width || text.width;
          const h = op.height || text.height;
          try {
            text.resize(w, h);
          } catch (_error) {
            // ignore resize errors
          }
        }
        if (typeof op.x === 'number') text.x = op.x;
        if (typeof op.y === 'number') text.y = op.y;
        const idx =
          typeof op.insertIndex === 'number'
            ? Math.max(0, Math.min(op.insertIndex, parent.children.length))
            : parent.children.length;
        parent.insertChild(idx, text);
        logs.push({ op: 'add-text', detail: `新增文本 ${text.name || text.characters}` });
      } else if (op.op === 'add-rectangle') {
        const parent = ensureParent(op.parentId);
        const rect = figma.createRectangle();
        if (op.fill) rect.fills = [{ type: 'SOLID', color: hexToRgb(op.fill) }];
        rect.resize(op.width || 120, op.height || 80);
        if (typeof op.x === 'number') rect.x = op.x;
        if (typeof op.y === 'number') rect.y = op.y;
        const idx =
          typeof op.insertIndex === 'number'
            ? Math.max(0, Math.min(op.insertIndex, parent.children.length))
            : parent.children.length;
        parent.insertChild(idx, rect);
        logs.push({ op: 'add-rectangle', detail: '新增矩形' });
      }
    } catch (_error) {
      logs.push({ op: op.op, detail: `执行失败 ${op.op}` });
    }
  });

  return logs;
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

type SlotCandidate = { id: string; name: string; type: string; preview?: string; fontSize?: number };

function collectSlotCandidates(root: ChildrenMixin): SlotCandidate[] {
  const items: SlotCandidate[] = [];
  const walk = (node: SceneNode) => {
    if (node.type === 'TEXT') {
      const textNode = node as TextNode;
      items.push({
        id: node.id,
        name: node.name || 'Text',
        type: 'TEXT',
        preview: textNode.characters.slice(0, 20),
        fontSize: typeof textNode.fontSize === 'number' ? textNode.fontSize : undefined
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
      const layerStats =
        node && 'children' in node ? computeLayerStatsFromNode(node as SceneNode) : comp.layerStats;
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
        textPreviews,
        layerStats,
        infoCategory: comp.infoCategory,
        taskStageAffinity: comp.taskStageAffinity,
        priorityAffinity: comp.priorityAffinity,
        criticalitySupport: comp.criticalitySupport,
        visualFootprint: comp.visualFootprint,
        infoDensityProfile: comp.infoDensityProfile,
        recommendedMaxInstancesPerPage: comp.recommendedMaxInstancesPerPage,
        dynamicBehavior: comp.dynamicBehavior,
        layoutRole: comp.layoutRole,
        recommendedViewportZone: comp.recommendedViewportZone,
        interactionSupport: comp.interactionSupport
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
    const recViewport = Array.isArray(rec.recommendedViewportZone)
      ? rec.recommendedViewportZone[0]
      : rec.recommendedViewportZone;
    const compViewport = Array.isArray(comp.recommendedViewportZone)
      ? comp.recommendedViewportZone[0]
      : comp.recommendedViewportZone;
    const merged: ComponentExample = {
      ...comp,
      description: rec.description ?? comp.description,
      tags: mergeArrays(comp.tags, rec.tags),
      supportedDataTypes: rec.supportedDataTypes?.length
        ? Array.from(new Set(rec.supportedDataTypes))
        : comp.supportedDataTypes,
      slots: rec.slots?.length ? rec.slots : comp.slots,
      infoCategory: rec.infoCategory ?? comp.infoCategory ?? null,
      taskStageAffinity: rec.taskStageAffinity ?? comp.taskStageAffinity,
      priorityAffinity: rec.priorityAffinity ?? comp.priorityAffinity ?? 'flexible',
      criticalitySupport: rec.criticalitySupport ?? comp.criticalitySupport ?? null,
      visualFootprint: rec.visualFootprint ?? comp.visualFootprint,
      infoDensityProfile: rec.infoDensityProfile ?? comp.infoDensityProfile,
      recommendedMaxInstancesPerPage:
        typeof rec.recommendedMaxInstancesPerPage === 'number'
          ? rec.recommendedMaxInstancesPerPage
          : comp.recommendedMaxInstancesPerPage ?? null,
      dynamicBehavior: rec.dynamicBehavior ?? comp.dynamicBehavior,
      layoutRole: rec.layoutRole ?? comp.layoutRole ?? null,
      recommendedViewportZone: recViewport ?? compViewport,
      interactionSupport: mergeArrays(
        comp.interactionSupport as string[] | undefined,
        rec.interactionSupport as string[] | undefined
      ),
      lastUpdated: Date.now()
    };
    return applyComponentDefaults(merged);
  });
  return applied;
}

function mergeArrays(a?: string[], b?: string[]): string[] | undefined {
  const merged = new Set<string>();
  (a || []).forEach((v) => merged.add(v));
  (b || []).forEach((v) => merged.add(v));
  return merged.size ? Array.from(merged) : undefined;
}

function applyRecommendedBindings(result: RecommendComponentsResponse, pageIds?: string[]) {
  if (!requirementModel?.pages) return;
  const infoMap = new Map<string, InfoItem>();
  (requirementModel.infoItems || []).forEach((i) => infoMap.set(i.id, i));
  const targetPages = Array.isArray(pageIds) && pageIds.length
    ? requirementModel.pages.filter((p) => pageIds.indexOf(p.id) !== -1)
    : requirementModel.pages;

  const dataTypeComponentMap = new Map<string, string>();
  targetPages.forEach((page) => {
    (page.preferredBindings || []).forEach((b) => {
      if (!b.componentId) return;
      const info = infoMap.get(b.infoItemId);
      if (info?.dataType) dataTypeComponentMap.set(info.dataType, b.componentId);
    });
  });

  targetPages.forEach((page) => {
    const bindings = page.preferredBindings || [];
    result.bindings.forEach((rec) => {
      const info = infoMap.get(rec.infoItemId);
      const dataType = info?.dataType;
      let componentId: string | undefined = rec.componentId;
      if (!componentId && dataType && dataTypeComponentMap.has(dataType)) {
        componentId = dataTypeComponentMap.get(dataType);
      }
      const existing = bindings.find((b) => b.infoItemId === rec.infoItemId);
      if (existing) {
        existing.componentId = componentId;
        if (rec.slotHints) existing.slotHints = rec.slotHints;
      } else {
        bindings.push({ infoItemId: rec.infoItemId, componentId, slotHints: rec.slotHints });
      }
      if (dataType && componentId) dataTypeComponentMap.set(dataType, componentId);
    });
    page.preferredBindings = bindings;
  });
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

async function loadComponentsByIds(ids: string[]): Promise<Map<string, SceneNode>> {
  const map = new Map<string, SceneNode>();
  const tasks = ids.map(async (id) => {
    const node = await figma.getNodeByIdAsync(id);
    if (node && 'clone' in node) {
      map.set(id, node as SceneNode);
    }
  });
  await Promise.all(tasks);
  return map;
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

function logModelIO(
  provider: Provider,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  rawResponse: string
) {
  const limit = 1200;
  console.log(
    `[LLM Request] provider=${provider} model=${model}\nsystem_prompt:\n${truncate(
      systemPrompt,
      limit
    )}\nuser_prompt:\n${truncate(userPrompt, limit)}\nraw_response:\n${truncate(
      rawResponse,
      limit
    )}`
  );
}

function sendStatus(state: StatusMessage['state'], message?: string) {
  const payload: StatusMessage = { type: 'status', state };
  if (message) payload.message = message;
  figma.ui.postMessage(payload);
}

function sendEditStatus(state: StatusMessage['state'], message?: string) {
  figma.ui.postMessage({ type: 'edit-status', state, message });
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
    infoCategory?: InfoCategory | null;
    taskStageAffinity?: TaskStageAffinity[];
    priorityAffinity?: PriorityAffinity | null;
    criticalitySupport?: CriticalitySupport | null;
    visualFootprint?: VisualFootprint | null;
    infoDensityProfile?: InfoDensityProfile | null;
    recommendedMaxInstancesPerPage?: number | null;
    dynamicBehavior?: DynamicBehavior | null;
    layoutRole?: LayoutRole | null;
    recommendedViewportZone?: ViewportZone | ViewportZone[] | null;
    interactionSupport?: InteractionSupport[];
  }[];
};
type EditPageRequest = {
  prompt: string;
  apiKey?: string;
  provider: Provider;
  frameSnapshot: SerializedNode;
};
type LayoutPlanResponse = { plan: LayoutPlan };

async function fetchExperimentsList() {
  try {
    const items = await callExperimentsList();
    figma.ui.postMessage({ type: 'experiments-list', items });
  } catch (error) {
    console.error('[experiments] list failed', error);
    figma.ui.postMessage({
      type: 'experiments-list',
      items: [],
      error: getErrorMessage(error)
    });
  }
}

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
  const response = await fetch(`${RECO_BASE}/api/recommend-components`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ infoItems, library })
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`组件推荐失败 (${response.status}): ${raw.slice(0, 160)}`);
  }
  return JSON.parse(raw) as RecommendComponentsResponse;
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
    layerStats?: LayerStats;
    infoCategory?: InfoCategory | null;
    taskStageAffinity?: TaskStageAffinity[];
    priorityAffinity?: PriorityAffinity | null;
    criticalitySupport?: CriticalitySupport | null;
    visualFootprint?: VisualFootprint | null;
    infoDensityProfile?: InfoDensityProfile | null;
    recommendedMaxInstancesPerPage?: number | null;
    dynamicBehavior?: DynamicBehavior | null;
    layoutRole?: LayoutRole | null;
    recommendedViewportZone?: ViewportZone | ViewportZone[] | null;
    interactionSupport?: InteractionSupport[];
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

async function callExperimentsList(): Promise<ExperimentSummary[]> {
  const response = await fetch(`${API_BASE}/api/experiments`);
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`实验场景列表获取失败 (${response.status}): ${truncate(raw)}`);
  }
  const data = JSON.parse(raw);
  return Array.isArray(data?.items) ? (data.items as ExperimentSummary[]) : [];
}

async function callExperimentDetail(experimentId: string): Promise<ExperimentDetail> {
  const response = await fetch(`${API_BASE}/api/experiments/${encodeURIComponent(experimentId)}`);
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`实验场景获取失败 (${response.status}): ${truncate(raw)}`);
  }
  return JSON.parse(raw) as ExperimentDetail;
}

async function callEditPage(payload: EditPageRequest): Promise<EditApiResponse> {
  const response = await fetch(`${EDIT_BASE}/api/edit-page`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`编辑接口失败 (${response.status}): ${truncate(raw)}`);
  }
  const data = safeJsonParse<EditApiResponse>(raw);
  if (!data || !Array.isArray(data.operations)) {
    throw new Error('编辑接口返回格式不正确');
  }
  return data;
}

async function callLayoutPlan(payload: {
  page: PageDefinition;
  requirement: RequirementModel;
  library: ComponentExample[];
  screenType?: string;
  backgroundNodeId?: string | null;
}): Promise<LayoutPlan> {
  const response = await fetch(`${API_BASE}/api/layout-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      page: payload.page,
      requirement: payload.requirement,
      library: payload.library,
      screenType: payload.screenType,
      background: { nodeId: payload.backgroundNodeId }
    })
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`布局方案获取失败 (${response.status}): ${truncate(raw)}`);
  }
  const data = JSON.parse(raw) as LayoutPlanResponse;
  if (!data?.plan?.screen || !Array.isArray(data?.plan?.regions)) {
    throw new Error('布局方案格式不正确');
  }
  return data.plan;
}

async function handleLoadExperiment(experimentId: string) {
  const id = (experimentId || '').trim();
  if (!id) {
    figma.ui.postMessage({ type: 'load-experiment-error', message: '缺少实验场景 ID' });
    return;
  }
  try {
    const detail = await callExperimentDetail(id);
    const nextRequirement = {
      ...detail.requirement,
      updatedAt: detail.requirement?.updatedAt ?? Date.now()
    } as RequirementModel;
    await persistRequirement(nextRequirement);
    sendRequirementToUI();
    componentLibrary = Array.isArray(detail.library)
      ? detail.library.map(applyComponentDefaults)
      : [];
    await persistLibrary();
    currentExperimentId = detail.id;
    lastLayoutPlans = {};
    if (detail.layoutPlan && detail.layoutPlanPageId) {
      lastLayoutPlans[detail.layoutPlanPageId] = detail.layoutPlan;
    figma.ui.postMessage({
      type: 'layout-plan',
      plans: [{ pageId: detail.layoutPlanPageId, plan: detail.layoutPlan }],
      fromExperiment: true
    });
    }
    figma.ui.postMessage({
      type: 'experiment-loaded',
      id: detail.id,
      name: detail.name,
      description: detail.description
    });
  } catch (error) {
    console.error('[experiments] load failed', error);
    figma.ui.postMessage({
      type: 'load-experiment-error',
      message: getErrorMessage(error)
    });
  }
}

async function handleGenerateLayoutPlan(msg: GenerateLayoutPlanMessage) {
  if (!requirementModel) {
    figma.ui.postMessage({ type: 'layout-plan-error', message: '请先解析需求或加载场景' });
    return;
  }
  const targets =
    (Array.isArray(msg.pageIds) && msg.pageIds.length
      ? msg.pageIds
      : msg.pageId
      ? [msg.pageId]
      : []).map((id) => requirementModel?.pages.find((p) => p.id === id)).filter(Boolean) as PageDefinition[];
  const pages = targets.length ? targets : requirementModel.pages.slice(0, 1);
  if (!pages.length) {
    figma.ui.postMessage({ type: 'layout-plan-error', message: '未找到页面' });
    return;
  }
  try {
    sendStatus('loading', '生成布局方案中');
    const plans: { pageId: string; plan: LayoutPlan }[] = [];
    for (const page of pages) {
      const plan = await callLayoutPlan({
        page,
        requirement: requirementModel,
        library: componentLibrary,
        screenType: msg.screenType,
        backgroundNodeId: msg.backgroundNodeId || lastBackgroundNodeId
      });
      plans.push({ pageId: page.id, plan });
      lastLayoutPlans[page.id] = plan;
    }
    lastBackgroundNodeId = msg.backgroundNodeId || lastBackgroundNodeId;
    figma.ui.postMessage({ type: 'layout-plan', plans });
    sendStatus('success', '已生成布局方案');
  } catch (error) {
    figma.ui.postMessage({ type: 'layout-plan-error', message: getErrorMessage(error) });
    sendStatus('error', getErrorMessage(error));
  } finally {
    sendStatus('idle');
  }
}

async function handleApplyLayoutPlan(msg?: ApplyLayoutPlanMessage) {
  if (!requirementModel || !Object.keys(lastLayoutPlans).length) {
    figma.notify('请先生成布局方案');
    figma.ui.postMessage({ type: 'layout-plan-error', message: '未找到布局方案' });
    return;
  }
  const pageIds =
    (msg?.pageIds && msg.pageIds.length
      ? msg.pageIds
      : Object.keys(lastLayoutPlans)) || [];
  const targets = requirementModel.pages.filter((p) => pageIds.indexOf(p.id) !== -1);
  if (!targets.length) {
    figma.ui.postMessage({ type: 'layout-plan-error', message: '页面不存在' });
    return;
  }
  try {
    sendStatus('loading', '生成布局到画布');
    for (const page of targets) {
      const plan = lastLayoutPlans[page.id];
      if (!plan) continue;
      await applyLayoutPlanToCanvas(plan, page);
    }
    figma.ui.postMessage({ type: 'layout-plan-applied', pageIds });
    sendStatus('success', '已生成到画布');
  } catch (error) {
    figma.notify(`生成失败：${getErrorMessage(error)}`);
    figma.ui.postMessage({ type: 'layout-plan-error', message: getErrorMessage(error) });
    sendStatus('error', getErrorMessage(error));
  } finally {
    sendStatus('idle');
  }
}

async function handleSetBackgroundFromSelection() {
  const selection = figma.currentPage.selection;
  const node = selection.find((n) => 'fills' in n);
  if (!node) {
    figma.ui.postMessage({ type: 'background-select-error', message: '请选择含填充的节点' });
    return;
  }
  lastBackgroundNodeId = node.id;
  figma.ui.postMessage({
    type: 'background-selected',
    nodeId: node.id,
    name: node.name || '背景节点'
  });
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
