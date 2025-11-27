
# 复杂任务界面生成与自然语言可控编辑 Figma 插件原型

MVP 原型需求文档（V0.3）

> 用途：科研 / 论文验证用原型，不直接面向商业化。

---

## 1. 项目概述

### 1.1 产品定位（Figma 插件 + Python 后端服务）

本项目目标是构建一款面向**复杂产研/任务场景**的 Figma 插件原型 + 后端服务，支持：

1. 设计师在 Figma 中维护组件库；插件自动读取并标注组件，构建结构化组件库（ComponentCatalog）。
2. 基于**任务需求文档（TaskSpec）+ 任务相关角色标签（PersonaLabel）+ 组件库**，自动生成一组多页面界面草稿（界面族）。
   每个 UI Page 对应任务在某个 Stage / 条件下的界面视图。
3. 用户通过**自然语言指令**对生成界面进行**细粒度、结构化可控编辑（UI-diff 级）**，并按 scope 规则在多页面之间传播更新。
4. 全流程基于统一 UI Schema（JSON）描述，可用于：

   * 论文实验与可视化分析；
   * 后续转换为前端实现或其他设计工具格式。

> 说明：
>
> * “Agent” 指调用 LLM 的内部子模块，是后端实现形式，不要求以产品模块形式暴露。
> * 每个 Agent 至少对应一次 LLM API 调用和一套 Prompt 设计。

---

### 1.2 目标用户

* **产品经理 / 需求方**

  * 从任务/需求文档快速得到第一版界面族草稿，用于讨论信息结构、任务流程。
* **UI / UX 设计师**

  * 主要使用者：在 Figma 中维护组件库，使用插件生成和编辑界面族。
* **设计 / 人机交互研究者**

  * 用于研究“生成式 UI + 可控编辑”的交互效果与工作流影响。

> 注意：这里的“目标用户”是插件的使用者；下面的 Persona 是任务场景中的领域角色标签（如机长、副机长），不是这些产品/设计从业者。

---

### 1.3 使用场景（典型）

1. **场景 A：从任务需求文档生成界面族草稿**

   * 设计师在 Figma 中准备好组件库页面；
   * 打开插件 → 选择组件库来源 → 读取并标注组件，构建 ComponentCatalog；
   * 在插件中粘贴任务需求文档（TaskSpec），系统从中识别任务相关角色并生成 PersonaLabel（如“机长”“副机长”“地面监控”），用户可选择其一或多个；
   * 点击「生成界面族」，Figma 中出现一组新界面（例如：配置界面、监控总览、告警处理、任务复盘等），每个 UI Page 在 Figma 中对应一个 Frame。

2. **场景 B：基于自然语言指令迭代界面族**

   * 用户浏览生成结果，在 Figma 中选中某个 Frame 或组件实例；
   * 在插件中输入自然语言指令（如「把所有告警相关页面的图表改成堆叠柱状图」）；
   * 插件调用后端生成 Intent 和 UI-diff，在多页面上统一更新相关组件；
   * 用户可查看变更摘要并进行「上一步撤销」。

3. **场景 C：论文实验与评估**

   * 研究者配置不同 TaskSpec / PersonaLabel / 组件库组合；
   * 比较不同实验条件下生成界面族的质量、覆盖度与一致性；
   * 导出 UI Schema 和编辑日志，用于后续定量/定性分析。

---

### 1.4 成功指标（MVP 级）

* 至少支持 **1–2 个真实复杂任务场景**（如监控/告警类、航天飞控类）的端到端演示。
* 在实验中，用户能够：

  * 使用 Figma 组件库 + TaskSpec，一次生成得到**结构合理、可讨论**的多页面界面族；
  * 使用自然语言完成至少 5 种典型编辑操作：

    1. 添加组件（如新增趋势图）；
    2. 替换图表类型；
    3. 调整布局顺序（如将过滤条上移至顶部）；
    4. 改变组件密度（如表格行距）；
    5. 跨页面统一修改同类型/同角色组件；
  * 且生成/编辑后的界面在布局上保持可用，不出现明显“炸裂”现象。
* 能导出 JSON 格式的 UI Schema & UI-diff & 编辑日志，用于论文分析和重放。

---

## 2. 概念与术语

### 2.1 UI 结构相关术语

* **Stage**
  从任务中抽取的阶段，例如“配置”“监控”“处理告警”“复盘”等；在复杂任务下可细化为“阶段 + 条件组合”，如“着陆段 + 下降速率过快”。

* **UI Page（概念界面页）**
  概念上的界面页，对应**任务、角色、条件共同作用**下的某个 Stage。
  例如：航天器「驾驶员」在「着陆段」遇到「下降速率过快」时的界面。

* **FigmaPage**
  Figma 中的实际 Page 对象，用于组织多个 Frame。

* **FigmaFrame**
  Figma 中的 Frame 节点，本系统中 **每个 UI Page 对应一个 FigmaFrame**。

> MVP 默认映射策略：
>
> * 每个 Stage（含条件/角色切片） → 1 个 UI Page；
> * 每个 UI Page → 1 个 FigmaFrame；
> * 所有生成的 FigmaFrame 默认放在同一个 FigmaPage 下（如 “Generated UI”）。

---

### 2.2 核心对象与标签

* **TaskSpec**
  任务需求文档（文本），描述场景、目标、流程、数据、约束等。

* **PersonaLabel（任务角色标签）**
  从 TaskSpec 中抽取/选择的任务相关领域角色标签，如“机长”“副机长”“地面监控人员”“值班工程师”等。

  * 在产品层面弱化为一个标签（或标签组合），影响 Stage 分解和优先级，但不需要完整人物设定。
  * 不包括“产品经理”等研发团队角色。

* **ComponentCatalog**
  从 Figma 组件库构建的结构化组件集合，是生成/编辑的基础。

* **Context**
  `Context = { TaskSpec, PersonaLabel(s), ComponentCatalog }`，作为 LLM 管线的输入上下文。

* **InfoItem**
  信息项，表示任务中需要呈现/操作的基本单元（如某个指标、某类告警、某个操作入口）。

* **PriorityQueue（信息优先级队列）**
  按 InfoItem 粒度，对某一 Stage/条件下的信息进行排序的内部结构。
  在 UI 中可**只读展示**（例如高/中/低 band），**不支持用户编辑**。

* **Page / Section / Component**
  UI Schema 中的界面层次结构：

  * Page：对应 UI Page；
  * Section：Page 内的布局区域，如顶部过滤条区、主视图区、详情区；
  * Component：UI 组件实例，绑定到 ComponentCatalog 中的某个组件定义。

* **UI Schema**
  JSON 结构，用于描述界面族、布局结构及组件绑定。

* **Intent**
  从自然语言指令解析出的结构化编辑意图（目标对象、范围、属性变更等）。

* **UI-diff**
  对 UI Schema 的差分操作集合（添加/删除/更新组件，调整顺序等），是后端与 Figma 同步更新的基础。

---

### 2.3 数据模型（MVP 范围）

#### 2.3.1 ComponentCatalog（组件库）

每个组件记录字段（示意）：

```json
{
  "id": "chart_line_overview",
  "name": "LineChartOverview",
  "type": "Chart",                 // 受控枚举，如 Chart / Table / FilterBar / KPI / Form 等
  "data_role": ["metric", "trend"],
  "layout_span": 4,                // 可选：用于简单栅格布局
  "density": "compact",            // 可选：compact / normal / spacious
  "role_enum": ["OverviewPanel"],  // 受控枚举字段（可多选）
  "role_free": "飞行状态总览",       // 可选自由文本说明
  "description": "用于展示关键指标趋势的折线图",
  "figma_node_ref": "xxx",        // Figma 节点引用
  "meta": {
    "constraints": {}
  }
}
```

> 说明：
>
> * 跨页一致性和跨页编辑只基于 `role_enum` 判断；
> * `role_free` 仅用于补充语义，不参与规则。

---

#### 2.3.2 UI Schema（界面族）

简化示例：

```json
{
  "pages": [
    {
      "id": "page_overview",
      "ui_page_type": "monitoring_overview",
      "stage": "monitoring",
      "persona_labels": ["机长"],
      "name": "监控总览（机长）",
      "sections": [
        {
          "id": "sec_top_filters",
          "priority_band": "high",         // 由内部 PriorityQueue 映射得出，只读
          "components": [
            { "component_id": "global_filter_bar", "instance_id": "..." }
          ]
        },
        {
          "id": "sec_main_chart",
          "priority_band": "high",
          "components": [
            { "component_id": "chart_line_overview", "instance_id": "..." }
          ]
        }
      ]
    }
  ]
}
```

---

#### 2.3.3 Intent & UI-diff（示意）

Intent：

```json
{
  "type": "modify",
  "target": "component",
  "scope": "same_role_across_pages",
  "anchor": {
    "role_enum": ["OverviewPanel"],
    "component_type": "Chart"
  },
  "value": {
    "property_changes": { "chart_variant": "stacked_bar" }
  }
}
```

UI-diff：

```json
{
  "ops": [
    {
      "op": "UpdateProps",
      "target_ref": "component_instance_id",
      "changes": { "chart_variant": "stacked_bar" }
    },
    {
      "op": "ReorderNode",
      "target_ref": "section_id",
      "order": ["comp_filter_bar", "comp_main_chart", "comp_secondary_chart"]
    }
  ]
}
```

MVP 级别仅要求支持少量基础操作类型，如：

* `AddComponent`
* `UpdateProps`
* `RemoveComponent`
* `ReorderNode`

---

## 3. 用户流程与功能需求
### 3.1 整体流程概览

F0：组件库构建
用户在 Figma 选定组件库来源 → 插件读取 → 调用后端生成 ComponentCatalog → 用户可微调并保存。

F1：任务上下文配置
用户粘贴或上传任务说明书 TaskSpec → 后端抽取任务阶段、角色（Persona）和条件 → 生成Stage（设计师一共需要设计多少个页面—） & PersonaLabel 候选 → 用户确认/选择 PersonaLabel → 完成 Context。

F2：界面族生成
用户基于 Context，触发生成 → 后端输出 UI Schema → 插件在一个 FigmaPage 下创建多个 FigmaFrame，并根据 UI Schema + ComponentCatalog 在画布上渲染界面。

F3：自然语言编辑与 UI-diff 应用
用户在 Figma 中选择对象（或不选） → 输入指令 → 后端解析 Intent & UI-diff → 更新 UI Schema & Figma → 可查看变更摘要，支持最近一次撤销。

导出与实验
用户/研究者在任意时间导出 Context、UI Schema 和编辑日志（JSON），用于实验与分析。

插件 UI：极简、流程驱动。
主面板按步骤呈现：组件库 → 任务配置 → 生成/编辑 → 导出，不必使用复杂 Tab。
>
> * 组件库区域；
> * 任务 & Persona 区域；
> * 生成/编辑区域；
>   导出入口作为独立的小按钮出现即可。

---

### 3.2 F0：组件库读取与标注

#### 3.2.1 功能目标

* 从当前 Figma 文件中的组件库页面/Frame，构建结构化 ComponentCatalog；
* 支持用户对核心字段进行简单修正；
* 这是后续所有生成/编辑的前提。

#### 3.2.2 用户流程

1. 用户在 Figma 中打开项目文件，准备好组件库页面（包含 Components）。
2. 打开插件主面板，在“组件库”卡片中点击「选择组件库来源」：

   * 选择一个 FigmaPage 或 Frame 作为组件库来源；
   * 或通过前缀过滤组件（如 `Comp/`）。
3. 插件读取 Figma 节点，展示一个简单列表：

   * 组件名称、缩略图（可选）、基础类型猜测。
4. 用户点击「自动标注」，插件调用后端 Agent：

   * 基于节点结构和命名，推断 `type` / `data_role` / `role_enum` 等；
   * `layout_span`、`density` 可基于简单规则或默认值。
5. 用户可在列表中简单编辑字段：

   * 导航 + 单行编辑；
   * 允许多选后统一设置某个字段（如统一设置 role_enum）。
6. 用户点击「保存组件库」：

   * ComponentCatalog 保存到 plugin data；
   * 同时同步至后端存储（以文件 ID + 版本标识）。

#### 3.2.3 功能需求（FR）

* **FR-F0-1**：支持从当前 Figma 文件选择 FigmaPage 或 Frame 作为组件库来源。
* **FR-F0-2**：支持列出来源中的所有 Component/Instance，并显示至少名称。
* **FR-F0-3**：支持调用后端 `/build_catalog` 自动补全组件元数据（`type`、`data_role`、`role_enum` 等）。
* **FR-F0-4**：支持在插件中编辑元数据字段（单项编辑 + 简单批量设置）。
* **FR-F0-5**：支持将 ComponentCatalog 保存并在重开文件时加载复用。

> 非必需（可后续扩展）：缩略图预览、复杂表格筛选/排序界面。

---

### 3.3 F1：任务输入与 PersonaLabel 配置

#### 3.3.1 功能目标

* 输入任务需求文档 TaskSpec；
* 从 TaskSpec 中提取任务 Stage 和任务相关角色标签（PersonaLabel）；
* 用户确认/选择 PersonaLabel；
* 生成 Context `{ TaskSpec, PersonaLabel(s), ComponentCatalog }`。

#### 3.3.2 用户流程

1. 用户在插件主面板的“任务配置”区域：

   * 在大文本框中粘贴 TaskSpec（任务需求文档）；
   * 可以显示字数/大小提示（防止过长）。
2. 用户点击「分析任务」，插件调用后端：

   * 抽取候选 Stage 列表；
   * 抽取任务相关角色标签（PersonaLabel），如“机长”“副机长”“地面监控”等；
   * 生成简要任务摘要。
3. 插件展示：

   * 一段任务摘要（1–3 行）；
   * Stage 列表预览（只读即可）；
   * PersonaLabel 候选标签（可多选）；
4. 用户选择一个或多个 PersonaLabel（也可添加自定义标签）。
5. 若当前没有可用 ComponentCatalog，插件提醒用户先完成 F0；否则 Context 状态变为“已就绪”。

#### 3.3.3 功能需求（FR）

* **FR-F1-1**：支持在文本框中粘贴 TaskSpec，并触发后端分析。
* **FR-F1-2**：后端基于 TaskSpec 与 ComponentCatalog 提取：

  * Stage 候选列表（不要求用户编辑）；
  * PersonaLabel 候选标签（用户可选择）。
* **FR-F1-3**：支持用户选择/新增 PersonaLabel；在 Context 中记录。
* **FR-F1-4**：当 ComponentCatalog 未准备好时，给出明确提示并引导用户先执行 F0。

> 可选：支持从本地文件（.txt/.md）导入 TaskSpec，但非 MVP 必须。

---

### 3.4 F2：界面生成（多 UI Page → FigmaFrame）

#### 3.4.1 功能目标

* 基于 Context 生成多 UI Page 的 UI Schema；
* 将每个 UI Page 映射为 Figma 中的一个 Frame，全部放在同一个 FigmaPage 上；
* 在 Figma 画布上，严格按照「UI Schema + ComponentCatalog」渲染界面结构与组件实例：
  * 每个 UI Page 的 Section 作为布局分区；
  * 每个 Component 映射为对应组件定义的实例；
  * 布局由简单栅格和 layout_span 决定；
* 支持在插件中查看生成的页面结构和优先级 band（只读）。

#### 3.4.2 内部处理（后端管线概念）

由 LLM Agent 管线（内部）完成：

1. Task & Stage Planner Agent：基于 TaskSpec + PersonaLabel 划分 Stage / 条件。
2. Info Extraction Agent：抽取 InfoItem 集合。
3. Priority Manager Agent：按 Stage 构建 InfoItem 级 PriorityQueue（内部结构）。
4. View Planner / Component Mapping Agent：规划 UI Page → Section → Component，并根据 PriorityQueue 确定顺序。
5. Layout Agent：根据简单栅格与 layout_span 规则生成布局参数。

> 这些 Agent 对用户不可见，仅体现在后端接口输入/输出中。

#### 3.4.3 渲染行为与用户流程

1. 当 Context 就绪（F0 + F1 完成）时，插件主面板显示「生成界面族」按钮。

2. 用户点击「生成界面族」：

   * 插件调用 `/generate_ui`，附带 Context；
   * 后端返回 UI Schema。

3. 插件在 Figma 中执行 **基于 Schema 的渲染**：

   1. **FigmaPage 创建/复用**

      * 若不存在名为 “Generated UI” 的 FigmaPage，则创建一个；
      * 若已存在，可选择在其下追加新的 Frame（MVP 不做版本管理）。

   2. **UI Page → FigmaFrame 映射**

      * 对于 UI Schema 中每个 `page`：

        * 在“Generated UI” Page 下创建一个 FigmaFrame；
        * Frame 名称建议包含 `page.name` 与 `page.id`（便于追踪）；
        * 在 Frame 内按 Section 顺序建立基础布局区域（可用自动布局或者简单坐标网格）。

   3. **Section → Figma 容器**

      * 每个 `section` 渲染为 Frame 内的一个容器节点（可用 Frame 或 Group）；
      * Section 名称包含 `section.id`，用于后续映射 UI-diff；
      * Section 在垂直方向按顺序叠放，可用固定间距/栅格。

   4. **Component → Figma 组件实例**

      * 对 Section 中的每个 `component`：

        * 根据 `component.component_id` 在 ComponentCatalog 中查找对应项；
        * 使用其 `figma_node_ref` 作为 master，在当前 Section 容器中创建一个组件实例；
        * 组件实例名称记录 `component_id` 与 `instance_id`；
        * 在 Section 内按简单栅格规则排列（如固定列数/间距，依据 `layout_span` 计算宽度）。

   5. **属性映射（可选，MVP 简化）**

      * 若 UI Schema / ComponentCatalog 中存在简单属性（如 `chart_variant`、`density`），插件可通过：

        * 设置 Figma 组件 variant 属性；
        * 或使用命名约定选择对应 variant；
      * MVP 只需覆盖 1–2 个关键属性，用于演示“属性级编辑”的可视化效果。

4. 插件在面板中展示：

   * UI Page 列表（名称 + Stage + persona 标签）；
   * 简单的 Section 结构树（只读）；
   * 每个 Section 的 priority_band（只读）。

#### 3.4.4 功能需求（FR）

* **FR-F2-1**：支持一次生成至少 3–4 个 UI Page（视任务而定）。
* **FR-F2-2**：支持按“单 UI Page → 单 FigmaFrame”的映射，在一个 FigmaPage 上创建 Frame。
* **FR-F2-3**：插件在渲染时必须使用 **UI Schema + ComponentCatalog** 作为唯一数据源：

  * 每个 `component` 必须映射到 ComponentCatalog 中的 `figma_node_ref` 组件实例；
  * 不允许在画布上创建 Schema 中不存在的“自由绘制”节点（除 Section 容器外）。
* **FR-F2-4**：Section 在 Figma 中渲染为 Frame/Group 容器节点，顺序与 Schema 一致，并保留 `section.id` 信息。
* **FR-F2-5**：组件在 Section 中按简单栅格规则布局（列数、间距可固定配置），可使用 `layout_span` 影响宽度。
* **FR-F2-6**：支持在插件中查看 UI Schema 概览（Page 列表 + Section 树 + priority_band 只读）。
* **FR-F2-7**：PriorityQueue 仅作为内部排序逻辑；UI 中仅以只读 band 形式展示，不提供编辑能力。
* **FR-F2-8**：后续编辑（F3）导致的 Figma 变更也必须通过“更新 UI Schema → 重新渲染/局部更新”的方式执行，确保 Schema 与画布保持一致。

---

### 3.5 F3：自然语言编辑与 UI-diff

#### 3.5.1 功能目标

* 支持用户用自然语言指令修改当前 Context 下生成的 UI：

  * 在单个 UI Page 内添加/删除/替换组件，调整布局顺序；
  * 按 scope 规则，在多个页面上统一修改同类型/同 role 的组件；
* 后端将指令解析为 Intent → UI-diff → 应用到 UI Schema 与 Figma；
* 支持最近一次编辑的撤销。

#### 3.5.2 Scope 规则（MVP 约定）

* **情况 1：Figma 中未选中任何对象**
  → 默认作用范围为当前 Context 下**所有由系统生成的 UI Page（全局）**。

  例如：
  指令：「把所有告警列表的行距调紧一些」
  → 后端解析告警列表相关的 role_enum / type，并在所有 UI Page 中匹配对应组件进行更新。

* **情况 2：选中对象 + 指令不包含明显跨页语义**
  → 默认作用范围为**选中对象所属 UI Page（单页）**。

  例如：
  用户选中某个 FigmaFrame（监控总览页），输入：「把过滤条放到最上面一行」
  → 只调整该 UI Page 内 Section/组件顺序。

* **情况 3：选中对象 + 指令包含跨页语义**
  → 使用选中对象作为 anchor（基于其 role_enum / type），并按指令扩展到跨页。

  例如：
  用户在某告警详情页选中主图表组件，输入：「把所有告警相关页面的主图表改成堆叠柱状图」
  → 后端以该组件的 role_enum + type 作为 anchor，寻找其他页面中相同 role_enum 的组件实例并统一修改。

> “跨页语义”的识别由 Intent Parser 根据自然语言判断，例如出现“所有 X 页面”“整个界面族”“所有告警相关界面”等表述。

#### 3.5.3 用户流程

1. 用户在 Figma 画布中：

   * 可以选中：FigmaFrame（对应 UI Page）、Section 容器（可选）、组件实例；
   * 也可以不选中任何对象。
2. 打开或聚焦插件主面板中的“编辑”区域。
3. 在自然语言输入框中输入指令，点击「应用」：

   * 插件将当前 Selection 信息（类型、关联 UI Schema ID） + 文本指令发送至 `/edit_ui`；
4. 后端执行：

   * Intent Parser Agent：解析 type / target / scope / value；
   * Target Resolver：结合 UI Schema 与 Figma 节点，确定具体 target_ref 集合；
   * UI-diff Generator：生成原子操作序列；
   * Layout 更新（如需要重新排布顺序）。
5. 后端返回：

   * 更新后的 UI Schema；
   * UI-diff 摘要。
6. 插件根据 UI-diff 更新对应 FigmaFrame / 组件实例；
7. 插件在“最近变更”区域展示本次变更摘要（例如“3 个页面中共更新 4 个组件”），并提供「撤销上一次编辑」按钮。

#### 3.5.4 典型指令示例与 Scope 说明

1. **无选中对象 + 全局指令**

   * 画布：无选中对象；
   * 指令：

     > 「把所有 overview 页面的主图表改为网格形式」
   * 行为：

     * Intent 检测 “所有 overview 页面” → scope = global + filter(stage/ui_page_type=overview)；
     * 在所有 overview 类型 UI Page 中查找 role_enum 包含 `OverviewPanel` 且 type=Chart 的组件，并统一修改属性。

2. **选中单个页面 + 局部指令**

   * 用户选中某 FigmaFrame（监控总览页）；
   * 指令：

     > 「把过滤条放到最上面一行」
   * 行为：

     * 无跨页语义 → scope = selected_page；
     * 在该 UI Page 内找到 role_enum 包含 `GlobalFilterBar` 的 Section/组件，调整其 Section 顺序到最前。

3. **选中组件实例 + 跨页指令**

   * 用户在某告警详情页选中一个趋势图组件；
   * 指令：

     > 「把所有告警相关页面的图表改成堆叠柱状图」
   * 行为：

     * 存在“所有”“页面”关键词 → 识别为跨页语义；
     * 以选中组件的 role_enum（例如 `AlertTrendChart`）+ type=Chart 作为 anchor；
     * 在所有 UI Page 中查找相同 anchor 的组件实例，统一更新 `chart_variant=stacked_bar`。

#### 3.5.5 功能需求（FR）

* **FR-F3-1**：插件能够捕获当前 Figma Selection 的类型（Page/Frame/Node）和关联 UI Schema ID，并随指令一起传至后端。

* **FR-F3-2**：后端支持将自然语言指令解析为结构化 Intent（含 scope、anchor 信息）。

* **FR-F3-3**：后端支持生成 UI-diff，并在返回中给出操作摘要（数量、类型）。

* **FR-F3-4**：插件能够根据 UI-diff 更新当前 Context 对应的 UI Schema，并同步更新 Figma 中的 Frame/组件。

* **FR-F3-5**：支持 scope 规则：

  1. 无选中 → 默认全局；
  2. 有选中且无跨页语义 → 选中对象所属 UI Page；
  3. 有选中且有跨页语义 → 以选中对象为 anchor，跨页应用。

* **FR-F3-6**：支持「撤销上一次编辑」，通过存储上一版本 UI Schema（单步回滚即可）。

> 不在本期要求：多步撤销、复杂冲突可视化、严格一致性约束求解。

---

## 4. 系统架构与实现约束

### 4.1 Figma 插件前端

* 技术栈：TypeScript + React。
* UI 原则：**极简、流程驱动**，非模块平铺式 Tab。

  * 主面板展示三个区域（可折叠）：

    1. 组件库状态（F0）；
    2. 任务 & Persona 配置（F1）；
    3. 生成 / 编辑 / 导出操作（F2 + F3）；
  * 根据当前上下文状态显示相应按钮（如未完成 F0 不显示生成按钮）。
* 与 Figma Canvas 通信：使用 Figma Plugin API 读取/写入节点、获取 Selection。

### 4.2 后端服务（Python）

* 技术栈：Python + FastAPI（或同级框架）。

* REST API（MVP）：

  * `POST /build_catalog`
    输入：Figma 组件元数据（由插件发送）
    输出：带推断字段的 ComponentCatalog

  * `POST /generate_ui`
    输入：Context `{ TaskSpec, PersonaLabel(s), ComponentCatalog }`
    输出：UI Schema（界面族结构 + 布局信息）

  * `POST /edit_ui`
    输入：当前 UI Schema、Selection 信息、自然语言指令文本
    输出：更新后的 UI Schema + UI-diff 摘要

  * `GET /export_schema`（可选）
    返回当前 Context、UI Schema、编辑日志 JSON。

* LLM 集成：

  * 通过统一封装调用大语言模型；
  * “Agent” 仅为内部函数/模块，每个 Agent 对应一次或多次 LLM 调用和一套 Prompt；
  * MVP 不强制引入 VLM（视觉模型）。

---

### 4.3 LLM Agent 管线（内部约束）

> 用于工程/研究对齐，不暴露给最终用户。

* Agent 拆分建议（非产品模块）：

  1. Catalog Tagging Agent（F0）
  2. Task & Stage Planning Agent（F1/F2）
  3. Info Extraction & Priority Agent（F2）
  4. View Planning & Component Mapping Agent（F2）
  5. Intent Parsing & Scope Agent（F3）
  6. UI-diff Planning Agent（F3）

* 要求：

  * 所有 Agent 以文本输入/输出 + JSON 结构为边界，便于实验记录；
  * 每次 LLM 调用的输入、输出可落盘（用于论文实验与分析）。

---

## 5. 不在本期范围（Non-goals）

* 不支持对**任意** Figma 设计稿做端到端重构，仅支持：

  * 指定组件库页面的读取与标注；
  * 指定由本系统生成的 UI Page（FigmaFrame）的增删改。
* 不做复杂布局优化引擎：

  * 不实现 NSGA-II 等多目标优化算法；
  * MVP 采用简单栅格 + 启发式布局即可。
* 不做实时协作：

  * 不考虑多用户同时编辑同一 Context。
* 不做复杂一致性规则求解：

  * 不强制保证所有 role_enum 在跨页完全一致，仅做“尽量保持一致”的启发式处理；
  * 不实现复杂冲突可视化界面。
* 不做多步撤销/历史版本管理：

  * MVP 仅支持“最近一次编辑撤销”。

---

## 6. 数据与导出

* 支持导出内容（JSON 为主）：

  * Context（TaskSpec 引用 / PersonaLabel / ComponentCatalog ID）；
  * 当前 UI Schema；
  * 编辑日志：包含时间戳、自然语言指令、解析出的 Intent、UI-diff 摘要。
* 导出方式：

  * 通过后端 `/export_schema` 接口或插件直接打包前端状态；
  * 默认导出为 `.json` 文件；
  * `.md` 等展示友好格式为可选扩展，不是 MVP 必须。

---

## 7. 里程碑规划

### 7.1 V0.2（当前目标）

* 打通从 Figma 组件库 → Context → UI 生成 → 自然语言编辑 → 导出的闭环：

  1. F0：组件库读取与标注

     * 最少支持基本字段自动标注和简单编辑；
  2. F1：任务 & PersonaLabel 输入与解析

     * 能从 TaskSpec 中识别 Stage & PersonaLabel，并完成 Context 组装；
  3. F2：一次生成多 UI Page，并在 Figma 中以多个 Frame 落地；
  4. F3：自然语言编辑

     * 支持单页和跨页操作（依据 scope 规则）；
     * 支持 UI-diff 生成与应用；
     * 支持最近一次编辑撤销；
  5. 支持基本 UI Schema 与编辑日志导出（JSON）。

### 7.2 后续版本（V0.3 / V1.0 展望）

> 以下不在本 PRD 范围，仅作为后续研究方向提示：

* 引入更高级的布局优化（如 NSGA-II）；
* 引入更丰富的一致性约束与冲突可视化界面；
* 对编辑任务进行 LoRA / Instruct-style 微调，并比较基础模型 vs 微调模型表现；
* 引入行为驱动的动态 Priority 调整（behavior_adjust）；
* 结合 VLM 或 Figma 截图直接进行“视觉级”编辑理解。

---