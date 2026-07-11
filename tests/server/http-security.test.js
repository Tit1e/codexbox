/**
 * [INPUT]: 依赖 Node.js HTTP、stream、server/app-server、http-security 和 preview-server
 * [OUTPUT]: 验证 Host/Origin 防护、请求体上限与隔离预览路径边界
 * [POS]: tests/server 的 HTTP 安全集成测试，覆盖本机文件服务的网络入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { Readable } = require('node:stream');
const test = require('node:test');
const { createAppServer } = require('../../server/app-server');
const { hostAllowed, originAllowed, readBody, sendJSON } = require('../../server/http-security');
const { createPreviewServer } = require('../../server/preview-server');

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

function request(port, { path = '/', method = 'GET', headers = {}, body = '' } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({
        status: res.statusCode,
        body: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function appServer() {
  const noop = async () => ({});
  const services = new Proxy({
    defaultRoots: () => [],
    serveStatic: (_req, res) => { res.writeHead(404); res.end('not found'); },
  }, {
    get(target, key) { return key in target ? target[key] : noop; },
  });
  return createAppServer({
    home: '/home/test',
    platform: 'darwin',
    port: 8181,
    resolvePath: (value) => value,
    ext: (value) => String(value).split('.').pop(),
    hostAllowed,
    originAllowed,
    readBody,
    sendJSON,
    services,
  });
}

test('主服务拒绝非回环 Host，允许合法回环 Host', async () => {
  const server = appServer();
  const port = await listen(server);
  try {
    const denied = await request(port, { path: '/api/roots', headers: { Host: 'evil.example' } });
    assert.equal(denied.status, 403);
    assert.equal(denied.body, 'forbidden host');
    const allowed = await request(port, { path: '/api/roots', headers: { Host: `localhost:${port}` } });
    assert.equal(allowed.status, 200);
    assert.equal(JSON.parse(allowed.body).home, '/home/test');
  } finally {
    await close(server);
  }
});

test('主服务拒绝来自非回环 Origin 的写请求', async () => {
  const server = appServer();
  const port = await listen(server);
  try {
    const denied = await request(port, {
      path: '/api/term-verify',
      method: 'POST',
      headers: {
        Host: `127.0.0.1:${port}`,
        Origin: 'https://evil.example',
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    assert.equal(denied.status, 403);
    assert.equal(denied.body, 'forbidden origin');
  } finally {
    await close(server);
  }
});

test('请求体超过上限时停止解析并返回空对象', async () => {
  const req = Readable.from([Buffer.from('{"data":"'), Buffer.from('1234567890'), Buffer.from('"}')]);
  req.destroy = () => {};
  assert.deepEqual(await readBody(req, 12), {});
});

test('隔离预览服务只允许主目录内非隐藏路径的 /fs/ GET', async () => {
  const served = [];
  const server = createPreviewServer({
    home: '/Users/test',
    port: 8182,
    resolvePath: (value) => value,
    ext: (value) => String(value).split('.').pop(),
    hostAllowed,
    serveRaw: (_req, res, file) => { served.push(file); res.writeHead(200); res.end('raw'); },
    serveHtmlPreview: (_req, res, file) => { served.push(file); res.writeHead(200); res.end('html'); },
  });
  const port = await listen(server);
  try {
    assert.equal((await request(port, { path: '/api/roots' })).status, 403);
    assert.equal((await request(port, { path: '/fs/etc/passwd' })).status, 403);
    assert.equal((await request(port, { path: '/fs/Users/test/.ssh/config' })).status, 403);
    assert.equal((await request(port, { path: '/fs/Users/test/site/index.html' })).status, 200);
    assert.deepEqual(served, ['/Users/test/site/index.html']);
    assert.equal((await request(port, { path: '/fs/Users/test/site/index.html', method: 'POST' })).status, 405);
  } finally {
    await close(server);
  }
});
