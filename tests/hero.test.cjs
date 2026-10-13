'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {mount}=require('../src/hero-player.js');
test('封面片尾重播、意外暂停恢复、离开首屏暂停及返回恢复',async()=>{
  class Video extends EventTarget{
    constructor(){super();this.dataset={src:'assets/hero-loop.mp4'};this.paused=true;this.ended=false;this.currentTime=0;this.plays=0;this.classList={add(){},remove(){}};}
    load(){} removeAttribute(){} pause(){this.paused=true;} play(){this.plays++;this.paused=false;this.ended=false;return Promise.resolve();}
  }
  const video=new Video(),doc=new EventTarget(),reduced=new EventTarget();doc.hidden=false;reduced.matches=false;
  let observe,tick,cleared=false;
  const env={document:doc,IntersectionObserver:class{constructor(cb){observe=cb;}observe(){observe([{isIntersecting:true}]);}disconnect(){}},setInterval(fn){tick=fn;return 1;},clearInterval(){cleared=true;}};
  const dispose=mount(video,{},reduced,env);await Promise.resolve();assert.equal(video.loop,true);assert.equal(video.paused,false);
  video.currentTime=8;video.ended=true;video.paused=true;video.dispatchEvent(new Event('ended'));await Promise.resolve();assert.equal(video.currentTime,0);assert.equal(video.paused,false);
  video.pause();tick();await Promise.resolve();assert.equal(video.paused,false);
  observe([{isIntersecting:false}]);assert.equal(video.paused,true);tick();assert.equal(video.paused,true);
  observe([{isIntersecting:true}]);await Promise.resolve();assert.equal(video.paused,false);
  doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));tick();assert.equal(video.paused,true);
  doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));await Promise.resolve();assert.equal(video.paused,false);
  reduced.matches=true;reduced.dispatchEvent(new Event('change'));tick();assert.equal(video.paused,true);
  reduced.matches=false;reduced.dispatchEvent(new Event('change'));await Promise.resolve();assert.equal(video.paused,false);
  dispose();assert.equal(cleared,true);const count=video.plays;tick();assert.equal(video.plays,count);
});
test('本地封面视频支持从开头和片尾范围读取',async()=>{
  const {createWorker}=await import('../worker/index.mjs');const worker=createWorker({'/assets/hero-loop.mp4':{type:'video/mp4',body:Buffer.from('0123456789').toString('base64')}},{},{});
  const fetch=(range,method='GET')=>worker.fetch(new Request('http://localhost/assets/hero-loop.mp4',{method,headers:range?{Range:range}:{}}),{});
  const full=await fetch();assert.equal(full.status,200);assert.equal(full.headers.get('Accept-Ranges'),'bytes');
  const first=await fetch('bytes=0-3');assert.equal(first.status,206);assert.equal(await first.text(),'0123');
  const tail=await fetch('bytes=-3');assert.equal(await tail.text(),'789');
  const head=await fetch('bytes=2-5','HEAD');assert.equal(head.headers.get('Content-Length'),'4');assert.equal(await head.text(),'');
  assert.equal((await fetch('bytes=10-')).status,416);assert.equal((await fetch('bytes=3-1')).status,416);
});
test('播放入口可恢复受限播放，手动暂停不会被守护逻辑重新启动，错误可以重试',async()=>{
  class Button extends EventTarget{setAttribute(){}}
  class Video extends EventTarget{
    constructor(){super();this.dataset={src:'assets/hero-loop.mp4'};this.paused=true;this.ended=false;this.currentTime=0;this.readyState=4;this.loads=0;this.blocked=false;this.classList={add(){},remove(){}};}
    load(){this.loads++;this.error=null;}removeAttribute(){}pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}
    play(){if(this.blocked){const e=new Error('blocked');e.name='NotAllowedError';return Promise.reject(e);}this.paused=false;this.dispatchEvent(new Event('playing'));return Promise.resolve();}
  }
  const doc=new EventTarget(),reduced=new EventTarget(),button=new Button(),notice={},video=new Video();doc.hidden=false;reduced.matches=true;let tick;
  const env={document:doc,setInterval(fn){tick=fn;return 1;},clearInterval(){}};
  const hero={querySelector(selector){return selector.includes('toggle')?button:notice;}};
  const dispose=mount(video,hero,reduced,env);tick();assert.equal(video.loads,0);
  button.dispatchEvent(new Event('click'));await Promise.resolve();assert.equal(video.paused,false);
  button.dispatchEvent(new Event('click'));tick();assert.equal(video.paused,true);
  video.blocked=true;button.dispatchEvent(new Event('click'));await Promise.resolve();await Promise.resolve();assert.equal(video.dataset.state,'blocked');
  video.blocked=false;button.dispatchEvent(new Event('click'));await Promise.resolve();assert.equal(video.paused,false);
  video.error={code:2};video.pause();video.dispatchEvent(new Event('error'));const count=video.loads;tick();await Promise.resolve();assert.equal(video.loads,count+1);assert.equal(video.paused,false);
  dispose();
});
