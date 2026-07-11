/**
 * [INPUT]: 依赖 Svelte mount、RootsList.svelte、目录 API 与导航/拖拽回调
 * [OUTPUT]: 对外提供 createRootsService，暴露 render/setActive
 * [POS]: src-ui 的快速入口适配层，连接根目录数据与 Svelte 目录树
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { mount } from 'svelte';
import RootsList from './RootsList.svelte';

export function createRootsService({ target, api, navigate, makeDraggable, folderIcon }) {
  let host = null;
  const ensure = () => host ||= mount(RootsList, { target, props: {
    navigate, makeDraggable, folderIcon,
    listDirectories: async (path) => {
      const data = await api('/api/list?path=' + encodeURIComponent(path));
      return (data.entries || []).filter((entry) => entry.isDir && !entry.hidden);
    },
  } });
  return {
    render: (roots, activePath) => ensure().render(roots, activePath),
    setActive: (path) => ensure().setActive(path),
  };
}
