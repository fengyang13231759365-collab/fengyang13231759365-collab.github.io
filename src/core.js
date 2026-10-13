(function (root) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function safeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    const v = value.trim();
    if (/[\x00-\x20\\]/.test(v) || /^[a-z]:/i.test(v) || v.startsWith('//')) return '';
    if (/^https?:\/\//i.test(v)) return v;
    if (/^[a-z][a-z\d+.-]*:/i.test(v) || v.startsWith('/')) return '';
    return v.split('/').includes('..') ? '' : v;
  }
  function bilibili(value) {
    try { const u=new URL(value); if(u.protocol!=='https:' || !['www.bilibili.com','bilibili.com','m.bilibili.com'].includes(u.hostname))return null;
      const m=u.pathname.match(/^\/video\/(BV[a-zA-Z0-9]{10})\/?$/); if(!m)return null;
      const page=Math.max(1,Math.min(1000,Number(u.searchParams.get('p'))||1));
      return {bvid:m[1],page,url:'https://www.bilibili.com/video/'+m[1]+'/?p='+page,embed:'https://player.bilibili.com/player.html?bvid='+m[1]+'&page='+page+'&autoplay=0&danmaku=0'};
    }catch{return null;}
  }
  function douyin(value) {
    try {
      const u=new URL(value);
      if(u.protocol!=='https:'||!['www.douyin.com','douyin.com'].includes(u.hostname))return null;
      const id=u.pathname.match(/^\/video\/(\d{17,22})\/?$/)?.[1] || (u.pathname.startsWith('/user/')?u.searchParams.get('modal_id'):'');
      if(!/^\d{17,22}$/.test(id||''))return null;
      return {id,url:'https://www.douyin.com/video/'+id};
    }catch{return null;}
  }
  function ratio(value) {
    const parts = String(value || '16:9').split(/[:/]/).map(Number);
    if (parts.length !== 2 || !parts.every(n => Number.isFinite(n) && n > 0)) return 16 / 9;
    return Math.max(.25, Math.min(4, parts[0] / parts[1]));
  }
  function parseRoute(hash) {
    const raw = String(hash || '#/').replace(/^#\/?/, '');
    const [pathname, search = ''] = raw.split('?');
    let segments;
    try { segments = pathname.split('/').filter(Boolean).map(decodeURIComponent); } catch { return {page:'notfound'}; }
    if (!segments.length) return {page:'home'};
    if (['design','motion','app','about'].includes(segments[0]) && segments.length === 1) return {page:segments[0], category:new URLSearchParams(search).get('category') || 'all', section:new URLSearchParams(search).get('section') || ''};
    if (segments[0] === 'work' && segments.length === 2) return {page:'work', slug:segments[1], category:new URLSearchParams(search).get('from') || 'all'};
    return {page:'notfound'};
  }
  function listWorks(data, type, category = 'all') { return data.works.filter(w => w.type === type && (category === 'all' || w.category === category)); }
  function featuredWorks(data) { return data.works.filter(w => w.featured).slice(0,6); }
  function categoryName(data, work) { return data.categories[work.type]?.find(c => c.id === work.category)?.name || '未分类'; }
  function validate(data) {
    const errors = [], ids = new Set(), slugs = new Set();
    for (const type of ['design','video','app']) {
      const cats = data.categories[type] || [];
      if (new Set(cats.map(c => c.id)).size !== cats.length) errors.push(type + ' 分类标识重复');
    }
    for (const w of data.works) {
      if (!w.id || ids.has(w.id)) errors.push('作品 id 缺失或重复：' + w.id);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(w.slug || '') || slugs.has(w.slug)) errors.push('作品 slug 无效或重复：' + w.slug);
      ids.add(w.id); slugs.add(w.slug);
      if (!['design','video','app'].includes(w.type)) errors.push('作品类型无效：' + w.id);
      if (!data.categories[w.type]?.some(c => c.id === w.category)) errors.push('作品分类不存在：' + w.id);
      if(w.bilibiliUrl && !bilibili(w.bilibiliUrl)) errors.push('请填写B站单个视频的完整 BV 链接：'+w.title);
      if(w.douyinUrl && !douyin(w.douyinUrl)) errors.push('请填写抖音单个视频链接：'+w.title);
      for (const field of ['cover','poster','videoSrc','downloadSrc']) if (w[field] && !safeUrl(w[field])) errors.push('资源路径无效：' + w.id + '.' + field);
      if (!Array.isArray(w.images) || !Array.isArray(w.tags) || !Array.isArray(w.tools)) errors.push('images/tags/tools 必须为数组：' + w.id);
      for (const img of w.images || []) if (!safeUrl(typeof img === 'string' ? img : img.src)) errors.push('图片路径无效：' + w.id);
    }
    return errors;
  }
  const api = {bilibili,douyin,esc,safeUrl,ratio,parseRoute,listWorks,featuredWorks,categoryName,validate};
  root.PortfolioCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
