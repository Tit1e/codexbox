/**
 * [INPUT]: 依赖 Node.js 测试库与 electron/dev-reload-service.js 的注入式开发刷新守卫
 * [OUTPUT]: 验证无终端直接刷新、有终端确认保护、重复请求去重和专用重启退出码
 * [POS]: tests/electron 的开发热重载安全边界单元测试，不启动真实 Electron
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { DEV_RESTART_EXIT_CODE, createDevReloadService } = require('../../electron/dev-reload-service');

function harness({ terminals = 0, response = 0 } = {}) {
  const calls = { exit: [], killAll: 0, reload: 0, dialog: [] };
  const win = { isDestroyed: () => false, webContents: { reloadIgnoringCache() { calls.reload++; } } };
  const service = createDevReloadService({
    app: { exit: (code) => calls.exit.push(code) },
    dialog: { async showMessageBox(_win, options) { calls.dialog.push(options); return { response }; } },
    ptyService: { count: () => terminals, killAll() { calls.killAll++; } },
    getWindow: () => win,
  });
  return { calls, service };
}

test('没有终端时直接刷新渲染层', async () => {
  const { calls, service } = harness();
  assert.equal(await service.request('reload'), true);
  assert.equal(calls.reload, 1);
  assert.equal(calls.killAll, 1);
  assert.equal(calls.dialog.length, 0);
});

test('存在终端时取消刷新并保留终端', async () => {
  const { calls, service } = harness({ terminals: 2, response: 0 });
  assert.equal(await service.request('reload'), false);
  assert.equal(calls.reload, 0);
  assert.equal(calls.killAll, 0);
  assert.match(calls.dialog[0].detail, /2 个终端/);
});

test('确认重启后关闭终端并使用专用退出码', async () => {
  const { calls, service } = harness({ terminals: 1, response: 1 });
  assert.equal(await service.request('restart'), true);
  assert.equal(calls.killAll, 1);
  assert.deepEqual(calls.exit, [DEV_RESTART_EXIT_CODE]);
});

test('确认期间忽略重复请求', async () => {
  let resolveDialog;
  const pending = new Promise((resolve) => { resolveDialog = resolve; });
  const service = createDevReloadService({
    app: { exit() {} },
    dialog: { showMessageBox: () => pending },
    ptyService: { count: () => 1, killAll() {} },
  });
  const first = service.request('reload');
  assert.equal(await service.request('restart'), false);
  resolveDialog({ response: 0 });
  assert.equal(await first, false);
});
