/**
 * [INPUT]: 依赖调用方提供的开发模式标记与 FANBOX_PORT 环境变量
 * [OUTPUT]: 对外提供 PROD_PORT、DEV_PORT、readPort 与 resolvePort
 * [POS]: 根模块的端口配置真源，被 server.js 和 Electron 主进程共同使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
'use strict';

const PROD_PORT = 4567;
const DEV_PORT = 4577;

function readPort(value, fallback) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port < 65535 ? port : fallback;
}

function resolvePort({ dev = false, value = process.env.FANBOX_PORT } = {}) {
  return readPort(value, dev ? DEV_PORT : PROD_PORT);
}

module.exports = { PROD_PORT, DEV_PORT, readPort, resolvePort };
