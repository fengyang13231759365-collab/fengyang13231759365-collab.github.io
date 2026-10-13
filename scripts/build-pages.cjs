'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const C=require('../src/core.js');
const files=['index.html','app.js','core.js','data.js','hero-player.js','styles.css'];
function readData(){const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'src/data.js'),'utf8'),context);return JSON.parse(JSON.stringify(context.window.PORTFOLIO_DATA));}
function resourcePaths(data){
  const found=new Set();
  function visit(value){if(typeof value==='string'){if(/^(assets|downloads|media)\//.test(value)&&C.safeUrl(value))found.add(value);}else if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')Object.values(value).forEach(visit);}
  visit(data);
  for(const file of ['index.html','styles.css']){const source=fs.readFileSync(path.join(root,'src',file),'utf8');for(const match of source.matchAll(/(?:src|href)=["']([^"']+)["']|url\(["']?([^"')]+)["']?\)/g)){const value=match[1]||match[2];if(value.startsWith('assets/')&&C.safeUrl(value))found.add(value);}}
  return [...found];
}
function locateResource(resource){
  const candidates=resource.startsWith('media/')?[path.join(root,'public',resource),path.join(root,'.local',resource)]:[path.join(root,'src',resource),path.join(root,'public',resource)];
  const source=candidates.find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());if(!source)throw Error('缺少发布素材：'+resource);return source;
}
function buildPages(){
  const data=readData(),errors=C.validate(data);if(errors.length)throw Error(errors.join('\n'));
  const resources=resourcePaths(data);for(const resource of resources)locateResource(resource);
  const out=path.resolve(root,'.pages');
  // 只清理这个固定的生成目录，原始素材和本地数据库不会被修改。
  if(out!==path.join(root,'.pages')||!out.startsWith(root+path.sep))throw Error('发布目录越界');
  if(fs.existsSync(out)&&fs.lstatSync(out).isSymbolicLink())throw Error('发布目录不能是符号链接');
  fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
  data.publicSite=true;
  for(const file of files){
    const content=file==='data.js'?'window.PORTFOLIO_DATA='+JSON.stringify(data)+';\n':fs.readFileSync(path.join(root,'src',file),'utf8');
    fs.writeFileSync(path.join(out,file),content);
  }
  for(const resource of resources){const target=path.join(out,resource);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(locateResource(resource),target);}
  let html=fs.readFileSync(path.join(out,'index.html'),'utf8');
  html=html.replace(/(\b(?:src|href)=["'])([^"']+\.(?:js|css))(["'])/g,(all,start,file,end)=>start+file+'?v='+crypto.createHash('sha256').update(fs.readFileSync(path.join(out,file))).digest('hex').slice(0,12)+end);
  fs.writeFileSync(path.join(out,'index.html'),html);fs.writeFileSync(path.join(out,'.nojekyll'),'');
  console.log('GitHub Pages版本构建完成：'+resources.length+'个素材，包含作品、简历与APP安装包。');
  return {out,data,resources};
}
if(require.main===module)buildPages();
module.exports={buildPages,readData,resourcePaths,locateResource};
