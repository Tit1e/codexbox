# public/
> L2 | 父级: ../AGENTS.md

## 成员清单
app.js: 渲染层主入口，编排文件管理、预览编辑、内嵌 xterm、agent、微信与全局交互
i18n-dict.js: 中文源文案到英文的静态词典与规则集合
i18n.js: MutationObserver 国际化运行层，处理界面翻译和语言切换
index.html: 单页应用 DOM 骨架与本地 vendor 脚本加载顺序
style.css: 三套主题、布局、组件和响应式样式
assets/: 渲染层使用的 agent 图标等静态资源
vendor/: xterm、Monaco、Milkdown、highlight.js 等离线浏览器依赖

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
