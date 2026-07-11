/**
 * [INPUT]: 依赖 Node.js 临时目录、package.json 与 build/after-pack.js
 * [OUTPUT]: 验证 macOS 打包钩子恢复全部 node-pty spawn-helper 可执行位并拒绝缺失产物
 * [POS]: tests/electron 的发布包权限回归测试，防止安装版终端再次出现 posix_spawnp failed
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { ensureNodePtyHelpersExecutable } = require('../../build/after-pack');
const packageJson = require('../../package.json');

test('打包钩子恢复所有 macOS spawn-helper 可执行位', async () => {
  const out = await fsp.mkdtemp(path.join(os.tmpdir(), 'codexbox-pack-'));
  const prebuilds = path.join(out, 'CodexBox.app', 'Contents', 'Resources', 'app.asar.unpacked', 'node_modules', 'node-pty', 'prebuilds');
  try {
    for (const arch of ['darwin-arm64', 'darwin-x64']) {
      const dir = path.join(prebuilds, arch);
      await fsp.mkdir(dir, { recursive: true });
      await fsp.writeFile(path.join(dir, 'spawn-helper'), 'binary', { mode: 0o644 });
    }
    const helpers = ensureNodePtyHelpersExecutable(out, 'CodexBox');
    assert.equal(helpers.length, 2);
    helpers.forEach((file) => assert.equal(fs.statSync(file).mode & 0o111, 0o111));
  } finally {
    await fsp.rm(out, { recursive: true, force: true });
  }
});

test('打包与本地安装配置均启用权限修复且缺少辅助程序时立即失败', async () => {
  assert.equal(packageJson.build.afterPack, 'build/after-pack.js');
  assert.equal(packageJson.scripts.postinstall, 'node build/prepare-node-pty.js');
  const out = await fsp.mkdtemp(path.join(os.tmpdir(), 'codexbox-pack-empty-'));
  const prebuilds = path.join(out, 'CodexBox.app', 'Contents', 'Resources', 'app.asar.unpacked', 'node_modules', 'node-pty', 'prebuilds');
  try {
    await fsp.mkdir(prebuilds, { recursive: true });
    assert.throws(() => ensureNodePtyHelpersExecutable(out, 'CodexBox'), /spawn-helper 不存在/);
  } finally {
    await fsp.rm(out, { recursive: true, force: true });
  }
});
