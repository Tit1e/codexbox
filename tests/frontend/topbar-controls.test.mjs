/**
 * [INPUT]: 依赖 happy-dom 测试环境、public/index.html 与 public/styles/workspace.css
 * [OUTPUT]: 验证隐藏文件复选框保留原生语义，并具备三套主题的自定义视觉契约
 * [POS]: tests/frontend 的顶栏控件回归测试，防止主题化复选框退回系统原生样式
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { installDom } from './dom-environment.mjs';

test('隐藏文件控件保留可点击的原生 checkbox 语义', async () => {
  const index = await readFile(new URL('../../public/index.html', import.meta.url), 'utf8');
  const markup = index.match(/<label class="toggle"[\s\S]*?<\/label>/)?.[0];
  assert.ok(markup);
  const dom = installDom(markup);
  try {
    const input = document.querySelector('#toggle-hidden');
    assert.equal(input.type, 'checkbox');
    assert.ok(document.querySelector('.toggle-box[aria-hidden="true"]'));
    document.querySelector('.toggle').click();
    assert.equal(input.checked, true);
  } finally { dom.cleanup(); }
});

test('隐藏文件控件为三套主题声明独立表面样式', async () => {
  const css = await readFile(new URL('../../public/styles/workspace.css', import.meta.url), 'utf8');
  assert.match(css, /\.toggle input:checked \+ \.toggle-box/);
  assert.match(css, /\.toggle input:focus-visible \+ \.toggle-box/);
  ['terminal', 'warm', 'editorial'].forEach((theme) => {
    assert.match(css, new RegExp(`\\[data-theme="${theme}"\\] \\.toggle-box`));
  });
  assert.match(css, /\[data-theme="editorial"\] \.toggle-box::after \{[^}]*left: 50%; top: 50%/);
  assert.match(css, /\[data-theme="editorial"\] \.toggle input:checked \+ \.toggle-box::after \{[^}]*translate\(-50%, -55%\)/);
});
