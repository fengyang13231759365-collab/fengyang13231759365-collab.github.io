const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),http=require('node:http');
const {buildPages}=require('../scripts/build-pages.cjs'),{handler}=require('../scripts/serve.cjs');
test('GitHub Pages只发布当前引用素材，保留深层地址、视频入口和APK，不带后台与数据库',async()=>{
 const {out,data,resources}=buildPages();assert.equal(data.publicSite,true);assert.equal(data.works.filter(w=>w.type==='video').length,12);
 assert.ok(!fs.existsSync(path.join(out,'admin.html')));assert.ok(!fs.existsSync(path.join(out,'server')));assert.ok(!fs.existsSync(path.join(out,'.local')));
 for(const file of resources)assert.ok(fs.statSync(path.join(out,file)).size>0,file);
 const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(out,'data.js'),'utf8'),ctx);assert.equal(ctx.window.PORTFOLIO_DATA.publicSite,true);
 const videos=data.works.filter(w=>w.type==='video');const old=videos.findIndex(w=>w.title==='旧巷青梅');assert.equal(videos[old+1].title,'谁说中年不轻狂');assert.ok(!data.categories.video.some(c=>c.id==='entertainment'));
 const server=http.createServer((req,res)=>{if(req.url.startsWith('/portfolio/'))req.url=req.url.slice('/portfolio'.length);handler(req,res,out);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 try{let r=await fetch(origin+'/portfolio/#/work/bili-bv1tgww6jesv');assert.equal(r.status,200);assert.match(await r.text(),/hero-player.js\?v=/);
 r=await fetch(origin+'/portfolio/downloads/qiyue-pet-v3.5.apk',{method:'HEAD'});assert.equal(r.status,200);assert.equal(Number(r.headers.get('content-length')),31324851);
 r=await fetch(origin+'/portfolio/assets/hero-loop.mp4',{headers:{Range:'bytes=0-15'}});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,16);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
