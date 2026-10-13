const fs=require('fs');
const root='C:/个人网站/bloom/';
let html=fs.readFileSync(root+'src/index.html','utf8');
html=html.replace('>PORTFOLIO<span class="brand-small">DESIGN & MOTION','>个人作品集<span class="brand-small">DESIGN & MOTION');
for(const [en,cn] of [['HOME','首页'],['DESIGN','设计作品'],['MOTION','视频作品'],['ABOUT','简历与联系']])html=html.replace(en+' <span>'+cn+'</span>',cn+' <span>'+en+'</span>');
fs.writeFileSync(root+'src/index.html',html);
let app=fs.readFileSync(root+'src/app.js','utf8');
app=app.replace('<h1>${isDesign ? \'DESIGN\' : \'MOTION\'}<span>${isDesign ? \'设计作品\' : \'视频作品\'}</span></h1>','<h1>${isDesign ? \'设计作品\' : \'视频作品\'}<span>${isDesign ? \'DESIGN\' : \'MOTION\'}</span></h1>');
app=app.replace('<h1>ABOUT<span>简历与联系</span></h1>','<h1>简历与联系<span>ABOUT</span></h1>');
app=app.replace('<h3>DESIGN<span>设计作品</span></h3>','<h3>设计作品<span>DESIGN</span></h3>').replace('<h3>MOTION<span>视频作品</span></h3>','<h3>视频作品<span>MOTION</span></h3>');
app=app.replace('01 / VISUAL DESIGN','01 / 视觉设计').replace('02 / MOVING IMAGE','02 / 动态影像');
app=app.replace('PERSONAL PORTFOLIO / 个人作品集','个人作品集 / PERSONAL PORTFOLIO');
app=app.replace('>DESIGN × MOTION × IMAGINATION</span>','>设计 · 影像 · 创作</span>');
app=app.replace('>DESIGN & MOTION</a>','>个人作品集 <small>DESIGN & MOTION</small></a>');
app=app.replace("w.type === 'video' ? 'MOTION' : 'DESIGN'","w.type === 'video' ? '视频作品' : '设计作品'");
app=app.replace("let pageTitle='HOME 首页'","let pageTitle='首页'").replace("pageTitle='DESIGN 设计作品'","pageTitle='设计作品'").replace("pageTitle='MOTION 视频作品'","pageTitle='视频作品'").replace("pageTitle='ABOUT 简历与联系'","pageTitle='简历与联系'");
fs.writeFileSync(root+'src/app.js',app);
let css=fs.readFileSync(root+'src/styles.css','utf8');
css+=`\n/* 中文为主，英文仅作为次级栏目注释。 */
.brand{font-size:16px;letter-spacing:.06em}.brand-small{font-size:8px;letter-spacing:.12em}
.site-header nav a{font-size:13px;letter-spacing:.02em;gap:8px}.site-header nav a span{font:9px Arial,sans-serif;letter-spacing:.08em;color:var(--muted)}
.page-intro h1{font-family:"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;font-size:clamp(40px,5.2vw,72px);letter-spacing:-.04em;gap:22px}
.page-intro h1 span{font-family:Arial,sans-serif;font-size:14px;letter-spacing:.15em;color:var(--muted)}
.entry-panel h3{font-family:"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;font-size:clamp(30px,3.1vw,44px);letter-spacing:-.03em}
.entry-panel h3 span{font-family:Arial,sans-serif;font-size:12px;letter-spacing:.18em;color:var(--muted);margin-top:14px}
.footer-brand{font-size:13px;letter-spacing:.04em}.footer-brand small{font:9px Arial,sans-serif;letter-spacing:.08em;color:var(--muted);margin-left:10px}
@media(max-width:680px){.site-header nav a{font-size:14px}.site-header nav a span{font-size:10px}.page-intro h1{font-size:40px;gap:12px;align-items:baseline}.page-intro h1 span{font-size:11px;letter-spacing:.12em}.entry-panel h3{font-size:34px}.entry-panel h3 span{font-size:11px}}
`;
fs.writeFileSync(root+'src/styles.css',css);
console.log('中文主标题、导航、作品入口、品牌与页脚已更新。');
