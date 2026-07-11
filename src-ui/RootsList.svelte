<!--
  [INPUT]: 依赖快捷根目录数据、当前目录、目录读取及导航/拖拽回调
  [OUTPUT]: 对外提供 render/setActive 接口，渲染可递归展开的快捷目录树
  [POS]: src-ui 的快速入口界面岛，复用 ProjectDirectory 目录节点
  [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->
<script>
  import ProjectDirectory from './ProjectDirectory.svelte';
  let { listDirectories, navigate, makeDraggable, folderIcon } = $props();
  let roots = $state([]), activePath = $state('');
  export function render(list, currentPath) { roots = list; activePath = currentPath; }
  export function setActive(path) { activePath = path; }
</script>

{#each roots as root (root.path)}
  <ProjectDirectory item={root} {activePath} {listDirectories} {navigate} {makeDraggable} {folderIcon} />
{/each}
