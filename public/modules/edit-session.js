/**
 * [INPUT]: 依赖共享编辑 runtime 与确认弹窗回调
 * [OUTPUT]: 对外提供 guardEditExit，统一处理自动保存、未保存确认和编辑状态清理
 * [POS]: public/modules 的编辑会话安全叶子模块，被导航、预览关闭和编辑器切换消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
export async function guardEditExit(runtime, confirmDialog) {
  if (runtime.autosaveFlush) {
    const flush = runtime.autosaveFlush;
    runtime.autosaveFlush = null;
    runtime.dirtyCheck = null;
    runtime.currentEditor = null;
    await flush();
    return true;
  }
  if (runtime.dirtyCheck && runtime.dirtyCheck()) {
    const confirmed = await confirmDialog('当前编辑有未保存的改动，放弃并离开？');
    if (!confirmed) return false;
  }
  runtime.dirtyCheck = null;
  return true;
}
