{
  "exportedAt": 1764236197971,
  "count": 8,
  "items": [
    {
      "id": "2019:3",
      "nodeId": "2019:3",
      "sectionId": "2018:1801",
      "name": "数值型 - 高优先级 - 姿态仪",
      "width": 98,
      "height": 98,
      "sampleText": "49.5°",
      "note": "",
      "description": "数值型姿态仪，高优先级显示，显示角度和角速度",
      "tags": [
        "姿态仪",
        "高优先级",
        "数值显示"
      ],
      "supportedDataTypes": [
        "numeric",
        "trend",
        "state"
      ],
      "slots": [
        {
          "slotName": "angle",
          "slotType": "label",
          "nodeId": "2018:2362",
          "dataType": "numeric"
        },
        {
          "slotName": "rate",
          "slotType": "value",
          "nodeId": "2018:2377",
          "dataType": "trend"
        },
        {
          "slotName": "mode",
          "slotType": "state",
          "nodeId": "2018:2378",
          "dataType": "text"
        }
      ],
      "lastUpdated": 1764236186589
    },
    {
      "id": "2020:297",
      "nodeId": "2020:297",
      "sectionId": "2018:1801",
      "name": "数值型 - 中优先级 - 聚合",
      "width": 180,
      "height": 360,
      "sampleText": "着陆器经度",
      "note": "",
      "description": "数值型聚合显示，中优先级，显示着陆器位置和速度等参数",
      "tags": [
        "聚合",
        "中优先级",
        "位置信息"
      ],
      "supportedDataTypes": [
        "numeric",
        "text"
      ],
      "slots": [
        {
          "slotName": "landerLongitude",
          "slotType": "label",
          "nodeId": "2018:2194",
          "dataType": "text"
        },
        {
          "slotName": "landerLongitudeValue",
          "slotType": "value",
          "nodeId": "2018:2197",
          "dataType": "numeric"
        },
        {
          "slotName": "landerLatitude",
          "slotType": "label",
          "nodeId": "2018:2198",
          "dataType": "text"
        },
        {
          "slotName": "landerLatitudeValue",
          "slotType": "value",
          "nodeId": "2018:2201",
          "dataType": "numeric"
        },
        {
          "slotName": "landerSpeed",
          "slotType": "label",
          "nodeId": "2018:2202",
          "dataType": "text"
        },
        {
          "slotName": "landerSpeedValue",
          "slotType": "value",
          "nodeId": "2018:2205",
          "dataType": "numeric"
        },
        {
          "slotName": "targetLongitude",
          "slotType": "label",
          "nodeId": "2018:2206",
          "dataType": "text"
        },
        {
          "slotName": "targetLongitudeValue",
          "slotType": "value",
          "nodeId": "2018:2209",
          "dataType": "numeric"
        },
        {
          "slotName": "targetLatitude",
          "slotType": "label",
          "nodeId": "2018:2210",
          "dataType": "text"
        },
        {
          "slotName": "targetLatitudeValue",
          "slotType": "value",
          "nodeId": "2018:2213",
          "dataType": "numeric"
        },
        {
          "slotName": "distance",
          "slotType": "label",
          "nodeId": "2018:2214",
          "dataType": "text"
        },
        {
          "slotName": "distanceValue",
          "slotType": "value",
          "nodeId": "2018:2217",
          "dataType": "numeric"
        },
        {
          "slotName": "propellant",
          "slotType": "label",
          "nodeId": "2018:2218",
          "dataType": "text"
        },
        {
          "slotName": "propellantValue",
          "slotType": "value",
          "nodeId": "2018:2221",
          "dataType": "numeric"
        }
      ],
      "lastUpdated": 1764236186590
    },
    {
      "id": "2020:304",
      "nodeId": "2020:304",
      "sectionId": "2018:1801",
      "name": "刻度型 - 高优先级",
      "width": 66,
      "height": 333,
      "sampleText": "100",
      "note": "",
      "description": "刻度型显示，高优先级，用于显示数值范围",
      "tags": [
        "刻度",
        "高优先级",
        "范围显示"
      ],
      "supportedDataTypes": [
        "numeric"
      ],
      "slots": [
        {
          "slotName": "value",
          "slotType": "value",
          "nodeId": "2018:2467",
          "dataType": "numeric"
        }
      ],
      "lastUpdated": 1764236186590
    },
    {
      "id": "2018:2468",
      "nodeId": "2018:2468",
      "sectionId": "2018:1801",
      "name": "刻度型 - 中优先级",
      "width": 607,
      "height": 53,
      "sampleText": "60",
      "note": "",
      "description": "刻度型显示，中优先级，用于显示角度和方向",
      "tags": [
        "刻度",
        "中优先级",
        "方向显示"
      ],
      "supportedDataTypes": [
        "numeric",
        "text"
      ],
      "slots": [
        {
          "slotName": "angle",
          "slotType": "value",
          "nodeId": "2018:2468",
          "dataType": "numeric"
        },
        {
          "slotName": "direction",
          "slotType": "state",
          "nodeId": "2018:2496",
          "dataType": "text"
        }
      ],
      "lastUpdated": 1764236186590
    },
    {
      "id": "2022:2",
      "nodeId": "2022:2",
      "sectionId": "2018:1801",
      "name": "姿态仪-高优先级",
      "width": 259.9970703125,
      "height": 343.8954162597656,
      "sampleText": "0",
      "note": "",
      "description": "姿态仪显示，高优先级，显示偏航角、滚动角和俯仰角",
      "tags": [
        "姿态仪",
        "高优先级",
        "角度显示"
      ],
      "supportedDataTypes": [
        "numeric",
        "trend",
        "state"
      ],
      "slots": [
        {
          "slotName": "yaw",
          "slotType": "label",
          "nodeId": "2019:292",
          "dataType": "text"
        },
        {
          "slotName": "yawValue",
          "slotType": "value",
          "nodeId": "2019:293",
          "dataType": "numeric"
        },
        {
          "slotName": "yawRate",
          "slotType": "value",
          "nodeId": "2019:294",
          "dataType": "trend"
        },
        {
          "slotName": "roll",
          "slotType": "label",
          "nodeId": "2019:295",
          "dataType": "text"
        },
        {
          "slotName": "rollValue",
          "slotType": "value",
          "nodeId": "2019:296",
          "dataType": "numeric"
        },
        {
          "slotName": "pitch",
          "slotType": "label",
          "nodeId": "2019:296",
          "dataType": "text"
        },
        {
          "slotName": "pitchValue",
          "slotType": "value",
          "nodeId": "2019:296",
          "dataType": "numeric"
        }
      ],
      "lastUpdated": 1764236186590
    },
    {
      "id": "2030:92",
      "nodeId": "2030:92",
      "sectionId": "2018:1801",
      "name": "数值型-中优先级",
      "width": 171,
      "height": 42,
      "sampleText": "推进剂",
      "note": "",
      "description": "数值型推进剂显示，中优先级",
      "tags": [
        "推进剂",
        "中优先级",
        "数值显示"
      ],
      "supportedDataTypes": [
        "numeric",
        "text"
      ],
      "slots": [
        {
          "slotName": "propellantLabel",
          "slotType": "label",
          "nodeId": "2030:88",
          "dataType": "text"
        },
        {
          "slotName": "propellantValue",
          "slotType": "value",
          "nodeId": "2030:91",
          "dataType": "numeric"
        }
      ],
      "lastUpdated": 1764236186590
    },
    {
      "id": "2022:3",
      "nodeId": "2022:3",
      "sectionId": "2018:1801",
      "name": "数据型 - 低优先级 - 聚合",
      "width": 317,
      "height": 46,
      "sampleText": "速度",
      "note": "",
      "description": "数据型聚合显示，低优先级，显示速度、高度和燃料",
      "tags": [
        "聚合",
        "低优先级",
        "参数显示"
      ],
      "supportedDataTypes": [
        "numeric",
        "text"
      ],
      "slots": [
        {
          "slotName": "speedLabel",
          "slotType": "label",
          "nodeId": "2022:9",
          "dataType": "text"
        },
        {
          "slotName": "speedValue",
          "slotType": "value",
          "nodeId": "2022:10",
          "dataType": "numeric"
        },
        {
          "slotName": "heightLabel",
          "slotType": "label",
          "nodeId": "2022:18",
          "dataType": "text"
        },
        {
          "slotName": "heightValue",
          "slotType": "value",
          "nodeId": "2022:19",
          "dataType": "numeric"
        },
        {
          "slotName": "fuelLabel",
          "slotType": "label",
          "nodeId": "2022:27",
          "dataType": "text"
        },
        {
          "slotName": "fuelValue",
          "slotType": "value",
          "nodeId": "2022:28",
          "dataType": "numeric"
        }
      ],
      "lastUpdated": 1764236186590
    },
    {
      "id": "2030:95",
      "nodeId": "2030:95",
      "sectionId": "2018:1801",
      "name": "数据型 - 低优先级",
      "width": 112,
      "height": 46,
      "sampleText": "速度",
      "note": "",
      "description": "数据型速度显示，低优先级",
      "tags": [
        "速度",
        "低优先级",
        "数值显示"
      ],
      "supportedDataTypes": [
        "numeric",
        "text"
      ],
      "slots": [
        {
          "slotName": "speedLabel",
          "slotType": "label",
          "nodeId": "2030:101",
          "dataType": "text"
        },
        {
          "slotName": "speedValue",
          "slotType": "value",
          "nodeId": "2030:102",
          "dataType": "numeric"
        }
      ],
      "lastUpdated": 1764236186590
    }
  ]
}