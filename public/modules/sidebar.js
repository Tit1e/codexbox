/**
 * [INPUT]: 依赖 DOM/API 基础能力、共享 state、导航、通用弹层回调与 Svelte Codex 项目列表服务
 * [OUTPUT]: 对外提供 createSidebarController，管理根目录元数据、收藏和 Codex 项目业务
 * [POS]: public/modules 的侧边栏领域控制器，被应用入口初始化和导航流程消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
export function createSidebarController(deps) {
  const { api, apiPost, state, dirOf, navigate, openPreview, renderFiles, toast, confirmDialog, popupMenu, codexProjects, favorites, roots } = deps;
// ---------- 侧边栏 ----------
async function loadRoots() {
  const data = await api('/api/roots');
  state.home = data.home;
  state.platform = data.platform;
  state.sep = data.sep || '/';
  roots.render(data.roots, state.cwd);
}
function renderRootsActive() {
  // 快速入口 / 收藏 / Codex 项目三个列表统一高亮「当前所在目录」，让用户清楚自己点开/身处哪一项
  roots.setActive(state.cwd);
  codexProjects.setActive(state.cwd);
  favorites.setActive(state.cwd);
}
async function loadFavorites() {
  const data = await api('/api/favorites');
  state.favorites = data.favorites || [];
  state.recentOpened = data.recentOpened || [];
  renderFavs();
}
function renderFavs() {
  favorites.render(state.favorites, state.cwd);
}
async function openFavoriteFile(favorite) {
  await navigate(dirOf(favorite.path));
  const entry = state.entries.find((item) => item.path === favorite.path);
  if (entry) { state.selected = favorite.path; openPreview(entry); renderFiles(); }
}
// Codex 项目：从本机 Codex 会话日志发现最近处理过的项目文件夹
const codexProjectActions = new Set();
async function runCodexProjectAction(pj, action) {
  if (codexProjectActions.has(pj.path)) return;
  codexProjectActions.add(pj.path);
  try {
    const info = await apiPost('/api/codex-projects/inspect', { path: pj.path, action });
    if (!info.ok) { toast(info.error || '读取 Codex 会话失败', true); return; }
    if (!info.total) { toast('没有找到可处理的 Codex 会话', true); return; }
    if (info.running) { toast(`有 ${info.running} 条会话正在运行，请先结束后再操作`, true); return; }
    const verb = action === 'archive' ? '归档' : '永久删除';
    const suffix = action === 'archive' ? '之后可在 Codex 中恢复。' : '此操作不可恢复。';
    if (!await confirmDialog(`${verb}「${pj.name}」的 ${info.total} 条会话？${suffix}`)) return;
    toast(action === 'archive' ? '正在归档…' : '正在删除…');
    const result = await apiPost(`/api/codex-projects/${action}`, { path: pj.path, snapshot: info.snapshot });
    if (!result.ok) { toast(result.error || `${verb}失败`, true); }
    else { toast(action === 'archive' ? `已归档 ${result.succeeded} 条会话` : `已删除 ${result.succeeded} 条会话`); }
    if (result.succeeded) {
      await loadCodexProjects();
    }
  } catch {
    toast(action === 'archive' ? '归档失败' : '删除失败', true);
  } finally {
    codexProjectActions.delete(pj.path);
  }
}
function showCodexProjectMenu(ev, pj) {
  ev.preventDefault();
  ev.stopPropagation();
  popupMenu(ev, [
    { label: '归档', fn: () => runCodexProjectAction(pj, 'archive') },
    { label: '删除', danger: true, fn: () => runCodexProjectAction(pj, 'delete') },
  ]);
}
async function loadCodexProjects() {
  let data;
  try { data = await api('/api/codex-projects'); } catch { return; }
  const list = (data.projects || []).slice(0, 8);
  codexProjects.render(list, state.cwd);
}


  return { loadRoots, renderRootsActive, loadFavorites, renderFavs, loadCodexProjects, showCodexProjectMenu, openFavoriteFile };
}
