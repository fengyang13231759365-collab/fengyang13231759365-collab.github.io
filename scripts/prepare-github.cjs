'use strict';
const fs=require('node:fs'),path=require('node:path');
const {readData,resourcePaths,locateResource}=require('./build-pages.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'github-upload','portfolio');
fs.mkdirSync(out,{recursive:true});
for(const folder of ['src','scripts','worker','drizzle','.github','.openai'])fs.cpSync(path.join(root,folder),path.join(out,folder),{recursive:true});
fs.mkdirSync(path.join(out,'tests'),{recursive:true});
for(const file of fs.readdirSync(path.join(root,'tests')))if(file.endsWith('.test.cjs'))fs.copyFileSync(path.join(root,'tests',file),path.join(out,'tests',file));
for(const file of fs.readdirSync(root))if(file.endsWith('.md')||file.endsWith('.cmd')||['package.json','.gitignore'].includes(file))fs.copyFileSync(path.join(root,file),path.join(out,file));
for(const resource of resourcePaths(readData())){
  if(resource.startsWith('assets/')&&fs.existsSync(path.join(root,'src',resource)))continue;
  const target=path.join(out,'public',resource);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(locateResource(resource),target);
}
const inventory=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else{const size=fs.statSync(p).size;if(size>100*1024*1024)throw Error('超过GitHub文件限制：'+entry.name);inventory.push({path:path.relative(out,p).split(path.sep).join('/'),bytes:size});}}}
walk(out);fs.mkdirSync(path.join(root,'.local'),{recursive:true});fs.writeFileSync(path.join(root,'.local/github-upload-inventory.json'),JSON.stringify(inventory,null,2));
console.log('GitHub上传目录已准备：github-upload/portfolio，'+inventory.length+'个文件。');
