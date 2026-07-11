<!--
  [INPUT]: 依赖选项、当前值、尺寸变体与变更回调
  [OUTPUT]: 对外提供 setValue，渲染支持方向键的受控按钮组
  [POS]: src-ui 的通用按钮组组件，被顶栏筛选和侧栏皮肤选择共同复用
  [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->
<script>
  let { items, value = $bindable(), onChange, variant = 'regular', ariaLabel = '选项' } = $props();
  let group;

  export function setValue(nextValue) { value = nextValue; }

  function select(nextValue, focus = false) {
    if (nextValue === value) return;
    value = nextValue;
    onChange(nextValue);
    if (focus) queueMicrotask(() => group?.querySelector(`[data-value="${CSS.escape(nextValue)}"]`)?.focus());
  }
  function move(event, index) {
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % items.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;
    event.preventDefault();
    select(items[next].value, true);
  }
</script>

<div class={`segmented-control ${variant}`} role="radiogroup" aria-label={ariaLabel} bind:this={group}>
  {#each items as item, index (item.value)}
    <button
      type="button" role="radio" aria-checked={value === item.value}
      class:active={value === item.value} tabindex={value === item.value ? 0 : -1}
      data-value={item.value} title={item.title || undefined}
      onclick={() => select(item.value)} onkeydown={(event) => move(event, index)}
    >{item.label}</button>
  {/each}
</div>

<style>
  .segmented-control { display: flex; width: 100%; }
  button {
    flex: 0 0 auto; box-sizing: border-box; height: 30px; margin: 0;
    border: 1px solid var(--border); border-radius: 0; padding: 0 10px;
    background: var(--bg-3); color: var(--text-dim); cursor: pointer;
    font: 12px var(--font-ui); transition: background-color 0.12s, border-color 0.12s, color 0.12s;
  }
  button + button { margin-left: -1px; }
  button:first-child { border-radius: 7px 0 0 7px; }
  button:last-child { border-radius: 0 7px 7px 0; }
  button:hover:not(.active) { background: var(--accent-soft); color: var(--text); }
  button:focus-visible { z-index: 2; outline: 2px solid var(--accent); outline-offset: 2px; }
  button.active { z-index: 1; border-color: var(--accent); background: var(--accent); color: var(--accent-ink); }
  .compact-text button { width: 50px; }
  .compact-icon button { width: 34px; padding: 0; }
  .regular button { flex: 1 1 0; height: 32px; padding: 0 4px; font-size: 12px; }
</style>
