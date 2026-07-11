/**
 * [INPUT]: 依赖 happy-dom 与 public/generated/ui.mjs 中的 Svelte 发布向导服务
 * [OUTPUT]: 验证项目检查、版本递增、发布选项提交和终端命令启动
 * [POS]: tests/frontend 的 Svelte ReleasePanel 回归测试，保护发布工作流参数边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { installDom } from './dom-environment.mjs';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('发布向导检查项目并把确认参数交给终端', async () => {
  const dom = installDom();
  try {
    const inspections = [], preparations = [], commands = [];
    const { createReleasePanelService } = await import(new URL(`../../public/generated/ui.mjs?release=${Date.now()}`, import.meta.url));
    const service = createReleasePanelService({
      api: async (url) => {
        inspections.push(url);
        return { ok: true, version: '2.6.8', unreleased: '修复终端', hasDist: true, remote: true, gh: true, dirty: true, isRepo: true };
      },
      apiPost: async (url, payload) => {
        preparations.push({ url, payload });
        return { ok: true, cmd: 'npm version 2.6.9 && npm run dist' };
      },
      notify: () => {},
      runCommand: (...args) => commands.push(args),
    });
    await service.releasePanel('/repo');
    await settle();
    assert.match(inspections[0], /path=%2Frepo/);
    assert.equal(document.querySelector('#rel-ver').value, '2.6.9');
    assert.equal(document.querySelector('#rel-notes').value, '修复终端');
    assert.equal(document.querySelectorAll('.rel-opts input:checked').length, 3);
    document.querySelector('button.primary').click();
    await settle();
    assert.deepEqual(preparations, [{
      url: '/api/release/prepare',
      payload: { path: '/repo', version: '2.6.9', notes: '修复终端', doDist: true, doPush: true, doRelease: true },
    }]);
    assert.deepEqual(commands, [['/repo', 'npm version 2.6.9 && npm run dist', 'v2.6.9 发版序列已在终端开跑']]);
    assert.equal(document.querySelector('.rel-overlay'), null);
  } finally { dom.cleanup(); }
});
