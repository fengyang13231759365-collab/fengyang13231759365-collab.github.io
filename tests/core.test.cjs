const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../src/core.js');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/data.js'),'utf8'),context);
const data=JSON.parse(JSON.stringify(context.window.PORTFOLIO_DATA));
test('作品配置有效，13个视频使用用户提供的播放链接',()=>{assert.deepEqual(C.validate(data),[]);assert.equal(C.listWorks(data,'video').length,13);for(const w of C.listWorks(data,'video')){assert.ok(C.bilibili(w.bilibiliUrl)||C.douyin(w.douyinUrl));assert.equal(w.videoSrc,'');}});
test('分类筛选与精选共用作品数据',()=>{assert.equal(C.listWorks(data,'video','tvc').length,1);assert.equal(C.listWorks(data,'video','promotion').length,2);assert.equal(C.listWorks(data,'design','banner').length,5);assert.equal(C.featuredWorks(data).length,6);});
test('B站只接受单视频链接并保留分集，拒绝主页与冒充域名',()=>{const v=C.bilibili('https://www.bilibili.com/video/BV1S6pv6GEJM/?p=2&spm_id=x');assert.equal(v.page,2);assert.ok(v.embed.includes('autoplay=0'));for(const url of ['https://space.bilibili.com/696222311','https://www.bilibili.com.evil.test/video/BV1S6pv6GEJM/','javascript:alert(1)','https://www.bilibili.com/video/invalid/'])assert.equal(C.bilibili(url),null);});
test('页面与详情深层地址可直接恢复，保留分类来源',()=>{assert.equal(C.parseRoute('#/').page,'home');assert.equal(C.parseRoute('#/about?section=contact').section,'contact');assert.equal(C.parseRoute('#/design?category=poster').category,'poster');assert.equal(C.parseRoute('#/work/design-placeholder-01?from=poster').category,'poster');assert.equal(C.parseRoute('#/work/design-placeholder-01').slug,'design-placeholder-01');assert.equal(C.parseRoute('#/missing').page,'notfound');assert.equal(C.parseRoute('#/work/%ZZ').page,'notfound');});
test('横竖比例正确，非法比例回退，不裁切竖屏',()=>{assert.equal(C.ratio('16:9'),16/9);assert.equal(C.ratio('9:16'),9/16);assert.equal(C.ratio('0:0'),16/9);assert.equal(C.ratio('4/3'),4/3);assert.equal(C.ratio('9:x'),16/9);});
test('资源拒绝危险协议、电脑绝对路径与目录穿越',()=>{for(const value of ['javascript:alert(1)','C:/users/test.mp4','/private/a','../a','//evil.test/a','assets/../../a','data:text/html,a'])assert.equal(C.safeUrl(value),'');for(const value of ['assets/works/a.mp4','https://example.com/video.mp4'])assert.equal(C.safeUrl(value),value);assert.equal(C.esc('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');});
test('重复 slug 与不存在的分类构建前即被识别',()=>{const invalid={...data,works:[...data.works,{...data.works[0],category:'invalid'}]};assert.ok(C.validate(invalid).some(s=>s.includes('slug')));assert.ok(C.validate(invalid).some(s=>s.includes('分类')));});

test('APP为独立作品类型，可恢复页面并独立筛选',()=>{assert.equal(C.parseRoute('#/app').page,'app');assert.ok(data.categories.app.length);assert.ok(!data.categories.design.some(c=>c.id==='app-ui'));const app={...data.works.find(w=>w.type==='design'),id:'app-test',slug:'app-test',type:'app',category:data.categories.app[0].id};const fixture={...data,works:[app]};assert.deepEqual(C.validate(fixture),[]);assert.equal(C.listWorks(fixture,'app').length,1);assert.equal(C.listWorks(fixture,'design').length,0);});

test('桌宠包含两种风格共六个形象且没有舞蹈预览',()=>{const pet=data.works.find(w=>w.id==='app-qiyue-pet');const chars=pet.petDemo.characters;assert.equal(chars.length,6);for(const mode of ['cartoon','real'])assert.equal(chars.filter(c=>c.mode===mode).length,3);for(const c of chars){assert.deepEqual(Object.keys(c.animations).sort(),['idle','move','wave']);for(const resource of [c.thumbnail,...Object.values(c.animations)])assert.ok(fs.existsSync(path.join(__dirname,'../public',resource)));}assert.equal(pet.images.length,13);assert.ok(!pet.images.some(im=>im.src.includes('-concept.webp')));});

test('抖音主页分享转为公共单视频地址，拒绝冒充域名和无视频主页',()=>{
 const source='https://www.douyin.com/user/self?modal_id=7695976186308037897&showTab=post';
 assert.equal(C.douyin(source).url,'https://www.douyin.com/video/7695976186308037897');
 for(const url of ['https://www.douyin.com/user/self','https://www.douyin.com.evil.test/video/7695976186308037897','javascript:alert(1)','http://www.douyin.com/video/7695976186308037897'])assert.equal(C.douyin(url),null);
 const work=data.works.find(w=>w.title==='谁说中年不轻狂');assert.ok(C.douyin(work.douyinUrl));assert.equal(work.bilibiliUrl,'');assert.equal(work.images.length,10);
});
