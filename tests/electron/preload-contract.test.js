/**
 * [INPUT]: 依赖 Node.js 文件读取与 electron/main.js、preload.js IPC 字符串
 * [OUTPUT]: 验证 preload 使用的 invoke/send 频道均在主进程注册，并校验桌面 Codex 新会话快捷键事件链
 * [POS]: tests/electron 的跨文件 IPC 与菜单快捷键契约测试，防止桥接改名漂移
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
'use strict';

const assert = require('node:assert/strict');
const fsp = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');

test('preload 发出的 IPC 频道全部由主进程注册', async () => {
  const root = path.resolve(__dirname, '..', '..');
  const preload = await fsp.readFile(path.join(root, 'electron', 'preload.js'), 'utf8');
  const main = await fsp.readFile(path.join(root, 'electron', 'main.js'), 'utf8');
  const sent = [...preload.matchAll(/ipcRenderer\.(?:invoke|send)\('([^']+)'/g)].map((match) => match[1]);
  const registered = new Set([...main.matchAll(/ipcMain\.(?:handle|on)\('([^']+)'/g)].map((match) => match[1]));
  assert.ok(sent.length > 0);
  assert.deepEqual(sent.filter((channel) => !registered.has(channel)), []);
});

test('preload 事件订阅都提供 removeListener 清理函数', async () => {
  const preload = await fsp.readFile(path.resolve(__dirname, '..', '..', 'electron', 'preload.js'), 'utf8');
  const subscribed = [...preload.matchAll(/ipcRenderer\.on\('([^']+)'/g)].map((match) => match[1]);
  const removed = new Set([...preload.matchAll(/ipcRenderer\.removeListener\('([^']+)'/g)].map((match) => match[1]));
  assert.ok(subscribed.length > 0);
  assert.deepEqual(subscribed.filter((channel) => !removed.has(channel)), []);
});

test('Cmd/Ctrl+Shift+N 菜单事件贯通 Codex 新会话桥接', async () => {
  const root = path.resolve(__dirname, '..', '..');
  const main = await fsp.readFile(path.join(root, 'electron', 'main.js'), 'utf8');
  const preload = await fsp.readFile(path.join(root, 'electron', 'preload.js'), 'utf8');
  assert.match(main, /accelerator:\s*'CmdOrCtrl\+Shift\+N'/);
  assert.match(main, /send\('terminal:launch-codex-new'\)/);
  assert.match(preload, /onLaunchNewCodex:[\s\S]*ipcRenderer\.on\('terminal:launch-codex-new'/);
});
