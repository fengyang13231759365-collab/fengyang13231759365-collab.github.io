// 仅供本机预览和测试，线上使用托管 D1 / R2。
'use strict';
const {DatabaseSync}=require('node:sqlite'),fs=require('node:fs'),path=require('node:path');
function storage(directory){
fs.mkdirSync(directory,{recursive:true});const db=new DatabaseSync(path.join(directory,'portfolio.sqlite'));
db.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)');
const migration=path.join(__dirname,'../drizzle/0000_portfolio_admin.sql');if(!db.prepare('SELECT name FROM local_migrations WHERE name=?').get('0000')){db.exec(fs.readFileSync(migration,'utf8'));db.prepare('INSERT INTO local_migrations VALUES(?)').run('0000');}
class Statement{constructor(sql,args=[]){this.sql=sql;this.args=args;}bind(...args){return new Statement(this.sql,args);}async first(){return db.prepare(this.sql).get(...this.args)||null;}async run(){const info=db.prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(info.changes)},results:[]};}async all(){return {success:true,results:db.prepare(this.sql).all(...this.args)};}}
const DB={prepare:sql=>new Statement(sql),async batch(statements){db.exec('BEGIN');try{const results=[];for(const s of statements){results.push(/RETURNING|^SELECT/i.test(s.sql)?await s.all():await s.run());}db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}};
const dir=path.join(directory,'media');fs.mkdirSync(dir,{recursive:true});
function file(key){if(!/^[a-f0-9-]+\.[a-z0-9]+$/.test(key))throw Error('Invalid local storage key');return path.join(dir,key);}
const BUCKET={async put(key,body,options){const bytes=Buffer.from(await new Response(body).arrayBuffer());fs.writeFileSync(file(key),bytes);const metadata={size:bytes.length,httpMetadata:options.httpMetadata};fs.writeFileSync(file(key)+'.json',JSON.stringify(metadata));return metadata;},async head(key){return fs.existsSync(file(key)+'.json')?JSON.parse(fs.readFileSync(file(key)+'.json','utf8')):null;},async get(key,options={}){let bytes=fs.readFileSync(file(key));if(options.range)bytes=bytes.subarray(options.range.offset,options.range.offset+options.range.length);return {body:bytes};}};
return {DB,BUCKET,close:()=>db.close()};
}
module.exports={storage};
