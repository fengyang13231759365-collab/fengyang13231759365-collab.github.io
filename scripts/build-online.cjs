'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');cp.execFileSync(process.execPath,[path.join(__dirname,'build.cjs')],{stdio:'inherit'});
const assets={},types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.pdf':'application/pdf','.apk':'application/vnd.android.package-archive'};
function collect(dir,prefix=''){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix+'/'+entry.name;if(entry.isDirectory())collect(path.join(dir,entry.name),rel);else assets[rel]={type:types[path.extname(entry.name)]||'application/octet-stream',body:fs.readFileSync(path.join(dir,entry.name)).toString('base64')};}}
collect(path.join(root,'src'));collect(path.join(root,'public'));assets['/index.html'].body=fs.readFileSync(path.join(root,'dist/index.html')).toString('base64');const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'src/data.js'),'utf8'),context);
new vm.Script(fs.readFileSync(path.join(root,'src/admin.js'),'utf8'));
const worker=fs.readFileSync(path.join(root,'src/core.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'worker/api.mjs'),'utf8')+'\n'+fs.readFileSync(path.join(root,'worker/index.mjs'),'utf8').replace(/^import[^\n]+\n/,'')+'\nexport default createWorker('+JSON.stringify(assets)+','+JSON.stringify(context.window.PORTFOLIO_DATA)+',globalThis.PortfolioCore);\n';
fs.mkdirSync(path.join(root,'dist/server'),{recursive:true});fs.mkdirSync(path.join(root,'dist/.openai'),{recursive:true});fs.writeFileSync(path.join(root,'dist/server/index.js'),worker);fs.copyFileSync(path.join(root,'.openai/hosting.json'),path.join(root,'dist/.openai/hosting.json'));
console.log('在线版本构建完成：含管理后台、数据库接口和素材服务。');
