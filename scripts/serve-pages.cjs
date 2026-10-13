'use strict';
const http=require('node:http'),path=require('node:path'),fs=require('node:fs');
const {handler}=require('./serve.cjs');
const directory=path.resolve(__dirname,'../.pages');
if(!fs.existsSync(path.join(directory,'index.html')))throw Error('请先运行 npm run build:pages');
const port=Number(process.env.PORT||4184);
http.createServer((req,res)=>handler(req,res,directory)).listen(port,'127.0.0.1',()=>console.log('GitHub Pages发布版预览：http://127.0.0.1:'+port));
