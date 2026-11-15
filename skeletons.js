/* ═══════════════════════════════════════════════════════════════════════
   帧语 NEXT · 九套画面骨架（A–I）
   设计原则：一个「画面主体」贯穿全片，帧间是同一物体被逐步使用
   （试卷批完 / 板写满 / 小票打印完 / 对话滚下去），不是每帧一张独立版面。
   与 12 套配色、12 套短视频编排完全独立；只替换大众科普版那副 PPT 专栏。
   预览与导出共用 FRAME_CSS，导出 clone 直接序列化，天然同源。
   ═══════════════════════════════════════════════════════════════════════ */
window.FV_SKELETONS=(function(){
'use strict';

var META=[
  {k:'paper',    name:'A 手写批注流', sub:'米白纸 + 群聊截图', fit:'泛大众 · 主推'},
  {k:'evidence', name:'B 证据截图流', sub:'搜索框 + 网页截图', fit:'热搜核实'},
  {k:'anchor',   name:'C 口播大字流', sub:'巨型视觉锚 + 花字', fit:'节奏最快'},
  {k:'cork',     name:'D 便签墙',     sub:'软木板 + 便签连线', fit:'清单体'},
  {k:'exam',     name:'E 试卷批改',   sub:'一张试卷被红笔批完', fit:'判断题'},
  {k:'chat',     name:'F 聊天消息流', sub:'群聊窗口 + 气泡',   fit:'家族群谣言'},
  {k:'receipt',  name:'G 核实小票',   sub:'热敏纸逐行打印',   fit:'逐条核对'},
  {k:'clip',     name:'H 剪报拼贴',   sub:'牛皮纸 + 剪报',     fit:'旧闻核实'},
  {k:'board',    name:'I 白板手写',   sub:'白板 + 三色马克笔', fit:'机制拆解'}
];
var BY={};META.forEach(function(m){BY[m.k]=m;});

function C(){return window.__FV_CTX__||{};}
function E(s){return (C().esc||function(x){return String(x==null?'':x);})(s);}
function W(t){return (C().segHTML||E)(t);}
function SS(){return C().S||{};}

/* 帧 → 阶段。九套都按同一条「物体被逐步使用」的时间线推进。 */
function stageOf(f){
  var s=String(f.shot||f.beat||'hook');
  if(s==='cover'||s==='hook')return 0;
  if(s==='flip'||s==='twist')return 1;
  var m=/^l(\d+)$/.exec(s);
  if(m)return 2+Math.min(2,+m[1]-1);
  if(s==='end'||s==='verdict')return 5;
  return 0;
}
function cut(s,n){s=String(s==null?'':s).trim();return s.length>n?s.slice(0,n):s;}
/* 从全片帧表里抽出「这句话在说什么」，让每一帧都能看到此前累积的证据物。
   这是逐帧推进的关键：不是每帧重新排一张卡，而是同一物体上多了几笔。 */
function collect(f){
  var S=SS(),F=S.frames||[],q='',wrong='',flipT='',layers=[],endT='',ans='',src='',dis='',opts='',take='';
  F.forEach(function(x){
    var s=String(x.shot||x.beat||'');
    if(s==='hook'){q=String(x.title||'').trim();opts=String(x.opts||'').trim();}
    if(s==='flip'){wrong=String(x.wrong||'').trim();flipT=String(x.title||'').trim();}
    if(/^l\d+$/.test(s))layers.push(String(x.title||'').trim());
    if(s==='end'){endT=String(x.title||'').trim();ans=String(x.ans||'').trim();
      src=String(x.src||'').trim();take=String(x.takeaway||'').trim();}
  });
  if(!q)q=String(stageOf(f)===0?f.title:'').trim();
  if(SS().q&&!q)q=String(SS().q).trim();
  if(!wrong)wrong=cut(SS().hook||'',24);
  if(!flipT)flipT=cut(layers[0]||'',24);
  if(!endT)endT=String(f.title||'').trim();
  if(!ans)ans=String(SS().ans||'').trim();
  if(!src)src=String(SS().src||'').trim();
  dis=String(f.disclaim||SS().disclaimer||'').trim();
  return {stage:stageOf(f),shot:String(f.shot||f.beat||'hook'),q:q,wrong:wrong,flipT:flipT,
    layers:layers.slice(0,3),endT:endT,ans:ans,src:src,dis:dis,opts:opts,take:take,
    vo:String(f.vo||'').trim(),title:String(f.title||'').trim(),
    hammer:String(f.hammer||'').trim(),note:String(f.note||f.subtitle||'').trim(),
    flower:String(f.flower||'').trim(),bubble:String(f.bubble||'').trim(),
    no:String(f.no||'01').trim(),idx:+f.idx||0,n:+f.n||3};
}
function optArr(o){
  return String(o||'').split('|').map(function(x){return x.trim();}).filter(Boolean);
}
/* 统一的根 + 底部字幕条（复用 .subbar/.subwrap，打字机 / 位置 / 导出全部照旧） */
function wrap(f,key,inner,extra){
  var d=collect(f),S=SS();
  var wm=String(S.wmText||'').trim()?'<div class="wm">'+E(S.wmText)+'</div>':'';
  var sub=f.vo?'<div class="subbar sk-subbar"><span class="subwrap">'+E(f.vo)+'</span></div>':'';
  return '<div class="f-bg"></div>'+
    '<div class="f-inner sk-inner" data-skel="'+E(key)+'" data-stage="'+d.stage+'"'+
    ' style="--sub-fit:'+(S.subFit||1)+'">'+
    '<div class="sk-root '+(extra||'')+'">'+inner+'</div>'+wm+sub+'</div>';
}
/* 红圈 / 荧光笔 / 胶带 / 图钉 / 印章：九套共用同一套手绘批注语言 */
function ring(cx,cy,w,h,cls){
  return '<i class="sk-ring '+(cls||'')+'" style="left:'+cx+'%;top:'+cy+'%;width:'+w+'%;height:'+h+'%"></i>';
}
function hl(cx,cy,w,h){
  return '<i class="sk-hl" style="left:'+cx+'%;top:'+cy+'%;width:'+w+'%;height:'+h+'%"></i>';
}
function tape(x,y,rot){
  return '<i class="sk-tape" style="left:'+x+'%;top:'+y+'%;transform:rotate('+rot+'deg)"></i>';
}
function pin(x,y){
  return '<i class="sk-pin" style="left:'+x+'%;top:'+y+'%"></i>';
}
function stamp(x,y,txt,rot){
  return '<div class="sk-stamp" style="left:'+x+'%;top:'+y+'%;transform:rotate('+(rot||-12)+'deg)">'+E(txt)+'</div>';
}
function srcLine(t,cls){
  return t?'<div class="sk-src '+(cls||'')+'">'+E(t)+'</div>':'';
}

/* ─────────── A · 手写批注流：一张米白纸 + 群聊截图，逐帧贴便签圈红笔 ─────────── */
function paper(f){
  var d=collect(f),s=d.stage,L=d.layers,body='';
  var shot='<div class="sk-a-shot">'+
      '<div class="sk-a-av">姨</div><div class="sk-a-bub"><h2 class="sk-title sk-a-q">'+W(cut(d.q,26))+'</h2></div></div>'+
    '<div class="sk-a-who">家族群 · 转来的说法</div>';
  if(s>=1)body+='<div class="sk-a-say sk-marked">常听到这么一句<br><b>「'+W(cut(d.wrong||d.q,22))+'」</b>'+
      (s===1?'<br>查下来是 '+W(cut(d.flipT,18)):'')+'</div>';
  for(var i=0;i<L.length && i<3;i++){
    if(s>=2+i)body+='<div class="sk-a-note c'+i+'"><b>'+E(['','先查这一条','再对一条','最后一条'][i+1]||'')+'</b>'+
      '<span>'+W(cut(L[i],26))+'</span></div>';
  }
  if(s>=5)body+='<div class="sk-a-verdict">说到底，'+W(cut(d.endT,22))+'</div>';
  var marks='';
  return wrap(f,'paper',
    '<div class="sk-a-top"><span>一张纸，慢慢对</span><i></i></div>'+
    '<div class="sk-a-obj">'+shot+'<div class="sk-a-body">'+body+'</div>'+
      srcLine(d.src?('资料出自 '+d.src)+'。'+(s>=5?' 仅作知识分享。':''):'')+'</div>'+marks,
    'sk-a');
}

/* ─────────── B · 证据截图流：搜索框 + 搜索结果卡，逐帧加红框与印章 ─────────── */
function evidence(f){
  var d=collect(f),s=d.stage,L=d.layers,rows='';
  rows+='<div class="sk-b-row first sk-marked"><i class="sk-b-ico">?</i><div><b class="sk-title sk-b-q">'+W(cut(d.q,22))+
        '</b><small>这条说法，网上流传很广</small></div></div>';
  if(s>=1)rows+='<div class="sk-b-row wrong"><i class="sk-b-ico">×</i><div><b>'+
        W(cut(d.flipT,26))+'</b><small>查下来是</small></div></div>';
  for(var i=0;i<L.length&&i<3;i++){
    if(s>=2+i)rows+='<div class="sk-b-row ok"><i class="sk-b-ico">'+String(i+1)+'</i>'+
      '<div><b>'+W(cut(L[i],26))+'</b><small>'+E(['','第一条','第二条','第三条'][i+1]||'')+'</small></div></div>';
  }
  if(s>=5)rows+='<div class="sk-b-row ok"><i class="sk-b-ico">✓</i>'+
      '<div><b>'+W(cut(d.title,20))+'</b><small>说法不成立 · 一句带走</small></div></div>';
  var box='';
  var seal='';
  return wrap(f,'evidence',
    '<div class="sk-b-search"><i></i><span>'+E(cut(d.q,26))+'</span><b>核实</b></div>'+
    '<div class="sk-b-results">'+rows+'</div>'+box+seal+
    '<div class="sk-b-foot">'+E(d.src||'公开资料')+' · 逐条对照，不作结论先行</div>',
    'sk-b');
}

/* ─────────── C · 口播大字流：巨型视觉锚 + 一句花字，无页眉页脚 ─────────── */
function anchor(f){
  var d=collect(f),s=d.stage,L=d.layers;
  var anchor=s===0?'?':s===1?'≠':s===5?'→':String(Math.min(3,s-1)).padStart(2,'0');
  var kicker=s===0?'先别急着信':s===1?'查下来不是这样':s===5?'一句带走':'第 '+(s-1)+' 层';
  var big=s===0?d.q:s===1?d.flipT:s===5?d.endT:(L[Math.min(2,s-2)]||d.title);
  var flower=s===0?'看依据':s===1?'实际上':s===5?'记住':'关键点';
  return wrap(f,'anchor',
    '<div class="sk-c-anchor">'+E(anchor)+'</div>'+
    '<div class="sk-c-main"><div class="sk-c-kicker">'+E(kicker)+'</div>'+
      '<h2 class="sk-title sk-c-title">'+W(cut(big,28))+'</h2>'+
      '<div class="sk-c-flower">'+E(flower)+'</div>'+
      (d.src&&s>=2?'<div class="sk-c-src">资料出自 '+E(d.src)+'</div>':'')+
    '</div>'+
    (s>=1&&s<5?'<div class="sk-c-bubble">'+E(['','先记下这一条','再对一条','最后一条'][s-1]||'')+'</div>':''),
    'sk-c');
}

/* ─────────── D · 便签墙：一块软木板，逐帧往上钉便签、连毛线 ─────────── */
function cork(f){
  var d=collect(f),s=d.stage,L=d.layers,notes='';
  notes+='<div class="sk-d-note y" data-n="0"><b class="sk-title sk-d-q">'+W(cut(d.q,20))+'</b><small>先记下这一条</small></div>';
  if(s>=1)notes+='<div class="sk-d-note w" data-n="1"><b>'+W(cut(d.flipT,20))+'</b><small>查下来是</small></div>';
  for(var i=0;i<L.length&&i<3;i++){
    if(s>=2+i)notes+='<div class="sk-d-note '+['g','p','b'][i]+'" data-n="'+(i+2)+'"><b>'+
      W(cut(L[i],20))+'</b></div>';
  }
  if(s>=5)notes+='<div class="sk-d-note v sk-marked" data-n="5"><b>'+W(cut(d.endT,20))+'</b></div>';
  var lines=s>=2?'<svg class="sk-d-lines" viewBox="0 0 100 100" preserveAspectRatio="none">'+
    '<path d="M46 30 C40 42 26 46 24 56" /><path d="M52 30 C62 42 76 46 78 58" /></svg>':'';
  return wrap(f,'cork',
    '<div class="sk-d-board">'+notes+pin('45','8')+pin('47','40')+pin('70','66')+
      lines+
      tape('36','2',-6)+tape('66','60',5)+'</div>'+
    srcLine(d.src?('资料出自 '+d.src)+'。':''),
    'sk-d');
}

/* ─────────── E · 试卷批改：同一张卷，逐帧被红笔划线、旁批、圈答案 ─────────── */
function exam(f){
  var d=collect(f),s=d.stage,L=d.layers,os=optArr(d.opts),opts='';
  if(os.length)opts='<div class="sk-e-opts">'+os.map(function(o,i){
    return '<div><i></i><b>'+String.fromCharCode(65+i)+'</b><span>'+W(cut(o,14))+'</span></div>';}).join('')+'</div>';
  var marks='';
  if(s===1)marks+='<div class="sk-e-comment">'+W(cut(d.flipT,20))+'</div>';
  if(s>=1)marks+='<div class="sk-e-strike"></div><div class="sk-e-margin">查无依据</div>';
  for(var i=0;i<L.length&&i<3;i++){
    if(s>=2+i)marks+='<div class="sk-e-comment" data-c="'+i+'">'+W(cut(L[i],24))+'</div>';
  }
  if(s>=5)marks+='<div class="sk-e-comment">'+W(cut(d.title,20))+'</div>'+
    '<div class="sk-e-cross">×</div><div class="sk-e-seal">已核对</div>';
  return wrap(f,'exam',
    '<div class="sk-e-sheet">'+
      '<div class="sk-e-head">生活常识 · 判断题</div>'+
      '<div class="sk-e-q"><b>1.</b><h2 class="sk-title sk-e-title">'+W(cut(d.q,26))+'</h2></div>'+
      opts+marks+
      '<div class="sk-e-foot">'+E(d.src||'公开资料')+' · 仅作知识分享，不构成医疗建议</div>'+
    '</div>',
    'sk-e');
}

/* ─────────── F · 聊天消息流：一个群聊窗口，同一段对话逐帧往下滚 ─────────── */
function chat(f){
  var d=collect(f),s=d.stage,L=d.layers,msgs='';
  msgs+='<div class="sk-f-av">姨</div><div class="sk-f-bub them lead"><h2 class="sk-title sk-f-q">'+W(cut(d.q,22))+'</h2></div>'+
        '<div class="sk-f-who">— 三姨 · 昨天 09:14</div>';
  if(s>=1)msgs+='<div class="sk-f-bub them small">我转了啊</div>';
  if(s===1)msgs+='<div class="sk-f-bub me">'+W(cut(d.flipT,20))+'</div>';
  for(var i=0;i<L.length&&i<3;i++){
    if(s>=2+i)msgs+='<div class="sk-f-bub me'+(s===2+i?' sk-marked':'')+'">'+W(cut(L[i],24))+'</div>';
  }
  if(s>=5)msgs+='<div class="sk-f-bub me final">说到底，'+W(cut(d.endT,20))+'</div>'+
                '<div class="sk-f-bub them small">哦…那不转了</div>';
  return wrap(f,'chat',
    '<div class="sk-f-win"><div class="sk-f-bar"><span></span>家族群讨论（3）</div>'+
      '<div class="sk-f-time">昨天 09:14</div>'+
      '<div class="sk-f-stream">'+msgs+'</div>'+
      
    '</div>'+srcLine(d.src?('资料出自 '+d.src)+'。':''),
    'sk-f');
}

/* ─────────── G · 核实小票：一张热敏纸，逐帧打印核对行、最后盖章 ─────────── */
function receipt(f){
  var d=collect(f),s=d.stage,L=d.layers,rows='';
  rows='<div class="sk-g-line"><span>说法</span><b>'+W(cut(d.q,24))+'</b></div>'+
       '<div class="sk-g-line dim"><span>受理</span><b>1 项 · 待核对</b></div>';
  if(s>=1)rows+='<div class="sk-g-line"><span>核对 1</span><b>'+W(cut(d.flipT,22))+'</b></div>';
  for(var i=0;i<L.length&&i<3;i++){
    if(s>=2+i)rows+='<div class="sk-g-line"><span>核对 '+(i+2)+'</span><b>'+W(cut(L[i],22))+'</b></div>';
  }
  if(s>=5)rows+='<div class="sk-g-line"><span>结论</span><b>'+W(cut(d.title,18))+'</b></div>'+
    '<div class="sk-g-line total"><span>小计</span><b>'+E(d.ans||'说法不成立')+'</b></div>';
  return wrap(f,'receipt',
    '<div class="sk-g-ticket">'+
      '<div class="sk-g-brand">常识核实 · 小票</div>'+
      '<div class="sk-g-id">NO. '+E(d.no)+' &nbsp; 生活常识柜</div>'+
      '<div class="sk-title sk-g-q">'+E(s>=5?(d.ans||'说法不成立'):'核对中')+'</div>'+
      '<div class="sk-g-dash"></div><div class="sk-g-rows">'+rows+'</div>'+
      '<div class="sk-g-dash"></div>'+
      '<div class="sk-g-foot">'+E(d.src||'公开资料')+'<br>'+
        '仅作知识分享，不构成医疗建议<br>'+(s>=5?'谢谢惠顾':'· 打印中 ·')+'</div>'+
    '</div>'+(s>=5?stamp('32','84','说法不成立',-9):''),
    'sk-g');
}

/* ─────────── H · 剪报拼贴：牛皮纸 + 剪下的报纸块，逐帧贴、圈、盖章 ─────────── */
function clip(f){
  var d=collect(f),s=d.stage,L=d.layers,blocks='';
  blocks+='<div class="sk-h-clip main sk-marked"><h2 class="sk-title sk-h-title">'+W(cut(d.q,24))+'</h2>'+
    '<div class="sk-h-rule"></div><div class="sk-h-lines"><i></i><i></i><i></i></div>'+
    '<div class="sk-h-img"></div></div>';
  if(s>=1)blocks+='<div class="sk-h-clip side"><b>查到的这段</b><p>'+W(cut(d.flipT,22))+'</p>'+
    '<div class="sk-h-lines"><i></i><i></i></div></div>';
  for(var i=0;i<L.length&&i<3;i++){
    if(s>=2+i)blocks+='<div class="sk-h-clip slip"><b>'+E(['','第一条','第二条','第三条'][i+1]||'')+
      '</b><p>'+W(cut(L[i],22))+'</p></div>';
  }
  if(s>=5)blocks+='<div class="sk-h-clip final"><b>说到底，</b>'+W(cut(d.endT,20))+
    '<span class="sk-h-seal">已核实</span></div>';
  return wrap(f,'clip',
    '<div class="sk-h-desk">'+blocks+
      tape('6','4',-7)+tape('70','5',6)+tape('4','68',5)+
      
      
      '<div class="sk-h-fine">'+E(d.src||'公开资料')+' · 剪下来存着</div>'+
    '</div>',
    'sk-h');
}

/* ─────────── I · 白板手写：同一块板，蓝笔写、红笔划、绿笔补，逐帧写满 ─────────── */
function board(f){
  var d=collect(f),s=d.stage,L=d.layers,lines='';
  lines+='<div class="sk-title sk-i-q sk-i-line blue q">'+W(cut(d.q,24))+'</div>';
  if(s>=1)lines+='<div class="sk-i-line blue strike">'+W(cut(d.wrong||d.flipT,22))+'</div>'+
                 '<div class="sk-i-line red">'+W(cut(d.flipT,16))+' ✗</div>';
  for(var i=0;i<L.length&&i<3;i++){
    if(s>=2+i)lines+='<div class="sk-i-line green" data-l="'+i+'"><b>'+String(i+1)+'</b> '+
      W(cut(L[i],24))+'</div>';
  }
  if(s>=5)lines+='<div class="sk-i-line green big sk-marked">'+W(cut(d.endT,22))+'</div>';
  return wrap(f,'board',
    '<div class="sk-i-board"><div class="sk-i-pad">'+lines+'</div>'+
      
      '<div class="sk-i-smudge"></div>'+
      '<div class="sk-i-tray"><i></i><i></i><i></i></div>'+
    '</div>'+srcLine(d.src?('资料出自 '+d.src)+'。 仅作知识分享。':''),
    'sk-i');
}

var RENDER={paper:paper,evidence:evidence,anchor:anchor,cork:cork,exam:exam,
            chat:chat,receipt:receipt,clip:clip,board:board};
function render(key,f,ctx){
  window.__FV_CTX__=ctx||window.__FV_CTX__||{};
  if(!RENDER[key])return null;
  try{return RENDER[key](f);}catch(e){return null;}
}

/* ═══════════════════════════════════════════════════════════════════════
   CSS：全部以 .frame[data-skeleton] 作用域；追加到 FRAME_CSS 末尾，
   导出 clone 用同一份 CSS，预览与成片同源。
   所有尺寸乘 var(--scale,1)（用户字阶）与 var(--sk-k,1)（横版紧凑系数），
   字号只乘 --scale —— 横竖切换字号恒定，不回到「时大时小」。
   ═══════════════════════════════════════════════════════════════════════ */
var CSS=`
.frame[data-skeleton]{--sk-k:1;--sk-ink:#c8392c;--sk-line:rgba(40,55,52,.16)}
.frame[data-skeleton][data-ratio="16:9"]{--sk-k:.60}
.frame[data-skeleton] .f-bg{display:none}
.frame[data-skeleton] .f-inner.sk-inner{position:absolute;inset:0;display:block;z-index:1}
.frame[data-skeleton] .sk-root{
  position:absolute;inset:0;box-sizing:border-box;display:flex;flex-direction:column;
  padding:calc(70px * var(--scale,1) * var(--sk-k,1)) calc(62px * var(--scale,1))
           calc(152px * var(--scale,1) * var(--sk-k,1));
  color:#26322f;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;
  overflow:hidden;
}
.frame[data-skeleton] .sk-title{
  font-size:calc(var(--fs-title) * var(--scale,1));font-weight:900;line-height:1.3;
  margin:0;word-break:normal;overflow-wrap:anywhere;text-wrap:pretty;
}
.frame[data-skeleton] .sk-src{
  flex:none;font-size:calc(25px * var(--scale,1));line-height:1.5;opacity:.68;margin-top:calc(18px * var(--scale,1) * var(--sk-k,1));
}
.frame[data-skeleton] .sk-inner .subbar.sk-subbar{
  position:absolute;left:5%;right:5%;bottom:4.2%;z-index:40;
  display:flex;align-items:center;justify-content:center;text-align:center;
  font-size:calc(var(--fs-body) * var(--scale,1) * var(--sub-scale,1) * var(--sub-fit,1) * .82);
  font-weight:800;line-height:1.4;color:#fff;background:rgba(8,14,18,.86);
  border:0;border-radius:calc(12px * var(--scale,1));
  padding:calc(14px * var(--scale,1) * var(--sk-k,1)) calc(24px * var(--scale,1));
  box-shadow:0 3px 14px rgba(0,0,0,.28);
}
.frame[data-skeleton] .sk-inner .sk-subbar::before{display:none}
.frame[data-skeleton] .sk-inner .sk-subbar .subwrap{max-width:100%}
.frame[data-skeleton] .wm{z-index:45}
/* 通用批注件 */
.frame[data-skeleton] .sk-ring{position:absolute;border:calc(5px * var(--scale,1)) solid var(--sk-ink);
  border-radius:50% 56% 45% 55% / 54% 45% 58% 42%;z-index:24;pointer-events:none;
  box-shadow:1px 2px 0 rgba(200,57,44,.18)}
.frame[data-skeleton] .sk-hl{position:absolute;background:rgba(247,214,74,.72);border-radius:3px;z-index:10;pointer-events:none;mix-blend-mode:multiply}
.frame[data-skeleton] .sk-tape{position:absolute;width:calc(100px * var(--scale,1) * var(--sk-k,1));
  height:calc(28px * var(--scale,1) * var(--sk-k,1));background:rgba(226,206,150,.72);
  box-shadow:0 1px 3px rgba(0,0,0,.12);z-index:30;pointer-events:none}
.frame[data-skeleton] .sk-tape::after{content:"";position:absolute;inset:0;
  background:repeating-linear-gradient(90deg,transparent 0 5px,rgba(255,255,255,.28) 5px 6px)}
.frame[data-skeleton] .sk-pin{position:absolute;width:calc(17px * var(--scale,1));height:calc(17px * var(--scale,1));
  border-radius:50%;z-index:31;background:radial-gradient(circle at 35% 30%,#ff8e7a,#c62f26 62%,#8e1d16);
  box-shadow:1px 3px 5px rgba(0,0,0,.35);pointer-events:none}
.frame[data-skeleton] .sk-stamp{position:absolute;z-index:34;white-space:nowrap;font-weight:900;color:#c62f26;
  border:calc(5px * var(--scale,1)) solid #c62f26;border-radius:5px;
  padding:calc(12px * var(--scale,1) * var(--sk-k,1)) calc(18px * var(--scale,1));
  font-size:calc(var(--fs-cap) * var(--scale,1));letter-spacing:.08em;
  background:rgba(255,255,255,.16);box-shadow:inset 0 0 0 calc(2px * var(--scale,1)) rgba(198,47,38,.35);
  pointer-events:none;white-space:nowrap}

/* ── A 手写批注流 ── */
.frame[data-skeleton="paper"]{background:#f4efe2}
.frame[data-skeleton="paper"] .sk-root::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;
  background:radial-gradient(rgba(120,105,80,.055) 1px,transparent 1px) 0 0/12px 12px,
             linear-gradient(180deg,rgba(255,255,255,.42),transparent 40%)}
.frame[data-skeleton="paper"] .sk-a-top{position:relative;z-index:2;flex:none;display:flex;align-items:center;gap:calc(20px * var(--scale,1));
  font-size:calc(25px * var(--scale,1));color:#6b6455;letter-spacing:.08em;margin-bottom:calc(22px * var(--scale,1) * var(--sk-k,1))}
.frame[data-skeleton="paper"] .sk-a-top i{flex:1;height:1px;background:rgba(110,100,80,.24)}
.frame[data-skeleton="paper"] .sk-a-obj{position:relative;z-index:2;flex:1;min-height:0;display:flex;flex-direction:column;
  gap:calc(20px * var(--scale,1) * var(--sk-k,1))}
.frame[data-skeleton="paper"] .sk-a-shot{display:flex;gap:calc(16px * var(--scale,1));align-items:flex-start;flex:none}
.frame[data-skeleton="paper"] .sk-a-av{flex:none;width:calc(56px * var(--scale,1));height:calc(56px * var(--scale,1));border-radius:8px;
  background:#d8b48c;color:#fff;font-weight:900;font-size:calc(26px * var(--scale,1));display:flex;align-items:center;justify-content:center}
.frame[data-skeleton="paper"] .sk-a-bub{flex:1;min-width:0;background:#fff;border:1px solid #dde3e0;border-radius:12px;
  padding:calc(20px * var(--scale,1) * var(--sk-k,1)) calc(22px * var(--scale,1));
  font-size:calc(var(--fs-body) * var(--scale,1));font-weight:850;line-height:1.45;
  box-shadow:1px 4px 12px rgba(60,50,35,.10)}
.frame[data-skeleton="paper"] .sk-a-who{flex:none;font-size:calc(24px * var(--scale,1));color:#8b8579;margin-left:calc(72px * var(--scale,1))}
.frame[data-skeleton="paper"] .sk-a-body{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;
  gap:calc(16px * var(--scale,1) * var(--sk-k,1))}
.frame[data-skeleton="paper"] .sk-a-say{font-size:calc(var(--fs-body) * var(--scale,1));line-height:1.5;color:#4d5651}
.frame[data-skeleton="paper"] .sk-a-say b{color:#9c3b2b;font-weight:900}
.frame[data-skeleton="paper"] .sk-a-note{background:#fff3a8;padding:calc(14px * var(--scale,1) * var(--sk-k,1)) calc(20px * var(--scale,1));
  box-shadow:2px 7px 15px rgba(55,35,12,.22);transform:rotate(-1.2deg);display:flex;flex-direction:column;gap:4px}
.frame[data-skeleton="paper"] .sk-a-note.c1{background:#a9e5d8;transform:rotate(1.6deg)}
.frame[data-skeleton="paper"] .sk-a-note.c2{background:#dfe9f7;transform:rotate(-1deg)}
.frame[data-skeleton="paper"] .sk-a-note b{font-size:calc(24px * var(--scale,1));color:#6b6455;font-weight:800}
.frame[data-skeleton="paper"] .sk-a-note span{font-size:calc(var(--fs-body) * var(--scale,1));font-weight:850;line-height:1.4}
.frame[data-skeleton="paper"] .sk-a-verdict{background:#d8f0e4;padding:calc(18px * var(--scale,1) * var(--sk-k,1)) calc(22px * var(--scale,1));
  font-size:calc(var(--fs-body) * var(--scale,1));font-weight:900;color:#1a5f48;box-shadow:2px 7px 15px rgba(30,80,60,.18)}

/* ── B 证据截图流 ── */
.frame[data-skeleton="evidence"]{background:#e9eef1}
.frame[data-skeleton="evidence"] .sk-root{color:#22303a}
.frame[data-skeleton="evidence"] .sk-root::before{content:"";position:absolute;inset:0;z-index:0;
  background:linear-gradient(180deg,rgba(255,255,255,.65),transparent 30%),radial-gradient(circle at 82% 85%,rgba(90,140,170,.14),transparent 55%)}
.frame[data-skeleton="evidence"] .sk-b-search{position:relative;z-index:2;flex:none;display:flex;align-items:center;gap:calc(18px * var(--scale,1));
  background:#fff;border:calc(3px * var(--scale,1)) solid #2f7d8c;border-radius:calc(16px * var(--scale,1));
  padding:calc(16px * var(--scale,1) * var(--sk-k,1)) calc(22px * var(--scale,1));
  box-shadow:0 5px 16px rgba(40,80,95,.14);margin-bottom:calc(24px * var(--scale,1) * var(--sk-k,1))}
.frame[data-skeleton="evidence"] .sk-b-search i{flex:none;width:calc(30px * var(--scale,1));height:calc(30px * var(--scale,1));border-radius:50%;
  border:calc(4px * var(--scale,1)) solid #2f7d8c;position:relative}
.frame[data-skeleton="evidence"] .sk-b-search i::after{content:"";position:absolute;right:-9px;bottom:-7px;width:11px;height:4px;background:#2f7d8c;transform:rotate(45deg)}
.frame[data-skeleton="evidence"] .sk-b-search span{flex:1;min-width:0;font-size:calc(var(--fs-cap) * var(--scale,1));font-weight:750;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.frame[data-skeleton="evidence"] .sk-b-search b{flex:none;background:#2f7d8c;color:#fff;border-radius:8px;
  padding:calc(8px * var(--scale,1)) calc(18px * var(--scale,1));font-size:calc(25px * var(--scale,1))}
.frame[data-skeleton="evidence"] .sk-b-results{position:relative;z-index:2;flex:1;min-height:0;display:flex;flex-direction:column;
  gap:calc(16px * var(--scale,1) * var(--sk-k,1));justify-content:center}
.frame[data-skeleton="evidence"] .sk-b-row{display:flex;gap:calc(18px * var(--scale,1));align-items:center;
  background:#fff;border-radius:12px;padding:calc(18px * var(--scale,1) * var(--sk-k,1)) calc(20px * var(--scale,1));
  box-shadow:1px 4px 12px rgba(40,70,85,.11);border-left:calc(6px * var(--scale,1)) solid #b9c9ce}
.frame[data-skeleton="evidence"] .sk-b-row.wrong{border-left-color:#c8392c}
.frame[data-skeleton="evidence"] .sk-b-row.ok{border-left-color:#2f7d8c}
.frame[data-skeleton="evidence"] .sk-b-ico{flex:none;width:calc(46px * var(--scale,1));height:calc(46px * var(--scale,1));border-radius:9px;
  background:#eef3f5;color:#2f7d8c;font-weight:900;font-size:calc(28px * var(--scale,1));display:flex;align-items:center;justify-content:center}
.frame[data-skeleton="evidence"] .sk-b-row.wrong .sk-b-ico{background:#fbe9e6;color:#c8392c}
.frame[data-skeleton="evidence"] .sk-b-row>div{min-width:0;display:flex;flex-direction:column;gap:2px}
.frame[data-skeleton="evidence"] .sk-b-row b{font-size:calc(var(--fs-body) * var(--scale,1));font-weight:850;line-height:1.4}
.frame[data-skeleton="evidence"] .sk-b-row small{font-size:calc(25px * var(--scale,1));color:#7b858b}
.frame[data-skeleton="evidence"] .sk-b-foot{position:relative;z-index:2;flex:none;text-align:center;
  font-size:calc(24px * var(--scale,1));color:#7b858b;margin-top:calc(20px * var(--scale,1) * var(--sk-k,1))}
.frame[data-skeleton="evidence"] .sk-b-ring{border-color:#c8392c}

/* ── C 口播大字流 ── */
.frame[data-skeleton="anchor"]{background:linear-gradient(160deg,#123344,#0b1c28 60%,#132c3a)}
.frame[data-skeleton="anchor"] .sk-root{color:#f2f7f8;justify-content:center}
.frame[data-skeleton="anchor"] .sk-root::before{content:"";position:absolute;inset:0;z-index:0;
  background:radial-gradient(circle at 22% 18%,rgba(79,206,190,.22),transparent 48%),
             radial-gradient(circle at 82% 78%,rgba(233,185,106,.16),transparent 52%)}
.frame[data-skeleton="anchor"] .sk-c-anchor{position:absolute;right:2%;top:2%;z-index:1;
  font-size:calc(var(--fs-hero) * var(--scale,1) * var(--sk-k,1));font-weight:900;line-height:1;
  color:rgba(79,206,190,.16);letter-spacing:-.06em;pointer-events:none}
.frame[data-skeleton="anchor"] .sk-c-main{position:relative;z-index:2;flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;
  gap:calc(22px * var(--scale,1) * var(--sk-k,1))}
.frame[data-skeleton="anchor"] .sk-c-kicker{font-size:calc(var(--fs-cap) * var(--scale,1));color:#7ee8d3;font-weight:800;letter-spacing:.1em}
.frame[data-skeleton="anchor"] .sk-c-title{color:#fff;text-shadow:0 5px 22px rgba(0,0,0,.4)}
.frame[data-skeleton="anchor"] .sk-c-flower{align-self:flex-start;background:#f5d36a;color:#17232a;
  font-size:calc(var(--fs-body) * var(--scale,1));font-weight:900;letter-spacing:.06em;
  padding:calc(10px * var(--scale,1) * var(--sk-k,1)) calc(26px * var(--scale,1));
  border-radius:calc(10px * var(--scale,1));transform:rotate(-3deg);
  box-shadow:calc(7px * var(--scale,1)) calc(8px * var(--scale,1)) 0 rgba(0,0,0,.35)}
.frame[data-skeleton="anchor"] .sk-c-src{font-size:calc(25px * var(--scale,1));color:rgba(242,247,248,.72)}
.frame[data-skeleton="anchor"] .sk-c-bubble{position:absolute;z-index:3;right:5%;top:12%;
  background:#fff;color:#1d2c31;border-radius:14px;padding:calc(12px * var(--scale,1)) calc(20px * var(--scale,1));
  font-size:calc(var(--fs-cap) * var(--scale,1));font-weight:800;transform:rotate(4deg);
  box-shadow:2px 6px 16px rgba(0,0,0,.3);max-width:60%}

/* ── D 便签墙 ── */
.frame[data-skeleton="cork"]{background:#c9a377}
.frame[data-skeleton="cork"] .sk-root::before{content:"";position:absolute;inset:0;z-index:0;
  background:radial-gradient(rgba(110,70,35,.30) 1px,transparent 1px) 0 0/10px 10px,
             radial-gradient(rgba(255,235,195,.26) 1px,transparent 1px) 5px 6px/14px 14px;
  box-shadow:inset 0 0 0 calc(14px * var(--scale,1)) #8a5c39,inset 0 0 0 calc(18px * var(--scale,1)) #a9764a,
             inset 0 0 90px rgba(70,40,15,.32)}
.frame[data-skeleton="cork"] .sk-d-board{position:relative;z-index:2;flex:1;min-height:0;
  display:flex;flex-wrap:wrap;align-content:center;justify-content:center;
  gap:calc(18px * var(--scale,1) * var(--sk-k,1)) calc(22px * var(--scale,1))}
.frame[data-skeleton="cork"] .sk-d-note{width:44%;min-height:calc(120px * var(--scale,1) * var(--sk-k,1));
  background:#fff3a8;box-shadow:2px 8px 17px rgba(55,35,12,.34);padding:calc(18px * var(--scale,1) * var(--sk-k,1)) calc(18px * var(--scale,1));
  display:flex;flex-direction:column;gap:8px;transform:rotate(-1.6deg)}
.frame[data-skeleton="cork"] .sk-d-note[data-n="1"]{transform:rotate(2deg);background:#fff}
.frame[data-skeleton="cork"] .sk-d-note[data-n="2"]{transform:rotate(1.4deg);background:#a9e5d8}
.frame[data-skeleton="cork"] .sk-d-note[data-n="3"]{transform:rotate(-2.2deg);background:#ffd0c4}
.frame[data-skeleton="cork"] .sk-d-note[data-n="4"]{transform:rotate(1deg);background:#dfe9f7}
.frame[data-skeleton="cork"] .sk-d-note[data-n="5"]{width:88%;transform:rotate(-.8deg);background:#d8f0e4}
.frame[data-skeleton="cork"] .sk-d-note b{font-size:calc(var(--fs-body) * var(--scale,1));font-weight:900;line-height:1.4}
.frame[data-skeleton="cork"] .sk-d-note small{font-size:calc(25px * var(--scale,1));color:#5c625f}
.frame[data-skeleton="cork"] .sk-d-lines{position:absolute;inset:0;width:100%;height:100%;z-index:12;pointer-events:none}
.frame[data-skeleton="cork"] .sk-d-lines path{stroke:#c0392b;stroke-width:.6;fill:none;stroke-dasharray:2 1.6}

/* ── E 试卷批改 ── */
.frame[data-skeleton="exam"]{background:#e7e1d3}
.frame[data-skeleton="exam"] .sk-root::before{content:"";position:absolute;inset:0;z-index:0;
  background:repeating-linear-gradient(180deg,transparent 0 calc(76px * var(--sk-k,1)),rgba(120,140,150,.12) calc(76px * var(--sk-k,1)) calc(78px * var(--sk-k,1)))}
.frame[data-skeleton="exam"] .sk-e-sheet{position:relative;z-index:2;flex:1;min-height:0;background:#fbf8ef;
  box-shadow:3px 11px 24px rgba(70,55,35,.28);padding:calc(46px * var(--scale,1) * var(--sk-k,1)) calc(44px * var(--scale,1));
  display:flex;flex-direction:column;gap:calc(20px * var(--scale,1) * var(--sk-k,1));overflow:hidden}
.frame[data-skeleton="exam"] .sk-e-sheet::before{content:"";position:absolute;left:calc(34px * var(--scale,1));top:0;bottom:0;width:2px;background:rgba(198,47,38,.28)}
.frame[data-skeleton="exam"] .sk-e-head{font-size:calc(25px * var(--scale,1));color:#6e7478;letter-spacing:.1em}
.frame[data-skeleton="exam"] .sk-e-q{display:flex;gap:calc(16px * var(--scale,1));align-items:flex-start;flex:none}
.frame[data-skeleton="exam"] .sk-e-q>b{font-size:calc(var(--fs-cap) * var(--scale,1));color:#4b555b;font-weight:900}
.frame[data-skeleton="exam"] .sk-e-title{color:#202a31}
.frame[data-skeleton="exam"] .sk-e-opts{display:flex;flex-direction:column;gap:calc(10px * var(--scale,1) * var(--sk-k,1));flex:none}
.frame[data-skeleton="exam"] .sk-e-opts>div{display:flex;align-items:center;gap:calc(14px * var(--scale,1));
  font-size:calc(var(--fs-cap) * var(--scale,1));color:#2c363c;font-weight:750;
  border-bottom:1px solid rgba(90,105,105,.22);padding-bottom:calc(8px * var(--scale,1) * var(--sk-k,1))}
.frame[data-skeleton="exam"] .sk-e-opts i{width:calc(17px * var(--scale,1));height:calc(17px * var(--scale,1));border:2px solid #4c555b;flex:none}
.frame[data-skeleton="exam"] .sk-e-opts b{color:#4b555b}
.frame[data-skeleton="exam"] .sk-e-strike{position:absolute;left:8%;top:19%;width:76%;height:calc(5px * var(--scale,1));
  background:#d0342a;transform:rotate(-1.4deg);border-radius:3px;z-index:20}
.frame[data-skeleton="exam"] .sk-e-margin{position:absolute;right:6%;bottom:30%;z-index:21;color:#d0342a;
  font-size:calc(var(--fs-cap) * var(--scale,1));font-weight:900;transform:rotate(-6deg)}
.frame[data-skeleton="exam"] .sk-e-comment{position:relative;z-index:12;font-size:calc(var(--fs-body) * var(--scale,1));
  font-weight:750;color:#2c363c;line-height:1.45;padding-left:calc(20px * var(--scale,1));
  border-left:calc(4px * var(--scale,1)) solid rgba(208,52,42,.55)}
.frame[data-skeleton="exam"] .sk-e-comment[data-c="1"]{align-self:flex-end;text-align:right;border-left:0;
  border-right:calc(4px * var(--scale,1)) solid rgba(208,52,42,.55);padding:0 calc(20px * var(--scale,1)) 0 0}
.frame[data-skeleton="exam"] .sk-e-cross{position:absolute;right:6%;top:3%;z-index:22;color:#d0342a;opacity:.8;
  font-size:calc(var(--fs-cap) * var(--scale,1) * 1.5);font-weight:900;line-height:1;transform:rotate(-9deg)}
.frame[data-skeleton="exam"] .sk-e-seal{position:absolute;right:8%;bottom:22%;z-index:22;color:#c62f26;
  border:calc(4px * var(--scale,1)) solid #c62f26;border-radius:5px;padding:calc(8px * var(--scale,1)) calc(14px * var(--scale,1));
  font-size:calc(var(--fs-cap) * var(--scale,1));font-weight:900;transform:rotate(-12deg);letter-spacing:.08em}
.frame[data-skeleton="exam"] .sk-e-foot{position:absolute;left:calc(44px * var(--scale,1));right:calc(44px * var(--scale,1));bottom:calc(22px * var(--scale,1) * var(--sk-k,1));
  font-size:calc(23px * var(--scale,1));color:#8b918c;line-height:1.4}

/* ── F 聊天消息流 ── */
.frame[data-skeleton="chat"]{background:#cfd9dd}
.frame[data-skeleton="chat"] .sk-f-win{position:relative;z-index:2;flex:1;min-height:0;background:#e7ebee;
  border-radius:calc(18px * var(--scale,1));overflow:hidden;box-shadow:3px 11px 26px rgba(40,60,65,.26);
  display:flex;flex-direction:column}
.frame[data-skeleton="chat"] .sk-f-bar{flex:none;height:calc(78px * var(--scale,1) * var(--sk-k,1));background:#f7f9fa;
  border-bottom:1px solid #d7dde1;display:flex;align-items:center;justify-content:center;
  font-size:calc(var(--fs-cap) * var(--scale,1));font-weight:850;color:#39454d;position:relative}
.frame[data-skeleton="chat"] .sk-f-bar span{position:absolute;left:calc(22px * var(--scale,1));font-size:calc(var(--fs-body) * var(--scale,1));color:#6d7980}
.frame[data-skeleton="chat"] .sk-f-time{flex:none;text-align:center;font-size:calc(23px * var(--scale,1));color:#8b959b;
  padding:calc(12px * var(--scale,1) * var(--sk-k,1)) 0}
.frame[data-skeleton="chat"] .sk-f-stream{position:relative;flex:1;min-height:0;padding:0 calc(26px * var(--scale,1));
  display:flex;flex-direction:column;gap:calc(12px * var(--scale,1) * var(--sk-k,1));align-content:flex-start;flex-wrap:wrap}
.frame[data-skeleton="chat"] .sk-f-av{position:absolute;left:calc(22px * var(--scale,1));top:calc(6px * var(--scale,1));
  width:calc(48px * var(--scale,1));height:calc(48px * var(--scale,1));border-radius:7px;background:#d8b48c;color:#fff;
  font-size:calc(24px * var(--scale,1));font-weight:850;display:flex;align-items:center;justify-content:center;z-index:3}
.frame[data-skeleton="chat"] .sk-f-bub{max-width:76%;border-radius:12px;padding:calc(14px * var(--scale,1) * var(--sk-k,1)) calc(18px * var(--scale,1));
  font-size:calc(var(--fs-cap) * var(--scale,1));font-weight:750;line-height:1.5;background:#fff;color:#25313a;
  border:1px solid #dde3e6;margin-left:calc(62px * var(--scale,1));position:relative;z-index:2}
.frame[data-skeleton="chat"] .sk-f-bub.small{padding:calc(9px * var(--scale,1) * var(--sk-k,1)) calc(16px * var(--scale,1))}
.frame[data-skeleton="chat"] .sk-f-bub.me{align-self:flex-end;margin-left:0;background:#c9edb6;color:#1c2b22;border-color:#bfe0ac}
.frame[data-skeleton="chat"] .sk-f-bub.final{background:#b9e5d3;font-weight:900}
.frame[data-skeleton="chat"] .sk-f-who{font-size:calc(23px * var(--scale,1));color:#8b959b;margin-left:calc(62px * var(--scale,1))}
.frame[data-skeleton="chat"] .sk-f-ring{border-color:#c8392c}

/* ── G 核实小票 ── */
.frame[data-skeleton="receipt"]{background:linear-gradient(150deg,#26333a,#131d22)}
.frame[data-skeleton="receipt"] .sk-root{align-items:center;justify-content:center}
.frame[data-skeleton="receipt"] .sk-root::before{content:"";position:absolute;inset:0;z-index:0;
  background:radial-gradient(circle at 18% 82%,rgba(90,170,190,.12),transparent 55%)}
.frame[data-skeleton="receipt"] .sk-g-ticket{position:relative;z-index:2;flex:none;width:82%;
  max-height:90%;overflow:hidden;background:#fffdf7;color:#26302f;
  box-shadow:4px 14px 30px rgba(0,0,0,.46);padding:calc(38px * var(--scale,1) * var(--sk-k,1)) calc(30px * var(--scale,1));
  font-family:"Noto Sans Mono CJK SC","WenQuanYi Micro Hei Mono",monospace;
  display:flex;flex-direction:column;gap:calc(12px * var(--scale,1) * var(--sk-k,1))}
.frame[data-skeleton="receipt"] .sk-g-ticket::before{content:"";position:absolute;left:0;right:0;top:calc(-10px * var(--scale,1));height:calc(11px * var(--scale,1));
  background:radial-gradient(circle at 6px 11px,transparent 6px,#fffdf7 6.5px) 0 0/12px 11px repeat-x}
.frame[data-skeleton="receipt"] .sk-g-ticket::after{content:"";position:absolute;left:0;right:0;bottom:calc(-10px * var(--scale,1));height:calc(11px * var(--scale,1));
  background:radial-gradient(circle at 6px 0,#fffdf7 6.5px,transparent 6px) 0 0/12px 11px repeat-x}
.frame[data-skeleton="receipt"] .sk-g-brand{text-align:center;font-size:calc(var(--fs-cap) * var(--scale,1));font-weight:900;letter-spacing:.14em}
.frame[data-skeleton="receipt"] .sk-g-id{text-align:center;font-size:calc(23px * var(--scale,1));color:#7b807b;letter-spacing:.05em}
.frame[data-skeleton="receipt"] .sk-g-dash{border-top:calc(2px * var(--scale,1)) dashed #a7aaa4;flex:none}
.frame[data-skeleton="receipt"] .sk-g-rows{display:flex;flex-direction:column;gap:calc(14px * var(--scale,1) * var(--sk-k,1));flex:1;min-height:0;justify-content:center}
.frame[data-skeleton="receipt"] .sk-g-line{display:flex;gap:calc(16px * var(--scale,1));align-items:baseline;
  font-size:calc(var(--fs-cap) * var(--scale,1));line-height:1.5}
.frame[data-skeleton="receipt"] .sk-g-line span{flex:none;width:calc(130px * var(--scale,1));color:#7b807b}
.frame[data-skeleton="receipt"] .sk-g-line b{flex:1;min-width:0;font-weight:900}
.frame[data-skeleton="receipt"] .sk-g-line.dim{opacity:.62}
.frame[data-skeleton="receipt"] .sk-g-line.total{border-top:calc(2px * var(--scale,1)) solid #26302f;padding-top:calc(10px * var(--scale,1));color:#c62f26}
.frame[data-skeleton="receipt"] .sk-g-foot{text-align:center;font-size:calc(23px * var(--scale,1));color:#7b807b;line-height:1.7;flex:none}

/* ── H 剪报拼贴 ── */
.frame[data-skeleton="clip"]{background:#d9c8a6}
.frame[data-skeleton="clip"] .sk-root::before{content:"";position:absolute;inset:0;z-index:0;
  background:radial-gradient(rgba(255,255,255,.22) 1px,transparent 1px) 0 0/7px 7px,
             radial-gradient(rgba(120,95,60,.14) 1px,transparent 1px) 4px 4px/12px 12px;
  box-shadow:inset 0 0 90px rgba(100,75,40,.26)}
.frame[data-skeleton="clip"] .sk-h-desk{position:relative;z-index:2;flex:1;min-height:0;
  display:flex;flex-direction:column;justify-content:center;gap:calc(18px * var(--scale,1) * var(--sk-k,1))}
.frame[data-skeleton="clip"] .sk-h-clip{background:#f6f3e9;box-shadow:2px 8px 18px rgba(70,50,25,.30);
  padding:calc(20px * var(--scale,1) * var(--sk-k,1)) calc(22px * var(--scale,1));transform:rotate(-1.2deg)}
.frame[data-skeleton="clip"] .sk-h-clip.side{transform:rotate(1.4deg);background:#fffaf0}
.frame[data-skeleton="clip"] .sk-h-clip.slip{transform:rotate(-.8deg);background:#eef3ea;padding:calc(14px * var(--scale,1) * var(--sk-k,1)) calc(20px * var(--scale,1))}
.frame[data-skeleton="clip"] .sk-h-clip.final{transform:rotate(.8deg);background:#ffe6a8;font-weight:900}
.frame[data-skeleton="clip"] .sk-h-title{color:#2b302c}
.frame[data-skeleton="clip"] .sk-h-rule{height:calc(3px * var(--scale,1));background:#b9b4a5;margin:calc(16px * var(--scale,1) * var(--sk-k,1)) 0}
.frame[data-skeleton="clip"] .sk-h-lines{display:flex;flex-direction:column;gap:calc(9px * var(--scale,1) * var(--sk-k,1));margin:calc(10px * var(--scale,1) * var(--sk-k,1)) 0}
.frame[data-skeleton="clip"] .sk-h-lines i{height:calc(6px * var(--scale,1) * var(--sk-k,1));background:#b9b4a5;border-radius:1px;opacity:.8}
.frame[data-skeleton="clip"] .sk-h-lines i:nth-child(2){width:88%}
.frame[data-skeleton="clip"] .sk-h-lines i:nth-child(3){width:64%}
.frame[data-skeleton="clip"] .sk-h-img{height:calc(70px * var(--scale,1) * var(--sk-k,1));
  background:radial-gradient(circle at 30% 40%,rgba(80,80,80,.30) 1px,transparent 1px) 0 0/6px 6px,#cbc7b9}
.frame[data-skeleton="clip"] .sk-h-clip b{font-size:calc(25px * var(--scale,1));color:#8a6a3c;display:block;margin-bottom:4px}
.frame[data-skeleton="clip"] .sk-h-clip p{font-size:calc(var(--fs-body) * var(--scale,1));font-weight:800;line-height:1.4;margin:0}
.frame[data-skeleton="clip"] .sk-h-clip.final{font-size:calc(var(--fs-body) * var(--scale,1));line-height:1.4}
.frame[data-skeleton="clip"] .sk-h-fine{position:absolute;left:2%;bottom:calc(2px * var(--scale,1));font-size:calc(23px * var(--scale,1));color:#7a6646;z-index:20}

/* ── I 白板手写 ── */
.frame[data-skeleton="board"]{background:#e8efec}
.frame[data-skeleton="board"] .sk-root::before{content:"";position:absolute;inset:0;z-index:0;
  background:linear-gradient(168deg,#fcfdfc,#eef3f1),repeating-linear-gradient(102deg,transparent 0 46px,rgba(120,150,140,.045) 46px 52px);
  box-shadow:inset 0 0 0 calc(9px * var(--scale,1)) #c9d2ce,inset 0 0 70px rgba(90,120,110,.10)}
.frame[data-skeleton="board"] .sk-i-board{position:relative;z-index:2;flex:1;min-height:0;display:flex;flex-direction:column;
  justify-content:center;gap:calc(20px * var(--scale,1) * var(--sk-k,1));padding:0 calc(16px * var(--scale,1))}
.frame[data-skeleton="board"] .sk-i-pad{display:flex;flex-direction:column;gap:calc(18px * var(--scale,1) * var(--sk-k,1))}
.frame[data-skeleton="board"] .sk-i-line{font-size:calc(var(--fs-body) * var(--scale,1));font-weight:900;line-height:1.4;
  transform:rotate(-1deg);color:#1a5fa8}
.frame[data-skeleton="board"] .sk-i-line.q{font-size:calc(var(--fs-title) * var(--scale,1) * .82);line-height:1.3}
.frame[data-skeleton="board"] .sk-i-line.strike{opacity:.5;text-decoration:line-through;text-decoration-color:#c8392c;text-decoration-thickness:calc(5px * var(--scale,1))}
.frame[data-skeleton="board"] .sk-i-line.red{color:#cf352b;font-size:calc(var(--fs-cap) * var(--scale,1))}
.frame[data-skeleton="board"] .sk-i-line.green{color:#137a52;transform:rotate(.6deg)}
.frame[data-skeleton="board"] .sk-i-line.green b{display:inline-flex;width:calc(36px * var(--scale,1));height:calc(36px * var(--scale,1));
  border-radius:50%;background:#137a52;color:#fff;align-items:center;justify-content:center;font-size:calc(25px * var(--scale,1));margin-right:calc(10px * var(--scale,1))}
.frame[data-skeleton="board"] .sk-i-line.big{font-size:calc(var(--fs-title) * var(--scale,1) * .78)}
.frame[data-skeleton="board"] .sk-i-smudge{position:absolute;right:8%;top:40%;width:36%;height:22%;border-radius:50%;
  background:rgba(60,100,90,.05);z-index:1;pointer-events:none}
.frame[data-skeleton="board"] .sk-i-tray{position:absolute;left:0;right:0;bottom:calc(4px * var(--scale,1));height:calc(30px * var(--scale,1) * var(--sk-k,1));
  background:#b7c2bd;box-shadow:inset 0 4px 7px rgba(0,0,0,.14);z-index:6}
.frame[data-skeleton="board"] .sk-i-tray i{position:absolute;bottom:calc(22px * var(--scale,1) * var(--sk-k,1));width:calc(60px * var(--scale,1));height:calc(10px * var(--scale,1));border-radius:5px}
.frame[data-skeleton="board"] .sk-i-tray i:nth-child(1){left:12%;background:#1a5fa8}
.frame[data-skeleton="board"] .sk-i-tray i:nth-child(2){left:42%;background:#cf352b}
.frame[data-skeleton="board"] .sk-i-tray i:nth-child(3){left:72%;background:#137a52}
.frame[data-skeleton="board"] .sk-i-ring{border-color:#137a52}

/* 16:9：物体区收紧但不改字号基准；字幕条贴底不压主体 */
.frame[data-skeleton][data-ratio="16:9"] .sk-root{padding-left:calc(110px * var(--scale,1));padding-right:calc(110px * var(--scale,1))}
.frame[data-skeleton][data-ratio="16:9"] .sk-c-anchor{font-size:calc(var(--fs-hero) * var(--scale,1) * .48)}
.frame[data-skeleton] .sk-a-q,.frame[data-skeleton] .sk-b-q,.frame[data-skeleton] .sk-d-q,
.frame[data-skeleton] .sk-f-q,.frame[data-skeleton] .sk-g-q,.frame[data-skeleton] .sk-i-q{
  font-size:calc(var(--fs-title) * var(--scale,1))!important;font-weight:900;line-height:1.3;
  word-break:normal;overflow-wrap:anywhere;text-wrap:pretty;margin:0;
}
.frame[data-skeleton="anchor"] .sk-c-anchor{right:1%;top:auto;bottom:16%;opacity:.55}
.frame[data-skeleton="anchor"] .sk-c-bubble{right:auto;left:4%;top:auto;bottom:20%;max-width:52%}
.frame[data-skeleton="chat"] .sk-f-bar span{font-size:0}
.frame[data-skeleton="chat"] .sk-f-bar span::before{content:"\u2039";font-size:calc(var(--fs-body) * var(--scale,1));color:#6d7980}
.frame[data-skeleton="receipt"] .sk-g-q{text-align:center;color:#c62f26;letter-spacing:.06em;flex:none;
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}
.frame[data-skeleton="board"] .sk-i-q{font-size:calc(var(--fs-title) * var(--scale,1))!important;
  transform:rotate(-1deg);color:#1a5fa8;margin:0}

.frame[data-skeleton="clip"] .sk-h-seal{display:inline-block;margin-left:calc(16px * var(--scale,1));
  border:calc(3px * var(--scale,1)) solid #c62f26;color:#c62f26;border-radius:5px;
  padding:calc(4px * var(--scale,1)) calc(12px * var(--scale,1));
  font-size:calc(var(--fs-cap) * var(--scale,1));font-weight:900;letter-spacing:.08em;
  transform:rotate(-6deg);vertical-align:middle}

.frame[data-skeleton][data-ratio="16:9"] .sk-g-ticket{max-height:88%}
.frame[data-skeleton][data-ratio="16:9"] .sk-g-rows{gap:calc(8px * var(--scale,1))}
.frame[data-skeleton="receipt"] .sk-g-foot{margin-top:auto}
.frame[data-skeleton="board"] .sk-i-line{transform:none}
.frame[data-skeleton="board"] .sk-i-line.green{transform:none}
.frame[data-skeleton="board"] .sk-i-line.q,.frame[data-skeleton="board"] .sk-i-q{transform:rotate(-.4deg)}
.frame[data-skeleton="board"] .sk-i-pad{gap:calc(26px * var(--scale,1) * var(--sk-k,1))}

/* 红圈附着在具体文字块上，不用固定百分比 —— 圈永远跟着内容，不会圈住空白 */
.frame[data-skeleton] .sk-marked{position:relative}
.frame[data-skeleton] .sk-marked::after{content:"";position:absolute;
  left:-4%;right:-4%;top:-16%;bottom:-16%;z-index:26;pointer-events:none;
  border:calc(5px * var(--scale,1)) solid var(--sk-ink);
  border-radius:50% 56% 45% 55% / 54% 45% 58% 42%;
  box-shadow:1px 2px 0 rgba(200,57,44,.16)}
.frame[data-skeleton="cork"] .sk-d-note[data-n="0"],
.frame[data-skeleton="cork"] .sk-d-note[data-n="5"]{width:88%}
.frame[data-skeleton="cork"] .sk-d-note[data-n="0"]{min-height:calc(170px * var(--scale,1) * var(--sk-k,1))}
.frame[data-skeleton="receipt"] .sk-g-ticket{min-height:84%}
.frame[data-skeleton="receipt"][data-ratio="16:9"] .sk-g-ticket{min-height:80%}

/* B 首卡曾误用通用 .lead 类，撞上 FRAME_CSS 的 --dim 浅色，白底几乎看不见 */
.frame[data-skeleton="evidence"] .sk-b-q{color:#22303a}
.frame[data-skeleton="evidence"] .sk-b-results{justify-content:flex-start;
  padding-top:calc(26px * var(--scale,1) * var(--sk-k,1))}
.frame[data-skeleton="evidence"] .sk-b-foot{margin-bottom:calc(56px * var(--scale,1) * var(--sk-k,1))}
/* 所有骨架的来源小字统一抬离字幕条 */
.frame[data-skeleton] .sk-src,.frame[data-skeleton] .sk-h-fine{margin-bottom:calc(34px * var(--scale,1) * var(--sk-k,1))}
/* 红圈收敛，别把整张卡箍成大椭圆 */
.frame[data-skeleton] .sk-marked::after{left:-3%;right:-3%;top:-9%;bottom:-9%}

.frame[data-skeleton="evidence"][data-ratio="16:9"] .sk-b-results{gap:calc(8px * var(--scale,1));padding-top:calc(8px * var(--scale,1))}
.frame[data-skeleton="evidence"][data-ratio="16:9"] .sk-b-row{padding:calc(10px * var(--scale,1)) calc(18px * var(--scale,1))}
.frame[data-skeleton="evidence"][data-ratio="16:9"] .sk-b-row b{font-size:calc(var(--fs-cap) * var(--scale,1))}
.frame[data-skeleton="evidence"][data-ratio="16:9"] .sk-b-q{font-size:calc(var(--fs-title) * var(--scale,1))!important}
.frame[data-skeleton="evidence"][data-ratio="16:9"] .sk-b-row small{font-size:calc(20px * var(--scale,1))}
.frame[data-skeleton="evidence"][data-ratio="16:9"] .sk-b-foot{margin-bottom:0}

`;

return {meta:META,by:BY,css:CSS,render:render};
})();
