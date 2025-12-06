{
  "schemaVersion": 2,
  "exportedAt": 1764939349976,
  "count": 14,
  "items": [
    {
      "id": "2023:1472",
      "nodeId": "2023:1472",
      "sectionId": "2026:1496",
      "name": "Frame 192",
      "width": 364,
      "height": 131,
      "sampleText": "主营业务",
      "note": "",
      "description": "主营业务范围说明",
      "tags": [
        "主营业务",
        "业务范围",
        "文本说明"
      ],
      "supportedDataTypes": [
        "text"
      ],
      "slots": [
        {
          "slotName": "content",
          "nodeId": "2023:1474",
          "slotType": "label",
          "dataType": "text"
        },
        {
          "slotName": "details",
          "nodeId": "2023:1475",
          "slotType": "label",
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
      "lastUpdated": 1764938462547,
      "taskStageAffinity": [
        "overview",
        "investigation"
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
      "primaryColor": "#28334A",
      "sampleText": "1,431.2",
      "note": "",
      "description": "分项产量统计",
      "tags": [
        "产量",
        "吨",
        "分项",
        "生产数据"
      ],
      "supportedDataTypes": [
        "numeric",
        "list"
      ],
      "slots": [
        {
          "slotName": "total",
          "nodeId": "2003:1510",
          "slotType": "numericValue",
          "dataType": "numeric"
        },
        {
          "slotName": "unit",
          "nodeId": "2003:1511",
          "slotType": "unit",
          "dataType": "text"
        },
        {
          "slotName": "item1",
          "nodeId": "2003:1516",
          "slotType": "label",
          "dataType": "text"
        },
        {
          "slotName": "item2",
          "nodeId": "2003:1522",
          "slotType": "label",
          "dataType": "text"
        },
        {
          "slotName": "item3",
          "nodeId": "2003:1519",
          "slotType": "label",
          "dataType": "text"
        },
        {
          "slotName": "item4",
          "nodeId": "2003:1525",
          "slotType": "label",
          "dataType": "text"
        }
      ],
      "layerStats": {
        "textNodeCount": 6,
        "shapeNodeCount": 8,
        "groupDepth": 5,
        "autoLayoutEnabled": true,
        "dominantFontSize": 16,
        "colorChannelCount": 6
      },
      "lastUpdated": 1764939252273,
      "taskStageAffinity": [
        "monitoring",
        "drilldown"
      ],
      "interactionSupport": [
        "drilldown"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "medium",
      "infoDensityProfile": "normal",
      "recommendedMaxInstancesPerPage": 3,
      "infoCategory": "metric",
      "criticalitySupport": "good",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "summary",
      "recommendedViewportZone": "center"
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
      "description": "总产量及完成率",
      "tags": [
        "总产量",
        "完成率",
        "吨",
        "KPI"
      ],
      "supportedDataTypes": [
        "numeric",
        "trend"
      ],
      "slots": [
        {
          "slotName": "value",
          "nodeId": "2003:1487",
          "slotType": "numericValue",
          "dataType": "numeric"
        },
        {
          "slotName": "rateValue",
          "nodeId": "2003:1499",
          "slotType": "state",
          "dataType": "trend"
        },
        {
          "slotName": "unit",
          "nodeId": "2003:1488",
          "slotType": "unit",
          "dataType": "text"
        },
        {
          "slotName": "rateLabel",
          "nodeId": "2003:1498",
          "slotType": "label",
          "dataType": "text"
        },
        {
          "slotName": "title",
          "nodeId": "2003:1486",
          "slotType": "label",
          "dataType": "text"
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
      "lastUpdated": 1764939259873,
      "taskStageAffinity": [
        "monitoring",
        "overview"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "medium",
      "infoDensityProfile": "normal",
      "recommendedMaxInstancesPerPage": 1,
      "infoCategory": "metric",
      "criticalitySupport": "good",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "hero",
      "recommendedViewportZone": "top"
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
      "description": "高强力再生胶产能与完成率",
      "tags": [
        "高强力再生胶",
        "产能",
        "完成率"
      ],
      "supportedDataTypes": [
        "numeric",
        "trend"
      ],
      "slots": [
        {
          "slotName": "output",
          "nodeId": "2003:1489",
          "slotType": "numericValue",
          "dataType": "numeric"
        },
        {
          "slotName": "capacityValue",
          "nodeId": "2003:1532",
          "slotType": "numericValue",
          "dataType": "numeric"
        },
        {
          "slotName": "rateValue",
          "nodeId": "2003:1538",
          "slotType": "numericValue",
          "dataType": "trend"
        },
        {
          "slotName": "capacityLabel",
          "nodeId": "2003:1531",
          "slotType": "label",
          "dataType": "text"
        },
        {
          "slotName": "unit",
          "nodeId": "2003:1492",
          "slotType": "unit",
          "dataType": "text"
        },
        {
          "slotName": "rateLabel",
          "nodeId": "2003:1537",
          "slotType": "label",
          "dataType": "text"
        },
        {
          "slotName": "productName",
          "nodeId": "2003:1528",
          "slotType": "label",
          "dataType": "text"
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
      "lastUpdated": 1764938841966,
      "taskStageAffinity": [
        "monitoring",
        "drilldown"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "dense",
      "recommendedMaxInstancesPerPage": 4,
      "infoCategory": "metric",
      "criticalitySupport": "good",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "summary",
      "recommendedViewportZone": "any"
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
      "description": "高强力再生胶月产量与产能对比",
      "tags": [
        "高强力再生胶",
        "产量",
        "产能",
        "完成率"
      ],
      "supportedDataTypes": [
        "numeric",
        "trend"
      ],
      "slots": [
        {
          "slotName": "output",
          "nodeId": "2003:1493",
          "slotType": "numericValue",
          "dataType": "numeric"
        },
        {
          "slotName": "capacityValue",
          "nodeId": "2003:1535",
          "slotType": "numericValue",
          "dataType": "numeric"
        },
        {
          "slotName": "rateValue",
          "nodeId": "2003:1541",
          "slotType": "numericValue",
          "dataType": "trend"
        },
        {
          "slotName": "capacityLabel",
          "nodeId": "2003:1534",
          "slotType": "label",
          "dataType": "text"
        },
        {
          "slotName": "unit",
          "nodeId": "2003:1497",
          "slotType": "unit",
          "dataType": "text"
        },
        {
          "slotName": "rateLabel",
          "nodeId": "2003:1540",
          "slotType": "label",
          "dataType": "text"
        },
        {
          "slotName": "productName",
          "nodeId": "2003:1529",
          "slotType": "label",
          "dataType": "text"
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
      "lastUpdated": 1764938891144,
      "taskStageAffinity": [
        "monitoring",
        "drilldown"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "dense",
      "recommendedMaxInstancesPerPage": 4,
      "infoCategory": "metric",
      "criticalitySupport": "good",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "summary",
      "recommendedViewportZone": "any"
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
      "description": "生产趋势概览",
      "tags": [
        "生产趋势",
        "分析",
        "月度"
      ],
      "supportedDataTypes": [
        "trend",
        "numeric"
      ],
      "slots": [
        {
          "slotName": "month",
          "nodeId": "2003:1546",
          "slotType": "label",
          "dataType": "text"
        },
        {
          "slotName": "output",
          "nodeId": "2003:1547",
          "slotType": "numericValue",
          "dataType": "numeric"
        },
        {
          "slotName": "title",
          "nodeId": "2003:1545",
          "slotType": "label",
          "dataType": "text"
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
      "lastUpdated": 1764939290543,
      "taskStageAffinity": [
        "monitoring",
        "overview"
      ],
      "interactionSupport": [
        "drilldown"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "medium",
      "infoDensityProfile": "dense",
      "recommendedMaxInstancesPerPage": 1,
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
      "description": "月度产量及环比变化",
      "tags": [
        "月度产量",
        "吨",
        "环比"
      ],
      "supportedDataTypes": [
        "numeric",
        "trend"
      ],
      "slots": [
        {
          "slotName": "changeRate",
          "nodeId": "2003:1495",
          "slotType": "numericValue",
          "dataType": "trend"
        },
        {
          "slotName": "output",
          "nodeId": "2003:1490",
          "slotType": "numericValue",
          "dataType": "numeric"
        },
        {
          "slotName": "month",
          "nodeId": "2003:1482",
          "slotType": "label",
          "dataType": "text"
        },
        {
          "slotName": "unit",
          "nodeId": "2003:1494",
          "slotType": "unit",
          "dataType": "text"
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
      "lastUpdated": 1764939303811,
      "taskStageAffinity": [
        "monitoring",
        "drilldown"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "sparse",
      "recommendedMaxInstancesPerPage": 6,
      "infoCategory": "trend",
      "criticalitySupport": "limited",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "inline",
      "recommendedViewportZone": "any"
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
      "description": "智能化车间日产量及建设状态",
      "tags": [
        "日产量",
        "智能化车间",
        "在建"
      ],
      "supportedDataTypes": [
        "numeric",
        "state"
      ],
      "slots": [
        {
          "slotName": "output",
          "nodeId": "2004:1472",
          "slotType": "numericValue",
          "dataType": "numeric"
        },
        {
          "slotName": "location",
          "nodeId": "2004:1474",
          "slotType": "label",
          "dataType": "text"
        },
        {
          "slotName": "unit",
          "nodeId": "2004:1473",
          "slotType": "unit",
          "dataType": "text"
        },
        {
          "slotName": "status",
          "nodeId": "2004:1478",
          "slotType": "state",
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
      "lastUpdated": 1764939002546,
      "taskStageAffinity": [
        "monitoring",
        "overview"
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
      "layoutRole": "inline",
      "recommendedViewportZone": "any"
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
      "description": "车间名称标识",
      "tags": [
        "车间",
        "标识",
        "位置"
      ],
      "supportedDataTypes": [
        "text"
      ],
      "slots": [
        {
          "slotName": "name",
          "nodeId": "2002:1521",
          "slotType": "label",
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
      "lastUpdated": 1764939037751,
      "taskStageAffinity": [
        "overview"
      ],
      "interactionSupport": [],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "sparse",
      "recommendedMaxInstancesPerPage": null,
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
      "description": "车间日产量及运行状态",
      "tags": [
        "日产量",
        "磨粉车间",
        "运行状态"
      ],
      "supportedDataTypes": [
        "numeric",
        "state"
      ],
      "slots": [
        {
          "slotName": "location",
          "nodeId": "2002:1512",
          "slotType": "label",
          "dataType": "text"
        },
        {
          "slotName": "output",
          "nodeId": "2002:1510",
          "slotType": "numericValue",
          "dataType": "numeric"
        },
        {
          "slotName": "unit",
          "nodeId": "2002:1511",
          "slotType": "unit",
          "dataType": "text"
        },
        {
          "slotName": "status",
          "nodeId": "2002:1516",
          "slotType": "state",
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
      "lastUpdated": 1764939054355,
      "taskStageAffinity": [
        "monitoring",
        "overview"
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
      "layoutRole": "inline",
      "recommendedViewportZone": "any"
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
      "description": "平均产能利用率",
      "tags": [
        "产能利用率",
        "平均"
      ],
      "supportedDataTypes": [
        "numeric",
        "trend"
      ],
      "slots": [
        {
          "slotName": "value",
          "nodeId": "2002:1503",
          "slotType": "numericValue",
          "dataType": "numeric"
        },
        {
          "slotName": "metric",
          "nodeId": "2002:1502",
          "slotType": "label",
          "dataType": "text"
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
      "lastUpdated": 1764939102341,
      "taskStageAffinity": [
        "monitoring",
        "overview"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "normal",
      "recommendedMaxInstancesPerPage": 3,
      "infoCategory": "metric",
      "criticalitySupport": "good",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "summary",
      "recommendedViewportZone": "any"
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
      "description": "噪声控制达标率",
      "tags": [
        "噪声控制",
        "达标率",
        "环保"
      ],
      "supportedDataTypes": [
        "numeric",
        "state"
      ],
      "slots": [
        {
          "slotName": "unit",
          "nodeId": "2002:1488",
          "slotType": "unit",
          "dataType": "text"
        },
        {
          "slotName": "value",
          "nodeId": "2002:1487",
          "slotType": "numericValue",
          "dataType": "numeric"
        },
        {
          "slotName": "metric",
          "nodeId": "2002:1482",
          "slotType": "label",
          "dataType": "text"
        },
        {
          "slotName": "label",
          "nodeId": "2002:1489",
          "slotType": "label",
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
      "lastUpdated": 1764939147750,
      "taskStageAffinity": [
        "monitoring",
        "recovery"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "small",
      "infoDensityProfile": "normal",
      "recommendedMaxInstancesPerPage": 3,
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
      "description": "连续安全天数与目标完成率",
      "tags": [
        "安全天数",
        "目标完成率",
        "安全生产"
      ],
      "supportedDataTypes": [
        "numeric",
        "trend"
      ],
      "slots": [
        {
          "slotName": "days",
          "nodeId": "2023:1492",
          "slotType": "numericValue",
          "dataType": "numeric"
        },
        {
          "slotName": "rateValue",
          "nodeId": "2023:1485",
          "slotType": "numericValue",
          "dataType": "trend"
        },
        {
          "slotName": "unit",
          "nodeId": "2023:1493",
          "slotType": "unit",
          "dataType": "text"
        },
        {
          "slotName": "rateLabel",
          "nodeId": "2023:1484",
          "slotType": "label",
          "dataType": "text"
        },
        {
          "slotName": "metric",
          "nodeId": "2023:1483",
          "slotType": "label",
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
      "lastUpdated": 1764939167939,
      "taskStageAffinity": [
        "monitoring",
        "overview"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "flexible",
      "visualFootprint": "medium",
      "infoDensityProfile": "dense",
      "recommendedMaxInstancesPerPage": 1,
      "infoCategory": "alert",
      "criticalitySupport": "good",
      "dynamicBehavior": "frequent-update",
      "layoutRole": "hero",
      "recommendedViewportZone": "top"
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
      "description": "消防设备运行状态",
      "tags": [
        "消防设备",
        "运行状态",
        "正常率"
      ],
      "supportedDataTypes": [
        "state",
        "numeric"
      ],
      "slots": [
        {
          "slotName": "status",
          "nodeId": "2002:1474",
          "slotType": "state",
          "dataType": "state"
        },
        {
          "slotName": "system",
          "nodeId": "2002:1473",
          "slotType": "label",
          "dataType": "text"
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
      "lastUpdated": 1764939193918,
      "taskStageAffinity": [
        "monitoring",
        "recovery"
      ],
      "interactionSupport": [
        "hover"
      ],
      "priorityAffinity": "low",
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