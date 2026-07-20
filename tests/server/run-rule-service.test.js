/**
 * [INPUT]: 依赖 node:test、临时配置内存替身与 server/run-rule-service
 * [OUTPUT]: 验证运行规则的保存、最长祖先目录继承与路径边界
 * [POS]: tests/server 的项目运行规则回归测试，防止子目录命令误继承或错误目录匹配
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { createRunRuleService, isAncestorPath } = require('../../server/run-rule-service');

function harness(initial = {}) {
  let config = structuredClone(initial);
  const service = createRunRuleService({
    resolvePath: (value) => path.resolve('/', value),
    readConfig: async () => structuredClone(config),
    updateConfig: async (mutate) => {
      await mutate(config);
      return structuredClone(config);
    },
  });
  return { service, config: () => structuredClone(config) };
}

test('最长祖先目录规则决定命令和实际运行目录', async () => {
  const { service } = harness({ runRules: [
    { id: 'rule_parent_1', cwd: '/a', command: 'npm run dev' },
    { id: 'rule_child_01', cwd: '/a/bb', command: 'pnpm dev' },
  ] });

  const child = await service.ruleFor('/a/bb/src');
  assert.deepEqual(child.rule, { id: 'rule_child_01', cwd: '/a/bb', command: 'pnpm dev', inherited: true });
  const parent = await service.ruleFor('/a/docs');
  assert.deepEqual(parent.rule, { id: 'rule_parent_1', cwd: '/a', command: 'npm run dev', inherited: true });
  const exact = await service.ruleFor('/a');
  assert.equal(exact.rule.inherited, false);
});

test('路径关系不把相同字符串前缀误判成继承', async () => {
  assert.equal(isAncestorPath('/a', '/a/b'), true);
  assert.equal(isAncestorPath('/a', '/abc'), false);
  const { service } = harness({ runRules: [{ cwd: '/a', command: 'npm run dev' }] });
  assert.equal((await service.ruleFor('/abc')).rule, null);
});

test('保存同一目录时替换命令且保留其他目录规则', async () => {
  const { service, config } = harness({ runRules: [
    { id: 'rule_parent_1', cwd: '/a', command: 'npm run dev' },
    { id: 'rule_other_01', cwd: '/other', command: 'bun dev' },
  ] });

  const saved = await service.saveRule({ path: '/a/', command: 'pnpm dev' });
  assert.deepEqual(saved.rule, { id: 'rule_parent_1', cwd: '/a', command: 'pnpm dev' });
  assert.deepEqual(config().runRules, [
    { id: 'rule_parent_1', cwd: '/a', command: 'pnpm dev' },
    { id: 'rule_other_01', cwd: '/other', command: 'bun dev' },
  ]);
});

test('旧配置会获得稳定标识，删除只影响指定目录规则', async () => {
  const { service, config } = harness({ runRules: [
    { cwd: '/a', command: 'npm run dev' },
    { id: 'rule_child_01', cwd: '/a/app', command: 'pnpm dev' },
  ] });
  const first = await service.ruleFor('/a/docs');
  const second = await service.ruleFor('/a/docs');
  assert.equal(first.rule.id, second.rule.id);
  assert.match(first.rule.id, /^legacy_/);

  assert.deepEqual(await service.removeRule({ path: '/a/app' }), { ok: true, removed: true });
  assert.deepEqual(config().runRules, [{ id: first.rule.id, cwd: '/a', command: 'npm run dev' }]);
  assert.deepEqual(await service.removeRule({ path: '/missing' }), { ok: true, removed: false });
});

test('拒绝空命令和含 NUL 的目录', async () => {
  const { service } = harness();
  await assert.rejects(service.saveRule({ path: '/a', command: '   ' }), /不能为空/);
  await assert.rejects(service.ruleFor('/a\0bad'), /无效/);
});
