/**
 * [INPUT]: 依赖 happy-dom 与 public/generated/ui.mjs 中的 Svelte 快速入口服务
 * [OUTPUT]: 验证根目录渲染、活动高亮、目录懒加载与导航动作
 * [POS]: tests/frontend 的 Svelte RootsList 回归测试，保护快速入口目录树
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { installDom } from './dom-environment.mjs';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('快速入口渲染根目录并支持活动高亮和展开导航', async () => {
  const dom = installDom('<ul id="roots-list" class="nav-list"></ul>');
  try {
    const calls = [];
    const { createRootsService } = await import(new URL(`../../public/generated/ui.mjs?roots=${Date.now()}`, import.meta.url));
    const service = createRootsService({
      target: document.querySelector('#roots-list'),
      api: async (url) => { calls.push(['api', url]); return { entries: [{ name: 'Child', path: '/home/child', isDir: true, hidden: false }] }; },
      navigate: (path) => calls.push(['navigate', path]),
      makeDraggable: (_node, path) => calls.push(['drag', path]),
      folderIcon: '<svg data-folder></svg>',
    });
    service.render([{ name: 'Home', path: '/home' }], '/home');
    await settle();
    const root = document.querySelector('li[data-path="/home"]');
    assert.equal(root.classList.contains('active'), true);
    root.querySelector('.twirl').click();
    await settle();
    assert.equal(document.querySelectorAll('li[data-path="/home/child"]').length, 1);
    document.querySelector('li[data-path="/home/child"]').click();
    assert.deepEqual(calls.find((call) => call[0] === 'navigate'), ['navigate', '/home/child']);
    service.setActive('/home/child');
    await settle();
    assert.equal(document.querySelector('li[data-path="/home/child"]').classList.contains('active'), true);
  } finally { dom.cleanup(); }
});
