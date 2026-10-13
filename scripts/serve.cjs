'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const dev=process.argv.includes('--dev');
const port=Number(process.env.PORT||4180);
if(!dev&&!fs.existsSync(path.join(root,'dist','app.js'))){console.error('请先运行 npm run build');process.exit(1);}
const contentTypes={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.mp4':'video/mp4','.webm':'video/webm','.pdf':'application/pdf','.apk':'application/vnd.android.package-archive','.ico':'image/x-icon'};
function handler(req,res,directoryOverride){
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
  if(pathname==='/')pathname='/index.html';
  const relative=pathname.replace(/^\/+/, '');
  const directories=directoryOverride?[directoryOverride]:(dev?[path.join(root,'src'),path.join(root,'public')]:[path.join(root,'dist')]);
  let file='';
  for(const directory of directories){const candidate=path.resolve(directory,relative);if(candidate.startsWith(directory+path.sep)&&fs.existsSync(candidate)&&fs.statSync(candidate).isFile()){file=candidate;break;}}
  if(!file){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('资源不存在');}
  const size=fs.statSync(file).size;const headers={'Content-Type':contentTypes[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff'};
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  let start=0,end=size-1,status=200;
  if(req.headers.range){const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match || (!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}
    if(match[1]){start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),size-1):size-1;}else{start=Math.max(0,size-Number(match[2]));end=size-1;}
    if(start>=size||end<start){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;
  }
  headers['Content-Length']=Math.max(0,end-start+1);res.writeHead(status,headers);
  if(req.method==='HEAD')return res.end();
  if(size===0)return res.end();
  const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);req.on('close',()=>stream.destroy());
}
if(require.main===module){const server=http.createServer(handler);server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`端口 ${port} 已占用，可设置 PORT 使用其他端口。`:e.message);process.exit(1);});server.listen(port,'127.0.0.1',()=>console.log(`Portfolio ${dev?'源码预览':'正式预览'}: http://127.0.0.1:${port}`));}
module.exports={handler};
