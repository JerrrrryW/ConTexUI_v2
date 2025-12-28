## ConTexUI v2 — 多 Agent + Trace 版

### 能力概览
- 后端编排器：抽取 → NSGA-II 信息层级平衡 → 两段式组件检索（算法候选 + LLM 裁决），全过程写入 Trace（`server/traces/*.json`）。
- 抽取健壮性：解析结果自带 completeness 标记，缺字段会在 UI 明示，不会静默失败。
- Trace 导出：UI 里可一键导出/复制最近一次运行的 Trace，包含 agent 顺序、迭代轮次、候选与裁决信息。
- 组件检索：严格“算法检索只读优先级 → LLM 最终裁决”，不会反写信息层级。

### 启动
1) 安装依赖：`npm install`  
2) 运行本地后端：`cd server && node server.js`（默认 `http://localhost:4000`，需环境变量 `OPENAI_API_KEY` 或预置 GEMINI_KEY）。  
3) Figma 中加载插件开发版本，确保 manifest 的 devAllowedDomains 包含 `http://localhost:4000`。

### 关键操作
- **多 Agent 生成 + Trace**：在“需求文档”区域粘贴文本，点击“多 Agent 生成 + Trace”，等待完成后可在“Trace 导出”卡片查看/复制 JSON。
- **抽取提示**：若解析缺少阶段/角色/条件/信息项/页面，UI 会显示“抽取缺失字段…”，需补充文档后重跑。
- **组件检索**：绑定页的 AI 推荐已改为两段式检索，检索阶段不修改优先级。

### 目录说明
- `code.ts`：插件主逻辑与 orchestrator 调用、Trace 导出、错误提示。
- `ui.html`：界面（多 Agent 入口、Trace 导出、抽取缺失提示）。
- `server/server.js`：编排器、NSGA-II 平衡、两段式检索、Trace 持久化。
