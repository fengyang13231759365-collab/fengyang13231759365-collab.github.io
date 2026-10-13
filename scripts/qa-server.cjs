/* 独立测试服务。素材只用于验证交互，不写入正式作品配置或 dist。 */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const {handler}=require('./serve.cjs');
const root=path.resolve(__dirname,'..');const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'src/data.js'),'utf8'),context);
const data=context.window.PORTFOLIO_DATA;
data.profile.hero.enabled=false;
data.profile.resumePdf='assets/profile/missing-qa.pdf';
const design=data.works[0];
design.title='QA 多图浏览测试（非个人作品）';design.images=[{src:'assets/hero.svg',alt:'QA 抽象静态图一'},{src:'assets/mark.svg',alt:'QA 标识图二'}];
const film=data.works[1];film.title='QA MP4 播放测试（非个人作品）';film.videoSrc='assets/qa-local.mp4';film.aspectRatio='16:9';film.poster='assets/hero.svg';
const portrait=data.works[3];portrait.title='QA 竖屏容器测试（非个人作品）';portrait.videoSrc=data.profile.hero.videoSrc;portrait.aspectRatio='9:16';portrait.poster='assets/hero.svg';
http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;if(pathname==='/assets/qa-local.mp4'){req.url='/local-playback.mp4';return handler(req,res,path.join(root,'tests/fixtures'));}if(pathname==='/data.js'){const content='window.PORTFOLIO_DATA='+JSON.stringify(data)+';';res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-cache'});return res.end(content);}handler(req,res);}).listen(4181,'127.0.0.1',()=>console.log('独立 QA: http://127.0.0.1:4181（测试素材不进入正式站点）'));
