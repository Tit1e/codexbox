/**
 * [INPUT]: 依赖 electron-builder afterPack 上下文与打包后 node-pty 目录
 * [OUTPUT]: 对外提供 afterPack 钩子和 ensureNodePtyHelpersExecutable 权限修复函数
 * [POS]: build 模块的 macOS 打包修复器，在代码签名前恢复 node-pty spawn-helper 可执行位
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
'use strict';

const path = require('path');
const { ensureDarwinSpawnHelpersExecutable } = require('./node-pty-permissions');

function ensureNodePtyHelpersExecutable(appOutDir, productFilename) {
  const prebuilds = path.join(
    appOutDir,
    `${productFilename}.app`,
    'Contents',
    'Resources',
    'app.asar.unpacked',
    'node_modules',
    'node-pty',
    'prebuilds',
  );
  return ensureDarwinSpawnHelpersExecutable(prebuilds);
}

async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;
  ensureNodePtyHelpersExecutable(context.appOutDir, context.packager.appInfo.productFilename);
}

module.exports = afterPack;
module.exports.ensureNodePtyHelpersExecutable = ensureNodePtyHelpersExecutable;
