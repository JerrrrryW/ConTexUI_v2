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
        infoCategory: 'metric',
        taskStageAffinity: ['overview', 'monitoring'],
        priorityAffinity: 'high',
        criticalitySupport: 'good',
        visualFootprint: 'medium',
        infoDensityProfile: 'normal',
        recommendedMaxInstancesPerPage: 3,
        dynamicBehavior: 'frequent-update',
        layoutRole: 'summary',
        recommendedViewportZone: 'top-left',
        interactionSupport: ['hover', 'drilldown'],
        layerStats: {
          textNodeCount: 3,
          shapeNodeCount: 2,
          groupDepth: 3,
          autoLayoutEnabled: true,
          dominantFontSize: 16,
          colorChannelCount: 2
        },
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
        infoCategory: 'metric',
        taskStageAffinity: ['overview', 'monitoring'],
        priorityAffinity: 'high',
        criticalitySupport: 'good',
        visualFootprint: 'medium',
        infoDensityProfile: 'normal',
        recommendedMaxInstancesPerPage: 3,
        dynamicBehavior: 'frequent-update',
        layoutRole: 'summary',
        recommendedViewportZone: 'top-left',
        interactionSupport: ['hover', 'drilldown'],
        layerStats: {
          textNodeCount: 3,
          shapeNodeCount: 2,
          groupDepth: 3,
          autoLayoutEnabled: true,
          dominantFontSize: 16,
          colorChannelCount: 2
        },
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
        infoCategory: 'status',
        taskStageAffinity: ['overview', 'monitoring'],
        priorityAffinity: 'medium',
        criticalitySupport: 'limited',
        visualFootprint: 'medium',
        infoDensityProfile: 'normal',
        recommendedMaxInstancesPerPage: 4,
        dynamicBehavior: 'frequent-update',
        layoutRole: 'summary',
        recommendedViewportZone: 'top',
        interactionSupport: ['hover'],
        layerStats: {
          textNodeCount: 2,
          shapeNodeCount: 2,
          groupDepth: 3,
          autoLayoutEnabled: true,
          dominantFontSize: 15,
          colorChannelCount: 2
        },
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
        infoCategory: 'alert',
        taskStageAffinity: ['monitoring', 'investigation'],
        priorityAffinity: 'high',
        criticalitySupport: 'good',
        visualFootprint: 'large',
        infoDensityProfile: 'dense',
        recommendedMaxInstancesPerPage: 1,
        dynamicBehavior: 'event-driven',
        layoutRole: 'hero',
        recommendedViewportZone: 'center',
        interactionSupport: ['click-filter', 'drilldown'],
        layerStats: {
          textNodeCount: 6,
          shapeNodeCount: 3,
          groupDepth: 4,
          autoLayoutEnabled: true,
          dominantFontSize: 13,
          colorChannelCount: 3
        },
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
        infoCategory: 'context',
        taskStageAffinity: ['overview', 'monitoring'],
        priorityAffinity: 'medium',
        criticalitySupport: 'limited',
        visualFootprint: 'medium',
        infoDensityProfile: 'normal',
        recommendedMaxInstancesPerPage: 2,
        dynamicBehavior: 'event-driven',
        layoutRole: 'sidebar',
        recommendedViewportZone: 'top',
        interactionSupport: ['hover'],
        layerStats: {
          textNodeCount: 3,
          shapeNodeCount: 2,
          groupDepth: 3,
          autoLayoutEnabled: true,
          dominantFontSize: 14,
          colorChannelCount: 2
        },
        slots: [
          { slotName: 'title', slotType: 'label', nodeId: 'exp-node-weather-title', dataType: 'text' },
          { slotName: 'status', slotType: 'state', nodeId: 'exp-node-weather-state', dataType: 'state' }
        ],
        lastUpdated: Date.now()
      }
    ]
  },
  {
    id: 'exp-prod-safety-v1',
    name: '再生橡胶工厂生产与安全监控总览',
    description: '基于当前组件库的高信息密度生产+安全总览场景，用于值班员界面布局评估。',
    requirement: {
      "phases": [
        {
          "id": "phase_overview",
          "name": "生产与安全总览",
          "description": "值班期间的整体态势感知与关键产量、安全类 KPI 监控。"
        },
        {
          "id": "phase_monitoring",
          "name": "实时监控与巡检",
          "description": "班中持续巡检各车间产量与设备运行状态，关注异常波动。"
        },
        {
          "id": "phase_investigation",
          "name": "异常排查与分析",
          "description": "出现告警或异常时，对关键产线和环保指标进行深入分析。"
        }
      ],
      "roles": [
        {
          "id": "role_operator",
          "name": "生产监控值班员",
          "description": "中控室一线值班员，负责实时监控生产与安全指标。"
        },
        {
          "id": "role_supervisor",
          "name": "班组长/主管",
          "description": "关注整体产量、能效与安全 KPI 达成情况。"
        }
      ],
      "conditions": [
        {
          "id": "cond_normal",
          "name": "正常生产",
          "description": "产量在计划区间，无重大安全和环保告警。"
        },
        {
          "id": "cond_alert",
          "name": "告警放大",
          "description": "存在重要安全或环保告警，需要放大相关信息。"
        }
      ],
      "infoItems": [
        {
          "id": "info_total_output",
          "name": "当日产量总计",
          "description": "显示当日全厂实际总产量及与计划产量的对比/完成率。",
          "dataType": "numeric",
          "semanticTags": ["production", "kpi", "total", "output", "完成率", "日"]
        },
        {
          "id": "info_production_trend",
          "name": "生产趋势（按月）",
          "description": "按月展示生产总量的时间序列趋势，用于观察波动和季节性变化。",
          "dataType": "trend",
          "semanticTags": ["production", "trend", "time-series", "monthly", "趋势分析"]
        },
        {
          "id": "info_output_breakdown_by_product",
          "name": "产量构成（按产品）",
          "description": "按产品类别细分的产量及占比，用于分析不同产品线的贡献。",
          "dataType": "list",
          "semanticTags": ["production", "breakdown", "category", "product", "产量分解"]
        },
        {
          "id": "info_high_strength_line_a",
          "name": "高强力再生胶产线 A 产能与完成情况",
          "description": "高强力再生胶产线 A 的实际产量、产能与完成率。",
          "dataType": "numeric",
          "semanticTags": ["production", "line", "capacity", "output", "高强力再生胶", "A线"]
        },
        {
          "id": "info_high_strength_line_b",
          "name": "高强力再生胶产线 B 产能与完成情况",
          "description": "高强力再生胶另一条产线或时段的实际产量、产能与完成率。",
          "dataType": "numeric",
          "semanticTags": ["production", "line", "capacity", "output", "高强力再生胶", "B线"]
        },
        {
          "id": "info_intelligent_workshop_output",
          "name": "智能化车间日产量及建设状态",
          "description": "智能化生产车间的日产量以及建设/投产状态。",
          "dataType": "numeric",
          "semanticTags": ["production", "workshop", "smart", "daily-output", "在建项目"]
        },
        {
          "id": "info_milling_workshop_output",
          "name": "磨粉车间日产量及运行状态",
          "description": "磨粉车间的日产量及当前运行状态（正常/停机/故障）。",
          "dataType": "numeric",
          "semanticTags": ["production", "workshop", "milling", "daily-output", "运行状态"]
        },
        {
          "id": "info_avg_capacity_utilization",
          "name": "平均产能利用率",
          "description": "全厂平均产能利用率关键指标，可反映整体效率水平。",
          "dataType": "numeric",
          "semanticTags": ["production", "capacity", "utilization", "efficiency", "kpi"]
        },
        {
          "id": "info_noise_control_compliance",
          "name": "噪声控制达标率",
          "description": "环保噪声控制相关指标的达标率，用于环保合规监控。",
          "dataType": "numeric",
          "semanticTags": ["environment", "noise", "compliance", "达标率", "环保"]
        },
        {
          "id": "info_safety_days",
          "name": "连续安全生产天数",
          "description": "最近一次事故以来的连续安全生产天数及目标完成情况。",
          "dataType": "numeric",
          "semanticTags": ["safety", "days", "事故", "连续安全天数", "kpi"]
        },
        {
          "id": "info_fire_system_status",
          "name": "消防设备运行状态摘要",
          "description": "消防系统整体运行状态摘要，例如正常率、存在故障的子系统数量。",
          "dataType": "state",
          "semanticTags": ["safety", "fire", "status", "消防设备", "安全系统"]
        },
        {
          "id": "info_workshop_labels",
          "name": "车间位置标签",
          "description": "用于标记不同车间位置或区块的标签/标识。",
          "dataType": "text",
          "semanticTags": ["workshop", "label", "位置", "车间名称"]
        },
        {
          "id": "info_main_business",
          "name": "公司主营业务简介",
          "description": "公司主营业务范围的简要说明，用于大屏背景信息展示。",
          "dataType": "text",
          "semanticTags": ["context", "company", "主营业务", "简介"]
        }
      ],
      "pages": [
        {
          "id": "page_overview_main",
          "phaseId": "phase_overview",
          "roleId": "role_operator",
          "conditionId": "cond_normal",
          "name": "生产与安全总览页",
          "notes": "值班员首屏查看的综合总览，高信息密度呈现关键安全与产量指标。",
          "infoPriorities": [
            {
              "infoItemId": "info_safety_days",
              "priority": 1,
              "note": "安全生产连续天数作为首要安全 KPI，在页面 hero 区域突出展示。"
            },
            {
              "infoItemId": "info_total_output",
              "priority": 3,
              "note": "当日产量总计是生产维度最核心指标，位于顶部主区域。"
            },
            {
              "infoItemId": "info_avg_capacity_utilization",
              "priority": 5,
              "note": "平均产能利用率反映整体效率，与总产量并列为核心 KPI。"
            },
            {
              "infoItemId": "info_fire_system_status",
              "priority": 5,
              "note": "消防设备状态简要提示，需在总览中始终可见。"
            },
            {
              "infoItemId": "info_noise_control_compliance",
              "priority": 7,
              "note": "环保达标率需要在总览页中可见，但优先级低于产量与安全 KPI。"
            },
            {
              "infoItemId": "info_high_strength_line_a",
              "priority": 7,
              "note": "关键产线 A 的综合指标，在总览页给出简要卡片。"
            },
            {
              "infoItemId": "info_intelligent_workshop_output",
              "priority": 9,
              "note": "智能化车间作为重点项目，给出摘要信息。"
            },
            {
              "infoItemId": "info_milling_workshop_output",
              "priority": 9,
              "note": "磨粉车间日产量/状态作为补充产线信息。"
            },
            {
              "infoItemId": "info_main_business",
              "priority": 9,
              "note": "主营业务简介放在边缘/底部区域，提供上下文但不干扰监控。"
            }
          ]
        },
        {
          "id": "page_line_detail",
          "phaseId": "phase_monitoring",
          "roleId": "role_operator",
          "conditionId": "cond_normal",
          "name": "关键产线与构成详情页",
          "notes": "用于巡检高强力再生胶等关键产线的产量与构成，高密度展示多条产线与产品构成。",
          "infoPriorities": [
            {
              "infoItemId": "info_high_strength_line_a",
              "priority": 1,
              "note": "产线 A 作为主线，位于此页的首要位置。"
            },
            {
              "infoItemId": "info_high_strength_line_b",
              "priority": 3,
              "note": "产线 B 指标与 A 并列展示，用于比较。"
            },
            {
              "infoItemId": "info_output_breakdown_by_product",
              "priority": 5,
              "note": "产量构成（按产品）支持观察不同产品的贡献，放在主要区域。"
            },
            {
              "infoItemId": "info_production_trend",
              "priority": 5,
              "note": "近期生产趋势作为背景信息支撑判断产线表现。"
            },
            {
              "infoItemId": "info_intelligent_workshop_output",
              "priority": 7,
              "note": "智能化车间的详细卡片，位于右侧或下部。"
            },
            {
              "infoItemId": "info_milling_workshop_output",
              "priority": 7,
              "note": "磨粉车间输出详情，与其他车间卡片组成网格。"
            },
            {
              "infoItemId": "info_avg_capacity_utilization",
              "priority": 9,
              "note": "产能利用率在本页作为补充指标出现一次。"
            },
            {
              "infoItemId": "info_workshop_labels",
              "priority": 9,
              "note": "车间位置标签搭配车间卡片或简易示意图使用。"
            }
          ]
        },
        {
          "id": "page_env_safety",
          "phaseId": "phase_monitoring",
          "roleId": "role_operator",
          "conditionId": "cond_alert",
          "name": "环保与安全监控页",
          "notes": "在存在环保或安全告警时重点关注的界面，放大显示噪声控制、消防系统状态等信息。",
          "infoPriorities": [
            {
              "infoItemId": "info_fire_system_status",
              "priority": 1,
              "note": "消防设备状态在告警场景下需要首屏放大显示。"
            },
            {
              "infoItemId": "info_noise_control_compliance",
              "priority": 3,
              "note": "噪声控制达标率作为环保核心指标，放在主区域。"
            },
            {
              "infoItemId": "info_safety_days",
              "priority": 5,
              "note": "连续安全天数在此页作为安全背景信息，同时辅助评估风险趋势。"
            },
            {
              "infoItemId": "info_production_trend",
              "priority": 7,
              "note": "在安全/环保视角下，仅需提供生产趋势作背景参考。"
            },
            {
              "infoItemId": "info_avg_capacity_utilization",
              "priority": 7,
              "note": "产能利用率在此页的优先级低于安全/环保指标。"
            }
          ]
        }
      ]
    }
    ,
    // library 建议直接使用你刚才导出的 items 数组
    library: [
      {
      "id": "2023:1472",
      "nodeId": "2023:1472",
      "sectionId": "2026:1496",
      "name": "Frame 184",
      "width": 364,
      "height": 131,
      "sampleText": "主营业务",
      "note": "",
      "description": "主营业务范围说明，展示公司核心业务领域",
      "tags": [
        "主营业务",
        "业务范围",
        "文本说明",
        "公司概况"
      ],
      "supportedDataTypes": [
        "text"
      ],
      "slots": [
        {
          "slotName": "businessText",
          "slotType": "text",
          "nodeId": "2023:1474",
          "dataType": "text"
        },
        {
          "slotName": "details",
          "slotType": "text",
          "nodeId": "2023:1475",
          "dataType": "text"
        }
      ],
      "layerStats": {
        "textNodeCount": 2,
        "shapeNodeCount": 4,
        "groupDepth": 4,
        "autoLayoutEnabled": false,
        "dominantFontSize": 17,
        "colorChannelCount": 3
      },
      "lastUpdated": 1764845394473,
      "taskStageAffinity": [
        "overview",
        "monitoring"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "normal",
      "recommendedMaxInstancesPerPage": 1,
      "infoCategory": "context",
      "criticalitySupport": "not-suitable",
      "dynamicBehavior": "static",
      "layoutRole": "sidebar",
      "recommendedViewportZone": "top-left"
    },
    {
      "id": "2003:1554",
      "nodeId": "2003:1554",
      "sectionId": "2026:1496",
      "name": "Frame 184",
      "width": 364,
      "height": 196,
      "note": "",
      "description": "空白容器或占位框架，无内容填充",
      "tags": [
        "容器",
        "占位符",
        "布局结构"
      ],
      "supportedDataTypes": [],
      "slots": [],
      "layerStats": {
        "textNodeCount": 0,
        "shapeNodeCount": 1,
        "groupDepth": 2,
        "autoLayoutEnabled": false,
        "colorChannelCount": 1
      },
      "lastUpdated": 1764839738285,
      "taskStageAffinity": [],
      "interactionSupport": [],
      "priorityAffinity": "flexible",
      "visualFootprint": "medium",
      "infoDensityProfile": "sparse",
      "recommendedMaxInstancesPerPage": null,
      "infoCategory": "composite",
      "criticalitySupport": "not-suitable",
      "dynamicBehavior": "static",
      "layoutRole": "inline",
      "recommendedViewportZone": "any"
    },
    {
      "id": "2003:1555",
      "nodeId": "2003:1555",
      "sectionId": "2026:1496",
      "name": "Frame 185",
      "width": 364,
      "height": 192,
      "sampleText": "总产量",
      "note": "",
      "description": "总产量关键指标展示，含产量数值与完成率",
      "tags": [
        "产量",
        "完成率",
        "KPI",
        "生产指标"
      ],
      "supportedDataTypes": [
        "numeric",
        "trend"
      ],
      "slots": [
        {
          "slotName": "metricLabel",
          "slotType": "text",
          "nodeId": "2003:1486",
          "dataType": "text"
        },
        {
          "slotName": "value",
          "slotType": "numeric",
          "nodeId": "2003:1487",
          "dataType": "numeric"
        },
        {
          "slotName": "unit",
          "slotType": "text",
          "nodeId": "2003:1488",
          "dataType": "text"
        },
        {
          "slotName": "rateLabel",
          "slotType": "text",
          "nodeId": "2003:1498",
          "dataType": "text"
        },
        {
          "slotName": "completionRate",
          "slotType": "trend",
          "nodeId": "2003:1499",
          "dataType": "trend"
        }
      ],
      "layerStats": {
        "textNodeCount": 5,
        "shapeNodeCount": 4,
        "groupDepth": 3,
        "autoLayoutEnabled": false,
        "dominantFontSize": 20,
        "colorChannelCount": 3
      },
      "lastUpdated": 1764839738285,
      "taskStageAffinity": [
        "overview",
        "monitoring"
      ],
      "interactionSupport": [
        "drilldown",
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "medium",
      "infoDensityProfile": "dense",
      "recommendedMaxInstancesPerPage": 3,
      "infoCategory": "metric",
      "criticalitySupport": "good",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "summary",
      "recommendedViewportZone": "top"
    },
    {
      "id": "2003:1504",
      "nodeId": "2003:1504",
      "sectionId": "2026:1496",
      "name": "Frame 55",
      "width": 287,
      "height": 141,
      "sampleText": "1,431.2",
      "note": "",
      "description": "总产量细分构成，展示不同产品类别的产量分布",
      "tags": [
        "产量分解",
        "产品构成",
        "分类统计",
        "再生胶"
      ],
      "supportedDataTypes": [
        "list",
        "numeric"
      ],
      "slots": [
        {
          "slotName": "totalValue",
          "slotType": "numeric",
          "nodeId": "2003:1510",
          "dataType": "numeric"
        },
        {
          "slotName": "metricUnit",
          "slotType": "text",
          "nodeId": "2003:1511",
          "dataType": "text"
        },
        {
          "slotName": "productTypes",
          "slotType": "list",
          "nodeId": "2003:1516,2003:1519,2003:1522,2003:1525",
          "dataType": "text"
        }
      ],
      "layerStats": {
        "textNodeCount": 6,
        "shapeNodeCount": 8,
        "groupDepth": 5,
        "autoLayoutEnabled": true,
        "dominantFontSize": 16,
        "colorChannelCount": 5
      },
      "lastUpdated": 1764839738285,
      "taskStageAffinity": [
        "drilldown",
        "investigation"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "dense",
      "recommendedMaxInstancesPerPage": 4,
      "infoCategory": "metric",
      "criticalitySupport": "limited",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "sidebar",
      "recommendedViewportZone": "center"
    },
    {
      "id": "2026:1497",
      "nodeId": "2026:1497",
      "sectionId": "2026:1496",
      "name": "Frame 194",
      "width": 176,
      "height": 181,
      "sampleText": "192",
      "note": "",
      "description": "高强力再生胶产能与完成情况，含实际产量、产能和完成率",
      "tags": [
        "产能",
        "完成率",
        "高强力再生胶",
        "生产执行"
      ],
      "supportedDataTypes": [
        "numeric",
        "trend",
        "state"
      ],
      "slots": [
        {
          "slotName": "actualOutput",
          "slotType": "numeric",
          "nodeId": "2003:1489",
          "dataType": "numeric"
        },
        {
          "slotName": "unit",
          "slotType": "text",
          "nodeId": "2003:1492",
          "dataType": "text"
        },
        {
          "slotName": "productType",
          "slotType": "text",
          "nodeId": "2003:1528",
          "dataType": "text"
        },
        {
          "slotName": "capacityLabel",
          "slotType": "text",
          "nodeId": "2003:1531",
          "dataType": "text"
        },
        {
          "slotName": "capacityValue",
          "slotType": "numeric",
          "nodeId": "2003:1532",
          "dataType": "numeric"
        },
        {
          "slotName": "completionLabel",
          "slotType": "text",
          "nodeId": "2003:1537",
          "dataType": "text"
        },
        {
          "slotName": "completionRate",
          "slotType": "trend",
          "nodeId": "2003:1538",
          "dataType": "trend"
        }
      ],
      "layerStats": {
        "textNodeCount": 7,
        "shapeNodeCount": 2,
        "groupDepth": 2,
        "autoLayoutEnabled": false,
        "dominantFontSize": 16,
        "colorChannelCount": 2
      },
      "lastUpdated": 1764839738285,
      "taskStageAffinity": [
        "monitoring",
        "drilldown"
      ],
      "interactionSupport": [
        "drilldown",
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "dense",
      "recommendedMaxInstancesPerPage": 6,
      "infoCategory": "metric",
      "criticalitySupport": "good",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "summary",
      "recommendedViewportZone": "center"
    },
    {
      "id": "2003:1556",
      "nodeId": "2003:1556",
      "sectionId": "2026:1496",
      "name": "Frame 186",
      "width": 176,
      "height": 181,
      "sampleText": "153.6",
      "note": "",
      "description": "高强力再生胶另一产线或时段的产能与完成情况",
      "tags": [
        "产能",
        "完成率",
        "高强力再生胶",
        "生产执行"
      ],
      "supportedDataTypes": [
        "numeric",
        "trend",
        "state"
      ],
      "slots": [
        {
          "slotName": "actualOutput",
          "slotType": "numeric",
          "nodeId": "2003:1493",
          "dataType": "numeric"
        },
        {
          "slotName": "unit",
          "slotType": "text",
          "nodeId": "2003:1497",
          "dataType": "text"
        },
        {
          "slotName": "productType",
          "slotType": "text",
          "nodeId": "2003:1529",
          "dataType": "text"
        },
        {
          "slotName": "capacityLabel",
          "slotType": "text",
          "nodeId": "2003:1534",
          "dataType": "text"
        },
        {
          "slotName": "capacityValue",
          "slotType": "numeric",
          "nodeId": "2003:1535",
          "dataType": "numeric"
        },
        {
          "slotName": "completionLabel",
          "slotType": "text",
          "nodeId": "2003:1540",
          "dataType": "text"
        },
        {
          "slotName": "completionRate",
          "slotType": "trend",
          "nodeId": "2003:1541",
          "dataType": "trend"
        }
      ],
      "layerStats": {
        "textNodeCount": 7,
        "shapeNodeCount": 2,
        "groupDepth": 3,
        "autoLayoutEnabled": true,
        "dominantFontSize": 16,
        "colorChannelCount": 2
      },
      "lastUpdated": 1764839738285,
      "taskStageAffinity": [
        "monitoring",
        "drilldown"
      ],
      "interactionSupport": [
        "drilldown",
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "dense",
      "recommendedMaxInstancesPerPage": 6,
      "infoCategory": "metric",
      "criticalitySupport": "good",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "summary",
      "recommendedViewportZone": "center"
    },
    {
      "id": "2003:1543",
      "nodeId": "2003:1543",
      "sectionId": "2026:1496",
      "name": "Frame 183",
      "width": 364,
      "height": 180,
      "sampleText": "生产趋势分析",
      "note": "",
      "description": "生产趋势概览，显示特定月份产量及数值",
      "tags": [
        "生产趋势",
        "月度产量",
        "趋势分析",
        "时间序列"
      ],
      "supportedDataTypes": [
        "trend",
        "numeric"
      ],
      "slots": [
        {
          "slotName": "title",
          "slotType": "text",
          "nodeId": "2003:1545",
          "dataType": "text"
        },
        {
          "slotName": "month",
          "slotType": "text",
          "nodeId": "2003:1546",
          "dataType": "text"
        },
        {
          "slotName": "outputValue",
          "slotType": "numeric",
          "nodeId": "2003:1547",
          "dataType": "numeric"
        }
      ],
      "layerStats": {
        "textNodeCount": 3,
        "shapeNodeCount": 3,
        "groupDepth": 2,
        "autoLayoutEnabled": false,
        "dominantFontSize": 14,
        "colorChannelCount": 2
      },
      "lastUpdated": 1764839738285,
      "taskStageAffinity": [
        "overview",
        "monitoring"
      ],
      "interactionSupport": [
        "drilldown"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "medium",
      "infoDensityProfile": "normal",
      "recommendedMaxInstancesPerPage": 2,
      "infoCategory": "trend",
      "criticalitySupport": "limited",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "summary",
      "recommendedViewportZone": "top"
    },
    {
      "id": "2003:1557",
      "nodeId": "2003:1557",
      "sectionId": "2026:1496",
      "name": "Frame 187",
      "width": 175,
      "height": 154,
      "sampleText": "9月",
      "note": "",
      "description": "某月产量及环比增长率展示",
      "tags": [
        "月产量",
        "增长率",
        "环比分析",
        "产量波动"
      ],
      "supportedDataTypes": [
        "numeric",
        "trend"
      ],
      "slots": [
        {
          "slotName": "month",
          "slotType": "text",
          "nodeId": "2003:1482",
          "dataType": "text"
        },
        {
          "slotName": "outputValue",
          "slotType": "numeric",
          "nodeId": "2003:1490",
          "dataType": "numeric"
        },
        {
          "slotName": "unit",
          "slotType": "text",
          "nodeId": "2003:1494",
          "dataType": "text"
        },
        {
          "slotName": "growthRate",
          "slotType": "trend",
          "nodeId": "2003:1495",
          "dataType": "trend"
        }
      ],
      "layerStats": {
        "textNodeCount": 4,
        "shapeNodeCount": 2,
        "groupDepth": 2,
        "autoLayoutEnabled": false,
        "dominantFontSize": 21,
        "colorChannelCount": 3
      },
      "lastUpdated": 1764839738285,
      "taskStageAffinity": [
        "monitoring",
        "investigation"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "normal",
      "recommendedMaxInstancesPerPage": 6,
      "infoCategory": "trend",
      "criticalitySupport": "limited",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "summary",
      "recommendedViewportZone": "center"
    },
    {
      "id": "2004:1470",
      "nodeId": "2004:1470",
      "sectionId": "2026:1496",
      "name": "Frame 85",
      "width": 176,
      "height": 158,
      "sampleText": "138.5",
      "note": "",
      "description": "智能化生产车间日产量及建设状态",
      "tags": [
        "日产量",
        "智能化车间",
        "在建项目",
        "生产状态"
      ],
      "supportedDataTypes": [
        "numeric",
        "state"
      ],
      "slots": [
        {
          "slotName": "dailyOutput",
          "slotType": "numeric",
          "nodeId": "2004:1472",
          "dataType": "numeric"
        },
        {
          "slotName": "unit",
          "slotType": "text",
          "nodeId": "2004:1473",
          "dataType": "text"
        },
        {
          "slotName": "workshopName",
          "slotType": "text",
          "nodeId": "2004:1474",
          "dataType": "text"
        },
        {
          "slotName": "constructionStatus",
          "slotType": "state",
          "nodeId": "2004:1478",
          "dataType": "state"
        }
      ],
      "layerStats": {
        "textNodeCount": 4,
        "shapeNodeCount": 2,
        "groupDepth": 3,
        "autoLayoutEnabled": true,
        "dominantFontSize": 20,
        "colorChannelCount": 4
      },
      "lastUpdated": 1764839738285,
      "taskStageAffinity": [
        "monitoring",
        "drilldown"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "normal",
      "recommendedMaxInstancesPerPage": 4,
      "infoCategory": "metric",
      "criticalitySupport": "limited",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "sidebar",
      "recommendedViewportZone": "center"
    },
    {
      "id": "2002:1517",
      "nodeId": "2002:1517",
      "sectionId": "2026:1496",
      "name": "Frame 171",
      "width": 135,
      "height": 111,
      "sampleText": "环保车间3",
      "note": "",
      "description": "环保车间标识名称展示",
      "tags": [
        "车间名称",
        "环保车间",
        "标识",
        "位置标签"
      ],
      "supportedDataTypes": [
        "text",
        "state"
      ],
      "slots": [
        {
          "slotName": "workshopName",
          "slotType": "text",
          "nodeId": "2002:1521",
          "dataType": "text"
        }
      ],
      "layerStats": {
        "textNodeCount": 1,
        "shapeNodeCount": 2,
        "groupDepth": 3,
        "autoLayoutEnabled": true,
        "dominantFontSize": 18,
        "colorChannelCount": 2
      },
      "lastUpdated": 1764839738285,
      "taskStageAffinity": [
        "overview"
      ],
      "interactionSupport": [],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "sparse",
      "recommendedMaxInstancesPerPage": 8,
      "infoCategory": "context",
      "criticalitySupport": "not-suitable",
      "dynamicBehavior": "static",
      "layoutRole": "inline",
      "recommendedViewportZone": "any"
    },
    {
      "id": "2002:1508",
      "nodeId": "2002:1508",
      "sectionId": "2026:1496",
      "name": "Frame 79",
      "width": 176,
      "height": 158,
      "sampleText": "73.2",
      "note": "",
      "description": "磨粉车间日产量及运行状态",
      "tags": [
        "日产量",
        "磨粉车间",
        "运行状态",
        "生产监控"
      ],
      "supportedDataTypes": [
        "numeric",
        "state"
      ],
      "slots": [
        {
          "slotName": "dailyOutput",
          "slotType": "numeric",
          "nodeId": "2002:1510",
          "dataType": "numeric"
        },
        {
          "slotName": "unit",
          "slotType": "text",
          "nodeId": "2002:1511",
          "dataType": "text"
        },
        {
          "slotName": "workshopName",
          "slotType": "text",
          "nodeId": "2002:1512",
          "dataType": "text"
        },
        {
          "slotName": "operationStatus",
          "slotType": "state",
          "nodeId": "2002:1516",
          "dataType": "state"
        }
      ],
      "layerStats": {
        "textNodeCount": 4,
        "shapeNodeCount": 2,
        "groupDepth": 3,
        "autoLayoutEnabled": true,
        "dominantFontSize": 20,
        "colorChannelCount": 4
      },
      "lastUpdated": 1764839738285,
      "taskStageAffinity": [
        "monitoring"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "normal",
      "recommendedMaxInstancesPerPage": 6,
      "infoCategory": "metric",
      "criticalitySupport": "good",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "summary",
      "recommendedViewportZone": "center"
    },
    {
      "id": "2002:1500",
      "nodeId": "2002:1500",
      "sectionId": "2026:1496",
      "name": "Frame 181",
      "width": 115,
      "height": 165,
      "sampleText": "平均产能利用率",
      "note": "",
      "description": "平均产能利用率关键指标",
      "tags": [
        "产能利用率",
        "平均效率",
        "生产效率"
      ],
      "supportedDataTypes": [
        "numeric",
        "trend"
      ],
      "slots": [
        {
          "slotName": "metricLabel",
          "slotType": "text",
          "nodeId": "2002:1502",
          "dataType": "text"
        },
        {
          "slotName": "utilizationRate",
          "slotType": "numeric",
          "nodeId": "2002:1503",
          "dataType": "numeric"
        }
      ],
      "layerStats": {
        "textNodeCount": 2,
        "shapeNodeCount": 3,
        "groupDepth": 4,
        "autoLayoutEnabled": false,
        "dominantFontSize": 22,
        "colorChannelCount": 3
      },
      "lastUpdated": 1764839738285,
      "taskStageAffinity": [
        "overview",
        "monitoring"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "normal",
      "recommendedMaxInstancesPerPage": 4,
      "infoCategory": "metric",
      "criticalitySupport": "good",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "summary",
      "recommendedViewportZone": "top"
    },
    {
      "id": "2002:1480",
      "nodeId": "2002:1480",
      "sectionId": "2026:1496",
      "name": "Frame 95",
      "width": 115,
      "height": 165,
      "sampleText": "噪声控制",
      "note": "",
      "description": "噪声控制达标率监控指标",
      "tags": [
        "噪声控制",
        "环保指标",
        "达标率",
        "合规监控"
      ],
      "supportedDataTypes": [
        "numeric",
        "state"
      ],
      "slots": [
        {
          "slotName": "indicatorName",
          "slotType": "text",
          "nodeId": "2002:1482",
          "dataType": "text"
        },
        {
          "slotName": "complianceValue",
          "slotType": "numeric",
          "nodeId": "2002:1487",
          "dataType": "numeric"
        },
        {
          "slotName": "percentSign",
          "slotType": "text",
          "nodeId": "2002:1488",
          "dataType": "text"
        },
        {
          "slotName": "rateLabel",
          "slotType": "text",
          "nodeId": "2002:1489",
          "dataType": "text"
        }
      ],
      "layerStats": {
        "textNodeCount": 4,
        "shapeNodeCount": 4,
        "groupDepth": 3,
        "autoLayoutEnabled": false,
        "dominantFontSize": 14,
        "colorChannelCount": 3
      },
      "lastUpdated": 1764839738285,
      "taskStageAffinity": [
        "monitoring",
        "alert"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "normal",
      "recommendedMaxInstancesPerPage": 4,
      "infoCategory": "metric",
      "criticalitySupport": "limited",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "sidebar",
      "recommendedViewportZone": "bottom"
    },
    {
      "id": "2023:1481",
      "nodeId": "2023:1481",
      "sectionId": "2026:1496",
      "name": "Frame 193",
      "width": 364,
      "height": 192,
      "sampleText": "连续安全天数",
      "note": "",
      "description": "安全生产连续天数及目标完成率",
      "tags": [
        "安全天数",
        "安全生产",
        "KPI",
        "目标完成"
      ],
      "supportedDataTypes": [
        "numeric",
        "trend"
      ],
      "slots": [
        {
          "slotName": "safetyLabel",
          "slotType": "text",
          "nodeId": "2023:1483",
          "dataType": "text"
        },
        {
          "slotName": "completionLabel",
          "slotType": "text",
          "nodeId": "2023:1484",
          "dataType": "text"
        },
        {
          "slotName": "completionRate",
          "slotType": "trend",
          "nodeId": "2023:1485",
          "dataType": "trend"
        },
        {
          "slotName": "daysValue",
          "slotType": "numeric",
          "nodeId": "2023:1492",
          "dataType": "numeric"
        },
        {
          "slotName": "unit",
          "slotType": "text",
          "nodeId": "2023:1493",
          "dataType": "text"
        }
      ],
      "layerStats": {
        "textNodeCount": 5,
        "shapeNodeCount": 5,
        "groupDepth": 4,
        "autoLayoutEnabled": false,
        "dominantFontSize": 20,
        "colorChannelCount": 2
      },
      "lastUpdated": 1764839738286,
      "taskStageAffinity": [
        "overview",
        "monitoring"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "medium",
      "infoDensityProfile": "dense",
      "recommendedMaxInstancesPerPage": 1,
      "infoCategory": "metric",
      "criticalitySupport": "good",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "hero",
      "recommendedViewportZone": "top-left"
    },
    {
      "id": "2002:1471",
      "nodeId": "2002:1471",
      "sectionId": "2026:1496",
      "name": "Frame 96",
      "width": 364,
      "height": 44,
      "sampleText": "消防设备",
      "note": "",
      "description": "消防设备运行状态摘要",
      "tags": [
        "消防设备",
        "运行状态",
        "安全系统",
        "正常率"
      ],
      "supportedDataTypes": [
        "state",
        "numeric"
      ],
      "slots": [
        {
          "slotName": "systemName",
          "slotType": "text",
          "nodeId": "2002:1473",
          "dataType": "text"
        },
        {
          "slotName": "statusValue",
          "slotType": "state",
          "nodeId": "2002:1474",
          "dataType": "state"
        }
      ],
      "layerStats": {
        "textNodeCount": 2,
        "shapeNodeCount": 5,
        "groupDepth": 4,
        "autoLayoutEnabled": false,
        "dominantFontSize": 16,
        "colorChannelCount": 2
      },
      "lastUpdated": 1764839738286,
      "taskStageAffinity": [
        "overview",
        "monitoring"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "normal",
      "recommendedMaxInstancesPerPage": 2,
      "infoCategory": "status",
      "criticalitySupport": "good",
      "dynamicBehavior": "event-driven",
      "layoutRole": "toolbar",
      "recommendedViewportZone": "top"
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

    const screenWidth = 1920;
    const screenHeight = 1080;
    const infoItems = Array.isArray(requirement?.infoItems) ? requirement.infoItems : [];
    const pages = Array.isArray(requirement?.pages) ? requirement.pages : [];
    const fullPage = pages.find((p) => p.id === page.id) || page;
    const priorities = Array.isArray(fullPage?.infoPriorities) ? fullPage.infoPriorities.slice() : [];

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
      targetRegion.items.push({
        infoItemId: info.infoItemId,
        componentId: componentId || componentDefaults[info.dataType] || null,
        slotBindings: slotTemplates(info, componentId)
      });
    };

    sorted.forEach((info, idx) => {
      const item = infoItems.find((i) => i.id === info.infoItemId);
      const dataType = item?.dataType || 'text';
      const compId = pickComponentForType(dataType);
      const region =
        idx === 0 && regions[1] ? regions[1] : dataType === 'alert' ? regions[2] : regions[0];
      assign(region || regions[0], info, compId);
    });

    const plan = {
      screen: {
        width: screenWidth,
        height: screenHeight,
        background: { required: screenType === 'hud', hint: screenType, nodeId: background.nodeId }
      },
      screenType,
      regions,
      componentDefaults
    };

    return res.json({ plan });
  } catch (error) {
    console.error('[layout-plan] failed', error);
    return res.status(500).json({ error: 'layout_plan_failed', message: '生成布局方案失败' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, HOST, () => {
  console.log(`enrich-library server listening on http://${HOST}:${PORT}`);
});

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
