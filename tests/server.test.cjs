const {test}=require('node:test');const assert=require('node:assert/strict');
const http=require('node:http');const {handler}=require('../scripts/serve.cjs');
test('实际 HTTP 服务：入口、样式、脚本、深层 hash、404、HEAD 与视频 Range',async()=>{
 const server=http.createServer(handler);await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const origin='http://127.0.0.1:'+server.address().port;
 try{
  let res=await fetch(origin+'/#/work/design-placeholder-01');assert.equal(res.status,200);assert.match(await res.text(),/id="main"/);
  res=await fetch(origin+'/styles.css');assert.equal(res.status,200);assert.match(res.headers.get('content-type'),/text\/css/);
  res=await fetch(origin+'/app.js');assert.equal(res.status,200);assert.match(await res.text(),/project-video/);
  res=await fetch(origin+'/assets/hero.svg',{method:'HEAD'});assert.equal(res.status,200);assert.equal(await res.text(),'');
  res=await fetch(origin+'/assets/hero.svg',{headers:{Range:'bytes=0-31'}});assert.equal(res.status,206);assert.equal((await res.arrayBuffer()).byteLength,32);assert.match(res.headers.get('content-range'),/^bytes 0-31\//);
  res=await fetch(origin+'/assets/hero.svg',{headers:{Range:'bytes=999999-'}});assert.equal(res.status,416);
  res=await fetch(origin+'/assets/missing.mp4');assert.equal(res.status,404);
  res=await fetch(origin+'/index.html',{method:'POST'});assert.equal(res.status,405);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
