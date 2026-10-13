'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {storage}=require('../scripts/local-storage.cjs'),C=require('../src/core.js');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/data.js'),'utf8'),context);const defaults=JSON.parse(JSON.stringify(context.window.PORTFOLIO_DATA));
test('后台权限、保存持久化、并发冲突、素材范围请求',async()=>{const {handleApi,serveMedia}=await import('../worker/api.mjs');const dir=fs.mkdtempSync(path.join(__dirname,'admin-test-'));const local=storage(dir),env={...local,ADMIN_EMAIL:'owner@example.test'},origin='https://portfolio.example';
function request(route,method='GET',body,authenticated=true,extra={}){return new Request(origin+route,{method,headers:{...(authenticated?{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':env.ADMIN_EMAIL}:{}),Origin:origin,...extra},...(body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});}
try{
assert.equal((await handleApi(request('/api/admin/content','GET',undefined,false),env,defaults,C)).status,401);
assert.equal((await handleApi(request('/api/admin/content','PUT',{data:defaults,version:0},true,{Origin:'https://other.example'}),env,defaults,C)).status,403);
const data=structuredClone(defaults);data.profile.name='本机测试';const result=await handleApi(request('/api/admin/content','PUT',{data,version:0}),env,defaults,C);assert.equal(result.status,200);assert.equal((await result.json()).version,1);
assert.equal((await handleApi(request('/api/admin/content','PUT',{data,version:0}),env,defaults,C)).status,409);
assert.equal((await (await handleApi(request('/api/content'),env,defaults,C)).json()).data.profile.name,'本机测试');
assert.equal((await env.DB.prepare('SELECT count(*) AS n FROM portfolio_revisions').first()).n,1);
const invalid=structuredClone(data);invalid.works[0].cover='javascript:alert(1)';assert.equal((await handleApi(request('/api/admin/content','PUT',{data:invalid,version:1}),env,defaults,C)).status,400);
assert.equal((await handleApi(request('/api/admin/upload?name=unsafe.html','POST','abc',true,{'Content-Length':'3'}),env,defaults,C)).status,400);
const upload=await handleApi(request('/api/admin/upload?name=test.mp4','POST','0123456789',true,{'Content-Length':'10'}),env,defaults,C);assert.equal(upload.status,200);const media=await upload.json();const range=await serveMedia(request('/'+media.path,'GET',undefined,false,{Range:'bytes=2-5'}),env);assert.equal(range.status,206);assert.equal(await range.text(),'2345');assert.equal(range.headers.get('Content-Type'),'video/mp4');
assert.equal((await serveMedia(request('/'+media.path,'GET',undefined,false,{Range:'bytes=99-'}),env)).status,416);
local.close();const reopened=storage(dir);assert.equal((await reopened.DB.prepare('SELECT version FROM portfolio_content WHERE id=1').first()).version,1);reopened.close();
}finally{try{local.close();}catch{}fs.rmSync(dir,{recursive:true,force:true});}
});
