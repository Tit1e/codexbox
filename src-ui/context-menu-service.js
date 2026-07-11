/**
 * [INPUT]: 依赖 Svelte mount 与 ContextMenu.svelte
 * [OUTPUT]: 对外提供 createContextMenuService，暴露 popupMenu 与 closeContextMenu
 * [POS]: src-ui 的上下文菜单适配器，为原生业务控制器隐藏 Svelte 挂载生命周期
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { mount } from 'svelte';
import ContextMenu from './ContextMenu.svelte';

export function createContextMenuService() {
  let host = null;
  const ensure = () => {
    if (!host) host = mount(ContextMenu, { target: document.body });
    return host;
  };
  return {
    popupMenu: (event, items) => ensure().open(event, items),
    closeContextMenu: () => host?.close(),
  };
}
