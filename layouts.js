/* ══════════════════════════════════════════════════════════════════════════
   layouts.js —— 画面编排引擎（v8）
   与「模板配色」彻底分开的第二个维度：
   以前 9 种形态只是同一副骨架（花字 + 大字 + 字幕条）换文案，构图一模一样。
   这里每套编排有独立的 DOM 结构与独立 CSS，六帧的分区方式也逐帧不同。
   共用：数据帧 f、字幕严格 = 画面大字 = 口播首句、单一 80px 主标题、中文分词、
        预览/导出同源（CSS 由 app.js 合并进 FRAME_CSS）、音频与时间轴。
   ══════════════════════════════════════════════════════════════════════════ */
window.FV_LAYOUTS=(function(){
'use strict';

var META=[
 {k:'burst',    name:'爆款花字',   sub:'综艺爆炸形 / 默认', fit:'强冲突 · 通用'},
 {k:'split',    name:'分屏对撞',   sub:'左右色块 · 逐帧换栏比', fit:'对比 · 反转'},
 {k:'chat',     name:'聊天弹幕',   sub:'群聊气泡 · 逐帧累加', fit:'争议 · 热梗'},
 {k:'poster',   name:'号外大字报', sub:'报头 + 三栏 + 印章', fit:'辟谣 · 盘点'},
 {k:'chart',    name:'数据仪表盘', sub:'大数字 + 条形图', fit:'数字 · 科普'},
 {k:'sticky',   name:'便签拼贴',   sub:'旋转便签 + 胶带', fit:'生活 · 轻知识'},
 {k:'cinema',   name:'极简电影',   sub:'黑边留白 · 居中', fit:'悬念 · 故事'},
 {k:'checklist',name:'步骤清单',   sub:'竖轴打勾 · 进度', fit:'教程 · 避坑'},
 {k:'grid9',    name:'九宫格',     sub:'色块逐格点亮', fit:'清单 · 盘点'},
 {k:'hotlist',  name:'热搜榜单',   sub:'榜单条 · 逐帧升位', fit:'高热 · 话题'},
 {k:'exam',     name:'试卷批改',   sub:'题卡 + 红笔旁注', fit:'判断 · 辟谣'},
 {k:'receipt',  name:'核实小票',   sub:'逐行打印 · 合计结论', fit:'盘点 · 清单'}
];
var BY={};META.forEach(function(m){BY[m.k]=m;});

/* ── 公共小工具（ctx 由 app.js 传入，保证与站内分词 / 转义完全一致）── */
function C(){return window.__FV_CTX__||{};}
function E(s){return C().esc(s==null?'':s);}
function W(t){return C().segHTML(t);}
function SW(t){return C().segWords(t);}
function S(){return C().S||{};}
function sh(f){return f.shot||f.beat||'cover';}
function layer(f){var s=sh(f);return /^l\d$/.test(s)?+s.slice(1):0;}
function pts(){return String(S().points||'').split(/\n+/).map(function(x){return x.trim();}).filter(Boolean);}
/* 画面上的文字一律不追加省略号：旧版「20-20-…」「25~30 …」「脱羽绒服能攒到…」
   就是被 cut 切出来的残片，用户一眼看出「文案莫名其妙」。
   这里只做长度保护（配合 triad 把内容压成自足短词），不制造半句话。 */
function cut(s,n){s=String(s||'');return s.length>n?s.slice(0,n):s;}
/* v8.2：三栏 / 便签 / 清单 / 九宫格的辅助文案统一走这里。
   旧版直接 cut(要点,14/24)，切出「脱羽绒服能攒到」「可这点火花能点燃」这类
   无头残片，而且钩子帧就把三层答案全摊出来 —— 既剧透又前言不搭后语。
   现在每格只放「看点标签（≤6 字）」+ 当前层数据锤，按拍决定状态：
     钩子/反转 → 三格都是不剧透的看点词 + 待拆
     拆解第 L 层 → 已讲层点亮且附数据锤，未讲层仍待拆
     收尾 → 三格全点亮 + 已核实
   零截断、零省略号、零剧透；字少到可以放大到 44px。 */
function tagList(){
  var a=String(S().tags||'').split(/[\/|,，、]+/).map(function(x){return x.trim();}).filter(Boolean);
  var d=['起因','机制','结论'];
  for(var i=0;i<3;i++)if(!a[i])a[i]=d[i];
  return a.slice(0,3).map(function(x){return cut(x,10);});
}
function hamList(){
  var a=String(S().hammers||'').split('|').map(function(x){return x.trim();}).filter(Boolean);
  return a;
}
function triad(f){
  var s=sh(f),L=layer(f),T=tagList(),H=hamList(),done=(s==='end'?3:(s==='flip'?0:L));
  return T.map(function(t,i){
    var lit=i<done;
    var state=lit?(s==='end'?'已核实':'已拆'):'待拆';
    /* i 是 0-based、L 是 1-based：旧写法 i===L 只在收尾帧(L=0,i=0)命中，
       导致收尾第一栏莫名多出「18000V」、拆解帧反而没有数据锤。 */
    var extra=(lit&&L>=1&&(i+1)===L&&H[i])?cut(H[i],10):'';
    return {no:'0'+(i+1),label:t,state:state,extra:extra,lit:lit,cur:(i+1===L)};
  });
}
function title(f,cls){return '<h2 class="big-title ly-t '+(cls||'')+'">'+W(f.title)+'</h2>';}
function txt(s,cls){return '<div class="ly-t '+(cls||'')+'">'+E(s)+'</div>';}
function head(f,label,kind){
  return '<div class="ly-head '+(kind||'')+'">'+
    '<span class="ly-t ly-tc">'+E(f.tc||'00:00')+'</span>'+
    '<span class="ly-t ly-hl">'+E(label||f.label||'')+'</span>'+
    '<div class="ly-prog"><i style="width:'+(+f.prog||0)+'%"></i></div></div>';
}
function sub(f){
  return f.vo?'<div class="subbar ly-sub"><span class="subwrap ly-t">'+E(f.vo)+'</span></div>':'';
}
function wm(){
  var t=String(S().wmText||'').trim();
  return t?'<div class="wm ly-t">'+E(t)+'</div>':'';
}
function wrap(f,inner,kind){
  return '<div class="f-bg"></div>'+
    '<div class="f-inner ly-inner" data-shot="'+E(sh(f))+'" data-layout="'+E(S().layout||'burst')+'"'+
    ' style="--sub-fit:'+(S().subFit||1)+'"'+
    (String(f.opts||'').trim()?' data-opts="1"':'')+'>'+
    '<div class="ly-root '+(kind||'')+'">'+wm()+inner+'</div>'+sub(f)+
    '</div><div class="safe-guide"></div>';
}
function opts(f){
  var a=String(f.opts||'').split('|').map(function(x){return x.trim();}).filter(Boolean);
  if(!a.length)return '';
  return '<div class="ly-opts">'+a.map(function(o,i){
    return '<div class="ly-opt"><b class="ly-t">'+String.fromCharCode(65+i)+'</b>'+
      '<span class="ly-t">'+W(o)+'</span></div>';
  }).join('')+'</div>';
}
/* 封面：每套编排用同一份 HTML，靠 CSS 按 data-layout 换骨架，
   保证 9 套的封面构图也真的不同，且题干仍是唯一 80px 主标题。 */
function coverHTML(f){
  return wrap(f,
    '<div class="ly-cover">'+head(f,'平台封面','ly-h-cover')+
    '<div class="ly-cv-brand ly-t">'+E(f.column||'帧语')+'</div>'+
    '<div class="ly-cv-issue ly-t">'+E(f.issue||'')+'</div>'+
    title(f,'ly-cv-title')+
    '<div class="ly-cv-sub ly-t">'+E(f.sub||'')+'</div>'+
    '<div class="ly-cv-chips ly-t">'+E(f.typeLabel||'')+' · '+E(f.chip||'')+'</div>'+
    '<div class="ly-cv-fine ly-t">'+E(f.disclaim||'')+'</div></div>','ly-k-cover');
}
/* 数据仪表盘：从本帧大字里抽真实的数字+单位做巨型视觉主角，不用话题热度凑数 */
function pickNum(f,L){
  var m=String(f.title||'').match(/\d[\d,.]*\s*(?:%|％|万|亿|倍|米|克|岁|℃|度|V|伏|年|天|小时|分钟|秒|次|人|kg|cm|mm|ml|mg)?/);
  if(m&&m[0].length<=9)return m[0];
  if(String(f.hammer||'').match(/\d/))return cut(String(f.hammer),6);
  return L?'0'+L:(sh(f)==='end'?'100%':'03');
}

/* ══ 1. split 分屏对撞 ══
   每帧的栏比 / 方向都不同：钩子 36:64、反转 50:50、拆解逐层左右互换、
   收尾改上下两栏。不是同一张卡换文字。 */
function split(f){
  var s=sh(f),L=layer(f),a='',b='';
  if(s==='cover')return coverHTML(f);
  if(s==='hook'){
    a='<div class="ly-sp-num ly-t">01</div>'+txt('你以为','ly-sp-tag')+
      txt(f.flower||'真的？','ly-sp-flower');
    b=txt(f.ftag||'断言','ly-sp-tag')+title(f)+(f.opts?opts(f):'');
  }else if(s==='flip'){
    a='<div class="ly-sp-num ly-t">≠</div>'+txt('你以为','ly-sp-tag')+
      txt(cut(f.wrong||'',20),'ly-sp-strike ly-t');
    b=txt('其实','ly-sp-tag')+title(f);
  }else if(L){
    a='<div class="ly-sp-num ly-t">0'+L+'</div>'+
      txt(cut(f.hammer||'要点',12),'ly-sp-flower')+
      txt(cut(f.note||'',26),'ly-sp-lead');
    b=txt('第 '+L+' 层 / 共 '+f.n+' 层','ly-sp-tag')+title(f);
  }else{
    a='<div class="ly-sp-num ly-t">✓</div>'+txt(f.badge||'结论','ly-sp-tag')+
      txt(cut(f.ans||'',12),'ly-sp-flower');
    b=txt('一句带走','ly-sp-tag')+title(f)+txt(cut(f.cta||'',24),'ly-sp-lead')+
      txt(cut(f.src||'',22),'ly-sp-fine');
  }
  return wrap(f,head(f,'分屏对撞','ly-h-split')+
    '<div class="ly-split"><div class="ly-sp-a">'+a+'</div>'+
    '<div class="ly-sp-b">'+b+'</div></div>','ly-k-split');
}

/* ══ 2. chat 聊天弹幕 ══
   群聊气泡逐帧累加，输入条当字幕位；一帧最多 4 条消息，保证不溢出。 */
function chat(f){
  var s=sh(f),L=layer(f),m=[];
  if(s==='cover')return coverHTML(f);
  m.push('<div class="ly-msg sys ly-t">群公告 · 本条拆成 3 层核实</div>');
  if(s==='hook'){
    m.push('<div class="ly-msg in">'+txt('有人问：','ly-msg-who')+title(f,'ly-msg-title')+'</div>');
    if(f.bubble)m.push('<div class="ly-msg out ly-t">'+E(cut(f.bubble,16))+'</div>');
  }else if(s==='flip'){
    m.push('<div class="ly-msg in strike ly-t">'+E(cut(f.wrong||'',22))+'</div>');
    m.push('<div class="ly-msg out">'+txt('楼主：','ly-msg-who')+title(f,'ly-msg-title')+'</div>');
    if(f.bubble)m.push('<div class="ly-msg in sm ly-t">'+E(cut(f.bubble,16))+'</div>');
  }else if(L){
    var P=pts();
    for(var i=Math.max(1,L-1);i<=L;i++){
      m.push('<div class="ly-msg '+(i===L?'out cur':'in done')+'">'+
        (i===L?title(f,'ly-msg-title'):txt(cut(P[i-1]||'',20),'ly-t'))+'</div>');
    }
    if(f.bubble)m.push('<div class="ly-msg in sm ly-t">'+E(cut(f.bubble,16))+'</div>');
  }else{
    m.push('<div class="ly-msg out cur">'+title(f,'ly-msg-title')+'</div>');
    m.push('<div class="ly-msg sys ly-t">'+E(f.badge||'结论')+' · '+E(cut(f.ans||'',10))+
      ' · '+E(cut(f.cta||'',16))+'</div>');
  }
  return wrap(f,'<div class="ly-chat">'+head(f,'热议群 · 讨论中','ly-h-chat')+
    '<div class="ly-msgs">'+m.join('')+'</div>'+
    '<div class="ly-chat-input ly-t">说点什么…　⌨ 正在输入</div></div>','ly-k-chat');
}

/* ══ 3. poster 号外大字报 ══
   报头 / 粗分隔线 / 跨栏大标题 / 三栏小字 / 右下印章，纯报刊网格。 */
function poster(f){
  var s=sh(f),L=layer(f),T=triad(f),cols='';
  if(s==='cover')return coverHTML(f);
  T.forEach(function(t){
    cols+='<div class="ly-col '+(t.lit?'on':'')+(t.cur?' cur':'')+'">'+
      '<b class="ly-t">'+t.no+'</b><span class="ly-t">'+E(t.label)+'</span>'+
      (t.extra?'<em class="ly-t">'+E(t.extra)+'</em>':'')+
      '<i class="ly-t">'+E(t.state)+'</i></div>';
  });
  /* 旧版收尾帧把评论区问句（「你被电得最狠一次是啥姿势？」）当新闻导语
     挂在大标题下，语义完全错位。导语位只给与这一拍相符的信息：
     钩子=流传度眉标 / 反转=读者以为 / 拆解=本层看点 / 收尾=结论。 */
  var lead=s==='hook'?cut(f.sub||'',20):
    (s==='flip'?'读者以为：'+cut(f.wrong||'',16):
      (s==='end'?(f.badge||'结论')+' · '+cut(f.ans||'',10):
        cut(f.ftag||'',8)+(f.hammer?' · '+cut(f.hammer,8):'')));
  var stamp=s==='end'?'<div class="ly-stamp ly-t">'+E(cut(f.ans||'',10))+'</div>':
    '<div class="ly-stamp ghost ly-t">核实中</div>';
  /* 互动问句独立成栏并明确标注「读者互动」，不再冒充导语 */
  var interact=s==='end'&&f.cta?
    '<div class="ly-p-inter ly-t">读者互动 · '+E(cut(f.cta,20))+'</div>':'';
  /* 印章旧版 absolute 在 bottom:18%，正好压住免责（用户截图里「虚惊一场」
     盖在「本内容仅作信息整理…」上）。改放在标题行右侧，免责与互动走普通流。 */
  return wrap(f,'<div class="ly-poster">'+head(f,f.column||'帧语日报','ly-h-poster')+
    '<div class="ly-masthead"><span class="ly-t">'+E(f.issue||'NO. 001')+'</span>'+
    '<span class="ly-t">'+E(f.label||'')+' · '+E(f.tc||'')+' 刊</span></div>'+
    '<div class="ly-headline"><div class="ly-htext">'+title(f,'ly-p-title')+
      txt(lead,'ly-p-lead')+'</div>'+stamp+'</div>'+
    '<div class="ly-cols">'+cols+'</div>'+interact+
    (s==='end'&&f.disclaim?txt(String(f.disclaim),'ly-p-fine'):'')+'</div>','ly-k-poster');
}

/* ══ 4. chart 数据仪表盘 ══
   左侧巨型数据、右侧三条横条随层填充、底部刻度轴，字幕做成跑马灯。 */
function chart(f){
  var s=sh(f),L=layer(f),num=pickNum(f,L),bars='';
  if(s==='cover')return coverHTML(f);
  for(var i=1;i<=3;i++){
    var w=(s==='end')?96:(L>=i?(34+i*20):12);
    bars+='<div class="ly-bar-row '+(L>=i||s==='end'?'on':'')+'">'+
      '<span class="ly-t">0'+i+'</span><i style="width:'+w+'%"></i></div>';
  }
  var nk=num.length<=4?1:(num.length<=6?.8:(num.length<=8?.64:.5));
  return wrap(f,'<div class="ly-chart" style="--num-k:'+nk+'">'+
    head(f,'数据拆解 · '+num,'ly-h-chart')+
    '<div class="ly-metric"><b class="ly-t">'+E(num)+'</b>'+
    '<span class="ly-t">'+E(cut(f.ftag||'要点',8))+'</span></div>'+
    '<div class="ly-ctitle">'+txt(f.label||'','ly-c-kicker')+title(f,'ly-c-title')+
    (s==='end'?txt((f.badge||'结论')+' · '+cut(f.ans||'',12),'ly-c-verdict ly-t'):'')+'</div>'+
    '<div class="ly-bars">'+bars+'</div>'+
    '<div class="ly-axis ly-t">0　　　　25　　　　50　　　　75　　　100</div>'+
    '</div>','ly-k-chart');
}

/* ══ 5. sticky 便签拼贴 ══
   3 张倾斜便签做背景，主便签位置逐帧移动（上/右/左/中），胶带与投影。 */
function sticky(f){
  var s=sh(f),L=layer(f),notes='';
  if(s==='cover')return coverHTML(f);
  /* 钩子帧不再把三条答案要点全贴出来（旧截图红框里「脱羽绒服能攒到…」），
     改为不剧透的看点标签 + 状态；当前层才附一个数据锤。 */
  triad(f).forEach(function(t,i){
    notes+='<div class="ly-note n'+(i+1)+' '+(t.lit?'lit':'')+(t.cur?' cur':'')+'">'+
      '<div class="ly-tape"></div><span class="ly-t">'+E(t.label)+'</span>'+
      '<small class="ly-t">'+E(t.state)+'</small></div>';
  });
  var cur='<div class="ly-s-current">'+title(f,'ly-s-title')+
    '<div class="ly-tape"></div></div>';
  return wrap(f,'<div class="ly-sticky">'+head(f,'便签 · 第 '+(L||1)+' 张','ly-h-sticky')+
    notes+cur+'</div>','ly-k-sticky');
}

/* ══ 6. cinema 极简电影 ══
   上下黑边 + 中央留白大字 + 极细进度线，不与花字模板共享任何构图元素。 */
function cinema(f){
  var s=sh(f),L=layer(f);
  if(s==='cover')return coverHTML(f);
  var side=s==='flip'?txt(cut(f.wrong||'',18),'ly-c-side ly-t'):
    (L?txt('0'+L+' / 0'+f.n,'ly-c-side ly-t'):'');
  var under=s==='end'?txt(cut(f.ans||'',14),'ly-c-ans ly-t'):
    txt(cut(f.note||f.sub||'',26),'ly-c-sub ly-t');
  return wrap(f,'<div class="ly-cinema">'+head(f,f.label||'','ly-h-cinema')+
    '<div class="ly-c-main"><span class="ly-t ly-c-no">'+E(f.no||'01')+' · '+
    E(f.label||'')+'</span>'+title(f,'ly-c-title')+under+'</div>'+side+
    '<div class="ly-c-foot ly-t">'+E(f.tc||'')+' / '+E(f.tcTotal||'')+'</div></div>','ly-k-cinema');
}

/* ══ 7. checklist 步骤清单 ══
   左侧竖轴 3 点 + 连线，当前步打勾；右侧内容卡，钩子帧铺选项。 */
function checklist(f){
  var s=sh(f),L=layer(f),done=s==='end'?3:(s==='flip'?0:L),steps='';
  if(s==='cover')return coverHTML(f);
  triad(f).forEach(function(t,i){
    steps+='<div class="ly-ck-step '+(t.lit?'done':'')+(t.cur?'cur':'')+'">'+
      '<b class="ly-t">'+(t.lit?'✓':t.no)+'</b>'+
      '<span class="ly-t">'+E(t.label)+(t.extra?' · '+E(t.extra):'')+'</span></div>';
  });
  var note=s==='flip'?('划掉：'+cut(f.wrong||'',20)):
    (s==='end'?cut(f.cta||'',24):cut(f.note||'',26));
  return wrap(f,'<div class="ly-check">'+head(f,'已完成 '+done+' / 3 项','ly-h-check')+
    '<div class="ly-ck-steps">'+steps+'</div>'+
    '<div class="ly-ck-card">'+txt(f.ftag||'','ly-ck-kicker ly-t')+title(f,'ly-ck-title')+
    (s==='hook'&&f.opts?opts(f):'')+txt(note,'ly-ck-note ly-t')+
    (s==='end'?'<div class="ly-ck-stamp ly-t">'+E(f.badge||'')+' · '+
      E(cut(f.ans||'',10))+'</div>':'')+'</div></div>','ly-k-check');
}

/* ══ 8. grid9 九宫格 ══
   6 个色块逐格点亮 + 中央横幅大标题，收尾全亮。 */
function grid9(f){
  var s=sh(f),L=layer(f);
  if(s==='cover')return coverHTML(f);
  /* v8.2 统一走 triad：格子只放完整看点标签，不再硬切要点出「脱羽」这类残片 */
  var T=triad(f),words=T.map(function(t){return t.label;});
  words.push('待拆','已拆','已核实');
  var lit=s==='end'?6:(s==='flip'?2:(s==='hook'?0:Math.min(6,L*2)));
  var cells='';
  for(var j=0;j<6;j++)cells+='<div class="ly-g-cell '+(j<lit?'lit':'')+' ly-t">'+E(words[j])+'</div>';
  return wrap(f,'<div class="ly-grid">'+head(f,'点亮 '+lit+' / 6','ly-h-grid')+
    '<div class="ly-g-rows">'+cells+'</div>'+
    '<div class="ly-g-banner">'+title(f,'ly-g-title')+
    (s==='end'?txt(cut(f.ans||'',12),'ly-g-ans ly-t'):'')+'</div>'+
    '<div class="ly-g-foot ly-t">'+E(f.ftag||'')+' · '+E(f.label||'')+'</div></div>','ly-k-grid');
}

/* ══ 10. hotlist 热搜榜单 ══
   榜单条 + 热度标签 + 逐帧升位的条形；当前层顶到榜首，收尾全条核实。
   词只取看点标签，不写答案要点（钩子不剧透）。 */
function hotlist(f){
  var s=sh(f),L=layer(f),T=triad(f),rows='';
  if(s==='cover')return coverHTML(f);
  var order=T.slice();
  if(L){var cur=order.splice(L-1,1)[0];order.unshift(cur);}
  order.forEach(function(t,i){
    var hot=i===0?(s==='end'?'核实':'沸'):(i===1?'热':'新');
    rows+='<div class="ly-ht-row '+(i===0?'top':'')+(t.lit?'done':'')+'">'+
      '<b class="ly-t">'+String(i+1).padStart(2,'0')+'</b>'+
      '<span class="ly-t">'+E(t.label)+'</span>'+
      '<i class="ly-t ly-ht-tag">'+E(hot)+'</i>'+
      '<div class="ly-ht-bar"><u style="width:'+(s==='end'?96:(L?34+L*18:18))+'%"></u></div>'+
      '</div>';
  });
  return wrap(f,'<div class="ly-hot">'+head(f,'实时热榜 · 大家在搜','ly-h-hot')+
    '<div class="ly-ht-lead ly-t">本条话题 · '+E(f.typeLabel||'')+' · '+E(f.heat||f.tc||'')+'</div>'+
    '<div class="ly-ht-list">'+rows+'</div>'+
    '<div class="ly-ht-title">'+title(f,'ly-ht-big')+'</div>'+
    (s==='end'&&f.cta?'<div class="ly-ht-inter ly-t">评论区 · '+E(cut(f.cta,18))+'</div>':'')+
    '</div>','ly-k-hot');
}

/* ══ 11. exam 试卷批改 ══
   题卡 + 红笔旁注逐帧累加 + 收尾盖「已核实」章；划掉线只在反转帧出现。 */
function exam(f){
  var s=sh(f),L=layer(f),T=triad(f),done=s==='end'?3:(s==='flip'?0:L),marks='';
  if(s==='cover')return coverHTML(f);
  marks+='<div class="ly-ex-mark '+(s==='flip'?'cross':'')+' ly-t">'+
    (s==='flip'?'✗ 划掉：'+E(cut(f.wrong||'',14)):'① 读题 · '+E(T[0].label))+'</div>';
  T.forEach(function(t,i){
    if(i<done)marks+='<div class="ly-ex-mark ok ly-t">'+(i+2)+' ✓ '+E(t.label)+
      (t.extra?' · '+E(t.extra):'')+'</div>';
  });
  var score=s==='end'?'<div class="ly-ex-score ly-t">已核实 · '+E(cut(f.ans||'',8))+'</div>':
    '<div class="ly-ex-score ghost ly-t">批改中 '+done+' / 3</div>';
  return wrap(f,'<div class="ly-exam">'+head(f,'第 01 题 · 批改卷','ly-h-exam')+
    '<div class="ly-ex-q"><span class="ly-t ly-ex-kicker">题目</span>'+
      title(f,'ly-ex-title')+(s==='hook'&&f.opts?opts(f):'')+'</div>'+
    '<div class="ly-ex-marks">'+marks+'</div>'+score+'</div>','ly-k-exam');
}

/* ══ 12. receipt 核实小票 ══
   等宽小票逐行打印，未核实行是「—」，收尾「合计」给结论；锯齿纸边与条码。 */
function receipt(f){
  var s=sh(f),L=layer(f),T=triad(f),done=s==='end'?3:(s==='flip'?0:L),lines='';
  if(s==='cover')return coverHTML(f);
  lines+='<div class="ly-r-line ly-r-head ly-t"><span class="ly-t">项目</span><b class="ly-t">核实清单</b></div>';
  T.forEach(function(t){
    lines+='<div class="ly-r-line '+(t.lit?'done':'')+' ly-t">'+
      '<span class="ly-t">'+t.no+' '+E(t.label)+'</span>'+
      '<b class="ly-t">'+E(t.lit?(t.extra||t.state):'—')+'</b></div>';
  });
  var total=s==='end'?E(cut(f.ans||'',8)):'待核实';
  return wrap(f,'<div class="ly-receipt">'+head(f,'核实小票 · NO. 001','ly-h-receipt')+
    '<div class="ly-r-paper">'+
    '<div class="ly-r-brand ly-t">'+E(f.column||'帧语核实')+'</div>'+
    '<div class="ly-r-meta ly-t">'+E(f.tc||'00:00')+' · '+E(f.label||'')+'</div>'+
    '<div class="ly-r-lines">'+lines+'</div>'+
    '<div class="ly-r-total ly-t"><span class="ly-t">合计</span><b class="ly-t">'+total+'</b></div>'+
    '<div class="ly-r-title">'+title(f,'ly-r-big')+'</div>'+
    '<div class="ly-r-code"></div>'+
    (s==='end'&&f.disclaim?'<div class="ly-r-fine ly-t">'+E(f.disclaim)+'</div>':'')+
    '</div></div>','ly-k-receipt');
}

var RENDER={split:split,chat:chat,poster:poster,chart:chart,
  sticky:sticky,cinema:cinema,checklist:checklist,grid9:grid9,
  hotlist:hotlist,exam:exam,receipt:receipt};

function render(key,f,ctx){
  window.__FV_CTX__=ctx;
  if(!RENDER[key])return null;              /* burst 交回 app.js 原骨架，零视觉变化 */
  return RENDER[key](f);
}

/* ═══════════════════════════════════════════════════════════════════════
   CSS：每段都以 .frame[data-layout="X"] 作用域，追加到 FRAME_CSS 末尾，
   导出 clone 用同一份 CSS，预览与成片同源。
   所有文字尺寸仍来自统一的 --fs-* 字阶；主标题永远 --fs-title(80px)。
   ═══════════════════════════════════════════════════════════════════════ */
var CSS=`
/* ── 编排层通用重置：只作用于非 burst，burst 完全不受影响 ── */
.frame[data-layout]:not([data-layout="burst"]) .f-inner{display:block}
.frame[data-layout]:not([data-layout="burst"]) .ly-root{
  position:absolute;left:0;right:0;top:0;bottom:14%;display:flex;flex-direction:column;
  min-height:0;box-sizing:border-box}
.frame[data-layout]:not([data-layout="burst"]) .ly-t{min-width:0}
.frame[data-layout]:not([data-layout="burst"]) .ly-root .big-title{
  font-size:calc(var(--fs-title) * var(--scale,1))!important;
  line-height:1.34!important;color:#fff!important;font-weight:900!important;
  text-shadow:3px 3px 0 var(--ink),0 0 18px rgba(0,0,0,.75)!important;
  border:0!important;padding:0!important;margin:0!important;width:100%!important;
  text-wrap:pretty;word-break:normal;overflow-wrap:anywhere}
.frame[data-layout]:not([data-layout="burst"]) .ly-head{
  flex:none;display:flex;align-items:center;gap:calc(var(--gap)*.5);
  font-size:calc(var(--fs-micro) * var(--scale,1));letter-spacing:2px;
  color:var(--dim);padding-bottom:calc(var(--gap)*.35);
  border-bottom:1px solid var(--line);margin-bottom:calc(var(--gap)*.6)}
.ly-head .ly-tc{color:var(--bar);font-weight:900;white-space:nowrap}
.ly-head .ly-hl{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ly-prog{flex:none;width:22%;height:calc(6px * var(--scale,1));background:var(--line);border-radius:9px;overflow:hidden}
.ly-prog i{display:block;height:100%;background:var(--bar);border-radius:9px}
/* 配色通过自定义属性下发到 .frame 上：各编排定义 --ly-sub-*，
   不靠规则优先级抢 !important —— 旧版各套的字幕配色全被这条通用规则盖掉，
   九套字幕条实测都是同一个 rgba(0,0,0,.72)，观感自然像「只有一套模板」。 */
.frame[data-layout]:not([data-layout="burst"]) .subbar{
  position:absolute!important;left:var(--ly-sub-l,4%)!important;
  right:var(--ly-sub-r,4%)!important;bottom:var(--ly-sub-b,2.5%)!important;
  top:auto!important;transform:none!important;z-index:5!important;
  font-size:calc(var(--fs-title) * var(--scale,1) * .56 * var(--sub-fit,1))!important;
  background:var(--ly-sub-bg,rgba(0,0,0,.72))!important;
  color:var(--ly-sub-fg,#fff)!important;
  border:var(--ly-sub-border,0)!important;
  border-radius:var(--ly-sub-rad,calc(12px * var(--scale,1)))!important;
  text-shadow:var(--ly-sub-shadow,none)!important;
  font-weight:var(--ly-sub-weight,800)!important;
  text-align:var(--ly-sub-align,center)!important;
  justify-content:var(--ly-sub-align,center)!important;
  padding:calc(12px * var(--scale,1)) calc(20px * var(--scale,1))!important;
  line-height:1.35!important}
.frame[data-layout]:not([data-layout="burst"]) .subwrap{
  font-size:inherit!important;color:var(--ly-sub-fg,#fff)!important;display:inline!important}
/* 用户自定义字幕位置时尊重其设置，不用编排样式强行覆盖 */
.frame[data-subpos="middle"] .subbar,.frame[data-subpos="custom"] .subbar,
.frame[data-subpos="top"] .subbar{position:absolute!important}

/* ── 通用封面骨架（每套按 data-layout 再改）── */
.ly-cover{flex:1;display:flex;flex-direction:column;min-height:0;
  justify-content:center;gap:calc(var(--gap)*.4);position:relative}
.ly-cv-brand{font-size:calc(var(--fs-body)*var(--scale,1));font-weight:900;
  letter-spacing:6px;color:var(--bar)}
.ly-cv-issue{font-size:calc(var(--fs-cap)*var(--scale,1));color:var(--dim);letter-spacing:4px}
.ly-cv-title{margin:calc(var(--gap)*.3) 0!important}
.ly-cv-sub{font-size:calc(var(--fs-body)*var(--scale,1)*.9);color:var(--dim)}
.ly-cv-chips{font-size:calc(var(--fs-cap)*var(--scale,1));color:var(--bar);
  border-top:1px solid var(--line);padding-top:calc(var(--gap)*.4)}
.ly-cv-fine{font-size:calc(var(--fs-micro)*var(--scale,1));color:var(--dim);
  line-height:1.5;margin-top:calc(var(--gap)*.4);max-width:92%}
.ly-k-cover .ly-head{margin-bottom:calc(var(--gap)*1.2)}

/* ══ split ══ */
.frame[data-layout="split"] .ly-split{flex:1;display:grid;min-height:0;
  grid-template-columns:36fr 64fr;gap:2.5%}
.frame[data-layout="split"] .ly-sp-a,.frame[data-layout="split"] .ly-sp-b{
  min-width:0;display:flex;flex-direction:column;justify-content:center;
  padding:4% 5%;box-sizing:border-box;border-radius:calc(18px*var(--scale,1))}
.ly-sp-a{background:color-mix(in srgb,var(--a1) 26%,transparent);
  border:2px solid color-mix(in srgb,var(--a1) 55%,transparent)}
.ly-sp-b{background:rgba(255,255,255,.07);border:2px solid var(--line)}
.ly-sp-num{font-size:calc(var(--fs-hero)*var(--scale,1)*.9);font-weight:900;
  line-height:1;color:var(--bar);opacity:.9;letter-spacing:-6px;
  text-shadow:8px 8px 0 var(--ink);margin-bottom:calc(var(--gap)*.4)}
.ly-sp-tag{font-size:calc(var(--fs-cap)*var(--scale,1));color:var(--bar);
  letter-spacing:3px;font-weight:900;margin-bottom:calc(var(--gap)*.3)}
.ly-sp-flower{font-size:calc(var(--fs-body)*var(--scale,1)*1.35);font-weight:900;
  line-height:1.3;color:#fff;text-shadow:3px 3px 0 var(--ink)}
.ly-sp-lead{font-size:calc(var(--fs-cap)*var(--scale,1)*.95);color:var(--dim);
  margin-top:calc(var(--gap)*.7);line-height:1.5}
.ly-sp-strike{text-decoration:line-through;text-decoration-color:var(--a2);
  text-decoration-thickness:calc(5px*var(--scale,1));opacity:.72;
  font-size:calc(var(--fs-cap)*var(--scale,1))}
.ly-sp-fine{font-size:calc(var(--fs-micro)*var(--scale,1));color:var(--dim);
  margin-top:calc(var(--gap)*.5)}
.frame[data-layout="split"] .f-inner[data-shot="flip"] .ly-split{grid-template-columns:50fr 50fr}
.frame[data-layout="split"] .f-inner[data-shot="l1"] .ly-split{grid-template-columns:55fr 45fr}
.frame[data-layout="split"] .f-inner[data-shot="l2"] .ly-split{grid-template-columns:42fr 58fr}
.frame[data-layout="split"] .f-inner[data-shot="l3"] .ly-split{grid-template-columns:60fr 40fr}
.frame[data-layout="split"] .f-inner[data-shot="end"] .ly-split{
  grid-template-columns:1fr;grid-template-rows:34fr 66fr;gap:2%}
.frame[data-layout="split"] .f-inner[data-shot="end"] .ly-sp-a{flex-direction:row;
  align-items:center;gap:4%;justify-content:flex-start}
.frame[data-layout="split"] .f-inner[data-shot="end"] .ly-sp-num{font-size:calc(var(--fs-title)*var(--scale,1)*1.3)}
.frame[data-layout="split"] .ly-cover{padding:0 4%}
.frame[data-layout="split"] .ly-cv-title{border-left:calc(10px*var(--scale,1)) solid var(--bar)!important;
  padding-left:calc(24px*var(--scale,1))!important}

/* ══ chat ══ */
.frame[data-layout="chat"] .ly-chat{flex:1;display:flex;flex-direction:column;min-height:0}
.ly-h-chat{border-bottom:1px solid var(--line)}
.ly-msgs{flex:1;display:flex;flex-direction:column;gap:1.5%;justify-content:center;
  min-height:0;padding:2% 1%}
.ly-msg{max-width:82%;box-sizing:border-box;padding:2.2% 3%;
  border-radius:calc(22px*var(--scale,1));font-size:calc(var(--fs-cap)*var(--scale,1));
  line-height:1.5;color:#fff;box-shadow:5px 6px 0 rgba(0,0,0,.35);word-break:normal}
.ly-msg.in{align-self:flex-start;background:rgba(255,255,255,.13);
  border:2px solid rgba(255,255,255,.28);border-bottom-left-radius:calc(6px*var(--scale,1))}
.ly-msg.out{align-self:flex-end;background:color-mix(in srgb,var(--a1) 78%,#000);
  border-bottom-right-radius:calc(6px*var(--scale,1))}
.ly-msg.sys{align-self:center;max-width:90%;background:none;box-shadow:none;
  color:var(--dim);font-size:calc(var(--fs-micro)*var(--scale,1));border:0;letter-spacing:1px}
.ly-msg.sm{font-size:calc(var(--fs-cap)*var(--scale,1)*.85);opacity:.85;padding:1.4% 2.4%}
.ly-msg.strike{text-decoration:line-through;opacity:.62;
  text-decoration-color:var(--a2);text-decoration-thickness:4px}
.ly-msg.done{opacity:.5}
.ly-msg.cur{box-shadow:7px 8px 0 var(--ink)}
.ly-msg .big-title{font-size:calc(var(--fs-title)*var(--scale,1))!important}
.ly-msg-who{font-size:calc(var(--fs-micro)*var(--scale,1));opacity:.8;margin-bottom:calc(var(--gap)*.2)}
.ly-chat-input{flex:none;margin-top:1%;padding:2% 3%;border-radius:999px;
  border:2px solid var(--line);background:rgba(255,255,255,.06);
  color:var(--dim);font-size:calc(var(--fs-cap)*var(--scale,1)*.9)}
.frame[data-layout="chat"]{--ly-sub-bg:color-mix(in srgb,var(--a1) 82%,#000);
  --ly-sub-fg:#12101a;--ly-sub-border:3px solid #fff;
  --ly-sub-l:8%;--ly-sub-r:8%;--ly-sub-rad:999px}

/* ══ poster ══ */
.frame[data-layout="poster"] .ly-poster{flex:1;display:flex;flex-direction:column;min-height:0;
  background:repeating-linear-gradient(0deg,transparent 0 7%,var(--line) 7% calc(7% + 1px));
  padding:0 1%}
.ly-h-poster{border-bottom:calc(6px*var(--scale,1)) solid var(--fg)!important;
  color:var(--fg)}
.ly-masthead{display:flex;justify-content:space-between;flex:none;
  font-size:calc(var(--fs-cap)*var(--scale,1));letter-spacing:3px;color:var(--bar);
  border-bottom:1px solid var(--line);padding-bottom:calc(var(--gap)*.3);font-weight:800}
.ly-headline{flex:none;display:flex;align-items:center;gap:2%;
  padding:3% 0 2%;border-bottom:calc(3px*var(--scale,1)) solid var(--fg)}
.ly-htext{flex:1;min-width:0}
.ly-p-title{font-size:calc(var(--fs-title)*var(--scale,1))!important}
.ly-p-lead{font-size:calc(var(--fs-body)*var(--scale,1)*.88);color:var(--dim);
  margin-top:calc(var(--gap)*.5);line-height:1.5}
.ly-cols{flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:2%;min-height:0;
  padding-top:3%;align-content:stretch}
.ly-col{display:flex;flex-direction:column;gap:calc(var(--gap)*.18);min-width:0;
  padding:2.4% 3.4%;box-sizing:border-box;border-left:2px solid var(--line);
  line-height:1.4;color:var(--dim);background:rgba(255,255,255,.02)}
.ly-col b{color:var(--bar);font-weight:900}
.ly-col em{font-style:normal;color:var(--a2);font-weight:900;overflow-wrap:anywhere}
.ly-col i{font-style:normal;color:var(--bar);opacity:.85;letter-spacing:2px}
.ly-col.on{background:color-mix(in srgb,var(--a1) 22%,transparent);color:#fff;
  border-left-color:var(--bar)}
.ly-col.cur{box-shadow:inset 0 0 0 calc(3px*var(--scale,1)) var(--bar)}
.ly-col span{overflow-wrap:anywhere}
.ly-p-inter{flex:none;margin-top:calc(var(--gap)*.3);padding:1.4% 2%;
  border-top:1px dashed var(--line);color:var(--bar);letter-spacing:1px}
.ly-p-fine{flex:none;color:var(--dim);margin-top:calc(var(--gap)*.2);
  line-height:1.4;max-width:100%}
/* 印章不再 absolute 压免责，改为标题行右侧的一枚圆章 */
/* margin-right 给旋转后的包围盒留缓冲：旧版右边界超出 3px，
   textOverflow 判越界 → fit 收缩到 0.8884 → 主标题从 80px 掉到 71px。 */
.ly-stamp{flex:none;max-width:24%;margin-right:5%;transform:rotate(-13deg);
  border:calc(6px*var(--scale,1)) solid var(--a2);border-radius:50%;
  color:var(--a2);font-weight:900;letter-spacing:2px;padding:2% 2.6%;
  opacity:.92;text-align:center;word-break:keep-all}
.ly-stamp.ghost{opacity:.3;border-style:dashed}
.frame[data-layout="poster"] .ly-cover{border-top:calc(10px*var(--scale,1)) solid var(--bar);
  padding-top:4%}
.frame[data-layout="poster"]{--ly-sub-bg:var(--fg);--ly-sub-fg:var(--bg);
  --ly-sub-rad:0;--ly-sub-weight:900;
  --ly-sub-border:calc(4px*var(--scale,1)) solid var(--bar)}

/* ══ chart ══ */
.frame[data-layout="chart"] .ly-chart{flex:1;display:grid;min-height:0;
  grid-template-columns:38fr 62fr;grid-template-rows:auto 1fr auto;
  column-gap:3%;align-content:stretch}
.ly-h-chart{grid-column:1/-1}
.ly-metric{grid-row:2;display:flex;flex-direction:column;justify-content:center;
  align-items:flex-start;border-right:2px solid var(--line);padding-right:4%}
.ly-metric b{font-size:calc(var(--fs-hero)*var(--scale,1)*.72);line-height:1;
  font-weight:900;color:var(--bar);letter-spacing:-5px;
  text-shadow:8px 8px 0 var(--ink);overflow-wrap:anywhere}
.ly-metric span{font-size:calc(var(--fs-cap)*var(--scale,1));color:var(--dim);
  letter-spacing:3px;margin-top:calc(var(--gap)*.4)}
.ly-ctitle{grid-row:2;display:flex;flex-direction:column;justify-content:center;min-width:0}
.ly-c-kicker{font-size:calc(var(--fs-cap)*var(--scale,1));color:var(--bar);
  letter-spacing:3px;margin-bottom:calc(var(--gap)*.3)}
.ly-bars{grid-column:1/-1;grid-row:3;display:flex;flex-direction:column;
  gap:calc(var(--gap)*.35);padding:2% 0 1%;border-top:1px solid var(--line)}
.ly-bar-row{display:flex;align-items:center;gap:3%;font-size:calc(var(--fs-micro)*var(--scale,1));
  color:var(--dim)}
.ly-bar-row span{width:8%;flex:none}
.ly-bar-row i{height:calc(16px*var(--scale,1));display:block;border-radius:9px;
  background:var(--line);transition:none}
.ly-bar-row.on i{background:linear-gradient(90deg,var(--a1),var(--a2))}
.ly-axis{grid-column:1/-1;font-size:calc(var(--fs-micro)*var(--scale,1)*.8);
  color:var(--dim);letter-spacing:2px;border-top:1px dashed var(--line);padding-top:1%}
.ly-c-verdict{align-self:flex-start;margin-top:calc(var(--gap)*.5);
  font-size:calc(var(--fs-cap)*var(--scale,1));color:var(--bar);
  border:2px solid var(--bar);padding:1% 2%;border-radius:99px}
.frame[data-layout="chart"] .ly-cover{border-left:calc(20px*var(--scale,1)) solid var(--a2);
  padding-left:5%;background:repeating-linear-gradient(0deg,transparent 0 9%,var(--line) 9% calc(9% + 1px))}
.frame[data-layout="chart"]{--ly-sub-bg:rgba(0,0,0,.9);
  --ly-sub-border:calc(4px*var(--scale,1)) solid var(--a2);
  --ly-sub-rad:0;--ly-sub-align:left}
.frame[data-layout="chart"] .subbar{font-family:ui-monospace,Menlo,Consolas,monospace!important;
  letter-spacing:1px!important}
/* 巨型数据绝不拆行：18000V 曾被断成「180 / 00V」，按字符数整体缩放。
   横版规则特异性更高会覆盖 font-size，white-space 仍继承本条。 */
.frame[data-layout="chart"] .ly-metric b{white-space:nowrap;
  font-size:calc(var(--fs-hero)*var(--scale,1)*.72*var(--num-k,1))}

/* ══ sticky ══ */
.frame[data-layout="sticky"] .ly-sticky{flex:1;position:relative;min-height:0}
/* 三张便签统一排在顶部一行，主卡片在其下方，文字区域零相交 */
.ly-note{position:absolute;width:30%;min-height:13%;padding:3% 3% 4%;
  box-sizing:border-box;background:rgba(255,255,255,.13);
  border:2px solid rgba(255,255,255,.28);border-radius:calc(8px*var(--scale,1));
  box-shadow:6px 8px 0 rgba(0,0,0,.4);font-size:calc(var(--fs-cap)*var(--scale,1)*.82);
  color:#fff;line-height:1.45;opacity:.86;background:rgba(255,255,255,.16)}
.ly-note.lit{opacity:1;background:color-mix(in srgb,var(--a1) 30%,transparent)}
.ly-note.n1{left:2%;top:4%;transform:rotate(-3deg)}
.ly-note.n2{left:35%;top:5%;transform:rotate(2deg)}
.ly-note.n3{right:2%;top:4%;transform:rotate(-2deg)}
.ly-note small{position:absolute;right:6%;bottom:6%;color:var(--bar);font-weight:900}
.ly-tape{position:absolute;left:36%;top:-4%;width:28%;height:9%;
  background:color-mix(in srgb,var(--bar) 60%,transparent);opacity:.8;
  transform:rotate(-3deg);box-shadow:0 2px 6px rgba(0,0,0,.3)}
.ly-s-current{position:absolute;width:82%;left:9%;padding:4% 4% 5%;box-sizing:border-box;
  background:rgba(12,16,24,.94);border:3px solid var(--bar);
  border-radius:calc(10px*var(--scale,1));box-shadow:12px 14px 0 rgba(0,0,0,.55);
  z-index:3;transform:none}
.ly-s-title{font-size:calc(var(--fs-title)*var(--scale,1))!important}
.ly-s-sub{font-size:calc(var(--fs-cap)*var(--scale,1)*.95);color:var(--dim);
  margin-top:calc(var(--gap)*.5);line-height:1.5}
.frame[data-layout="sticky"] .f-inner[data-shot="hook"] .ly-s-current{left:7%;top:36%;width:84%}
.frame[data-layout="sticky"] .f-inner[data-shot="flip"] .ly-s-current{left:11%;top:39%;width:80%}
.frame[data-layout="sticky"] .f-inner[data-shot="l1"] .ly-s-current{left:6%;top:35%;width:84%}
.frame[data-layout="sticky"] .f-inner[data-shot="l2"] .ly-s-current{left:10%;top:38%;width:80%}
.frame[data-layout="sticky"] .f-inner[data-shot="l3"] .ly-s-current{left:8%;top:37%;width:82%}
.frame[data-layout="sticky"] .f-inner[data-shot="end"] .ly-s-current{left:12%;top:37%;width:76%}
.frame[data-layout="sticky"] .ly-cover{background:rgba(12,16,24,.9);padding:5%;
  border:3px solid var(--bar);transform:none}
.frame[data-layout="sticky"]{--ly-sub-bg:var(--bar);--ly-sub-fg:#12101a;
  --ly-sub-weight:900;--ly-sub-border:3px solid #12101a;
  --ly-sub-l:10%;--ly-sub-r:10%}

/* ══ cinema ══ */
.frame[data-layout="cinema"] .ly-cinema{flex:1;position:relative;display:flex;
  align-items:center;justify-content:center;min-height:0}
/* 黑边已提到 .frame 级贯穿全幅，这里不再重复绘制 */
.ly-h-cinema{border:0!important;opacity:.5;position:absolute;top:9%;left:0;right:0;
  gap:calc(var(--gap)*.3)}
.ly-h-cinema .ly-prog{background:rgba(255,255,255,.2);height:2px}
.ly-c-main{width:84%;text-align:center;display:flex;flex-direction:column;
  align-items:center;gap:calc(var(--gap)*1.1)}
.ly-c-no{font-size:calc(var(--fs-micro)*var(--scale,1));letter-spacing:8px;color:var(--dim)}
.ly-c-title{font-weight:600!important;letter-spacing:2px!important;
  text-shadow:none!important;line-height:1.5!important;
  font-size:calc(var(--fs-title)*var(--scale,1))!important}
.ly-c-sub,.ly-c-ans{font-size:calc(var(--fs-cap)*var(--scale,1));color:var(--dim);
  letter-spacing:2px;line-height:1.6}
.ly-c-ans{color:var(--bar);letter-spacing:4px}
.ly-c-side{position:absolute;left:2%;top:46%;writing-mode:vertical-rl;
  font-size:calc(var(--fs-cap)*var(--scale,1));color:var(--dim);letter-spacing:5px;opacity:.6}
.ly-c-foot{position:absolute;right:2%;bottom:9%;font-size:calc(var(--fs-micro)*var(--scale,1));
  color:var(--dim);letter-spacing:3px}
.frame[data-layout="cinema"] .ly-cover{background:#000;padding:6%;text-align:center}
.frame[data-layout="cinema"] .ly-cv-title{font-weight:600!important;text-shadow:none!important}
.frame[data-layout="cinema"]{--ly-sub-bg:transparent;--ly-sub-fg:#fff;
  --ly-sub-weight:700;--ly-sub-shadow:2px 2px 0 #000,0 0 12px #000;
  --ly-sub-b:9%}
/* 电影黑边必须挂在 .frame 上贯穿整幅：挂在 .ly-cinema 上时只覆盖文字栏宽度，
   成品图里看着像上下各贴了一块短黑矩形，不是 letterbox。 */
.frame[data-layout="cinema"]::before,.frame[data-layout="cinema"]::after{
  content:"";position:absolute;left:0;right:0;height:7.5%;background:#000;z-index:6}
.frame[data-layout="cinema"]::before{top:0}
.frame[data-layout="cinema"]::after{bottom:0}

/* ══ checklist ══ */
.frame[data-layout="checklist"] .ly-check{flex:1;display:grid;min-height:0;
  grid-template-columns:30fr 70fr;column-gap:3%}
.ly-h-check{grid-column:1/-1}
.ly-ck-steps{display:flex;flex-direction:column;justify-content:center;gap:calc(var(--gap)*.8);
  position:relative;padding-left:2%}
.ly-ck-steps::before{content:"";position:absolute;left:calc(var(--fs-body)*var(--scale,1)*.5);
  top:12%;bottom:12%;width:calc(3px*var(--scale,1));background:var(--line)}
.ly-ck-step{display:flex;align-items:center;gap:6%;position:relative;
  font-size:calc(var(--fs-cap)*var(--scale,1)*.88);color:var(--dim);line-height:1.4}
.ly-ck-step b{flex:none;width:calc(var(--fs-body)*var(--scale,1)*1.05);
  height:calc(var(--fs-body)*var(--scale,1)*1.05);border-radius:50%;
  display:grid;place-items:center;background:rgba(255,255,255,.1);
  border:2px solid var(--line);font-size:calc(var(--fs-micro)*var(--scale,1));
  color:var(--dim);font-weight:900;z-index:1}
.ly-ck-step.done b{background:var(--a1);color:var(--ink);border-color:var(--bar)}
.ly-ck-step.cur{color:#fff;font-weight:800}
.ly-ck-step.cur b{box-shadow:0 0 0 calc(6px*var(--scale,1)) color-mix(in srgb,var(--a1) 30%,transparent)}
.ly-ck-step span{overflow-wrap:anywhere}
.ly-ck-card{display:flex;flex-direction:column;justify-content:center;min-width:0;
  padding:5%;box-sizing:border-box;background:rgba(255,255,255,.07);
  border:2px solid var(--line);border-radius:calc(18px*var(--scale,1))}
.ly-ck-kicker{font-size:calc(var(--fs-cap)*var(--scale,1));color:var(--bar);
  letter-spacing:3px;margin-bottom:calc(var(--gap)*.3)}
.ly-ck-note{font-size:calc(var(--fs-cap)*var(--scale,1)*.95);color:var(--dim);
  margin-top:calc(var(--gap)*.6);line-height:1.5}
.ly-ck-stamp{align-self:flex-start;margin-top:calc(var(--gap)*.7);
  border:3px solid var(--bar);color:var(--bar);padding:1.5% 3%;border-radius:99px;
  font-size:calc(var(--fs-cap)*var(--scale,1));font-weight:900;transform:rotate(-4deg)}
.frame[data-layout="checklist"] .ly-cover{border-left:calc(16px*var(--scale,1)) solid var(--a1);
  padding-left:6%;background:linear-gradient(90deg,rgba(163,230,53,.14),transparent 42%)}
.frame[data-layout="checklist"]{--ly-sub-bg:var(--a1);--ly-sub-fg:var(--ink);
  --ly-sub-weight:900;--ly-sub-rad:999px;--ly-sub-l:12%;--ly-sub-r:12%}

/* ══ grid9 ══ */
.frame[data-layout="grid9"] .ly-grid{flex:1;display:flex;flex-direction:column;min-height:0;gap:2%}
.ly-g-rows{flex:1;display:grid;min-height:0;
  grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr;gap:2%}
.ly-g-cell{display:grid;place-items:center;border-radius:calc(14px*var(--scale,1));
  background:rgba(255,255,255,.06);border:2px solid var(--line);
  font-size:calc(var(--fs-body)*var(--scale,1));color:var(--dim);font-weight:800;
  letter-spacing:2px;text-align:center;padding:3%;box-sizing:border-box}
.ly-g-cell.lit{background:color-mix(in srgb,var(--a1) 70%,#000);
  color:#12101a;border-color:var(--bar);
  box-shadow:inset 0 0 0 calc(4px*var(--scale,1)) rgba(255,255,255,.22)}
.ly-g-banner{flex:none;padding:3% 4%;background:rgba(0,0,0,.5);
  border-left:calc(10px*var(--scale,1)) solid var(--bar);
  border-radius:calc(10px*var(--scale,1))}
.ly-g-title{font-size:calc(var(--fs-title)*var(--scale,1))!important}
.ly-g-ans{font-size:calc(var(--fs-cap)*var(--scale,1));color:var(--bar);
  margin-top:calc(var(--gap)*.3)}
.ly-g-foot{font-size:calc(var(--fs-micro)*var(--scale,1));color:var(--dim);
  letter-spacing:3px;text-align:right}
.frame[data-layout="grid9"] .ly-cover{background:
  repeating-linear-gradient(45deg,rgba(255,255,255,.05) 0 8%,transparent 8% 16%);padding:4%}
.frame[data-layout="grid9"]{--ly-sub-bg:var(--bar);--ly-sub-fg:#12101a;
  --ly-sub-weight:900;--ly-sub-rad:0;--ly-sub-l:6%;--ly-sub-r:6%}

/* ══ v8.1 观感收口 ══════════════════════════════════════════════
   九套骨架虽已不同，但此前共用同一片深蓝渐变 + 同一条黑字幕条，
   远看仍像「一套模板换字」。这里补三件事：
   1) 每套独立背景图案；2) 占满画面的低对比巨型装饰（CSS 伪元素，
      不是文字节点，不进口播/字幕/包围盒检查）；3) 辅助文字用 --fg 提亮，
      深底浅底都自动适配，不再用 .56 alpha 的 --dim 糊成一片。 */
.frame[data-layout]:not([data-layout="burst"]) .ly-root{isolation:isolate}
.frame[data-layout]:not([data-layout="burst"]) .ly-root::before{
  content:var(--ly-watermark,"");position:absolute;inset:0;z-index:-1;
  display:grid;place-items:center;pointer-events:none;overflow:hidden;
  font-size:calc(var(--fs-hero)*var(--scale,1)*3.4);font-weight:900;
  color:color-mix(in srgb,var(--fg) 8%,transparent);
  letter-spacing:-24px;line-height:1;white-space:nowrap}
.frame[data-layout="split"]{--ly-watermark:"";
  --ly-sub-bg:rgba(10,14,24,.86);--ly-sub-border:calc(3px*var(--scale,1)) solid var(--a1)}
.frame[data-layout="split"] .ly-root{background-image:
  linear-gradient(115deg,transparent 0 48%,color-mix(in srgb,var(--a1) 12%,transparent) 48% 52%,transparent 52%)}
.frame[data-layout="chat"]{--ly-watermark:"···"}
.frame[data-layout="chat"] .ly-root{background-image:
  radial-gradient(color-mix(in srgb,var(--fg) 9%,transparent) 1px,transparent 1px);
  background-size:28px 28px}
.frame[data-layout="poster"]{--ly-watermark:"NO."}
.frame[data-layout="poster"] .ly-root{background-image:
  repeating-linear-gradient(90deg,transparent 0 11%,color-mix(in srgb,var(--fg) 5%,transparent) 11% calc(11% + 1px))}
.frame[data-layout="chart"]{--ly-watermark:"%"}
.frame[data-layout="chart"] .ly-root{background-image:
  linear-gradient(90deg,color-mix(in srgb,var(--fg) 5%,transparent) 1px,transparent 1px),
  linear-gradient(0deg,color-mix(in srgb,var(--fg) 5%,transparent) 1px,transparent 1px);
  background-size:64px 64px}
.frame[data-layout="sticky"]{--ly-watermark:"✎"}
.frame[data-layout="sticky"] .ly-root{background-image:
  linear-gradient(135deg,color-mix(in srgb,var(--fg) 4%,transparent) 25%,transparent 25% 50%,
    color-mix(in srgb,var(--fg) 4%,transparent) 50% 75%,transparent 75%);
  background-size:90px 90px}
.frame[data-layout="cinema"]{--ly-watermark:""}
.frame[data-layout="checklist"]{--ly-watermark:"✓"}
.frame[data-layout="checklist"] .ly-root{background-image:
  repeating-linear-gradient(0deg,transparent 0 8%,color-mix(in srgb,var(--fg) 5%,transparent) 8% calc(8% + 1px))}
.frame[data-layout="grid9"]{--ly-watermark:"#"}
.frame[data-layout="grid9"] .ly-root{background-image:
  linear-gradient(90deg,color-mix(in srgb,var(--fg) 4%,transparent) 1px,transparent 1px);
  background-size:12.5% 100%}
/* 辅助文字提亮：原来 --dim 只有 .56 alpha，深底上几乎看不见 */
.frame[data-layout]:not([data-layout="burst"]) .ly-msg.sys,
.frame[data-layout]:not([data-layout="burst"]) .ly-chat-input,
.frame[data-layout]:not([data-layout="burst"]) .ly-col,
.frame[data-layout]:not([data-layout="burst"]) .ly-p-lead,
.frame[data-layout]:not([data-layout="burst"]) .ly-p-fine,
.frame[data-layout]:not([data-layout="burst"]) .ly-bar-row,
.frame[data-layout]:not([data-layout="burst"]) .ly-axis,
.frame[data-layout]:not([data-layout="burst"]) .ly-note,
.frame[data-layout]:not([data-layout="burst"]) .ly-c-sub,
.frame[data-layout]:not([data-layout="burst"]) .ly-c-side,
.frame[data-layout]:not([data-layout="burst"]) .ly-c-foot,
.frame[data-layout]:not([data-layout="burst"]) .ly-ck-step,
.frame[data-layout]:not([data-layout="burst"]) .ly-ck-note,
.frame[data-layout]:not([data-layout="burst"]) .ly-g-cell,
.frame[data-layout]:not([data-layout="burst"]) .ly-g-foot,
.frame[data-layout]:not([data-layout="burst"]) .ly-cv-fine,
.frame[data-layout]:not([data-layout="burst"]) .ly-cv-sub,
.frame[data-layout]:not([data-layout="burst"]) .ly-metric span{
  color:color-mix(in srgb,var(--fg) 80%,var(--bg))}
/* 亮格是黄/青底，必须回到深色字：上面那条通用提亮会把它刷成白字，
   实测成品图里「结论 / 细节 / 真相」几乎看不见。 */
.frame[data-layout="grid9"] .ly-g-cell.lit{color:#12101a}
/* 电影拍号与标题拉开，横版下不再贴成「像压字」 */
.frame[data-layout="cinema"] .ly-c-main{gap:calc(var(--gap)*3.2)}
.frame[data-layout="cinema"] .ly-c-no{color:var(--dim);letter-spacing:6px}
/* 九宫格 / 清单 / 便签 / 报头的小字放大一档，不再细如蚊足 */
.frame[data-layout]:not([data-layout="burst"]) .ly-g-cell,
.frame[data-layout]:not([data-layout="burst"]) .ly-col,
.frame[data-layout]:not([data-layout="burst"]) .ly-note,
.frame[data-layout]:not([data-layout="burst"]) .ly-ck-step,
.frame[data-layout]:not([data-layout="burst"]) .ly-msg.sys,
.frame[data-layout]:not([data-layout="burst"]) .ly-cv-fine{
  font-size:calc(var(--fs-cap)*var(--scale,1)*1.06)}

/* 选项：所有编排共用，但样式跟花字模板的选项不同（无描边字） */
.ly-opts{display:grid;grid-template-columns:1fr 1fr;gap:2%;margin-top:3%;width:100%}
.ly-opt{display:flex;align-items:center;gap:3%;min-width:0;padding:2% 3%;
  box-sizing:border-box;border:2px solid rgba(255,255,255,.35);
  border-radius:calc(12px*var(--scale,1));background:rgba(255,255,255,.1);
  font-size:calc(var(--fs-cap)*var(--scale,1)*.95);color:#fff;line-height:1.35}
.ly-opt b{flex:none;width:calc(var(--fs-cap)*var(--scale,1)*1.2);
  height:calc(var(--fs-cap)*var(--scale,1)*1.2);border-radius:50%;
  display:grid;place-items:center;background:var(--bar);color:var(--ink);
  font-size:calc(var(--fs-micro)*var(--scale,1));font-weight:900}
.ly-opt span{min-width:0;overflow-wrap:anywhere}

/* ══ 10. hotlist 热搜榜单 ══ */
.frame[data-layout="hotlist"] .ly-hot{flex:1;display:flex;flex-direction:column;min-height:0;gap:1.4%}
.ly-ht-lead{color:var(--bar);letter-spacing:2px;flex:none}
.ly-ht-list{flex:1;display:flex;flex-direction:column;justify-content:center;gap:2%;min-height:0}
.ly-ht-row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:3%;
  padding:1.8% 2.6%;box-sizing:border-box;border-radius:calc(12px*var(--scale,1));
  background:rgba(255,255,255,.06);border:2px solid var(--line);min-height:0}
.ly-ht-row.top{background:color-mix(in srgb,var(--a1) 26%,transparent);border-color:var(--bar)}
.ly-ht-row b{color:var(--bar);font-weight:900;min-width:1.5em}
.ly-ht-row span{min-width:0;overflow-wrap:anywhere;color:#fff;font-weight:800}
.ly-ht-tag{font-style:normal;padding:.3% 1.5%;border-radius:99px;
  background:var(--a2);color:var(--ink);font-weight:900}
.ly-ht-bar{grid-column:1/-1;height:calc(8px*var(--scale,1));
  background:var(--line);border-radius:9px;overflow:hidden}
.ly-ht-bar u{display:block;height:100%;background:var(--bar);text-decoration:none}
.ly-ht-title{flex:none;padding:2.6% 3%;background:rgba(0,0,0,.5);
  border-left:calc(10px*var(--scale,1)) solid var(--bar);
  border-radius:calc(10px*var(--scale,1))}
.ly-ht-inter{flex:none;color:var(--bar);letter-spacing:1px}

/* ══ 11. exam 试卷批改 ══ */
.frame[data-layout="exam"] .ly-exam{flex:1;display:flex;flex-direction:column;min-height:0;gap:1.8%}
.ly-ex-q{flex:none;padding:2.6% 3.4%;box-sizing:border-box;
  background:rgba(255,255,255,.08);border:2px solid var(--line);
  border-radius:calc(14px*var(--scale,1))}
.ly-ex-kicker{display:block;color:var(--bar);letter-spacing:4px;font-weight:900;margin-bottom:1%}
.ly-ex-marks{flex:1;display:flex;flex-direction:column;justify-content:center;gap:1.8%;min-height:0}
.ly-ex-mark{padding:1.4% 2.6%;box-sizing:border-box;
  border-left:calc(6px*var(--scale,1)) solid var(--bar);
  background:rgba(255,255,255,.06);color:#fff;
  border-radius:0 calc(10px*var(--scale,1)) calc(10px*var(--scale,1)) 0;
  overflow-wrap:anywhere}
.ly-ex-mark.cross{border-left-color:var(--a2);color:var(--a2);
  text-decoration:line-through;opacity:.85}
.ly-ex-mark.ok{border-left-color:var(--a1)}
.ly-ex-score{flex:none;align-self:flex-end;margin-right:3%;transform:rotate(-6deg);
  border:calc(4px*var(--scale,1)) solid var(--a2);color:var(--a2);
  padding:1% 2.6%;border-radius:calc(10px*var(--scale,1));font-weight:900;letter-spacing:2px}
.ly-ex-score.ghost{opacity:.42;border-style:dashed}
.ly-ex-q .ly-opts{margin-top:2%}

/* ══ 12. receipt 核实小票 ══ */
/* 必须是 column：旧版横向 flex 把 head 挤到画面左中、小票纸只占右半幅，
   纸内 80px 标题被压成竖排窄条（成品图里最刺眼的一张坏帧）。 */
.frame[data-layout="receipt"] .ly-receipt{flex:1;display:flex;flex-direction:column;
  min-height:0;padding:0 3%;gap:1.4%}
.ly-r-paper{flex:1;display:flex;flex-direction:column;min-height:0;box-sizing:border-box;
  padding:3.4% 4.4%;background:rgba(246,245,236,.95);color:#1b1b1b;
  border-radius:calc(6px*var(--scale,1));box-shadow:10px 12px 0 rgba(0,0,0,.42);
  border-top:calc(10px*var(--scale,1)) solid var(--a2);position:relative}
.ly-r-brand{font-weight:900;letter-spacing:5px;color:#111}
.ly-r-meta{border-bottom:2px dashed #999;padding-bottom:1.4%;margin-bottom:1.4%}
/* 纯白纸上三行挤在正中会留下上下两大片死白，改成均匀铺满中间区 */
.ly-r-lines{flex:1;display:flex;flex-direction:column;justify-content:space-evenly;
  gap:1.4%;min-height:0}
.ly-r-line{display:flex;justify-content:space-between;gap:3%;min-width:0;
  border-bottom:1px dotted #bbb;padding-bottom:1%;color:#1b1b1b}
.ly-r-line span{overflow-wrap:anywhere}
.ly-r-line b{flex:none;color:#0b6b73;font-weight:900}
.ly-r-line.done span{font-weight:900}
.ly-r-head{border-bottom:2px solid #555;padding-bottom:1.2%;opacity:.72}
.ly-r-total{display:flex;justify-content:space-between;align-items:center;
  border-top:3px double #333;padding-top:1.6%;margin-top:1.4%;color:#111}
.ly-r-total b{color:#0b6b73}
.ly-r-title{margin-top:2%}
/* 浅纸上的主标题必须深色。旧规则特异性 (0,4,0) 输给通用
   .frame[data-layout]:not(...) .ly-root .big-title (0,5,0)，
   成品图里出现「白字+黑描边压在米白小票上」的坏帧。
   这里加 data-ratio 与 .ly-root 提到 (0,6,0)，并显式清掉描边。 */
.frame[data-layout="receipt"][data-ratio] .ly-root .ly-r-title .big-title{
  color:#111!important;text-shadow:none!important;
  -webkit-text-stroke:0!important}
.ly-r-code{height:calc(40px*var(--scale,1));margin-top:2%;flex:none;
  background:repeating-linear-gradient(90deg,#1b1b1b 0 3px,transparent 3px 6px,
    #1b1b1b 6px 9px,transparent 9px 13px)}
.ly-r-fine{margin-top:1.6%;color:#555;line-height:1.4;flex:none}

/* 三套新编排各自的背景图案 / 水印 / 字幕条 */
.frame[data-layout="hotlist"]{--ly-watermark:"TOP";
  --ly-sub-bg:color-mix(in srgb,var(--a2) 88%,#000);--ly-sub-fg:#12101a;
  --ly-sub-border:3px solid #fff;--ly-sub-rad:999px;--ly-sub-l:6%;--ly-sub-r:6%}
.frame[data-layout="hotlist"] .ly-root{background-image:
  repeating-linear-gradient(0deg,transparent 0 12%,color-mix(in srgb,var(--fg) 5%,transparent) 12% calc(12% + 1px))}
.frame[data-layout="exam"]{--ly-watermark:"100";
  --ly-sub-bg:#f6f5ec;--ly-sub-fg:#1b1b1b;
  --ly-sub-border:calc(4px*var(--scale,1)) solid var(--a2);--ly-sub-rad:0}
.frame[data-layout="exam"] .ly-root{background-image:
  repeating-linear-gradient(90deg,transparent 0 9%,color-mix(in srgb,var(--fg) 4%,transparent) 9% calc(9% + 1px))}
.frame[data-layout="receipt"]{--ly-watermark:"¥";
  --ly-sub-bg:#f6f5ec;--ly-sub-fg:#1b1b1b;
  --ly-sub-border:3px solid #1b1b1b;--ly-sub-rad:0}
.frame[data-layout="receipt"] .ly-root{background-image:
  linear-gradient(135deg,color-mix(in srgb,var(--fg) 3%,transparent) 25%,transparent 25% 50%,
    color-mix(in srgb,var(--fg) 3%,transparent) 50% 75%,transparent 75%);
  background-size:80px 80px}
/* 小票是浅纸：通用「辅助文字提亮」会把字刷成浅色，这里必须单独压回深色 */
.frame[data-layout="receipt"] .ly-r-brand,
.frame[data-layout="receipt"] .ly-r-meta,
.frame[data-layout="receipt"] .ly-r-line,
.frame[data-layout="receipt"] .ly-r-total,
.frame[data-layout="receipt"] .ly-r-fine{color:#1b1b1b!important}
.frame[data-layout="receipt"] .ly-r-fine{color:#555!important}

/* 16:9：竖向分区改横向，字号基准一个字都不动 */
.frame[data-ratio="16:9"][data-layout]:not([data-layout="burst"]) .ly-root{bottom:17%}
.frame[data-ratio="16:9"][data-layout="split"] .ly-cols,
.frame[data-ratio="16:9"][data-layout="poster"] .ly-cols{gap:1.5%}
/* 旧版给 absolute 印章预留 16% 底部空白；印章已移进标题行，
   这 16% 正是 16:9 收尾帧内容溢出、压到字幕条的元凶，删除。 */
.frame[data-ratio="16:9"][data-layout="poster"] .ly-cols{padding-bottom:0}
.frame[data-ratio="16:9"][data-layout="poster"] .ly-stamp{padding:1% 2%;max-width:18%}
.frame[data-ratio="16:9"][data-layout="chart"] .ly-metric b{font-size:calc(var(--fs-hero)*var(--scale,1)*.5)}
.frame[data-ratio="16:9"][data-layout="sticky"] .ly-note{width:30%;min-height:20%}
.frame[data-ratio="16:9"][data-layout="sticky"] .ly-s-current{
  width:88%!important;left:6%!important;top:33%!important;padding:2% 3%!important}
.frame[data-ratio="16:9"][data-layout="grid9"] .ly-g-rows{grid-template-columns:repeat(6,1fr);grid-template-rows:1fr}
.frame[data-ratio="16:9"][data-layout="checklist"] .ly-ck-steps{gap:calc(var(--gap)*.4)}
.frame[data-ratio="16:9"][data-layout="poster"] .ly-cols{padding-top:1.5%}
/* 16:9 内容区只有 714 逻辑高：收尾帧再叠互动栏会溢出 ly-root，
   压到下方字幕条（实测「读者互动」「免责」都与字幕相交）。互动改由字幕口播承接。 */
.frame[data-ratio="16:9"][data-layout="poster"] .f-inner[data-shot="end"] .ly-p-inter{display:none}
.frame[data-ratio="16:9"][data-layout="poster"] .ly-p-fine{font-size:var(--fs-meta)!important}
.frame[data-ratio="16:9"][data-layout="hotlist"] .ly-ht-list{gap:1%}
.frame[data-ratio="16:9"][data-layout="hotlist"] .ly-ht-row{padding:1% 2%}
.frame[data-ratio="16:9"][data-layout="exam"] .ly-ex-marks{gap:1%}
.frame[data-ratio="16:9"][data-layout="exam"] .ly-ex-mark{padding:.8% 2%}
.frame[data-ratio="16:9"][data-layout="exam"] .ly-ex-q .ly-opts{margin-top:1%}
.frame[data-ratio="16:9"][data-layout="receipt"] .ly-receipt{padding:0 14%}
.frame[data-ratio="16:9"][data-layout="receipt"] .ly-r-paper{padding:2% 3.4%}
.frame[data-ratio="16:9"][data-layout="receipt"] .ly-r-lines{gap:.6%}
.frame[data-ratio="16:9"][data-layout="receipt"] .ly-r-code{height:calc(26px*var(--scale,1))}
/* 字号放大后 16:9 的气泡曾与报头 / 输入条互压：公告条让位、顶部对齐、收紧内边距 */
.frame[data-ratio="16:9"][data-layout="chat"] .ly-msg.sys{display:none}
.frame[data-ratio="16:9"][data-layout="chat"] .ly-msgs{gap:1%;padding:1% 0;
  justify-content:flex-start}
.frame[data-ratio="16:9"][data-layout="chat"] .ly-msg{padding:1% 2%}
.frame[data-ratio="16:9"][data-layout="chat"] .ly-chat-input{padding:1% 2%;margin-top:.4%}
/* 16:9 只有 714 逻辑高的内容区，纵向堆叠会溢出。三套新骨架改横向两栏：
   exam 左题卡 / 右批注+章；receipt 左清单 / 右合计+主标题；poster 收紧留白。 */
.frame[data-ratio="16:9"][data-layout="poster"] .ly-head{margin-bottom:calc(var(--gap)*.2)}
.frame[data-ratio="16:9"][data-layout="poster"] .ly-headline{padding:1.2% 0 1%}
.frame[data-ratio="16:9"][data-layout="poster"] .ly-col{padding:1.2% 2.4%}
.frame[data-ratio="16:9"][data-layout="poster"] .ly-p-fine{margin-top:0}
.frame[data-ratio="16:9"][data-layout="exam"] .ly-exam{
  display:grid;grid-template-columns:50fr 50fr;grid-template-rows:auto 1fr auto;
  column-gap:3%;gap:1.4%}
.frame[data-ratio="16:9"][data-layout="exam"] .ly-h-exam{grid-column:1/-1;grid-row:1}
.frame[data-ratio="16:9"][data-layout="exam"] .ly-ex-q{grid-column:1;grid-row:2/4;
  align-self:start}
.frame[data-ratio="16:9"][data-layout="exam"] .ly-ex-marks{grid-column:2;grid-row:2}
.frame[data-ratio="16:9"][data-layout="exam"] .ly-ex-score{grid-column:2;grid-row:3;
  align-self:end;justify-self:end;margin-right:0}
/* 两栏 grid 让 80px 主标题挤在半幅里折成 4 行、压住合计与免责。
   改回纵向单栏，但把清单行排成 2 列、隐藏条码，主标题用满纸宽只折 2 行。 */
.frame[data-ratio="16:9"][data-layout="receipt"] .ly-r-paper{display:flex;flex-direction:column}
.frame[data-ratio="16:9"][data-layout="receipt"] .ly-r-lines{
  display:grid;grid-template-columns:repeat(3,1fr);gap:.4% 1.5%;
  justify-content:flex-start;flex:0 0 auto;min-height:auto}
.frame[data-ratio="16:9"][data-layout="receipt"] .ly-r-head{grid-column:1/-1}
.frame[data-ratio="16:9"][data-layout="receipt"] .ly-r-code{display:none}
.frame[data-ratio="16:9"][data-layout="receipt"] .ly-r-title{margin-top:.6%}
.frame[data-ratio="16:9"][data-layout="receipt"] .ly-r-fine{margin-top:.6%}
.frame[data-ratio="16:9"][data-layout="receipt"] .ly-r-meta{margin-bottom:.4%;padding-bottom:.6%}
.frame[data-ratio="16:9"][data-layout="receipt"] .ly-r-total{margin-top:.6%;padding-top:.8%}
/* 收尾三栏的「已核实」状态行让位给免责，状态本身由亮格与印章表达 */
.frame[data-ratio="16:9"][data-layout="poster"] .f-inner[data-shot="end"] .ly-col i{display:none}
/* 16:9 清单已改成三列一行（flex:0 0 auto），收尾帧可以保留它，
   小票才像小票；旧版四行纵向清单会撑满 714 逻辑高互压，故当时隐藏。
   长带走句折两行时会把免责推出纸底、撞上字幕条（single/multi 实测），
   这里让清单只留标签、不重复「已核实」（合计已表达结论），省出约 60px。 */
.frame[data-ratio="16:9"][data-layout="receipt"] .f-inner[data-shot="end"] .ly-r-line b{display:none}

/* ══ v8.2 字号硬下限 ══════════════════════════════════════════════════
   用户截图红框：三栏 / 便签 / 清单的要点文字实测只有 29.68px（--fs-cap 28px
   × .9），序号 24.7px，在 1080×1920 上仅为主标题 80px 的 37%。
   根因是这些「承载信息的文字」被当成注释用了 --fs-micro/--fs-cap 小字阶。
   现在分三档并设 px 下限，任何编排、任何配色、任何画幅都不许再低于它：
     信息主体 44px / 长句与序号 36px / 时间码等元信息 30px。
   配合 triad() 把每格文字压到 ≤6 字，才放得下这么大的字。 */
.frame[data-layout]:not([data-layout="burst"]){
  /* max() 的左侧是「绝对下限」：即便自适应收缩或用户选小字档，
     信息文字也不许退回 29px。右侧才跟随字阶放大。 */
  --fs-aux:max(40px, calc(var(--fs-cap)*1.55*var(--scale,1)));
  --fs-aux-sm:max(32px, calc(var(--fs-cap)*1.3*var(--scale,1)));
  --fs-meta:max(26px, calc(var(--fs-micro)*1.35*var(--scale,1)))}
/* 44px：观众真正要读的标签 / 格子 / 选项 / 榜单词 / 批注 */
.frame[data-layout]:not([data-layout="burst"]) .ly-col span,
.frame[data-layout]:not([data-layout="burst"]) .ly-col em,
.frame[data-layout]:not([data-layout="burst"]) .ly-col i,
.frame[data-layout]:not([data-layout="burst"]) .ly-note span,
.frame[data-layout]:not([data-layout="burst"]) .ly-ck-step span,
.frame[data-layout]:not([data-layout="burst"]) .ly-g-cell,
.frame[data-layout]:not([data-layout="burst"]) .ly-opt span,
.frame[data-layout]:not([data-layout="burst"]) .ly-ht-row span,
.frame[data-layout]:not([data-layout="burst"]) .ly-ht-tag,
.frame[data-layout]:not([data-layout="burst"]) .ly-ex-mark,
.frame[data-layout]:not([data-layout="burst"]) .ly-r-line span,
.frame[data-layout]:not([data-layout="burst"]) .ly-r-line b,
.frame[data-layout]:not([data-layout="burst"]) .ly-r-total b,
.frame[data-layout]:not([data-layout="burst"]) .ly-r-total span,
.frame[data-layout]:not([data-layout="burst"]) .ly-r-brand,
.frame[data-layout]:not([data-layout="burst"]) .ly-sp-flower,
.frame[data-layout]:not([data-layout="burst"]) .ly-cv-sub,
.frame[data-layout]:not([data-layout="burst"]) .ly-cv-chips,
.frame[data-layout]:not([data-layout="burst"]) .ly-g-ans,
.frame[data-layout]:not([data-layout="burst"]) .ly-stamp,
.frame[data-layout]:not([data-layout="burst"]) .ly-ck-stamp
{font-size:var(--fs-aux)!important;line-height:1.35}
/* 36px：长句、序号、互动栏、批注章 */
.frame[data-layout]:not([data-layout="burst"]) .ly-p-lead,
.frame[data-layout]:not([data-layout="burst"]) .ly-p-inter,
.frame[data-layout]:not([data-layout="burst"]) .ly-msg,
.frame[data-layout]:not([data-layout="burst"]) .ly-chat-input,
.frame[data-layout]:not([data-layout="burst"]) .ly-sp-lead,
.frame[data-layout]:not([data-layout="burst"]) .ly-sp-strike,
.frame[data-layout]:not([data-layout="burst"]) .ly-sp-tag,
.frame[data-layout]:not([data-layout="burst"]) .ly-c-sub,
.frame[data-layout]:not([data-layout="burst"]) .ly-c-ans,
.frame[data-layout]:not([data-layout="burst"]) .ly-c-side,
.frame[data-layout]:not([data-layout="burst"]) .ly-ck-note,
.frame[data-layout]:not([data-layout="burst"]) .ly-ck-kicker,
.frame[data-layout]:not([data-layout="burst"]) .ly-c-kicker,
.frame[data-layout]:not([data-layout="burst"]) .ly-metric span,
.frame[data-layout]:not([data-layout="burst"]) .ly-ht-lead,
.frame[data-layout]:not([data-layout="burst"]) .ly-ht-inter,
.frame[data-layout]:not([data-layout="burst"]) .ly-ex-score,
.frame[data-layout]:not([data-layout="burst"]) .ly-col b,
.frame[data-layout]:not([data-layout="burst"]) .ly-note small,
.frame[data-layout]:not([data-layout="burst"]) .ly-ck-step b,
.frame[data-layout]:not([data-layout="burst"]) .ly-opt b,
.frame[data-layout]:not([data-layout="burst"]) .ly-ht-row b
{font-size:var(--fs-aux-sm)!important;line-height:1.4}
/* 30px：时间码 / 报头 / 页脚 / 刻度 / 免责（元信息，仍比旧 22px 大） */
.frame[data-layout]:not([data-layout="burst"]) .ly-head,
.frame[data-layout]:not([data-layout="burst"]) .ly-head .ly-tc,
.frame[data-layout]:not([data-layout="burst"]) .ly-head .ly-hl,
.frame[data-layout]:not([data-layout="burst"]) .ly-masthead,
.frame[data-layout]:not([data-layout="burst"]) .ly-cv-issue,
.frame[data-layout]:not([data-layout="burst"]) .ly-c-foot,
.frame[data-layout]:not([data-layout="burst"]) .ly-g-foot,
.frame[data-layout]:not([data-layout="burst"]) .ly-axis,
.frame[data-layout]:not([data-layout="burst"]) .ly-bar-row,
.frame[data-layout]:not([data-layout="burst"]) .ly-p-fine,
.frame[data-layout]:not([data-layout="burst"]) .ly-r-fine,
.frame[data-layout]:not([data-layout="burst"]) .ly-cv-fine,
.frame[data-layout]:not([data-layout="burst"]) .ly-sp-fine,
.frame[data-layout]:not([data-layout="burst"]) .ly-ex-kicker,
.frame[data-layout]:not([data-layout="burst"]) .ly-r-meta
{font-size:var(--fs-meta)!important;line-height:1.45}
`;

return {meta:META,by:BY,css:CSS,render:render};
})();
