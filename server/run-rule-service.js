/**
 * [INPUT]: 依赖 Node.js path、路径规整器与配置读写服务
 * [OUTPUT]: 对外提供 createRunRuleService，读写单目录运行规则并按最长祖先目录解析生效规则
 * [POS]: server 模块的项目运行命令领域服务，被 app-server.js 暴露给渲染层配置界面
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
'use strict';

const path = require('path');

const MAX_COMMAND_LENGTH = 16384;

function isAncestorPath(ancestor, target) {
  const relative = path.relative(ancestor, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function createRunRuleService({ resolvePath, readConfig, updateConfig }) {
  function normalizeDirectory(value) {
    if (typeof value !== 'string' || !value.trim() || value.includes('\0')) throw new Error('运行目录无效');
    const directory = path.normalize(resolvePath(value));
    if (!path.isAbsolute(directory)) throw new Error('运行目录必须是绝对路径');
    return directory;
  }

  function normalizeCommand(value) {
    if (typeof value !== 'string') throw new Error('运行命令无效');
    const command = value.trim();
    if (!command) throw new Error('运行命令不能为空');
    if (command.includes('\0') || command.length > MAX_COMMAND_LENGTH) throw new Error('运行命令无效');
    return command;
  }

  function rulesFrom(config) {
    const byDirectory = new Map();
    for (const item of Array.isArray(config.runRules) ? config.runRules : []) {
      try {
        const cwd = normalizeDirectory(item?.cwd);
        const command = normalizeCommand(item?.command);
        byDirectory.set(cwd, { cwd, command });
      } catch { /* 忽略旧版或损坏的单条配置，不影响其余规则 */ }
    }
    return [...byDirectory.values()];
  }

  async function ruleFor(value) {
    const target = normalizeDirectory(value);
    const config = await readConfig();
    const rule = rulesFrom(config)
      .filter((item) => isAncestorPath(item.cwd, target))
      .sort((left, right) => right.cwd.length - left.cwd.length)[0] || null;
    return {
      ok: true,
      path: target,
      rule: rule && { ...rule, inherited: rule.cwd !== target },
    };
  }

  async function saveRule({ path: value, command: valueCommand }) {
    const cwd = normalizeDirectory(value);
    const command = normalizeCommand(valueCommand);
    const config = await updateConfig((current) => {
      const rules = rulesFrom(current).filter((item) => item.cwd !== cwd);
      rules.push({ cwd, command });
      current.runRules = rules.sort((left, right) => left.cwd.localeCompare(right.cwd));
    });
    return { ok: true, rule: rulesFrom(config).find((item) => item.cwd === cwd) };
  }

  return { ruleFor, saveRule };
}

module.exports = { createRunRuleService, isAncestorPath };
