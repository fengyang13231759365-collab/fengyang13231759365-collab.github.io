// Identity headers are injected and verified by Sites. Never accept client role claims.
const MAX_JSON=1024*1024;
const MAX_UPLOAD=50*1024*1024;
const mimeTypes={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.gif':'image/gif','.mp4':'video/mp4','.webm':'video/webm','.pdf':'application/pdf','.apk':'application/vnd.android.package-archive'};
const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function isAdmin(request,env){
  const id=request.headers.get('oai-authenticated-user-id');
  const email=request.headers.get('oai-authenticated-user-email');
  return Boolean(id&&email&&env.ADMIN_EMAIL&&email.toLowerCase()===env.ADMIN_EMAIL.toLowerCase());
}
function authorize(request,env){
  if(!isAdmin(request,env))return json({error:'请使用网站所有者账号登录。',loginPath:'/signin-with-chatgpt?return_to=%2Fadmin.html'},401);
  if(!['GET','HEAD'].includes(request.method)&&request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'请求来源不匹配，请从网站管理页保存。'},403);
}
export async function getContent(env,defaults){
  const row=await env.DB.prepare('SELECT version,payload,updated_at FROM portfolio_content WHERE id=1').first();
  return row?{data:JSON.parse(row.payload),version:row.version,updatedAt:row.updated_at}:{data:defaults,version:0,updatedAt:null};
}
export function validateContent(value,C){
  if(!value||typeof value!=='object'||!value.profile||!value.categories||!Array.isArray(value.works))return ['内容结构不完整'];
  if(value.works.length>500)return ['最多支持500个作品'];
  for(const type of ['design','video',...(value.categories.app?['app']:[])])if(!Array.isArray(value.categories[type])||value.categories[type].length>50)return ['分类配置不正确'];
  for(const key of ['experiences','skills','capabilities','externalLinks','education'])if(!Array.isArray(value.profile[key]))return ['个人资料列表格式不正确'];
  if(!value.profile.hero||typeof value.profile.hero!=='object')return ['首屏配置不正确'];
  for(const w of value.works){
    if(!w||typeof w.title!=='string'||!w.title.trim()||w.title.length>200)return ['请填写有效的作品名称'];
    if(!Array.isArray(w.images)||!Array.isArray(w.tags)||!Array.isArray(w.tools)||!Array.isArray(w.credits)||!Array.isArray(w.process))return ['作品列表字段格式不正确'];
  }
  let errors;try{errors=C.validate(value);}catch{return ['作品配置格式不正确'];}
  for(const field of ['resumePdf','wechatQr','bilibiliQr','avatar'])if(value.profile[field]&&!C.safeUrl(value.profile[field]))errors.push('个人资料资源路径无效');
  for(const field of ['videoSrc','poster'])if(value.profile.hero[field]&&!C.safeUrl(value.profile.hero[field]))errors.push('首屏资源路径无效');
  for(const link of value.profile.externalLinks)if(!link||typeof link.label!=='string'||!/^https?:\/\//i.test(link.url||'')||!C.safeUrl(link.url))errors.push('平台链接须为完整 http(s) 地址');
  return errors;
}
export async function handleApi(request,env,defaults,C){
  const url=new URL(request.url),path=url.pathname;
  if(path==='/api/session'&&request.method==='GET')return json({admin:isAdmin(request,env),authenticated:!!request.headers.get('oai-authenticated-user-id'),configured:!!env.ADMIN_EMAIL,loginPath:'/signin-with-chatgpt?return_to=%2Fadmin.html',signOutPath:'/signout-with-chatgpt?return_to=%2F',preview:!!env.LOCAL_PREVIEW});
  if(path==='/api/content'&&request.method==='GET')return json(await getContent(env,defaults));
  const denied=authorize(request,env);if(denied)return denied;
  if(path==='/api/admin/content'&&request.method==='GET')return json(await getContent(env,defaults));
  if(path==='/api/admin/content'&&request.method==='PUT'){
    const length=Number(request.headers.get('Content-Length')||0);if(length>MAX_JSON)return json({error:'内容过大，请减少文本或图片数量。'},413);
    const raw=await request.text();if(new TextEncoder().encode(raw).length>MAX_JSON)return json({error:'内容过大'},413);
    let body;try{body=JSON.parse(raw);}catch{return json({error:'内容格式错误'},400);}
    const errors=validateContent(body.data,C);if(errors.length)return json({error:errors.join('；')},400);
    if(!Number.isInteger(body.version)||body.version<0)return json({error:'版本信息无效，请刷新管理页。'},400);
    const now=new Date().toISOString();
    const results=await env.DB.batch([
      env.DB.prepare('INSERT OR IGNORE INTO portfolio_content(id,version,payload,updated_at) VALUES(1,0,?,?)').bind(JSON.stringify(defaults),now),
      env.DB.prepare('INSERT OR IGNORE INTO portfolio_revisions(version,payload,created_at) SELECT version,payload,? FROM portfolio_content WHERE id=1 AND version=?').bind(now,body.version),
      env.DB.prepare('UPDATE portfolio_content SET payload=?,version=version+1,updated_at=? WHERE id=1 AND version=? RETURNING version').bind(JSON.stringify(body.data),now,body.version)
    ]);
    const row=results[2].results?.[0];if(!row)return json({error:'另一台设备已经更新了内容。请先导出当前草稿，再刷新获取最新内容。'},409);
    return json({ok:true,version:row.version,updatedAt:now});
  }
  if(path==='/api/admin/upload'&&request.method==='POST'){
    const name=url.searchParams.get('name')||'';
    const ext=(name.match(/\.[a-z0-9]+$/i)?.[0]||'').toLowerCase();
    const mime=mimeTypes[ext];if(!mime)return json({error:'请上传 PNG、JPG、WebP、AVIF、GIF、MP4、WebM、PDF 或 APK。'},400);
    const length=Number(request.headers.get('Content-Length')||0);if(!length||length>MAX_UPLOAD)return json({error:'每个文件须小于50MB。较大视频请使用可访问的媒体URL。'},413);
    const key=crypto.randomUUID()+ext;
    const object=await env.BUCKET.put(key,request.body,{httpMetadata:{contentType:mime},customMetadata:{originalName:name.slice(0,180)}});
    if(!object)return json({error:'上传未完成，请重试。'},500);
    await env.DB.prepare('INSERT INTO portfolio_assets(asset_key,mime,size,created_at) VALUES(?,?,?,?)').bind(key,mime,object.size,new Date().toISOString()).run();
    return json({ok:true,path:'media/'+key,size:object.size,mime});
  }
  if(path==='/api/admin/export'&&request.method==='GET')return new Response(JSON.stringify(await getContent(env,defaults),null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="portfolio-content.json"','Cache-Control':'no-store'}});
  return json({error:'接口不存在或请求方法不支持。'},404);
}
export async function serveMedia(request,env){
  if(!['GET','HEAD'].includes(request.method))return json({error:'不支持此方法'},405);
  const key=new URL(request.url).pathname.slice('/media/'.length);
  if(!/^[a-f0-9-]+\.(png|jpg|jpeg|webp|avif|gif|mp4|webm|pdf|apk)$/.test(key))return new Response('素材不存在',{status:404});
  const head=await env.BUCKET.head(key);if(!head)return new Response('素材不存在',{status:404});
  const headers=new Headers({'Content-Type':head.httpMetadata?.contentType||'application/octet-stream','Content-Length':String(head.size),'Accept-Ranges':'bytes','Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"});
  if(key.endsWith('.apk'))headers.set('Content-Disposition','attachment; filename="android-app.apk"');
  if(request.method==='HEAD')return new Response(null,{headers});
  let options={},status=200;
  const range=request.headers.get('Range');if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${head.size}`}});let start=match[1]?Number(match[1]):Math.max(0,head.size-Number(match[2])),end=match[1]&&match[2]?Math.min(Number(match[2]),head.size-1):head.size-1;if(start>=head.size||start>end)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${head.size}`}});options={range:{offset:start,length:end-start+1}};headers.set('Content-Range',`bytes ${start}-${end}/${head.size}`);headers.set('Content-Length',String(end-start+1));status=206;}
  const object=await env.BUCKET.get(key,options);return new Response(object.body,{status,headers});
}
