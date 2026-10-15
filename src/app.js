(() => {
  'use strict';
  const data = window.PORTFOLIO_DATA;
  const C = window.PortfolioCore;
  const {esc:E,safeUrl:U} = C;
  const main = document.getElementById('main');
  const p = data.profile;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const missing = (label = '待填写') => `<span class="unconfigured">${E(label)}</span>`;
  const text = (value, label) => value ? E(value) : missing(label);
  let cleanup = () => {};
  let route = C.parseRoute(location.hash);
  let gallery = [], galleryIndex = 0, galleryTitle = '';
  let firstRender = true;
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  const categoryLink = (type, category) => `#/${type === 'app' ? 'app' : type === 'design' ? 'design' : 'motion'}${category && category !== 'all' ? '?category=' + encodeURIComponent(category) : ''}`;
  const workLink = (w, category = 'all') => `#/work/${encodeURIComponent(w.slug)}${category !== 'all' ? '?from=' + encodeURIComponent(category) : ''}`;
  const validEmail = value => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value || '');
  const paragraphs = value => value ? String(value).split('\n').filter(Boolean).map(s => `<p>${E(s)}</p>`).join('') : `<p>${missing()}</p>`;
  const normalizeImage = img => typeof img === 'string' ? {src:img,alt:''} : img;

  function placeholder(w, index = 0, extra = '') {
    return `<div class="placeholder-art ${w.type === 'video' ? 'film' : 'graphic'} ${extra}" aria-label="待添加作品封面"><span class="art-cross" aria-hidden="true">＋</span><span class="art-number" aria-hidden="true">${String(index + 1).padStart(2,'0')}</span><div class="art-frame" aria-hidden="true"></div><span class="art-label">${E(w.titleEn || (w.type === 'video' ? 'MOTION PROJECT' : 'DESIGN PROJECT'))}</span><span class="placeholder-badge">待添加作品</span></div>`;
  }
  function image(src, alt, cls = '', eager = false) {
    return `<img class="${cls}" src="${E(U(src))}" alt="${E(alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
  }
  function card(w, index, category = 'all') {
    const cover = U(w.cover || w.poster);
    return `<article class="work-card reveal"><a class="work-link" href="${workLink(w,category)}" aria-label="查看${E(w.title)}详情"><div class="work-cover ${w.type === 'video' ? 'video-cover' : ''} ${w.category==='creative-film'?'short-film-cover':''}">${cover ? image(cover,w.title,'cover-image') : placeholder(w,index)}${w.placeholder && cover ? '<span class="placeholder-badge overlay">待添加作品</span>' : ''}<span class="card-open" aria-hidden="true">↗</span>${w.type === 'video' && w.duration ? `<span class="duration">${E(w.duration)}</span>` : ''}</div><div class="work-meta"><div><p class="eyebrow">${E(w.type === 'app' ? 'APP作品' : w.type === 'video' ? '视频作品' : '设计作品')} / ${E(C.categoryName(data,w))}${w.year ? ' · ' + E(w.year) : ''}</p><h3>${E(w.title)} <span aria-hidden="true">↗</span></h3></div>${w.placeholder ? '<span class="meta-status">内容待配置</span>' : ''}</div>${w.type==='video'?`<p class="card-process-hint">成片 + 制作过程${w.process?.length || w.images?.length?' · 查看创作资料 ↗':' · 制作资料待补充'}</p>`:''}</a>${w.type === 'video' && w.credits?.length ? `<p class="card-credits">${E(w.credits.map(c => typeof c === 'string' ? c : [c.role,c.name].filter(Boolean).join('：')).join(' / '))}</p>` : ''}</article>`;
  }
  function sectionHeader(label,title,description,action = '') {
    return `<div class="section-heading reveal"><div><p class="eyebrow">${label}</p><h2>${title}</h2>${description ? `<p class="section-description">${description}</p>` : ''}</div>${action}</div>`;
  }
  function empty(type, selected) {
    const cat = data.categories[type].find(c => c.id === selected);
    return `<div class="empty-state"><span class="empty-symbol" aria-hidden="true">[ &nbsp;＋&nbsp; ]</span><p class="eyebrow">WORK IN PROGRESS</p><h2>${cat ? E(cat.name) : '这个栏目'} · 作品待添加</h2><p>这里将展示作品画面、创作过程与个人职责。<br>目前尚未配置此分类的项目。</p><a class="button secondary" href="${categoryLink(type,'all')}">查看全部作品 <span aria-hidden="true">↗</span></a></div>`;
  }
  const videoCategories = () => { const categories=[...data.categories.video]; const index=categories.findIndex(cat=>cat.id==='creative-film'); if(index>=0){const [shortFilm]=categories.splice(index,1);categories.splice(Math.min(1,categories.length),0,shortFilm);} return categories; };
  function inlineDesignWorks(works) {
    return `<div class="inline-image-grid">${works.map(w=>(w.images||[]).map(normalizeImage).filter(im=>U(im.src)).map((im,i)=>`<figure><button class="image-zoom" data-homework="${E(w.id)}" data-homeindex="${i}" aria-label="放大${E(im.alt||w.title)}">${image(im.src,im.alt||w.title)}<span>查看大图 ＋</span></button>${im.caption?`<figcaption>${E(im.caption)}</figcaption>`:''}</figure>`).join('')).join('')}</div>`;
  }
  function appDownload(w) {
    const src=U(w.downloadSrc);if(!src)return '';
    const name=/^[a-zA-Z0-9._-]+$/.test(w.downloadName||'')?w.downloadName:'app.apk';
    return `<section class="app-download" aria-label="APP安装包下载"><div><p class="eyebrow">ANDROID APP</p><h4>下载安装体验</h4><p>${E(w.downloadVersion||'安卓测试版')}${w.downloadSize?' · '+E(w.downloadSize):''}</p><p>安卓手机下载安装，桌面端可先保存安装包。使用前需按应用提示开启悬浮窗权限。</p></div><a class="button primary" href="${E(src)}" download="${E(name)}">下载安卓安装包 ↓</a></section>`;
  }
  function petDemoMarkup(w) {
    const characters=w.petDemo?.characters?.filter(c=>U(c.thumbnail));if(!characters?.length)return '';
    const firstMode=characters[0].mode||'cartoon';
    const modes=[...new Set(characters.map(c=>c.mode||'cartoon'))];
    return `<section class="pet-demo" data-pet-work="${E(w.id)}" aria-label="桌宠角色动作预览"><div class="pet-stage"><span class="pet-demo-label">角色素材预览</span>${image(characters[0].thumbnail,characters[0].name+'角色','pet-preview-image')}<p class="pet-state" aria-live="polite">${firstMode==='real'?'真人比例':'卡通'} · ${E(characters[0].name)} · 静态预览</p></div><div class="pet-demo-controls"><p class="eyebrow">CHARACTER & MOTION</p><h4>两种形象，自由切换。</h4><div class="pet-mode-controls" aria-label="选择形象风格">${modes.map(mode=>`<button data-pet-mode="${E(mode)}" aria-pressed="${mode===firstMode}">${mode==='real'?'真人比例':'卡通'}</button>`).join('')}</div><div class="pet-character-controls" aria-label="选择形象">${characters.map((c,i)=>`<button data-pet-character="${i}" ${((c.mode||'cartoon')!==firstMode)?'hidden':''} aria-pressed="${i===0}">${E(c.name)}</button>`).join('')}</div><div class="pet-action-controls" aria-label="动作预览"><button data-pet-action="idle">待机</button><button data-pet-action="wave">挥手</button><button data-pet-action="move">移动</button><button data-pet-stop>暂停动作</button></div><p>真人比例与卡通均为风格化虚构角色。点击动作后播放，也可暂停。此处展示当前应用素材。</p></div></section>`;
  }
  function appProject(w) {
    return `<article class="app-case"><header><p class="eyebrow">${E(w.titleEn||'APP PROJECT')}</p><h3>${E(w.title)}</h3><p>${E(w.description||'')}</p></header>${appDownload(w)}${petDemoMarkup(w)}${w.features?.length?`<div class="app-feature-grid">${w.features.map(f=>`<article><h4>${E(f.title)}</h4><p>${E(f.description)}</p></article>`).join('')}</div>`:''}${w.process?.length?`<h4 class="app-process-title">制作过程</h4>${processMarkup(w)}`:''}<h4 class="app-process-title">形象、姿势与迭代画面</h4>${w.petDemo?'<div class="pet-project-images">':''}${inlineDesignWorks([w])}${w.petDemo?'</div>':''}</article>`;
  }
  function home() {
    const poster = U(p.hero?.poster) || 'assets/hero.svg';
    const background = U(p.hero?.videoSrc);
    return `<section class="hero" aria-labelledby="hero-title"><div class="hero-visual" aria-hidden="true">${image(poster,'','hero-poster',true)}${p.hero?.enabled && background ? `<video id="hero-video" autoplay muted loop playsinline preload="none" poster="${E(poster)}" data-src="${E(background)}" tabindex="-1"></video>` : ''}</div><div class="hero-shade"></div><div class="hero-content container"><p class="eyebrow hero-kicker"><span class="tiny-square"></span> 个人作品集 / PERSONAL PORTFOLIO</p><h1 id="hero-title">让想象，<br>成为<span class="serif">可见。</span></h1><div class="hero-identity"><strong>${text(p.name,'个人名称 · 待填写')}</strong><span>${text(p.position,'职业定位 · 待填写')}</span></div><p class="hero-description">${p.introduction ? E(p.introduction) : '在设计与影像之间，记录每一次创作。这里将呈现我的作品、思考与实践。'}</p><div class="hero-actions"><a class="button primary" href="#/design">查看设计作品 <span aria-hidden="true">↗</span></a><a class="button secondary" href="#/motion">查看视频作品 <span aria-hidden="true">↗</span></a><a class="text-link" href="#/about?section=contact">联系我 ↗</a></div></div><div class="hero-bottom container"><div class="hero-bottom-left"><span>设计 · 影像 · 创作</span>${p.hero?.enabled && background?'<button class="hero-toggle" data-hero-toggle type="button" aria-pressed="false">播放背景</button><span class="hero-playback-status" data-hero-status role="status" aria-live="polite"></span>':''}</div></div></section>`;
  }
  function listing(type, selected) {
    const isDesign = type !== 'video';
    const isApp = type === 'app';
    const categories = type==='design' ? data.categories.design.filter(cat=>C.listWorks(data,'design',cat.id).some(w=>!w.placeholder && (w.images||[]).some(im=>U(normalizeImage(im).src)))) : type==='video' ? videoCategories() : data.categories[type];
    if (selected !== 'all' && !categories.some(c => c.id === selected)) selected = 'all';
    const works = C.listWorks(data,type,selected).filter(w=>type!=='design'||!w.placeholder);
    if(isApp)return `<div class="container listing-page app-scroll-page"><header class="page-intro"><p class="eyebrow">APP & INTERACTION</p><h1>APP作品<span>APP & UI</span></h1><p>向下滚动，浏览项目介绍、角色形象、交互与制作过程。</p></header>${works.length?works.map(appProject).join(''):empty(type,selected)}</div>`;
    return `<div class="container listing-page"><section class="page-intro"><p class="eyebrow">${isDesign ? 'VISUAL EXPLORATION' : 'STORIES IN MOTION'} / 作品集</p><h1>${isApp?'APP作品':isDesign ? '设计作品' : '视频作品'}<span>${isApp?'APP & UI':isDesign ? 'DESIGN' : 'MOTION'}</span></h1><p>${isApp ? '从角色视觉到交互体验，展示应用项目的创作与实现。' : isDesign ? '以视觉建立连接。海报、Banner与IP形象，完整展示作品画面与视觉延展。' : '以影像讲述故事。从概念与分镜，到画面、剪辑与声音，呈现完整的创作过程。'}</p></section><nav class="filters" aria-label="作品分类">${[{id:'all',name:'全部',nameEn:'All'},...categories].map(cat => `<a class="filter ${cat.id === selected ? 'active' : ''}" href="${categoryLink(type,cat.id)}" ${cat.id === selected ? 'aria-current="true"' : ''}><span>${E(cat.name)}</span><small>${E(cat.nameEn)}</small></a>`).join('')}</nav><div class="list-status" aria-live="polite"><span>${selected === 'all' ? '全部作品' : E(categories.find(c => c.id === selected).name)}</span><span>${String(works.length).padStart(2,'0')} 个项目${works.some(w => w.placeholder) ? ' · 含待添加占位' : ''}</span></div>${works.length ? (isApp?works.map(appProject).join(''):isDesign?inlineDesignWorks(works):`<div class="works-grid">${works.map((w,i) => card(w,i,selected)).join('')}</div>`) : empty(type,selected)}</div>`;
  }
  function processMarkup(work) {
    return work.process?.length ? `<ol class="process-list">${work.process.map((s,i) => `<li><span class="eyebrow">${String(i+1).padStart(2,'0')}</span><div><h3>${E(typeof s === 'string' ? s : s.title)}</h3>${typeof s === 'string' ? '' : paragraphs(s.description)}</div></li>`).join('')}</ol>` : `<p>${missing('制作过程 · 待填写')}</p>`;
  }
  function galleryMarkup(w) {
    const images = (w.images || []).map(normalizeImage).filter(i => U(i.src));
    gallery = images; galleryTitle = w.title;
    return images.length ? `<div class="project-gallery carousel" data-gallery-work="${E(w.id)}" tabindex="0" aria-label="作品图片轮播"><figure><button type="button" class="image-zoom" data-image="0" aria-label="查看当前图片大图">${image(images[0].src,images[0].alt || w.title)}<span>查看大图 ＋</span></button><figcaption aria-live="polite">${E(images[0].caption || images[0].alt || '')}</figcaption></figure><div class="carousel-controls"><button data-slide="-1" ${images.length<2?'disabled':''} aria-label="上一张图片">← 上一张</button><span class="carousel-count" aria-live="polite">1 / ${images.length}</span><button data-slide="1" ${images.length<2?'disabled':''} aria-label="下一张图片">下一张 →</button></div></div>` : `<div class="detail-placeholder">${placeholder(w,0)}<p>项目图片待添加。</p></div>`;
  }
  function detail(slug, category) {
    const w = data.works.find(w => w.slug === slug);
    if (!w) return notFound();
    const videoSrc = U(w.videoSrc);
    const bili=C.bilibili(w.bilibiliUrl);
    const douyin=C.douyin(w.douyinUrl);
    const ratio = w.category==='creative-film' ? 16/9 : C.ratio(w.aspectRatio);
    const poster = U(w.poster || w.cover);
    const returnLink = categoryLink(w.type,category);
    const credits = (w.credits || []).map(c => typeof c === 'string' ? c : [c.role,c.name].filter(Boolean).join('：'));
    return `<article class="container detail-page"><a class="back-link" href="${returnLink}">← 返回${w.type === 'app' ? 'APP' : w.type === 'design' ? '设计' : '视频'}作品列表</a><header class="detail-header"><p class="eyebrow">${E(w.titleEn || (w.type === 'design' ? 'DESIGN PROJECT' : 'MOTION PROJECT'))}</p><h1>${E(w.title)}</h1><div class="detail-tags"><span>${E(C.categoryName(data,w))}</span>${w.year ? `<span>${E(w.year)}</span>` : ''}${w.duration ? `<span>${E(w.duration)}</span>` : ''}${w.tags.map(t => `<span>${E(t)}</span>`).join('')}${w.placeholder ? '<span class="tag-pending">占位项目 · 非真实案例</span>' : ''}</div>${w.type==='video'?`<nav class="detail-shortcuts" aria-label="作品内容导航"><button data-jump="film">观看成片 ↓</button><button data-jump="production">制作过程 ↓</button><button data-jump="project-images">${w.images?.length?'创作资产 · '+w.images.length+'张':'创作资产'} ↓</button></nav><p class="detail-process-note">下方包含成片、制作步骤与创作资产。</p>`:''}</header>${w.type==='app'?appDownload(w)+petDemoMarkup(w):''}${w.type === 'video' ? (douyin ? `<section id="film" class="player-section"><div class="player-frame bili-frame ${ratio<1?'portrait':''}" style="--video-ratio:${ratio}">${poster?image(poster,w.title):placeholder(w,0)}<a class="button primary bili-play" href="${E(douyin.url)}" target="_blank" rel="noopener noreferrer">在抖音观看 ↗</a></div><p class="player-help">点击打开抖音原视频，观看完整成片。</p></section>` : bili ? `<section id="film" class="player-section ${w.category==='creative-film'?'short-film':''}"><div class="player-frame bili-frame ${ratio<1?'portrait':''}" style="--video-ratio:${ratio}">${poster?image(poster,w.title):placeholder(w,0)}<button class="button primary bili-play" data-bili="${E(bili.embed)}">播放B站视频 ▷</button></div>${w.bilibiliPages?.length>1?`<nav class="bili-episodes" aria-label="选择分集">${w.bilibiliPages.map((ep,i)=>`<button data-episode="${i+1}" data-bvid="${bili.bvid}">${E(ep.title || '第'+(i+1)+'集')}</button>`).join('')}</nav>`:''}${w.playbackNote?`<p class="player-help" role="status">${E(w.playbackNote)}</p>`:''}<p class="player-help">点击后加载播放器，保留完整画幅。<a href="${E(bili.url)}" target="_blank" rel="noopener noreferrer">在B站观看 ↗</a></p></section>` : videoSrc ? `<section id="film" class="player-section ${w.category==='creative-film'?'short-film':''}" aria-label="作品视频"><div class="player-frame ${ratio < 1 ? 'portrait' : ''}" style="--video-ratio:${ratio}"><video class="project-video" controls playsinline preload="metadata" ${poster ? `poster="${E(poster)}"` : ''} src="${E(videoSrc)}" aria-label="${E(w.title)}">你的浏览器不支持此视频。</video></div><p class="player-help">${ratio < 1 ? '竖屏视频 · 保留完整画幅' : '横屏视频 · 保留完整画幅'} / 使用播放器控制播放、进度、音量与全屏。</p><p class="media-error" id="video-error" role="status" hidden>视频暂时无法播放，请检查资源文件、格式或网络。<a href="${E(videoSrc)}" target="_blank" rel="noopener noreferrer">打开视频源 ↗</a></p></section>` : `<div class="video-unconfigured">${poster ? image(poster,w.title) : placeholder(w,0)}<p><strong>视频待上传</strong><span>配置真实 MP4 或视频 URL 后，这里将提供播放器。</span></p></div>`) : ''}<div class="project-overview"><section><p class="eyebrow">${w.type === 'video' ? 'STORY & CONCEPT' : 'PROJECT BACKGROUND'}</p><h2>${w.type === 'video' ? '内容简介' : '项目背景'}</h2>${paragraphs(w.description)}</section><dl class="project-facts"><div><dt>个人负责</dt><dd>${text(w.role)}</dd></div><div><dt>使用工具</dt><dd>${w.tools.length ? E(w.tools.join(' / ')) : missing()}</dd></div>${credits.length ? `<div><dt>制作信息</dt><dd>${E(credits.join(' / '))}</dd></div>` : ''}</dl></div><section id="production" class="detail-section"><p class="eyebrow">PROCESS & EXPLORATION</p><h2>制作过程</h2>${w.processNote?`<p class="process-material-note">${E(w.processNote)}</p>`:''}${processMarkup(w)}</section><section id="project-images" class="detail-section"><p class="eyebrow">${w.type === 'video' ? 'STORYBOARD & FRAMES' : 'VISUAL GALLERY'}</p><h2>${w.type === 'video' ? '分镜与画面' : '作品画面'}</h2>${w.type==='app'?`<div class="pet-project-images">${inlineDesignWorks([w])}</div>`:galleryMarkup(w)}</section><section class="detail-section result-section"><p class="eyebrow">FINAL OUTCOME</p><h2>最终成果</h2>${paragraphs(w.outcome)}</section><a class="button secondary" href="${returnLink}">← 返回作品列表</a></article>`;
  }
  function about() {
    const email = validEmail(p.email);
    const pdf = U(p.resumePdf);
    return `<article class="container about-page"><header class="page-intro"><p class="eyebrow">THE PERSON BEHIND THE WORK</p><h1>简历与联系<span>ABOUT</span></h1><p>创作的背后，是持续积累的实践与思考。</p></header><section class="about-identity">${U(p.avatar) ? `<div class="profile-photo">${image(p.avatar,p.name || '个人照片')}</div>` : '<div class="profile-monogram" aria-hidden="true">[ P ]<span>PERSONAL PROFILE</span></div>'}<div><p class="eyebrow">${p.nameEn ? E(p.nameEn) : 'NAME / 待填写'}</p><h2>${text(p.name,'个人名称 · 待填写')}</h2><p class="profile-position">${text(p.position,'职业定位 · 待填写')}</p>${paragraphs(p.introduction)}${p.location ? `<p>所在地：${E(p.location)}</p>` : ''}</div></section><div class="about-grid"><section class="resume-section"><p class="eyebrow">CAREER DIRECTION</p><h2>职业定位</h2>${paragraphs(p.careerGoal)}<p class="eyebrow resume-label">WORK EXPERIENCE</p><h2>工作经历</h2>${p.experiences.length ? `<ol class="timeline">${p.experiences.map(item => `<li><span class="eyebrow">${E(item.period || '')}</span><h3>${E(item.company)}${item.title ? ' · ' + E(item.title) : ''}</h3>${paragraphs(item.description)}</li>`).join('')}</ol>` : '<div class="resume-empty">工作经历待填写<br><small>公司、职位、任职时间与真实职责。</small></div>'}${p.education?.length ? `<p class="eyebrow resume-label">EDUCATION</p><h2>教育经历</h2>${p.education.map(e => `<p>${E(e.period || '')} · ${E(e.school)} · ${E(e.major || '')}</p>`).join('')}` : ''}</section><section class="resume-section"><p class="eyebrow">SKILLS & PRACTICE</p><h2>专业技能</h2>${p.skills.length ? `<ul class="skill-list">${p.skills.map(s => `<li>${E(s)}</li>`).join('')}</ul>` : '<div class="resume-empty">专业技能待填写<br><small>填写实际掌握的设计、影像工具与技能。</small></div>'}<p class="eyebrow resume-label">CAPABILITIES</p><h2>代表能力与项目经验</h2>${p.capabilities.length ? p.capabilities.map(v => `<article class="capability"><h3>${E(v.title)}</h3>${paragraphs(v.description)}</article>`).join('') : '<div class="resume-empty">真实能力与项目经验待填写</div>'}</section></div><section id="resume" class="resume-download"><div><p class="eyebrow">ONLINE RESUME</p><h2>在线简历</h2><p>本页即在线简历，填写资料后可直接浏览与打印。</p></div><div class="resume-actions"><button class="button secondary" id="print-resume" type="button">打印 / 查看在线简历 ↗</button>${pdf ? `<a class="button primary" id="resume-download" href="${E(pdf)}" download>下载简历 PDF ↓</a><span class="resource-status" id="resume-status" role="status"></span>` : '<button class="button secondary" type="button" disabled>简历 PDF · 未配置</button>'}</div></section><section id="contact" class="about-contact"><p class="eyebrow">GET IN TOUCH</p><h2>聊聊下一次<span class="serif">创作。</span></h2><div class="contact-grid"><div><h3>联系邮箱</h3>${email ? `<a class="email-link" href="mailto:${E(p.email)}">${E(p.email)} ↗</a>` : `<p>${missing('邮箱 · 待填写')}</p>`}${p.phone && /^[+\d\s()-]+$/.test(p.phone) ? `<h3 class="external-label">联系电话</h3><a class="phone-link" href="tel:${E(p.phone.replace(/\s/g,''))}">${E(p.phone)} ↗</a>` : ''}<h3 class="external-label">其他作品平台</h3>${p.externalLinks.filter(l => U(l.url)).length ? `<ul class="external-links">${p.externalLinks.filter(l => U(l.url)).map(l => `<li><a href="${E(U(l.url))}" target="_blank" rel="noopener noreferrer">${E(l.label)} ↗</a></li>`).join('')}</ul>` : `<p>${missing('平台链接 · 待配置')}</p>`}</div><div class="wechat">${U(p.bilibiliQr) ? `<h3>B站二维码</h3><button class="image-zoom qr" data-bilibili-qr type="button" aria-label="放大B站主页二维码">${image(p.bilibiliQr,'B站主页二维码海报')}</button>` : ''}${!U(p.bilibiliQr) || U(p.wechatQr) ? '<h3>微信二维码</h3>' : ''}${U(p.wechatQr) ? `<button class="image-zoom qr" data-qr="true" type="button" aria-label="放大微信二维码">${image(p.wechatQr,'微信联系二维码')}</button>` : (U(p.bilibiliQr) ? '' : '<div class="qr-placeholder"><span aria-hidden="true">＋</span><p>微信二维码 · 待配置</p></div>')}</div></div></section></article>`;
  }
  function notFound() {return `<section class="container empty-state notfound"><p class="eyebrow">404 / PAGE NOT FOUND</p><h1>这个页面暂不存在。</h1><p>作品可能尚未添加，或地址已更改。</p><a class="button primary" href="#/">返回首页 ↗</a></section>`;}
  function footer() {
    document.getElementById('footer').innerHTML = `<div class="container footer-inner"><a class="footer-brand" href="#/">个人作品集 <small>DESIGN & MOTION</small></a><p>© ${new Date().getFullYear()} ${E(p.name || '个人作品集')} · 所有作品版权归其权利人所有。</p><a href="#/about">简历与联系 ↗</a>${data.publicSite ? '' : '<a href="admin.html">内容管理</a>'}</div>`;
  }
  function bindImages() {
    main.querySelectorAll('img').forEach(img => img.addEventListener('error',() => {
      img.hidden = true;
      const host = img.closest('.work-cover,.image-zoom,.video-unconfigured,.hero-visual');
      if (host && !host.querySelector('.image-fallback')) host.insertAdjacentHTML('beforeend','<span class="image-fallback">图片暂不可用</span>');
      if (img.closest('.image-zoom')) img.closest('.image-zoom').disabled = true;
    },{once:true}));
    const carousel=main.querySelector('.carousel');
    if(carousel){let index=0,x=null;const change=step=>{index=(index+step+gallery.length)%gallery.length;const im=gallery[index],img=carousel.querySelector('img');img.src=U(im.src);img.alt=im.alt||galleryTitle;img.hidden=false;carousel.querySelector('[data-image]').dataset.image=index;carousel.querySelector('figcaption').textContent=im.caption||im.alt||'';carousel.querySelector('.carousel-count').textContent=(index+1)+' / '+gallery.length;};
      carousel.querySelectorAll('[data-slide]').forEach(b=>b.onclick=()=>change(Number(b.dataset.slide)));
      carousel.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();change(e.key==='ArrowRight'?1:-1);}};
      carousel.addEventListener('touchstart',e=>x=e.changedTouches[0].clientX,{passive:true});carousel.addEventListener('touchend',e=>{if(x!==null&&Math.abs(e.changedTouches[0].clientX-x)>50)change(e.changedTouches[0].clientX<x?1:-1);x=null;},{passive:true});
    }
    function loadBili(url,frame=main.querySelector('.bili-frame')){frame.innerHTML=`<iframe src="${E(url)}" title="B站作品播放器" allow="fullscreen; picture-in-picture" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>`;}
    main.querySelectorAll('[data-bili]').forEach(button=>button.addEventListener('click',e=>loadBili(e.currentTarget.dataset.bili,e.currentTarget.closest('.bili-frame'))));
    main.querySelectorAll('[data-jump]').forEach(button=>button.onclick=()=>{if(button.closest('.portfolio-directory')&&matchMedia('(max-width:760px)').matches)button.closest('details').open=false;document.getElementById(button.dataset.jump)?.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});});
    const directory=main.querySelector('.directory-panel');if(directory&&matchMedia('(max-width:760px)').matches)directory.open=false;
    main.querySelectorAll('[data-episode]').forEach(b=>b.onclick=()=>{loadBili('https://player.bilibili.com/player.html?bvid='+b.dataset.bvid+'&page='+b.dataset.episode+'&autoplay=0&danmaku=0');main.querySelectorAll('[data-episode]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));});
    main.querySelectorAll('[data-homework]').forEach(button=>button.onclick=()=>{const work=data.works.find(w=>w.id===button.dataset.homework);gallery=(work.images||[]).map(normalizeImage).filter(im=>U(im.src));galleryTitle=work.title;openGallery(Number(button.dataset.homeindex));});
    main.querySelectorAll('[data-image]').forEach(b => b.addEventListener('click',() => openGallery(Number(b.dataset.image))));
    main.querySelector('[data-bilibili-qr]')?.addEventListener('click',() => {gallery = [{src:p.bilibiliQr,alt:'B站主页二维码海报'}];galleryTitle = 'B站二维码';openGallery(0);});
    main.querySelector('[data-qr]')?.addEventListener('click',() => {gallery = [{src:p.wechatQr,alt:'微信联系二维码'}];galleryTitle = '微信二维码';openGallery(0);});
  }
  function openGallery(index) {
    galleryIndex = index;
    updateGallery();
    document.getElementById('lightbox').showModal();
    document.body.classList.add('modal-open');
  }
  function updateGallery() {
    const item = gallery[galleryIndex]; if (!item) return;
    const img = document.getElementById('lightbox-image');img.src = U(item.src);img.alt = item.alt || galleryTitle;
    document.getElementById('lightbox-label').textContent = galleryTitle;
    document.getElementById('lightbox-count').textContent = `${galleryIndex+1} / ${gallery.length}`;
    document.getElementById('lightbox-prev').disabled = galleryIndex === 0;
    document.getElementById('lightbox-next').disabled = galleryIndex === gallery.length-1;
  }
  const dialog = document.getElementById('lightbox');
  document.getElementById('lightbox-close').addEventListener('click',() => dialog.close());
  document.getElementById('lightbox-prev').addEventListener('click',() => {if(galleryIndex>0){galleryIndex--;updateGallery();}});
  document.getElementById('lightbox-next').addEventListener('click',() => {if(galleryIndex<gallery.length-1){galleryIndex++;updateGallery();}});
  dialog.addEventListener('close',() => document.body.classList.remove('modal-open'));
  dialog.addEventListener('click',e => {if(e.target === dialog) dialog.close();});
  dialog.addEventListener('keydown',e => {if(e.key==='ArrowLeft')document.getElementById('lightbox-prev').click();if(e.key==='ArrowRight')document.getElementById('lightbox-next').click();});

  function effects() {
    const disposers = [];
    if ('IntersectionObserver' in window && !reduced.matches) {
      const observer = new IntersectionObserver(entries => entries.forEach(e => {if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target);}}),{threshold:.06});
      main.querySelectorAll('.reveal').forEach(el => {el.classList.add('will-reveal');observer.observe(el);});
      disposers.push(() => observer.disconnect());
    }
    const hero = main.querySelector('.hero');
    const video = main.querySelector('#hero-video');
    let raf = 0;
    if(hero && !reduced.matches) {
      const onScroll = () => {if(!raf)raf = requestAnimationFrame(() => {raf=0;hero.style.setProperty('--hero-shift',Math.min(32,window.scrollY*.06)+'px');});};
      window.addEventListener('scroll',onScroll,{passive:true});disposers.push(() => {window.removeEventListener('scroll',onScroll);cancelAnimationFrame(raf);});
    }
    // 首屏始终挂载控制器，减少动画偏好与省流量通过手动播放入口兼容。
    if(video)disposers.push(window.PortfolioHero.mount(video,hero,reduced));
    const player = main.querySelector('.project-video');
    if(player){
      player.addEventListener('error',()=>document.getElementById('video-error').hidden=false);
      player.addEventListener('keydown',e=>{
        if(e.target!==player)return;
        if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();if(Number.isFinite(player.duration))player.currentTime=Math.max(0,Math.min(player.duration,player.currentTime+(e.key==='ArrowRight'?5:-5)));}
        else if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();player.volume=Math.max(0,Math.min(1,player.volume+(e.key==='ArrowUp' ? .1 : -.1)));}
        else if(e.key.toLowerCase()==='m'){e.preventDefault();player.muted=!player.muted;}
        else if(e.key.toLowerCase()==='f'){e.preventDefault();const action=document.fullscreenElement?document.exitFullscreen?.():player.requestFullscreen?.();action?.catch(()=>{});}
      });
      disposers.push(()=>{player.pause();player.removeAttribute('src');player.load();});
    }
    main.querySelectorAll('[data-pet-work]').forEach(demo=>{
      const work=data.works.find(w=>w.id===demo.dataset.petWork),characters=work.petDemo.characters.filter(c=>U(c.thumbnail));let selected=0,action='',playing=false;
      const img=demo.querySelector('.pet-preview-image'),status=demo.querySelector('.pet-state');
      const update=()=>{const c=characters[selected],mode=c.mode||'cartoon';img.src=U(playing?c.animations?.[action]||c.thumbnail:c.thumbnail);img.alt=(mode==='real'?'真人比例':'卡通')+' · '+c.name+'角色';status.textContent=(mode==='real'?'真人比例':'卡通')+' · '+c.name+' · '+(playing?({idle:'待机',wave:'挥手',move:'移动'})[action]:'静态预览');demo.querySelectorAll('[data-pet-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.petMode===mode)));demo.querySelectorAll('[data-pet-character]').forEach(b=>{const i=Number(b.dataset.petCharacter);b.hidden=(characters[i].mode||'cartoon')!==mode;b.setAttribute('aria-pressed',String(i===selected));});demo.querySelectorAll('[data-pet-action]').forEach(b=>b.setAttribute('aria-pressed',String(playing&&b.dataset.petAction===action)));demo.querySelector('[data-pet-stop]').disabled=!playing;};
      demo.querySelectorAll('[data-pet-mode]').forEach(b=>b.onclick=()=>{selected=characters.findIndex(c=>(c.mode||'cartoon')===b.dataset.petMode);playing=false;update();});
      demo.querySelectorAll('[data-pet-character]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.petCharacter);update();});demo.querySelectorAll('[data-pet-action]').forEach(b=>b.onclick=()=>{action=b.dataset.petAction;playing=true;update();});demo.querySelector('[data-pet-stop]').onclick=()=>{playing=false;update();};update();
      if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting&&playing){playing=false;update();}},{threshold:.1});observer.observe(demo);disposers.push(()=>observer.disconnect());}
      const visibility=()=>{if(document.hidden&&playing){playing=false;update();}};document.addEventListener('visibilitychange',visibility);disposers.push(()=>document.removeEventListener('visibilitychange',visibility));
    });
    const directoryLinks=main.querySelectorAll('.portfolio-directory [data-jump]');
    if(directoryLinks.length){const activeObserver=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(!visible.length)return;const id=visible[0].target.id;directoryLinks.forEach(link=>{if(link.dataset.jump===id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});},{rootMargin:'-110px 0px -55% 0px',threshold:0});directoryLinks.forEach(link=>{const target=document.getElementById(link.dataset.jump);if(target)activeObserver.observe(target);});disposers.push(()=>activeObserver.disconnect());}
    return () => disposers.forEach(fn=>fn());
  }
  function checkPdf() {
    const button = main.querySelector('#resume-download');
    if(!button || location.protocol === 'file:')return;
    const status = main.querySelector('#resume-status');
    const controller = new AbortController();const timer = setTimeout(()=>controller.abort(),5000);
    fetch(button.getAttribute('href'),{method:'HEAD',signal:controller.signal}).then(res=> {
      const type = res.headers.get('content-type') || '';
      if(!res.ok || (!type.includes('pdf') && !type.includes('octet-stream'))) {
        button.removeAttribute('href');button.removeAttribute('download');button.setAttribute('aria-disabled','true');button.textContent='简历 PDF · 文件不可用';status.textContent='请检查简历资源配置。';
      }
    }).catch(()=>{status.textContent='无法验证 PDF 可用性，请检查资源。';}).finally(()=>clearTimeout(timer));
  }
  function render() {
    const next = C.parseRoute(location.hash);
    // 页内锚点由单独事件处理，不重建页面。
    if(location.hash === '#main' || location.hash === '#selected')return;
    cleanup();if(dialog.open)dialog.close();gallery=[];
    const sameList = next.page===route.page && ['design','motion'].includes(next.page);
    route=next;
    const baseTitle = p.name ? `${p.name} · 个人作品集` : '个人作品集';
    let pageTitle='首页';
    if(route.page==='home')main.innerHTML=home();
    else if(route.page==='design'){main.innerHTML=listing('design',route.category);pageTitle='设计作品';}
    else if(route.page==='app'){main.innerHTML=listing('app',route.category);pageTitle='APP作品';}
    else if(route.page==='motion'){main.innerHTML=listing('video',route.category);pageTitle='视频作品';}
    else if(route.page==='about'){main.innerHTML=about();pageTitle='简历与联系';}
    else if(route.page==='work'){main.innerHTML=detail(route.slug,route.category);pageTitle=data.works.find(w=>w.slug===route.slug)?.title || '作品未找到';}
    else{main.innerHTML=notFound();pageTitle='页面未找到';}
    document.title=pageTitle+' · '+baseTitle;
    const work=data.works.find(w=>w.slug===route.slug);
    document.querySelector('meta[name="description"]').content=work?.description || (route.page==='about' ? (p.introduction || '个人介绍、在线简历与合作联系方式。') : '个人设计与影像作品集。浏览作品画面、创作过程与个人职责。');
    document.querySelector('meta[property="og:title"]').content=document.title;
    const active=route.page==='work' ? (work?.type==='app'?'app':work?.type==='design'?'design':'motion') : route.page;
    document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    closeMenu();footer();document.getElementById('footer').hidden=route.page==='home';bindImages();cleanup=effects();
    document.getElementById('print-resume')?.addEventListener('click',()=>window.print());
    checkPdf();
    if(!sameList)window.scrollTo({top:0,behavior:'instant'}); if(route.page==='about' && route.section==='contact') document.getElementById('contact')?.scrollIntoView();
    if(!firstRender){if(sameList)main.querySelector('.filter.active')?.focus({preventScroll:true});else main.focus({preventScroll:true});}
    firstRender=false;
  }
  const menu = document.getElementById('menu-toggle');
  function closeMenu(){menu.setAttribute('aria-expanded','false');document.getElementById('site-nav').classList.remove('open');}
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));document.getElementById('site-nav').classList.toggle('open',open);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});}});
  document.addEventListener('click',e=>{
    const a=e.target.closest('a');if(!a)return;
    if(a.getAttribute('href')==='#/'&&route.page==='home'){e.preventDefault();window.scrollTo({top:0,behavior:'instant'});main.querySelector('#hero-video')?.dispatchEvent(new Event('portfolio-resume'));}
    if(a.getAttribute('href')==='#selected'){e.preventDefault();document.getElementById('selected')?.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});}
    if(a.getAttribute('href')==='#/about?section=contact'){e.preventDefault();if(route.page==='about')document.getElementById('contact')?.scrollIntoView();else location.hash='/about?section=contact';}
    if(a.classList.contains('skip-link')){e.preventDefault();main.focus();}
    if(a.closest('#site-nav'))closeMenu();
  });
  window.addEventListener('hashchange',render);
  render();
})();

