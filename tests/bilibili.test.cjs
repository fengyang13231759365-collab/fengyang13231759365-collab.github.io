const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../src/core.js');
const source=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8');

test('外链播放器使用官方p参数，原视频与播放器指向相同分集',()=>{
  for(const page of [1,2,3]){
    const video=C.bilibili('https://www.bilibili.com/video/BV1PDpv6vEDd/?p='+page);
    const embed=new URL(video.embed);
    assert.equal(embed.searchParams.get('p'),String(page));
    assert.equal(embed.searchParams.has('page'),false);
    assert.equal(new URL(video.url).searchParams.get('p'),String(page));
    assert.equal(embed.searchParams.get('autoplay'),'0');
  }
});

test('访客无需加载第三方播放器即可使用原视频入口',()=>{
  const start=source.indexOf('  function biliMarkup('),end=source.indexOf('  function galleryMarkup(',start);
  const context={E:C.esc,image:()=>'<img>',placeholder:()=>''};
  vm.runInNewContext(source.slice(start,end)+'\nthis.render=biliMarkup;',context);
  const html=context.render({title:'视频',bilibiliPages:[{title:'第一集'},{title:'第二集'}]},C.bilibili('https://www.bilibili.com/video/BV1PDpv6vEDd/'),'cover.webp',16/9);
  assert.doesNotMatch(html,/<iframe/);
  assert.match(html,/<a[^>]+href="https:\/\/www\.bilibili\.com\/video\/BV1PDpv6vEDd\/\?p=1"[^>]+target="_blank"/);
  assert.match(html,/打开B站原视频/);
  assert.match(html,/尝试站内播放/);
});

test('分集切换同步所有观看入口，站内失败后原视频链接仍可用',()=>{
  class Button extends EventTarget{
    constructor(dataset,textContent){super();this.dataset=dataset;this.textContent=textContent;this.attributes={};}
    closest(selector){return selector==='.player-section'?section:null;}
    setAttribute(k,v){this.attributes[k]=v;}
  }
  const links=[{},{}],status={isConnected:true};
  let iframe=null;
  const frame={closest:()=>section,querySelector:selector=>selector==='iframe'?iframe:null};
  Object.defineProperty(frame,'innerHTML',{set(value){this.html=value;iframe=new EventTarget();}});
  const play=new Button({bili:C.bilibili('https://www.bilibili.com/video/BV1PDpv6vEDd/').embed},'站内播放');
  const episodes=[1,2].map(i=>new Button({episode:String(i),bvid:'BV1PDpv6vEDd'},'第'+i+'集'));
  const section={querySelector:s=>({'.bili-frame':frame,'.bili-status':status,'[data-bili]':play}[s]||null),querySelectorAll:s=>s==='[data-bili-external]'?links:s==='[data-episode]'?episodes:[]};
  const main={querySelector:()=>null,querySelectorAll:s=>s==='[data-bili]'?[play]:s==='[data-episode]'?episodes:[]};
  const start=source.indexOf('  function bindImages()'),end=source.indexOf('  function openGallery(',start);
  vm.runInNewContext(source.slice(start,end)+'\nbindImages();',{main,C,E:C.esc});
  episodes[1].onclick();
  assert.equal(iframe,null,'选择分集不应强制加载外链播放器');
  for(const link of links)assert.equal(new URL(link.href).searchParams.get('p'),'2');
  play.dispatchEvent(new Event('click'));
  assert.match(frame.html,/&amp;p=2&amp;/);
  iframe.dispatchEvent(new Event('error'));
  assert.match(status.textContent,/加载失败/);
  assert.ok(links.every(link=>link.href.endsWith('?p=2')));
  episodes[0].onclick();
  assert.match(frame.html,/&amp;p=1&amp;/);
  assert.ok(links.every(link=>link.href.endsWith('?p=1')));
});
