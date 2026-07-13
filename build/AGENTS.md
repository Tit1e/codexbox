# build/
> L2 | 父级: ../AGENTS.md

## 成员清单
after-pack.js: electron-builder macOS 打包后钩子，在签名前恢复 node-pty spawn-helper 可执行位并拒绝缺失产物
entitlements.mac.plist: macOS hardened runtime 权限配置，允许 node-pty 原生模块按签名策略运行
icon-1024.png: macOS 应用图标的 1024 像素源图
icon.icns: electron-builder 使用的 macOS ICNS 应用图标
icon.png: Electron 开发模式 Dock 使用的 PNG 应用图标
node-pty-permissions.js: 本地安装与发布打包共享的 macOS spawn-helper 权限修复单一真源
prepare-node-pty.js: npm postinstall 本地依赖准备入口，保证开发环境 PTY 辅助程序可执行
dev.mjs: 开发监督入口，监听 Svelte/渲染层源码并安全刷新界面，监听服务端/Electron 源码并安全重启应用
svelte-ui.mjs: esbuild + esbuild-svelte 界面构建配置与正式构建入口，将 src-ui 编译为 public/generated 离线模块

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
