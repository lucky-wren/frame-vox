/* ══════════════════════════════════════════════════════════════════════════
   帧语 NEXT
   与旧版彻底切割的三处根改：
   1. 渲染底座：Canvas 逐帧手算坐标 → HTML/CSS 卡片自动布局。
      画面固定 1080×1920 / 1920×1080 逻辑像素，预览用 CSS scale 缩小，
      导出用同一份 DOM + 同一份 CSS 序列化成 SVG foreignObject。
      中文词组用 <span class="w"> 包住，浏览器负责换行，绝不拆词、不越界、不互压。
   2. 产品形态：8 标签参数台 → 填内容 / 选风格 / 出片 三步。
   3. 内容结构：课件五阶段（念题→想一想→3·2·1→揭晓→讲解）
      → 平台四拍（钩子→反直觉→拆解→结论），答案留到最后一拍。
   保留并重写：微软神经音色、自定义配乐、字幕、主题、画幅、播放器、导出。
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ─────────────────────────────────────────────────────────────
   0. 画面 CSS —— 单一真相源
   注入页面供预览，导出时原样塞进 SVG foreignObject。
   ───────────────────────────────────────────────────────────── */
var FRAME_CSS = `
.frame{
  --fs-title:80px; --fs-h1:80px; --fs-h2:70px; --fs-body:40px; --fs-cap:28px; --fs-micro:22px;
  --fs-hero:250px; --fs-hero-sm:160px;
  --pad:96px; --gap:38px;
  --bg:#101a24; --fg:#f2f6fa; --dim:rgba(242,246,250,.56);
  --a1:#e9b96a; --a2:#4f9ae0; --card:rgba(255,255,255,.055); --line:rgba(242,246,250,.16);
  --subbg:rgba(6,12,18,.82); --subfg:#f2f6fa;
  width:1080px;height:1920px;position:absolute;top:0;left:0;transform-origin:top left;overflow:hidden;
  box-sizing:border-box;padding:var(--pad);
  display:flex;flex-direction:column;
  background:var(--bg);color:var(--fg);
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;
  font-size:calc(var(--fs-body) * var(--scale,1));
  line-height:1.5;
  -webkit-font-smoothing:antialiased;
}
/* 横版只改留白，不再重定义字号基准 —— 同一档位切画幅字号恒定 */
.frame[data-ratio="16:9"]{width:1920px;height:1080px;--pad:110px;--gap:26px}
/* 主题只改颜色，绝不改字号 —— 从根上消除「时大时小」 */
.frame[data-theme="ink"]{--bg:#101a24;--fg:#f2f6fa;--dim:rgba(242,246,250,.56);--a1:#e9b96a;--a2:#4f9ae0;--card:rgba(255,255,255,.055);--line:rgba(242,246,250,.16)}
.frame[data-theme="paper"]{--subbg:rgba(18,14,10,.86);--subfg:#fff8ec;--bg:#f6f1e6;--fg:#2b241c;--dim:rgba(43,36,28,.62);--a1:#a8543c;--a2:#6d8264;--card:rgba(43,36,28,.045);--line:rgba(43,36,28,.16)}
.frame[data-theme="jade"]{--subbg:rgba(18,14,10,.86);--subfg:#fff8ec;--bg:#eef4ef;--fg:#172a20;--dim:rgba(23,42,32,.60);--a1:#3f7355;--a2:#b08b52;--card:rgba(23,42,32,.04);--line:rgba(23,42,32,.15)}
.frame[data-theme="cyber"]{--subbg:rgba(18,14,10,.86);--subfg:#fff8ec;--bg:#171329;--fg:#f1edfb;--dim:rgba(241,237,251,.58);--a1:#b092c9;--a2:#4fc0c8;--card:rgba(255,255,255,.055);--line:rgba(241,237,251,.17)}
.frame[data-theme="sand"]{--subbg:rgba(18,14,10,.86);--subfg:#fff8ec;--bg:#e8d9bd;--fg:#3a2c1c;--dim:rgba(58,44,28,.64);--a1:#8f6035;--a2:#5e7358;--card:rgba(58,44,28,.05);--line:rgba(58,44,28,.18)}
.frame[data-theme="mono"]{--subbg:rgba(18,14,10,.86);--subfg:#fff8ec;--bg:#141617;--fg:#ecefec;--dim:rgba(236,239,236,.56);--a1:#8fb0b8;--a2:#c2a468;--card:rgba(255,255,255,.05);--line:rgba(236,239,236,.15)}
/* 背景几何：纯 CSS，无外部图片，导出不污染 canvas */
.f-bg{position:absolute;inset:0;pointer-events:none;z-index:0}
.f-bg::before{content:"";position:absolute;width:78%;height:52%;left:-12%;top:-14%;border-radius:50%;
  background:radial-gradient(circle,var(--a2),transparent 68%);opacity:.10}
.f-bg::after{content:"";position:absolute;width:66%;height:48%;right:-16%;bottom:-12%;border-radius:50%;
  background:radial-gradient(circle,var(--a1),transparent 70%);opacity:.09}
.f-grid{position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.22;
  background-image:linear-gradient(90deg,var(--line) 1px,transparent 1px);
  background-size:120px 120px;
  mask-image:linear-gradient(90deg,#000,transparent 32%,transparent 68%,#000)}
.f-inner{position:relative;z-index:1;display:flex;flex-direction:column;flex:1;min-height:0}
.f-head{display:flex;align-items:center;justify-content:space-between;flex:none}
.kicker{font-size:calc(var(--fs-cap) * var(--scale,1));letter-spacing:2px;color:var(--a1);font-weight:700}
.brandmini{font-size:calc(var(--fs-micro) * var(--scale,1));letter-spacing:5px;color:var(--dim)}
.f-main{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center}
.f-maincol{min-width:0;display:flex;flex-direction:column;justify-content:center}
.f-side{display:none}
/* 16:9：左文右视觉，右侧空间被几何填满，不再是「文字只占半屏、右边全空」 */
.frame[data-ratio="16:9"] .f-main{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);
  align-items:center;column-gap:calc(64px * var(--scale,1))}
.frame[data-ratio="16:9"] .f-side{display:flex;flex-direction:column;align-items:center;justify-content:center;
  position:relative;min-width:0;height:100%}
.side-ring{width:min(74%,calc(400px * var(--scale,1)));aspect-ratio:1;border-radius:50%;
  border:calc(18px * var(--scale,1)) solid var(--a1);opacity:.14;box-sizing:border-box}
.side-num{position:absolute;font-size:calc(var(--fs-title) * var(--scale,1) * 2.1);font-weight:900;
  color:var(--a1);opacity:.17;letter-spacing:-6px;line-height:1}
.side-tag{font-size:calc(var(--fs-cap) * var(--scale,1));color:var(--dim);letter-spacing:4px;
  margin-top:calc(var(--gap) * 1.3)}
.f-foot{flex:none;display:flex;align-items:center;justify-content:space-between}
.f-dots{display:flex;gap:calc(14px * var(--scale,1))}
.f-dots i{display:block;width:calc(46px * var(--scale,1));height:calc(6px * var(--scale,1));border-radius:6px;background:var(--line)}
.f-dots i.on{background:var(--a1)}
.f-footnote{font-size:calc(var(--fs-micro) * var(--scale,1));color:var(--dim);letter-spacing:1px}
.hook-title,.hook-sub,.big-title,.lead,.point-no,.point-title,.progline,
.verdict-badge,.verdict-title,.verdict-src,.verdict-cta,.verdict-line,.disclaim,.cover-title,.cover-sub,.cover-meta{
  padding-left:calc(34px * var(--scale,1))}
.hook-title,.big-title,.point-title,.verdict-title,.cover-title{
  border-left:calc(9px * var(--scale,1)) solid var(--a1);
  padding-left:calc(25px * var(--scale,1))}
.w{white-space:nowrap}  /* 中文词组保护：词内不断，只在词间断行 */
/* text-wrap:pretty 让浏览器贪心填满首行；balance 会让两行等宽但整体偏窄、右边空一大片 */
.hook-title{font-size:calc(var(--fs-title) * var(--scale,1));font-weight:850;line-height:1.28;margin:0;
  letter-spacing:-1px;text-wrap:pretty;word-break:normal;overflow-wrap:anywhere;border-radius:2px}
.hook-sub{font-size:calc(var(--fs-body) * var(--scale,1));color:var(--dim);margin:calc(var(--gap) * 1.1) 0 0;
  line-height:1.6;text-wrap:pretty}
.big-title{font-size:calc(var(--fs-title) * var(--scale,1));font-weight:800;line-height:1.34;margin:0;
  text-wrap:pretty;word-break:normal;overflow-wrap:anywhere}
.lead{font-size:calc(var(--fs-body) * var(--scale,1));color:var(--dim);margin:calc(var(--gap)) 0 0;line-height:1.65}
.twist-ring{width:calc(300px * var(--scale,1));height:calc(300px * var(--scale,1));
  border-radius:50%;border:calc(26px * var(--scale,1)) solid var(--a1);opacity:.16;
  position:absolute;right:-2%;top:6%;box-sizing:border-box;z-index:-1}
.point-no{font-size:calc(var(--fs-cap) * var(--scale,1));color:var(--a1);font-weight:700;letter-spacing:3px;
  margin-bottom:calc(var(--gap) * .7)}
.point-title{font-size:calc(var(--fs-title) * var(--scale,1));font-weight:800;line-height:1.38;margin:0;
  text-wrap:pretty;word-break:normal;overflow-wrap:anywhere}
.progline{display:flex;gap:calc(10px * var(--scale,1));margin-top:calc(var(--gap) * 1.9)}
.progline i{flex:1;height:calc(7px * var(--scale,1));border-radius:7px;background:var(--line)}
.progline i.on{background:var(--a1)}
.verdict-badge{display:inline-flex;align-items:center;gap:calc(12px * var(--scale,1));
  font-size:calc(var(--fs-cap) * var(--scale,1));font-weight:800;letter-spacing:2px;color:var(--bg);
  background:var(--a1);padding:calc(10px * var(--scale,1)) calc(22px * var(--scale,1));border-radius:99px;
  align-self:flex-start;margin-bottom:calc(var(--gap) * .9)}
.verdict-title{font-size:calc(var(--fs-title) * var(--scale,1));font-weight:850;line-height:1.32;margin:0;
  text-wrap:pretty;word-break:normal;overflow-wrap:anywhere}
.verdict-line{font-size:calc(var(--fs-body) * var(--scale,1));color:var(--fg);margin-top:calc(var(--gap) * .9);
  line-height:1.55;opacity:.92;text-wrap:pretty}
.takeaway{margin-top:calc(var(--gap) * 1.1);background:var(--card);
  border:1px solid var(--line);border-left:calc(9px * var(--scale,1)) solid var(--a1);
  border-radius:calc(14px * var(--scale,1));
  padding:calc(20px * var(--scale,1)) calc(20px * var(--scale,1))}
.takeaway b{display:block;font-size:calc(var(--fs-cap) * var(--scale,1));color:var(--a1);
  letter-spacing:2px;margin-bottom:calc(var(--gap) * .3)}
.takeaway span{font-size:calc(var(--fs-body) * var(--scale,1));color:var(--fg);
  line-height:1.6;opacity:.94;text-wrap:pretty}
.verdict-src{font-size:calc(var(--fs-cap) * var(--scale,1));color:var(--dim);margin-top:calc(var(--gap) * 1.0);line-height:1.6}
.verdict-cta{font-size:calc(var(--fs-body) * var(--scale,1));color:var(--a1);margin-top:calc(var(--gap) * 1.0);font-weight:700}
.disclaim{font-size:calc(var(--fs-micro) * var(--scale,1) * .94);color:var(--dim);line-height:1.55;
  margin-top:calc(var(--gap) * 1.5);padding-top:calc(var(--gap) * .7);border-top:1px solid var(--line);
  max-width:100%;opacity:.9;word-break:normal;overflow-wrap:anywhere;text-wrap:pretty}
.subbar{flex:none;z-index:3;display:flex;align-items:center;
  gap:calc(16px * var(--scale,1));
  font-size:calc(var(--fs-cap) * var(--scale,1) * var(--sub-scale,1) * var(--sub-fit,1));font-weight:600;line-height:1.5;
  color:var(--sub-fg,var(--fg));background:var(--sub-bg,transparent);border:0;
  border-left:calc(5px * var(--scale,1)) solid var(--sub-accent,var(--a1));
  padding:calc(10px * var(--scale,1)) 0 calc(10px * var(--scale,1)) calc(20px * var(--scale,1));
  margin-top:calc(var(--gap) * .7);
  border-radius:0;text-align:left;opacity:.92;
  word-break:normal;overflow-wrap:anywhere}
.subbar::before{content:'';flex:none;width:calc(9px * var(--scale,1));height:calc(9px * var(--scale,1));
  border-radius:50%;background:var(--sub-accent,var(--a1));opacity:.7}
.subwrap{max-width:var(--sub-wrap,100%)}
.frame[data-sub="0"] .subbar{display:none}
.frame[data-subpos="top"] .subbar{order:-1;margin-top:0;margin-bottom:calc(var(--gap) * .7)}
.frame[data-subpos="middle"] .subbar,
.frame[data-subpos="custom"] .subbar{position:absolute;z-index:5;
  left:var(--pad,96px);right:var(--pad,96px);margin:0}
.frame[data-subpos="middle"] .subbar{top:50%;transform:translateY(-50%)}
.frame[data-subpos="custom"] .subbar{left:var(--sub-x,50%);right:auto;top:var(--sub-y,86%);
  transform:translate(-50%,-50%);max-width:86%}
.wm{position:absolute;z-index:2;pointer-events:none;white-space:nowrap;
  font-size:calc(var(--fs-cap) * var(--scale,1) * var(--wm-size,1));
  font-weight:700;letter-spacing:2px;color:var(--fg);opacity:var(--wm-alpha,.18)}
.frame[data-wmpos="right-top"] .wm{right:var(--pad,96px);top:calc(var(--pad,96px) * .55)}
.frame[data-wmpos="left-top"] .wm{left:var(--pad,96px);top:calc(var(--pad,96px) * .55)}
.frame[data-wmpos="right-bottom"] .wm{right:var(--pad,96px);bottom:calc(var(--pad,96px) * .55)}
.frame[data-wmpos="left-bottom"] .wm{left:var(--pad,96px);bottom:calc(var(--pad,96px) * .55)}
.frame[data-wmpos="center"] .wm{left:50%;top:50%;transform:translate(-50%,-50%) rotate(-18deg);
  font-size:calc(var(--fs-h1,80px) * var(--scale,1) * var(--wm-size,1))}
.frame[data-beat="hook"] .f-main{justify-content:center}
.frame[data-beat="verdict"] .f-main{justify-content:center}
.frame[data-ratio="16:9"] .twist-ring{display:none}
/* ── 16:9 长标题帧：封面与钩子不再被两栏锁死 ──
   根因：两栏 grid 下文字栏只有约 940px，13 字题干被迫排 3 行；
   单栏用满 1700px 后，13 字一行就能放下，右侧装饰退为背景水印。 */
/* 长标题帧与信息密集的结论帧都用满整幅：两栏会把免责挤成 3 行顶出内容盒 */
.frame[data-ratio="16:9"][data-beat="cover"] .f-main,
.frame[data-ratio="16:9"][data-beat="hook"] .f-main,
.frame[data-ratio="16:9"][data-beat="verdict"] .f-main{
  display:flex;flex-direction:column;justify-content:center}
.frame[data-ratio="16:9"][data-beat="cover"] .f-maincol,
.frame[data-ratio="16:9"][data-beat="hook"] .f-maincol,
.frame[data-ratio="16:9"][data-beat="verdict"] .f-maincol{width:100%;position:relative;z-index:1}
.frame[data-ratio="16:9"][data-beat="cover"] .f-side,
.frame[data-ratio="16:9"][data-beat="hook"] .f-side,
.frame[data-ratio="16:9"][data-beat="verdict"] .f-side{
  position:absolute;right:-1%;bottom:2%;width:27%;height:60%;
  display:flex;opacity:.26;z-index:0;pointer-events:none}
.frame[data-ratio="16:9"][data-beat="cover"] .side-ring,
.frame[data-ratio="16:9"][data-beat="hook"] .side-ring,
.frame[data-ratio="16:9"][data-beat="verdict"] .side-ring{width:78%}
.frame[data-ratio="16:9"][data-beat="cover"] .side-num,
.frame[data-ratio="16:9"][data-beat="hook"] .side-num,
.frame[data-ratio="16:9"][data-beat="verdict"] .side-num{
  font-size:calc(var(--fs-title) * var(--scale,1) * 1.5);opacity:.22}
.frame[data-ratio="16:9"][data-beat="cover"] .side-tag,
.frame[data-ratio="16:9"][data-beat="hook"] .side-tag,
.frame[data-ratio="16:9"][data-beat="verdict"] .side-tag{display:none}
/* 横版封面标题字号回到主字阶，配合整幅宽度自然成一行 */
/* 横版封面/钩子同样用 --fs-title，不再另设倍率 */
.frame[data-ratio="16:9"] .cover-title,
.frame[data-ratio="16:9"] .hook-title{font-size:calc(var(--fs-title) * var(--scale,1))}
/* 横版封面栏目名与期号连排，不再两端拉开留一大片空白 */
.frame[data-ratio="16:9"] .cover-brand{justify-content:flex-start;gap:calc(28px * var(--scale,1))}
.frame[data-ratio="16:9"] .cover-issue{color:var(--a1)}
/* 横版封面免责横线只覆盖文字区，不横贯到右侧装饰 */
.frame[data-ratio="16:9"] .cover-disclaim{max-width:66%}

/* ── 封面帧：发布用静态封面 / 可选作视频首帧 ── */
.frame[data-beat="cover"] .subbar{display:none}
.frame[data-beat="cover"] .f-dots{visibility:hidden}
.frame[data-ratio="16:9"][data-beat="cover"] .cover-big{display:none}
.cover-brand{display:flex;align-items:center;justify-content:space-between;flex:none;
  font-size:calc(var(--fs-cap) * var(--scale,1));font-weight:800;letter-spacing:4px;color:var(--a1)}
.cover-issue{font-size:calc(var(--fs-micro) * var(--scale,1));letter-spacing:3px;color:var(--dim)}
.cover-title{font-size:calc(var(--fs-title) * var(--scale,1));font-weight:900;line-height:1.26;margin:0;
  text-wrap:pretty;word-break:normal;overflow-wrap:anywhere;border-radius:2px}
.cover-sub{font-size:calc(var(--fs-body) * var(--scale,1));color:var(--dim);margin:calc(var(--gap) * 1.2) 0 0;
  line-height:1.6;text-wrap:pretty}
.cover-meta{display:flex;flex-wrap:wrap;gap:calc(16px * var(--scale,1));margin-top:calc(var(--gap) * 1.5)}
.cover-chip{font-size:calc(var(--fs-cap) * var(--scale,1));color:var(--fg);border:1px solid var(--line);
  padding:calc(8px * var(--scale,1)) calc(18px * var(--scale,1));border-radius:99px;white-space:nowrap}
.cover-big{position:absolute;right:-.04em;bottom:-.28em;font-size:calc(var(--fs-title) * var(--scale,1) * 5);
  font-weight:900;color:var(--a1);opacity:.07;line-height:1;letter-spacing:-.06em;z-index:-1}
.cover-disclaim{font-size:calc(var(--fs-micro) * var(--scale,1) * .94);color:var(--dim);line-height:1.55;
  margin-top:calc(var(--gap) * 1.6);border-top:1px solid var(--line);padding-top:calc(var(--gap) * .7);
  text-wrap:pretty}
/* ══ 断言驱动画面层：信息递进，不再是一句要点 + 40% 留白 ══ */
.claim-tag{display:inline-flex;align-self:flex-start;align-items:center;
  font-size:calc(var(--fs-cap) * var(--scale,1));font-weight:800;letter-spacing:2px;
  color:var(--a1);border:calc(2px * var(--scale,1)) solid var(--a1);border-radius:99px;
  padding:calc(7px * var(--scale,1)) calc(22px * var(--scale,1));
  margin-bottom:calc(var(--gap) * 1.15)}
.heat-badge{align-self:flex-start;font-size:calc(var(--fs-cap) * var(--scale,1) * .9);
  color:var(--a1);font-weight:800;letter-spacing:1px;
  margin-top:calc(var(--gap) * .5);padding-left:calc(34px * var(--scale,1));opacity:.92}
.claim-tags{display:flex;flex-wrap:wrap;gap:calc(14px * var(--scale,1));
  margin-top:calc(var(--gap) * 1.5)}
.claim-tags > span{font-size:calc(var(--fs-cap) * var(--scale,1));color:var(--fg);
  border:1px solid var(--line);border-radius:99px;white-space:nowrap;
  padding:calc(9px * var(--scale,1)) calc(22px * var(--scale,1));opacity:.9}
.claim-promise{font-size:calc(var(--fs-cap) * var(--scale,1));color:var(--a1);
  margin-top:calc(var(--gap) * 1.2);font-weight:700;letter-spacing:1px;
  padding-left:calc(34px * var(--scale,1))}
.promise-row{display:flex;flex-wrap:wrap;gap:calc(18px * var(--scale,1));
  margin-top:calc(var(--gap) * 2.1);padding-left:calc(34px * var(--scale,1))}
.promise-row > span{display:inline-flex;align-items:center;gap:calc(12px * var(--scale,1));
  font-size:calc(var(--fs-cap) * var(--scale,1));color:var(--fg);
  border-bottom:calc(3px * var(--scale,1)) solid var(--line);
  padding-bottom:calc(10px * var(--scale,1));white-space:nowrap}
.promise-row b{font-size:calc(var(--fs-cap) * var(--scale,1) * 1.15);color:var(--a1);font-weight:900}
/* 拆解帧：数据锤内联高亮 + 背景序号 + 分段进度 */
/* 信息块集中成一个整体：机制标签 → 主句（数据锤内联）→ 数据卡 → 分段进度。
   不再用 space-between 把三段撒成孤岛；留白集中到上下，靠水印与底部信息条收边。 */
.frame[data-beat="break"] .f-maincol{flex:1;height:100%;justify-content:center;padding:0}
.point-stat{display:flex;align-items:center;gap:calc(28px * var(--scale,1));
  margin-top:calc(var(--gap) * 1.5);
  background:var(--card);border:1px solid var(--line);
  border-left:calc(9px * var(--scale,1)) solid var(--a1);
  border-radius:calc(14px * var(--scale,1));
  padding:calc(22px * var(--scale,1)) calc(28px * var(--scale,1));
  max-width:100%}
.stat-num{flex:none;font-size:calc(var(--fs-title) * var(--scale,1) * 1.28);
  font-weight:900;color:var(--a1);line-height:1;white-space:nowrap;letter-spacing:-2px}
.stat-note{min-width:0;font-size:calc(var(--fs-body) * var(--scale,1));color:var(--fg);
  line-height:1.55;opacity:.9;text-wrap:pretty}
.stat-note b{display:block;font-size:calc(var(--fs-cap) * var(--scale,1));
  color:var(--a1);letter-spacing:2px;margin-bottom:calc(var(--gap) * .25)}
.subwrap{min-width:0}
.point-prog{display:flex;align-items:center;gap:calc(24px * var(--scale,1));
  margin-top:calc(var(--gap) * 2.2)}
.point-prog .progline{flex:1;margin-top:0}
.prog-count{font-size:calc(var(--fs-cap) * var(--scale,1));color:var(--a1);
  font-weight:800;letter-spacing:2px;white-space:nowrap}
.frame[data-ratio="16:9"] .claim-tags,
.frame[data-ratio="16:9"] .claim-promise,
.frame[data-ratio="16:9"] .promise-row{max-width:64%}

/* ══════════════════════════════════════════════════════════════
   海报式视觉层 · v4
   旧版 = 页眉「03·拆解·科普」+ 标题 + 边框要点卡 + 三段细进度线 + 页脚版权字，
   标准 PPT 骨架，信息全但没有一秒「先看好玩」。
   新版 = 每帧一个巨型视觉主角（斜切色带 + 超大数字/符号）占上半屏，
   文字压在下半屏，页眉只留拍号，页脚只留一条粗节奏带。
   ══════════════════════════════════════════════════════════════ */
.frame[data-beat="cover"] .hero-zone{display:none}
.frame:not([data-beat="cover"]) .f-maincol{
  display:grid;grid-template-rows:minmax(0,.92fr) minmax(0,1.28fr);
  height:100%;min-height:0}
.hero-zone{position:relative;display:flex;align-items:center;justify-content:center;
  min-height:0;overflow:hidden;margin:0 calc(var(--pad) * -.5)}
.hero-zone::before{content:"";position:absolute;inset:-4% -12%;
  background:linear-gradient(135deg,var(--a1),transparent 70%);opacity:.14;
  clip-path:polygon(0 0,100% 0,100% 72%,0 100%)}
.hero-zone::after{content:"";position:absolute;left:0;right:0;bottom:8%;height:6px;
  background:var(--a1);opacity:.45;transform:skewY(-2.2deg)}
.hero-num,.hero-glyph,.hero-steps{position:relative;z-index:1;line-height:1;
  font-weight:900;color:var(--a1);letter-spacing:-.055em;white-space:nowrap;
  text-align:center;max-width:100%}
.hero-glyph{font-size:calc(var(--fs-hero) * var(--scale,1) * 1.28)}
.hero-num{font-size:calc(var(--fs-hero) * var(--scale,1))}
.hero-num.md{font-size:calc(var(--fs-hero) * var(--scale,1) * .78)}
.hero-num.sm{font-size:calc(var(--fs-hero-sm) * var(--scale,1))}
.hero-steps{display:flex;align-items:baseline;gap:calc(var(--gap) * 1.2)}
.hero-steps b{font-size:calc(var(--fs-hero) * var(--scale,1) * .78);font-weight:900;
  color:var(--a1);opacity:.9}
.hero-steps b:nth-child(2){font-size:calc(var(--fs-hero) * var(--scale,1) * 1.02);opacity:1}
.hero-steps b:nth-child(3){font-size:calc(var(--fs-hero) * var(--scale,1) * .62);opacity:.7}
.body-zone{display:flex;flex-direction:column;justify-content:center;min-height:0}
.frame[data-beat="break"] .body-zone{justify-content:space-between;padding:calc(var(--gap) * .4) 0 0}
/* 页眉只留一个放大的拍号，不再是报表标题 */
.kicker{font-size:calc(var(--fs-title) * var(--scale,1) * .72);
  color:var(--a1);font-weight:900;letter-spacing:0;line-height:1}
.brandmini{font-size:calc(var(--fs-cap) * var(--scale,1));letter-spacing:2px}
/* 页脚节奏带与拆解帧分段进度重复，且会压在「下一层」预告下方 —— 整条移除 */
.f-foot{display:none}
.f-footnote{display:none}
/* 进度：粗色块分段，不再像 PPT 进度条 */
.progline{gap:calc(6px * var(--scale,1))}
.progline i{height:calc(16px * var(--scale,1));border-radius:2px;opacity:.28}
.progline i.on{opacity:1}
/* 数据卡去边框：改成「关键数据 + 补充条」的轻排布，视觉主角交给 hero */
.point-stat{margin-top:0;background:transparent;border:0;border-radius:0;padding:0}
.stat-note b{font-size:calc(var(--fs-cap) * var(--scale,1));color:var(--a1);
  letter-spacing:3px;margin-bottom:calc(var(--gap) * .18)}
.stat-note{font-size:calc(var(--fs-body) * var(--scale,1));line-height:1.5}
/* 字幕预告放大成「下一层」大字，把下半屏真正用起来 */
.subbar{font-size:calc(var(--fs-body) * var(--scale,1) * .95);
  border-left-width:calc(7px * var(--scale,1));font-weight:800;
  margin-top:calc(var(--gap) * .5);padding-top:calc(var(--gap) * .35)}
/* 结论帧：带走句做成整幅强调色块 */
.takeaway{background:var(--a1);border:0;border-radius:calc(10px * var(--scale,1));
  padding:calc(20px * var(--scale,1)) calc(24px * var(--scale,1))}
.takeaway b{color:var(--bg);opacity:.72}
.takeaway > span,.takeaway > span .w{color:#101a24;font-weight:800;opacity:1}
/* 16:9 高度只有 1080，不再做上下分区：hero 让给右栏原有的大序号，
   左栏回到紧凑单列，否则标题 / 进度 / 免责会被挤出内容盒。 */
.frame[data-ratio="16:9"] .f-maincol{display:flex;flex-direction:column;
  justify-content:center;height:auto}
.frame[data-ratio="16:9"] .hero-zone{display:none}
.frame[data-ratio="16:9"] .body-zone{display:block}
/* 16:9 高度只有 1080，hero 等比收（右栏大序号用不到，保留供竖版切换） */
.frame[data-ratio="16:9"] .hero-glyph{font-size:calc(var(--fs-hero) * var(--scale,1) * .72)}
.frame[data-ratio="16:9"] .hero-num{font-size:calc(var(--fs-hero) * var(--scale,1) * .62)}
.frame[data-ratio="16:9"] .hero-num.md{font-size:calc(var(--fs-hero) * var(--scale,1) * .5)}
.frame[data-ratio="16:9"] .hero-num.sm{font-size:calc(var(--fs-hero-sm) * var(--scale,1) * .62)}
.frame[data-ratio="16:9"] .hero-steps b{font-size:calc(var(--fs-hero) * var(--scale,1) * .46)}
.frame[data-ratio="16:9"] .hero-steps b:nth-child(2){font-size:calc(var(--fs-hero) * var(--scale,1) * .6)}
.frame[data-ratio="16:9"] .hero-steps b:nth-child(3){font-size:calc(var(--fs-hero) * var(--scale,1) * .38)}
.frame[data-ratio="16:9"] .kicker{font-size:calc(var(--fs-title) * var(--scale,1) * .5)}

/* ══════════════════════════════════════════════════════════════
   短视频分镜层 · V5（覆盖上面的海报式骨架）
   依据：前 3 秒只做冲突、每 3–5 秒切一次镜头、字幕必加（静音观看）、
   花字/弹幕/贴纸做共鸣点、反转「你以为→其实」、结尾把句号改成问号。
   旧版是「一屏一张知识卡 + 页眉页脚 + 进度点」＝PPT，整层弃用。
   ══════════════════════════════════════════════════════════════ */
.frame .f-inner{position:relative;overflow:hidden;justify-content:center}
.frame .f-inner::before,.frame .f-inner::after{content:"";position:absolute;
  inset:0;pointer-events:none;z-index:0}
.frame .f-inner::after{background:
  radial-gradient(60% 42% at 78% 18%,color-mix(in srgb,var(--a1) 22%,transparent),transparent 70%),
  radial-gradient(48% 38% at 12% 88%,color-mix(in srgb,var(--a2) 16%,transparent),transparent 72%);
  opacity:.9}
/* 去掉所有 PPT 部件 */
.frame .hero-zone,.frame .body-zone,.frame .f-side,.frame .f-foot,
.frame .f-dots,.frame .f-footnote,.frame .progline,.frame .point-prog,
.frame .claim-tags,.frame .claim-promise,.frame .promise-row,.frame .twist-ring{display:none!important}
/* 块流布局：每帧用固定 padding-top 决定内容起点，完全可预测。
   flex 居中在缩放画布里会算出负起点，导致标签压进度条 / 大字压字幕条。 */
.frame .f-main{flex:1!important;min-height:0;display:block!important;
  position:relative;z-index:2;padding:0!important}
/* v4 遗留的 .frame:not([data-beat=cover]) .f-maincol{display:grid} 优先级更高，
   会把新布局覆盖成两行网格 —— 用 !important 锁死块流。 */
.frame .f-inner .f-maincol{position:absolute!important;inset:0;display:block!important;
  box-sizing:border-box;height:auto!important;min-height:0;grid-template-rows:none!important;
  padding-top:calc(var(--pad) * 3.2);padding-bottom:calc(var(--pad) * 3.4)}
.frame .f-maincol > *{max-width:100%;box-sizing:border-box}
.frame .hook-title,.frame .big-title,.frame .point-title,
.frame .verdict-title,.frame .cover-title{width:100%}
/* 主标题：全片唯一字号（V2.9 口径不变，Hero/花字是另一类固定层级） */
.frame .hook-title,.frame .big-title,.frame .point-title,
.frame .verdict-title,.frame .cover-title{
  font-size:calc(var(--fs-title) * var(--scale,1));line-height:1.18;
  font-weight:900;letter-spacing:-.02em;margin:0}
/* 顶部：时间码 + 进度条 */
.frame .f-head{position:absolute;top:var(--pad);left:var(--pad);right:var(--pad);
  z-index:4;display:flex;align-items:baseline;gap:calc(14px * var(--scale,1));flex:none}
.frame .kicker{font-size:calc(var(--fs-cap) * var(--scale,1) * .92);
  color:var(--fg);font-weight:800;letter-spacing:1px;line-height:1;opacity:.9}
.frame .brandmini{font-size:calc(var(--fs-cap) * var(--scale,1) * .74);
  color:var(--fg);opacity:.5;margin-left:auto;letter-spacing:1px}
.frame .vbar{position:absolute;left:0;right:0;top:calc(var(--fs-cap) * var(--scale,1) * 1.7);
  height:calc(6px * var(--scale,1));background:rgba(255,255,255,.2);border-radius:6px}
.frame .vbar i{display:block;height:100%;background:var(--a1);border-radius:6px;
  box-shadow:0 0 calc(14px * var(--scale,1)) var(--a1)}
/* 底部口播字幕条：黑底白字描边，全程都在 */
.frame .subbar{position:absolute;left:var(--pad);right:var(--pad);
  bottom:calc(var(--pad) * 1.25);z-index:4;margin:0;
  background:rgba(5,9,15,.82);border:0;border-left:0;border-radius:calc(12px * var(--scale,1));
  padding:calc(16px * var(--scale,1)) calc(24px * var(--scale,1));text-align:center;
  font-size:calc(var(--fs-body) * var(--scale,1) * .9);font-weight:800;color:#fff;
  line-height:1.35;text-shadow:0 2px 0 #000,0 0 8px rgba(0,0,0,.95)}
.frame .subwrap{display:inline}
/* 花字小标 / 峰值条 / 弹幕贴纸 / 圈注 / 划掉线 */
.frame .shot-label{display:inline-block!important;width:max-content!important;
  max-width:100%;align-self:flex-start;
  font-size:calc(var(--fs-cap) * var(--scale,1));
  font-weight:900;letter-spacing:3px;color:var(--a1);
  padding:calc(6px * var(--scale,1)) calc(16px * var(--scale,1));
  border:calc(3px * var(--scale,1)) solid var(--a1);border-radius:999px;
  margin-bottom:calc(var(--gap) * .8)}
.frame .shot-label.hot{background:var(--a1);color:#10141c;border:0}
.frame .peakbar{display:inline-block!important;width:max-content!important;
  max-width:100%;align-self:flex-start;
  font-size:calc(var(--fs-cap) * var(--scale,1) * 1.05);
  font-weight:900;color:#10141c;background:var(--a1);
  padding:calc(10px * var(--scale,1)) calc(22px * var(--scale,1));
  border-radius:calc(8px * var(--scale,1));transform:rotate(-1.5deg);
  margin-bottom:calc(var(--gap) * .65);box-shadow:calc(8px * var(--scale,1)) calc(8px * var(--scale,1)) 0 rgba(0,0,0,.3)}
.frame .flower.hero-num{position:absolute;right:-3%;top:3%;z-index:1;
  font-size:calc(var(--fs-hero) * var(--scale,1) * .5);
  font-weight:900;color:transparent;opacity:.5;letter-spacing:-.06em;
  white-space:nowrap;line-height:1;transform:rotate(-8deg);
  -webkit-text-stroke:calc(2px * var(--scale,1)) var(--a1);
  text-shadow:none;pointer-events:none}
.frame .sticker{position:absolute;z-index:3;font-size:calc(var(--fs-cap) * var(--scale,1) * .86);
  font-weight:800;color:#10141c;background:#fff;
  padding:calc(11px * var(--scale,1)) calc(20px * var(--scale,1));
  border-radius:calc(10px * var(--scale,1));
  box-shadow:calc(6px * var(--scale,1)) calc(6px * var(--scale,1)) 0 rgba(0,0,0,.35);
  transform:rotate(-7deg);max-width:56%}
.frame .sticker::after{content:"";position:absolute;left:22%;bottom:calc(-12px * var(--scale,1));
  border:calc(7px * var(--scale,1)) solid transparent;border-top-color:#fff;
  border-right-color:#fff;transform:rotate(18deg)}
.frame .st1{top:15%;right:8%}
.frame .st2{top:16%;left:6%;transform:rotate(5deg)}
.frame .st1,.frame .st2{max-width:46%}
.frame [class*="st3"]{}
.frame .st3{top:9%;right:6%;transform:rotate(8deg)}
.frame .stend{bottom:22%;right:5%;transform:rotate(-5deg);background:var(--a1)}
.frame .stend::after{border-top-color:var(--a1);border-right-color:var(--a1)}
.frame .ring{position:absolute;z-index:1;width:34%;height:11%;right:-7%;bottom:11%;
  border:calc(8px * var(--scale,1)) solid var(--a1);border-radius:50%;
  opacity:.2;transform:rotate(-12deg);pointer-events:none}
.frame .swoosh{position:absolute;z-index:1;left:auto;right:-6%;width:38%;bottom:16%;
  height:calc(9px * var(--scale,1));background:var(--a1);opacity:.38;
  transform:rotate(-4deg)}
.frame .qmark{position:absolute;z-index:1;right:-4%;bottom:16%;
  font-size:calc(var(--fs-hero) * var(--scale,1) * 1.5);font-weight:900;
  color:var(--a1);opacity:.14;line-height:1}
.frame .flip-l{display:block;width:auto;position:relative;z-index:2;
  font-size:calc(var(--fs-body) * var(--scale,1) * 1.05);color:var(--dim);
  margin-bottom:calc(var(--gap) * .5)}
.frame .flip-l b{display:block;font-size:calc(var(--fs-cap) * var(--scale,1));
  color:var(--a1);letter-spacing:3px;margin-bottom:calc(var(--gap) * .25)}
.frame .strike{position:relative;display:inline-block;font-weight:700}
.frame .strike::after{content:"";position:absolute;left:-4%;right:-4%;top:52%;
  height:calc(6px * var(--scale,1));background:var(--a1);transform:rotate(-2deg)}
.frame .flip-arrow{display:block;width:auto;font-size:calc(var(--fs-title) * var(--scale,1) * .62);
  color:var(--a1);line-height:1;margin:calc(var(--gap) * .3) 0;transform:none}
.frame .heat-badge{display:block;width:auto;margin-top:calc(var(--gap) * .6);
  font-size:calc(var(--fs-cap) * var(--scale,1) * .82);color:var(--a1);font-weight:800}
.frame .hook-sub,.frame .lead{font-size:calc(var(--fs-body) * var(--scale,1));
  color:var(--dim);margin-top:calc(var(--gap) * .5);line-height:1.45}
.frame .point-stat{margin-top:calc(var(--gap) * .55);font-size:calc(var(--fs-body) * var(--scale,1) * .82);
  color:var(--dim);line-height:1.5}
.frame .stat-note{font-size:inherit}
.frame .takeaway{margin-top:calc(var(--gap) * .8);background:rgba(255,255,255,.08);
  border:0;border-radius:calc(10px * var(--scale,1));
  padding:calc(14px * var(--scale,1)) calc(22px * var(--scale,1))}
.frame .takeaway b{font-size:calc(var(--fs-cap) * var(--scale,1) * .8);
  color:var(--a1);letter-spacing:2px;margin-bottom:4px}
.frame .takeaway > span,.frame .takeaway > span .w{font-size:calc(var(--fs-body) * var(--scale,1));
  color:var(--fg);font-weight:800;opacity:1;display:block}
.frame .verdict-cta{margin-top:calc(var(--gap) * .9);font-size:calc(var(--fs-body) * var(--scale,1));
  color:var(--a1);font-weight:900;line-height:1.4}
.frame .verdict-src,.frame .disclaim{margin-top:calc(var(--gap) * .35);
  font-size:calc(var(--fs-micro) * var(--scale,1));color:var(--dim);line-height:1.5}
/* 六套构图：每 3–5 秒切一次「镜头」，不再一个模板换字 */
.frame .f-inner[data-shot="hook"]::before{background:var(--a1);
  clip-path:polygon(0 0,100% 0,100% 34%,0 52%);opacity:.16}
.frame .f-inner[data-shot="hook"] .f-maincol{padding-top:calc(var(--pad) * 7.0)!important}
.frame .f-inner[data-shot="flip"] .f-maincol{padding-top:calc(var(--pad) * 3.4)!important}
.frame .f-inner[data-shot="l1"] .f-maincol,.frame .f-inner[data-shot="l3"] .f-maincol{padding-top:calc(var(--pad) * 3.6)!important}
.frame .f-inner[data-shot="l2"] .f-maincol{padding-top:calc(var(--pad) * 3.6)!important;text-align:right}
/* 右对齐帧：标签用「独立块 + margin-left:auto」靠右，不用 float。
   float 会让标签与紧随其后的 block 标题落在同一行带里互相压住。 */
.frame .f-inner[data-shot="l2"] .shot-label,.frame .f-inner[data-shot="l2"] .peakbar{
  display:block!important;margin-left:auto;margin-right:0}
.frame .f-inner[data-shot="end"] .f-maincol{padding-top:calc(var(--pad) * 2.0)!important}
.frame .f-inner[data-shot="hook"] .hook-title{color:var(--fg);
  text-shadow:calc(5px * var(--scale,1)) calc(5px * var(--scale,1)) 0 var(--a1)}
.frame .f-inner[data-shot="flip"]::before{background:var(--a2);
  clip-path:polygon(0 46%,100% 22%,100% 100%,0 100%);opacity:.14}
.frame .f-inner[data-shot="flip"] .big-title{color:var(--a1);
  -webkit-text-stroke:calc(2px * var(--scale,1)) var(--a1)}
.frame .f-inner[data-shot="l1"]::before{background:var(--a1);
  clip-path:polygon(0 0,38% 0,22% 100%,0 100%);opacity:.13}
.frame .f-inner[data-shot="l2"]::before{background:var(--a2);
  clip-path:polygon(100% 0,100% 100%,62% 100%,80% 0);opacity:.15}
.frame .f-inner[data-shot="l2"] .flower{right:auto;left:-2%;top:auto;bottom:22%;transform:rotate(7deg)}
.frame .f-inner[data-shot="l3"]::before{background:var(--a1);
  clip-path:polygon(0 0,100% 0,100% 100%,0 76%);opacity:.2}
.frame .f-inner[data-shot="l3"] .point-title{color:var(--fg);
  text-shadow:calc(6px * var(--scale,1)) calc(6px * var(--scale,1)) 0 var(--a1)}
.frame .f-inner[data-shot="l3"] .flower{opacity:.3;top:8%}
.frame .f-inner[data-shot="end"]::before{background:var(--a1);
  clip-path:polygon(0 0,100% 0,100% 62%,0 88%);opacity:.12}
.frame .f-inner[data-shot="end"] .verdict-title{color:var(--a1)}
/* 封面保持克制，不叠斜切 */
.frame .f-inner[data-shot="cover"]::before{display:none}
/* 16:9 高度收紧 */
.frame[data-ratio="16:9"] .f-inner .f-maincol{padding-top:calc(var(--pad) * 1.6)!important;
  padding-bottom:calc(var(--pad) * 2.2)!important}
.frame[data-ratio="16:9"] .flower.hero-num{font-size:calc(var(--fs-hero) * var(--scale,1) * .4)}
.frame[data-ratio="16:9"] .qmark{font-size:calc(var(--fs-hero) * var(--scale,1) * .8)}
.frame[data-ratio="16:9"] .f-inner[data-shot="hook"] .f-maincol{padding-bottom:calc(var(--pad) * 1.7)}
.frame[data-ratio="16:9"] .sticker{font-size:calc(var(--fs-cap) * var(--scale,1) * .76)}

/* ══════════════════════════════════════════════════════════════
   V6 · 剪映式综艺花字模板（当前版本，覆盖 V5 斜切海报层）
   参考：剪映专业版「文本 → 花字」模板库 / 综艺花字素材 / 抖音爆款封面。
   视觉语言 = 爆炸星形底衬 + 超粗白字 + 深色描边 + 彩色厚阴影
              + 星星/速度线/云朵感装饰 + 高饱和撞色 + 白边气泡贴纸
              + 下三分之一白字黑描边口播字幕 + 顶部时间码与进度条。
   ══════════════════════════════════════════════════════════════ */
/* 4 套模板，只换配色与花字形状，不动字号体系与内容 */
.frame[data-tpl="pop"]{--bg1:#2b1b5e;--bg2:#12102a;--bg3:#080714;
  --b1:#ffe14d;--b2:#ff8a3d;--b3:#ff3d81;--sh:#ff2e88;--bub:#3b82f6;
  --bar:#ffe14d;--star:#ffe14d;--ink:#171034;--edge:#7ef9ff}
.frame[data-tpl="neon"]{--bg1:#102b4e;--bg2:#0c1330;--bg3:#050815;
  --b1:#7ef9ff;--b2:#3b82f6;--b3:#a855f7;--sh:#00e5ff;--bub:#a855f7;
  --bar:#7ef9ff;--star:#7ef9ff;--ink:#0a1030;--edge:#ff6ec7}
.frame[data-tpl="hot"]{--bg1:#4a1024;--bg2:#1e0a18;--bg3:#0a0509;
  --b1:#ffe14d;--b2:#ff6b35;--b3:#e11d48;--sh:#ff3d3d;--bub:#e11d48;
  --bar:#ff6b35;--star:#ffe14d;--ink:#2a0710;--edge:#ffd166}
.frame[data-tpl="lime"]{--bg1:#123c34;--bg2:#0a2422;--bg3:#04100f;
  --b1:#d9f99d;--b2:#4ade80;--b3:#0ea5e9;--sh:#22c55e;--bub:#0ea5e9;
  --bar:#a3e635;--star:#d9f99d;--ink:#06251f;--edge:#fef08a}
.frame[data-tpl="clinic"]{--bg1:#123a5e;--bg2:#0a243c;--bg3:#05121f;
  --b1:#7dd3fc;--b2:#38bdf8;--b3:#fb923c;--sh:#0ea5e9;--bub:#fb923c;
  --bar:#7dd3fc;--star:#7dd3fc;--ink:#062033;--edge:#ffffff}
.frame[data-tpl="tomato"]{--bg1:#4a1a14;--bg2:#2a0f0c;--bg3:#120706;
  --b1:#ffd7a8;--b2:#ff8a5c;--b3:#e04b2f;--sh:#ff5722;--bub:#ffb703;
  --bar:#ffd7a8;--star:#ffd7a8;--ink:#2a0c08;--edge:#ffe8b0}
.frame[data-tpl="clay"]{--bg1:#4a2a16;--bg2:#2a180d;--bg3:#120a05;
  --b1:#ffd166;--b2:#e8873a;--b3:#c05a2a;--sh:#ff8c42;--bub:#ffe08a;
  --bar:#ffd166;--star:#ffd166;--ink:#2a1408;--edge:#fff0c0}
.frame[data-tpl="grape"]{--bg1:#2e2540;--bg2:#1a1628;--bg3:#0c0a14;
  --b1:#e9d5ff;--b2:#a78bfa;--b3:#7c3aed;--sh:#8b5cf6;--bub:#c4b5fd;
  --bar:#e9d5ff;--star:#e9d5ff;--ink:#1a1230;--edge:#f5f0ff}
.frame[data-tpl="winter"]{--bg1:#1e3550;--bg2:#122338;--bg3:#08131f;
  --b1:#e0f2fe;--b2:#7dd3fc;--b3:#38bdf8;--sh:#38bdf8;--bub:#bae6fd;
  --bar:#e0f2fe;--star:#e0f2fe;--ink:#0a2036;--edge:#ffffff}
.frame[data-tpl="forest"]{--bg1:#183a2c;--bg2:#0d241b;--bg3:#05120d;
  --b1:#d9f0c8;--b2:#86c98a;--b3:#3f8f63;--sh:#4ade80;--bub:#fde68a;
  --bar:#d9f0c8;--star:#d9f0c8;--ink:#082216;--edge:#fff6d8}
.frame[data-tpl="goldblue"]{--bg1:#122a4a;--bg2:#0a1a30;--bg3:#050d1a;
  --b1:#ffd76a;--b2:#e0a83c;--b3:#3b82f6;--sh:#d99a2b;--bub:#60a5fa;
  --bar:#ffd76a;--star:#ffd76a;--ink:#07162c;--edge:#fff0b8}
.frame[data-tpl="paperink"]{--bg1:#3a1a1a;--bg2:#241010;--bg3:#120808;
  --b1:#f5e6c8;--b2:#d9534f;--b3:#a52a2a;--sh:#c9302c;--bub:#f5e6c8;
  --bar:#f5e6c8;--star:#f5e6c8;--ink:#2a0c0c;--edge:#ffefd0}
/* 背景：渐变 + 网点 + 暗角 + 顶部光晕。不用纯色，纯色最像 PPT。 */
.frame .f-bg{background:
  radial-gradient(110% 70% at 22% 8%,color-mix(in srgb,var(--b3) 30%,transparent),transparent 62%),
  radial-gradient(90% 60% at 88% 92%,color-mix(in srgb,var(--b2) 18%,transparent),transparent 66%),
  linear-gradient(150deg,var(--bg1) 0%,var(--bg2) 58%,var(--bg3) 100%)!important}
.frame .f-inner::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;
  background-image:radial-gradient(rgba(255,255,255,.16) 1.6px,transparent 1.6px);
  background-size:calc(15px * var(--scale,1)) calc(15px * var(--scale,1));
  opacity:.42}
.frame .f-inner::before{display:none!important}
.frame .f-grid{display:none!important}
/* V5 遗留部件全部收掉 */
.frame .f-foot,.frame .f-dots,.frame .hero-zone,.frame .body-zone,
.frame .f-side,.frame .progline,.frame .point-prog,.frame .claim-tags,
.frame .twist-ring,.frame .flower.hero-num,.frame .ring,.frame .swoosh,
.frame .qmark,.frame .sticker,.frame .peakbar,.frame .shot-label{display:none!important}
/* 顶部：时间码 + 总时长 + 进度条 */
.frame .f-head{position:absolute;left:7%;right:7%;top:3%;z-index:5;
  display:flex;align-items:baseline;justify-content:space-between;padding:0}
.frame .kicker{font-size:calc(var(--fs-cap) * var(--scale,1));color:var(--bar);
  font-weight:900;letter-spacing:2px;opacity:1;text-shadow:2px 2px 0 var(--ink)}
.frame .brandmini{font-size:calc(var(--fs-cap) * var(--scale,1) * .72);
  color:rgba(255,255,255,.72);letter-spacing:1px;margin-left:auto;opacity:1}
.frame .vbar{position:absolute;left:0;right:0;top:calc(var(--fs-cap) * var(--scale,1) * 1.9);
  height:calc(7px * var(--scale,1));background:rgba(255,255,255,.24);border-radius:9px}
.frame .vbar i{display:block;height:100%;background:var(--bar);border-radius:9px;
  box-shadow:0 0 calc(14px * var(--scale,1)) var(--bar)}
/* 综艺花字贴纸：爆炸形 + 厚描边立体字 + 星星速度线 */
.frame .fx-deco{position:absolute;left:50%;top:29%;z-index:2;
  width:88%;height:34%;transform:translate(-50%,-50%) rotate(-7deg) scale(var(--fw,1))}
.frame .fx-burst{position:absolute;inset:0;
  background:linear-gradient(150deg,var(--b1),var(--b2) 55%,var(--b3));
  clip-path:polygon(50% 0%,58% 12%,70% 4%,74% 19%,89% 12%,88% 28%,100% 32%,90% 44%,
    100% 56%,88% 63%,95% 78%,80% 78%,76% 93%,62% 86%,50% 100%,39% 87%,25% 95%,
    22% 79%,7% 81%,13% 65%,0% 58%,10% 46%,0% 33%,13% 29%,11% 13%,26% 19%,31% 4%,43% 13%);
  filter:drop-shadow(calc(10px * var(--scale,1)) calc(12px * var(--scale,1)) 0 var(--ink))}
.frame .fx-flower{position:absolute;left:50%;top:51%;transform:translate(-50%,-50%) rotate(4deg);
  font-size:calc(var(--fs-title) * var(--scale,1) * 2.35);font-weight:900;
  letter-spacing:-.04em;line-height:1;white-space:nowrap;color:#fff;
  -webkit-text-stroke:calc(11px * var(--scale,1)) var(--ink);paint-order:stroke fill;
  text-shadow:calc(5px * var(--scale,1)) calc(6px * var(--scale,1)) 0 var(--sh),
    calc(11px * var(--scale,1)) calc(12px * var(--scale,1)) 0 var(--ink)}
.frame .fx-star{position:absolute;font-size:calc(var(--fs-title) * var(--scale,1) * .52);
  color:var(--star);text-shadow:calc(3px * var(--scale,1)) calc(3px * var(--scale,1)) 0 var(--ink);line-height:1}
.frame .fx-star.a{left:-3%;top:2%;transform:rotate(-18deg)}
.frame .fx-star.b{right:-2%;top:0%;transform:rotate(20deg)}
.frame .fx-star.c{right:-4%;bottom:2%;transform:rotate(-12deg);font-size:calc(var(--fs-title) * var(--scale,1) * .38)}
.frame .fx-star.d{left:1%;bottom:-4%;transform:rotate(14deg);font-size:calc(var(--fs-title) * var(--scale,1) * .34)}
.frame .fx-line{position:absolute;right:-8%;top:2%;width:26%;height:calc(9px * var(--scale,1));
  background:var(--sh);transform:rotate(-32deg);border-radius:2px}
.frame .fx-line.b{right:-6%;top:9%;width:20%;height:calc(6px * var(--scale,1));background:var(--edge)}
.frame .fx-en{position:absolute;left:50%;bottom:9%;transform:translateX(-50%) rotate(-2deg);
  font-size:calc(var(--fs-cap) * var(--scale,1) * .72);font-weight:900;letter-spacing:3px;
  color:var(--ink);background:var(--bar);padding:calc(4px * var(--scale,1)) calc(16px * var(--scale,1));
  border-radius:99px;white-space:nowrap;z-index:3}
.frame .fx-bolt{position:absolute;left:-5%;bottom:4%;font-size:calc(var(--fs-title) * var(--scale,1) * .6);
  color:var(--bar);transform:rotate(-16deg);text-shadow:calc(3px * var(--scale,1)) calc(3px * var(--scale,1)) 0 var(--ink)}
/* 综艺弹幕气泡：白粗边 + 高饱和底 + 小英文，只做点缀不压正文 */
.frame .bubble{position:absolute;right:6%;top:46%;z-index:4;
  max-width:46%;background:var(--bub);color:#fff;
  font-size:calc(var(--fs-body) * var(--scale,1) * .68);font-weight:900;line-height:1.35;
  padding:calc(13px * var(--scale,1)) calc(20px * var(--scale,1));
  border:calc(4px * var(--scale,1)) solid #fff;border-radius:24px 24px 24px 7px;
  box-shadow:calc(7px * var(--scale,1)) calc(7px * var(--scale,1)) 0 var(--ink);
  transform:rotate(5deg)}
.frame .bubble small{display:block;font-size:calc(var(--fs-micro) * var(--scale,1));
  letter-spacing:2px;opacity:.78;font-weight:700;margin-top:3px}
/* 下半屏主标题区：确定布局，字号全片唯一 */
/* 特异性必须高于 V5 的 .frame .f-inner[data-shot="x"] .f-maincol（0,4,1）。
   之前写 inset:auto!important 把 top/bottom 全清成 auto，内容回到顶部压住花字。 */
.frame .f-main{position:absolute!important;inset:0;display:block!important;z-index:3;padding:0!important}
.frame .f-inner[data-shot] .f-maincol{position:absolute!important;
  width:auto!important;
  top:53%!important;left:7%!important;right:7%!important;bottom:15%!important;
  display:block!important;height:auto!important;grid-template-rows:none!important;
  padding:0!important;margin:0!important;text-align:left!important;box-sizing:border-box;
  justify-content:flex-start!important;align-items:stretch!important}
.frame .f-maincol > *{max-width:100%;box-sizing:border-box}
.frame .f-inner[data-shot] .big-title,.frame .f-inner[data-shot] .cover-title{
  font-size:calc(var(--fs-title) * var(--scale,1))!important;
  line-height:1.28!important;font-weight:900!important;letter-spacing:-.02em!important;
  color:#fff!important;margin:0!important;border:0!important;padding:0!important;
  -webkit-text-stroke:0!important;paint-order:normal!important;
  text-shadow:calc(4px * var(--scale,1)) calc(4px * var(--scale,1)) 0 var(--ink),
    0 0 calc(20px * var(--scale,1)) rgba(0,0,0,.7)!important;
  text-wrap:pretty;word-break:normal;overflow-wrap:anywhere;width:100%}
.frame .chip{display:inline-block!important;width:max-content!important;max-width:100%;
  background:#fff;color:var(--ink);font-size:calc(var(--fs-cap) * var(--scale,1));
  font-weight:900;letter-spacing:1px;
  padding:calc(7px * var(--scale,1)) calc(18px * var(--scale,1));
  border-radius:999px;transform:rotate(-4deg);
  box-shadow:calc(6px * var(--scale,1)) calc(6px * var(--scale,1)) 0 var(--sh);
  margin-bottom:calc(var(--gap) * .8)}
.frame .hook-sub,.frame .flip-l,.frame .heat-badge,.frame .takeaway,
.frame .verdict-src,.frame .disclaim,.frame .cover-brand,.frame .cover-meta,
.frame .cover-disclaim{font-size:calc(var(--fs-body) * var(--scale,1) * .82)!important;
  color:rgba(255,255,255,.9)!important;border:0!important;padding:0!important;
  margin-top:calc(var(--gap) * .5)!important;line-height:1.5;
  text-shadow:2px 2px 0 var(--ink)}
.frame .flip-l b{color:var(--bar);font-size:calc(var(--fs-cap) * var(--scale,1));
  letter-spacing:3px;display:block;margin-bottom:4px;opacity:1}
.frame .strike{position:relative;display:inline-block;font-weight:800;opacity:.72}
.frame .strike::after{content:"";position:absolute;left:-3%;right:-3%;top:54%;
  height:calc(6px * var(--scale,1));background:var(--sh);transform:rotate(-2deg)}
.frame .heat-badge{color:var(--bar)!important;font-weight:900}
.frame .takeaway{background:rgba(255,255,255,.14)!important;
  border-radius:calc(10px * var(--scale,1))!important;
  padding:calc(12px * var(--scale,1)) calc(20px * var(--scale,1))!important;
  border:calc(3px * var(--scale,1)) solid rgba(255,255,255,.55)!important;
  border-left:calc(9px * var(--scale,1)) solid var(--bar)!important;
  margin-top:calc(var(--gap) * .75)!important}
.frame .takeaway b{display:block;font-size:calc(var(--fs-micro) * var(--scale,1));
  letter-spacing:2px;color:var(--bar);margin-bottom:3px}
.frame .takeaway > span{display:block;
  font-size:calc(var(--fs-title) * var(--scale,1) * .82)!important;
  font-weight:900;color:#fff;line-height:1.2;letter-spacing:.02em;
  text-shadow:calc(3px * var(--scale,1)) calc(3px * var(--scale,1)) 0 var(--ink)}
.frame[data-ratio="16:9"] .takeaway > span{font-size:calc(var(--fs-title) * var(--scale,1) * .66)!important}
.frame .verdict-src,.frame .disclaim,.frame .cover-disclaim{
  font-size:calc(var(--fs-micro) * var(--scale,1))!important;color:rgba(255,255,255,.62)!important;
  margin-top:calc(var(--gap) * .3)!important;display:block;clear:both;line-height:1.4!important}
.frame .cover-brand{display:flex!important;gap:16px;align-items:baseline;
  font-weight:900;letter-spacing:2px;color:var(--bar)!important}
.frame .cover-issue{font-size:calc(var(--fs-micro) * var(--scale,1));opacity:.7}
.frame .cover-meta{display:flex;gap:10px;flex-wrap:wrap}
.frame .cover-chip{background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.35);
  border-radius:999px;padding:5px 14px;font-size:calc(var(--fs-micro) * var(--scale,1))}
/* 口播字幕：剪映标准白字 + 黑描边 + 半透明底，放画面下三分之一 */
.frame .subbar{position:absolute!important;left:6%!important;right:6%!important;
  bottom:4%!important;z-index:5;margin:0!important;text-align:center;
  background:rgba(0,0,0,.62)!important;border:0!important;
  border-radius:calc(12px * var(--scale,1))!important;
  padding:calc(11px * var(--scale,1)) calc(20px * var(--scale,1))!important;
  font-size:calc(var(--fs-title) * var(--scale,1) * .68)!important;font-weight:900!important;
  color:#fff!important;line-height:1.35;letter-spacing:.01em;
  -webkit-text-stroke:1px #000;paint-order:stroke fill;
  text-shadow:2px 2px 0 #000,0 0 8px rgba(0,0,0,.9)}
.frame .subwrap{display:inline}
/* V4 遗留的字幕条前导圆点：V6 是纯居中描边字幕，不该带列表项目符号 */
.frame .subbar::before{display:none!important}
/* 钩子帧短眉标：题干之下、热度之上，只做「这说法流传多广」的注解，不抢主位 */
.frame .f-inner[data-shot="hook"] .hook-kicker{
  display:block;font-size:calc(var(--fs-body) * var(--scale,1) * .95)!important;
  font-weight:800;color:var(--bar)!important;line-height:1.4;
  margin-top:calc(var(--gap) * .55)!important;margin-bottom:0!important;
  padding:0!important;border:0!important;background:none!important;
  text-shadow:2px 2px 0 var(--ink)!important}
.frame .f-inner[data-shot="hook"] .heat-badge{margin-top:calc(var(--gap) * .3)!important}
/* 16:9 钩子帧：题干要铺得开，文字栏从 42% 加宽到 54%，花字右移收窄 */
.frame[data-ratio="16:9"] .f-inner[data-shot="hook"] .f-maincol{
  right:46%!important;top:20%!important;bottom:25%!important}
.frame[data-ratio="16:9"] .f-inner[data-shot="hook"] .fx-deco{
  left:76%!important;top:47%!important;width:40%!important;height:58%!important}
/* 花字保持同画幅统一字号（1.9×），只挪位置与容器宽度，不改字号 */
.frame[data-ratio="16:9"] .f-inner[data-shot="hook"] .fx-flower{
  font-size:calc(var(--fs-title) * var(--scale,1) * 1.9)!important}
.frame[data-ratio="16:9"] .f-inner[data-shot="hook"] .hook-kicker{
  font-size:calc(var(--fs-body) * var(--scale,1) * .8)!important}
.frame[data-ratio="16:9"] .f-inner[data-shot="hook"] .bubble{
  right:4%!important;top:9%!important;max-width:26%}
/* 字幕放大后，竖版收尾帧的信息层要上移，避免免责压到字幕条 */
.frame[data-ratio="9:16"] .f-inner[data-shot="end"] .f-maincol{top:52%!important}
.frame[data-ratio="9:16"] .f-inner[data-shot="end"] .bubble{top:40%!important}
/* 钩子帧选项：题干之下铺开，不剧透答案。判断题两项做双按钮，单选/多选两列。
   用 --fs-body 档，比主标题小、比注释大，仍属统一字阶体系。 */
.frame .opts{display:grid;grid-template-columns:1fr 1fr;
  gap:calc(var(--gap) * .34);margin-top:calc(var(--gap) * .62);width:100%}
.frame .opts.two{grid-template-columns:1fr 1fr}
.frame .opt{display:flex;align-items:center;gap:calc(var(--gap) * .34);
  min-width:0;box-sizing:border-box;
  background:rgba(255,255,255,.11);border:calc(3px * var(--scale,1)) solid rgba(255,255,255,.34);
  border-radius:calc(14px * var(--scale,1));
  padding:calc(var(--gap) * .30) calc(var(--gap) * .36);
  font-size:calc(var(--fs-body) * var(--scale,1) * .82);
  font-weight:800;color:#fff;line-height:1.34;text-align:left;
  text-shadow:2px 2px 0 var(--ink)}
.frame .opt b{flex:none;width:calc(var(--fs-body) * var(--scale,1) * .92);
  height:calc(var(--fs-body) * var(--scale,1) * .92);
  display:flex;align-items:center;justify-content:center;border-radius:50%;
  background:var(--bar);color:var(--ink);font-weight:900;
  font-size:calc(var(--fs-body) * var(--scale,1) * .66);text-shadow:none}
.frame .opt span{min-width:0;word-break:normal}
/* 有选项的钩子帧：主内容区上移、下延，给选项腾出整块空间 */
.frame .f-inner[data-shot="hook"][data-opts="1"] .f-maincol{
  top:46%!important;bottom:11%!important}
.frame .f-inner[data-shot="hook"][data-opts="1"] .bubble{
  top:37%!important;max-width:40%}
/* 横版顶部还有时间码 / 有声标签，气泡不能上移到 7% 去压它 */
.frame[data-ratio="16:9"] .f-inner[data-shot="hook"][data-opts="1"] .bubble{
  top:9%!important;right:4%!important;max-width:26%}
.frame[data-ratio="16:9"] .f-inner[data-shot="hook"][data-opts="1"] .f-maincol{
  right:44%!important;top:17%!important;bottom:20%!important}
.frame[data-ratio="16:9"] .opt{font-size:calc(var(--fs-body) * var(--scale,1) * .72)!important;
  padding:calc(var(--gap) * .2) calc(var(--gap) * .26)!important}
.frame[data-ratio="16:9"] .opts{gap:calc(var(--gap) * .22);margin-top:calc(var(--gap) * .4)}
/* 热度徽标：深底上必须够亮，避免残留成一行看不清的暗字 */
.frame .heat-badge{opacity:1!important;color:var(--bar)!important;
  text-shadow:2px 2px 0 var(--ink),0 0 12px rgba(0,0,0,.85)!important}
/* 每帧花字位置微调，制造镜头切换感（不改字号） */
.frame .f-inner[data-shot="flip"] .fx-deco{transform:translate(-50%,-50%) rotate(8deg) scale(var(--fw,1))}
.frame .f-inner[data-shot="l2"] .fx-deco{left:54%;transform:translate(-50%,-50%) rotate(-11deg) scale(var(--fw,1))}
.frame .f-inner[data-shot="l3"] .fx-deco{transform:translate(-50%,-50%) rotate(5deg) scale(var(--fw,1))}
.frame .f-inner[data-shot="end"] .fx-deco{top:27%;transform:translate(-50%,-50%) rotate(-4deg) scale(var(--fw,1))}
.frame .f-inner[data-shot="cover"] .fx-deco{top:24%;transform:translate(-50%,-50%) rotate(-6deg) scale(var(--fw,1))}
.frame .f-inner[data-shot="cover"] .bubble{display:none}
/* 16:9：左文右花字两栏 */
.frame[data-ratio="16:9"] .fx-deco{left:73%!important;top:50%!important;
  width:46%!important;height:64%!important}
.frame[data-ratio="16:9"] .f-inner[data-shot] .f-maincol{width:auto!important;
  left:6%!important;right:52%!important;top:21%!important;bottom:24%!important}
.frame[data-ratio="16:9"] .bubble{right:4%!important;top:12%!important;max-width:26%}
.frame[data-ratio="16:9"] .fx-flower{font-size:calc(var(--fs-title) * var(--scale,1) * 1.9)}
.frame[data-ratio="16:9"] .fx-line{display:none}
.frame[data-ratio="16:9"] .f-inner[data-shot="end"] .takeaway{
  margin-top:calc(var(--gap) * .4)!important;padding:calc(8px * var(--scale,1)) calc(14px * var(--scale,1))!important}
.frame[data-ratio="16:9"] .f-inner[data-shot="end"] .verdict-src,
.frame[data-ratio="16:9"] .f-inner[data-shot="end"] .disclaim{
  margin-top:calc(var(--gap) * .2)!important;line-height:1.35!important}


/* ── 平台安全区辅助线：仅预览，导出 clone 时移除 ── */
.safe-guide{position:absolute;inset:9% 7% 14%;pointer-events:none;z-index:4;display:none;
  opacity:.55;background-repeat:no-repeat;
  background-image:linear-gradient(var(--a2),var(--a2)),linear-gradient(var(--a2),var(--a2)),
    linear-gradient(var(--a2),var(--a2)),linear-gradient(var(--a2),var(--a2)),
    linear-gradient(var(--a2),var(--a2)),linear-gradient(var(--a2),var(--a2)),
    linear-gradient(var(--a2),var(--a2)),linear-gradient(var(--a2),var(--a2));
  background-size:40px 2px,2px 40px,40px 2px,2px 40px,40px 2px,2px 40px,40px 2px,2px 40px;
  background-position:left top,left top,right top,right top,left bottom,left bottom,right bottom,right bottom}
.frame[data-guide="1"] .safe-guide{display:block}

/* ══ 内容形态 v7.2：改构图 / 花字形状 / 进度条 / 首帧结构条 ══
   12 套模板只管配色，9 种形态管「这张卡长什么样」。
   全部作用于装饰层，不进入文字流，不改字号体系。 */
.fmt-row{flex:none;display:flex;align-items:center;gap:calc(var(--gap) * .42);
  margin-top:calc(var(--gap) * .5);min-height:calc(var(--fs-cap) * var(--scale,1) * 1.4);
  font-size:calc(var(--fs-cap) * var(--scale,1) * .82);font-weight:700;
  letter-spacing:.02em;color:var(--dim);line-height:1.25;flex-wrap:nowrap}
.fmt-row span,.fmt-row b,.fmt-row i{font-style:normal;white-space:nowrap}
.fmt-row b{display:inline-flex;align-items:center;justify-content:center;
  min-width:calc(var(--fs-cap) * var(--scale,1) * 1.5);
  padding:0 calc(var(--gap) * .25);border-radius:calc(var(--gap) * .2);
  background:var(--a1);color:var(--bg);font-size:calc(var(--fs-cap) * var(--scale,1) * .72)}
.fmt-row i{color:var(--a1);font-weight:900}
.fmt-row[data-kind="list"] b{background:var(--a1)}
.fmt-row[data-kind="list"] b:nth-child(2){background:var(--a2)}
.fmt-row[data-kind="list"] b:nth-child(3){opacity:.62}
.fmt-row[data-kind="compare"] span{padding:calc(var(--gap)*.18) calc(var(--gap)*.4);
  border:2px solid var(--line);border-radius:999px}
.fmt-row[data-kind="compare"] i{font-size:calc(var(--fs-cap)*var(--scale,1)*1.15)}
.fmt-row[data-kind="number"] b{background:var(--a2);font-size:calc(var(--fs-cap)*var(--scale,1)*.9)}
.fmt-row[data-kind="story"]{position:relative}
.fmt-row[data-kind="story"] i{width:calc(var(--fs-cap)*var(--scale,1)*.42);
  height:calc(var(--fs-cap)*var(--scale,1)*.42);border-radius:50%;background:var(--a1);opacity:.85}
.fmt-row[data-kind="story"] i:nth-child(2){opacity:.55}
.fmt-row[data-kind="story"] i:nth-child(3){opacity:.3}
.fmt-row[data-kind="debate"] span{padding:calc(var(--gap)*.18) calc(var(--gap)*.42);
  border-radius:999px;background:var(--a1);color:var(--bg)}
.fmt-row[data-kind="debate"] span:last-child{background:var(--a2)}
.fmt-row[data-kind="claim"] .stamp{display:inline-flex;width:calc(var(--fs-cap)*var(--scale,1)*1.35);
  height:calc(var(--fs-cap)*var(--scale,1)*1.35);align-items:center;justify-content:center;
  border:3px solid var(--a1);border-radius:50%;font-size:calc(var(--fs-cap)*var(--scale,1)*.7)}
.fmt-row[data-kind="warn"]{color:var(--a1)}
.fmt-row[data-kind="warn"] span{padding-left:calc(var(--gap)*.45);
  border-left:calc(var(--fs-cap)*var(--scale,1)*.22) solid var(--a1)}
.fmt-row[data-kind="myth"] span{color:var(--a2)}

/* 花字爆炸形：9 种轮廓 */
.frame[data-format="claim"]   .fx-burst{border-radius:14% 42% 18% 40%}
.frame[data-format="list"]    .fx-burst{border-radius:50% 50% 12% 50%}
.frame[data-format="compare"] .fx-burst{border-radius:6% 50% 6% 50%}
.frame[data-format="number"]  .fx-burst{border-radius:8%}
.frame[data-format="story"]   .fx-burst{border-radius:50% 12% 50% 12%}
.frame[data-format="debate"]  .fx-burst{border-radius:44% 12% 44% 12%}
.frame[data-format="myth"]    .fx-burst{border-radius:50%}
.frame[data-format="warn"]    .fx-burst{border-radius:3% 3% 42% 42%}
/* 背景渐变角度 / chip 形状 / 进度条高度也随形态变 */
.frame[data-format="number"]  .f-bg{filter:hue-rotate(-8deg) saturate(1.08)}
.frame[data-format="story"]   .f-bg{filter:saturate(.86)}
.frame[data-format="warn"]    .f-bg{filter:saturate(1.12)}
.frame[data-format="claim"]   .chip,
.frame[data-format="warn"]    .chip{border-radius:0;
  border-left:calc(var(--fs-cap)*var(--scale,1)*.18) solid var(--a1)}
.frame[data-format="list"]    .chip,
.frame[data-format="number"]  .chip{border-radius:999px}
.frame[data-format="debate"]  .chip{transform:skewX(-8deg)}
.frame[data-format="list"]    .vbar i,
.frame[data-format="number"]  .vbar i{height:calc(var(--fs-micro)*var(--scale,1)*.5)}
.frame[data-format="story"]   .vbar i{background:var(--a2)}
.frame[data-format="compare"] .vbar i{background:linear-gradient(90deg,var(--a1),var(--a2))}

/* ══ v8.3 面向大众：解释条 + 名词白话卡 ══
   不改骨架、不改字号体系，只把「玩梗贴纸」换成可读的信息卡：
   高对比浅底深字、去旋转去描边、允许两行、字号守住可读下限。 */
.frame[data-aud="general"] .f-inner[data-shot="hook"] .hook-kicker{
  display:block!important;color:#10212c!important;
  background:rgba(255,255,255,.94)!important;
  border-left:calc(7px * var(--scale,1)) solid var(--a1)!important;
  border-radius:10px!important;
  padding:calc(10px * var(--scale,1)) calc(15px * var(--scale,1))!important;
  font-size:calc(var(--fs-body) * var(--scale,1) * .76)!important;
  font-weight:750!important;line-height:1.45!important;
  text-shadow:none!important;letter-spacing:0!important;
  margin-top:calc(var(--gap) * .5)!important}
.frame[data-aud="general"] .f-inner[data-shot="hook"] .hook-kicker::before{
  content:"题意 · ";font-weight:900;color:var(--a1)}
.frame[data-ratio="16:9"][data-aud="general"] .f-inner[data-shot="hook"] .hook-kicker{
  font-size:calc(var(--fs-body) * var(--scale,1) * .68)!important}
.frame[data-aud="general"] .bubble.gen-note{
  background:rgba(255,255,255,.95)!important;color:#10212c!important;
  border:calc(3px * var(--scale,1)) solid var(--a1)!important;
  box-shadow:calc(4px * var(--scale,1)) calc(4px * var(--scale,1)) 0 rgba(13,27,38,.38)!important;
  transform:none!important;border-radius:14px!important;
  max-width:62%!important;line-height:1.4!important;
  font-size:calc(var(--fs-body) * var(--scale,1) * .60)!important;
  font-weight:800!important;letter-spacing:0!important}
.frame[data-aud="general"] .bubble.gen-note small{
  color:var(--a1)!important;opacity:1!important;letter-spacing:1px!important;font-weight:900!important}
.frame[data-ratio="16:9"][data-aud="general"] .f-inner[data-shot="hook"] .bubble.gen-note{
  max-width:34%!important;top:8%!important;right:4%!important}
.frame[data-aud="general"] .ly-msg,.frame[data-aud="general"] .ly-chat-bub{
  font-weight:750!important;letter-spacing:0!important}
/* 面向全年龄：去掉中英双层小标与「热搜/播放量」徽标，既是设计立场，
   也根除气泡变宽后与 fx-en 相交、解释条变高后热度压字幕条两处坏帧。 */
.frame[data-aud="general"] .fx-en,.frame[data-aud="general"] .heat-badge{
  display:none!important}


/* ════════════════════════════════════════════════════════════════════════
   v9.1 大众科普「杂志图解」版 · 六帧六套构图（流式撑满，非幻灯片）
   ────────────────────────────────────────────────────────────────────────
   v9 被判「跟 PPT 似的」：六帧共用报头 + 居中大标题 + 三行等宽方章要点
   + 页脚时间码/进度线。本版四件套全拆，且主体区 flex:1 撑满整幅，
   每帧用不同的分栏 / 对开 / 编号阶梯 / 版权栏组织信息。
   ════════════════════════════════════════════════════════════════════════ */
.frame .f-inner.gen-inner{
  display:flex!important;flex-direction:column!important;
  height:100%!important;position:relative!important;
  background:#f6f2e9!important;color:#16242c!important;
  padding:calc(84px * var(--scale,1)) calc(72px * var(--scale,1)) calc(168px * var(--scale,1))!important;
  box-sizing:border-box!important;overflow:hidden!important}
.frame .f-inner.gen-inner .f-bg{background:none}
/* 极淡图解底纹，每帧不同 */
.gen-inner::before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.5}
.gen-inner[data-shot="cover"]::before{
  background:repeating-linear-gradient(90deg,transparent 0,transparent calc(108px * var(--scale,1)),
    rgba(168,59,43,.055) calc(108px * var(--scale,1)),rgba(168,59,43,.055) calc(109px * var(--scale,1)))}
.gen-inner[data-shot="hook"]::before{
  background:radial-gradient(circle at 82% 78%,transparent 0,transparent calc(220px * var(--scale,1)),
    rgba(22,36,44,.05) calc(220px * var(--scale,1)),rgba(22,36,44,.05) calc(222px * var(--scale,1)),
    transparent calc(222px * var(--scale,1)),transparent calc(320px * var(--scale,1)),
    rgba(22,36,44,.05) calc(320px * var(--scale,1)),rgba(22,36,44,.05) calc(322px * var(--scale,1)))}
.gen-inner[data-shot="flip"]::before{
  background:repeating-linear-gradient(135deg,transparent 0,transparent calc(28px * var(--scale,1)),
    rgba(22,36,44,.035) calc(28px * var(--scale,1)),rgba(22,36,44,.035) calc(29px * var(--scale,1)))}
.gen-inner[data-shot="l1"]::before,.gen-inner[data-shot="l2"]::before,.gen-inner[data-shot="l3"]::before{
  background:radial-gradient(rgba(168,59,43,.10) calc(1.5px * var(--scale,1)),transparent calc(1.5px * var(--scale,1)))
    0 0/calc(34px * var(--scale,1)) calc(34px * var(--scale,1))}
.gen-inner[data-shot="end"]::before{
  background:repeating-linear-gradient(0deg,transparent 0,transparent calc(46px * var(--scale,1)),
    rgba(22,36,44,.04) calc(46px * var(--scale,1)),rgba(22,36,44,.04) calc(47px * var(--scale,1)))}
/* 左上角小栏目名 / 右上角页码：都不是进度条，也不与字幕条相交 */
.gen-corner{position:absolute;left:calc(72px * var(--scale,1));top:calc(30px * var(--scale,1));
  display:flex;align-items:baseline;gap:calc(16px * var(--scale,1));z-index:2}
.gen-col{font-size:calc(var(--fs-micro) * var(--scale,1) * 1.12);font-weight:900;
  letter-spacing:.22em;color:#a83b2b;white-space:nowrap}
.gen-corner>i{display:block;width:calc(40px * var(--scale,1));
  height:calc(3px * var(--scale,1));background:#a83b2b}
.gen-col2{font-size:calc(var(--fs-micro) * var(--scale,1) * .92);font-weight:700;
  color:#6b6456;letter-spacing:.04em;white-space:nowrap}
.gen-page{position:absolute;right:calc(72px * var(--scale,1));top:calc(30px * var(--scale,1));
  z-index:2;font-size:calc(var(--fs-micro) * var(--scale,1) * 1.02);
  font-weight:900;color:#6b6456;letter-spacing:.14em}
/* 主体区撑满剩余高度，各帧骨架在内部自己分栏 */
.gen-stage{flex:1;min-height:0;position:relative;display:flex;flex-direction:column}
/* 主标题：全片唯一字号 */
.frame .f-inner.gen-inner[data-shot] .big-title.gen-title{
  font-size:calc(var(--fs-title) * var(--scale,1))!important;
  color:#16242c!important;text-shadow:none!important;
  font-weight:900!important;line-height:1.22!important;letter-spacing:0!important;
  margin:0!important;-webkit-text-stroke:0!important;paint-order:normal!important;
  border:0!important;padding:0!important;width:100%!important}
.gen-rule{width:calc(118px * var(--scale,1));height:calc(9px * var(--scale,1));
  background:#a83b2b;margin:calc(26px * var(--scale,1)) 0 calc(30px * var(--scale,1))}
.gen-txt{font-size:calc(var(--fs-body) * var(--scale,1) * .88);
  font-weight:700;line-height:1.45;color:#23333c}
.gen-mini{font-size:calc(var(--fs-micro) * var(--scale,1) * 1.04);
  font-weight:900;letter-spacing:.12em;color:#a83b2b}
.gen-fine{font-size:calc(var(--fs-micro) * var(--scale,1) * .98);
  font-weight:600;line-height:1.45;color:#6b6456}
.gen-w{white-space:nowrap}   /* 数值 / 单位 / 英文整体不断行 */

/* ── 封面：竖排题头 + 跨栏大标题 + 副题 ── */
.gen-cover{flex:1;display:flex;gap:calc(46px * var(--scale,1));align-items:stretch;min-height:0}
.gn-fold{flex:none;width:calc(96px * var(--scale,1));
  border-right:calc(3px * var(--scale,1)) solid #16242c;
  display:flex;flex-direction:column;align-items:center;justify-content:space-between;
  padding:calc(14px * var(--scale,1)) 0}
.gn-fold>b{writing-mode:vertical-rl;font-size:calc(var(--fs-body) * var(--scale,1) * .78);
  font-weight:900;letter-spacing:.32em;color:#a83b2b}
.gn-fold>i{font-style:normal;font-size:calc(var(--fs-micro) * var(--scale,1) * 1.1);
  font-weight:900;color:#6b6456}
.gen-cover-main{flex:1;display:flex;flex-direction:column;justify-content:center;min-width:0}
.gen-cover-kicker{font-size:calc(var(--fs-micro) * var(--scale,1) * 1.1);
  font-weight:900;letter-spacing:.18em;color:#6b6456;margin-bottom:calc(30px * var(--scale,1))}
.gen-cover-sub{margin-top:calc(38px * var(--scale,1));
  border-top:calc(2px * var(--scale,1)) solid #c9bda6;
  padding-top:calc(24px * var(--scale,1))}
.gen-cover-meta{display:flex;gap:calc(24px * var(--scale,1));flex-wrap:wrap;
  margin-top:calc(30px * var(--scale,1))}
.gen-cover-no{position:absolute;right:calc(40px * var(--scale,1));bottom:calc(20px * var(--scale,1));
  font-size:calc(var(--fs-title) * var(--scale,1) * 2.2);font-weight:900;
  color:rgba(168,59,43,.10);line-height:1;pointer-events:none}

/* ── 题干帧：跨栏大标题 + 下部左右不对称（选项 | 侧边注撑满）── */
.gen-hook-top{flex:none;margin-bottom:calc(38px * var(--scale,1))}
.gen-hook-top::after{content:'';display:block;width:calc(118px * var(--scale,1));
  height:calc(9px * var(--scale,1));background:#a83b2b;
  margin-top:calc(28px * var(--scale,1))}
.gen-hook-top .gen-mini{display:block;margin-bottom:calc(22px * var(--scale,1))}
.gen-hook-cols{flex:1;min-height:0;display:grid;grid-template-columns:1.02fr .98fr;
  gap:calc(48px * var(--scale,1));align-items:stretch}
.gen-hook-left{display:flex;flex-direction:column;justify-content:space-between}
.gen-opts{display:flex;flex-direction:column;gap:calc(20px * var(--scale,1))}
.gen-opt{display:flex;align-items:baseline;gap:calc(20px * var(--scale,1));
  border:0!important;border-bottom:calc(2px * var(--scale,1)) solid #c9bda6!important;
  background:none!important;padding:calc(15px * var(--scale,1)) calc(4px * var(--scale,1))}
.gen-opt>b{font-size:calc(var(--fs-body) * var(--scale,1) * .92);font-weight:900;color:#a83b2b}
.gen-opt>span{font-size:calc(var(--fs-body) * var(--scale,1) * .88);font-weight:800;color:#16242c}
.gen-hook-mark{font-size:calc(var(--fs-title) * var(--scale,1) * 2.6);font-weight:900;
  color:rgba(168,59,43,.11);line-height:1;text-align:left}
/* 侧栏不是「三块方章要点」，是一段能读下去的短文：
   去掉底色块、朱红粗竖条、字段名方章与分隔线，只留一条极细的书页批注线。 */
/* 不画分栏竖线：靠留白分栏，竖线一加就成了表格 / 讲义 */
.gen-side{display:flex;flex-direction:column;justify-content:center;
  border:0!important;background:none!important;
  padding:calc(4px * var(--scale,1)) 0 calc(4px * var(--scale,1)) calc(34px * var(--scale,1))}
.gen-side p{margin:0;font-size:calc(var(--fs-body) * var(--scale,1) * .72);
  font-weight:700;line-height:1.72;color:#23333c;text-align:left}
.gen-side p+p{margin-top:calc(34px * var(--scale,1))}
.gen-side p.gen-prose-intro{font-size:calc(var(--fs-micro) * var(--scale,1) * 1.10)!important;
  font-weight:900;letter-spacing:.10em;color:#a83b2b;text-align:left;
  margin-bottom:calc(22px * var(--scale,1))}
.gen-side p.gen-prose-last{color:#16242c!important;font-weight:800!important}
.gen-src{margin-top:calc(26px * var(--scale,1));
  font-size:calc(var(--fs-micro) * var(--scale,1) * 1.0);font-weight:700;color:#6b6456}

/* ── 反转帧：上下「纠错」版式，大字跨整幅（窄栏折 4 行已弃用）── */
.gen-flip{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-evenly;
  gap:calc(18px * var(--scale,1))}
.gen-say{background:rgba(22,36,44,.055);
  border-left:calc(6px * var(--scale,1)) solid #6b6456;
  padding:calc(24px * var(--scale,1)) calc(30px * var(--scale,1));flex:none}
.gen-say-lead{display:block;font-size:calc(var(--fs-micro) * var(--scale,1) * 1.08);
  font-weight:900;letter-spacing:.14em;color:#6b6456;margin-bottom:calc(14px * var(--scale,1))}
.gen-say>span.gen-quote{font-size:calc(var(--fs-body) * var(--scale,1) * .76);
  font-weight:800;line-height:1.45;color:#6b6456;
  text-decoration:line-through;text-decoration-thickness:calc(3px * var(--scale,1))}
.gen-flipmid{display:flex;align-items:center;gap:calc(18px * var(--scale,1));flex:none}
.gen-flipmid>i{flex:1;height:calc(3px * var(--scale,1));background:#a83b2b}
.gen-flipmid>b{width:calc(58px * var(--scale,1));height:calc(58px * var(--scale,1));flex:none;
  border-radius:50%;background:#a83b2b;color:#f6f2e9;
  display:flex;align-items:center;justify-content:center;
  font-size:calc(var(--fs-body) * var(--scale,1) * .74);font-weight:900}
.gen-right{flex:none}
.gen-right .gen-mini{display:block;margin-bottom:calc(22px * var(--scale,1))}
/* 依据不再分两格、不再带字段名，写成一段能读的尾注 */
.gen-endnote{flex:none;border-top:calc(2px * var(--scale,1)) solid #c9bda6;
  padding-top:calc(20px * var(--scale,1));margin-top:calc(26px * var(--scale,1));
  font-size:calc(var(--fs-micro) * var(--scale,1) * 1.08);
  font-weight:700;line-height:1.55;color:#23333c;text-wrap:pretty}

/* ── 拆解三帧：流式布局（不绝对定位，长标题不会压图注），编号位置逐帧换 ── */
.gen-layer{flex:1;min-height:0;position:relative;display:flex;flex-direction:column;
  justify-content:space-between;gap:calc(22px * var(--scale,1))}
/* 编号水印放大后放进主句（约 30%）与图注（约 53%）之间的空白带，
   既填掉中段死白，也不压任何文字；三帧左 / 右 / 中位置不同。 */
.gen-stepnum{position:absolute;top:33%;font-size:calc(var(--fs-title) * var(--scale,1) * 2.4);
  font-weight:900;line-height:.85;color:rgba(168,59,43,.10);pointer-events:none;z-index:0}
.gen-layer[data-step="1"] .gen-stepnum{left:2%}
.gen-layer[data-step="2"] .gen-stepnum{right:2%}
.gen-layer[data-step="3"] .gen-stepnum{left:50%;transform:translateX(-50%)}
.gen-lead{position:relative;z-index:1}
.gen-layer[data-step="2"] .gen-lead{text-align:right}
.gen-layer[data-step="3"] .gen-lead{text-align:center}
.gen-cap{position:relative;z-index:1;border-top:calc(4px * var(--scale,1)) solid #a83b2b;
  padding-top:calc(20px * var(--scale,1));width:calc(74% * var(--scale,1))}
.gen-layer[data-step="2"] .gen-cap{margin-left:auto;text-align:right}
.gen-layer[data-step="3"] .gen-cap{width:100%;text-align:center}
.gen-cap>span{font-size:calc(var(--fs-body) * var(--scale,1) * .76);
  font-weight:700;line-height:1.45;color:#23333c}
/* 数据锤：只在真含数字时才画，纯词不放大成朱红巨字 */
.gen-num{position:relative;z-index:1;align-self:flex-end;
  font-size:calc(var(--fs-title) * var(--scale,1) * 1.1);font-weight:900;
  color:#a83b2b;line-height:1;text-align:right}
.gen-layer[data-step="2"] .gen-num{align-self:flex-start;text-align:left}
.gen-layer[data-step="3"] .gen-num{align-self:center}
.gen-origin{position:relative;z-index:1;
  font-size:calc(var(--fs-micro) * var(--scale,1) * .94);font-weight:600;color:#6b6456}
.gen-layer[data-step="2"] .gen-origin{text-align:right}
.gen-layer[data-step="3"] .gen-origin{text-align:center}
/* ── 收尾帧：整幅结论 + 横向三格版权栏 ── */
.gen-end{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center}
.gen-end-kicker{display:flex;align-items:center;gap:calc(20px * var(--scale,1));
  margin-bottom:calc(34px * var(--scale,1))}
.gen-end-kicker>span.gen-kicker{flex:none;
  font-size:calc(var(--fs-micro) * var(--scale,1) * 1.12);font-weight:900;
  letter-spacing:.10em;color:#a83b2b}
.gen-end-kicker>i{flex:1;height:calc(3px * var(--scale,1));background:#16242c}
.gen-verdict{margin-top:calc(30px * var(--scale,1));
  font-size:calc(var(--fs-body) * var(--scale,1) * .90);font-weight:800;color:#a83b2b}
.gen-trail{flex:none;border-top:calc(2px * var(--scale,1)) solid #c9bda6;
  padding-top:calc(20px * var(--scale,1));margin-top:calc(26px * var(--scale,1));
  font-size:calc(var(--fs-micro) * var(--scale,1) * 1.06);
  font-weight:700;line-height:1.55;color:#23333c;text-wrap:pretty}
.gen-disclaim-bar{flex:none;margin-top:calc(18px * var(--scale,1));
  border-top:calc(2px * var(--scale,1)) solid #c9bda6;
  padding-top:calc(14px * var(--scale,1));
  font-size:calc(var(--fs-micro) * var(--scale,1) * .96);
  font-weight:600;line-height:1.45;color:#6b6456}

/* ── 字幕条：窄「口播」条固定底部 ── */
.frame .f-inner.gen-inner .subbar.gen-subbar{
  position:absolute!important;left:calc(72px * var(--scale,1))!important;
  right:calc(72px * var(--scale,1))!important;
  bottom:calc(52px * var(--scale,1))!important;top:auto!important;
  width:auto!important;max-width:none!important;transform:none!important;
  background:#16242c!important;color:#fff!important;
  border:none!important;border-radius:calc(6px * var(--scale,1))!important;
  box-shadow:none!important;text-shadow:none!important;
  padding:calc(14px * var(--scale,1)) calc(22px * var(--scale,1))!important;
  letter-spacing:0!important;gap:calc(16px * var(--scale,1))!important;
  align-items:center!important;justify-content:center!important;
  min-height:0!important;line-height:1.35!important}
.frame .f-inner.gen-inner .subbar.gen-subbar small{
  flex:none;font-size:calc(var(--fs-micro) * var(--scale,1) * .9);
  font-weight:900;color:#a83b2b;background:#f6f2e9;
  padding:calc(5px * var(--scale,1)) calc(10px * var(--scale,1));
  border-radius:calc(4px * var(--scale,1));letter-spacing:.08em}
.frame .f-inner.gen-inner .subbar .subwrap{
  color:#fff!important;-webkit-text-stroke:0!important;text-shadow:none!important;
  font-size:calc(var(--fs-body) * var(--scale,1) * .68)!important;
  font-weight:800!important;display:inline!important;letter-spacing:0!important}

/* ── 横版 16:9 ── */
.frame[data-ratio="16:9"] .f-inner.gen-inner{
  padding:calc(68px * var(--scale,1)) calc(64px * var(--scale,1)) calc(132px * var(--scale,1))!important}
.frame[data-ratio="16:9"] .gen-corner{left:calc(64px * var(--scale,1));top:calc(20px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-page{right:calc(64px * var(--scale,1));top:calc(20px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-rule{margin:calc(14px * var(--scale,1)) 0 calc(16px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-hook-top{padding-bottom:calc(14px * var(--scale,1));
  margin-bottom:calc(18px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-hook-top .gen-mini{margin-bottom:calc(10px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-hook-cols{gap:calc(34px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-side{padding-left:calc(22px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-side p{font-size:calc(var(--fs-body) * var(--scale,1) * .66);
  line-height:1.55}
.frame[data-ratio="16:9"] .gen-side p+p{margin-top:calc(14px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-side p.gen-prose-intro{margin-bottom:calc(10px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-opt{padding:calc(9px * var(--scale,1)) calc(4px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-hook-mark{font-size:calc(var(--fs-title) * var(--scale,1) * 1.5)}
.frame[data-ratio="16:9"] .gen-cover-sub{margin-top:calc(20px * var(--scale,1));
  padding-top:calc(14px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-cover-no{display:none}
.frame[data-ratio="16:9"] .gen-endnote,.frame[data-ratio="16:9"] .gen-trail{
  margin-top:calc(12px * var(--scale,1));padding-top:calc(10px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-flip{gap:calc(12px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-disclaim-bar{margin-top:calc(8px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-layer{gap:calc(16px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-stepnum{font-size:calc(var(--fs-title) * var(--scale,1) * 1.3)}
.frame[data-ratio="16:9"] .gen-cap{padding-top:calc(12px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-num{font-size:calc(var(--fs-title) * var(--scale,1) * .8)}
.frame[data-ratio="16:9"] .gen-end-kicker{margin-bottom:calc(16px * var(--scale,1))}
.frame[data-ratio="16:9"] .gen-verdict{margin-top:calc(16px * var(--scale,1))}

`;
/* v8：编排层 CSS 合并进单一真相源，导出 SVG 与预览用同一份，不另起一套 */
if(window.FV_LAYOUTS&&window.FV_LAYOUTS.css)FRAME_CSS+=window.FV_LAYOUTS.css;
/* 九套画面骨架：追加在编排层之后，导出 clone 用同一份 FRAME_CSS，预览与成片同源 */
if(window.FV_SKELETONS&&window.FV_SKELETONS.css)FRAME_CSS+=window.FV_SKELETONS.css;
var st=document.createElement('style');st.id='frameStyle';st.textContent=FRAME_CSS;document.head.appendChild(st);

/* ─────────────────────────────────────────────────────────────
   1. 状态
   ───────────────────────────────────────────────────────────── */
var VOICES=[
 ['zh-CN-XiaoxiaoNeural','晓晓 · 温柔女声'],['zh-CN-XiaoyiNeural','晓依 · 知性女声'],
 ['zh-CN-XiaochenNeural','晓辰 · 自然男声'],['zh-CN-XiaohanNeural','晓涵 · 温和女声'],
 ['zh-CN-XiaomengNeural','晓梦 · 轻快女声'],['zh-CN-XiaomoNeural','晓墨 · 沉稳女声'],
 ['zh-CN-XiaoqiuNeural','晓秋 · 清亮女声'],['zh-CN-XiaorouNeural','晓柔 · 柔和女声'],
 ['zh-CN-XiaoruiNeural','晓睿 · 少年音'],['zh-CN-XiaoshuangNeural','晓双 · 童声'],
 ['zh-CN-XiaoxuanNeural','晓萱 · 成熟女声'],['zh-CN-XiaoyanNeural','晓颜 · 播报女声'],
 ['zh-CN-XiaoyouNeural','晓悠 · 童声'],['zh-CN-YunxiNeural','云希 · 活泼男声'],
 ['zh-CN-YunyangNeural','云扬 · 播音男声'],['zh-CN-YunjianNeural','云健 · 厚实男声'],
 ['zh-CN-YunxiaNeural','云夏 · 少年音'],['zh-CN-YunzeNeural','云泽 · 成熟男声'],
 ['zh-CN-YunhaoNeural','云皓 · 广告男声'],['zh-CN-YunfengNeural','云枫 · 沉稳男声'],
 ['zh-CN-liaoning-XiaobeiNeural','晓北 · 东北话'],['zh-CN-sichuan-YunxiNeural','云希 · 四川话'],
 ['zh-CN-shaanxi-XiaoniNeural','晓妮 · 陕西话'],['zh-HK-HiuGaaiNeural','曉佳 · 粤语女声'],
 ['zh-HK-HiuMaanNeural','曉曼 · 粤语女声'],['zh-HK-WanLungNeural','雲龍 · 粤语男声'],
 ['zh-TW-HsiaoChenNeural','曉臻 · 台湾女声'],['zh-TW-HsiaoYuNeural','曉雨 · 台湾女声'],
 ['zh-TW-YunJheNeural','雲哲 · 台湾男声']
];
/* 话术按「内容类型」分派，不再用通用池硬套。
   科普 / 解说是问答题：没有选项、没有对错、没有「答案与你想的相反」，
   它的冲突是「现象与直觉不符」，不是「你选错了」。 */
var SCRIPT={
  judge:{tag:'真假题',promise:'看它错在哪一步',ask:'先别急着选对错',
    hook:'问的是：喝进胃里的醋，能否碰到血管斑块',cta:'评论区说说你原先选了什么',
    note:'别凭第一反应，看机制',verdictSub:'这一句记住就够了'},
  single:{tag:'四个选项',promise:'排掉干扰项',ask:'最像对的那个，往往是陷阱',
    hook:'四个选项，别急着选',cta:'收藏，下次别再被选项带偏',
    note:'先排除，再确认',verdictSub:'对照选项看一遍'},
  multi:{tag:'多选题',promise:'逐个排除干扰项',ask:'少选一个也算答错',
    hook:'这题不止一个答案',cta:'评论区对一下你选了哪几个',
    note:'逐个判断，别凭印象',verdictSub:'逐个对照看一遍'},
  kepu:{tag:'反常识',promise:'最后一层最容易被忽略',ask:'体感不等于原理',
    hook:'体感和原理不是一回事',cta:'收藏，换季前翻出来看一遍',
    note:'现象和原理，不是一回事',verdictSub:'把这条原理记住就够了'}
};
/* 科普 / 解说里不该出现的答题话术；命中即按题型替换，避免「前言不搭后语」 */
var QUIZ_WORDS=/答案|相反|选对|选错|选了|先记住这题|请把这题|判断|对错|选项|记在心里|白答/;
var CTAS=['关注我，下期接着拆','评论区说说你选了什么','转给那个一直答错的朋友','收藏，下次别再踩坑'];
var TYPE_LABEL={judge:'判断题',single:'单选题',multi:'多选题',kepu:'科普'};
/* 每种形态连反转 / 收尾花字都不同，不只是换个配色。
   quiz 保持原有六拍（其实 / 情绪池 / 最离谱 / 记住）。 */
var FMT_BEATS={
 claim:  {flip:'查过了', flipEn:'CHECKED',    end:'别信',   endEn:'DONT BUY IT'},
 list:   {flip:'拆开看', flipEn:'BREAK IT DOWN',end:'收好',  endEn:'KEEP THIS'},
 compare:{flip:'差在这', flipEn:'NOT THE SAME',end:'分清了', endEn:'NOW YOU SEE IT'},
 number: {flip:'算一下', flipEn:'DO THE MATH', end:'记分母', endEn:'ASK THE DENOMINATOR'},
 story:  {flip:'后来',   flipEn:'THEN WHAT',    end:'原来',   endEn:'SO THAT IS IT'},
 debate: {flip:'两边看', flipEn:'TWO SIDES',    end:'你选',   endEn:'YOUR CALL'},
 myth:   {flip:'原来',   flipEn:'SO THAT IS IT',end:'记住',   endEn:'REMEMBER'},
 warn:   {flip:'停一下', flipEn:'HOLD ON',      end:'别踩',   endEn:'DONT STEP IN IT'}
};
function fmtMeta(){
  var k=String(S.fmt||'quiz');
  for(var i=0;i<FORMATS.length;i++)if(FORMATS[i].k===k)return FORMATS[i];
  return FORMATS[0];
}
function beatFlower(shot){
  if(!S.fmt||S.fmt==='quiz')return null;
  var b=FMT_BEATS[S.fmt];if(!b)return null;
  /* 大众向：形态自带的「查过了 / 拆开看 / 收好」仍是综艺口吻，
     统一换成信息词，与 quiz 形态的反转/收尾口径一致。 */
  if(S.audience){if(shot==='flip')return '实际上';if(shot==='end')return '记这条';return null;}
  if(shot==='flip')return b.flip;
  if(shot==='end')return b.end;
  return null;
}

var FORMATS=[
  {
    "k": "quiz",
    "name": "问句断言",
    "flower": "真假？",
    "en": "FOR REAL?",
    "kicker": "这说法你多半听过",
    "chip": "别划走",
    "cta": "你原先怎么想？",
    "qdemo": "……吗？",
    "tpl": "pop",
    "row": "",
    "desc": "原有判断题 / 选择题式问句"
  },
  {
    "k": "claim",
    "name": "辟谣声明",
    "flower": "别信",
    "en": "DONT BUY IT",
    "kicker": "这条传了太久",
    "chip": "已核实",
    "cta": "你被哪条刷到过？",
    "qdemo": "别再信「X」了",
    "tpl": "hot",
    "row": "claim",
    "desc": "先给结论式否定，不提问"
  },
  {
    "k": "list",
    "name": "清单体",
    "flower": "3 条",
    "en": "THREE THINGS",
    "kicker": "一条一条说清楚",
    "chip": "清单",
    "cta": "你中了几条？",
    "qdemo": "3 个 X，第 2 个最上头",
    "tpl": "clay",
    "row": "list",
    "desc": "数字化清单，首帧给数量"
  },
  {
    "k": "compare",
    "name": "对比反转",
    "flower": "差在这",
    "en": "NOT THE SAME",
    "kicker": "看着像，其实不是",
    "chip": "对比",
    "cta": "你之前分得清吗？",
    "qdemo": "X 不是 Y，差在这一步",
    "tpl": "neon",
    "row": "compare",
    "desc": "A≠B 结构，反直觉"
  },
  {
    "k": "number",
    "name": "数据拆解",
    "flower": "看数字",
    "en": "THE NUMBER",
    "kicker": "先把数字摊开",
    "chip": "数据",
    "cta": "你第一眼信了吗？",
    "qdemo": "这个数字，被放大了一万倍",
    "tpl": "goldblue",
    "row": "number",
    "desc": "大数字钩子 + 分母口径"
  },
  {
    "k": "story",
    "name": "事件悬念",
    "flower": "后来呢",
    "en": "WHAT HAPPENED",
    "kicker": "事情后来反过来了",
    "chip": "后续",
    "cta": "你猜到结局了吗？",
    "qdemo": "后来，事情反过来了",
    "tpl": "winter",
    "row": "story",
    "desc": "时间线叙事，不先给结论"
  },
  {
    "k": "debate",
    "name": "争议两派",
    "flower": "吵翻了",
    "en": "TWO SIDES",
    "kicker": "评论区已经分成两派",
    "chip": "争议",
    "cta": "你站哪一边？",
    "qdemo": "两派吵翻了：到底 X 还是 Y",
    "tpl": "grape",
    "row": "debate",
    "desc": "呈现分歧，不替观众下判决"
  },
  {
    "k": "myth",
    "name": "冷知识",
    "flower": "原来",
    "en": "SO THAT IS IT",
    "kicker": "一直被说反了",
    "chip": "冷知识",
    "cta": "你也是刚知道吗？",
    "qdemo": "原来 X 一直被说反了",
    "tpl": "forest",
    "row": "myth",
    "desc": "认知修正，轻信息量"
  },
  {
    "k": "warn",
    "name": "避坑提醒",
    "flower": "停一下",
    "en": "HOLD ON",
    "kicker": "这一步最容易错",
    "chip": "避坑",
    "cta": "你踩过这个坑吗？",
    "qdemo": "这一步做错，前面全白费",
    "tpl": "tomato",
    "row": "warn",
    "desc": "行动提醒，给可执行动作"
  }
];

var DEFAULT_DISCLAIM='本内容仅作信息整理与知识分享，不构成医疗、法律或投资等专业建议；如有疑问请以官方发布及专业人士意见为准。';
/* 题型不只是个下拉：切换就载入一整套示例，题干 / 选项 / 答案 / 拆解 / 来源真的变 */
/* 每套示例带：看点标签 tags（不剧透结论）、数据锤 hammers（主句里内联高亮的词）、
   补充条 notes（一句口语解释，不复述主句）。三者共同构成信息递进，而不是三条平铺。 */
var PRESETS={
 judge:{
   flower:'到不了',
   cta:'你原先选了啥？',
   pops:'我奶泡了黑豆|血管：谢谢关心|这说法我信过|我奶：黑豆白泡了|斑块：我还在|这就去量血压',
   peak:'最离谱的是，醋还没出门就被拦了',
   flip:'醋酸先过胃，根本到不了斑块',
   ask:'喝点醋，血管就软了',q:'喝醋能软化血管、清除血栓吗？',opts:'正确|错误',ans:'错误',
   points:'喝进去的酸，先被胃稀释掉\n斑块长在血管壁里，不是水垢\n酸碱度由肺和肾牢牢管着',
   src:'国家卫生健康委员会官网',hook:'这说法你多半听过',
   tags:'醋酸 / 血管斑块 / 酸碱度',hammers:'稀释|不是水垢|肺和肾',
   notes:'胃：这关我先过了|不是泡一泡就能冲下来的|身体自己有缓冲系统',
   takeaway:'别拿醋护血管，控好三高更实在'},
 single:{
   flower:'有区间',
   cta:'你每天吃够几种粗粮？',
   pops:'我买了三罐粉|米饭：别换我|看完去囤了燕麦|粗粮：我上桌了|补剂：别买我|每天 25 克，记本上',
   peak:'最离谱的是，补剂比菜贵十倍',
   flip:'推荐区间是有数的',
   ask:'膳食纤维嘛，越多越好',q:'成年人每天推荐摄入多少克膳食纤维？',opts:'15~20 克|25~30 克|40~50 克|越多越好',ans:'25~30 克',
   points:'先看指南给的推荐区间\n差的那部分，多半是主食太精\n不必买补剂，换主食就够了',
   src:'《中国居民膳食指南（2022）》',hook:'四个选项，别急着选',
   tags:'推荐量 / 摄入缺口 / 食物来源',hammers:'区间|太精|换主食',
   notes:'「越多越好」听着就很可疑|精白米面吃太多，缺口就出来了|全谷物豆类比粉剂便宜多了',
   takeaway:'一半主食换全谷物，缺口就补上了'},
 multi:{
   flower:'越暗越累',
   cta:'你选了哪几个？',
   pops:'我关灯刷到现在|眼睛：救救我|这就去开台灯|屏幕：调暗点|20 分钟歇一下|夜间模式开了',
   peak:'最离谱的是，越暗反而越费眼',
   flip:'亮度差太大，眼睛一直在加班',
   ask:'关灯看屏幕，眼睛更放松',q:'下列哪些做法有助于减少夜间视疲劳？',opts:'每 20 分钟远眺 20 秒|关灯后刷手机|保持环境有背景光|屏幕亮度与环境接近',ans:'A、C、D',
   points:'远眺是让睫状肌松下来\n全黑环境里，瞳孔反复调节\n开盏背景灯比眼药水管用',
   src:'国家卫健委 · 眼健康科普',hook:'这题不止一个答案',
   tags:'20-20-20 / 环境光 / 屏幕亮度',hammers:'远眺|反复调节|背景灯',
   notes:'放松靠的是「看远」，不是「看暗」|一会儿放大一会儿缩小，累的是它|环境光跟上，屏幕别当唯一光源',
   takeaway:'开盏背景灯、定时远眺，比眼药水管用'},
 kepu:{
   flower:'不是气温',
   cta:'你冬天涂防晒吗？',
   pops:'我冬天从不防晒|雪：反光套餐了解一下|这就去翻防晒霜|气温：这锅我不背|UV：照常上班|高海拔 +10%',
   peak:'最离谱的是，雪地里最该涂防晒',
   flip:'紫外线强度和气温不是一回事',
   ask:'凉快＝紫外线弱',q:'为什么低温也会晒伤皮肤？',opts:'',ans:'看指数',
   points:'晒伤来自紫外线，不来自温度\n阴天云层只挡部分，雪地还会反射\n海拔每升 1000 米，UV 约增强 10%',
   src:'中国气象局 · 紫外线科普',hook:'体感和原理不是一回事',
   tags:'紫外线 / 气温 / 高海拔',hammers:'紫外线|反射|10%',
   notes:'凉，只说明气温低|云挡的是可见光，不是全部 UV|越往高处走，大气过滤越薄',
   takeaway:'防晒看紫外线指数，不看气温'}
};

/* ═══════════════════════════════════════════════════════════════
   热门话题库 · 联网核实（2026-11 检索）
   热度只写公开报道里明确出现的数字 / 榜单，不编「实时热度」。
   来源见每条 src；这里的数字是「当时的传播量级」，不是当前榜单值。
   ═══════════════════════════════════════════════════════════════ */
var HOT_TOPICS=[
 {id:'forehead',
   flower:'维修中',
   pops:'评论区已确诊|我前额叶：还在排队|别骂了别骂了|25 岁生日我等了好久|原来不是我一个|脑子：还在加载',
   peak:'最离谱的是，前额叶居然成了择偶标准',
   flip:'它不是开关，是个慢活儿',ask:'25 岁一到，突然就成熟了',type:'judge',heat:'两个月 8 次热搜 · 上亿浏览',
  src:'澎湃新闻《前额叶，扛下了年轻人所有的错》',
  q:'前额叶 25 岁才长好，25 岁前都是「脑残」？',ans:'想多了',
  hook:'两个月上了八次热搜',
  tags:'前额叶 / 发育 / 热梗',hammers:'刹车|绝缘皮|看个体',
  notes:'脑子：我懂了 手：不，你没有|这不是免罪牌啊喂|别拿它解释熬夜到两点',
  points:'它管的是刹车，不是智商\n髓鞘像给线路包绝缘皮\n有人二十出头就稳，有人三十还在磨',
  takeaway:'别拿脑发育当拖延的免罪牌',cta:'你几岁才学会「先别急」？'},
 {id:'mooncake',
   flower:'别慌',
   pops:'我爸已经把柿子收了|月饼：这锅我不背|看完默默加了块蟹|我妈：明年别买了|胃：我加班了|刚吃完，还活着',
   peak:'最离谱的是，相克表传了几十年，没拿出病例',
   flip:'没中毒，是胃堵车了',ask:'食物相克，吃了要中毒',type:'judge',heat:'微博热搜 TOP3 · 抖音 8.2 亿播放 · 小红书 12 万+ 笔记',
  src:'封面新闻 / 四川省人民医院临床营养科',
  q:'月饼+柿子+螃蟹，真会连夜进急诊？',ans:'不会中毒',
  hook:'每年中秋都刷一遍',
  tags:'食物相克 / 鞣酸 / 胃排空',hammers:'一桌凑齐|排队|不新鲜',
  notes:'胃：今天春运是吧|别怪柿子，怪你贪多|相克表可以撕了',
  points:'高脂高鞣酸高蛋白，一桌凑齐\n空腹猛吃，胃排空开始排队\n真翻车多半是虾不新鲜',
  takeaway:'别怕相克，怕的是贪多和不新鲜',cta:'你家那桌凑齐几样？'},
 {id:'airplane',
   flower:'鼻子先钝',
   pops:'难怪我总点番茄汁|空姐：早习惯了|下次带包榨菜（不是）|商务舱也这样吗|落地第一顿狂吃|鼻子：我加班了',
   peak:'最离谱的是，地面上难吃的配方是特意调的',
   flip:'是你的鼻子先罢工了',ask:'航司舍不得放盐，厨子摆烂',type:'kepu',heat:'知乎 / 小红书高赞冷知识',
  src:'知乎高赞回答（引德国弗劳恩霍夫研究所模拟机舱实验）',
  q:'为什么飞机餐总觉着难吃？',ans:'鼻子背锅',
  hook:'坐过飞机的都懂',
  tags:'味觉 / 客舱 / 感知',hammers:'先钝|三成|更重口',
  notes:'番茄汁在天上封神是有原因的|舌头：这锅我不背|厨子早算过这笔账',
  points:'机舱又干又低压，嗅觉先钝\n咸味甜味直接掉了三成\n所以航食本来就调得更重口',
  takeaway:'上飞机别怪餐，怪湿度',cta:'你在飞机上觉得啥最好吃？'},
 {id:'static',
   flower:'18000V',
   pops:'我冬天不敢摸门把手|原来我是移动高压电|羽绒服：没想到吧|门把手：又是我|摸一下再下车|化纤：怪我咯',
   peak:'最离谱的是，一万八千伏，人只麻一下',
   flip:'电压吓人，能量小得可怜',ask:'上万伏肯定很危险',type:'judge',heat:'科普中国 · 冬季高热科普',
  src:'科普中国《为什么冬天特别容易「啪」一下触电？》',
  q:'冬天被电那一下，真有上万伏？',ans:'虚惊一场',
  hook:'每年冬天都被电一次',
  tags:'静电 / 湿度 / 能量',hammers:'18000V|微安|几毫焦',
  notes:'两件化纤一摩擦，电荷没处漏|像水滴落手心，不疼但看得见|加油站先摸金属就防这下',
  points:'脱羽绒服能攒到 18000V\n放电就微安级、几毫秒\n可这点火花能点燃油气',
  takeaway:'会被电麻，但电不死人',cta:'你冬天被电过几次？'},
 {id:'mold',
   flower:'别蒸了',
   pops:'我妈：扔了多浪费|求求别再 616 了|馒头：我尽力了|冰箱：别打开我|刀切掉那块就行|长辈群已转发',
   peak:'最离谱的是，撕皮蒸一蒸，还编成了顺口溜',
   flip:'蒸得死菌，蒸不死毒素',ask:'撕掉皮、上锅蒸，就能吃',type:'judge',heat:'抖音「4848 再 616」暗号刷屏',
  src:'中国互联网联合辟谣平台 / 食品安全科普',
  q:'发霉馒头撕掉皮、上锅蒸蒸，还能吃？',ans:'整份丢掉',
  hook:'长辈群最险的一句',
  tags:'黄曲霉 / 霉菌 / 蒸煮',hammers:'280℃|多孔|够不着',
  notes:'加热杀的是菌，不是毒|你看见的绿毛只是冰山一角|整份丢，别心疼那几块钱',
  points:'黄曲霉毒素约 280℃ 才分解\n馒头多孔，霉菌早钻进去了\n家里灶台那点温度根本够不着',
  takeaway:'撕皮加蒸，蒸不掉毒素',cta:'你家谁最舍不得扔？'},
 {id:'sweetpotato',
   flower:'没检测',
   pops:'我刚买了两个压压惊|摊主：我招谁了|香精：这锅也不背|热搜：我背全锅|刚啃完，还香|烤炉：功劳是我的',
   peak:'最离谱的是，摊主挨了骂，检测报告没人见过',
   flip:'没检测、没报告，只有一个「可能」',ask:'闻着香吃着不甜＝泡了香精',type:'judge',heat:'冲上热搜 · 光明网评论「别被热搜骗了」',
  src:'光明网《「烤红薯天塌了」？别被热搜骗了》',
  q:'街边烤红薯闻着香吃着不甜，是泡了香精？',ans:'没证据',
  hook:'一条热搜，摊主先慌了',
  tags:'香精 / 焦糖化 / 举证',hammers:'满屋香|0 检测|转载',
  notes:'家里空气炸锅也满屋飘香|「可能」两个字不是结论|一句猜测，先没了人家生意',
  points:'高温把淀粉变糖，香气本来就来得猛\n视频标着转载，没拿出任何检测\n热搜删了，摊子还在寒风里',
  takeaway:'香气来自烤制，不是香精证据',cta:'你被哪条热搜带偏过？'},
 {id:'card',
   flower:'99%？',
   pops:'我妈已经下单三个|二氧化氯：我尽力了|这钱省下来买口罩|挂身上像个工牌|实验室：别搬我|地铁：风有点大',
   peak:'最离谱的是，99% 是真的，只是在小盒子里',
   flip:'99% 是在小盒子里测的',ask:'挂胸前就能防流感',type:'judge',heat:'今日辟谣 · 中消协点名虚假宣传',
  src:'中国互联网联合辟谣平台「今日辟谣」（2026-11-05）',
  q:'挂个消毒卡在胸前，就能防流感？',ans:'基本没用',
  hook:'直播间卖爆的小挂件',
  tags:'二氧化氯 / 浓度 / 实验条件',hammers:'99%|通风|虚假宣传',
  notes:'把卡片和细菌关一起熬几小时|一阵风就吹散，浓度攒不起来|数字越漂亮，越要问在哪测的',
  points:'99% 除菌率来自密闭实验舱\n教室地铁都通风，气体很快稀释\n中消协点名过「99.99%」',
  takeaway:'实验室数字，别搬到地铁里',cta:'你买过最没用的「神器」是啥？'},
 {id:'superfood',
   flower:'不是药',
   pops:'家族群又开始了|我奶：苦瓜管够|医生：先别停药啊|菜市场：突然涨价|试管 ≠ 饭碗|我妈转了三遍',
   peak:'最离谱的是，最信这条的，偏偏正在吃药',
   flip:'菜是菜，药是药，不能互换',ask:'芹菜降压、苦瓜降糖、大蒜抗癌',type:'judge',heat:'科学辟谣 · 微博 #微博辟谣# 话题',
  src:'科学辟谣（新浪微博，2026-11-01）',
  q:'芹菜降压、苦瓜降糖、大蒜抗癌？',ans:'菜不是药',
  hook:'家族群三连发的养生帖',
  tags:'超级食物 / 剂量 / 用药',hammers:'不等于药|一桌菜|别停药',
  notes:'营养成分不等于疗效，差着剂量|「超级食物」多半是营销词|停药换偏方最危险',
  points:'试管里有用，不等于吃下去治病\n身体要的是一桌菜，不是一味神药\n血压血糖靠药控，别拿芹菜顶上',
  takeaway:'别拿菜替药，先问医生',cta:'你家群里最近转了哪条？'},
 {id:'shrimp',
   flower:'一卡车',
   pops:'我刚吃了虾又啃了橙子|还活着，来报个到|相克表：我不要面子的|剂量：没人问我|海鲜：一卡车起步|我妈把表撕了',
   peak:'最离谱的是，算下来得吃一卡车虾',
   flip:'想中毒得一次吃上百公斤',ask:'虾加维 C，等于砒霜',type:'judge',heat:'凤凰网辟谣专题 · 经典流言',
  src:'凤凰网《这些相克食物 CP 被冤枉了》',
  q:'虾和维 C 一起吃，等于砒霜？',ans:'剂量不够',
  hook:'相克表上头一条',
  tags:'砷 / 剂量 / 错觉相关',hammers:'试管|胃肠道|不新鲜',
  notes:'烧杯能发生，肚子里未必有条件|胃酸、酶、时间都不配合|先怀疑虾，别怀疑水果',
  points:'把试管里的反应搬进了肚子\n胃肠道根本做不了高效还原\n真出事多半是虾不新鲜',
  takeaway:'抛开剂量谈毒性，都是吓人',cta:'你被哪张相克表吓过？'},
 {id:'mosquito',
   flower:'找活人',
   pops:'所以碗是白放了|蚊子：我要的是整套|夏天最招蚊的举手|我喷了花露水|碗：我尴尬了|脚踝：先被叮',
   peak:'最离谱的是，实验室喂血还得造张假皮',
   flip:'它找的是活人，不是血',ask:'放碗血，蚊子就去喝那碗了',type:'kepu',heat:'知乎热榜脑洞题',
  src:'知乎热榜动物冷知识（2026-11）',
  q:'床边放一碗血，蚊子就不咬我了？',ans:'照样咬你',
  hook:'夏天最火的偏方之一',
  tags:'二氧化碳 / 体温 / 口器',hammers:'二氧化碳|凝结|穿刺',
  notes:'十几米外先闻到你呼吸|刚倒出来热，一会儿就凉了|隔着碗，它连试都懒得试',
  points:'靠二氧化碳、体温、体味接力定位\n碗里的血不喘气、会凉、会凝结\n口器是穿刺工具，不是吸管',
  takeaway:'别放那碗血了，关窗更实在',cta:'你屋里谁最先被叮？'},
 {id:'noodle',
   flower:'没出处',
   pops:'我昨晚刚吃，还活着|泡面：谢谢澄清|加个蛋这事我记下了|谁传的这条啊|胃：正常下班|火腿肠：加上我',
   peak:'最离谱的是，越具体的假数字越好转',
   flip:'正常消化，毫无压力',ask:'泡面在胃里 32 小时不消化',type:'judge',heat:'科学辟谣流言榜实锤',
  src:'科学辟谣平台流言榜',
  q:'泡面在胃里 32 小时不消化？',ans:'没这回事',
  hook:'这个数字传了十几年',
  tags:'消化 / 钠 / 膳食结构',hammers:'32小时|高钠|加蛋加菜',
  notes:'这个数字听着具体，其实是编的|面饼油炸、粉包全是盐|纠结消化不如顺手抓把青菜',
  points:'「32 小时」没人给得出来源\n真要防的是高油高钠、营养单一\n加蛋加菜、酱包少放、汤别喝完',
  takeaway:'别怕不消化，怕的是天天只吃它',cta:'你泡面必加啥？'},
 {id:'skipping',
   flower:'20°',
   pops:'我扔了七八个|这人是开了物理外挂|看完想去河边了|石头：我挑的|20 度，抄下来|挖掘机：顺手而已',
   peak:'最离谱的是，一亿人看完自己去搜原理',
   flip:'约 20 度，谁都能练',ask:'弹十几次，肯定加了特效',type:'kepu',heat:'全球 1.2 亿播放 · 无解说无特效',
  src:'腾讯新闻《湘江边一块石头，弹出了全球 1.2 亿播放》',
  q:'一块扁石头，为什么能弹十几次？',ans:'角度对了',
  hook:'1.2 亿播放，没一句解说',
  tags:'入射角 / 旋转 / 好奇心',hammers:'20°|旋转|为什么',
  notes:'太平拍水，太竖直接沉|转起来才不翻，这是关键|十几秒没一句解说，反而火了',
  points:'石片贴水面 20° 最容易连跳\n还得转起来，像陀螺才稳\n初速度、石片形状都是变量',
  takeaway:'先让人觉得好玩，再让人追问',cta:'你最多打过几个水漂？'},
 {id:'kettle',
   flower:'锁住了',
   pops:'我妈刚把壶收了|水垢：终于有人看我|我妈：那不换了|锰：别老cue我|烧水：我无辜|说明书：没人看我',
   peak:'最离谱的是，避开了水壶，没避开水垢',
   flip:'锰锁在合金里，不是撒水里',ask:'烧水会析出锰，伤身体',type:'judge',heat:'科学辟谣 · 微博 #微博辟谣#',
  src:'科学辟谣（新浪微博，2026-10-31）',
  q:'电热水壶烧水会析出锰，伤身体？',ans:'不用换壶',
  hook:'长辈群又一条',
  tags:'不锈钢 / 迁移 / 剂量',hammers:'合金|迁移量|微量元素',
  notes:'它不是浮在水面上的一层粉|正规壶出厂前就得过这关|坚果粗粮里也有，缺了反而不行',
  points:'锰稳定在不锈钢合金中\n国家对金属迁移量有严格标准\n锰是必需微量元素，过量才有风险',
  takeaway:'认准正规壶，别怕锰',cta:'你家换过几个水壶？'},
 {id:'vaccine',
   flower:'两个项目',
   pops:'我爸已经问过社区医院|药名一个没念顺|先查项目名再转|标题党：又赢了|原文：在最后一行|我爸：先看原文',
   peak:'最离谱的是，热搜比公告跑得快',
   flip:'「管半年」是另一款海外药',ask:'国产降压疫苗，一针管半年',type:'judge',heat:'微博热搜 · 多话题连续上榜',
  src:'今日头条核查报道（2026-09）',
  q:'降压疫苗来了，一针管半年？',ans:'搞混了',
  hook:'热搜标题比论文跑得快',
  tags:'治疗性疫苗 / 临床试验 / 溯源',hammers:'治疗性|2 个项目|无数据',
  notes:'治疗性不等于给健康人预防|一期试验先只看安全|标题把两个新闻缝一起了',
  points:'热搜那款是给病人用的治疗性疫苗\n两个药名两套机制，互不相关\n公开材料里没「一针半年」的数据',
  takeaway:'热搜标题，别替科研下结论',cta:'你看医学新闻会查原文吗？'},
 {id:'carbface',
   flower:'造的词',
   pops:'我脸：我做错了啥|米饭：别啊|戒了三天先戒了脾气|碳水：我没惹谁|情绪：我先崩了|面条：带我一个',
   peak:'最离谱的是，新词一个月能换一茬',
   flip:'查不到定义，先掉的是精神',ask:'戒掉主食，能消掉碳水脸',type:'judge',heat:'中国互联网联合辟谣平台 · 10 月辟谣榜',
  src:'中国互联网联合辟谣平台 / 科学辟谣',
  q:'不吃主食，能消掉「碳水脸」？',ans:'查无此脸',
  hook:'新词一个接一个',
  tags:'碳水 / 水肿 / 膳食',hammers:'碳水脸|易疲劳|全谷物',
  notes:'先造个词，再造点焦虑|脑子主要靠葡萄糖供能|换粗一点，比一刀切靠谱',
  points:'「碳水脸」压根不是医学概念\n长期断碳水，先糊的是脑子\n把白米换糙米，不用饿肚子',
  takeaway:'别戒主食，换粗一点就行',cta:'你被哪个新词带过节奏？'},
 {id:'soy',
   flower:'用反了',
   pops:'我把青菜炒黑过|我妈一直用反了|生抽：终于轮到我|老抽：只管上色|盐：那我呢|厨房吵架+1',
   peak:'最离谱的是，放错那盘青菜真的会黑',
   flip:'一个管咸淡，一个管颜色',ask:'生抽老抽都一样',type:'judge',heat:'抖音 12.4 万赞 / 5.8 万赞厨房「吵架题」',
  src:'知乎 / 小红书高赞厨房科普',
  q:'生抽和老抽，到底谁管咸淡？',ans:'别搞反',
  hook:'厨房里吵了十几年',
  tags:'酿造 / 上色 / 厨房',hammers:'生抽|焦糖色|红烧',
  notes:'头道抽提，负责把味提起来|颜色是后加的，别当盐使|炒青菜倒老抽，一锅就黑了',
  points:'生抽是头道原汁，色浅味咸鲜\n老抽复晒加焦糖色，咸度反倒低\n凉拌炒菜用生抽，红烧才用老抽',
  takeaway:'生抽调味，老抽上色',cta:'你家那瓶，一直用对了吗？'}
];
/* ══ 扩展题库：9 类 · 联网核实 · 43 条 ══
   热度为历史公开报道/平台页披露量级，非实时榜单；evidence 区分「有依据 / 按常见度收录」。
   生成脚本 tools/build_topics.py，口径见 热门话题选题库.md。 */
var TOPIC_EXTRA=[
 {id:"ext_health_01",q:"肿瘤标志物升高就是癌？",type:"judge",opts:"正确|错误",ans:"不一定",points:"指标受多种因素影响\n单指标不能确诊\n需影像病理综合判断",hammers:"多种|单|影像病理",takeaway:"升高不等于患癌",hook:"体检报告几乎人人都查",flip:"正常细胞也会分泌相关蛋白",notes:"肿瘤标志物更像线索不是判决|吸烟炎症也可波动|所以异常先复查别自查",cta:"你见过哪项指标超标？",src:"央视健康",heat:"无公开量级，按常见度收录",category:"健康医学误区",catKey:"health",tpl:"clinic",evidence:"按常见度收录",evidenceDate:"2018",ask:"肿瘤标志物升高就是癌",tags:"多种 / 单 / 影像病理",peak:"最离谱的是，单子上一行字别自己判",pops:"我妈已经转给我了|先别自己吓自己|这题得问医生|家族群刚发过|我去年也查过|收藏了慢慢看",flower:""},
 {id:"ext_health_02",q:"饭后吃阿司匹林不伤胃？",type:"judge",opts:"正确|错误",ans:"会伤胃",points:"肠溶片在肠道释放\n饭后胃酸被稀释\n药物可能提前溶解",hammers:"肠道|稀释|提前",takeaway:"肠溶片别饭后乱吃",hook:"这条医嘱流传很广",flip:"胃内提前释放刺激胃黏膜",notes:"普通片与肠溶片规则不同|服药前看说明书|不适要问医生别照搬",cta:"你家里常备哪种？",src:"央视健康",heat:"无公开量级，按常见度收录",category:"健康医学误区",catKey:"health",tpl:"clinic",evidence:"按常见度收录",evidenceDate:"2018",ask:"饭后吃阿司匹林不伤胃",tags:"肠道 / 稀释 / 提前",peak:"最离谱的是，单子上一行字别自己判",pops:"我以为饭后吃更稳|这习惯我也有|说明书翻出来了|家族群刚发过|我去年也查过|收藏了慢慢看",flower:""},
 {id:"ext_health_03",q:"幽门螺杆菌没症状不用治？",type:"judge",opts:"正确|错误",ans:"不能这样想",points:"感染通常伴随炎症\n可能萎缩肠化甚至癌变\n很难自然清除",hammers:"炎症|萎缩|难自愈",takeaway:"无症状也要评估",hook:"很多人拿报告不当回事",flip:"细菌长期作用改变胃黏膜",notes:"是否治疗看风险与年龄|不是所有人一刀切|共同用餐也会交叉感染",cta:"你查过幽门螺旋杆菌吗？",src:"央视健康",heat:"无公开量级，按常见度收录",category:"健康医学误区",catKey:"health",tpl:"clinic",evidence:"按常见度收录",evidenceDate:"2018",ask:"幽门螺杆菌没症状不用治",tags:"炎症 / 萎缩 / 难自愈",peak:"最离谱的是，名称比结论跑得快",pops:"先存着别忘|我奶：多喝热水|看完默默记下|谁懂啊|下次体检再问|我爸刚发来一条",flower:""},
 {id:"ext_health_04",q:"发热捂汗能好得更快？",type:"judge",opts:"正确|错误",ans:"不会",points:"发热是免疫防御反应\n过度捂热影响散热\n婴幼儿风险更高",hammers:"防御|散热|婴幼儿",takeaway:"发热别硬捂汗",hook:"长辈几乎都这样建议",flip:"升温是身体主动调节非失温",notes:"体温计先记录趋势|持续高热要就医|酒精擦身也不建议",cta:"你小时候被捂过吗？",src:"新华网科学辟谣",heat:"2025-02-14 发布，无播放量级",category:"健康医学误区",catKey:"health",tpl:"clinic",evidence:"按常见度收录",evidenceDate:"2025-02-14",ask:"发热捂汗能好得更快",tags:"防御 / 散热 / 婴幼儿",peak:"最离谱的是，最该问的不是这一项",pops:"别急着对号入座|先存着别忘|我奶：多喝热水|看完默默记下|谁懂啊|下次体检再问",flower:""},
 {id:"ext_health_05",q:"宫颈糜烂还在被过度治疗？",type:"judge",opts:"正确|错误",ans:"不是疾病",points:"属柱状上皮异位\n教科书已更名\n按筛查结果处理",hammers:"异位|更名|筛查",takeaway:"宫颈糜烂不是病",hook:"丁香医生话题曾上热搜第一",flip:"外观像“糜烂”却非创面",notes:"轻度中重度并非病情分级|别因这个名称做手术|宫颈癌筛查才关键",cta:"你做过这项筛查吗？",src:"中国新闻网",heat:"2022-03-14 热搜第一，无公开数字",category:"健康医学误区",catKey:"health",tpl:"clinic",evidence:"有依据",evidenceDate:"2022-03-14",ask:"宫颈糜烂还在被过度治疗",tags:"异位 / 更名 / 筛查",peak:"最离谱的是，单子上一行字别自己判",pops:"我奶：多喝热水|看完默默记下|谁懂啊|下次体检再问|我爸刚发来一条|体检单我看不懂",flower:""},
 {id:"ext_food_06",q:"螃蟹和柿子同吃会中毒？",type:"judge",opts:"正确|错误",ans:"不会中毒",points:"普通食物无相克\n涩柿单宁高才不适\n问题常在变质或未熟",hammers:"无|单宁|变质",takeaway:"熟甜柿配蟹没问题",hook:"食物相克话题上过热搜",flip:"单宁与蛋白结合不自动等于中毒",notes:"蟹不新鲜风险更大|柿子选成熟甜柿|胃肠敏感另说",cta:"你被劝过别这样吃吗？",src:"中国互联网联合辟谣平台",heat:"2022-07 热搜；央视新闻话题阅读1.2亿/讨论7624/原创1670",category:"食品安全与食物相克",catKey:"food",tpl:"tomato",evidence:"有依据",evidenceDate:"2022-07-19",ask:"螃蟹和柿子同吃会中毒",tags:"无 / 单宁 / 变质",peak:"最离谱的是，问题常出在另一头",pops:"家族群又开始了|摊主：我招谁了|我爸已经收走了|刚啃完一口|这桌我熟|长辈群转三遍",flower:""},
 {id:"ext_food_07",q:"菠菜和豆腐同吃必结石？",type:"judge",opts:"正确|错误",ans:"不会",points:"草酸钙在肠道形成\n多数随粪便排出\n焯水可降草酸",hammers:"肠道|粪便|焯水",takeaway:"焯水菠菜可配豆腐",hook:"结石焦虑反复传播",flip:"沉积在肠道不是肾脏长石",notes:"结石史患者要限量|豆腐仍是钙来源|多喝水更有意义",cta:"你做菠菜前焯水吗？",src:"中国互联网联合辟谣平台",heat:"同题热搜收录，无单独量级",category:"食品安全与食物相克",catKey:"food",tpl:"tomato",evidence:"有依据",evidenceDate:"2022-07-19",ask:"菠菜和豆腐同吃必结石",tags:"肠道 / 粪便 / 焯水",peak:"最离谱的是，焦虑比搭配更上头",pops:"这桌我熟|长辈群转三遍|我刚买了两个|别翻旧账了|我奶：扔了多浪费|看完默默加菜",flower:""},
 {id:"ext_food_08",q:"骨头汤越白越补钙？",type:"judge",opts:"正确|错误",ans:"补不了多少",points:"钙难溶入汤里\n白色多来自脂肪\n每100毫升仅2—4毫克",hammers:"难溶|脂肪|2—4毫克",takeaway:"喝汤补钙是错觉",hook:"长辈炖汤几乎都信",flip:"乳白是乳化脂肪不是钙浓度",notes:"奶豆制品含钙更多|高尿酸别猛喝汤|汤鲜不等于营养高",cta:"你还会只喝汤吗？",src:"丁香医生",heat:"无公开量级，按常见度收录",category:"食品安全与食物相克",catKey:"food",tpl:"tomato",evidence:"按常见度收录",evidenceDate:"2018-08-18",ask:"骨头汤越白越补钙",tags:"难溶 / 脂肪 / 2—4毫克",peak:"最离谱的是，焦虑比搭配更上头",pops:"厨房先别吵|这就去翻冰箱|我中午刚吃过|刚吃完，还活着|我妈把表贴冰箱了|家族群又开始了",flower:"2—4毫克"},
 {id:"ext_physics_09",q:"40天出栏的鸡打了激素？",type:"judge",opts:"正确|错误",ans:"不是",points:"白羽肉鸡品种速生\n40天体长2.8—3公斤\n激素反而不划算",hammers:"40天|2.8—3公斤|不划算",takeaway:"速生主要靠品种",hook:"研究员辟谣内容登热搜",flip:"人工选育改变了生长曲线",notes:"激素违法且成本高风险大|饲料营养与防疫也重要|别用个头判断安全",cta:"你能接受白羽鸡吗？",src:"腾讯新闻/农科院专家",heat:"2022 热搜；9个月获赞470万",category:"生活物理与自然冷知识",catKey:"physics",tpl:"neon",evidence:"有依据",evidenceDate:"2022-08-23",ask:"40天出栏的鸡打了激素",tags:"40天 / 2.8—3公斤 / 不划算",peak:"最离谱的是，直觉先输了半拍",pops:"这就去查原文|冷知识+1|我同桌说过这个|我物理不及格|课本好像不是这么写|这题我举手",flower:"2.8—3公斤"},
 {id:"ext_physics_10",q:"热水一定比冷水慢结冰？",type:"judge",opts:"正确|错误",ans:"不一定",points:"存在姆潘巴现象\n只限特定温度水量\n不能当普遍规律",hammers:"存在|特定|不普遍",takeaway:"热水未必冻得更慢",hook:"物理冷知识常被说得绝对",flip:"蒸发对流过冷共同影响",notes:"别用它给冰箱做实验|条件不同结论可反转|可讲概率不讲奇迹",cta:"你做过这个实验吗？",src:"易有料冷科普",heat:"无公开量级，按常见度收录",category:"生活物理与自然冷知识",catKey:"physics",tpl:"neon",evidence:"按常见度收录",evidenceDate:"无日期",ask:"热水一定比冷水慢结冰",tags:"存在 / 特定 / 不普遍",peak:"最离谱的是，课本那句只说了一半",pops:"我家冰箱试过|结冰那下真看运气|姆潘巴：别cue我|这数得掰扯|我当年物理没及格|我抬头看了眼天",flower:""},
 {id:"ext_physics_11",q:"海水蓝色只是反射天空？",type:"judge",opts:"正确|错误",ans:"不是",points:"水分子吸收红黄光\n蓝光更易被散射\n阴天深海仍偏蓝",hammers:"吸收|散射|阴天",takeaway:"蓝色来自水本身",hook:"小学语文都这样教",flip:"光谱吸收先于天空反射",notes:"浅水与悬浮物会改变色|游泳池蓝色不等于海|纯净水也略偏蓝",cta:"你见过大海哪种蓝？",src:"易有料冷科普",heat:"无公开量级，按常见度收录",category:"生活物理与自然冷知识",catKey:"physics",tpl:"neon",evidence:"按常见度收录",evidenceDate:"无日期",ask:"海水蓝色只是反射天空",tags:"吸收 / 散射 / 阴天",peak:"最离谱的是，课本那句只说了一半",pops:"海边拍过这张|水本身也有点蓝|我潜水时看过|这数得掰扯|我当年物理没及格|我抬头看了眼天",flower:""},
 {id:"ext_physics_12",q:"一朵普通积云很轻？",type:"judge",opts:"正确|错误",ans:"很重",points:"云由无数小水滴构成\n普通积云可达数百吨\n微小颗粒被浮力托住",hammers:"无数|数百吨|浮力",takeaway:"云比看上去重得多",hook:"抬头看云从没想过重量",flip:"总浮力近似平衡总重力",notes:"重量不等于落地砸人|单位体积密度仍极低|飞机穿云并非穿固体",cta:"你想象云有几吨？",src:"易有料冷科普",heat:"无公开量级，按常见度收录",category:"生活物理与自然冷知识",catKey:"physics",tpl:"neon",evidence:"按常见度收录",evidenceDate:"无日期",ask:"一朵普通积云很轻",tags:"无数 / 数百吨 / 浮力",peak:"最离谱的是，课本那句只说了一半",pops:"这数得掰扯|我当年物理没及格|我抬头看了眼天|看完想去试试|别拿冰箱做实验|我先存个档",flower:""},
 {id:"ext_physics_13",q:"辣味是舌头尝出来的？",type:"judge",opts:"正确|错误",ans:"是痛觉",points:"辣椒素激活受体\n与高温灼烧共用通路\n牛奶酪蛋白可包裹",hammers:"辣椒素|高温|酪蛋白",takeaway:"辣味其实是痛觉",hook:"菜单和科普都叫“味觉”",flip:"大脑把化学刺激当灼伤",notes:"冰水冲不走辣椒素|辣度不等同刺激性|儿童别用“挑战”逼吃",cta:"你能吃多辣？",src:"易有料冷科普",heat:"无公开量级，按常见度收录",category:"生活物理与自然冷知识",catKey:"physics",tpl:"neon",evidence:"按常见度收录",evidenceDate:"无日期",ask:"辣味是舌头尝出来的",tags:"辣椒素 / 高温 / 酪蛋白",peak:"最离谱的是，课本那句只说了一半",pops:"我舌头麻了半天|辣到吸气那下|喝牛奶才管用|这数得掰扯|我当年物理没及格|我抬头看了眼天",flower:""},
 {id:"ext_kitchen_14",q:"铁锅炒菜能补铁？",type:"judge",opts:"正确|错误",ans:"很少",points:"迁移主要是三价铁\n吸收率远低于血红素铁\n溶出量受酸度影响",hammers:"三价铁|远低于|酸度",takeaway:"别指望铁锅补铁",hook:"养生群几乎都这样传",flip:"锅体迁移不等于人体利用",notes:"红肉血制品更易吸收|铸铁锅还可能增加摄入|缺铁先看病因",cta:"你家用的什么锅？",src:"科普中国/丁香医生",heat:"无公开量级，按常见度收录",category:"厨房与日用品常识",catKey:"kitchen",tpl:"clay",evidence:"按常见度收录",evidenceDate:"2019",ask:"铁锅炒菜能补铁",tags:"三价铁 / 远低于 / 酸度",peak:"最离谱的是，工具没错用法错了",pops:"看完默默收拾|谁把瓶子留着了|我先去试一下|这题我站我妈|我妈一直这么干|厨房吵架+1",flower:""},
 {id:"ext_kitchen_15",q:"菜凉了才能进冰箱？",type:"judge",opts:"正确|错误",ans:"不必等凉",points:"放凉期间细菌繁殖\n密封后直接冷藏更安全\n冰箱设计本就承受热食",hammers:"繁殖|密封|承受",takeaway:"热菜密封就冷藏",hook:"长辈几乎都怕“伤冰箱”",flip:"细菌增长风险大于机器负担",notes:"分装浅盒散热更快|别敞口放入串味|变质异味立即丢弃",cta:"你习惯凉多久再放？",src:"丁香医生",heat:"无公开量级，按常见度收录",category:"厨房与日用品常识",catKey:"kitchen",tpl:"clay",evidence:"按常见度收录",evidenceDate:"2018-08-18",ask:"菜凉了才能进冰箱",tags:"繁殖 / 密封 / 承受",peak:"最离谱的是，工具没错用法错了",pops:"这题我站我妈|我妈一直这么干|厨房吵架+1|我刚把锅刷了|先看说明书吧|我家那把刀钝了",flower:""},
 {id:"ext_kitchen_16",q:"微波炉加热食物会致癌？",type:"judge",opts:"正确|错误",ans:"不会",points:"微波只使分子振动生热\n不改变分子结构成致癌物\n安全取决于容器",hammers:"振动|生热|容器",takeaway:"微波加热本身不致癌",hook:"家族群辟谣很多次",flip:"加热机制与放射性无关",notes:"别用金属和非耐热塑料|受热不均需搅拌|焦糊才是风险来源",cta:"你敢用微波炉吗？",src:"央视健康",heat:"无公开量级，按常见度收录",category:"厨房与日用品常识",catKey:"kitchen",tpl:"clay",evidence:"按常见度收录",evidenceDate:"2018",ask:"微波炉加热食物会致癌",tags:"振动 / 生热 / 容器",peak:"最离谱的是，工具没错用法错了",pops:"我炒糊过一锅|长辈群已转发|我奶有话说|看完默默收拾|谁把瓶子留着了|我先去试一下",flower:""},
 {id:"ext_kitchen_17",q:"塑料瓶可长期反复装热水？",type:"judge",opts:"正确|错误",ans:"不建议",points:"编号决定使用条件\n反复使用易老化磨损\n高温加速物质迁移",hammers:"编号|老化|高温",takeaway:"别长期反复装热水",hook:"办公室常把瓶子续水",flip:"材质耐受温度并不一致",notes:"看瓶底三角形数字|饮料瓶不是水杯|裂纹变色就别再用",cta:"你会重复使用塑料瓶吗？",src:"央视健康",heat:"无公开量级，按常见度收录",category:"厨房与日用品常识",catKey:"kitchen",tpl:"clay",evidence:"按常见度收录",evidenceDate:"2018",ask:"塑料瓶可长期反复装热水",tags:"编号 / 老化 / 高温",peak:"最离谱的是，长辈那套差一个前提",pops:"我妈一直这么干|厨房吵架+1|我刚把锅刷了|先看说明书吧|我家那把刀钝了|别再传了",flower:""},
 {id:"ext_kitchen_18",q:"菜刀越磨越薄就越锋利？",type:"judge",opts:"正确|错误",ans:"看角度",points:"刃角决定切削效果\n过度磨薄易崩口卷刃\n保持原有角度更重要",hammers:"刃角|崩口|角度",takeaway:"别只追求越薄",hook:"厨房常识很少被讲透",flip:"锋利是几何与强度的平衡",notes:"磨刀方向保持均匀|陶瓷棒只理刃不修形|切骨刀和厨刀不同",cta:"你的刀多久磨一次？",src:"本库综合常识",heat:"无公开量级，按常见度收录",category:"厨房与日用品常识",catKey:"kitchen",tpl:"clay",evidence:"按常见度收录",evidenceDate:"无日期",ask:"菜刀越磨越薄就越锋利",tags:"刃角 / 崩口 / 角度",peak:"最离谱的是，看材质比看传言靠谱",pops:"我奶有话说|看完默默收拾|谁把瓶子留着了|我先去试一下|这题我站我妈|我妈一直这么干",flower:""},
 {id:"ext_meme_19",q:"做几道题就能确诊人格障碍？",type:"judge",opts:"正确|错误",ans:"不能",points:"需专业访谈评估\n看功能损害和持续时间\n单行为不足以定性",hammers:"访谈|功能|单行为",takeaway:"别用测试给自己贴病",hook:"短视频自测铺天盖地",flip:"笼统描述诱发巴纳姆效应",notes:"情绪波动不等于疾病|确诊须排除物质与共病|测试只能提示线索",cta:"你做过哪种心理测试？",src:"青岛宣传",heat:"无公开量级，按常见度收录",category:"网络热梗与伪心理学",catKey:"meme",tpl:"grape",evidence:"按常见度收录",evidenceDate:"2026",ask:"做几道题就能确诊人格障碍",tags:"访谈 / 功能 / 单行为",peak:"最离谱的是，标签比人跑得快",pops:"看完默默关掉|谁造的词啊|我居然对号入座|家族群刚刷到|这就去查出处|别拿它当诊断",flower:""},
 {id:"ext_meme_20",q:"MBTI能决定你的职业婚恋？",type:"judge",opts:"正确|错误",ans:"别迷信",points:"结果受状态影响\n重测稳定性有限\n职业选择因素更多",hammers:"状态|稳定性|因素",takeaway:"类型不能替你做决定",hook:"人格标签火遍社交平台",flip:"分类便利不等于本质固定",notes:"可作沟通破冰而非判决|求职看能力与情境|别按标签拒绝人",cta:"你的MBTI是什么？",src:"青岛宣传",heat:"无公开量级，按常见度收录",category:"网络热梗与伪心理学",catKey:"meme",tpl:"grape",evidence:"按常见度收录",evidenceDate:"2026",ask:"MBTI能决定你的职业婚恋",tags:"状态 / 稳定性 / 因素",peak:"最离谱的是，精确不等于真实",pops:"我朋友转发过|看完默默关掉|谁造的词啊|我居然对号入座|家族群刚刷到|这就去查出处",flower:""},
 {id:"ext_meme_21",q:"男性死亡年龄中位数67.7岁？",type:"judge",opts:"正确|错误",ans:"错得离谱",points:"七普中位数为70—74岁\n联合国2023年为73岁\nAI与自媒体循环造数",hammers:"70—74岁|73岁|67.7岁",takeaway:"别被假中位数吓到",hook:"公众号短视频到处转",flip:"模型引用自媒体再被引用",notes:"平均数与中位数不是一回事|年龄结构会拉偏结果|看权威预期寿命",cta:"你见过哪个“精确数据”？",src:"腾讯新闻",heat:"2026-03-19 报道，无播放量级",category:"网络热梗与伪心理学",catKey:"meme",tpl:"grape",evidence:"有依据",evidenceDate:"2026-03-19",ask:"男性死亡年龄中位数67.7岁",tags:"70—74岁 / 73岁 / 67.7岁",peak:"最离谱的是，精确不等于真实",pops:"我居然对号入座|家族群刚刷到|这就去查出处|别拿它当诊断|我先存个图|我测了三遍不一样",flower:"70—74岁"},
 {id:"ext_meme_22",q:"80后死亡率已突破5.2%？",type:"judge",opts:"正确|错误",ans:"概念错用",points:"七普是2019—2020口径\n不能预测2024年\n死亡率通常用千分率",hammers:"2019—2020|2024年|千分率",takeaway:"5.2%是错用概念",hook:"AI生成文章刷屏",flip:"累计死亡比例被写成年死亡率",notes:"同一代尚未走完风险期|百分率千分率不可混说|焦虑别变成付费课程",cta:"你被哪个数字唬住？",src:"中国互联网联合辟谣平台",heat:"2025-02-25 平台收录辟谣",category:"网络热梗与伪心理学",catKey:"meme",tpl:"grape",evidence:"有依据",evidenceDate:"2025-02-25",ask:"80后死亡率已突破5.2%",tags:"2019—2020 / 2024年 / 千分率",peak:"最离谱的是，先有个词再有焦虑",pops:"这就去查出处|别拿它当诊断|我先存个图|我测了三遍不一样|评论区已确诊|我刚做完测试",flower:"2019—2020"},
 {id:"ext_meme_23",q:"99.21%男性过劳猝死？",type:"judge",opts:"正确|错误",ans:"纯属编造",points:"报告最早见于短视频图集\n所谓机构查无踪迹\n自媒体为流量二次传播",hammers:"短视频图集|查无踪迹|二次传播",takeaway:"精确不等于真实",hook:"数据刷屏但来源成谜",flip:"无样本无方法只能称三无报告",notes:"死亡率不会这样表达|上海消费数据也远超收支|看到百分比先查分母",cta:"你还信过哪个“报告”？",src:"中国互联网联合辟谣平台",heat:"2025-09-28 平台收录，9月23日短视频首现",category:"网络热梗与伪心理学",catKey:"meme",tpl:"grape",evidence:"有依据",evidenceDate:"2025-09-28",ask:"99.21%男性过劳猝死",tags:"短视频图集 / 查无踪迹 / 二次传播",peak:"最离谱的是，标签比人跑得快",pops:"我刚做完测试|别骂了别骂了|我截屏发群里了|这词我昨天才见|先别急着贴标签|我朋友转发过",flower:""},
 {id:"ext_consumer_24",q:"武功山240元天价西瓜是真的？",type:"judge",opts:"正确|错误",ans:"是摆拍",points:"三小时播放超23万\n多个平台热搜扩散\n游客和价格均虚构",hammers:"23万|多平台|虚构",takeaway:"天价视频是摆拍",hook:"23秒视频曾刷屏",flip:"旅行团游客被当作道具",notes:"原作者被行政拘留|西瓜价格不高于20元|泡面不高于15元",cta:"你买过景区高价品吗？",src:"微博/CCTV13",heat:"2025-07-14 报道；3小时播放23万、多平台热搜",category:"消费避坑与虚假宣传",catKey:"consumer",tpl:"hot",evidence:"有依据",evidenceDate:"2025-07-14",ask:"武功山240元天价西瓜是真的",tags:"23万 / 多平台 / 虚构",peak:"最离谱的是，小票比话术管用",pops:"这就去查编号|我家门铃响过|我先拍个照|我家里还有一个|我买过同款|小票我还留着",flower:"23万"},
 {id:"ext_consumer_25",q:"“排毒疗程”能把病排出来？",type:"judge",opts:"正确|错误",ans:"不能",points:"人体有肝肾代谢系统\n所谓排石可能是皂化产物\n只喝油反而增风险",hammers:"肝肾|皂化|增风险",takeaway:"身体不需要“排毒素”",hook:"明星打卡式养生很常见",flip:"油与果汁可形成难溶盐",notes:"饱和脂肪不利心血管|掉秤多因热量缺口|疾病别靠排毒营",cta:"你见过哪种排毒项目？",src:"光明网",heat:"2019 女星微博上热搜，无公开数字",category:"消费避坑与虚假宣传",catKey:"consumer",tpl:"hot",evidence:"有依据",evidenceDate:"2019-03-07",ask:"“排毒疗程”能把病排出来",tags:"肝肾 / 皂化 / 增风险",peak:"最离谱的是，广告词比配料表响",pops:"我刚退了一件|别拿颜色当疗效|我爸问过客服|看完默默收藏|货架上见过|这就去查编号",flower:""},
 {id:"ext_consumer_26",q:"高钙奶一定更补钙？",type:"judge",opts:"正确|错误",ans:"未必",points:"额外添加量通常有限\n总摄入量更关键\n普通奶已含优质钙",hammers:"有限|总摄入|优质钙",takeaway:"别只认高钙标签",hook:"超市货架营销很常见",flip:"配方差不等于营养翻倍",notes:"吸收率也受成分影响|过量未必更好|看NRV与配料表",cta:"你买牛奶看哪一行？",src:"丁香医生",heat:"无公开量级，按常见度收录",category:"消费避坑与虚假宣传",catKey:"consumer",tpl:"hot",evidence:"按常见度收录",evidenceDate:"2018",ask:"高钙奶一定更补钙",tags:"有限 / 总摄入 / 优质钙",peak:"最离谱的是，小票比话术管用",pops:"我爸问过客服|看完默默收藏|货架上见过|这就去查编号|我家门铃响过|我先拍个照",flower:""},
 {id:"ext_consumer_27",q:"“无糖”食品可以随便吃？",type:"judge",opts:"正确|错误",ans:"不行",points:"无糖多指无蔗糖\n淀粉脂肪仍会增加热量\n部分糖醇过量会腹胀",hammers:"无蔗糖|热量|糖醇",takeaway:"无糖不等于零负担",hook:"健康食品广告很多",flip:"口感补偿常靠脂肪淀粉",notes:"看配料表而非广告词|糖尿病人也需控总量|“无添加糖”更具体",cta:"你踩过哪种无糖坑？",src:"央视健康",heat:"无公开量级，按常见度收录",category:"消费避坑与虚假宣传",catKey:"consumer",tpl:"hot",evidence:"按常见度收录",evidenceDate:"2018",ask:"“无糖”食品可以随便吃",tags:"无蔗糖 / 热量 / 糖醇",peak:"最离谱的是，小票比话术管用",pops:"评论区避坑|我刚退了一件|别拿颜色当疗效|我爸问过客服|看完默默收藏|货架上见过",flower:""},
 {id:"ext_consumer_28",q:"网红净水器能治三高抗癌？",type:"judge",opts:"正确|错误",ans:"不能",points:"净水器改善的是水质\n无药物疗效证据\n夸大宣传涉嫌违法",hammers:"水质|无证据|涉嫌违法",takeaway:"别买疗效净水器",hook:"会销和短视频推销常见",flip:"净水不是治疗干预",notes:"查产品卫生许可批件|身体不适看正规医疗|别拿滤芯颜色当疗效",cta:"你家净水器被推销过吗？",src:"中国互联网联合辟谣平台",heat:"平台首页消费提示收录，无播放量级",category:"消费避坑与虚假宣传",catKey:"consumer",tpl:"hot",evidence:"有依据",evidenceDate:"2026",ask:"网红净水器能治三高抗癌",tags:"水质 / 无证据 / 涉嫌违法",peak:"最离谱的是，广告词比配料表响",pops:"看完默默收藏|货架上见过|这就去查编号|我家门铃响过|我先拍个照|我家里还有一个",flower:""},
 {id:"ext_season_29",q:"冬天皮肤干要天天敷面膜？",type:"judge",opts:"正确|错误",ans:"别天天敷",points:"过度吸水脆弱屏障\n角质层受损更易干痒\n按需补水更有效",hammers:"过度|脆弱|受损",takeaway:"越敷越干可能更糟",hook:"冬季护肤误区铺天盖地",flip:"角质层不是需要灌满的水袋",notes:"敏感肌先看成分|面膜后做好封闭保湿|干痒持续要看皮肤科",cta:"你冬天敷几次面膜？",src:"新华网科学辟谣",heat:"2025-02-19 发布，无播放量级",category:"季节/节气与日常冷知识",catKey:"season",tpl:"winter",evidence:"按常见度收录",evidenceDate:"2025-02-19",ask:"冬天皮肤干要天天敷面膜",tags:"过度 / 脆弱 / 受损",peak:"最离谱的是，体感骗了整整一冬",pops:"先别急着囤|我爸有句谚语|我昨天刚开窗|我妈不让通风|这题有时效|换季就刷到",flower:""},
 {id:"ext_season_30",q:"喝酒能真正御寒吗？",type:"judge",opts:"正确|错误",ans:"只是错觉",points:"酒精扩张皮肤血管\n短暂发热随后散热加快\n核心体温可能下降",hammers:"扩张|短暂|下降",takeaway:"喝酒暖身是错觉",hook:"长辈聚会常这样讲",flip:"体表暖和掩盖热量流失",notes:"酒后失温风险更高|喝酒不能替代保暖|低血糖时更危险",cta:"你被这样劝过酒吗？",src:"新华网科学辟谣",heat:"2025-02-06 发布，无播放量级",category:"季节/节气与日常冷知识",catKey:"season",tpl:"winter",evidence:"按常见度收录",evidenceDate:"2025-02-06",ask:"喝酒能真正御寒",tags:"扩张 / 短暂 / 下降",peak:"最离谱的是，窗口一过就换题",pops:"长辈群又来了|我先存着应季|别照搬去年|我老家也这么说|看完默默关窗|谁裹成粽子了",flower:""},
 {id:"ext_season_31",q:"霜降当天没霜预示荒年？",type:"judge",opts:"正确|错误",ans:"纯属迷信",points:"霜的形成看近地温度湿度\n无霜不决定全年收成\n谚语不可当预测",hammers:"温度|湿度|收成",takeaway:"当日无霜不兆荒年",hook:"节气谚语代代流传",flip:"局地微气候不能定年景",notes:"农业看长期气象与品种|谚语可作物候观察|别拿它指导投资",cta:"你老家有什么节气说法？",src:"科学辟谣",heat:"平台收录，无公开播放量级",category:"季节/节气与日常冷知识",catKey:"season",tpl:"winter",evidence:"有依据",evidenceDate:"2026",ask:"霜降当天没霜预示荒年",tags:"温度 / 湿度 / 收成",peak:"最离谱的是，体感骗了整整一冬",pops:"谁裹成粽子了|这就去翻日历|我冬天也这样|先别急着囤|我爸有句谚语|我昨天刚开窗",flower:""},
 {id:"ext_season_32",q:"雪地靴越暖和越适合久穿？",type:"judge",opts:"正确|错误",ans:"不适合久穿",points:"宽松鞋头易滑动\n足弓缺乏稳定支撑\n久穿可能酸痛起泡",hammers:"滑动|稳定|酸痛",takeaway:"保暖不等于支撑好",hook:"冬季鞋类种草很多",flip:"暖来自材料也来自合脚",notes:"选鞋看足弓与止滑|连续久站要换鞋|厚底不等于减震好",cta:"你冬天常穿雪地靴吗？",src:"新华网科学辟谣",heat:"2025-01-24 发布，无播放量级",category:"季节/节气与日常冷知识",catKey:"season",tpl:"winter",evidence:"按常见度收录",evidenceDate:"2025-01-24",ask:"雪地靴越暖和越适合久穿",tags:"滑动 / 稳定 / 酸痛",peak:"最离谱的是，过了这周就别再发",pops:"我冬天也这样|先别急着囤|我爸有句谚语|我昨天刚开窗|我妈不让通风|这题有时效",flower:""},
 {id:"ext_season_33",q:"冬天越冷越要关窗保暖？",type:"judge",opts:"正确|错误",ans:"应定时通风",points:"室内二氧化碳和污染物会累积\n湿度变化利于微生物繁殖\n定时开窗改善换气",hammers:"累积|繁殖|定时",takeaway:"保暖也要换气",hook:"冷天几乎人人都关窗",flip:"密闭空间不等于空气更新",notes:"雾霾天避开高峰通风|每次十几分钟常够|厨房油烟更要排",cta:"你家一天开几次窗？",src:"新华网科学辟谣",heat:"无公开量级，按常见度收录",category:"季节/节气与日常冷知识",catKey:"season",tpl:"winter",evidence:"按常见度收录",evidenceDate:"2025",ask:"冬天越冷越要关窗保暖",tags:"累积 / 繁殖 / 定时",peak:"最离谱的是，过了这周就别再发",pops:"换季就刷到|我刚敷完面膜|长辈群又来了|我先存着应季|别照搬去年|我老家也这么说",flower:""},
 {id:"ext_creature_34",q:"金鱼记忆只有七秒？",type:"judge",opts:"正确|错误",ans:"错误",points:"金鱼可形成稳定记忆\n能识别喂食时间与路线\n训练后可走迷宫",hammers:"稳定|识别|迷宫",takeaway:"金鱼记忆不止七天",hook:"七秒说法几乎人人听过",flip:"学习形成的是神经记忆",notes:"记忆不等于永久不忘|环境单调会显得迟钝|别拿谣言喂鱼",cta:"你养过金鱼吗？",src:"易有料冷科普",heat:"无公开量级，按常见度收录",category:"动物与人体冷知识",catKey:"creature",tpl:"forest",evidence:"按常见度收录",evidenceDate:"无日期",ask:"金鱼记忆只有七秒",tags:"稳定 / 识别 / 迷宫",peak:"最离谱的是，七秒那句传太久了",pops:"这题我猜错|别拿它当结论|我刚搜了图|谁家也有这只|看完默默记下|我小时候信过",flower:""},
 {id:"ext_creature_35",q:"章鱼触手会把自己缠死？",type:"judge",opts:"正确|错误",ans:"基本不会",points:"皮肤分泌防粘物质\n吸盘与神经协同控制\n受损时自缠风险升高",hammers:"防粘|协同|升高",takeaway:"章鱼很少缠住自己",hook:"生物冷知识常被夸大",flip:"黏液与神经让触手可区分",notes:"离体后蠕动仍受刺激影响|不同章鱼行为有差异|别把行为等同认知",cta:"你还知道哪种防粘机制？",src:"易有料冷科普",heat:"无公开量级，按常见度收录",category:"动物与人体冷知识",catKey:"creature",tpl:"forest",evidence:"按常见度收录",evidenceDate:"无日期",ask:"章鱼触手会把自己缠死",tags:"防粘 / 协同 / 升高",peak:"最离谱的是，别把行为当性格",pops:"我家猫在旁边|我居然才知道|冷知识+1|我先存个档|我同学说过这个|我养过一条",flower:""},
 {id:"ext_creature_36",q:"憋气能把人憋死？",type:"judge",opts:"正确|错误",ans:"不会",points:"缺氧触发呼吸驱动\n意识丧失后肌肉松弛\n继续缺氧才造成损伤",hammers:"缺氧|驱动|松弛",takeaway:"正常憋气不会致死",hook:"网上憋气挑战很多",flip:"脑自动接管呼吸动作",notes:"溺水窒息是另一回事|病理状态不可复制|别拿挑战证明意志力",cta:"你能憋气多久？",src:"易有料冷科普",heat:"无公开量级，按常见度收录",category:"动物与人体冷知识",catKey:"creature",tpl:"forest",evidence:"按常见度收录",evidenceDate:"无日期",ask:"憋气能把人憋死",tags:"缺氧 / 驱动 / 松弛",peak:"最离谱的是，七秒那句传太久了",pops:"我同学说过这个|我养过一条|评论区先别吵|这题我猜错|别拿它当结论|我刚搜了图",flower:""},
 {id:"ext_creature_37",q:"人冷的时候尿会更多？",type:"judge",opts:"正确|错误",ans:"会",points:"皮肤血管收缩\n回心血量暂时增加\n肾滤过增加形成多尿",hammers:"收缩|增加|多尿",takeaway:"冷天尿多是正常",hook:"冬天几乎人人都遇到",flip:"体温调节改变血流分配",notes:"叫冷利尿不是肾病信号|喝咖啡也可能增加|失温需另看症状",cta:"你冬天也这样吗？",src:"易有料冷科普",heat:"无公开量级，按常见度收录",category:"动物与人体冷知识",catKey:"creature",tpl:"forest",evidence:"按常见度收录",evidenceDate:"无日期",ask:"人冷的时候尿会更多",tags:"收缩 / 增加 / 多尿",peak:"最离谱的是，别把行为当性格",pops:"评论区先别吵|这题我猜错|别拿它当结论|我刚搜了图|谁家也有这只|看完默默记下",flower:""},
 {id:"ext_creature_38",q:"打喷嚏时眼睛睁着会脱臼？",type:"judge",opts:"正确|错误",ans:"不会",points:"喷嚏是反射性呼气\n眼周组织有韧带固定\n睁眼只是反射难做到",hammers:"反射|固定|难做到",takeaway:"睁眼不会把眼球喷出",hook:"都市传说非常离谱",flip:"神经反射优先关闭眼睑",notes:"别硬撑着眼打喷嚏|真正风险在黏膜传播|用手肘遮挡更合适",cta:"你试过睁眼打喷嚏吗？",src:"本库综合常识",heat:"无公开量级，按常见度收录",category:"动物与人体冷知识",catKey:"creature",tpl:"forest",evidence:"按常见度收录",evidenceDate:"无日期",ask:"打喷嚏时眼睛睁着会脱臼",tags:"反射 / 固定 / 难做到",peak:"最离谱的是，看着离谱其实有机制",pops:"这就去翻视频|我家猫在旁边|我居然才知道|冷知识+1|我先存个档|我同学说过这个",flower:""},
 {id:"ext_stats_39",q:"67.7岁代表一半男性活不过70？",type:"judge",opts:"正确|错误",ans:"不能这样读",points:"七普全年龄男性中位数为70—74岁\n联合国2023年为73岁\n中位数受年龄结构影响",hammers:"70—74岁|73岁|年龄结构",takeaway:"中位数不是寿命预言",hook:"公众号短视频到处转",flip:"年龄结构不同会拉偏排序",notes:"预期寿命更合适|67.7岁是模型幻觉式结果|别把统计当宿命",cta:"你第一眼看信了吗？",src:"腾讯新闻",heat:"2026-03-19 报道，无播放量级",category:"数字/统计类反直觉",catKey:"stats",tpl:"goldblue",evidence:"有依据",evidenceDate:"2026-03-19",ask:"67.7岁代表一半男性活不过",tags:"70—74岁 / 73岁 / 年龄结构",peak:"最离谱的是，分母一换全盘就翻",pops:"先别急着转|我刚查了原文|这数得掰扯|小数位唬人|看完默默存图|谁做的表啊",flower:"70—74岁"},
 {id:"ext_stats_40",q:"死亡率5.2%是说每年死5.2%？",type:"judge",opts:"正确|错误",ans:"概念混淆",points:"七普不能预测2024年\n累计死亡比例不等于年死亡率\n死亡率通常按千分率",hammers:"2024年|累计|千分率",takeaway:"5.2%是错用口径",hook:"AI文章包装得像报告",flip:"分母和观察期被偷偷改变",notes:"媒体转引又形成闭环|老龄化也影响死亡结构|别拿累计值谈当年风险",cta:"你还会转发这种图吗？",src:"中国互联网联合辟谣平台",heat:"2025-02-25 平台收录",category:"数字/统计类反直觉",catKey:"stats",tpl:"goldblue",evidence:"有依据",evidenceDate:"2025-02-25",ask:"死亡率5.2%是说每年死5.",tags:"2024年 / 累计 / 千分率",peak:"最离谱的是，精度是做出来的",pops:"我先存个截图|这报告哪来的|分母是多少|这数我看着玄|我第一眼信了|先别急着转",flower:"2024年"},
 {id:"ext_stats_41",q:"99.21%男性过劳猝死可信吗？",type:"judge",opts:"正确|错误",ans:"完全不可信",points:"发布机构查无踪迹\n无样本和方法说明\n自媒体为流量搬运",hammers:"查无踪迹|无样本|搬运",takeaway:"小数位不代表真实",hook:"数据刷屏但来源成谜",flip:"报告把伪精度当可信度",notes:"应先查机构和问卷|再看分母与年份|百分比不是结论本身",cta:"你如何判断报告真假？",src:"中国互联网联合辟谣平台",heat:"2025-09-28 平台收录",category:"数字/统计类反直觉",catKey:"stats",tpl:"goldblue",evidence:"有依据",evidenceDate:"2025-09-28",ask:"99.21%男性过劳猝死可信",tags:"查无踪迹 / 无样本 / 搬运",peak:"最离谱的是，先问样本再问结论",pops:"这数得掰扯|小数位唬人|看完默默存图|谁做的表啊|别拿它下结论|我就说不对劲",flower:""},
 {id:"ext_stats_42",q:"上海女性月均消费10872元？",type:"judge",opts:"正确|错误",ans:"明显失实",points:"上海2025上半年月均可支配收入约7800元\n人均消费支出约4529元\n消费不可能长期超过收入",hammers:"7800元|4529元|10872元",takeaway:"别信“女性消费万元”",hook:"报告用精确数字博眼球",flip:"数据违背基本收支约束",notes:"分母是女性还是家庭未知|口径不明不能直接比|统计学也讲一致性",cta:"你月均花多少？",src:"中国互联网联合辟谣平台",heat:"2025-09-28 平台收录，无单独播放量级",category:"数字/统计类反直觉",catKey:"stats",tpl:"goldblue",evidence:"有依据",evidenceDate:"2025-09-28",ask:"上海女性月均消费10872元",tags:"7800元 / 4529元 / 10872元",peak:"最离谱的是，精度是做出来的",pops:"看完默默存图|谁做的表啊|别拿它下结论|我就说不对劲|这就去查口径|我爸转给我了",flower:"7800元"},
 {id:"ext_stats_43",q:"肿瘤标志物升高癌症概率多大？",type:"single",opts:"很高|有一点参考价值|完全没用|只看影像",ans:"有一点参考价值",points:"炎症感染也可升高\n癌症也不一定升高\n必须结合临床与影像",hammers:"炎症|不一定|临床影像",takeaway:"单项高不等于癌症",hook:"体检数字最让人焦虑",flip:"指标只提供线索非判决",notes:"筛查有适用人群|阴性也不能完全排除|所以复查比猜测强",cta:"你先看哪项指标？",src:"央视健康",heat:"无公开量级，按常见度收录",category:"数字/统计类反直觉",catKey:"stats",tpl:"goldblue",evidence:"按常见度收录",evidenceDate:"2018",ask:"肿瘤标志物升高癌症概率多大",tags:"炎症 / 不一定 / 临床影像",peak:"最离谱的是，精度是做出来的",pops:"这数我看着玄|我第一眼信了|先别急着转|我刚查了原文|这数得掰扯|小数位唬人",flower:""},
];
var FORMAT_TOPICS=[
  {
    "id": "fmt_claim_01",
    "q": "别再把「食物相克表」当菜单了",
    "type": "kepu",
    "opts": "",
    "ans": "不用背表",
    "points": "普通搭配不存在「相克」这回事\n不适多半来自变质、未熟或吃太多\n真要留意的是过敏和基础病",
    "hammers": "不存在|变质|过敏",
    "takeaway": "看新鲜度和总量，别背相克表",
    "hook": "这条在家族群转了十几年",
    "flip": "所谓相克，多数没过剂量这一关",
    "notes": "相克表看着吓人，剂量一栏常常空着|同一桌菜出问题，先查食材新不新鲜|特殊人群另说，别拿一张表套所有人",
    "cta": "你家群还在转这张表吗？",
    "src": "中国互联网联合辟谣平台 / 央视新闻",
    "heat": "抖音 8.2 亿播放 · 微博热搜 TOP3",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "hot",
    "evidence": "有依据",
    "evidenceDate": "2022-07",
    "ask": "食物相克表得背下来",
    "tags": "相克表 / 剂量 / 食材",
    "peak": "最容易被忽略的其实是食材本身",
    "pops": "我妈刚发我一张|冰箱：先查我|这张表我见过三版|刚吃完，还活着|家族群又开始了|收藏比转发有用",
    "flower": "",
    "fmt": "claim"
  },
  {
    "id": "fmt_claim_02",
    "q": "「3000 元做出 5 亿播放」，先别急着转",
    "type": "kepu",
    "opts": "",
    "ans": "口径没对上",
    "points": "3000 元只是算力成本，不是总成本\n48 小时是工作时长，不是全周期\n5 亿播放来自媒体转述，未经平台核实",
    "hammers": "算力成本|工作时长|未核实",
    "takeaway": "看到三个漂亮数字，先问各自的分母",
    "hook": "六个数字刷了整整一周",
    "flip": "导演随后把每一项都澄清了",
    "notes": "成本、工期、播放量，三个数字各有各的口径|热搜标题把三件事压成一句话|后来争议焦点从技术转向营销",
    "cta": "你当时第一眼信了吗？",
    "src": "澎湃新闻 · 苗建信息舆情监测",
    "heat": "3.24 万条声量 · 17 个热搜 · 在榜 161 小时",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "hot",
    "evidence": "有依据",
    "evidenceDate": "2026-03",
    "ask": "3000 元真做出 5 亿播放",
    "tags": "算力成本 / 工期 / 播放量",
    "peak": "17 个话题在 7 个平台累计在榜 161 小时",
    "pops": "我差点就转了|标题比正文跑得快|这数得掰扯|谁核过平台数据|我先存个原文|营销课又来了",
    "flower": "",
    "fmt": "claim"
  },
  {
    "id": "fmt_list_01",
    "q": "3 个把实验室拍成段子的动作，第 2 个最上头",
    "type": "kepu",
    "opts": "",
    "ans": "先把人留住",
    "points": "把 PCR 三个温度循环演成三兄弟轮流登场\n给微生物配性格，给操作配解说腔\n把科研日常本身拍成连续剧",
    "hammers": "三兄弟|配性格|连续剧",
    "takeaway": "先给具象，再给原理",
    "hook": "相关话题播放已经过亿",
    "flip": "重点不在「科」，在「普」",
    "notes": "抽象名词有了人物，就记得住|枯燥重复被配了旁白，反而想看下去|先让人愿意听，才谈得上听懂",
    "cta": "你被哪条讲法圈住的？",
    "src": "中国新闻网《早看到这个，我生物就满分了》",
    "heat": "LabTour 话题 1.6 亿播放 · 单条 37.1 万赞",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "clay",
    "evidence": "有依据",
    "evidenceDate": "2025-06",
    "ask": "科普得先把课本讲完",
    "tags": "拟人 / 解说腔 / 日常",
    "peak": "「铁锅炖讲 PCR」单条拿到 37.1 万赞",
    "pops": "我生物老师该看看|三兄弟我记住了|莱波特瑞是什么|文科生也看得很起劲|这就去补课|名字比知识点先火",
    "flower": "",
    "fmt": "list"
  },
  {
    "id": "fmt_list_02",
    "q": "实验室漫游里最出圈的 3 种讲法",
    "type": "kepu",
    "opts": "",
    "ans": "形式先于结论",
    "points": "不说话只留器材声，被叫「科研 ASMR」\n黑水夜潜拍浮游生物，单条点赞过 30 万\n冷原子装置用电线与设备讲「接近绝对零度」",
    "hammers": "器材声|30 万|绝对零度",
    "takeaway": "把过程端上来，比只给结论更抓人",
    "hook": "热榜上 1640 万人在看",
    "flip": "出圈的不是结果，是过程本身",
    "notes": "移液器、离心机的声音也能成内容|漆黑海水里打一束灯，就是画面|密密麻麻的电线反而最直观",
    "cta": "你最想看哪一种？",
    "src": "中国新闻网 / 抖音热榜",
    "heat": "热榜 TOP37 · 1640.2 万人在看 · 单条 30 万赞",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "clay",
    "evidence": "有依据",
    "evidenceDate": "2025-06",
    "ask": "实验室视频得有结论才有人看",
    "tags": "ASMR / 黑水 / 冷原子",
    "peak": "「中科院博士抽象演绎高中生物课」上过热榜 TOP37",
    "pops": "移液声莫名解压|深海比科幻片还震撼|文科生看得很起劲|这电线我服了|先别讲结论|我想去实验室了",
    "flower": "",
    "fmt": "list"
  },
  {
    "id": "fmt_cmp_01",
    "q": "1600N 不是暴力，是换算没跟上",
    "type": "kepu",
    "opts": "",
    "ans": "恰到好处",
    "points": "1600N 静态约等于托起 163 公斤\n短时冲击和静态托举不是一回事\n攀岩主锁破断强度是 22kN，零头都不到",
    "hammers": "163 公斤|冲击|22kN",
    "takeaway": "先把单位换成体感，再谈大不大",
    "hook": "三个字母刷成了物理顶流",
    "flip": "看到「牛」第一反应是疼，不是公斤",
    "notes": "力和质量之间隔着一个 9.8|关门那下约 200–400N，可以拿来当尺子|数字吓人，多半是单位没换成体感",
    "cta": "你第一眼想到的是多重？",
    "src": "搜狐网「生活物理冷知识」话题报道（自媒体口径，量级待核）",
    "heat": "报道称 72 小时 4.2 亿播放（自媒体口径）",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "neon",
    "evidence": "按常见度收录",
    "evidenceDate": "2026",
    "ask": "1600N 听着就像超人",
    "tags": "牛顿 / 静载 / 体感",
    "peak": "相关视频 72 小时播放突破 4.2 亿次",
    "pops": "我物理不及格|G=mg 突然攻击我|这换算我服了|主锁 22kN 更狠|单位失忆症+1|这题我举手",
    "flower": "",
    "fmt": "compare"
  },
  {
    "id": "fmt_cmp_02",
    "q": "「到点下班」和「到点被裁」，是同一枚硬币",
    "type": "kepu",
    "opts": "",
    "ans": "看谁承担成本",
    "points": "AI 把周报、表格、纪要压到几分钟\n门槛降到一分钱，用不用都成了压力\n省下的人力成本，落到谁身上还没定",
    "hammers": "几分钟|一分钱|没定",
    "takeaway": "先问省下的时间归谁，再谈效率",
    "hook": "1 分钱把算力摆上了货架",
    "flip": "效率涨了，焦虑也涨了",
    "notes": "同一件事，从老板那头和员工那头看不一样|「别人在用」比技术本身更让人紧张|工具变便宜，不等于位置变稳",
    "cta": "你那边是哪种感受？",
    "src": "新京报 / 澎湃新闻 / 界面新闻",
    "heat": "热搜阅读 287.9 万 · 10 万份月卡",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "neon",
    "evidence": "有依据",
    "evidenceDate": "2026-11-02",
    "ask": "AI 只是让人少加班",
    "tags": "效率 / 门槛 / 成本",
    "peak": "半小时售出近 10 万份月卡",
    "pops": "我周报刚交给 AI|这硬币我两面都见过|一分钱我买了|省下的归谁呢|我们组已经在用了|这话太真实",
    "flower": "",
    "fmt": "compare"
  },
  {
    "id": "fmt_num_01",
    "q": "2 万亿这个数字，被放大了一万倍",
    "type": "kepu",
    "opts": "",
    "ans": "是总额不是单份",
    "points": "2 万亿是 10 万份月卡加起来的总额\n摊到每份约 2000 万 Token\n轻度用户一个月大约 30 万就够用",
    "hammers": "10 万份|2000 万|30 万",
    "takeaway": "先问分母，再看量级",
    "hook": "标题把所有人唬了一下",
    "flip": "把「总计」写成「一份」，冲击完全不同",
    "notes": "分母一写出来，数字立刻不吓人了|写文档做分析，月耗通常 100–200 万|看到大数，先找它被谁除过",
    "cta": "你第一眼看成销售额了吗？",
    "src": "新京报 / 澎湃新闻 / 界面新闻",
    "heat": "热搜阅读 287.9 万 · 约 2 万亿 Token",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "goldblue",
    "evidence": "有依据",
    "evidenceDate": "2026-11-02",
    "ask": "2 万亿是天文数字",
    "tags": "总额 / 单份 / 月耗",
    "peak": "一份月卡促销价只有 1 分钱",
    "pops": "我以为 2 万亿销售额|分母呢|每份摊下来没多少|我一个月才 30 万|小数位唬人|这表谁做的",
    "flower": "",
    "fmt": "number"
  },
  {
    "id": "fmt_num_02",
    "q": "4831.6 万阅读背后，只有一个 9 倍",
    "type": "kepu",
    "opts": "",
    "ans": "效率是真的",
    "points": "人工灌装一分钟最多 16 瓶\n自动化线一分钟能灌 157 瓶\n差的是近 9 倍，不是 54 亿那个数",
    "hammers": "16 瓶|157 瓶|9 倍",
    "takeaway": "把效率和营收分开看，数字才有用",
    "hook": "热搜第一挂了一整天",
    "flip": "标题里两个数，只有一个讲得清",
    "notes": "效率和营收是两套账，别混着读|同一条产线，改的是节拍不是配方|评论区的情绪，其实冲着岗位去的",
    "cta": "你先注意到哪个数？",
    "src": "搜狐新闻 / 微博热搜",
    "heat": "热搜第一 · 阅读 4831.6 万",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "goldblue",
    "evidence": "有依据",
    "evidenceDate": "2026-10-13",
    "ask": "热搜说的是赚了 54 亿",
    "tags": "节拍 / 产能 / 口径",
    "peak": "话题阅读量达到 4831.6 万",
    "pops": "54 亿我先看见了|16 到 157 有点猛|这账得拆开|评论区在聊别的|我盯着标题看了半天|节拍这个词好",
    "flower": "",
    "fmt": "number"
  },
  {
    "id": "fmt_story_01",
    "q": "十几秒，一块石片，1.2 亿次播放",
    "type": "kepu",
    "opts": "",
    "ans": "松弛感最难复刻",
    "points": "石片与水面约 20 度时最容易连跳\n流速快压强小，水体给了一记托举\n江岸、江水、石块，全是自然元素",
    "hammers": "20 度|托举|自然元素",
    "takeaway": "入口是好奇心，不是知识的门牌号",
    "hook": "工友随手拍的，没有剪辑",
    "flip": "无特效无剧本，反而传得最远",
    "notes": "角度、初速度、转速都得凑齐|《自然》刊过高速摄像的相关研究|成年人模仿不来那份不使劲的劲儿",
    "cta": "你小时候能打几个？",
    "src": "经视直播（湖北广播电视台）",
    "heat": "全球累计播放 1.2 亿次",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "winter",
    "evidence": "有依据",
    "evidenceDate": "2025-08-28",
    "ask": "爆款得靠特效和脚本",
    "tags": "夹角 / 伯努利 / 共鸣",
    "peak": "全球累计播放突破 1.2 亿次",
    "pops": "我小时候能打五个|这事我练过|江边我熟|角度记住了|这松弛感学不来|看完想去捡石头",
    "flower": "",
    "fmt": "story"
  },
  {
    "id": "fmt_story_02",
    "q": "后来，那条混剪被法务固证了",
    "type": "kepu",
    "opts": "",
    "ans": "两件事得分开看",
    "points": "混剪里的「死苍蝇」没有权威报道能对上号\n被监管通报、消费者坐实的旧账是另一串\n品牌称数千条内容高度雷同，已固证投诉",
    "hammers": "没对上号|另一串|固证",
    "takeaway": "热搜会反转，逐条核比站队有用",
    "hook": "热搜第一只挂了一天",
    "flip": "舆论从「惊叹」翻到「谁在造」",
    "notes": "同一条视频里，真问题和假料可能混在一起|投诉过万条、约七成关食品安全，这是另一组数|「全假」和「全真」都不如逐条核",
    "cta": "你一般等到反转吗？",
    "src": "网易 / ZAKER 新闻转山姆声明",
    "heat": "热搜第一 · 阅读 2274.6 万 · 讨论 880",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "winter",
    "evidence": "有依据",
    "evidenceDate": "2026-10-19",
    "ask": "热搜混剪就是全部事实",
    "tags": "混剪 / 旧账 / 固证",
    "peak": "话题阅读量 2274.6 万、讨论量 880",
    "pops": "我等到反转了|先别站队|这混剪我刷到过|旧账也得算|逐条核太累了|我卡都没办",
    "flower": "",
    "fmt": "story"
  },
  {
    "id": "fmt_debate_01",
    "q": "AI 短剧 5 亿播放，评论区分成两派",
    "type": "kepu",
    "opts": "",
    "ans": "先分清两派",
    "points": "一派说 3 人 48 小时做出 80 集是范式变了\n一派说 3000 元、5 亿播放都经不起核\n导演澄清后，焦点从技术转向营销",
    "hammers": "范式|经不起核|营销",
    "takeaway": "先对齐口径，再判断站哪边",
    "hook": "从爆火到反转只隔了几天",
    "flip": "一派看效率，一派看数据注水",
    "notes": "两边争的其实不是同一件事|成本口径和播放口径，谁都没先摊开|「颠覆」和「炒作」可以同时成立",
    "cta": "你更在意哪一派的说法？",
    "src": "澎湃新闻 · 苗建信息舆情监测",
    "heat": "3.24 万条声量 · PBI 37.56 · 17 个热搜",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "grape",
    "evidence": "有依据",
    "evidenceDate": "2026-03",
    "ask": "这肯定是技术颠覆",
    "tags": "效率 / 注水 / 澄清",
    "peak": "17 个话题登上 7 个平台热搜榜",
    "pops": "我站效率那派|我先等澄清|80 集我服了|这波营销我服|别急着封神|原文我存了",
    "flower": "",
    "fmt": "debate"
  },
  {
    "id": "fmt_debate_02",
    "q": "「品质暴跌」和「AI 造谣」，评论区各占一半",
    "type": "kepu",
    "opts": "",
    "ans": "两个都不全对",
    "points": "品牌称部分商品压根没在店里卖过\n市场监管部门当年约谈过并成立整改组\n微博话题下 28% 用户仍认「品质真不行了」",
    "hammers": "没卖过|约谈|28%",
    "takeaway": "两种极端都不用急着选，先看逐条证据",
    "hook": "680 块的卡成了话题中心",
    "flip": "一边是数千条雷同内容，一边是一长串旧账",
    "notes": "「全是黑公关」堵不住所有疑问|「全是真的」也对不上没上架的商品|付费会员续卡率 92%，心里那杆秤却在晃",
    "cta": "你更信哪边的数据？",
    "src": "网易 / ZAKER 新闻 · 黑猫投诉 · 市场监管总局通报",
    "heat": "热搜第一 · 阅读 2274.6 万 · 会员 1070 万",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "grape",
    "evidence": "有依据",
    "evidenceDate": "2026-10",
    "ask": "热搜说的全是真的",
    "tags": "雷同内容 / 旧账 / 体感",
    "peak": "黑猫投诉已突破 1.5 万条",
    "pops": "我两边都刷到了|先把卡退了再说|续卡率 92% 挺微妙|逐条核吧|我先看看货架|这题没有标准答案",
    "flower": "",
    "fmt": "debate"
  },
  {
    "id": "fmt_myth_01",
    "q": "石片要斜着 20 度，才跳得起来",
    "type": "kepu",
    "opts": "",
    "ans": "角度最挑",
    "points": "石片与水面约 20 度时最容易多次弹跳\n水体流速加快、压强减小，产生托举\n初速度、转速、材质一起决定结果",
    "hammers": "20 度|压强|转速",
    "takeaway": "先找角度，再谈力气",
    "hook": "这事被高速摄像拍清楚了",
    "flip": "不是甩得狠，是贴得巧",
    "notes": "角度不对，力气再大也只沉一下|扁、薄、带旋转，比蛮力管用|《自然》上的实验用的是高速摄像",
    "cta": "你之前是靠蛮力吗？",
    "src": "经视直播援引《自然》相关研究",
    "heat": "全球累计播放 1.2 亿次",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "forest",
    "evidence": "有依据",
    "evidenceDate": "2025-08-28",
    "ask": "力气大就弹得多",
    "tags": "夹角 / 托举 / 转速",
    "peak": "一段十几秒的原始片段拿到 1.2 亿播放",
    "pops": "我一直甩得特别狠|下次不甩蛮力了|扁石头得挑|角度比蛮力管用|下次去江边试|这冷知识我喜欢",
    "flower": "",
    "fmt": "myth"
  },
  {
    "id": "fmt_myth_02",
    "q": "实验室最出圈的不是结论，是过程",
    "type": "kepu",
    "opts": "",
    "ans": "过程更抓人",
    "points": "两个星期换来一次微小成功是常态\n实验没结果的那半天也照拍\n学生物老师把视频搬进了课堂辅助素材",
    "hammers": "两个星期|没结果|进课堂",
    "takeaway": "别只给结论，把过程也端上来",
    "hook": "连失败的实验都有人追更",
    "flip": "屏幕里放的是「科学正在发生」",
    "notes": "真实感来自没剪掉的重复劳动|「小酵母叫小美」比术语先被记住|先愿意看，才轮到听懂",
    "cta": "你喜欢看过程还是结论？",
    "src": "中国新闻网",
    "heat": "LabTour 话题播放 1.6 亿次",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "forest",
    "evidence": "有依据",
    "evidenceDate": "2025-06",
    "ask": "科普得先给一个漂亮结论",
    "tags": "重复 / 失败 / 课堂",
    "peak": "相关话题播放量已超过 1.6 亿次",
    "pops": "失败那期我也看了|小美这名字绝了|老师真的放了|比课本好懂|过程更真实|我追更了",
    "flower": "",
    "fmt": "myth"
  },
  {
    "id": "fmt_warn_01",
    "q": "看到精确百分比，先找分母",
    "type": "kepu",
    "opts": "",
    "ans": "先查口径",
    "points": "「99.21%」查不到发布机构和样本方法\n「5.2%」把累计比例写成了年死亡率\n死亡率通常按千分率，不是百分率",
    "hammers": "查不到|累计|千分率",
    "takeaway": "先找分母，再看小数位",
    "hook": "几个「报告」长得都挺像",
    "flip": "精确不等于真实，样本才是",
    "notes": "百分比先问：谁、多少份、哪一年|平台和辟谣榜都收过这几条|小数位会让人误以为有人算过",
    "cta": "你被哪个百分数唬过？",
    "src": "中国互联网联合辟谣平台",
    "heat": "2025-09-28 平台收录，无单一播放量级",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "tomato",
    "evidence": "有依据",
    "evidenceDate": "2025-09-28",
    "ask": "有小数位就很可信",
    "tags": "样本 / 口径 / 千分率",
    "peak": "平台在 2025-09-28 收录了相关辟谣",
    "pops": "分母呢|我第一眼信了|这报告哪来的|小数位唬人|先存个辟谣|我转给家族群了",
    "flower": "",
    "fmt": "warn"
  },
  {
    "id": "fmt_warn_02",
    "q": "这一秒别划走：热搜混剪里混着没对上号的东西",
    "type": "kepu",
    "opts": "",
    "ans": "逐条核",
    "points": "被反复剪进去的「死苍蝇」暂无权威报道对上号\n被监管通报、消费者坐实的旧账确实存在\n雷同内容集中扩散，也可能是营销动作",
    "hammers": "没对上号|确实存在|雷同",
    "takeaway": "节奏越快，越要逐条核",
    "hook": "画面一条接一条，节奏特别快",
    "flip": "快到没给核对留时间",
    "notes": "混剪把真的、没核的、编的压进同一条|快节奏本身就会绕过核对|把「逐条」当成习惯，比站队省事",
    "cta": "你会等下一条再判断吗？",
    "src": "网易 / ZAKER 新闻 · 山姆声明",
    "heat": "热搜第一 · 阅读 2274.6 万",
    "category": "平台热梗与传播现象",
    "catKey": "platform",
    "tpl": "tomato",
    "evidence": "有依据",
    "evidenceDate": "2026-10-19",
    "ask": "一条视频就能盖棺定论",
    "tags": "混剪 / 核对 / 节奏",
    "peak": "话题阅读 2274.6 万、讨论量 880",
    "pops": "我差点直接转|节奏太快了|一条一条看|先按暂停|这条我刷到过|慢一拍再判断",
    "flower": "",
    "fmt": "warn"
  }
];
HOT_TOPICS=HOT_TOPICS.concat(TOPIC_EXTRA,FORMAT_TOPICS);
/* ════════════════════════════════════════════════════════════════════════
   大众科普文案层（v8.3） · 目标人群＝全年龄，不只是短视频老手
   ────────────────────────────────────────────────────────────────────────
   此前整套文案是综艺黑话：花字「到不了」「真假的」「最离谱」，
   弹幕「血管：谢谢关心」「我前额叶：还在排队」，眉标「这说法你多半听过」，
   峰值「最离谱的是…」，CTA「你原先选了啥？」。
   抽象、零信息、预设观众懂梗，中老年观众完全读不出在讲什么。
   本层做四件事（都是「把事说清楚」而非「把气氛做热闹」）：
     ① 题干解释 explain：这道题到底在问什么，落到具体对象与机制
     ② 名词白话 gloss：出现术语就用一句大白话解释，不假设观众懂
     ③ 六帧贴纸位改「常见说法 / 名词解释 / 依据 / 结论」，不再玩梗
     ④ 花字、峰值、CTA、口播从情绪词换成信息词，视觉冲击力保留
   原短视频文案保存在 T._short，关掉「面向大众」即可逐字还原。
   ════════════════════════════════════════════════════════════════════════ */
var GLOSS={
 '鞣酸':'柿子涩味的来源，遇蛋白质会结块','高鞣酸':'涩味物质多，容易和蛋白质抱团',
 '胃排空':'食物从胃进入小肠的过程','髓鞘':'神经外面那层绝缘皮，让信号传得快',
 '前额叶':'大脑里管计划、克制和刹车的区域','黄曲霉毒素':'霉变产生的毒素，普通蒸煮去不掉',
 '二氧化氯':'消毒卡放出的气体，通风处攒不起浓度','微安':'极小的电流，是毫安的千分之一',
 '焦糖化':'高温把淀粉转成糖，自然就出香','酸碱度':'血液酸碱由肺和肾稳定调控',
 '血管斑块':'长在血管壁里的脂质沉积，不是水垢','剂量':'离开吃了多少，谈毒性没有意义',
 '紫外线':'阳光里晒伤皮肤的那部分光','UV':'紫外线的英文缩写',
 '相对湿度':'空气里水汽的多少，越干越易起静电','静电':'摩擦攒下的电荷，一碰金属就放掉',
 '能量':'真正造成伤害的是能量，不是电压数字','电荷':'摩擦后停在物体表面的电',
 '巴纳姆效应':'越笼统的描述，越容易觉得"说的就是我"','实验舱':'密闭小空间，和通风房间不是一回事',
 '分母':'算比例时要看的总数，别只看分子','对照':'一组做、一组不做，才比得出差别',
 '双盲':'医生和患者都不知道分到哪组，减少心理影响','挥发性':'容易变成气体散到空气里',
 '渗透压':'水里盐糖浓度，决定细胞吸水还是失水','味觉':'舌头上尝味道的能力',
 '嗅觉':'鼻子里闻气味的能力，干燥时会变钝','客舱低压':'机舱气压比地面低，嗅觉先受影响',
 '三高':'血压、血糖、血脂偏高','肺和肾':'身体里负责稳定酸碱的两个器官',
 '香精':'人工添加的香味物质，需要检测才能认定','除菌率':'在特定实验条件下杀掉细菌的比例',
 '密闭实验':'把样品和细菌关在小盒子里测','通风':'空气流动，气体浓度会被吹淡',
 '超级食物':'多半是营销说法，不是医学概念','处方药':'医生开的、需要按剂量服用的药',
 '相克':'两种食物同吃会中毒的说法，缺乏病例','不新鲜':'食材存放过久，微生物超标',
 '雪地反射':'雪面把紫外线反射回来，晒伤更狠','高海拔':'海拔每升高，紫外线更强',
 '1600N':'力的单位牛顿，不是体重','隐翅虫':'一种小甲虫，体液沾皮肤会发炎',
 '消毒卡':'挂在身上、宣称能防流感的小挂件','流感':'由流感病毒引起的呼吸道传染病',
 '口罩':'靠物理阻挡飞沫，比挂件可靠','检测报告':'第三方机构出具的实测结果',
 '焦糖':'糖高温变色产生的物质与香味','淀粉':'米面薯类里的主要碳水',
 '蛋白质':'肉蛋奶里的营养成分','微生物':'细菌霉菌等肉眼看不见的小生物',
 '脑血管':'给大脑供血的血管','软化血管':'民间说法，血管硬化不能靠吃喝逆转',
 '醋酸':'食醋里的主要酸性成分，属于弱酸','胃液':'胃分泌的强酸性消化液',
 '脂质沉积':'胆固醇等脂类在血管壁内堆积','水垢':'水壶里的矿物沉淀，和血管斑块不是一回事',
 '代谢':'身体把物质分解、转化并排出的过程','缓冲系统':'身体把酸碱度拉回正常范围的一套调节机制',
 '二氧化碳':'人呼出的气体，蚊子能远距离感知它','入射角':'石片接触水面时与水面的夹角',
 '治疗性疫苗':'给已患病者用的治疗手段，不是给健康人预防的',
 '碳水':'米面糖等碳水化合物','锰':'不锈钢合金里的一种金属元素，正常使用时被固定在合金中'
};
/* ══ 背景事实表（v9）═══════════════════════════════════════════════
   上一版 18 条全是「问的是：…」——把问句改成陈述，零知识增量，
   用户说「别这么抽象，要专业一点」指的就是这个。
   现在每条给一条**可核对的背景事实**：具体机制 / 数值 / 机构口径，
   用大白话说，但不省略专业信息；不下结论、不剧透答案。
   ═══════════════════════════════════════════════════════════════ */
var BACKGROUND={
 'vinegar':'食醋里的醋酸是弱酸，进入胃后先被胃液稀释；血液酸碱度由肺和肾稳定在 7.35～7.45，不随食物改变',
 'static':'化纤摩擦可积累上万伏静电，但放电电流只有微安级、持续几毫秒；造成伤害看能量，不看电压数字',
 'mooncake':'柿子含鞣酸，遇高蛋白食物会结块；「食物相克致中毒」缺乏临床病例，不适多来自吃得太杂或不新鲜',
 'forehead':'前额叶负责计划、克制与判断，其髓鞘化持续到二十多岁；发育是连续过程，个体差异很大',
 'mold':'黄曲霉毒素约 280℃ 才分解，家里蒸煮远达不到；霉菌菌丝会钻进馒头内部，切掉表面看不见的部分不够',
 'card':'消毒卡标称的 99% 除菌率来自密闭实验舱；教室、地铁持续通风，二氧化氯气体浓度会很快被稀释',
 'superfood':'食物中的活性成分不等于药物剂量；芹菜、苦瓜不能替代降压降糖的处方治疗',
 'sweetpotato':'高温烘烤让淀粉转成糖并产生焦糖香，香气本来就浓；是否添加香精要靠检测报告认定',
 'airplane':'机舱干燥、气压低于地面，嗅觉先变钝；研究显示咸味与甜味感知约下降三成，航食因此调得更重口',
 'shrimp':'虾中的砷多以低毒有机形态存在；要达到有害剂量，需一次吃下上百公斤海鲜并同时大量摄入维 C',
 'noodle':'「泡面 32 小时不消化」未见可靠出处；胃排空通常按小时计，与面团质地、配餐有关',
 'soysauce':'生抽主要提咸鲜，老抽主要给菜肴上色；两者差别在工艺与用途，不在「谁更咸」',
 'windshield':'前挡起雾是车内湿气遇冷凝结；冷风能快速除雾，暖风慢一些但更彻底、不易反复',
 'mosquito':'蚊子主要靠二氧化碳、体温和皮肤挥发物定位；「血型招蚊子」目前证据不足',
 'powerbank':'鼓包说明锂电池内部已产气、结构受损；继续充放电存在热失控风险',
 'mask':'口罩靠物理阻挡飞沫，消毒卡靠释放气体；两者的防护原理与适用条件不同',
 'egg':'蛋壳颜色由母鸡品种决定；蛋白质、脂肪与微量营养素含量与壳色无关',
 'microwave':'微波让食物里的水分子振动生热，停止加热即停止；不会让食物残留辐射'
};
/* 判定口径：告诉观众「要判这句话，得看哪几件事」，而不是空喊「看依据」 */
var BASIS={
 'vinegar':'看两件事：醋酸能否接触血管斑块、食物能否改变血液酸碱度',
 'static':'把电压和放电能量分开看，再看有没有可燃气体',
 'mooncake':'看有没有病例、看食材是否新鲜、看一次吃了多少',
 'forehead':'看是群体统计还是个人诊断，别把连续过程当成开关',
 'mold':'看加热温度能否破坏毒素，以及霉菌是否已深入内部',
 'card':'看实验条件是密闭还是通风，再看有没有第三方检测',
 'superfood':'看剂量、看有无临床证据，用药请遵医嘱',
 'sweetpotato':'看有没有检测报告，「可能」两个字不是结论',
 'airplane':'看味觉实验条件，再看航食配方是否已相应调整',
 'shrimp':'看剂量与化学形态，脱离剂量谈毒性没有意义',
 'noodle':'看说法有没有可查的原始出处',
 'soysauce':'看配料表与用途，别只凭颜色深浅判断',
 'windshield':'看起雾原因在车内还是车外，再选冷风或暖风',
 'mosquito':'看对照实验有没有控制二氧化碳与体温',
 'powerbank':'看电芯是否鼓包漏液，不以「还能充上电」为准',
 'mask':'看防护原理与适用场景是否一致',
 'egg':'看营养成分检测，不看壳色',
 'microwave':'看加热原理，别把「加热」和「带辐射」混为一谈'
};
function basisFor(T){
  var id=String(T.id||'').replace(/^ext_/,'');
  if(BASIS[id])return BASIS[id];
  if(String(T.q||'').indexOf('喝醋')>=0)return BASIS.vinegar;
  var pts=String(T.points||'').split('\n').filter(Boolean);
  return '看依据：有没有检测或对照、剂量够不够、条件是否一致';
}
function backgroundFor(T){
  var id=String(T.id||'').replace(/^ext_/,'');
  if(BACKGROUND[id])return BACKGROUND[id];
  if(String(T.q||'').indexOf('喝醋')>=0)return BACKGROUND.vinegar;
  /* 兜底用该题前两条要点拼成一句：机制陈述比「问的是…」有信息量得多。
     单条太短时补上判定条件，保证背景行不是一句孤零零的残话。
     绝不再写「问的是：X，依据是什么」这种元话术。 */
  var pts=String(T.points||'').split('\n')
    .map(function(x){return String(x||'').replace(/[。！？!?；;]+$/,'').trim();}).filter(Boolean);
  var bg=(pts.slice(0,2).join('；')||'先看公开资料里的原始依据').trim();
  if(bg.length<18)bg+='；判断时还要看适用条件与原始依据';
  return bg;
}
/* 按 tags / q 里出现的术语，挑一条最贴题的白话解释 */
function pickGloss(T){
  var hay=String(T.tags||'')+' '+String(T.q||'')+' '+String(T.points||'');
  var best='',bl=0,term='';
  Object.keys(GLOSS).forEach(function(k){
    if(hay.indexOf(k)>=0&&k.length>bl){best=GLOSS[k];bl=k.length;term=k;}
  });
  if(best)return best;
  var t=String(T.tags||'').split(/[\/|,，、]+/).map(function(x){return x.trim();}).filter(Boolean)[0];
  return t?'「'+t+'」是本题的关键概念，后面按依据逐条说明':'先看公开资料里的原始依据';
}
/* 大众版「名词」行：术语名 + 白话，缺了术语名就不像解释 */
function glossLineFor(T){
  var hay=String(T.tags||'')+' '+String(T.q||'')+' '+String(T.points||'');
  var best='',bl=0,term='';
  Object.keys(GLOSS).forEach(function(k){
    if(hay.indexOf(k)>=0&&k.length>bl){best=GLOSS[k];bl=k.length;term=k;}
  });
  if(best)return term+'：'+best;
  var tags=String(T.tags||'').split(/[\/|,，、]+/).map(function(x){return x.trim();}).filter(Boolean);
  var t=tags[0]||'关键概念';
  /* 兜底也必须带术语名 + 白话，不能只回一句「本题的关键概念」 */
  return t+'：'+(String(T.gloss||'')||'本题的关键条件，判断时先看定义与适用范围');
}
function gcut(x,n){x=String(x||'').replace(/[？?。！!，,、：:；;\s]/g,'').trim();
  return x.length<=n?x:x.slice(0,n);}
/* 六条贴纸：不再是玩梗弹幕，改成有信息量的四段式 */
function glossFor(term,fallback){
  var t=String(term||'').trim(),hit='',best=0;
  Object.keys(GLOSS).forEach(function(k){
    if(t&&(t.indexOf(k)>=0||k.indexOf(t)>=0)&&k.length>best){hit=GLOSS[k];best=k.length;}
  });
  return hit||fallback;
}
function plainPops(T,glossLine){
  var tags=String(T.tags||'').split(/[\/|,，、]+/).map(function(x){return x.trim();}).filter(Boolean);
  var pts=String(T.points||'').split('\n').map(function(x){return String(x||'').trim();}).filter(Boolean);
  var src=String(T.src||'公开资料').split(/[《（(]/)[0].trim();
  var bg=backgroundFor(T),basis=basisFor(T);
  /* 六帧各一条，全部是有信息量的完整句，不玩梗、不复述大字、不硬截字。
     大众版式另有独立解读面板，这里作为画面右下角的「核对便签」补充。 */
  var g0=glossFor(tags[0],'');
  var gloss=String(glossLine||g0||'');
  var out=[
    '背景：'+bg,
    '白话：'+(g0?((tags[0]||'术语')+'：'+g0):gloss),
    '依据：'+(pts[0]||src),
    '依据：'+(pts[1]||pts[0]||src),
    '判定：'+basis,
    '出处：'+(src||'公开资料')
  ];
  return out.join('|');
}
var PLAIN_CTA=[
 '记住这一条，比争论有用','看清依据，再决定信不信',
 '转给家里人，少走一次弯路','下次遇到，先问一句依据',
 '不必记术语，记住结论就好','以官方发布和专业意见为准'
];
/* 花字：情绪词 → 信息词，爆炸形/描边/阴影全部保留，只换文字立场 */
var PLAIN_FLOWER={
 '真假？':'看依据','选哪个？':'看条件','哪几个？':'逐条看','为啥？':'看原理',
 '啊？':'先核实','别划走':'看依据','信了？':'看依据','全选？':'逐条看',
 '其实':'实际上','最离谱':'关键点','记住':'记这条',
 '等等':'看机制','先看这':'看依据','别急':'看条件','不是吧':'查依据',
 '好家伙':'有依据','懂了':'讲清了','破案了':'有结论','原来是':'看原理','离谱':'看条件',
 '维修中':'看发育','别慌':'看机制','鼻子先钝':'看条件','别蒸了':'看温度',
 '别扔啊':'看依据','压压惊':'看依据','别信':'先核实','3 条':'分三条',
 '差在这':'区别在','看数字':'看数据','后来呢':'看经过','吵翻了':'两种说法',
 '原来':'有出入','停一下':'请注意','到不了':'看依据','没检测':'缺检测',
 '不是药':'别替药','一卡车':'看剂量','99%？':'看条件','有区间':'看区间',
 '用反了':'看顺序','造的词':'看定义','白喝了':'看代谢','别泡了':'看机制',
 '先别答':'先核实','18000V':'18000V','280℃':'280℃'
};
var GEN_FLOWERS={};
Object.keys(PLAIN_FLOWER).forEach(function(k){GEN_FLOWERS[PLAIN_FLOWER[k]]=1;});
/* 拆解帧信息词池（flowerFor 在大众向直接取用），也必须进白名单 */
['看机制','看依据','看过程','看对象','看条件','看剂量','看范围','看前提','看单位',
 '关键点','实际上','记这条','看发育','看温度','看数据','看经过','两种说法',
 '有出入','请注意','先核实','分三条','区别在','看区间','看顺序','看定义','看代谢',
 '有依据','有结论','讲清了','查依据'].forEach(function(w){GEN_FLOWERS[w]=1;});
var PLAIN_EN={
 '看依据':'CHECK THE EVIDENCE','看条件':'CHECK THE CONDITION','逐条看':'POINT BY POINT',
 '看原理':'HOW IT WORKS','先核实':'VERIFY FIRST','实际上':'ACTUALLY','关键点':'KEY POINT',
 '记这条':'REMEMBER THIS','看机制':'THE MECHANISM','查依据':'CHECK THE SOURCE',
 '有依据':'WITH EVIDENCE','讲清了':'EXPLAINED','有结论':'THE CONCLUSION',
 '看发育':'DEVELOPMENT','看温度':'TEMPERATURE','看数据':'THE DATA',
 '看经过':'WHAT HAPPENED','两种说法':'TWO VIEWS','有出入':'NOT QUITE',
 '请注意':'PLEASE NOTE','看路径':'THE PATHWAY','缺检测':'NO TEST',
 '别替药':'NOT MEDICINE','看剂量':'THE DOSE','看区间':'THE RANGE',
 '看顺序':'THE ORDER','看定义':'THE DEFINITION','看代谢':'METABOLISM',
 '分三条':'THREE POINTS','区别在':'THE DIFFERENCE',
 '看过程':'THE PROCESS','看对象':'THE SUBJECT','看范围':'THE RANGE',
 '看前提':'THE PREMISE','看单位':'THE UNIT',
 '别信':'DONT BUY IT','3 条':'THREE THINGS','差在这':'NOT THE SAME',
 '看数字':'THE NUMBER','后来呢':'WHAT HAPPENED','吵翻了':'TWO SIDES',
 '原来':'SO THAT IS IT','停一下':'HOLD ON'
};
/* flip / peak / ans / notes 的少数拟人化说法换成机制陈述 */
var PLAIN_FLIP={
 '没中毒，是胃堵车了':'不是中毒，是吃得太杂、胃排空变慢',
 '是你的鼻子先罢工了':'机舱干燥低压，嗅觉先变钝',
 '鼻子背锅':'机舱干燥，先影响的是嗅觉',
 '电压吓人，能量小得可怜':'电压高，但放电能量极小',
 '蒸得死菌，蒸不死毒素':'加热能杀菌，去不掉已产生的毒素',
 '菜是菜，药是药，不能互换':'食物成分不等于药物疗效',
 '99% 是在小盒子里测的':'99% 来自密闭实验舱，不是通风场所',
 '它不是开关，是个慢活儿':'大脑发育是连续过程，没有统一开关',
 '没检测、没报告，只有一个「可能」':'没有检测报告，"可能"不等于结论',
 '醋酸先过胃，根本到不了斑块':'醋酸先被胃稀释，接触不到血管斑块'
};
var PLAIN_ANS={
 '想多了':'无统一年龄','鼻子背锅':'嗅觉变钝','虚惊一场':'属实但无害',
 '整份丢掉':'整份丢弃','没证据':'缺检测依据','基本没用':'效果有限',
 '菜不是药':'不能替药','不会中毒':'不会中毒','错误':'说法不成立'
};
function toGeneral(T){
  if(T._short)return;
  var K=['flower','pops','peak','flip','ask','q','ans','hook','tags','hammers',
         'notes','points','takeaway','cta','src','heat','explain','gloss','basis','opts'];
  var o={};K.forEach(function(k){o[k]=T[k];});T._short=o;
  var pts=String(T.points||'').split('\n').filter(Boolean);
  var gloss=pickGloss(T);
  var bg=backgroundFor(T),basis=basisFor(T);
  T.explain=bg;T.gloss=glossLineFor(T);T.basis=basis;
  /* 13 道判断题原先没写 opts，钩子帧空一块；科普/解说无选项是设计，不补。
     判断题统一「正确 / 错误」，面向大众也一眼知道要选什么。 */
  if(!T.opts&&String(T.type)==='judge')T.opts='正确|错误';
  T.hook=bg;                                    /* 眉标位改放可核对的背景事实 */
  T.flower=PLAIN_FLOWER[String(T.flower||'')]||'看依据';
  T.pops=plainPops(o,gloss);                  /* 用原始 ask/points 生成，避免二次改写 */
  T.peak=String(pts[pts.length-1]||T.peak||'').trim();
  if(PLAIN_FLIP[T.flip])T.flip=PLAIN_FLIP[T.flip];
  if(PLAIN_ANS[T.ans])T.ans=PLAIN_ANS[T.ans];
  /* 贴纸/补充条不再是拟人玩梗：改「名词白话 + 三条依据」 */
  /* 完整句，不硬截：上一版 gcut 又造出「依据：喝进去的酸先被胃」这类半截话 */
  T.notes=[gloss,'依据：'+String(pts[0]||''),'依据：'+String(pts[1]||pts[0]||''),
           '依据：'+String(pts[2]||pts[1]||pts[0]||'')].join('|');
  var h=0,st=String(T.id||T.q||'');for(var i=0;i<st.length;i++)h=(h*31+st.charCodeAt(i))>>>0;
  T.cta=PLAIN_CTA[h%PLAIN_CTA.length];
}
function setAudience(on){
  var all=HOT_TOPICS.concat(Object.keys(PRESETS).map(function(k){return PRESETS[k];}));
  all.forEach(function(T){
    if(!T)return;
    if(on){toGeneral(T);}
    else if(T._short){Object.keys(T._short).forEach(function(k){T[k]=T._short[k];});delete T._short;}
  });
  if(on){
    FORMATS.forEach(function(F){
      if(F._short)return;F._short={flower:F.flower,en:F.en,kicker:F.kicker,
        chip:F.chip,cta:F.cta,qdemo:F.qdemo};
      F.flower=PLAIN_FLOWER[F.flower]||'看依据';
      F.en=PLAIN_EN[F.flower]||F.en;
      F.kicker='先把依据摊开';F.chip='看依据';
      F.cta='看清依据，再决定信不信';
      F.qdemo=String(F.qdemo).replace('最上头','最常见').replace('吵翻了','有两种说法');
    });
  }else{
    FORMATS.forEach(function(F){if(F._short){Object.keys(F._short).forEach(function(k){F[k]=F._short[k];});delete F._short;}});
  }
  return all.length;
}


/* ══ 模板库 v6.4：12 套，按题材配套 ═══════════════════════════════
   只换渐变底色与爆炸形配色，永远是「深底 + 白字 + 深描边」，
   不为题材配色牺牲可读性（浅底会让综艺花字看不清）。 */
var TPL_META=[
 {k:'pop',     name:'爆款撞色', sub:'粉黄蓝',   fit:'通用 / 强冲突',   group:'通用'},
 {k:'neon',    name:'赛博霓虹', sub:'青蓝紫',   fit:'物理 / 科技',     group:'通用'},
 {k:'hot',     name:'热点红',   sub:'红黄',     fit:'消费避坑 / 辟谣', group:'通用'},
 {k:'lime',    name:'青柠清爽', sub:'绿青',     fit:'自然 / 轻松',     group:'通用'},
 {k:'clinic',  name:'医院蓝白', sub:'青蓝+橙',  fit:'健康医学',        group:'题材'},
 {k:'tomato',  name:'番茄米白', sub:'番茄红',   fit:'食品安全',        group:'题材'},
 {k:'clay',    name:'暖橙陶土', sub:'橙棕',     fit:'厨房 / 日用品',   group:'题材'},
 {k:'grape',   name:'紫灰冷白', sub:'紫灰',     fit:'热梗 / 伪心理',   group:'题材'},
 {k:'winter',  name:'雾蓝雪白', sub:'灰蓝',     fit:'季节 / 节气',     group:'题材'},
 {k:'forest',  name:'墨绿米',   sub:'墨绿',     fit:'动物 / 人体',     group:'题材'},
 {k:'goldblue',name:'蓝金图表', sub:'蓝金',     fit:'数字 / 统计',     group:'题材'},
 {k:'paperink',name:'宣纸朱砂', sub:'朱砂',     fit:'国风 / 谚语',     group:'题材'}
];
var CAT_LIST=['全部','健康医学误区','食品安全与食物相克','生活物理与自然冷知识',
 '厨房与日用品常识','网络热梗与伪心理学','消费避坑与虚假宣传',
 '季节/节气与日常冷知识','动物与人体冷知识','数字/统计类反直觉',
 '平台热梗与传播现象'];
var CAT_TPL={'健康医学误区':'clinic','食品安全与食物相克':'tomato',
 '生活物理与自然冷知识':'neon','厨房与日用品常识':'clay',
 '网络热梗与伪心理学':'grape','消费避坑与虚假宣传':'hot',
 '季节/节气与日常冷知识':'winter','动物与人体冷知识':'forest',
 '数字/统计类反直觉':'goldblue','平台热梗与传播现象':'grape'};
/* 原有 16 条话题没有 category 字段，按 id 归类，不改历史数据 */
var CAT_OF_ID={forehead:'网络热梗与伪心理学',mooncake:'食品安全与食物相克',
 airplane:'生活物理与自然冷知识',static:'生活物理与自然冷知识',
 mold:'食品安全与食物相克',sweetpotato:'食品安全与食物相克',
 card:'消费避坑与虚假宣传',superfood:'健康医学误区',
 shrimp:'食品安全与食物相克',mosquito:'动物与人体冷知识',
 noodle:'食品安全与食物相克',skipping:'生活物理与自然冷知识',
 kettle:'厨房与日用品常识',vaccine:'网络热梗与伪心理学',
 carbface:'网络热梗与伪心理学',soy:'厨房与日用品常识'};
function guessCat(T){
  return T.category||CAT_OF_ID[T.id]||'生活物理与自然冷知识';
}
function tplFor(T){return T.tpl||CAT_TPL[guessCat(T)]||'pop';}


var S={
  step:1, ratio:'9:16', theme:'ink', tpl:'pop', layout:'burst', fmt:'quiz', scale:1, sub:true, sound:true,
  audience:true, skeleton:'paper', explain:'', gloss:'', basis:'',
  type:'judge', q:'喝醋能软化血管、清除血栓吗？', opts:'正确|错误', ans:'错误',
  points:'醋酸进到胃里，先被稀释，再被吸收代谢\n'+
         '血管里的斑块，不是能被酸泡掉的污垢\n'+
         '血液酸碱度由肺和肾牢牢调控',
  src:'国家卫生健康委员会官网',
  hook:'问的是：喝进胃里的醋，能否碰到血管斑块',
  coverTitle:'', column:'帧语 · 每日一题', issue:'NO. 001',
  disclaimer:DEFAULT_DISCLAIM, cta:'记住这一条，比争论有用',
  tags:'',hammers:'',notes:'',takeaway:'',ask:'',topicId:'',topicHeat:'',
  useCover:false, autoFit:true, guide:false, fit:1,
  showOpts:true, autoTpl:true, topicCat:'全部', topicFmt:'全部', category:'',
  voice:'zh-CN-XiaoxiaoNeural', rate:1, vUrl:'', conc:4,
  bgmBuf:null,bgmName:'',bgmSel:'off',bgmLicense:'',bgmLocal:null,
  /* 字幕 · 水印 · 片尾（默认值 = 当前已认可的观感，零视觉变化） */
  subSync:true, subMode:'always', subPos:'bottom', subScale:1, subWrap:0,
  subX:50, subY:86, subFg:'', subBg:'', subAccent:'',
  subTw:false, subTwSpeed:1,
  wmText:'', wmPos:'right-top', wmAlpha:.18, wmSize:1,
  endHold:0, endClose:'', endSrcOn:false,
  /* 流程音效 / 五路混音 */
  sfx:{cover:'off',hook:'off',flip:'off',l1:'off',l2:'off',l3:'off',end:'off',count:'off'},
  sfxCustom:new Map(), duckOn:true,
  vol:{master:1,voice:1,bgm:.35,sfx:1,count:1},
  voiceTake:null, voiceTakeName:'',
  frames:[], total:0, cum:[], t:0, playing:false, cur:-1,
  tts:new Map(), ttsFail:new Set(), ttsBusy:0, ttsDone:0, synthCancel:false,
  raf:0, lastTs:0,
  exporting:false
};
/* 默认面向大众：在 S 就绪后立即生成文案层 */
setAudience(S.audience);
/* S 的初始字段是硬编码的，setAudience 只改数据源；这里把默认题的解释 /
   白话 / 机制补充同步回 S，否则首屏眉标仍是「这说法你多半听过」。 */
(function(){var M=PRESETS[S.type]||PRESETS.judge;
  S.hook=M.hook||'';S.cta=M.cta||'';S.notes=M.notes||'';
  S.takeaway=M.takeaway||'';S.ask=M.ask||'';
  S.explain=M.explain||'';S.gloss=M.gloss||'';S.basis=M.basis||'';S.opts=M.opts||'';
  S.ans=M.ans||S.ans;})();
function rebuildStudio(){
  renderFrame(S.cur<0?0:S.cur);renderChecks();renderSynthList();
  if(window.refreshStudio)window.refreshStudio();
}
var $=function(s){return document.querySelector(s);};
var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s));};
function toast(m){var e=$('#toast');e.textContent=m;e.classList.add('show');
  clearTimeout(window._tt);window._tt=setTimeout(function(){e.classList.remove('show');},2100);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

/* ── 中文词组保护：Intl.Segmenter 切词，每词包 nowrap span ──
   本轮修复：数字 + 单位 / 连字符数据 / 英文缩写必须先整体切出，
   否则「高海拔每升高 1000 米，UV 约增强 10%」会被拆成
   「1000」「 」「米」「UV」「10」「%」六段，断行时数字与单位分家。 */
var SEG=null;try{if(window.Intl&&Intl.Segmenter)SEG=new Intl.Segmenter('zh',{granularity:'word'});}catch(e){}
var PUNC=/^[，。、？！；：,.!?;:）)\]】»」’]+$/;
/* 不可分割片段：数字+单位、20-20-20 型、UV / UVB 型缩写、短英文词 */
var ATOM=/\d[\d,.]*(?:[~～\-]\d[\d,.]*)*\s*(?:%|％|米|克|倍|岁|℃|度|分钟|秒|英尺|厘米|毫米|千米|cm|kg|mm|km|mg|ml|万|亿|人|次|年|天|小时)?|\d+(?:-\d+)+|UV[ABC]?|[A-Za-z]{2,8}/g;
function plainWords(s){
  var toks=[];
  if(SEG){try{var it=SEG.segment(s);for(var g of it)toks.push(g.segment);}catch(e){SEG=null;}}
  if(!toks.length)toks=s.split('');
  var merged=[];
  toks.forEach(function(t){
    if(!t)return;
    if(PUNC.test(t)&&merged.length)merged[merged.length-1]+=t;
    else merged.push(t);
  });
  /* 长汉字块再切 2 字：贪心断行能更贴近右边界 */
  var fine=[];
  merged.forEach(function(w){
    if(w.length>4&&/^[\u4e00-\u9fa5]+$/.test(w)){
      for(var i=0;i<w.length;i+=2)fine.push(w.slice(i,i+2));
    }else fine.push(w);
  });
  /* 后缀单字并入前词（有助于）、介词单字粘后词（被稀释） */
  var VIRT=/^[被把将让使从向对与和或但而则即之其以也]$/,SUFFIX=/^[于乎者矣焉哉]$/,glued=[];
  fine.forEach(function(w){
    if(!glued.length){glued.push(w);return;}
    var last=glued[glued.length-1];
    if(SUFFIX.test(w)&&w.length===1){glued[glued.length-1]=last+w;return;}
    if(VIRT.test(last)){glued[glued.length-1]=last+w;return;}
    glued.push(w);
  });
  /* 纯空格并入前词：不产生独立的「可断空白 span」，避免行首冒出半格空格 */
  var spaced=[];
  glued.forEach(function(w){
    if(/^\s+$/.test(w)&&spaced.length){spaced[spaced.length-1]=spaced[spaced.length-1].replace(/\s+$/,'');return;}
    spaced.push(w);
  });
  return spaced.length?spaced:[s];
}
function segWords(text){
  var s=String(text||''),out=[],last=0,m;ATOM.lastIndex=0;
  while((m=ATOM.exec(s))!==null){
    if(m.index>last){
      var chunk=s.slice(last,m.index),lead=chunk.match(/^\s+/),trail=chunk.match(/\s+$/);
      if(lead&&out.length){out[out.length-1]=out[out.length-1].replace(/\s+$/,'');chunk=chunk.slice(lead[0].length);}
      if(trail&&!lead)chunk=chunk.slice(0,chunk.length-trail[0].length);
      if(chunk)out=out.concat(plainWords(chunk));
      if(trail&&out.length)out[out.length-1]=out[out.length-1].replace(/\s+$/,'');
    }
    out.push(m[0]);last=m.index+m[0].length;
  }
  if(last<s.length){
    var tail=s.slice(last),tm=tail.match(/^\s+/);
    if(tm&&out.length){out[out.length-1]=out[out.length-1].replace(/\s+$/,'');tail=tail.slice(tm[0].length);}
    if(tail)out=out.concat(plainWords(tail));
  }
  return out.length?out:[s];
}
function segHTML(text){
  /* <wbr> 给词间一个零宽换行机会：长标题能自然折行，词内仍由 .w 保护不被拆 */
  return segWords(text).map(function(w){return '<span class="w">'+esc(w)+'</span>';}).join('<wbr>');
}
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function estDur(t){var n=String(t||'').replace(/\s/g,'').length;return Math.max(2.4,Math.min(8,n/4.6));}
function autoHammer(p){
  var m=String(p).match(/\d[\d,.]*\s*(?:%|％|米|克|倍|岁|℃|度|分钟|秒|英尺|万|亿)/);
  if(m)return m[0];
  var m2=String(p).match(/[A-Za-z]{2,6}/);if(m2)return m2[0];
  return String(p).slice(0,3);
}
function aux(){
  var P=PRESETS[S.type]||PRESETS.judge,sc=SCRIPT[S.type]||SCRIPT.judge;
  var tags=String(S.tags||P.tags||'').split(/[\/|,，、]+/).map(function(x){return x.trim();}).filter(Boolean).slice(0,3);
  var hammers=String(S.hammers||P.hammers||'').split('|');
  var notes=String(S.notes||P.notes||'').split('|');
  return {P:P,sc:sc,tags:tags,hammers:hammers,notes:notes,
    takeaway:String(S.takeaway||P.takeaway||'').trim()};
}
/* 科普 / 解说是问答题：命中答题话术就换成「现象 ≠ 直觉」的话术，不再前言不搭后语 */
function fitHook(hook,type){
  var sc=SCRIPT[type]||SCRIPT.judge,h=String(hook||'').trim();
  /* 热门话题库自带按题型配好的文案，不再走通用池护栏：
     例如「答案和你想的正相反」是知乎原题，含「答案」但不是答题话术。 */
  if(S.topicId)return h||sc.hook;
  if(type==='kepu'&&QUIZ_WORDS.test(h))return sc.hook;
  return h||sc.hook;
}
function teaser(i,n,A,sc){
  if(i<n-1)return '下一层 · '+String(A.tags[i+1]||'接着拆').trim();
  return '三层讲完，结论就在下一拍';
}
function fitCta(cta,type){
  var sc=SCRIPT[type]||SCRIPT.judge,c=String(cta||'').trim();
  if(S.topicId)return c||sc.cta;
  if(type==='kepu'&&/选|答错|答对|评论区说说你/.test(c))return sc.cta;
  return c||sc.cta;
}
/* ── 断言驱动的内容编排（不再是「提问 → 先别急 → 三点平铺 → 答案」的课件节奏）──
   01 断言：题干原样作大字 + 题型徽标 + 钩子 + 看点标签 + 看点承诺（都不剧透机制）
   02 承诺：一句「体感不等于原理」+ 三层递进标签，给数量与预期
   03-05 拆解：主句 + 数据锤内联高亮 + 补充条进字幕 + 序号动势 + 分段进度
   06 结论：回扣 + 可执行建议 + 来源 + CTA + 免责
   beat 名与帧数保持不变（6 帧），渲染底座、字号体系、导出同源全部不动。 */
/* ══ 花字语义规则（v6.1）═══════════════════════════════════════
   旧版把话题的「结论残片」（到不了 / 有区间 / 没检测 / 用反了）当花字
   贴到钩子帧，脱离上下文就是无头词，还提前剧透。
   现在：花字必须由「当前帧的语义角色」决定，不由话题标签决定。
   ── 钩子帧：零上下文情绪词，按题型取，绝不剧透
   ── 反转帧：其实
   ── 拆解帧：情绪递进池；话题自带的数字数据锤（18000V / 280℃）
      只在该帧大字确实出现该数字时才上花字，否则退回情绪词
   ── 峰值帧：最离谱
   ── 收尾帧：记住
   所有花字都必须在 SAFE 白名单或为「本帧大字里出现的数字」，
   英文小标按帧兜底，不再有 OMG / 帧语 这种糊弄词。
   ══════════════════════════════════════════════════════════ */
/* 钩子花字＝对题干的反问，必须是完整口语短句，不能是「真假的」这类硬凑残片 */
var HOOK_FLOWER={judge:'真假？',single:'选哪个？',multi:'哪几个？',kepu:'为啥？',explain:'为啥？'};
/* 大众向：钩子花字先按题型给信息词，flowerFor 再统一映射 */
var SAFE_FLOWERS={
  '信了？':1,'选哪个':1,'全选？':1,'啊？':1,'别划走':1,'不是吧':1,'等等':1,
  '先看这':1,'别急':1,'好家伙':1,'懂了':1,'破案了':1,'原来是':1,'离谱':1,
  '其实':1,'最离谱':1,'记住':1,'白喝了':1,'别泡了':1,'先别答':1,
  '真假？':1,'选哪个？':1,'哪几个？':1,'为啥？':1,'信了？':1,'全选？':1,
  /* 话题自带的「自足口语梗」：脱离上下文也看得懂，允许覆写钩子 */
  '维修中':1,'别慌':1,'鼻子先钝':1,'别蒸了':1,'别扔啊':1,'压压惊':1,
  /* v9：模式切换会还原 FORMATS/FMT_BEATS 的原词，而 SAFE_FLOWERS 只注册过一次，
     导致关掉大众版后「看数字 / 后来呢 / 吵翻了」被误判为非自足词。两套词都静态收全。 */
  '别信':1,'3 条':1,'差在这':1,'看数字':1,'后来呢':1,'吵翻了':1,'原来':1,'停一下':1,
  '看依据':1,'看条件':1,'逐条看':1,'看原理':1,'先核实':1,'看机制':1,
  '看发育':1,'看温度':1,'看数据':1,'看经过':1,'两种说法':1,'有出入':1,
  '请注意':1,'看路径':1,'缺检测':1,'别替药':1,'看剂量':1,'分三条':1,
  '区别在':1,'看区间':1,'看顺序':1,'看定义':1,'看代谢':1,'有依据':1
};
var EMO_L1=['等等','先看这','别急','啊？','不是吧'];
var EMO_L2=['好家伙','懂了','破案了','原来是','离谱'];
var FLOWER_EN={
  '真假？':'FOR REAL?','选哪个？':'PICK ONE?','哪几个？':'WHICH ONES?','为啥？':'WHY?',
  '信了？':'YOU BOUGHT IT?','选哪个':'PICK ONE','全选？':'ALL OF THEM?',
  '啊？':'WAIT, WHAT?','别划走':'DONT SCROLL','不是吧':'YOU KIDDING',
  '等等':'HOLD ON','先看这':'LOOK HERE','别急':'CHILL',
  '好家伙':'OH REALLY','懂了':'GOT IT','破案了':'CASE CLOSED',
  '原来是':'SO THAT IS IT','离谱':'WTF','其实':'ACTUALLY',
  '最离谱':'NO WAY','记住':'REMEMBER',
  '白喝了':'WASTED IT','别泡了':'STOP SOAKING',
  '先别答':'DONT ANSWER YET',
  '维修中':'UNDER REPAIR','别慌':'DONT PANIC','鼻子先钝':'NOSE FIRST',
  '别蒸了':'DONT STEAM IT','别扔啊':'KEEP IT','压压惊':'CALM DOWN'
};

/* 把 9 种形态的花字注册进白名单与英文小标，避免落到 OMG / 帧语 兜底 */
FORMATS.forEach(function(F){
  SAFE_FLOWERS[F.flower]=1;FLOWER_EN[F.flower]=F.en;
});
Object.keys(FMT_BEATS).forEach(function(k){
  var b=FMT_BEATS[k];
  SAFE_FLOWERS[b.flip]=1;SAFE_FLOWERS[b.end]=1;
  FLOWER_EN[b.flip]=b.flipEn;FLOWER_EN[b.end]=b.endEn;
});
function isDataWord(w){return /\d/.test(String(w||''));}
/* 数字型花字必须与本帧大字同拍：大字里出现同一串数字才允许 */
function dataMatches(w,title){
  var m=String(w||'').match(/\d[\d.]*/);
  return !!(m&&String(title||'').indexOf(m[0])>=0);
}
function _flowerForRaw(shot,i,meta,A,seed,title,type){
  if(shot==='cover'||shot==='hook'){
    /* 非问句形态：钩子花字由形态决定（别信 / 3 条 / 看数字…），不再是真假？ */
    if(S.fmt&&S.fmt!=='quiz')return fmtMeta().flower;
    var h=HOOK_FLOWER[type]||'啊？';
    /* 话题自带花字只有是「自足情绪词」才可覆写钩子；结论残片一律不用 */
    var mf=String(meta.flower||'').trim();
    if(SAFE_FLOWERS[mf]&&!isDataWord(mf)&&mf!=='其实'&&mf!=='记住'&&mf!=='最离谱')h=mf;
    return h;
  }
  var bf=beatFlower(shot);if(bf)return bf;
  if(shot==='flip')return '其实';
  if(shot==='end')return '记住';
  if(shot==='l3')return '最离谱';
  /* 拆解帧：数字数据锤只在该帧大字包含它时才用，图文字面对得上 */
  var mf=String(meta.flower||'').trim();
  if(isDataWord(mf)&&dataMatches(mf,title))return mf;
  var pool=S.audience?((shot==='l2')?['看条件','看剂量','看范围','看前提','看单位']:
                      ['看机制','看依据','看过程','看对象','看条件']):
            ((shot==='l2')?EMO_L2:EMO_L1);
  return pool[(seed+i)%pool.length];
}
function flowerFor(){var w=_flowerForRaw.apply(null,arguments);
  return S.audience?(PLAIN_FLOWER[w]||w):w;}
function flowerEN(w,shot){
  if(S.audience&&PLAIN_EN[w])return PLAIN_EN[w];
  if(FLOWER_EN[w])return FLOWER_EN[w];
  /* 数字数据锤：给「THE NUMBER / 数据说话」，其余按帧语义兜底，绝不再用 OMG / 帧语 */
  if(isDataWord(w))return 'THE NUMBER';
  var byShot=S.audience?{cover:'CHECK THE EVIDENCE',hook:'CHECK THE EVIDENCE',
    flip:'ACTUALLY',l1:'THE MECHANISM',l2:'THE CONDITION',l3:'KEY POINT',end:'REMEMBER THIS'}:
    {cover:'DONT SCROLL',hook:'DONT SCROLL',flip:'ACTUALLY',
    l1:'HOLD ON',l2:'GOT IT',l3:'NO WAY',end:'REMEMBER'};
  return byShot[shot]||'HOLD ON';
}
function flowerScale(w){
  var n=0;for(var i=0;i<w.length;i++)n+= /[\x00-\x7f]/.test(w[i])?.62:1;
  return Math.max(.6,Math.min(1,4.3/n)).toFixed(2);
}
function shorten(s,n){
  s=String(s||'').replace(/\s+/g,'');
  return s.length<=n?s:s.slice(0,Math.max(1,n-1))+'…';
}
function buildFrames(){
  var q=String(S.q||'').trim()||'这道题，你会怎么选？';
  var pts=(Array.isArray(S.points)?S.points.join('\n'):String(S.points||''))
    .split(/\n+/).map(function(x){return x.trim();}).filter(Boolean);
  var A=aux(),sc=A.sc,h=hash(q);
  var hook=fitHook(S.hook,S.type),cta=fitCta(S.cta,S.type);
  var ans=String(S.ans||'').trim()||'看完全篇，你已经有答案了';
  var isQ=(S.type!=='kepu'),badge=isQ?'正确答案':'核心结论';
  var take=String(S.takeaway||A.takeaway||'').trim()||'记住这一句就够了';
  /* 短视频口播数据：反转句 / 三层峰值 / 弹幕贴纸，来自话题或预设 */
  var meta=(function(){
    for(var i=0;i<HOT_TOPICS.length;i++)if(HOT_TOPICS[i].id===S.topicId)return HOT_TOPICS[i];
    var P=PRESETS[S.type]||PRESETS.judge;return P;
  })();
  var flip=String(meta.flip||'其实，事情不是这样').trim();
  var wrong=String(meta.ask||sc.ask||'你以为的那件事').trim();
  /* 峰值帧：花字已经喊「最离谱」，大字就别再复述这四个字，只给事实。
     旧版 20 条 peak 全以「最离谱的是，」开头，花字和大字说同一句。 */
  var peak=String(meta.peak||'').trim()
    .replace(/^最离谱的是[，,、：:]?\s*/,'')
    .replace(/^离谱的是[，,、：:]?\s*/,'')
    .replace(/^最离谱[，,、：:]?\s*/,'');
  /* v6.4：43 条扩展话题的 peak 是从通用金句池里抽的，同一句贴到不相干的
     几道题上（「单子上一行字别自己判」出现在体检/阿司匹林/宫颈糜烂）。
     这类话题一律改用该题自己的第三层要点：一定自足、一定贴合、零串题。 */
  var isExt=/^ext_/.test(String(S.topicId||''));
  if(isExt||!peak||/^[它这那其]/.test(peak)||/[它这那]$/.test(peak)||peak.length<7)
    peak=String(pts[pts.length-1]||peak||'').trim();
  /* 第三层要点若本身是「很难自然清除」这类无主语残片，补口语前缀让它自足 */
  if(peak.length<9)peak='关键是，'+peak;
  var pops=(String(meta.pops||'').split('|')).filter(Boolean);
  /* 6 帧各取一条、绝不循环回旧句：不足时留空，也不要让观众看同一句弹幕两次 */
  var pop=function(i){return String(pops[i]||'').trim();};
  var seed=h%7,FM=fmtMeta(),isFmt=!!(S.fmt&&S.fmt!=='quiz');
  var HKW=flowerFor('hook',0,meta,A,seed,q,S.type);
  /* v6.4 反转字幕：旧版 63 套全是「别急，下面按 3 层拆开看」——课件腔、零信息。
     试过引用划掉线，结果字幕把流言原样念第二遍、还折成两行末尾孤字。
     反转帧已有花字/划掉线/chip/大字/弹幕五层，字幕只该给一句极短语气反应：
     ≤7 字、一行放得下、不复述任何画面文字、不剧透机制。 */
  var FLIP_VO=S.audience?['实际并非如此','关键要看条件','先看依据','这里最容易混',
    '差别在这一步','结论要看前提','别急，看机制','往下有依据']:
    ['别急，往下看','等等，不对啊','啊？还有这说','先记住这句',
    '来，看关键','这点最容易错','别急着划走','往下有反转'];
  /* hash() 返回无符号 32 位；必须用 >>> 而非 >>，否则大数会成负索引、
     flipVo 变 undefined，反转帧字幕条整个消失。 */
  var flipVo=FLIP_VO[(h>>>3)%FLIP_VO.length];
  var F=[];
  if(S.useCover){
    F.push({beat:'cover',shot:'cover',label:'封面',no:'00',title:String(S.coverTitle||'').trim()||q,
      sub:hook,subtitle:'',vo:'',speak:'',hold:0,silent:1.8,
      column:S.column,issue:S.issue,disclaim:S.disclaimer,typeLabel:TYPE_LABEL[S.type]||'',
      chip:pts.length+' 层拆解',tc:'00:00',prog:0,
      flower:HKW,ftag:'封面',bubble:''});
  }
  /* 钩子帧信息层级（v6.3）：题干才是用户真正要问的问题 → 升为主标题大字；
     含糊的「评论式钩子」降级为一句 ≤14 字眉标；花字是对题干的反问；
     字幕不再念题干（题干已在画面上），改念口播引子，不与大字重复。 */
  var HOOK_VO=S.audience?['先看清题目在问什么','这句话流传很广','先看依据再下结论','分三层说清楚']:
    ['这说法你听过吧','先别急着下结论','评论区先猜一发','三句话给你说明白'];
  var hvo=HOOK_VO[h%HOOK_VO.length];
  F.push({beat:'hook',shot:'hook',label:isFmt?FM.name:'断言',no:'01',title:q,sub:hook,
    tag:sc.tag,heat:S.topicHeat||'',sticker:pop(0),fmt:isFmt?S.fmt:'quiz',
    subtitle:sc.note,vo:hvo,speak:q+'。'+hook+'。'+hvo+'。',hold:.4,tc:'00:00',prog:8,
    opts:S.showOpts?String(S.opts||'').trim():'',
    flower:HKW,ftag:isFmt?FM.chip:(S.audience?'看依据':'别划走'),bubble:pop(0)});
  F.push({beat:'twist',shot:'flip',label:'反转',no:'02',title:flip,wrong:wrong,right:flip,
    sticker:pop(1),subtitle:sc.note,vo:flipVo,
    speak:wrong+'。'+flip+'。'+flipVo+'。',hold:.3,tc:'00:05',prog:22,
    flower:flowerFor('flip',1,meta,A,seed,flip,S.type),ftag:'反转',bubble:pop(1)});
  pts.forEach(function(pt,i){
    var note=String(A.notes[i]||sc.note).trim();
    var last=(i===pts.length-1);
    F.push({beat:'break',shot:'l'+(i+1),label:'拆解',no:'03',title:pt,idx:i+1,n:pts.length,
      hammer:String(A.hammers[i]||'').trim()||autoHammer(pt),note:note,
      layerLabel:'要点 '+(i+1),peak:last?peak:'',peakLabel:last?'最关键':'',
      title:last?peak:pt,sticker:pop(i),
      /* 峰值帧字幕改念该题第三层补充条（解释/类比/可执行动作），
         不再念第三层要点——旧版和大字是同一件事换皮说两遍。 */
      subtitle:teaser(i,pts.length,A,sc),vo:shorten(note,24),
      speak:pt+'。'+note+'。',hold:.3,
      flower:S.audience?(last?'关键点':flowerFor('l'+(i+1),i,meta,A,seed,last?peak:pt,S.type)):
             (last?'最离谱':flowerFor('l'+(i+1),i,meta,A,seed,last?peak:pt,S.type)),
      /* chip 用话题自己的关键词（静电 / 湿度 / 能量），不再写「第 N 层」目录 */
      ftag:(function(){var t=String(A.tags[i]||'').trim();
        return (t.length>=2?t:'要点 '+(i+1));})(),bubble:pop(i+2),
      tc:'00:'+String(8+i*6).padStart(2,'0'),prog:38+i*18});
  });
  F.push({beat:'verdict',shot:'end',label:'收尾',no:'04',title:take,ans:ans,badge:badge,line:take,
    src:S.src,cta:cta,disclaim:S.disclaimer,subtitle:'',vo:shorten(cta,24),
    speak:'所以结论是，'+ans+'。'+take+'。'+cta+'。',hold:.5,tc:'00:26',prog:96,
    flower:flowerFor('end',5,meta,A,seed,take,S.type),ftag:'一句带走',bubble:pop(5)});
  /* v7.2 字幕与文案一致（默认开）：
     旧版三套文本各说各话 —— 画面大字 f.title、字幕 f.vo、朗读稿 f.speak
     分别是三句话。现在字幕直接显示本帧大字，朗读稿第一句也是它；
     补充条/眉标只留在画面，不进口播、不进字幕，避免「听到 A 看到 B」。
     关掉开关即回到旧行为，方便 A/B 对比。 */
  var subFit=1;
  if(S.subSync){
    var maxSub=0;
    F.forEach(function(f){
      if(f.silent)return;
      /* 大字走 segHTML 分词渲染（会规范化空格），字幕用同一份词表拼回纯文本，
         两边 textContent 才能严格相等，而不是「看着差不多」。 */
      var raw=String(f.title||'').trim();
      f.vo=segWords(raw).join('');
      /* 口播稿用原文（空格不影响发音），与字幕是同一句话 */
      f.speak=raw;
      maxSub=Math.max(maxSub,f.vo.length);
    });
    /* 全片唯一的字幕缩放系数：按最长句一次算定，不逐帧跳字号 */
    subFit=Math.max(.58,Math.min(1,19/Math.max(1,maxSub)));
  }
  S.subFit=subFit;
  F.forEach(function(f){
    if(f.silent){f.dur=f.silent;return;}
    /* 必须用 ttsKey()（含接口后缀）：旧写法取不到缓存，rebuild() 会把
       fetchTTS 刚写回的实测时长冲掉，时间轴永远停在估算值。 */
    var b=S.tts.get(ttsKey(f.speak||''));
    f.dur=(b&&b.duration?b.duration:estDur(f.speak))+f.hold;
    if(b&&b.duration)f.measured=b.duration;
  });
  if(S.endHold>0&&F.length)F[F.length-1].dur+=S.endHold;
  var cum=0,S_CUM_TMP=[];F.forEach(function(f){S_CUM_TMP.push(cum);cum+=f.dur;});
  S.frames=F;S.cum=S_CUM_TMP;S.total=cum;
  var mm=Math.floor(cum/60),ss=Math.floor(cum%60);
  F.forEach(function(f){f.tcTotal='0'+mm+':'+String(ss).padStart(2,'0');});
  window.__CUM__=S.cum;
  return F;
}
/* 首帧结构条：9 种形态各有各的构图，不是同一张卡换个颜色 */
function fmtRowHTML(k,f){
  var M={claim:'已核实',list:'01',number:'先摊开',story:'起 · 转 · 合',
    compare:'你以为',debate:'两派',myth:'一直被说反了',warn:'这一步最容易错'};
  var h='';
  if(k==='list')h='<b>01</b><b>02</b><b>03</b><span>逐条说清</span>';
  else if(k==='compare')h='<span>你以为</span><i>≠</i><span>其实</span>';
  else if(k==='number')h='<b>分母</b><span>看到大数，先找总数</span>';
  else if(k==='story')h='<i></i><i></i><i></i><span>经过与结论</span>';
  else if(k==='debate')h='<span>甲方</span><span>乙方</span>';
  else if(k==='claim')h='<i class="stamp">✓</i><span>'+esc(M.claim)+'</span>';
  else if(k==='warn')h='<span>'+esc(M.warn)+'</span>';
  else if(k==='myth')h='<span>'+esc(M.myth)+'</span>';
  if(!h)return '';
  return '<div class="fmt-row" data-kind="'+esc(k)+'">'+h+'</div>';
}

/* ════════════════════════════════════════════════════════════════════════
   v9.2 大众科普「杂志图解」版
   ────────────────────────────────────────────────────────────────────────
   v9.1 换了六套构图，但每块信息仍是「背景 / 名词 / 判定」「核对口径 /
   依据来源 / 说明」「核实结论」「要点 1/3」「白话」「出处」——全是报告字段。
   字段一摆就是讲义。本轮把字段名 + 冒号结构整个拿掉：
     · 侧栏改「一段带口语引子的连续短文」，没有方章、没有分隔线、没有底色块
     · 选项从圆角边框按钮改成书页下划线行
     · 依据两格 / 版权三格 → 一段能读的尾注
     · 「核实结论」红章 → 「说到底，」口语小引；「判定 ·」→「答案是」
     · 「要点 1/3」→「第一层 / 第二层 / 最后一层」，删掉 01—02—03 目录阶梯
     · 名词解释从「术语：白话」改成「术语，指的是……」完整句
   专业数值、机构口径、机制陈述一个不删，只换组织方式。
   ════════════════════════════════════════════════════════════════════════ */
/* 拆解帧逐帧取自己的术语：三帧白话不能是同一句 */
function genTerm(idx){
  var tags=String(S.tags||'').split(/[\/|,，、]+/).map(function(x){return x.trim();}).filter(Boolean);
  var t=tags[idx]||'',hit='';
  Object.keys(GLOSS).forEach(function(k){
    if(t&&(t.indexOf(k)>=0||k.indexOf(t)>=0)&&k.length>hit.length)hit=k;
  });
  if(hit)return t+'，指的是'+GLOSS[hit];
  var pts=String(S.points||'').split('\n')
    .map(function(x){return String(x||'').trim();}).filter(Boolean);
  return (t||'这一层')+'，说得再直白些，'+(pts[idx]||'见下方资料');
}
/* ════════════════════════════════════════════════════════════════════════
   v9.1 六帧六套构图。共同元素只有：左上小栏目名、右下页码、底部口播条。
   每帧自身的 DOM 结构不同 —— 不是同一张卡换文字。
   ════════════════════════════════════════════════════════════════════════ */
function genTxt(x){
  /* 中文按词不断行：逐字断行会把「斑块」拆成「斑/块」、「官网」拆成「官/网」，
     把「7.35～7.45」拆成两截。做法：数字区间 / 数值单位 / 英文 / 已知专业词
     先整体保护，其余汉字按 2 字一组包 nowrap，标点并入前块避免单独起行。 */
  var raw=String(x||''),keep=[];
  function stash(m){keep.push(m);return '\u0001'+(keep.length-1)+'\u0002';}
  var PH=['官网','网站','机构','平台','报告','数据','研究','标准','指南','委员会',
    '血压','血糖','血管','斑块','血栓','脂质','沉积','酸碱度','醋酸','胃液','稀释',
    '代谢','吸收','能量','电压','湿度','温度','浓度','剂量','风险','人群','孕妇',
    '儿童','成人','专家','医生','说法','结论','来源','依据','食物','营养','检测',
    '实验','发布','提醒','判断','关键量','千分率','中位数','死亡率','出生率',
    '紫外线','防晒','静电','黄曲霉','消毒剂','阿司匹林','前额叶','髓鞘','鞣酸'];
  try{PH=PH.concat(Object.keys(GLOSS||{}));}catch(e){}
  PH=PH.concat(String(S.tags||'').split(/[\/|,，、]+/).map(function(t){return t.trim();}));
  /* 只收中文词组：纯数字/英文词会误伤占位符，也会被下一次 replace 二次匹配 */
  PH=PH.filter(function(w,i,a){return w&&w.length>=2&&/[\u4e00-\u9fa5]/.test(w)&&a.indexOf(w)===i;})
       .sort(function(a,b){return b.length-a.length;});
  /* 数字区间 / 数值单位 / 英文必须一次性替换：分两次时第二次会吃掉
     第一次占位符里的索引数字，把 \u00010\u0002 破坏成孤立控制字符，
     SVG 序列化会直接失败。 */
  raw=raw.replace(/\d+(?:\.\d+)?\s*[～~—\-至]\s*\d+(?:\.\d+)?\s*(?:%|℃|V|伏|倍|岁|年|克|米)?|\d+(?:[.,]\d+)*\s*(?:%|℃|℉|V|伏|瓦|米|克|毫升|千|万|亿|次|年|月|日|倍|度|岁)?|[A-Za-z][A-Za-z0-9.\-]*/g,stash);
  PH.forEach(function(w){raw=raw.split(w).join(stash(w));});
  var out=[],buf='';
  function clean(t){return String(t).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');}
  function flush(){if(buf){out.push('<span class="gen-w">'+esc(clean(buf))+'</span>');buf='';}}
  function consume(seg){
    for(var i=0;i<seg.length;){
      var c=seg[i];
      if(/[\u4e00-\u9fa5]/.test(c)){
        var han='';while(i<seg.length&&/[\u4e00-\u9fa5]/.test(seg[i])){han+=seg[i];i++;}
        for(var j=0;j<han.length;j+=2){
          var u=han.slice(j,j+2);
          if(u.length===1&&buf)buf+=u;
          else if(u.length===1)buf=u;
          else{flush();buf=u;}
        }
      }else{buf+=c;i++;}
    }
  }
  var re=/\u0001(\d+)\u0002/g,m,last=0;
  while((m=re.exec(raw))){consume(raw.slice(last,m.index));flush();
    out.push('<span class="gen-w">'+esc(keep[+m[1]])+'</span>');last=re.lastIndex;}
  consume(raw.slice(last));flush();
  return out.join('');
}
/* 侧栏正文：把 explain / gloss / basis 三句连成一段能读下去的短文。
   数据本身已是完整陈述，之前硬套「背景/名词/判定」方章才像 PPT。 */
function genProse(){
  var ex=String(S.explain||'').trim();
  var gl=String(S.gloss||'').trim()
    .replace(/^([^：:]{2,12})[：:]/,function(m,a){return a+'，指的是';});
  var ba=String(S.basis||'').trim();
  var hasOpt=['judge','single','multi'].indexOf(String(S.type||''))>=0;
  var intro=hasOpt?'先把题目说明白。':'先把这件事说清楚。';
  return '<p class="gen-prose-intro">'+intro+'</p>'+
    (ex?'<p>'+genTxt(ex)+'</p>':'')+
    (gl?'<p>'+genTxt(gl)+'</p>':'')+
    (ba?'<p class="gen-prose-last">'+genTxt('怎么判断？'+ba)+'</p>':'');
}
function genFrameHTML(f){
  var shot=f.shot||f.beat||'cover';
  var bg=String(S.explain||'').trim(),gl=String(S.gloss||'').trim(),
      basis=String(S.basis||'').trim(),src=String(S.src||f.src||'公开资料').trim();
  var tot=f.tcTotal||'00:30',no=(shot==='cover')?'封面':(f.no||'01');
  var dis=String(f.disclaim||'').trim();

  var corner='<div class="gen-corner"><span class="gen-col">常识核实</span>'+
    '<i></i><span class="gen-col2">生活常识 · 有依据地看</span></div>'+
    '<div class="gen-page">'+esc(no)+' / '+esc(tot)+'</div>';

  var body='';
  if(shot==='cover'){
    body='<div class="gen-cover">'+
      '<div class="gn-fold"><b>常识核实</b><i>'+esc(f.issue||'01')+'</i></div>'+
      '<div class="gen-cover-main">'+
        '<div class="gen-cover-kicker">本期话题 · '+esc(f.typeLabel||'判断题')+'</div>'+
        '<h1 class="big-title gen-title">'+segHTML(f.title)+'</h1>'+
        '<div class="gen-rule"></div>'+
        '<div class="gen-cover-sub"><div class="gen-txt">'+genTxt(bg)+'</div></div>'+
        '<div class="gen-cover-meta"><span class="gen-mini">'+esc(f.column||'帧语 · 每日一题')+'</span>'+
        '<span class="gen-fine">'+esc(f.chip||'')+'</span></div>'+
        (dis?'<div class="gen-fine" style="margin-top:24px">'+esc(dis)+'</div>':'')+
      '</div></div>'+
      '<div class="gen-cover-no">'+esc(String(f.issue||'01').replace(/\D/g,'')||'01')+'</div>';
  }else if(shot==='hook'){
    var optArr=String(f.opts||'').split('|').map(function(x){return x.trim();}).filter(Boolean);
    var opts=optArr.length?'<div class="gen-opts">'+optArr.map(function(o,i){
      return '<div class="gen-opt"><b>'+String.fromCharCode(65+i)+'</b><span>'+segHTML(o)+'</span></div>';
    }).join('')+'</div>':'<div class="gen-fine">这类题没有选项，下面一层一层说清楚。</div>';
    body='<div class="gen-hook-top">'+
      '<h2 class="big-title gen-title">'+segHTML(f.title)+'</h2></div>'+
      '<div class="gen-hook-cols"><div class="gen-hook-left"><div>'+opts+
        (src?'<div class="gen-src">'+genTxt('这段话出自 '+src+'。')+'</div>':'')+'</div>'+
        '<div class="gen-hook-mark">?</div></div>'+
      '<div class="gen-side">'+genProse()+'</div></div>';
  }else if(shot==='flip'){
    body='<div class="gen-flip">'+
      '<div class="gen-say"><span class="gen-say-lead">常听到这么一句</span>'+
        '<span class="gen-quote">「'+genTxt(f.wrong||'')+'」</span></div>'+
      '<div class="gen-flipmid"><i></i><b>≠</b><i></i></div>'+
      '<div class="gen-right"><span class="gen-mini">查下来是</span>'+
        '<h2 class="big-title gen-title">'+segHTML(f.title)+'</h2></div>'+
      '</div>'+
      '<div class="gen-endnote">'+genTxt('怎么判断？'+basis+' 资料出自 '+src+'。')+'</div>';
  }else if(shot==='l1'||shot==='l2'||shot==='l3'){
    var idx=+f.idx||1,n=+f.n||3;
    var hm=String(f.hammer||'').trim();
    var showNum=/\d/.test(hm);       /* 纯词不放大成朱红巨字 */
    body='<div class="gen-layer" data-step="'+idx+'">'+
      '<div class="gen-stepnum">'+String(idx).padStart(2,'0')+'</div>'+
      '<div class="gen-lead"><span class="gen-mini">'+
        ['第一层','第二层','最后一层'][idx-1]+' · '+esc(f.ftag||'')+'</span>'+
        '<div style="height:calc(20px * var(--scale,1))"></div>'+
        '<h2 class="big-title gen-title">'+segHTML(f.title)+'</h2></div>'+
      '<div class="gen-cap"><span>'+genTxt(genTerm(idx-1))+'</span></div>'+
      (showNum?'<div class="gen-num">'+genTxt(hm)+'</div>':'')+
      '<div class="gen-origin">'+genTxt('资料出自 '+src+'。')+'</div>'+
    '</div>';
  }else{
    body='<div class="gen-end">'+
      '<div class="gen-end-kicker"><span class="gen-kicker">说到底，</span><i></i>'+
        '<span class="gen-fine">'+esc(tot)+'</span></div>'+
      '<h2 class="big-title gen-title">'+segHTML(f.title)+'</h2>'+
      '<div class="gen-verdict">答案是 '+esc(f.ans||'')+'。</div>'+
      (f.cta?'<div class="gen-txt" style="margin-top:calc(26px * var(--scale,1))">'+esc(f.cta)+'</div>':'')+
      '</div>'+
      '<div class="gen-trail">'+genTxt('还有疑问，可以按上面两条自己核一遍。资料出自 '+src+'。')+'</div>'+
      (dis?'<div class="gen-disclaim-bar">'+genTxt(dis)+'</div>':'');
  }
  var sub=f.vo?'<div class="subbar gen-subbar"><small>口播</small>'+
    '<span class="subwrap">'+esc(f.vo)+'</span></div>':'';
  var wm=String(S.wmText||'').trim()?'<div class="wm">'+esc(S.wmText)+'</div>':'';
  return '<div class="f-bg"></div><div class="f-inner gen-inner" data-shot="'+shot+'"'+
    ' data-aud="general" style="--sub-fit:'+(S.subFit||1)+'">'+
    wm+corner+'<div class="gen-stage">'+body+'</div>'+sub+'</div>';
}


function frameHTML(f){
  /* v8：编排维度独立于 12 套配色。burst 仍走下面这副原骨架（零视觉变化），
     其余 8 套由 layouts.js 用完全不同的 DOM 结构与 CSS 渲染，六帧构图也逐帧不同。 */
  /* 大众模式＝独立的科普专栏版式；短视频模式才用 12 套编排。
     两套设计并存，切换开关即整副骨架替换，不是给花字换个词。 */
  if(S.audience){
    /* 九套骨架：一个画面主体贯穿全片，帧间是同一物体被逐步使用。
       旧的报纸式专栏（genFrameHTML）保留为兜底，不再是默认版式。 */
    var SK=window.FV_SKELETONS;
    if(SK&&S.skeleton){
      var skOut=SK.render(S.skeleton,f,{esc:esc,segHTML:segHTML,segWords:segWords,S:S});
      if(skOut)return skOut;
    }
    return genFrameHTML(f);
  }
  var LY=window.FV_LAYOUTS;
  if(LY&&S.layout&&S.layout!=='burst'){
    var out=LY.render(S.layout,f,{esc:esc,segHTML:segHTML,segWords:segWords,S:S});
    if(out)return out;
  }
  var shot=f.shot||f.beat||'cover';
  var fw=String(f.flower||'?').trim(),fsc=flowerScale(fw),fen=flowerEN(fw,shot);
  var bubble=String(f.bubble||'').trim();
  var tc=f.tc||'00:00',tot=f.tcTotal||'00:30',prog=+f.prog||0;
  var head=shot==='cover'?'<div class="f-head"></div>':
    '<div class="f-head"><span class="kicker">'+esc(tc)+'</span>'+
    '<span class="brandmini">'+esc(tot)+' · 有声</span>'+
    '<div class="vbar"><i style="width:'+prog+'%"></i></div></div>';
  /* 剪映式综艺花字：爆炸形底衬 + 超粗白字 + 深色描边 + 彩色厚阴影 + 星星速度线。
     字号恒定，只按词长整体缩放容器，不逐帧改字号。 */
  var deco='<div class="fx-deco" style="--fw:'+fsc+'">'+
    '<div class="fx-burst"></div><div class="fx-flower">'+esc(fw)+'</div>'+
    '<div class="fx-en">'+esc(fen)+'</div>'+
    '<span class="fx-star a">✦</span><span class="fx-star b">★</span>'+
    '<span class="fx-star c">✦</span><span class="fx-star d">★</span>'+
    '<span class="fx-line a"></span><span class="fx-line b"></span>'+
    '<span class="fx-bolt">⚡</span></div>';
  /* 信息卡的小标签必须跟着内容走：写「依据来源」就不能标「名词解释」。
     之前一张图里出现过右上卡写「科普中国」、脚注却写「白话」的自相矛盾。 */
  var bubTag='COMMENT / 弹幕';
  if(S.audience){
    if(/^依据来源|^出处/.test(bubble))bubTag='出处 / 依据';
    else if(/^白话|^名词/.test(bubble))bubTag='名词解释 / 白话';
    else if(/^关键量/.test(bubble))bubTag='关键量 / 口径';
    else if(/^以官方/.test(bubble))bubTag='核对口径';
    else bubTag='补充信息';
  }
  var bub=bubble?'<div class="bubble'+(S.audience?' gen-note':'')+'">'+esc(bubble)+
    '<small>'+bubTag+'</small></div>':'';
  /* 主标题（全片唯一字号）放下半屏，花字占上半屏，二者互不遮挡 */
  var main='',cls=(shot==='cover')?'cover-title':'big-title';
  if(shot==='cover'){
    main='<div class="cover-brand"><span>'+segHTML(f.column||'帧语')+'</span>'+
         '<span class="cover-issue">'+esc(f.issue||'')+'</span></div>'+
         '<h1 class="'+cls+'">'+segHTML(f.title)+'</h1>'+
         '<p class="hook-sub">'+esc(f.sub||'')+'</p>'+
         '<div class="cover-meta"><span class="cover-chip">'+esc(f.typeLabel||'')+'</span>'+
         '<span class="cover-chip">'+esc(f.chip||'')+'</span></div>'+
         '<div class="cover-disclaim">'+esc(f.disclaim||'')+'</div>';
  }else if(shot==='hook'){
    /* 信息层级：题型眉标 → 题干（主标题，大字）→ 短眉标 → 选项 → 热度。
       题干是用户真正要问的问题，必须占主位；选项紧跟着铺在下半屏，
       但绝不标出正确答案 —— 答案只在最后一拍揭晓。 */
    var optArr=String(f.opts||'').split('|').map(function(x){return x.trim();}).filter(Boolean);
    var optHTML=optArr.length?'<div class="opts'+(optArr.length<=2?' two':'')+'">'+
      optArr.map(function(o,i){
        return '<div class="opt"><b>'+String.fromCharCode(65+i)+'</b>'+
               '<span>'+segHTML(o)+'</span></div>';
      }).join('')+'</div>':'';
    /* 非问句形态：用形态结构条替换原来的眉标，高度不变、构图真的不一样 */
    var fk=(f.fmt&&f.fmt!=='quiz')?fmtRowHTML(f.fmt,f):
           (f.sub?'<p class="hook-kicker">'+esc(f.sub)+'</p>':'');
    main='<div class="chip">'+esc(f.ftag||(S.audience?'看依据':'别划走'))+'</div>'+
         '<h2 class="'+cls+'">'+segHTML(f.title)+'</h2>'+
         fk+
         optHTML+
         (f.heat?'<div class="heat-badge">'+esc(f.heat)+'</div>':'');
  }else if(shot==='flip'){
    main='<div class="flip-l"><b>你以为</b><span class="strike">'+esc(f.wrong||'')+'</span></div>'+
         '<div class="chip">'+esc(f.ftag||'反转')+'</div>'+
         '<h2 class="'+cls+'">'+segHTML(f.title)+'</h2>';
  }else if(shot==='l1'||shot==='l2'||shot==='l3'){
    main='<div class="chip">'+esc(f.ftag||'')+'</div>'+
         '<h2 class="'+cls+'">'+segHTML(f.title)+'</h2>';
  }else{
    main='<div class="chip">'+esc(f.ftag||'一句带走')+'</div>'+
         '<h2 class="'+cls+'">'+segHTML(f.title)+'</h2>'+
         '<div class="takeaway"><b>答案</b><span>'+esc(f.ans||'')+'</span></div>'+
         '<div class="verdict-src">来源 · '+esc(f.src||'公开资料')+'</div>'+
         (f.disclaim?'<div class="disclaim">'+esc(f.disclaim)+'</div>':'');
  }
  /* 口播字幕：剪映标准做法，白字 + 2–4px 黑描边 + 半透明底，全程都在 */
  var sub=f.vo?'<div class="subbar"><span class="subwrap">'+esc(f.vo)+'</span></div>':'';
  /* subSync 开启时字幕必须显示：它本来就是口播首句，不能再用 smart 去重藏掉 */
  if(!S.subSync&&S.subMode==='smart'&&f.vo&&String(f.title||'').indexOf(String(f.vo))>=0)sub='';
  var wm=String(S.wmText||'').trim()?'<div class="wm">'+esc(S.wmText)+'</div>':'';
  return '<div class="f-bg"></div><div class="f-inner" data-shot="'+shot+'"'+
    ' style="--sub-fit:'+(S.subFit||1)+'"'+
    (String(f.opts||'').trim()?' data-opts="1"':'')+'>'+
    wm+head+deco+bub+
    '<div class="f-main"><div class="f-maincol">'+main+'</div></div>'+
    sub+'</div><div class="safe-guide"></div>';
}
function textOverflow(el){
  var inner=el.querySelector('.f-inner');if(!inner)return 0;
  var box=inner.getBoundingClientRect(),sel='.hook-title,.hook-sub,.big-title,.lead,.point-no,.point-title,.progline,.verdict-badge,.verdict-title,.verdict-line,.verdict-src,.verdict-cta,.disclaim,'+
  '.cover-brand,.cover-title,.cover-sub,.cover-meta,.cover-disclaim,.side-tag,.subbar,.kicker,.brandmini,.f-footnote,.claim-tag,.claim-tags > span,.claim-promise,.promise-row > span,.prog-count,.stat-num,.stat-note,.takeaway b,.takeaway > span,.hero-num,.hero-glyph,.hero-steps b,.heat-badge,.hook-kicker,.hook-sub,.opts,.opt,.opt b,.opt span,.ly-t,.ly-msg,.ly-opt,.wm,.ly-g-cell,.ly-ck-step,.ly-col,.ly-note,.ly-cv-fine,.gen-corner,.gen-col,.gen-col2,.gen-page,.gen-title,.gen-rule,.gen-txt,.gen-mini,.gen-fine,.gn-fold,.gen-cover,.gen-cover-main,.gen-cover-kicker,.gen-cover-sub,.gen-cover-meta,.gen-hook-top,.gen-hook-cols,.gen-side,.gen-side p,.gen-endnote,.gen-opts,.gen-opt,.gen-src,.gen-flip,.gen-say,.gen-say-lead,.gen-flipmid,.gen-right,.gen-disclaim-bar,.gen-trail,.gen-layer,.gen-stepnum,.gen-lead,.gen-cap span,.gen-num,.gen-origin,.gen-end,.gen-end-kicker,.gen-verdict,.gen-trail';
  var bad=[];
  Array.prototype.forEach.call(el.querySelectorAll(sel),function(n){
    var r=n.getBoundingClientRect();
    if(r.width===0&&r.height===0)return;
    if(r.right>box.right+2||r.left<box.left-2||r.bottom>box.bottom+2||r.top<box.top-2)
      bad.push(n.className+' '+Math.round(r.left-box.left)+'/'+Math.round(r.right-box.right));
  });
  window.__TEXT_OVER__=bad;
  return bad.length;
}

/* 内容自适应：整片只求一个系数，所有帧共用。
   约束 = 每帧文字零越界 + 标题行数不超上限；二分求最大可用值。
   这样「根据内容自动调整」成立，且不会逐帧时大时小。 */
function effScale(){return S.autoFit?S.scale*S.fit:S.scale;}
function titleRows(el){
  var t=el.querySelector('.hook-title,.big-title,.point-title,.verdict-title,.cover-title');
  if(!t)return 0;var tops={},n=0;
  Array.prototype.forEach.call(t.querySelectorAll('.w'),function(sp){
    var k=Math.round(sp.getBoundingClientRect().top/4);if(!tops[k]){tops[k]=1;n++;}
  });return n;
}
function computeFit(){
  var el=document.getElementById('frame');
  if(!el||!S.frames.length)return;
  var save=el.innerHTML,saveScale=el.style.getPropertyValue('--scale');
  /* 关键：切画幅时 DOM 上还是旧 ratio，系数会按旧盒模型算完才渲染新画幅。
     校验前先把所有影响布局的属性同步成当前状态，结束再逐项还原。 */
  var ATTR=['data-beat','data-ratio','data-theme','data-tpl','data-layout','data-skeleton','data-sub','data-guide'],saveA={};
  ATTR.forEach(function(k){saveA[k]=el.getAttribute(k);});
  el.setAttribute('data-ratio',S.ratio);
  el.setAttribute('data-theme',S.theme);
  el.setAttribute('data-tpl',S.tpl);
  el.setAttribute('data-layout',S.layout||'burst');
  el.setAttribute('data-skeleton',S.audience?(S.skeleton||'paper'):'none');
  el.setAttribute('data-format',S.fmt||'quiz');
  el.setAttribute('data-sub',S.sub?'1':'0');
  el.setAttribute('data-guide',S.guide?'1':'0');
  /* 行数上限 2 行：长文本放大后会变 3 行，就被判不可行 → 系数真的随内容变。
     上限 1.26 而非 1.42：避免把短句撑成「字体太大」。 */
  /* 数字/单位整体不可断后，长要点自然占 4 行；靠多一行解决，而不是整片缩小字号。
     这样 4 套预设在默认档 fit 恒为 1.00，切题型 / 切画幅字号完全不跳。 */
  /* 编排层把标题放在分栏/气泡里，天然会比 burst 多折 1–2 行；
     行数放宽到 6，让「字号统一」优先于「行数少」，越界仍由 textOverflow 严格拦截。 */
  var maxRows=((S.layout&&S.layout!=='burst')||S.audience)?6:4;
  /* 关键改动：fit 只做「防溢出收缩」，不再按内容放大。
     旧版把「最大不溢出」当目标 → 短句被撑大、长句被压小，且用户选的字阶被抵消。
     现在基准恒为 1.00，只有真的越界/超行数才降；用户选 88/100/112 线性生效。 */
  /* best 初值必须是下界：若 scale=1 时就有元素越界，二分会一路把 hi 压到 .72
     而没有任何一次 okAll，旧写法 best 仍留在 1.00 —— 越界没被修掉、只是被忽略。 */
  var lo=.72,hi=1.00,best=lo;window.__OVER_AT1__=[];
  /* 封面无论是否作视频首帧，都必须参与校验：
     否则「导出平台封面」用的是按无封面算出的系数，与开启封面时字号差 10%。 */
  var check=S.frames.concat([coverFrame()]);
  var overAt1=false;
  for(var k=0;k<7;k++){
    var mid=(lo+hi)/2,okAll=true;
    for(var i=0;i<check.length;i++){
      el.setAttribute('data-beat',check[i].beat);
      el.innerHTML=frameHTML(check[i]);
  el.setAttribute('data-aud',S.audience?'general':'short');
      el.style.setProperty('--scale',(mid*S.scale).toFixed(4));
      if(textOverflow(el)>0||titleRows(el)>maxRows){okAll=false;break;}
    }
    if(k===0&&!(function(){
      for(var j=0;j<check.length;j++){
        el.setAttribute('data-beat',check[j].beat);el.innerHTML=frameHTML(check[j]);
  el.setAttribute('data-aud',S.audience?'general':'short');
        el.style.setProperty('--scale',S.scale.toFixed(4));
        if(textOverflow(el)>0||titleRows(el)>maxRows){
          (window.__OVER_AT1__=window.__OVER_AT1__||[]).push({
            beat:check[j].beat,rows:titleRows(el),bad:(window.__TEXT_OVER__||[]).slice(0,6)});
          return false;
        }
      }return true;
    })())overAt1=true;
    if(okAll){best=mid;lo=mid;}else hi=mid;
  }
  if(!overAt1)best=1.00;
  el.innerHTML=save;
  ATTR.forEach(function(k){if(saveA[k]===null)el.removeAttribute(k);else el.setAttribute(k,saveA[k]);});
  el.style.setProperty('--scale',saveScale||'1');
  S.fit=+best.toFixed(4);
  window.__FITVAR__={fit:S.fit,eff:+effScale().toFixed(4),shrinkOnly:true,
    checked:check.length,overAt1:overAt1};
}

/* 主标题最长一行占内容盒宽度的比例 */
function maxRowFill(el){
  var m=el.querySelector('.f-maincol'),t=el.querySelector('.hook-title,.big-title,.point-title,.verdict-title,.cover-title');
  if(!m||!t)return 0;var mw=m.getBoundingClientRect().width,rows={};
  Array.prototype.forEach.call(t.querySelectorAll('.w'),function(sp){
    var r=sp.getBoundingClientRect(),k=Math.round(r.top/4);
    if(!rows[k])rows[k]={l:r.left,r:r.right};
    else{rows[k].l=Math.min(rows[k].l,r.left);rows[k].r=Math.max(rows[k].r,r.right);}
  });
  var mx=0;Object.keys(rows).forEach(function(k){mx=Math.max(mx,rows[k].r-rows[k].l);});
  return mw?+(mx/mw*100).toFixed(1):0;
}

function renderFrame(i){
  i=Math.max(0,Math.min(S.frames.length-1,i));
  var f=S.frames[i],el=$('#frame');
  el.setAttribute('data-beat',f.beat);
  el.setAttribute('data-ratio',S.ratio);
  el.setAttribute('data-theme',S.theme);
  el.setAttribute('data-tpl',S.tpl);
  el.setAttribute('data-layout',S.layout||'burst');
  el.setAttribute('data-skeleton',S.audience?(S.skeleton||'paper'):'none');
  el.setAttribute('data-sub',S.sub?'1':'0');
  el.setAttribute('data-guide',S.guide?'1':'0');
  el.style.setProperty('--scale',effScale());
  el.innerHTML=frameHTML(f);
  el.setAttribute('data-aud',S.audience?'general':'short');
  el.setAttribute('data-wmpos',S.wmPos);
  subVars(el);
  if(S.subTw){var sw=el.querySelector('.subwrap');if(sw)sw.textContent=subText(f,i);}
  S.cur=i;
  $('#frameInfo').textContent=String(i+1).padStart(2,'0')+' / '+String(S.frames.length).padStart(2,'0')+
    ' · '+f.label+' · '+(S.ratio==='9:16'?'1080×1920':'1920×1080');
  $$('.tlseg').forEach(function(e,k){
    e.classList.toggle('on',k===i);
    var pct=Math.max(0,Math.min(1,(S.t-(S.cum[k]||0))/((S.frames[k]||f).dur||1)));
    e.querySelector('.tlfill').style.width=(k<i?100:k===i?pct*100:0)+'%';
  });
  window.__FRAME__={i:i,beat:f.beat,title:f.title,sub:f.sub||'',
    words:el.querySelectorAll('.w').length,subbar:!!el.querySelector('.subbar'),
    over:textOverflow(el),fit:S.fit,eff:+effScale().toFixed(4),rows:titleRows(el),
    fill:maxRowFill(el)};
  var fr=document.getElementById('fitRead');
  if(fr)fr.textContent='自适应系数 '+S.fit.toFixed(2)+'× · 整片统一生效 '+effScale().toFixed(2)+
    '× · 本帧文字填充 '+window.__FRAME__.fill+'%';
}
function renderTimeline(){
  var tl=$('#timeline');tl.innerHTML='';
  S.frames.forEach(function(f,i){
    var d=document.createElement('div');d.className='tlseg';d.style.setProperty('--fl',f.dur.toFixed(2));
    d.innerHTML='<div class="tlfill"></div><span>'+f.no+' '+f.label+(f.idx?' '+f.idx:'')+'</span>';
    d.title=f.label+' · '+f.dur.toFixed(2)+'s · '+f.title.slice(0,20);
    d.onclick=function(){seekTo(S.cum[i]+.01);};
    tl.appendChild(d);
  });
}
function refit(){
  var el=$('#frame'),wrap=$('#canvaswrap');
  var W=(S.ratio==='9:16')?1080:1920,H=(S.ratio==='9:16')?1920:1080;
  var aw=wrap.clientWidth-12,ah=wrap.clientHeight-12;
  var k=Math.min(aw/W,ah/H);
  /* 关键：占位容器用「缩放后尺寸」参与 grid 居中；
     transform 施加在 .frame 上（导出 clone 时移除，仍输出原始 1080×1920）。
     之前把 scale 放在占位容器上，布局尺寸仍是 1080×1920，
     grid 按原始尺寸居中 → 视觉中心偏移，画面只露一角。 */
  $('#scaler').style.transform='none';
  $('#scaler').style.width=(W*k)+'px';$('#scaler').style.height=(H*k)+'px';
  el.style.transform='scale('+k+')';
  window.__FIT__={k:+k.toFixed(4),canvasW:Math.round(W*k),canvasH:Math.round(H*k)};
}
function rebuild(){
  buildFrames();computeFit();renderTimeline();
  if(S.cur<0||S.cur>=S.frames.length)S.cur=0;
  if(S.t>S.total)S.t=0;
  renderFrame(S.cur);updateBar();renderChecks();
  /* 真 bug 修复：改题干 / 切题型 / 改带走句后，逐句合成状态表必须同步重建。
     旧版只在 init 与合成完成时刷新，出片页会一直显示上一道题的朗读句。 */
  renderSynthList();
}
function updateBar(){
  $('#tm').textContent=S.t.toFixed(1)+' / '+S.total.toFixed(1)+'s';
  var p=S.total?Math.min(1,S.t/S.total):0;
  $('#seekfill').style.width=(p*100)+'%';$('#seekhead').style.left=(p*100)+'%';
}

/* ─────────────────────────────────────────────────────────────
   4. 音频工作台：五路总线 / 微软神经音色 / 配乐 / 流程音效 / 混音
   择优取自原 frame-vox 的 50-audio.js / 20-model.js，接在 NEXT 六帧上
   ───────────────────────────────────────────────────────────── */
var AC=null,master=null,mediaDest=null,voiceNodes=[],bgmNode=null,sfxNodes=[];
var BUS={},ANAL={},ROUTES=['master','voice','bgm','sfx','count'];
function ctx(){
  if(!AC){
    var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
    AC=new C();
    master=AC.createGain();master.gain.value=S.sound?S.vol.master:0;
    /* 软限幅：>0.95 的峰值压下来，原项目同款策略 */
    var comp=AC.createDynamicsCompressor();
    comp.threshold.value=-8;comp.knee.value=12;comp.ratio.value=6;
    master.connect(comp);comp.connect(AC.destination);
    mediaDest=AC.createMediaStreamDestination();comp.connect(mediaDest);
    ROUTES.forEach(function(r){
      if(r==='master')return;
      var g=AC.createGain();g.gain.value=S.vol[r];
      var an=AC.createAnalyser();an.fftSize=512;
      g.connect(an);an.connect(master);
      BUS[r]=g;ANAL[r]=an;
    });
    BUS.master=master;ANAL.master=(function(){var a=AC.createAnalyser();a.fftSize=512;comp.connect(a);return a;})();
  }
  if(AC.state==='suspended')AC.resume();
  return AC;
}
function setVol(route,v){
  v=Math.max(0,Math.min(2,+v||0));S.vol[route]=v;
  if(!AC)return;
  if(route==='master')master.gain.value=S.sound?v:0;
  else if(BUS[route])BUS[route].gain.value=v;
}
function readLevels(){
  var o={};if(!AC)return o;
  ROUTES.forEach(function(r){
    var a=ANAL[r];if(!a){o[r]=0;return;}
    var d=new Float32Array(a.fftSize);a.getFloatTimeDomainData(d);
    var sum=0;for(var i=0;i<d.length;i++)sum+=d[i]*d[i];
    o[r]=+Math.min(1,Math.sqrt(sum/d.length)*3.2).toFixed(4);
  });
  return o;
}
function duck(on){
  if(!AC||!BUS.bgm||!S.duckOn)return;
  BUS.bgm.gain.setTargetAtTime(on?S.vol.bgm*.28:S.vol.bgm,AC.currentTime,on?.08:.30);
}
/* ── 人声 ── */
function ttsUrl(text){
  var u='https://libretts.is-an.org/api/tts?t='+encodeURIComponent(text)+
    '&v='+encodeURIComponent(S.voice)+'&r='+S.rate+'&o=mp3';
  if(S.vUrl)return String(S.vUrl)
    .replace(/\{\{text\}\}/g,encodeURIComponent(text))
    .replace(/\{\{voice\}\}/g,encodeURIComponent(S.voice))
    .replace(/\{\{rate\}\}/g,String(S.rate));
  return u;
}
function ttsKey(text){return S.voice+'|'+S.rate+'|'+text+'|'+(S.vUrl||'default');}
function fetchTTS(text){
  var key=ttsKey(text);
  if(S.tts.has(key))return Promise.resolve({buf:S.tts.get(key),hit:true});
  var c=ctx();if(!c)return Promise.reject(new Error('浏览器不支持 Web Audio'));
  var ac=new AbortController(),timer=setTimeout(function(){ac.abort();},8000);
  return fetch(ttsUrl(text),{signal:ac.signal}).then(function(r){
    if(!r.ok)throw new Error('接口返回 '+r.status);return r.arrayBuffer();
  }).then(function(ab){
    if(ab.byteLength<1024)throw new Error('返回音频过小');
    return c.decodeAudioData(ab.slice(0));
  }).then(function(buf){
    S.tts.set(key,buf);clearTimeout(timer);
    applyMeasuredDurations();
    return {buf:buf,hit:false};
  },function(e){clearTimeout(timer);throw e;});
}
function stopVoices(){voiceNodes.forEach(function(n){try{n.stop();}catch(e){}});voiceNodes=[];}
function playOne(text){
  return fetchTTS(text).then(function(x){
    var c=ctx(),n=c.createBufferSource();n.buffer=x.buf;
    var g=c.createGain();g.gain.value=.95;n.connect(g);g.connect(BUS.voice);
    n.start();voiceNodes.push(n);duck(true);
    n.onended=function(){duck(false);voiceNodes=voiceNodes.filter(function(v){return v!==n;});};
    return x;
  });
}
function scheduleVoices(fromT){
  stopVoices();if(!S.sound)return;var c=ctx();
  S.frames.forEach(function(f,i){
    var b=S.tts.get(ttsKey(f.speak||''));if(!b)return;
    var at=S.cum[i]-fromT;if(at<-b.duration-.05)return;
    var n=c.createBufferSource();n.buffer=b;
    var g=c.createGain();g.gain.value=.95;n.connect(g);g.connect(BUS.voice);
    n.start(c.currentTime+Math.max(0,at),Math.max(0,-at));voiceNodes.push(n);
    duck(true);
    n.onended=function(){duck(false);voiceNodes=voiceNodes.filter(function(v){return v!==n;});};
  });
}
/* 实测时长写回时间轴：原项目「durs[] 由实测音频决定」的同款规则 */
function applyMeasuredDurations(){
  var changed=false;
  S.frames.forEach(function(f){
    var b=S.tts.get(ttsKey(f.speak||''));
    if(b&&b.duration&&Math.abs(f.dur-(b.duration+(f.hold||0)))>.02){
      f.dur=b.duration+(f.hold||0);f.measured=b.duration;changed=true;}
  });
  if(!changed)return;
  var cum=0;S.cum=[];S.frames.forEach(function(f){S.cum.push(cum);cum+=f.dur;});
  S.total=cum;window.__CUM__=S.cum;
  renderTimeline();updateBar();renderSynthList();renderChecks();
}
/* 真人录音：整条按静音切句 / 逐句 WAV 按序替换，实测时长直接进时间轴 */
function importVoiceFiles(files,mode,cb){
  var c=ctx();if(!c){cb&&cb('浏览器不支持音频');return;}
  var list=Array.prototype.slice.call(files);
  Promise.all(list.map(function(f){return f.arrayBuffer().then(function(ab){return c.decodeAudioData(ab.slice(0));});}))
  .then(function(bufs){
    var speaks=[];S.frames.forEach(function(f){if(f.speak&&speaks.indexOf(f.speak)<0)speaks.push(f.speak);});
    if(mode==='wav'){
      bufs.forEach(function(b,i){if(speaks[i])S.tts.set(ttsKey(speaks[i]),b);});
    }else{
      /* 整条按能量静音切句：窗口 20ms，阈值 = 峰值 8%，最短 240ms */
      var b=bufs[0],d=b.getChannelData(0),sr=b.sampleRate,win=Math.round(sr*.02),peak=0,env=[];
      for(var i=0;i<d.length;i+=win){var mx=0;for(var j=i;j<Math.min(d.length,i+win);j++)mx=Math.max(mx,Math.abs(d[j]));
        env.push(mx);peak=Math.max(peak,mx);}
      var th=peak*.08,segs=[],st=-1;
      env.forEach(function(v,k){if(v>th&&st<0)st=k;else if(v<=th&&st>=0){if(k-st>=12)segs.push([st*win,k*win]);st=-1;}});
      if(st>=0)segs.push([st*win,d.length]);
      segs.slice(0,speaks.length).forEach(function(sg,i){
        var n=sg[1]-sg[0],nb=c.createBuffer(1,n,sr);
        nb.getChannelData(0).set(d.subarray(sg[0],sg[1]));
        S.tts.set(ttsKey(speaks[i]),nb);
      });
    }
    S.voiceTakeName=list.map(function(f){return f.name;}).join('、');
    applyMeasuredDurations();cb&&cb('');
  },function(e){cb&&cb(e.message||'解码失败');});
}
/* ── 配乐：3 首内置 CC0 + 5 首在线（需下载后接入）+ 自定义上传 ── */
var BGM_LIB=[
 {v:'off',n:'🔇 关闭',lic:''},
 {v:'menu-1.mp3',n:'舒缓环境 · Feel good slow ambient · 1:30',lic:'CC0 1.0 · 可随片分发',file:'assets/bgm/menu-1.mp3',local:1},
 {v:'upbeat-1.mp3',n:'节奏轻快 · Rhythm Factory · 1:30',lic:'CC0 1.0 · 可随片分发',file:'assets/bgm/upbeat-1.mp3',local:1},
 {v:'calm-1.mp3',n:'静谧循环 · Calm Loop · 0:19',lic:'CC0 1.0 · 可随片分发',file:'assets/bgm/calm-1.mp3',local:1},
 {v:'px1',n:'Pixabay · Fun Life（ID 112188） · 1:50',lic:'Pixabay License · 需先下载到本地',url:'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8c18c4f4a5.mp3'},
 {v:'px2',n:'Pixabay · Forest Lullaby（ID 110624） · 2:19',lic:'Pixabay License · 需先下载到本地',url:'https://cdn.pixabay.com/download/audio/2022/03/10/audio_1c0dd7a5e0.mp3'},
 {v:'px3',n:'Pixabay · 曲目 1808fbf07a · 2:27',lic:'Pixabay License · 需先下载到本地',url:'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3'},
 {v:'px4',n:'Pixabay · 曲目 b79a40aa49 · 2:59',lic:'Pixabay License · 需先下载到本地',url:'https://cdn.pixabay.com/download/audio/2022/04/27/audio_b79a40aa49.mp3'},
 {v:'px5',n:'Pixabay · 曲目 333c151dc6 · 2:13',lic:'Pixabay License · 需先下载到本地',url:'https://cdn.pixabay.com/download/audio/2022/06/07/audio_333c151dc6.mp3'},
 {v:'custom',n:'⬆ 自定义上传（本地文件）',lic:'授权由你自行确认'}
];
var BGM_CACHE={},bgmAudioEl=null;
function bgmEntry(v){return BGM_LIB.filter(function(x){return x.v===v;})[0]||null;}
function ensureBuiltinBgm(v){
  if(BGM_CACHE[v])return Promise.resolve(BGM_CACHE[v]);
  var e=bgmEntry(v);if(!e||!e.file)return Promise.reject(new Error('曲目不存在'));
  var c=ctx();
  return fetch(e.file).then(function(r){if(!r.ok)throw new Error('内置音乐读取失败 '+r.status);return r.arrayBuffer();})
    .then(function(ab){return c.decodeAudioData(ab.slice(0));})
    .then(function(buf){BGM_CACHE[v]=buf;return buf;});
}
function applyBgm(v,cb){
  var e=bgmEntry(v);if(!e){cb&&cb('未知曲目');return;}
  stopBgm();stopBgmListen();
  if(v==='off'){S.bgmBuf=null;S.bgmName='';S.bgmSel='off';S.bgmLicense='';cb&&cb('');renderChecks();return;}
  if(e.url){/* CDN 无 CORS 头，不能写进导出音轨：如实拦截，不谎报可用 */
    cb&&cb('在线曲目需先用「⬇ 下载到本地」保存，再用自定义上传接入；CDN 不返回 CORS 头，不能直接进音轨。');return;}
  ensureBuiltinBgm(v).then(function(buf){
    S.bgmBuf=buf;S.bgmName=e.n;S.bgmSel=v;S.bgmLicense=e.lic;S.bgmLocal=1;
    cb&&cb('');renderChecks();
  },function(err){cb&&cb(err.message);});
}
function importBgm(file){
  var c=ctx();if(!c){toast('浏览器不支持音频');return;}
  file.arrayBuffer().then(function(ab){return c.decodeAudioData(ab.slice(0));})
  .then(function(buf){
    S.bgmBuf=buf;S.bgmName=file.name;S.bgmSel='custom';S.bgmLicense='自定义文件 · 授权自行确认';
    var e=$('#bgmName');if(e)e.textContent=file.name+' · '+buf.duration.toFixed(1)+'s';
    if(window.refreshStudio)window.refreshStudio();
    toast('已接入：'+file.name);renderChecks();
  },function(){toast('音频解码失败');});
}
function startBgm(){
  if(!S.bgmBuf||bgmNode)return;var c=ctx();
  bgmNode=c.createBufferSource();bgmNode.buffer=S.bgmBuf;bgmNode.loop=true;
  bgmNode.connect(BUS.bgm);bgmNode.start();
}
function stopBgm(){if(bgmNode){try{bgmNode.stop();}catch(e){}bgmNode=null;}}
function bgmListen(v){
  stopBgmListen();var e=bgmEntry(v);if(!e||v==='off')return;
  if(e.url){bgmAudioEl=new Audio(e.url);bgmAudioEl.loop=true;
    bgmAudioEl.volume=Math.max(0,Math.min(1,S.vol.master*S.vol.bgm));
    var p=bgmAudioEl.play();if(p&&p.catch)p.catch(function(err){toast('在线试听失败：'+err.message);});return;}
  ensureBuiltinBgm(v).then(function(buf){
    var c=ctx(),n=c.createBufferSource();n.buffer=buf;n.loop=true;
    var g=c.createGain();g.gain.value=S.vol.bgm;n.connect(g);g.connect(BUS.bgm);
    n.start();bgmNode=n;
  }).catch(function(err){toast('试听失败：'+err.message);});
}
function stopBgmListen(){if(bgmAudioEl){try{bgmAudioEl.pause();}catch(e){}bgmAudioEl=null;}stopBgm();}
/* ── 流程音效：7 段对应六帧+封面，程序化合成零文件零授权 ── */
var SFX_SEG=[
 {k:'cover',n:'00 · 封面',def:'off'},{k:'hook',n:'01 · 钩子',def:'off'},
 {k:'flip',n:'02 · 反转',def:'off'},{k:'l1',n:'03 · 拆解 1',def:'off'},
 {k:'l2',n:'04 · 拆解 2',def:'off'},{k:'l3',n:'05 · 峰值',def:'off'},
 {k:'end',n:'06 · 收尾',def:'off'},{k:'count',n:'07 · 3·2·1 倒数',def:'off'}
];
var SFX_KINDS=[
 {v:'off',n:'🔇 关闭'},{v:'ding',n:'确认双音'},{v:'star',n:'星芒闪现'},
 {v:'pop',n:'UI 轻点'},{v:'swoosh',n:'转场上升'},{v:'drop',n:'收起落下'},
 {v:'coin',n:'金币拾取'},{v:'click',n:'秒针滴答'},{v:'chime',n:'成就三连'},
 {v:'down',n:'失败下行'},{v:'gong',n:'低沉锣音'},{v:'rise',n:'能量提升'},
 {v:'laser',n:'激光发射'},{v:'custom',n:'⬆ 自定义上传'}
];
function sfxBuf(kind,seg){
  var c=ctx();if(!c)return null;
  if(S.sfxCustom.has(seg))return S.sfxCustom.get(seg);
  var sr=c.sampleRate,dur=.42,len=Math.round(sr*dur),b=c.createBuffer(1,len,sr),d=b.getChannelData(0);
  var f={ding:[660,880],star:[1200,1800],pop:[520,780],swoosh:[300,900],drop:[700,240],
    coin:[880,1320],click:[1400,1400],chime:[523,784],down:[440,220],gong:[180,120],
    rise:[330,660],laser:[900,300]}[kind]||[660,880];
  for(var i=0;i<len;i++){
    var t=i/sr,p=i/len,fr=f[0]+(f[1]-f[0])*p,env=Math.exp(-p*(kind==='gong'?4:9));
    var w=kind==='gong'||kind==='rise'?Math.sin(2*Math.PI*fr*t):
          kind==='laser'?Math.sign(Math.sin(2*Math.PI*fr*t))*.5:
          Math.sin(2*Math.PI*fr*t)+.25*Math.sin(4*Math.PI*fr*t);
    d[i]=w*env*.42;
  }
  return b;
}
function playSfx(kind,seg,when){
  if(!kind||kind==='off')return;var c=ctx();if(!c)return;
  var b=sfxBuf(kind,seg);if(!b)return;
  var n=c.createBufferSource();n.buffer=b;
  var g=c.createGain();g.gain.value=.9;n.connect(g);g.connect(seg==='count'?BUS.count:BUS.sfx);
  n.start(when==null?c.currentTime:when);sfxNodes.push(n);
  n.onended=function(){sfxNodes=sfxNodes.filter(function(x){return x!==n;});};
}
function scheduleSfx(fromT){
  stopSfx();var c=ctx();
  var cfg=S.sfx||{};
  S.frames.forEach(function(f,i){
    var v=cfg[f.shot];if(!v||v==='off')return;
    var at=S.cum[i]-fromT;if(at<-1)return;
    playSfx(v,f.shot,c.currentTime+Math.max(0,at));
  });
  var cv=cfg.count;
  if(cv&&cv!=='off'){
    var base=c.currentTime+Math.max(0,(S.total||0)-fromT-3.6);
    [0,1,2].forEach(function(k){playSfx(cv,'count',base+k*.8);});
  }
}
function stopSfx(){sfxNodes.forEach(function(n){try{n.stop();}catch(e){}});sfxNodes=[];}
function importSfxFile(seg,file){
  var c=ctx();file.arrayBuffer().then(function(ab){return c.decodeAudioData(ab.slice(0));})
  .then(function(buf){S.sfxCustom.set(seg,buf);toast('已导入 '+SFX_SEG.filter(function(x){return x.k===seg;})[0].n);
    if(window.refreshStudio)window.refreshStudio();},function(){toast('音效解码失败');});
}
/* ── 字幕 / 水印参数：默认值完全等于当前观感 ── */
function subVars(el){
  el.style.setProperty('--sub-scale',S.subScale);
  if(S.subFg)el.style.setProperty('--sub-fg',S.subFg);else el.style.removeProperty('--sub-fg');
  if(S.subBg)el.style.setProperty('--sub-bg',S.subBg);else el.style.removeProperty('--sub-bg');
  if(S.subAccent)el.style.setProperty('--sub-accent',S.subAccent);else el.style.removeProperty('--sub-accent');
  if(S.subWrap>0)el.style.setProperty('--sub-wrap',S.subWrap+'ch');else el.style.removeProperty('--sub-wrap');
  el.setAttribute('data-subpos',S.subPos);
  el.setAttribute('data-tw',S.subTw?'1':'0');
  el.style.setProperty('--sub-x',S.subX+'%');
  el.style.setProperty('--sub-y',S.subY+'%');
  el.style.setProperty('--wm-alpha',S.wmAlpha);
  el.style.setProperty('--wm-size',S.wmSize);
}
function subText(f,i){
  var t=String(f.vo||'');
  if(!S.subTw)return t;
  /* 打字机：预览按帧内进度逐字显现；导出联系表由 frameHTML 直出整句 */
  var p=Math.max(0,Math.min(1,(S.t-(S.cum[i]||0))/Math.max(.001,f.dur)));
  p=Math.min(1,p*S.subTwSpeed*1.6);
  return t.slice(0,Math.max(1,Math.ceil(t.length*p)));
}
/* ── 音频导出：离线混音成 WAV(PCM) / MP3(lamejs) ── */
function encodeWav(buf){
  var ch=Math.min(2,buf.numberOfChannels),n=buf.length,sr=buf.sampleRate;
  var ab=new ArrayBuffer(44+n*ch*2),v=new DataView(ab);
  function str(o,x){for(var i=0;i<x.length;i++)v.setUint8(o+i,x.charCodeAt(i));}
  str(0,'RIFF');v.setUint32(4,36+n*ch*2,true);str(8,'WAVE');str(12,'fmt ');
  v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);
  v.setUint32(24,sr,true);v.setUint32(28,sr*ch*2,true);v.setUint16(32,ch*2,true);
  v.setUint16(34,16,true);str(36,'data');v.setUint32(40,n*ch*2,true);
  var off=44,data=[];
  for(var c=0;c<ch;c++)data.push(buf.getChannelData(Math.min(c,buf.numberOfChannels-1)));
  for(var i=0;i<n;i++)for(var c=0;c<ch;c++){
    var x=Math.max(-1,Math.min(1,data[c][i]));v.setInt16(off,x<0?x*32768:x*32767,true);off+=2;}
  return new Blob([ab],{type:'audio/wav'});
}
async function offlineMix(){
  var sr=44100,total=Math.max(1,S.total||1),len=Math.ceil(sr*total);
  var OC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!OC)throw new Error('浏览器不支持离线混音');
  var o=new OC(2,len,sr);
  function put(b,at,gain,bus,loop){
    if(!b)return;
    var n=o.createBufferSource();n.buffer=b;n.loop=!!loop;
    var g=o.createGain();g.gain.value=gain;n.connect(g);g.connect(o.destination);
    n.start(Math.max(0,at));
  }
  S.frames.forEach(function(f,i){
    var b=S.tts.get(ttsKey(f.speak||''));if(b)put(b,S.cum[i]||0,S.vol.voice,'voice');
    var sv=(S.sfx||{})[f.shot];if(sv&&sv!=='off'){var sb=sfxBuf(sv,f.shot);if(sb)put(sb,S.cum[i]||0,S.vol.sfx,'sfx');}
  });
  if(S.bgmBuf)put(S.bgmBuf,0,S.vol.bgm,'bgm',true);
  var cv=(S.sfx||{}).count;
  if(cv&&cv!=='off'){var cb=sfxBuf(cv,'count');if(cb)[0,1,2].forEach(function(k){put(cb,Math.max(0,total-3.6+k*.8),S.vol.count,'count');});}
  return await o.startRendering();
}
async function exportAudio(fmt){
  var buf=await offlineMix();
  if(fmt==='wav'){var w=encodeWav(buf);dl(w,'帧语_内容音频.wav');return {bytes:w.size,mime:'audio/wav'};}
  if(fmt==='mp3'){
    if(!window.lamejs)throw new Error('lamejs 未加载');
    var d=buf.getChannelData(0),pcm=new Int16Array(d.length);
    for(var i=0;i<d.length;i++)pcm[i]=Math.max(-32768,Math.min(32767,d[i]*32767));
    var enc=new window.lamejs.Mp3Encoder(1,buf.sampleRate,128),out=[],CH=1152;
    for(var j=0;j<pcm.length;j+=CH){var b=enc.encodeBuffer(pcm.subarray(j,j+CH));if(b.length)out.push(new Uint8Array(b));}
    var tail=enc.flush();if(tail.length)out.push(new Uint8Array(tail));
    var bl=new Blob(out,{type:'audio/mpeg'});dl(bl,'帧语_内容音频.mp3');return {bytes:bl.size,mime:'audio/mpeg'};
  }
  throw new Error('未知音频格式');
}
function exportSrcList(){
  var lines=['帧语 · 来源与授权清单','',
    '题目：'+S.q,'题型：'+S.type,'来源：'+(S.src||'未填写'),
    '免责：'+(S.disclaimer||'未填写'),'',
    '配乐：'+(S.bgmName||'未接入'),'授权：'+(S.bgmLicense||'—'),
    '人声：'+(S.voiceTakeName||'LibreTTS 在线合成 / '+S.voice),
    '音色接口：'+(S.vUrl||'libretts.is-an.org（免密钥，题目与讲稿会发送给第三方）'),
    '',S.useCover?'封面：单独导出 PNG':'封面：未启用'];
  var bl=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});
  dl(bl,'帧语_来源与授权清单.txt');return {bytes:bl.size};
}

/* ─────────────────────────────────────────────────────────────
   5. 播放器
   ───────────────────────────────────────────────────────────── */
function frameAt(t){var i=0;for(var k=0;k<S.frames.length;k++)if(t>=S.cum[k])i=k;return i;}
function tick(ts){
  if(!S.playing)return;
  var dt=S.lastTs?(ts-S.lastTs)/1000:0;S.lastTs=ts;
  S.t=Math.min(S.total,S.t+Math.max(0,Math.min(.1,dt)));
  var i=frameAt(S.t);if(i!==S.cur)renderFrame(i);else updateSegFill(i);
  updateBar();
  if(S.t>=S.total){stop();return;}
  S.raf=requestAnimationFrame(tick);
}
function updateSegFill(i){
  var e=$$('.tlseg')[i];if(!e)return;
  var f=S.frames[i],p=Math.max(0,Math.min(1,(S.t-S.cum[i])/f.dur));
  e.querySelector('.tlfill').style.width=(p*100)+'%';
}
function play(){
  if(S.playing){stop();return;}
  if(S.t>=S.total-.02)S.t=0;
  S.playing=true;S.lastTs=0;$('#btnPlay').textContent='⏸';
  ctx();startBgm();scheduleVoices(S.t);scheduleSfx(S.t);
  S.raf=requestAnimationFrame(tick);
}
function stop(){S.playing=false;cancelAnimationFrame(S.raf);$('#btnPlay').textContent='▶';
  stopVoices();stopBgm();stopSfx();duck(false);renderFrame(frameAt(S.t));updateBar();}
function seekTo(t){S.t=Math.max(0,Math.min(S.total,t));S.lastTs=0;
  renderFrame(frameAt(S.t));updateBar();
  if(S.playing){stopVoices();stopSfx();scheduleVoices(S.t);scheduleSfx(S.t);}}

/* ─────────────────────────────────────────────────────────────
   6. 出片检查 / 能力检测
   ───────────────────────────────────────────────────────────── */
function renderChecks(){
  var need=S.frames.filter(function(f){return f.speak;}).length;
  var v=$('#checks'),items=[
    [!!String(S.q||'').trim(),'题干已填写（封面 / 钩子大字）'],
    [(Array.isArray(S.points)?S.points.join('\n'):String(S.points||'')).split(/\n+/).filter(function(x){return x.trim();}).length>0,'拆解要点至少 1 条'],
    [!!String(S.ans||'').trim(),'结论已填写（只在最后一拍揭晓）'],
    [!!String(S.disclaimer||'').trim(),'免责声明已填写（只上画面，不朗读）'],
    [S.tts.size>=need&&need>0,'人声已合成 '+S.tts.size+' / '+need+' 句（未合成则成片无旁白）'],
    [!!S.bgmBuf,'已接入配乐：'+(S.bgmName||'未接入')+'（未接则成片无配乐）'],
    [(S.bgmLicense||'').indexOf('需先下载')<0,'配乐授权可随片使用（在线曲目需先下载到本地）'],
    [S.sub,'字幕开启（'+(S.subMode==='smart'?'智能去重':'始终显示')+'）'],
    [!!String(S.wmText||'').trim()||true,'水印可选（留空则不绘制）'],
    [S.coverExported===true,'平台封面 PNG 已导出（发布时单独上传）']
  ];
  v.innerHTML=items.map(function(x){return '<div class="chk '+(x[0]?'ok':'no')+'"><i>'+(x[0]?'✓':'!')+'</i>'+esc(x[1])+'</div>';}).join('');
  window.__CHECKS__=items;
}
function detectCap(){
  var MR=window.MediaRecorder,types={};
  ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm',
   'video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4'].forEach(function(t){
    try{types[t]=!!(MR&&MR.isTypeSupported&&MR.isTypeSupported(t));}catch(e){types[t]=false;}
  });
  var ok=types['video/webm;codecs=vp9,opus']||types['video/webm;codecs=vp8,opus']||types['video/webm'];
  var mp4=types['video/mp4;codecs=avc1.42E01E,mp4a.40.2']||types['video/mp4'];
  $('#capBadge').textContent=ok?'可录 WebM':'不可用';
  $('#capBadge').className='badge '+(ok?'ok':'warn');
  $('#capText').textContent=mp4?'本机可直录 MP4，但本工具统一输出 WebM 以保证音画同源。':
    '本机不支持直录 MP4（浏览器编码器限制）。将输出 WebM，再用 ffmpeg 转 MP4。不谎报格式。';
  window.__CAP__={ok:ok,mp4:mp4,types:types,hasMR:!!MR,
    hasCapture:!!(document.createElement('canvas').captureStream)};
}

/* ─────────────────────────────────────────────────────────────
   7. 导出：DOM → SVG foreignObject → Canvas（预览同源）
   ───────────────────────────────────────────────────────────── */
function frameToCanvasOf(f,idx){
  var W=(S.ratio==='9:16')?1080:1920,H=(S.ratio==='9:16')?1920:1080;
  var el=$('#frame'),saveHTML=el.innerHTML,saveBeat=el.getAttribute('data-beat');
  return new Promise(function(resolve,reject){
    /* 临时改成目标帧，序列化完立刻还原，不留视觉副作用 */
    el.setAttribute('data-beat',f.beat);el.innerHTML=frameHTML(f);
  el.setAttribute('data-aud',S.audience?'general':'short');
    var clone=el.cloneNode(true);
    clone.style.setProperty('--scale',effScale());
    clone.style.transform='none';
    clone.setAttribute('data-wmpos',S.wmPos);
    subVars(clone);
    /* 安全区辅助线只给预览，绝不进成片 */
    clone.setAttribute('data-guide','0');
    var xhtml=new XMLSerializer().serializeToString(clone);
    el.innerHTML=saveHTML;el.setAttribute('data-beat',saveBeat);
    var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+
      '<foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">'+
      '<style>'+FRAME_CSS.replace(/<\/style/gi,'<\\/style')+'</style>'+xhtml+'</div></foreignObject></svg>';
    /* 必须用 data: URL —— Chrome 对 blob: URL 的 foreignObject SVG 会污染 canvas，
       toBlob / captureStream 都会失败；同源 data URL 不会（实测）。 */
    var url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    var img=new Image();
    img.onload=function(){
      var cv=document.createElement('canvas');cv.width=W;cv.height=H;
      var c=cv.getContext('2d');c.drawImage(img,0,0,W,H);
      window.__EXPORT_FRAME__={i:idx,w:W,h:H,svgBytes:svg.length,urlBytes:url.length,guide:false,
        fmt:clone.getAttribute('data-format'),hasSubFit:xhtml.indexOf('--sub-fit')>=0,
        subText:(clone.querySelector('.subwrap')||{}).textContent||'',
        titleText:(clone.querySelector('.big-title,.cover-title')||{}).textContent||''};
      resolve(cv);
    };
    img.onerror=function(){reject(new Error('SVG 光栅化失败'));};
    img.src=url;
  });
}
function frameToCanvas(i){return frameToCanvasOf(S.frames[i],i);}
/* 平台发布用的静态封面：独立导出，不依赖「封面是否作视频首帧」 */
function coverFrame(){
  var q=String(S.q||'').trim()||'这道题，你会怎么选？';
  var h=hash(q);
  return {beat:'cover',label:'封面',no:'00',title:String(S.coverTitle||'').trim()||q,
    sub:String(S.hook||'').trim()||TWISTS[h%TWISTS.length],subtitle:'',speak:'',
    column:S.column,issue:S.issue,disclaim:S.disclaimer,typeLabel:TYPE_LABEL[S.type]||'',
    chip:(Array.isArray(S.points)?S.points.join('\n'):String(S.points||'')).split(/\n+/).filter(function(x){return x.trim();}).length+' 点拆解'};
}
async function exportCover(){
  var cv=await frameToCanvasOf(coverFrame(),-1);
  var blob=await new Promise(function(r){cv.toBlob(r,'image/png');});
  dl(blob,'帧语_平台封面_'+(S.ratio==='9:16'?'1080x1920':'1920x1080')+'.png');
  window.__EXPORT_COVER__={bytes:blob.size,w:cv.width,h:cv.height,
    title:coverFrame().title,disclaim:!!S.disclaimer};
  $('#expStat').textContent='封面 PNG 已导出（'+(blob.size/1024).toFixed(0)+' KB）。';
  toast('封面已导出');
}
function dl(blob,name){
  var a=document.createElement('a'),u=URL.createObjectURL(blob);
  a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(u);},3000);
  window.__DOWNLOAD__={name:name,bytes:blob.size};
  if(name.indexOf('封面')>=0)S.coverExported=true;
}
async function exportContactSheet(){
  $('#expStat').textContent='正在生成联系表…';
  var cvs=[];
  for(var i=0;i<S.frames.length;i++){
    cvs.push(await frameToCanvas(i));
    $('#expFill').style.width=((i+1)/S.frames.length*100)+'%';
  }
  var cols=Math.min(4,cvs.length),tw=270,th=Math.round(tw*(S.ratio==='9:16'?1920/1080:1080/1920));
  var rows=Math.ceil(cvs.length/cols),pad=16;
  var sheet=document.createElement('canvas');
  sheet.width=cols*(tw+pad)+pad;sheet.height=rows*(th+pad+26)+pad;
  var c=sheet.getContext('2d');c.fillStyle='#0b1119';c.fillRect(0,0,sheet.width,sheet.height);
  cvs.forEach(function(cv,i){
    var x=pad+(i%cols)*(tw+pad),y=pad+Math.floor(i/cols)*(th+pad+26);
    c.drawImage(cv,x,y,tw,th);
    c.fillStyle='#8fa3b8';c.font='12px sans-serif';
    c.fillText(String(i+1).padStart(2,'0')+' · '+S.frames[i].label,x,y+th+17);
  });
  var blob=await new Promise(function(r){sheet.toBlob(r,'image/png');});
  dl(blob,'帧语_全部帧_联系表.png');
  /* 同时导出当前帧全尺寸 PNG，确认 1080×1920 真出图 */
  var full=await frameToCanvas(Math.max(0,S.cur));
  var fb=await new Promise(function(r){full.toBlob(r,'image/png');});
  dl(fb,'帧语_当前帧_1080x1920.png');
  window.__EXPORT_PNG__={frames:cvs.length,sheet:[sheet.width,sheet.height],fullBlob:fb.size,
    sheetBlob:blob.size,pixel:(function(){var d=full.getContext('2d').getImageData(540,960,1,1).data;return [d[0],d[1],d[2],d[3]];})()};
  $('#expStat').textContent='已导出 '+cvs.length+' 帧联系表 + 1 张全尺寸帧 PNG。';
  toast('PNG 已导出');
}
async function exportWebM(){
  var cap=window.__CAP__||{};
  if(!cap.ok||!cap.hasCapture||!window.MediaRecorder){
    $('#expStat').textContent='本机不支持 MediaRecorder / captureStream，无法录制 WebM。已保留 PNG 导出。';
    toast('录制能力不可用');return;
  }
  if(S.exporting)return;S.exporting=true;
  $('#expStat').textContent='正在录制（实时，时长 '+S.total.toFixed(1)+'s）…';
  var W=(S.ratio==='9:16')?1080:1920,H=(S.ratio==='9:16')?1920:1080;
  var cv=document.createElement('canvas');cv.width=W;cv.height=H;
  var c=cv.getContext('2d');
  var stream=cv.captureStream(30);
  var c2=ctx();if(mediaDest)mediaDest.stream.getAudioTracks().forEach(function(t){stream.addTrack(t);});
  var mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']
    .filter(function(t){try{return MediaRecorder.isTypeSupported(t);}catch(e){return false;}})[0]||'video/webm';
  var chunks=[],rec;
  try{rec=new MediaRecorder(stream,{mimeType:mime});}catch(e){
    S.exporting=false;$('#expStat').textContent='录制器创建失败：'+e.message;return;}
  rec.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data);};
  rec.onstop=function(){
    S.exporting=false;
    var blob=new Blob(chunks,{type:'video/webm'});dl(blob,'帧语短片.webm');
    window.__EXPORT_WEBM__={bytes:blob.size,mime:mime,chunks:chunks.length};
    $('#expStat').textContent='已录制 WebM · '+(blob.size/1024).toFixed(0)+' KB · '+mime;toast('WebM 已导出');
  };
  /* 先用第 0 帧铺底，再按虚拟时钟逐帧绘制 */
  var first=await frameToCanvas(0);c.drawImage(first,0,0,W,H);
  rec.start(200);
  startBgm();scheduleVoices(0);
  var t0=performance.now(),last=-1,DUR=window.__WEBM_TEST_DUR__||S.total;
  (function loop(){
    var t=(performance.now()-t0)/1000;
    if(t>=DUR||!S.exporting){
      $('#expFill').style.width='100%';
      try{rec.stop();}catch(e){}stopVoices();stopBgm();return;
    }
    var i=frameAt(t);
    if(i!==last){frameToCanvas(i).then(function(fc){c.drawImage(fc,0,0,W,H);});last=i;}
    $('#expFill').style.width=(t/DUR*100)+'%';
    requestAnimationFrame(loop);
  })();
}

/* ─────────────────────────────────────────────────────────────
   8. 事件绑定
   ───────────────────────────────────────────────────────────── */
function bind(){
  /* 步骤 */
  $$('.step').forEach(function(b){b.onclick=function(){goStep(+b.dataset.step);};});
  $$('[data-go]').forEach(function(b){b.onclick=function(){goStep(+b.dataset.go);};});
  /* 画幅 */
  $('#r916').onclick=function(){setRatio('9:16');};
  $('#r169').onclick=function(){setRatio('16:9');};
  /* 主题 / 皮肤 */
  renderTpls();renderLayouts();renderSkeletons();
  $$('#themes .tcard').forEach(function(b){b.onclick=function(){
    S.theme=b.dataset.t;$$('#themes .tcard').forEach(function(x){x.classList.toggle('on',x===b);});
    renderFrame(S.cur);};});
  $('#btnTheme').onclick=function(){$('#themePop').hidden=false;};
  $('#themeClose').onclick=function(){$('#themePop').hidden=true;};
  $$('#skins button').forEach(function(b){b.onclick=function(){
    document.body.setAttribute('data-skin',b.dataset.k);
    $$('#skins button').forEach(function(x){x.classList.toggle('on',x===b);});};});
  /* 字阶 / 字幕 / 声音 */
  $$('#sizes button').forEach(function(b){b.onclick=function(){
    S.scale=+b.dataset.s/100;$$('#sizes button').forEach(function(x){x.classList.toggle('on',x===b);});
    computeFit();renderFrame(S.cur);refit();};});
  $$('#subSw button').forEach(function(b){b.onclick=function(){
    S.sub=b.dataset.v==='1';$$('#subSw button').forEach(function(x){x.classList.toggle('on',x===b);});
    setSub(S.sub);};});
  /* 表单：题型单独走 loadPreset（切换真的换整套示例题） */
  var map={f_q:'q',f_opts:'opts',f_ans:'ans',f_points:'points',f_src:'src',f_voice:'voice',
    f_hook:'hook',f_coverTitle:'coverTitle',f_column:'column',f_issue:'issue',
    f_disclaim:'disclaimer',f_cta:'cta',
    f_tags:'tags',f_hammers:'hammers',f_notes:'notes',f_takeaway:'takeaway'};
  Object.keys(map).forEach(function(id){
    var e=document.getElementById(id);if(!e)return;
    e.addEventListener('input',function(){S[map[id]]=e.value;rebuild();});
    e.addEventListener('change',function(){S[map[id]]=e.value;rebuild();});
  });
  $('#f_type').onchange=function(){loadPreset(this.value);if(window.renderTopics)renderTopics();};
  var fe=document.getElementById('f_fmt');
  if(fe)fe.onchange=function(){
    var k=fe.value;
    if(k==='quiz'){S.fmt='quiz';S.topicFmt='全部';loadPreset('judge');renderTopics();return;}
    S.fmt=k;S.topicFmt=k;
    var first=FORMAT_TOPICS.filter(function(T){return T.fmt===k;})[0];
    if(first)loadTopic(first.id);
    else{rebuild();renderTopics();}
  };
  window.__SETFMT__=function(k){
    var e=document.getElementById('f_fmt');if(e){e.value=k;e.onchange();}
    return {fmt:S.fmt,topicId:S.topicId,q:S.q,flower:(S.frames[0]||{}).flower};
  };
  var ts=document.getElementById('topicSearch');if(ts)ts.addEventListener('input',renderTopics);
  /* 三个开关 */
  var sw={f_useCover:'useCover',f_autoFit:'autoFit',f_guide:'guide',
          f_showOpts:'showOpts',f_autoTpl:'autoTpl',f_subSync:'subSync',
 f_audience:'audience'};
  Object.keys(sw).forEach(function(id){
    var e=document.getElementById(id);if(!e)return;
    e.onchange=function(){
      S[sw[id]]=e.checked;
      if(id==='f_audience'){setAudience(e.checked);syncAudienceFields();}
      if(id==='f_autoFit')computeFit();
      rebuild();
    };
  });
  if($('#btnPlatform'))$('#btnPlatform').onclick=applyPlatform;
  if($('#btnExportCover'))$('#btnExportCover').onclick=function(){exportCover().then(renderChecks).catch(function(e){
    $('#expStat').textContent='封面导出失败：'+e.message;toast('封面导出失败');});};
  if($('#btnSynthCancel'))$('#btnSynthCancel').onclick=function(){S.synthCancel=true;$('#synthTxt').textContent='已请求取消…';};
  $('#f_rate').oninput=function(){S.rate=+$('#f_rate').value/100;$('#rateval').textContent=S.rate.toFixed(2)+'×';
    S.tts.clear();renderSynthList();renderChecks();};
  /* 音色列表 */
  $('#f_voice').innerHTML=VOICES.map(function(v){return '<option value="'+v[0]+'">'+v[1]+'</option>';}).join('');
  /* 试听 / 合成 */
  $('#btnTryVoice').onclick=function(){
    $('#vstat').textContent='正在请求在线接口…';$('#vstat').className='voicestat';
    playOne(S.frames[0]?S.frames[0].speak:S.q).then(function(x){
      $('#vstat').textContent='✔ 在线接口可用 · 实测 '+x.buf.duration.toFixed(2)+'s · 音色 '+S.voice+(x.hit?' · 命中缓存':'');
      $('#vstat').className='voicestat ok';renderChecks();
    }).catch(function(e){
      $('#vstat').textContent='✘ 在线接口不可用：'+e.message+'。请检查网络、换音色，或改用本地录音；不会自动换成机械音。';
      $('#vstat').className='voicestat err';
    });
  };
  $('#btnSynthAll').onclick=synthAll;
  /* 配乐 */
  $('#f_bgm').onchange=function(e){if(e.target.files[0])importBgm(e.target.files[0]);};
  var drop=$('#bgmDrop');
  ['dragenter','dragover'].forEach(function(t){drop.addEventListener(t,function(e){e.preventDefault();drop.classList.add('over');});});
  ['dragleave','drop'].forEach(function(t){drop.addEventListener(t,function(e){e.preventDefault();drop.classList.remove('over');});});
  drop.addEventListener('drop',function(e){if(e.dataTransfer.files[0])importBgm(e.dataTransfer.files[0]);});
  $('#btnBgmPlay').onclick=function(){if(!S.bgmBuf){toast('请先选择音频');return;}ctx();startBgm();toast('配乐试听中');};
  $('#btnBgmStop').onclick=function(){stopBgm();toast('已停止');};
  $('#btnBgmClear').onclick=function(){stopBgm();S.bgmBuf=null;S.bgmName='';
    $('#bgmName').textContent='尚未选择 · 也可拖拽到此处';renderChecks();toast('已移除配乐');};
  /* 播放器 */
  $('#btnPlay').onclick=play;
  $('#btnReplay').onclick=function(){seekTo(0);$('#btnPlay').textContent='⏸';if(!S.playing)play();};
  $('#btnSub').onclick=function(){setSub(!S.sub);};
  $('#btnSound').onclick=function(){
    S.sound=!S.sound;$('#btnSound').classList.toggle('on',S.sound);
    if(master)master.gain.value=S.sound?1:0;
    if(!S.sound)stopVoices();
  };
  $('#btnFull').onclick=function(){
    if(document.fullscreenElement)document.exitFullscreen();
    else document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();
  };
  $('#seek').onclick=function(e){var r=this.getBoundingClientRect();
    seekTo((e.clientX-r.left)/r.width*S.total);};
  $('#btnFit').onclick=function(){refit();toast('已适应窗口');};
  /* 导出 */
  $('#btnExportPng').onclick=function(){exportContactSheet().catch(function(e){
    $('#expStat').textContent='导出失败：'+e.message;toast('导出失败');});};
  $('#btnExportWebm').onclick=exportWebM;
  $('#btnCopyFf').onclick=function(){
    var t=$('#ffCmd').textContent;
    if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){toast('命令已复制');},function(){toast('复制失败，请手动选中');});
    else toast('请手动复制命令');
  };
  /* 全局 */
  window.addEventListener('resize',refit);
  document.addEventListener('keydown',function(e){
    if(e.target.matches('input,textarea,select'))return;
    if(e.code==='Space'){e.preventDefault();play();}
    if(e.key==='r'||e.key==='R')seekTo(0);
  });
}
function setSub(v){
  S.sub=v;$('#btnSub').classList.toggle('on',v);
  $$('#subSw button').forEach(function(x){x.classList.toggle('on',(x.dataset.v==='1')===v);});
  renderFrame(S.cur);renderChecks();
}
function setRatio(r){
  S.ratio=r;$('#r916').classList.toggle('on',r==='9:16');$('#r169').classList.toggle('on',r==='16:9');
  computeFit();refit();renderFrame(S.cur);
}
function goStep(n){
  S.step=n;$$('.step').forEach(function(b){
    var k=+b.dataset.step;b.classList.toggle('on',k===n);b.classList.toggle('done',k<n);});
  $$('.page').forEach(function(p){p.classList.toggle('on',+p.dataset.page===n);});
  $('#panel').scrollTop=0;
  if(n===3){renderChecks();detectCap();}
  window.__STEP__=n;
}
/* 逐句状态表：让「合成」不再是黑盒 */
function renderSynthList(){
  var list=[],seen={};
  S.frames.forEach(function(f){if(f.speak&&!seen[f.speak]){seen[f.speak]=1;list.push(f.speak);}});
  var v=$('#synthList');if(!v)return;
  /* 状态由人声缓存决定，而不是写死「待合成」：
     rebuild 现在会重建本表，若写死就会把已合成的句子刷回初始态。 */
  v.innerHTML=list.map(function(t,i){
    var key=ttsKey(t),done=S.tts.has(key),bad=S.ttsFail&&S.ttsFail.has(key);
    return '<div class="srow" data-i="'+i+'"><span class="sno">'+String(i+1).padStart(2,'0')+'</span>'+
      '<span class="stxt">'+esc(shorten(t,15))+'</span>'+
      '<span class="sstate'+(bad?' fail':done?' ok':'')+'">'+(bad?'失败 · 点合成重试':done?'已缓存':'待合成')+'</span></div>';
  }).join('');
  window.__SYNTH_LIST__=list;
  return list;
}
function setSynthState(i,st,msg){
  var r=document.querySelector('#synthList .srow[data-i="'+i+'"]');if(!r)return;
  var e=r.querySelector('.sstate');e.className='sstate '+st;
  e.textContent=st==='busy'?'合成中…':st==='ok'?'已缓存':st==='fail'?'失败':'待合成';
  if(msg)e.title=msg;
}
/* 并发 4 路：串行 6 句 × 8s 超时最坏 48s → 并发最坏约 16s；相同文案合并；失败只补失败句 */
async function synthAll(){
  var list=renderSynthList();
  S.synthCancel=false;S.ttsDone=0;
  var t0=performance.now(),idx=0,done=0,CONC=Math.max(1,Math.min(12,+S.conc||4));
  $('#synthFill').style.width='0%';
  $('#synthTxt').textContent='并发 '+CONC+' 路合成中 · 0 / '+list.length;
  async function worker(){
    while(idx<list.length&&!S.synthCancel){
      var my=idx++,key=ttsKey(list[my]);
      setSynthState(my,'busy');S.ttsFail.delete(key);
      try{await fetchTTS(list[my]);setSynthState(my,'ok');S.ttsDone++;}
      catch(e){S.ttsFail.add(key);setSynthState(my,'fail',e.message);}
      done++;
      $('#synthFill').style.width=(done/list.length*100)+'%';
      $('#synthTxt').textContent='并发 '+CONC+' 路 · '+done+' / '+list.length+
        ' 句（成功 '+S.ttsDone+'）';
    }
  }
  var pool=[];for(var i=0;i<Math.min(CONC,list.length);i++)pool.push(worker());
  await Promise.all(pool);
  var ms=Math.round(performance.now()-t0);
  $('#synthTxt').textContent=S.synthCancel?'已取消 · '+S.ttsDone+' / '+list.length+' 句已缓存':
    S.ttsDone+' / '+list.length+' 句已合成 · 耗时 '+(ms/1000).toFixed(1)+'s（实测时长已写进时间轴）';
  window.__SYNTH__={total:list.length,done:S.ttsDone,ms:ms,conc:CONC,canceled:S.synthCancel};
  rebuild();if(window.refreshStudio)window.refreshStudio();
  toast(S.synthCancel?'合成已取消':'合成完成：'+S.ttsDone+' 句');
}
/* 题型切换：载入整套示例题，题干真的变；科普 / 解说无选项、答案改叫核心结论 */
function syncForm(){
  var ids={f_type:'type',f_q:'q',f_opts:'opts',f_ans:'ans',f_points:'points',f_src:'src',
    f_hook:'hook',f_coverTitle:'coverTitle',f_column:'column',f_issue:'issue',
    f_disclaim:'disclaimer',f_cta:'cta',
    f_tags:'tags',f_hammers:'hammers',f_notes:'notes',f_takeaway:'takeaway'};
  Object.keys(ids).forEach(function(id){
    var e=document.getElementById(id);if(e)e.value=S[ids[id]]||'';
  });
  [['f_useCover','useCover'],['f_autoFit','autoFit'],['f_guide','guide'],
   ['f_showOpts','showOpts'],['f_autoTpl','autoTpl'],['f_subSync','subSync']].forEach(function(a){
    var e=document.getElementById(a[0]);if(e)e.checked=!!S[a[1]];
  });
}
function applyTypeUI(){
  var noOpt=(S.type==='kepu'),o=document.getElementById('fld_opts'),e=document.getElementById('f_opts');
  if(o)o.classList.toggle('disabled',noOpt);
  if(e)e.disabled=noOpt;
  var lab=document.getElementById('label_ans');
  if(lab)lab.innerHTML=noOpt?'核心结论 <em>只在最后一拍出现</em>':'答案 / 结论 <em>只在最后一拍出现</em>';
  var badge=document.getElementById('badge_'+S.type);
  window.__TYPE_UI__={noOpt:noOpt,label:TYPE_LABEL[S.type],optsDisabled:!!(e&&e.disabled)};
}
function loadPreset(type){
  S.fmt='quiz';var ffe=document.getElementById('f_fmt');if(ffe)ffe.value='quiz';
  var P=PRESETS[type];if(!P)return;
  S.type=type;S.q=P.q;S.opts=P.opts;S.ans=P.ans;S.points=P.points;S.src=P.src;S.hook=P.hook;
  S.tags=P.tags||'';S.hammers=P.hammers||'';S.notes=P.notes||'';S.takeaway=P.takeaway||'';
  S.coverTitle='';S.cta='';S.coverExported=false;
  S.ask='';S.topicId='';S.topicHeat='';S.takeaway=P.takeaway||'';
  S.category='';  /* 预设不带题材分类，避免热度行 / 配套模板残留成暗字 */
  syncForm();applyTypeUI();rebuild();
  window.__PRESET_LOADED__={type:type,q:P.q,opts:P.opts,ans:P.ans,points:P.points,
    hook:P.hook,noOpt:(type==='kepu')};
  toast('已载入「'+TYPE_LABEL[type]+'」示例题 · 题干 / 选项 / 答案 / 要点已更新');
}
/* ── 热门话题库：点卡片整套载入（题干 / 答案 / 3 条要点 / 数据锤 / 带走句 / 来源） ── */
/* 切换「面向大众」时，S 里缓存的 hook/cta/notes 必须跟着换，
   否则 buildFrames 读的是旧文案；不重新 loadTopic，避免重置模板与滚动位置。 */
function syncAudienceFields(){
  var T=null;
  for(var i=0;i<HOT_TOPICS.length;i++)if(HOT_TOPICS[i].id===S.topicId)T=HOT_TOPICS[i];
  var M=T||PRESETS[S.type]||PRESETS.judge;
  S.hook=M.hook||'';S.cta=M.cta||'';S.notes=M.notes||'';
  S.takeaway=M.takeaway||'';S.ask=M.ask||'';
  S.explain=M.explain||'';S.gloss=M.gloss||'';S.basis=M.basis||'';S.opts=M.opts||'';
  S.ans=M.ans||S.ans;S.takeaway=M.takeaway||S.takeaway;
  syncForm();
}
function loadTopic(id){
  var T=null;for(var i=0;i<HOT_TOPICS.length;i++)if(HOT_TOPICS[i].id===id)T=HOT_TOPICS[i];
  if(!T)return;
  S.type=T.type;S.q=T.q;S.opts=T.opts||'';S.ans=T.ans;S.points=T.points;S.src=T.src;
  S.hook=T.hook;S.cta=T.cta;S.tags=T.tags;S.hammers=T.hammers;S.notes=T.notes;
  S.explain=T.explain||'';S.gloss=T.gloss||'';S.basis=T.basis||'';
  S.takeaway=T.takeaway;S.ask=T.ask||'';S.topicId=T.id;S.topicHeat=T.heat;
  S.category=guessCat(T);S.coverTitle='';S.coverExported=false;
  S.fmt=T.fmt||'quiz';
  var fe=document.getElementById('f_fmt');if(fe)fe.value=S.fmt;
  if(S.autoTpl){S.tpl=tplFor(T);renderTpls();}
  syncForm();applyTypeUI();rebuild();renderTopics();
  window.__TOPIC_LOADED__={id:T.id,q:T.q,type:T.type,heat:T.heat,src:T.src,
    opts:S.opts,category:S.category,tpl:S.tpl,evidence:T.evidence||'',
    points:T.points.split('\n').length,hammers:T.hammers,takeaway:T.takeaway,
    explain:S.explain,gloss:S.gloss};
  toast('已载入热门话题：'+T.q.slice(0,14)+'…');
}
function renderFmtChips(){
  var bar=document.getElementById('fmtCats');if(!bar)return;
  var ks=['全部'].concat(FORMATS.map(function(F){return F.k;}));
  bar.innerHTML=ks.map(function(k){
    var n=k==='全部'?HOT_TOPICS.length:HOT_TOPICS.filter(function(t){return (t.fmt||'quiz')===k;}).length;
    var nm=k==='全部'?'全部形态':(FORMATS.filter(function(x){return x.k===k;})[0]||{}).name;
    return '<button class="catchip'+(S.topicFmt===k?' on':'')+'" data-f="'+esc(k)+'">'+
      esc(nm||k)+'<small>'+n+'</small></button>';
  }).join('');
  Array.prototype.forEach.call(bar.querySelectorAll('.catchip'),function(b){
    b.onclick=function(){S.topicFmt=b.dataset.f;renderTopics();};});
}
function renderCatChips(){
  var bar=document.getElementById('topicCats');if(!bar)return;
  bar.innerHTML=CAT_LIST.map(function(c){
    var n=c==='全部'?HOT_TOPICS.length:HOT_TOPICS.filter(function(t){return guessCat(t)===c;}).length;
    return '<button class="catchip'+(S.topicCat===c?' on':'')+'" data-c="'+esc(c)+'">'+
      esc(c==='全部'?'全部':c.replace('与','·').replace('/','·'))+'<small>'+n+'</small></button>';
  }).join('');
  Array.prototype.forEach.call(bar.querySelectorAll('.catchip'),function(b){
    b.onclick=function(){S.topicCat=b.dataset.c;renderTopics();};});
}
function renderTopics(){
  var box=document.getElementById('topicList');if(!box)return;
  renderCatChips();renderFmtChips();
  var q=String((document.getElementById('topicSearch')||{}).value||'').trim().toLowerCase();
  var list=HOT_TOPICS.filter(function(t){
    if(S.topicCat!=='全部'&&guessCat(t)!==S.topicCat)return false;
    if(S.topicFmt!=='全部'&&(t.fmt||'quiz')!==S.topicFmt)return false;
    return !q||(t.q+t.heat+t.src+(t.tags||'')+guessCat(t)+(t.fmt||'')).toLowerCase().indexOf(q)>=0;});
  box.innerHTML=list.map(function(t){
    var ev=t.evidence==='有依据'?'<em class="ev ok">有依据</em>':'<em class="ev">常见度收录</em>';
    var fk=t.fmt||'quiz',fn=(FORMATS.filter(function(x){return x.k===fk;})[0]||FORMATS[0]).name;
    return '<button class="tcard2'+(S.topicId===t.id?' on':'')+'" data-id="'+t.id+'">'+
      '<span class="th"><b>'+esc(String(t.heat||'').slice(0,26))+'</b>'+ev+'</span>'+
      '<span class="tfmt">'+esc(fn)+'</span>'+
      '<span class="tq">'+esc(t.q)+'</span>'+
      '<span class="ts">'+esc(guessCat(t))+' · '+esc(t.src||'')+'</span></button>';
  }).join('')||'<div class="tnone">没有匹配的话题</div>';
  Array.prototype.forEach.call(box.querySelectorAll('.tcard2'),function(b){
    b.onclick=function(){loadTopic(b.dataset.id);};});
  var n=document.getElementById('topicCount');if(n)n.textContent=list.length+' / '+HOT_TOPICS.length+' 条';
}
/* 模板面板由数据渲染：12 套按「通用 / 题材」分组，卡片直接标适合什么内容 */
function renderTpls(){
  var box=document.getElementById('tpls');if(!box)return;
  var html='',last='';
  TPL_META.forEach(function(t){
    if(t.group!==last){html+='<div class="tplgroup">'+esc(t.group)+'模板</div>';last=t.group;}
    html+='<button class="tplcard'+(S.tpl===t.k?' on':'')+'" data-k="'+t.k+'" data-tpl="'+t.k+'">'+
      '<i class="tplmini t-'+t.k+'"><b>'+esc(t.name.slice(0,1))+'</b></i>'+
      '<span>'+esc(t.name)+'<small>'+esc(t.sub)+' · '+esc(t.fit)+'</small></span></button>';
  });
  box.innerHTML=html;
  Array.prototype.forEach.call(box.querySelectorAll('.tplcard'),function(b){
    b.onclick=function(){S.tpl=b.dataset.k;renderTpls();computeFit();rebuild();};});
}
/* v8 编排面板：与 12 套配色完全独立，点一张卡整套换 DOM 骨架 */
function renderLayouts(){
  var box=document.getElementById('layouts');if(!box||!window.FV_LAYOUTS)return;
  var html='';
  window.FV_LAYOUTS.meta.forEach(function(m){
    html+='<button class="lycard'+(S.layout===m.k?' on':'')+'" data-k="'+esc(m.k)+'">'+
      '<i class="lymini" data-k="'+esc(m.k)+'"></i>'+
      '<span>'+esc(m.name)+'<small>'+esc(m.sub)+' · '+esc(m.fit)+'</small></span></button>';
  });
  box.innerHTML=html;
  Array.prototype.forEach.call(box.querySelectorAll('.lycard'),function(b){
    b.onclick=function(){
      S.layout=b.dataset.k;renderLayouts();rebuild();
      window.__LAYOUT_SET__={k:S.layout,fit:S.fit};
    };});
}
/* v10：九套画面骨架面板。只在大科普模式下生效，与 12 套配色 / 12 套短视频编排互不干扰。
   选骨架不会退出大众模式；选短视频编排仍按原逻辑自动退出。 */
function renderSkeletons(){
  var box=document.getElementById('skeletons');if(!box||!window.FV_SKELETONS)return;
  var html='';
  window.FV_SKELETONS.meta.forEach(function(m){
    html+='<button class="lycard skcard'+(S.skeleton===m.k?' on':'')+'" data-k="'+esc(m.k)+'">'+
      '<i class="skmini" data-k="'+esc(m.k)+'"></i>'+
      '<span>'+esc(m.name)+'<small>'+esc(m.sub)+' · '+esc(m.fit)+'</small></span></button>';
  });
  box.innerHTML=html;
  Array.prototype.forEach.call(box.querySelectorAll('.skcard'),function(b){
    b.onclick=function(){
      S.skeleton=b.dataset.k;renderSkeletons();rebuild();
      window.__SKELETON_SET__={k:S.skeleton,fit:S.fit};
    };});
}
/* 平台预设：把「发平台」这件事变成一次点击，而不是让用户自己猜参数 */
function applyPlatform(){
  var q=String(S.q||'').trim()||'这道题，你会怎么选？';
  var pts=(Array.isArray(S.points)?S.points.join('\n'):String(S.points||''))
    .split(/\n+/).map(function(x){return x.trim();}).filter(Boolean);
  /* 旧版把「先记住这题，答案可能和你想的相反」「评论区说说你选了什么」写死，
     套到科普 / 解说上就变成「问答题哪来的答案相反、哪来的选项」—— 本轮投诉的直接根因。
     现在按题型校准：科普走「现象 ≠ 直觉」，判断题才走「对错反转」。 */
  S.hook=fitHook(S.hook,S.type);
  S.cta=fitCta(S.cta,S.type);
  S.coverTitle=q;
  S.useCover=true;S.guide=true;S.autoFit=true;
  if(pts.length>3){
    S.points=pts.slice(0,3).join('\n');
    ['hammers','notes'].forEach(function(k){
      var a=String(S[k]||'').split('|');S[k]=a.slice(0,3).join('|');
    });
  }
  syncForm();rebuild();
  window.__PLATFORM__={hook:S.hook,cta:S.cta,type:S.type,useCover:S.useCover,guide:S.guide,
    points:S.points.split(/\n+/).length,tags:S.tags};
  toast('已应用平台预设：断言钩子 / 3 层递进 / 数据锤 / 封面 / 安全区');
}


function readForm(){
  var map={f_type:'type',f_q:'q',f_opts:'opts',f_ans:'ans',f_points:'points',f_src:'src',f_voice:'voice',
    f_hook:'hook',f_coverTitle:'coverTitle',f_column:'column',f_issue:'issue',
    f_disclaim:'disclaimer',f_cta:'cta',
    f_tags:'tags',f_hammers:'hammers',f_notes:'notes',f_takeaway:'takeaway'};
  Object.keys(map).forEach(function(id){
    var e=document.getElementById(id);if(e)S[map[id]]=e.value;
  });
  S.rate=+document.getElementById('f_rate').value/100;
  [['f_useCover','useCover'],['f_autoFit','autoFit'],['f_guide','guide'],
   ['f_showOpts','showOpts'],['f_autoTpl','autoTpl'],['f_subSync','subSync']].forEach(function(a){
    var e=document.getElementById(a[0]);if(e)S[a[1]]=e.checked;
  });
}
function init(){
  document.body.setAttribute('data-skin','ink');
  bind();readForm();applyTypeUI();buildFrames();computeFit();renderTimeline();
  renderSkeletons();
  renderFrame(0);refit();updateBar();renderSynthList();
  renderChecks();detectCap();renderTopics();goStep(1);
  $('#synthTxt').textContent='0 / '+window.__SYNTH_LIST__.length+' 句已合成';
  window.__LAYOUTS__=function(){return window.FV_LAYOUTS?window.FV_LAYOUTS.meta.map(function(m){return m.k;}):[];};
  window.__SKELETONS__=function(){return window.FV_SKELETONS?window.FV_SKELETONS.meta.map(function(m){return m.k;}):[];};
  window.__SETSKELETON__=function(k){
    if(!window.FV_SKELETONS||!window.FV_SKELETONS.by[k])return {err:'no such skeleton'};
    if(!S.audience){S.audience=true;var e=document.getElementById('f_audience');
      if(e)e.checked=true;setAudience(true);syncAudienceFields();}
    S.skeleton=k;renderSkeletons();rebuild();
    return {k:S.skeleton,fit:S.fit,frames:S.frames.length,audience:S.audience};
  };
  window.__SETLAYOUT__=function(k){
  if(S.audience){S.audience=false;var e=document.getElementById('f_audience');
    if(e)e.checked=false;setAudience(false);syncAudienceFields();}
  /* 12 套编排属于短视频版式；大众模式是独立科普专栏骨架，两者不叠。
     选编排即自动退出大众模式，关掉开关后选过的编排会恢复。 */
    S.layout=k;renderLayouts();rebuild();
    return {k:S.layout,fit:S.fit,frames:S.frames.length};
  };
  window.__STATE__=function(){return {step:S.step,ratio:S.ratio,theme:S.theme,tpl:S.tpl,layout:S.layout,skeleton:S.skeleton,scale:S.scale,
    sub:S.sub,sound:S.sound,frames:S.frames.length,total:+S.total.toFixed(2),
    beats:S.frames.map(function(f){return f.beat;}),tts:S.tts.size,bgm:!!S.bgmBuf,cur:S.cur,
    type:S.type,useCover:S.useCover,autoFit:S.autoFit,fit:S.fit,guide:S.guide,
    hook:S.hook,cta:S.cta,disclaim:!!S.disclaimer,coverExported:!!S.coverExported,
    q:S.q,opts:S.opts,tags:S.tags,hammers:S.hammers,notes:S.notes,takeaway:S.takeaway,
    topicHeat:S.topicHeat,showOpts:S.showOpts,autoTpl:S.autoTpl,topicCat:S.topicCat,
    category:S.category,tplCount:TPL_META.length,topicCount:HOT_TOPICS.length,
    needVoices:S.frames.filter(function(f){return f.speak;}).length};};
  window.__SEG__=function(t){return segHTML(t);};
  window.__SEGHTML__=function(t){return segHTML(t);};
  window.__SEGWORDS__=function(t){return segWords(t);};
  window.__TTSURL__=function(t){return ttsUrl(t);};
  window.__PRESET__=function(t){return PRESETS[t]?Object.assign({},PRESETS[t]):null;};
  window.__COVER__=function(){return coverFrame();};
  window.__EXPORT_COVER_FN__=exportCover;
  window.__PLATFORM_FN__=applyPlatform;
  window.__LOADPRESET__=loadPreset;
  window.__TOPICS__=function(){return HOT_TOPICS.map(function(t){
    return {id:t.id,type:t.type,q:t.q,heat:t.heat,src:t.src,hook:t.hook,cta:t.cta,
      ans:t.ans,points:t.points.split('\n'),notes:t.notes.split('|'),hammers:t.hammers.split('|'),
      count:t.points.split('\n').length,takeaway:t.takeaway,tags:t.tags,ask:t.ask,
      opts:t.opts||'',category:guessCat(t),tpl:tplFor(t),evidence:t.evidence||'有依据'};});};
  window.__PRESETS_RAW__=function(){return Object.keys(PRESETS).map(function(k){
    var P=PRESETS[k];return {id:'PRESET:'+k,points:P.points.split('\n'),notes:P.notes.split('|'),
      hammers:P.hammers.split('|'),takeaway:P.takeaway};});};
  window.__LOADTOPIC__=loadTopic;
  window.__RENDERTOPICS__=renderTopics;
  window.__FILL__=maxRowFill;
  /* 逐帧文字包围盒：验证「零越界 / 零互压」的直接证据，不是几何代理量 */
  window.__TEXTBOXES__=function(){
    var el=document.getElementById('frame'),inner=el.querySelector('.f-inner');
    var box=inner.getBoundingClientRect(),sel='.hook-title,.hook-sub,.big-title,.lead,.point-no,.point-title,.progline,.verdict-badge,.verdict-title,.verdict-line,.verdict-src,.verdict-cta,.disclaim,.cover-brand,.cover-title,.cover-sub,.cover-meta,.cover-disclaim,.side-tag,.subbar,.kicker,.brandmini,.f-footnote,.claim-tag,.claim-tags > span,.claim-promise,.promise-row > span,.prog-count,.stat-num,.stat-note,.takeaway b,.takeaway > span,.hero-num,.hero-glyph,.hero-steps b,.heat-badge,.hook-kicker,.hook-sub,.opts,.opt,.opt b,.opt span,.ly-t,.ly-msg,.ly-opt,.wm,.ly-g-cell,.ly-ck-step,.ly-col,.ly-note,.ly-cv-fine';
    return {box:{l:box.left,r:box.right,t:box.top,b:box.bottom},
      items:Array.prototype.map.call(el.querySelectorAll(sel),function(n){
        var r=n.getBoundingClientRect();
        return {cls:n.className,x:+r.left.toFixed(1),y:+r.top.toFixed(1),
          w:+r.width.toFixed(1),h:+r.height.toFixed(1),t:(n.textContent||'').slice(0,16)};
      })};
  };
  window.__GOTO__=goStep;
  window.__SETTOPIC__=function(id){ S.topicId=id; rebuild(); };
  window.__SETTEMPLATE__=function(k){ S.tpl=k; renderTpls(); computeFit(); rebuild(); };
  window.__SETCAT__=function(c){ S.topicCat=c; renderTopics(); };
  window.__SETOPTS__=function(v){ S.showOpts=!!v; rebuild(); };
  window.__SETAUTOTPL__=function(v){ S.autoTpl=!!v; };
  window.__CATS__=function(){return CAT_LIST.slice();};
  window.__SYNC_CHECK__=function(){
    return {fmt:S.fmt,subSync:S.subSync,subFit:S.subFit,
      frames:S.frames.map(function(f){
        return {shot:f.shot,title:String(f.title||''),vo:String(f.vo||''),
          speak:String(f.speak||''),flower:String(f.flower||''),
          ftag:String(f.ftag||''),fmt:f.fmt||''};})};
  };
  window.__FORMATS__=function(){return FORMATS.slice();};
  window.__FMT_TOPICS__=function(){return FORMAT_TOPICS.slice();};
  window.__TPLS__=function(){return TPL_META.slice();};
  window.__SETCOVER__=function(v){ S.useCover=!!v; var c=$('#f_useCover'); if(c)c.checked=!!v; computeFit(); rebuild(); };
  /* 同源内容审计：弹幕零重复、答案不复述反转、收尾引导不撞字幕、字幕长度 */
  window.__CONTENT_AUDIT__=function(){
    var clean=function(x){return String(x||'').replace(/[\s，,。！？!?、：:；;「」『』（）()·\-—…""]/g,'');};
    var F=S.frames,why=[],bubbles=[];
    F.forEach(function(f,k){
      var b=String(f.bubble||'').trim();
      if(b)bubbles.push({k:k,v:clean(b),raw:b});
    });
    for(var i=0;i<bubbles.length;i++)for(var j=i+1;j<bubbles.length;j++)
      if(bubbles[i].v&&bubbles[i].v===bubbles[j].v)
        why.push('弹幕重复 帧'+bubbles[i].k+'/'+bubbles[j].k+'「'+bubbles[i].raw+'」');
    if(bubbles.length<F.length)why.push('弹幕缺帧 仅 '+bubbles.length+'/'+F.length);
    /* v6.4 内容自足性：课件目录话术一律不许出现在任何可见文本 */
    F.forEach(function(f,k){
      ['title','vo','chip','bubble','flower'].forEach(function(key){
        var v=String(f[key]||'');
        if(/第\s*\d+\s*层|按\s*\d+\s*层|下面按|层拆开看/.test(v))
          why.push('课件目录话术 帧'+k+'.'+key+'「'+v+'」');
      });
      /* 峰值大字不得是无头残片：代词开头/结尾、或过短 */
      if((f.shot==='l3')&&(/^[它这那其被]/.test(String(f.title||''))||
         /[它这那]$/.test(String(f.title||''))||String(f.title||'').length<7))
        why.push('峰值大字无头残片 帧'+k+'「'+f.title+'」');
      /* 划掉线不得是疑问句 */
      if(String(f.wrong||'').match(/[？?]|怎么.*(没事|办)|不都是.*吗/))
        why.push('划掉线是疑问句 帧'+k+'「'+f.wrong+'」');
    });
    /* v7.2：字幕跟随口播开启时，字幕就是本帧大字、口播稿也是同一句。
       旧版「字幕必须是 ≤10 字短语气句」的一套约束只适用于关闭状态。 */
    if(S.subSync){
      F.forEach(function(f,k){
        if(f.silent)return;
        var ct=clean(f.title),cv=clean(f.vo),cs=clean(f.speak);
        if(!ct)why.push('帧'+k+'大字为空');
        else{
          if(ct!==cv)why.push('字幕与大字不一致 帧'+k);
          if(ct!==cs)why.push('口播稿与大字不一致 帧'+k);
        }
      });
    }else{
      /* 反转字幕：短语气句，不得复述划掉线、不得课件腔、不得长到折行 */
      var ff=F.filter(function(f){return f.shot==='flip';})[0]||{};
      var flipVo=String(ff.vo||''),fw=String(ff.wrong||''),cv=clean(flipVo),cw=clean(fw);
      if(/下面按|层拆开看|按\s*\d+\s*层|先别急，下面/.test(flipVo))
        why.push('反转字幕仍是课件句');
      if(!cv)why.push('反转帧字幕为空（字幕条会消失）');
      if(cv.length>10)why.push('反转字幕过长会折行（'+cv.length+' 字）');
      if(cw&&cv&&(cw.indexOf(cv)>=0||cv.indexOf(cw)>=0))
        why.push('反转字幕复述划掉线');
      if(cw&&cv.length>=4){
        for(var q4=0;q4<=cw.length-4;q4++)if(cv.indexOf(cw.slice(q4,q4+4))>=0){
          why.push('反转字幕与划掉线撞词「'+cw.slice(q4,q4+4)+'」');break;}
      }
    }
    /* 评论区弹幕（默认关）不得复述大字；大众向「名词解释卡」是另一类信息，
       只查整句级重复，避免把术语本身与要点句共有的词误判成换皮复述。 */
    var allTitles=F.map(function(f){return clean(f.title);}).filter(Boolean)
      .concat(F.map(function(f){return clean(f.vo);}).filter(Boolean));
    bubbles.forEach(function(o){
      if(o.v.length<4)return;
      if(S.audience){
        var core=o.v.replace(/^(依据来源|白话|关键量|以官方|常见说法)[：:]?/,'');
        if(core.length>=8&&!/^[0-9—\-～~.%]+$/.test(core)&&
           allTitles.some(function(t){return t.indexOf(core)>=0||core.indexOf(t)>=0;}))
          why.push('解释卡整句复述大字 帧'+o.k+'「'+o.raw+'」');
      }else{
        for(var i=0;i<=o.v.length-4;i++){
          var seg=o.v.slice(i,i+4);
          if(allTitles.some(function(t){return t.indexOf(seg)>=0;})){
            why.push('弹幕复述大字 帧'+o.k+'「'+o.raw+'」/「'+seg+'」');break;}
        }
      }
    });
    if(S.audience){
      F.forEach(function(f,k){
        var b=String(f.bubble||'');
        if(!b.trim())why.push('解释卡缺帧 '+k);
        if(b.indexOf('…')>=0||b.indexOf('...')>=0)why.push('解释卡有截断残片 帧'+k+'「'+b+'」');
        if(/[我你他]前额叶|(:|：).*[：:]/.test(b))why.push('解释卡含玩梗/双标签 帧'+k);
        if(/弹幕|热梗|最离谱|破案了|真假的|别划走/.test(b))why.push('解释卡仍是综艺黑话 帧'+k);
      });
    }
    /* 跨帧撞词：同一支片里花字喊过的词，弹幕别再原样说一遍 */
    var flowers=F.map(function(f){return clean(f.flower);}).filter(function(x){return x.length>=2;});
    flowers.forEach(function(w){
      bubbles.forEach(function(o){
        if((o.v.indexOf(w)>=0||w.indexOf(o.v)>=0)&&o.v.length>=3)
          why.push('花字与弹幕跨帧撞词「'+w+'」/「'+o.raw+'」');
      });
    });
    var flip='',ans='',end=null;
    F.forEach(function(f){
      if(f.shot==='flip')flip=clean(f.title);
      if(f.ans)ans=clean(f.ans);
      if(f.shot==='end')end=f;
    });
    if(ans&&flip&&(ans===flip||(ans.length>=6&&(ans.indexOf(flip)>=0||flip.indexOf(ans)>=0))))
      why.push('答案卡复述反转大字「'+ans+'」');
    /* 答案卡必须是短判定，且不与机制/带走句/花字/弹幕复述 */
    var endBig=end?clean(end.title):'',fl=clean(flip),av=clean(ans);
    /* 反转帧给机制，收尾给带走句：两处大字不得换皮复述 */
    if(fl&&endBig){
      for(var z=0;z<=fl.length-4;z++)if(fl.slice(z,z+4)&&endBig.indexOf(fl.slice(z,z+4))>=0){
        why.push('反转与带走句复述「'+fl.slice(z,z+4)+'」');break;}
    }
    if(av.length>10)why.push('答案卡不是短判定（'+av.length+' 字）');
    [['反转',fl],['带走句',endBig]].forEach(function(o){
      if(!av||!o[1])return;
      for(var i=0;i<=av.length-4;i++)if(av.slice(i,i+4)&&o[1].indexOf(av.slice(i,i+4))>=0){
        why.push('答案卡复述'+o[0]+'「'+av.slice(i,i+4)+'」');break;}
    });
    flowers.concat(bubbles.map(function(o){return o.v;})).forEach(function(w){
      if(av&&w&&w.indexOf(av)>=0&&av.length>=3)why.push('答案卡与花字/弹幕撞词「'+av+'」');
    });
    if(end){
      var vo=clean(end.vo),bub=clean(end.bubble);
      if(vo&&bub&&(vo===bub||(bub.length>=5&&vo.indexOf(bub)>=0)||(vo.length>=5&&bub.indexOf(vo)>=0)))
        why.push('收尾弹幕与字幕问句撞车');
      if(/评论区见|评论区先别吵/.test(String(end.bubble||'')))why.push('收尾弹幕仍是通用引导语');
      /* subSync 下字幕 = 大字，长句是设计本身；由 --sub-fit 统一缩放保证一行放得下 */
      if(!S.subSync)F.forEach(function(f,k){
        var v=clean(f.vo);
        if(v.length>20)why.push('字幕超 20 字 帧'+k+'（'+v.length+'）');
      });
    }
    return {n:F.length,bubbles:bubbles.length,why:why};
  };
  /* 同源花字审计：验证脚本直接调它，白名单/黑名单与渲染共用一份，避免规则漂移 */
  /* 内容重复诊断：把每帧所有可见文本导出，供审计脚本跨帧/帧内比对 */
  window.__CONTENT_DUMP__=function(){
    return S.frames.map(function(f,k){
      return {k:k,shot:f.shot||f.beat,flower:String(f.flower||'').trim(),
        title:String(f.title||'').trim(),chip:String(f.ftag||'').trim(),
        bubble:String(f.bubble||'').trim(),vo:String(f.vo||'').trim(),
        wrong:String(f.wrong||'').trim(),ans:String(f.ans||'').trim(),
        src:String(f.src||'').trim(),disclaim:String(f.disclaim||'').trim(),
        take:String(f.line||f.takeaway||'').trim(),cta:String(f.cta||'').trim(),
        heat:String(f.heat||'').trim(),sub:String(f.sub||'').trim()};
    });
  };
  window.__FLOWER_AUDIT__=function(){
    var BAN=['到不了','有区间','越暗越累','不是气温','没检测','不是药','一卡车',
      '找活人','没出处','锁住了','两个项目','造的词','用反了','真假的',
      '很多人信了十几年','其实一步就错'];
    var HOOKOK=S.audience?
      {judge:'看依据',single:'看条件',multi:'逐条看',kepu:'看原理',explain:'看原理'}:
      {judge:'真假？',single:'选哪个？',multi:'哪几个？',kepu:'为啥？',explain:'为啥？'};
    var ENFIX=['DONT SCROLL','ACTUALLY','HOLD ON','GOT IT','NO WAY','REMEMBER','THE NUMBER',
      'CHECK THE EVIDENCE','THE MECHANISM','THE CONDITION','KEY POINT','REMEMBER THIS',
      'THREE POINTS','THE DATA','WHAT HAPPENED','TWO VIEWS','VERIFY FIRST','THE DIFFERENCE'];
    var bf=(S.fmt&&S.fmt!=='quiz'&&FMT_BEATS[S.fmt])?FMT_BEATS[S.fmt]:null;
    var expFlip=S.audience?'实际上':(bf?bf.flip:'其实');
    var expEnd=S.audience?'记这条':(bf?bf.end:'记住');
    var expPeak=S.audience?'关键点':'最离谱';
    var out=[];
    S.frames.forEach(function(f,k){
      var shot=f.shot||f.beat,w=String(f.flower||'').trim(),
          title=String(f.title||''),en=flowerEN(w,shot),why=[];
      if(BAN.indexOf(w)>=0)why.push('结论残片');
      if(!SAFE_FLOWERS[w]&&!(S.audience&&GEN_FLOWERS[w])&&!isDataWord(w))why.push('非自足词');
      if(isDataWord(w)&&!dataMatches(w,title))why.push('数字与本帧大字不同拍');
      /* 数字花字本来就应出现在大字里；非数字花字整词出现在大字里才是重复 */
      if(!isDataWord(w)&&title.indexOf(w)>=0&&w.length>1)why.push('与大字重复');
      var hookOK=SAFE_FLOWERS[w]||(S.audience&&GEN_FLOWERS[w])||isDataWord(w);
      if((shot==='cover'||shot==='hook')&&hookOK){} /* 允许自足词 / 大众向信息词 */
      else if(shot==='cover'||shot==='hook'){if(w!==HOOKOK[S.type]&&!hookOK)why.push('钩子帧非自足词');}
      if(shot==='flip'&&w!==expFlip)why.push('反转帧花字错');
      if(shot==='end'&&w!==expEnd)why.push('收尾帧花字错');
      if(shot==='l3'&&w!==expPeak&&!isDataWord(w))why.push('峰值帧花字错');
      if(en==='OMG / 帧语')why.push('英文兜底词');
      if(!FLOWER_EN[w]&&!(S.audience&&PLAIN_EN[w])&&!isDataWord(w)&&ENFIX.indexOf(en)<0)
        why.push('英文无映射');
      /* 大众向：信息卡不得出现省略号残片，也不得把「弹幕/热梗」带回画面 */
      if(S.audience&&/弹幕|热梗|最离谱|破案了|真假的/.test(String(f.bubble||'')))
        why.push('大众向仍出现综艺黑话');
      out.push({k:k,shot:shot,flower:w,en:en,title:title.slice(0,24),why:why});
    });
    return out;
  };
  window.__SEEK__=seekTo;
  window.__PLAY__=play;
  window.__EXPORT_PNG_FN__=exportContactSheet;
  window.__FRAME_CANVAS__=frameToCanvas;
  /* 绑定完成后做最终同步：表单静态默认值若还是旧梗，会被 syncForm 覆盖成大众向 */
syncAudienceFields();rebuild();
window.__AUDIENCE__=function(){return {
  on:!!S.audience,explain:S.explain,gloss:S.gloss,basis:S.basis,hook:S.hook,cta:S.cta,
  notes:S.notes,takeaway:S.takeaway,
  frames:S.frames.map(function(f){return {shot:f.shot,flower:f.flower,
    ftag:f.ftag,sub:f.sub,bubble:f.bubble,vo:f.vo,title:f.title};}),
  formats:FORMATS.map(function(F){return {k:F.k,flower:F.flower,en:F.en,cta:F.cta};}),
  topics:window.__TOPICS__().length
};};
window.__SETAUDIENCE__=function(v){S.audience=!!v;var e=document.getElementById('f_audience');
  if(e)e.checked=!!v;setAudience(!!v);syncAudienceFields();rebuild();};
window.__READY__=true;
  window.__STUDIO_API__={
    state:S, ctx:ctx, setVol:setVol, readLevels:readLevels, duck:duck,
    fetchTTS:fetchTTS, playOne:playOne, ttsUrl:ttsUrl, ttsKey:ttsKey,
    applyBgm:applyBgm, bgmListen:bgmListen, stopBgmListen:stopBgmListen,
    importBgm:importBgm, importVoiceFiles:importVoiceFiles,
    playSfx:playSfx, importSfxFile:importSfxFile, SFX_SEG:SFX_SEG, SFX_KINDS:SFX_KINDS,
    BGM_LIB:BGM_LIB, VOICES:VOICES, ROUTES:ROUTES,
    exportAudio:exportAudio, exportSrcList:exportSrcList,
    encodeWav:encodeWav, offlineMix:offlineMix,
    subVars:subVars, rebuildStudio:rebuildStudio, rebuildAll:rebuild
  };
  setTimeout(function(){if(window.buildStudio)window.buildStudio();},0);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
