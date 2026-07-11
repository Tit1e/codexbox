/**
 * [INPUT]: 依赖 Node.js path、Buffer 与调用方注入的文件系统能力
 * [OUTPUT]: 对外提供 PTY、目录监听、拖入文件和更新 IPC 的纯参数校验函数
 * [POS]: electron 模块的 IPC 安全契约，被主进程处理器和 Node 测试共同消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
'use strict';

const path = require('path');

const MAX_PTY_INPUT = 1024 * 1024;
const MAX_DROP_BYTES = 64 * 1024 * 1024;
const MAX_WATCH_DIRS = 24;

function validPtyId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);
}

function normalizeTerminalSize(cols, rows) {
  const number = (value, fallback, min, max) => {
    if (value === null || value === undefined || value === '') return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.trunc(parsed)));
  };
  return { cols: number(cols, 80, 2, 500), rows: number(rows, 24, 1, 300) };
}

function validPtyInput(value) {
  return typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= MAX_PTY_INPUT;
}

function validDirectory(value, fs) {
  if (typeof value !== 'string' || !value || value.includes('\0')) return false;
  try { return fs.statSync(path.resolve(value)).isDirectory(); } catch { return false; }
}

function normalizeWatchDirs(values, fs) {
  if (!Array.isArray(values)) return [];
  const result = [];
  for (const value of values) {
    if (!validDirectory(value, fs)) continue;
    const resolved = path.resolve(value);
    if (!result.includes(resolved)) result.push(resolved);
    if (result.length >= MAX_WATCH_DIRS) break;
  }
  return result;
}

function safeDropName(value, fallback = '拖入文件') {
  const name = String(value || fallback).trim().replace(/[/\\:\0]/g, '_');
  if (!name || name === '.' || name === '..') return fallback;
  return name.slice(0, 255);
}

function safeBuffer(value) {
  let buffer;
  try { buffer = Buffer.from(value); } catch { return null; }
  return buffer.length <= MAX_DROP_BYTES ? buffer : null;
}

function validVersion(value) {
  const version = String(value || '').replace(/^v/, '');
  return /^\d+\.\d+\.\d+$/.test(version) ? version : null;
}

function validGithubUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' && url.hostname === 'github.com';
  } catch { return false; }
}

module.exports = {
  MAX_DROP_BYTES,
  MAX_PTY_INPUT,
  MAX_WATCH_DIRS,
  validPtyId,
  normalizeTerminalSize,
  validPtyInput,
  validDirectory,
  normalizeWatchDirs,
  safeDropName,
  safeBuffer,
  validVersion,
  validGithubUrl,
};
