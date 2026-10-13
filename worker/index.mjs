import {handleApi,getContent,serveMedia} from './api.mjs';
export function createWorker(assets,defaults,C){
  return {async fetch(request,env){
    try{
      const path=new URL(request.url).pathname;
      if(path.startsWith('/api/'))return await handleApi(request,env,defaults,C);
      if(path.startsWith('/media/'))return await serveMedia(request,env);
      if(path==='/data.js'){
        const {data}=await getContent(env,defaults);
        return new Response('window.PORTFOLIO_DATA='+JSON.stringify(data)+';',{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
      }
      if(!['GET','HEAD'].includes(request.method))return new Response('不支持此方法',{status:405});
      const asset=assets[path==='/'?'/index.html':path];if(!asset)return new Response('页面不存在',{status:404});
      const bytes=Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0));
      const headers={'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Length':String(bytes.length)};
      if(path.endsWith('.apk'))headers['Content-Disposition']='attachment; filename="'+path.split('/').pop()+'"';
      if(asset.type.startsWith('video/')){
        headers['Accept-Ranges']='bytes';const range=request.headers.get('Range');
        if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);let start,end;
          if(match&&(match[1]||match[2])){start=match[1]?Number(match[1]):Math.max(0,bytes.length-Number(match[2]));end=match[1]?(match[2]?Math.min(Number(match[2]),bytes.length-1):bytes.length-1):bytes.length-1;}
          if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=bytes.length||end<0)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+bytes.length}});
          headers['Content-Range']=`bytes ${start}-${end}/${bytes.length}`;headers['Content-Length']=String(end-start+1);return new Response(request.method==='HEAD'?null:bytes.slice(start,end+1),{status:206,headers});
        }
      }
      return new Response(request.method==='HEAD'?null:bytes,{headers});
    }catch(error){console.error('Portfolio request failed',error?.message);return Response.json({error:'服务暂时不可用，请稍后重试。'},{status:503,headers:{'Cache-Control':'no-store'}});}
  }};
}
