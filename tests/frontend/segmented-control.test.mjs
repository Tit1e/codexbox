/**
 * [INPUT]: 依赖 happy-dom 与 public/generated/ui.mjs 中的 Svelte 通用按钮组服务
 * [OUTPUT]: 验证受控值、点击切换、方向键、焦点与无障碍选中状态
 * [POS]: tests/frontend 的 Svelte SegmentedControl 回归测试，保护共享按钮组交互契约
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { installDom } from './dom-environment.mjs';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('通用按钮组支持点击、外部同步和方向键切换', async () => {
  const dom = installDom('<div id="control"><button>旧节点</button></div>');
  try {
    const changes = [];
    const { createSegmentedControlService } = await import(new URL(`../../public/generated/ui.mjs?segment=${Date.now()}`, import.meta.url));
    const service = createSegmentedControlService();
    const control = service.mount({
      target: document.querySelector('#control'), value: 'name', variant: 'compact-text', ariaLabel: '排序方式',
      items: [{ value: 'name', label: '名称' }, { value: 'mtime', label: '时间' }, { value: 'size', label: '大小' }],
      onChange: (value) => changes.push(value),
    });
    assert.equal(document.querySelectorAll('#control button').length, 3);
    assert.equal(document.querySelector('[data-value="name"]').getAttribute('aria-checked'), 'true');
    document.querySelector('[data-value="mtime"]').click();
    await settle();
    assert.deepEqual(changes, ['mtime']);
    assert.equal(document.querySelector('[data-value="mtime"]').classList.contains('active'), true);
    control.setValue('size');
    await settle();
    const size = document.querySelector('[data-value="size"]');
    assert.equal(size.getAttribute('aria-checked'), 'true');
    size.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await settle();
    assert.deepEqual(changes, ['mtime', 'name']);
    assert.equal(document.activeElement, document.querySelector('[data-value="name"]'));
    await settle();
  } finally { dom.cleanup(); }
});
