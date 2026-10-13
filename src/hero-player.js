(function(root){
  'use strict';
  function mount(video,hero,reduced={matches:false},env=root){
    const doc=env.document,disposers=[];
    const toggle=hero.querySelector?.('[data-hero-toggle]'),notice=hero.querySelector?.('[data-hero-status]');
    let visible=true,loaded=false,disposed=false,manualPaused=false,manualAllowed=false,retries=0,lastTime=0,stillTicks=0,pending=false;
    video.loop=true;video.muted=true;video.autoplay=true;video.playsInline=true;
    const autoRestricted=()=>reduced.matches||env.navigator?.connection?.saveData;
    const allowed=()=>!disposed&&visible&&!doc.hidden&&!manualPaused&&(!autoRestricted()||manualAllowed);
    const state=(name,message='')=>{
      if(disposed)return;
      video.dataset.state=name;
      if(toggle){toggle.textContent=name==='playing'?'暂停背景':name==='error'?'重新播放':'播放背景';toggle.setAttribute('aria-pressed',String(name==='playing'));}
      if(notice)notice.textContent=message;
    };
    const load=()=>{loaded=true;pending=false;lastTime=0;stillTicks=0;state('loading');video.src=video.dataset.src;video.load();};
    const resume=()=>{
      if(!allowed())return;
      if(video.error){if(retries>=3){state('error','背景未加载，点击重新播放');return;}retries++;loaded=false;}
      if(!loaded)load();
      if(video.ended)video.currentTime=0;
      if(video.paused&&!pending){
        pending=true;
        Promise.resolve(video.play()).then(()=>{
          pending=false;if(disposed)return;
          if(!allowed()){video.pause();state('paused');return;}
          if(!video.paused)state('playing');
        }).catch(error=>{
          pending=false;if(disposed||!allowed())return;
          if(error?.name==='NotAllowedError')state('blocked','点击播放背景开始动画');
          else if(video.error)state('error','背景未加载，点击重新播放');
        });
      }
    };
    const listen=(target,event,handler)=>{target.addEventListener(event,handler);disposers.push(()=>target.removeEventListener(event,handler));};
    listen(video,'loadeddata',()=>{video.classList.add('ready');resume();});
    listen(video,'canplay',resume);
    listen(video,'playing',()=>{video.classList.add('ready');state('playing');});
    listen(video,'pause',()=>{if(!video.error)state('paused');});
    listen(video,'ended',()=>{if(disposed)return;pending=false;video.currentTime=0;resume();});
    listen(video,'error',()=>{pending=false;video.classList.remove('ready');state('error','背景未加载，点击重新播放');});
    listen(video,'portfolio-resume',()=>{visible=true;resume();});
    listen(doc,'visibilitychange',()=>{if(doc.hidden){video.pause();pending=false;}else resume();});
    if(reduced.addEventListener)listen(reduced,'change',()=>{if(autoRestricted()&&!manualAllowed)video.pause();else resume();});
    if(toggle)listen(toggle,'click',()=>{
      if(!video.paused&&!manualPaused){manualPaused=true;pending=false;video.pause();state('paused');}
      else{manualPaused=false;manualAllowed=true;retries=0;pending=false;if(video.error)loaded=false;resume();}
    });
    state('paused',autoRestricted()?'点击播放背景开始动画':'');
    if(env.IntersectionObserver){
      const observer=new env.IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)resume();else{video.pause();pending=false;stillTicks=0;}},{threshold:.15});
      observer.observe(hero);disposers.push(()=>observer.disconnect());
    }else resume();
    const timer=env.setInterval(()=>{
      if(!allowed())return;
      if(!video.paused&&video.readyState>=3){
        stillTicks=Math.abs(video.currentTime-lastTime)<.01?stillTicks+1:0;
        if(stillTicks>=5&&retries<3){retries++;loaded=false;load();}
      }
      lastTime=video.currentTime;resume();
    },1000);
    disposers.push(()=>env.clearInterval(timer));
    return ()=>{disposed=true;disposers.forEach(fn=>fn());video.pause();video.removeAttribute('src');video.load();};
  }
  root.PortfolioHero={mount};
  if(typeof module!=='undefined'&&module.exports)module.exports={mount};
})(typeof window!=='undefined'?window:globalThis);
