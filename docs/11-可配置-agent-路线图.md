<!--
[INPUT]: 依赖社区 issue #38、当前 enabledAgents/agents 配置和 Claude/Codex 会话格式
[OUTPUT]: 对外提供可配置 Agent 已落地范围与会话适配器后续路线
[POS]: docs 的 Agent 扩展路线图，区分通用启动配置与专属会话能力
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->
# 可配置 Agent 路线图（#38 建议一）

> 来源：社区 issue [#38](https://github.com/alchaincyf/fanbox/issues/38) 建议一。
> 状态：通用启动入口已在 v2.4.0 落地；会话发现、续会话与整理引擎仍需要逐个 Agent 适配。

## 当前边界

FanBox 已经能从 `~/.fanbox/config.json` 读取启用项和自定义 Agent，并在终端顶栏动态生成启动入口。仍然与具体 Agent 耦合的部分是：

- Agent 项目发现：分别扫描 Claude Code 与 Codex 的会话目录。
- 续会话：不同 CLI 有不同的会话标识和恢复命令。
- AI 整理引擎：当前只适配已验证的本地 CLI。
- Skills 扫描：不同 Agent 的 skill 目录和格式并不统一。

## 配置形态

内置 Agent 由应用提供稳定的 id、名称、命令和安装提示；高级用户可以在 `~/.fanbox/config.json` 的 `agents` 数组中覆盖同 id 项或追加新入口。启动配置只描述“如何启动”，不假装能统一所有会话格式。

```json
{
  "enabledAgents": ["claude", "codex", "pi"],
  "agents": [
    { "id": "pi", "label": "Pi AI", "cmd": "pi" },
    { "id": "aider", "label": "Aider", "cmd": "aider" }
  ]
}
```

## 难点：纯配置覆盖不了会话发现与续会话

`cmd` 和 `label` 是普通字符串，配置即可。但会话能力不能靠猜：

- Claude Code 会话位于 `~/.claude/projects/<编码后的cwd>/<uuid>.jsonl`，需要解析标题、改动文件和 session id。
- Codex 的会话文件、thread id 与 resume 调用方式不同。
- 第三方 Agent 可能没有公开且稳定的本地会话格式。

因此，没有适配器的 Agent 只提供启动入口；项目记忆和续会话能力必须在验证格式后单独接入。

## 后续：会话适配器

1. 定义最小接口：`listSessions(cwd)`、`sessionTitle(session)`、`resumeArgs(id)`、`changedFiles(session)`。
2. 把现有 Claude Code 与 Codex 解析逻辑收敛为两个内置适配器。
3. 缺少稳定会话格式的 Agent 明确显示“不支持会话回溯”，不做模糊猜测。
4. 社区新增适配器时必须附真实样本和回归验证，避免上游格式变化静默损坏。

## 不做

- 不为只提供桌面应用、没有终端 CLI 的产品伪造启动或会话能力。
- 不把不同 Agent 的会话格式硬塞进一份臃肿配置。
- 不在没有真实样本和稳定格式时承诺会话回溯。
