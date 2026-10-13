# GitHub上传与发布

项目在 `C:\个人网站\bloom`。上传目录由 `node scripts/prepare-github.cjs` 生成在 `github-upload/portfolio`，只包含源码、实际使用的网站素材、测试和说明；不包含本地数据库、备份、工具、凭据或大型服务器构建文件。

## 本地内容更新

在原网站后台修改内容并保存后，请让维护者将最新内容同步到 `src/data.js`，再上传到GitHub。数据库中的修改不会自行同步到GitHub仓库。

## GitHub Pages发布

1. 在仓库的 Settings → Pages 中选择 GitHub Actions 作为发布方式。
2. 在 Actions 中打开“发布个人作品集”，点击 Run workflow。
3. 成功后在 Settings → Pages 查看网站的固定地址。更新作品不会改变仓库名或网址。

发布流程目前需要手动触发，上传代码本身不会公开发布网站。GitHub免费账号的Pages通常需要公开仓库；是否公开须由所有者决定。

发布版保留首页循环动画、设计图片、视频原平台链接、制作过程、简历PDF和安卓安装包下载。GitHub Pages不运行数据库或上传后台，因此发布页不显示“内容管理”入口。本地后台继续可用。

## 发布版预览

```powershell
node scripts/build-pages.cjs
node scripts/serve-pages.cjs
```

打开 `http://127.0.0.1:4184`。本地原后台仍在 `http://127.0.0.1:4182/admin.html`。
