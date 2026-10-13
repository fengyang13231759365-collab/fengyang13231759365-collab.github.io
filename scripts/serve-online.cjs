'use strict';
const http=require('node:http'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {storage}=require('./local-storage.cjs');
(async()=>{const root=path.resolve(__dirname,'..'),{default:worker}=await import(pathToFileURL(path.join(root,'dist/server/index.js')).href);const local=storage(path.join(root,'.local')),env={...local,ADMIN_EMAIL:'local-preview@localhost',LOCAL_PREVIEW:true};const port=Number(process.env.PORT||4182),origin='http://127.0.0.1:'+port;
const server=http.createServer(async(req,res)=>{try{const headers=new Headers();for(const [key,value]of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);headers.set('oai-authenticated-user-id','local-preview');headers.set('oai-authenticated-user-email',env.ADMIN_EMAIL);const request=new Request(origin+req.url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:req,duplex:'half'}:{})});const response=await worker.fetch(request,env);res.writeHead(response.status,Object.fromEntries(response.headers));if(response.body)for await(const chunk of response.body)res.write(chunk);res.end();}catch(e){res.writeHead(500);res.end('本机预览服务异常');console.error(e.message);}});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'本机端口已被占用。如果网站已启动，请直接打开 '+origin+'/admin.html':error.message);local.close();process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>{
 console.log('本机后台预览（独立数据，非线上）：'+origin+'/admin.html');
 console.log('使用期间请保持启动窗口开启，关闭窗口后网页将无法访问。');
 if(process.argv.includes('--open')&&process.platform==='win32')require('node:child_process').execFile('rundll32.exe',['url.dll,FileProtocolHandler',origin+'/admin.html'],{windowsHide:true},error=>{if(error)console.log('请手动在浏览器打开上面的地址。');});
});
})().catch(error=>{console.error('启动未完成：'+error.message);process.exitCode=1;});
