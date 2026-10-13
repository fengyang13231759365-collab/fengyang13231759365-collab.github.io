'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const src=path.join(root,'src');
const out=path.join(root,'dist');
const C=require('../src/core.js');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(src,'data.js'),'utf8'),context);
const data=context.window.PORTFOLIO_DATA;
const errors=C.validate(data);
for(const f of ['app.js','core.js','data.js','hero-player.js'])new vm.Script(fs.readFileSync(path.join(src,f),'utf8'),{filename:f});
// 验证实际配置的本地素材，未配置资源是正常占位。
function checkAsset(value,label){
  if(!value)return;
  if(!C.safeUrl(value)){errors.push('不安全的资源路径：'+label);return;}
  if(/^https?:/i.test(value))return;
  if(!fs.existsSync(path.join(src,value))&&!fs.existsSync(path.join(root,'public',value)))errors.push('本地资源不存在：'+label+' ('+value+')');
}
for(const w of data.works){for(const key of ['cover','poster','videoSrc','downloadSrc'])checkAsset(w[key],w.id+'.'+key);for(const img of w.images)checkAsset(typeof img==='string'?img:img.src,w.id+'.images');}
for(const key of ['resumePdf','wechatQr','bilibiliQr','avatar'])checkAsset(data.profile[key],'profile.'+key);
for(const key of ['poster','videoSrc'])checkAsset(data.profile.hero[key],'profile.hero.'+key);
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
// 仅复制，不递归删除 dist 或原始素材。构建目录中的其他文件保留。
fs.mkdirSync(out,{recursive:true});
fs.cpSync(src,out,{recursive:true});
fs.cpSync(path.join(root,'public'),out,{recursive:true});
// 内容指纹让浏览器在更新后取得匹配的脚本与样式。
const crypto=require('node:crypto');
const html=fs.readFileSync(path.join(src,'index.html'),'utf8').replace(/(\b(?:src|href)=["'])([^"']+\.(?:js|css))(["'])/g,(all,start,file,end)=>{
  const version=crypto.createHash('sha256').update(fs.readFileSync(path.join(src,file))).digest('hex').slice(0,12);
  return start+file+'?v='+version+end;
});
fs.writeFileSync(path.join(out,'index.html'),html);
console.log('构建完成：dist/（原生静态站点，无第三方依赖）');
