/**
 * [INPUT]: 依赖 Node.js fs/path 与 node-pty prebuilds 目录
 * [OUTPUT]: 对外提供 ensureDarwinSpawnHelpersExecutable，恢复 macOS PTY 辅助程序执行权限
 * [POS]: build 模块的 node-pty 权限单一真源，被本地安装脚本和发布打包钩子复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
'use strict';

const fs = require('fs');
const path = require('path');

function ensureDarwinSpawnHelpersExecutable(prebuilds) {
  const helpers = fs.readdirSync(prebuilds, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('darwin-'))
    .map((entry) => path.join(prebuilds, entry.name, 'spawn-helper'))
    .filter((file) => fs.existsSync(file));
  if (helpers.length === 0) throw new Error(`node-pty spawn-helper 不存在：${prebuilds}`);
  helpers.forEach((file) => fs.chmodSync(file, 0o755));
  return helpers;
}

module.exports = { ensureDarwinSpawnHelpersExecutable };
