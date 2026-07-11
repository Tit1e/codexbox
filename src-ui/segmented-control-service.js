/**
 * [INPUT]: 依赖 Svelte mount 与 SegmentedControl.svelte
 * [OUTPUT]: 对外提供 createSegmentedControlService，按目标容器挂载受控按钮组
 * [POS]: src-ui 的按钮组适配层，为原生状态控制器隐藏 Svelte 生命周期
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { mount } from 'svelte';
import SegmentedControl from './SegmentedControl.svelte';

export function createSegmentedControlService() {
  return {
    mount({ target, items, value, onChange, variant, ariaLabel }) {
      target.replaceChildren();
      return mount(SegmentedControl, { target, props: { items, value, onChange, variant, ariaLabel } });
    },
  };
}
