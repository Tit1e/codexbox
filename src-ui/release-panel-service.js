/**
 * [INPUT]: 依赖 Svelte mount、ReleasePanel.svelte、发布 HTTP API、提示与终端控制器
 * [OUTPUT]: 对外提供 createReleasePanelService，暴露 releasePanel(directory)
 * [POS]: src-ui 的发布向导适配器，连接表单与现有发布命令生成链
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { mount } from 'svelte';
import ReleasePanel from './ReleasePanel.svelte';
export function createReleasePanelService({ api, apiPost, notify, runCommand }) {
  let host = null;
  const ensure = () => host ||= mount(ReleasePanel, { target: document.body, props: {
    inspect: (path) => api('/api/release/inspect?path=' + encodeURIComponent(path)),
    prepare: (payload) => apiPost('/api/release/prepare', payload), notify, runCommand,
  } });
  return { releasePanel: (directory) => ensure().open(directory) };
}
