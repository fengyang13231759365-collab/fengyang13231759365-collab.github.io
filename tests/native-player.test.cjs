const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../src/core.js');
const dataContext={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/data.js'),'utf8'),dataContext);
const data=JSON.parse(JSON.stringify(dataContext.window.PORTFOLIO_DATA));
const work=data.works.find(w=>w.id==='bili-bv1tgww6jesv');

test('配置了MP4的真人剧优先渲染站内播放器，同时保留抖音入口',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8');
  const native=source.slice(source.indexOf('  function nativeVideoMarkup('),source.indexOf('  function galleryMarkup('));
  const detail=source.slice(source.indexOf('  function detail('),source.indexOf('  function about('));
  const context={data,C,E:C.esc,U:C.safeUrl,text:C.esc,paragraphs:C.esc,categoryLink:()=> '#/motion',processMarkup:()=>'',galleryMarkup:()=>'',missing:()=>''};
  vm.runInNewContext(native+detail+'\nthis.render=detail;',context);
  const html=context.render(work.slug,'ai-live-action');
  assert.match(html,/<video[^>]+controls playsinline preload="metadata"/);
  assert.ok(html.includes('src="'+work.videoSrc+'"'));
  assert.doesNotMatch(html,/<iframe|autoplay/);
  assert.ok(html.includes(C.douyin(work.douyinUrl).url));
  assert.match(html,/在抖音观看原视频/);
  assert.match(html,/id="video-error"/);
  assert.equal(work.images.length,10);
});

test('站内MP4可提前读取播放索引，文件处于单素材大小限制内',()=>{
  const file=path.join(__dirname,'../public',work.videoSrc),size=fs.statSync(file).size;
  assert.ok(size>0&&size<50*1024*1024);
  const fd=fs.openSync(file,'r'),boxes=[];
  try{
    let offset=0;
    while(offset+8<=size){
      const h=Buffer.alloc(8);fs.readSync(fd,h,0,8,offset);
      const length=h.readUInt32BE(0),type=h.toString('ascii',4,8);
      assert.ok(length>=8&&offset+length<=size,'有效MP4 box');
      boxes.push(type);offset+=length;
    }
  }finally{fs.closeSync(fd);}
  assert.equal(boxes[0],'ftyp');
  assert.ok(boxes.includes('moov')&&boxes.includes('mdat'));
  assert.ok(boxes.indexOf('moov')<boxes.indexOf('mdat'),'播放索引应位于视频数据之前');
});
