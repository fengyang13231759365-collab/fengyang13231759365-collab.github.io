# 个人作品集 · 第一阶段

当前网站包含首页、设计作品、APP作品、视频作品和简历与联系。GitHub上传与发布见 [GitHub上传与发布说明](GitHub上传与发布说明.md)。公开发布版构建命令为 `npm run build:pages`，本地后台构建仍使用 `npm run build:online`。

原项目评估：原生 HTML/CSS/JavaScript，入口是 `dist/index.html`，没有框架、源码目录或包管理配置。原有 `prepare.cjs`、`optimize.cjs` 等是历史修改脚本，并非可靠构建入口。

本次继续使用原生技术栈，零第三方运行依赖。正式源码现在位于 `src/`，`dist/` 是可重复生成的部署目录。以后请修改 `src/`，不要直接修改 `dist/`，也不要再运行 legacy/ 内的旧修改脚本（已归档）。

## 本地启动

在终端运行：

```powershell
cd C:\个人网站\bloom
npm run build
npm start
```

打开 `http://127.0.0.1:4180`。按 Ctrl+C 停止服务。

若 Node 已可用但 npm 不在 PATH，可用 `node scripts/build.cjs` 和 `node scripts/serve.cjs`，效果一致。不需要 npm install。

开发预览：`npm run dev`，直接读取 `src/` 和 `public/`；保存后刷新浏览器即可。正式预览 `npm start` 读取构建后的 `dist/`。

如果端口占用，PowerShell 中先运行 `$env:PORT=4181`，再启动。也可直接双击 `dist/index.html` 浏览；PDF 文件可用性检查仅在 HTTP 服务下工作。

## 项目结构

```text
bloom/
  src/index.html          语义入口、SEO、导航、图片对话框
  src/data.js             个人资料、分类、作品统一配置
  src/core.js             路由、筛选、比例与数据校验
  src/app.js              四大页面、详情、播放器及图片浏览
  src/styles.css          视觉系统、响应式与减少动画支持
  src/assets/             网站内置标识与静态首屏背景
  public/assets/works/    设计图片、视频、封面、分镜（你添加）
  public/assets/profile/  PDF、二维码（你添加）
  scripts/build.cjs       资源/配置/语法校验与构建
  scripts/serve.cjs       本机 HTTP 服务，支持视频 Range
  tests/                  自动化检查与独立 QA 素材
  dist/                   可部署静态产物
  backups/                旧 Bloom 第一版完整回退备份
```

## 页面地址与部署

首页 `#/`，设计 `#/design`，视频 `#/motion`，个人信息 `#/about`，作品 `#/work/作品slug`。分类写在 query 中，例如 `#/design?category=poster`。详情返回保留分类来源。

使用 hash 路由，是为了静态服务器下深层刷新无需重写规则。部署上传完整 `dist/` 内容，保持目录结构；支持放在域名子目录下，内部素材不依赖电脑绝对路径。只有根 HTML 的基础 SEO 能被所有爬虫稳定读取，hash 详情不具备独立服务端 SEO；本阶段未引入服务端渲染。

## 备份与回退

旧版保存在 `backups/bloom-v1-20261010/`，含旧 HTML、旧修改脚本与原 hosting 配置。原始 TXT 与素材未删除。查看旧版可直接打开备份内 `dist/index.html`。不要对备份运行新构建。

## 检查

```powershell
npm run build
npm test
```

详见 `第一阶段交付说明.md` 和 `添加作品说明.md`。

# 在线管理补充

本项目现已增加在线内容管理。日常添加作品请优先参考 [在线管理使用说明](在线管理使用说明.md)，后台功能与验证范围见 [在线管理交付说明](在线管理交付说明.md)。在线数据库中的内容优先于源码初始配置。本机后台预览：`npm run build:online` 后运行 `npm run preview:admin`，打开 `http://127.0.0.1:4182/admin.html`。

