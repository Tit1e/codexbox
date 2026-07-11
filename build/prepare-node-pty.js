/**
 * [INPUT]: 依赖本项目 node_modules/node-pty 与 node-pty-permissions.js 权限工具
 * [OUTPUT]: 作为 npm postinstall 修复本地 macOS spawn-helper 可执行权限
 * [POS]: build 模块的本地依赖准备入口，保证开发环境安装后可创建 PTY
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
'use strict';

const path = require('path');
const { ensureDarwinSpawnHelpersExecutable } = require('./node-pty-permissions');

function prepareNodePty(root = path.resolve(__dirname, '..')) {
  if (process.platform !== 'darwin') return [];
  const prebuilds = path.join(root, 'node_modules', 'node-pty', 'prebuilds');
  return ensureDarwinSpawnHelpersExecutable(prebuilds);
}

if (require.main === module) prepareNodePty();

module.exports = { prepareNodePty };
