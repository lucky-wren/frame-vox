/* ═════════════════════════════════════════════════════════════
   帧语 NEXT · 音频与字幕工作台
   择优取自原 frame-vox：人声 / 配乐 / 音效 / 混音 / 字幕·水印·片尾
   以抽屉形式挂回 NEXT，不改动已认可的三步流程与六帧视觉
   ═════════════════════════════════════════════════════════════ */
(function(){
'use strict';
var A=null,S=null,$=function(x){return document.querySelector(x);};
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
var toast=function(m){
  window.__TOAST_LAST__=m;
  var e=document.getElementById('toast');
  if(e){e.textContent=m;e.classList.add('show');
    clearTimeout(window.__ST_TT__);window.__ST_TT__=setTimeout(function(){e.classList.remove('show');},2100);}
};

function row(label,inner,extra){
  return '<div class="st-row"><span class="st-lab">'+label+'</span><div class="st-ctl">'+inner+'</div></div>'+
    (extra?'<div class="st-note">'+extra+'</div>':'');
}
function group(id,title,sub,body,open){
  return '<details class="st-group" id="'+id+'"'+(open?' open':'')+'>'+
    '<summary><b>'+title+'</b><small>'+sub+'</small><i>⌄</i></summary>'+
    '<div class="st-gbody">'+body+'</div></details>';
}

function voiceBody(){
  var opts=A.VOICES.map(function(v){return '<option value="'+v[0]+'">'+esc(v[1])+'</option>';}).join('');
  var diag='<div class="st-diag" id="stDiag"></div>';
  var take='<div class="st-upload"><label>⬆ 整条真人录音（按静音自动切句）'+
      '<input type="file" id="stTake" accept="audio/*"></label>'+
      '<label>⬆ 逐句 WAV（按句子顺序一一替换，可多选）'+
      '<input type="file" id="stWavs" accept="audio/wav,audio/*" multiple></label></div>';
  return row('音色','<input type="search" id="stVoiceSearch" placeholder="搜索音色 / 方言 / 粤语…">'+
      '<select id="stVoice" size="1">'+opts+'</select>')+
    diag+
    row('自定义接口','<input type="text" id="stVUrl" placeholder="留空 = libretts.is-an.org（免密钥）">'+
      '<div class="st-hint">支持 {{text}} {{voice}} {{rate}} 占位符</div>',
      '题目与讲稿全文会发送给该接口；用第三方服务前请自行确认隐私与授权。')+
    row('并发路数','<input type="range" id="stConc" min="1" max="12" value="4"><b id="stConcV">4 路</b>',
      '相同文案自动合并为一次请求；单句 8 秒超时；失败只补失败句，已缓存的直接命中人声池。')+
    '<div class="st-btnrow"><button id="stTry">🔊 试听一句</button>'+
      '<button id="stSynth">⚙ 逐句合成</button><button id="stCancel">⏹ 取消</button>'+
      '<button id="stClear">♻ 清空缓存</button></div>'+
    '<div class="st-status" id="stSynthStat"></div>'+
    take+
    '<div class="st-hint">整条录音按能量静音切句；逐句 WAV 按文件顺序对应非静默帧。实测时长直接写进时间轴。</div>';
}
function bgmBody(){
  var opts=A.BGM_LIB.map(function(x){return '<option value="'+x.v+'">'+esc(x.n)+'</option>';}).join('');
  return row('曲目','<select id="stBgm">'+opts+'</select>')+
    '<div class="st-license" id="stBgmLic"></div>'+
    '<div class="st-btnrow"><button id="stBgmListen">▶ 试听</button>'+
      '<button id="stBgmStop">⏹ 停止</button><button id="stBgmUse">⬇ 接入成片音轨</button>'+
      '<button id="stBgmDl">⬇ 下载在线曲目</button></div>'+
    '<div class="st-upload"><label>⬆ 接入本地音乐（自定义 BGM）'+
      '<input type="file" id="stBgmFile" accept="audio/*"></label></div>'+
    '<div class="st-status" id="stBgmStat"></div>'+
    '<div class="st-hint">随包内置 3 首 CC0 1.0 真实音乐（OpenGameArt，作者与来源见 assets/bgm/LICENSES.md，允许随产品再分发）。'+
      '另有 5 首 Pixabay 曲目可即时试听；Pixabay 禁止把原曲单独打包分发，且其 CDN 不返回 CORS 头，'+
      '在线曲目必须先下载到本地、再用自定义上传接入才能写进导出音轨。预览与导出使用同一份音频缓冲。</div>';
}
function sfxBody(){
  var kinds=A.SFX_KINDS.map(function(k){return '<option value="'+k.v+'">'+esc(k.n)+'</option>';}).join('');
  var rows=A.SFX_SEG.map(function(g){
    return '<div class="st-sfxrow" data-seg="'+g.k+'"><span>'+esc(g.n)+'</span>'+
      '<select data-sfx="'+g.k+'">'+kinds+'</select>'+
      '<button data-try="'+g.k+'">▶</button>'+
      '<label class="st-miniup" title="导入自定义音效">⬆<input type="file" data-up="'+g.k+'" accept="audio/*"></label></div>';
  }).join('');
  return '<div class="st-hint">7 段对应六帧 + 封面，另含 3·2·1 倒数。内置音效为程序化合成（零文件、零授权）；导入的音频授权由你自行确认。</div>'+
    rows+
    '<div class="st-btnrow"><button id="stSfxOff">全部关闭</button>'+
      '<button id="stSfxAll">统一套用当前音效</button><button id="stSfxSeq">▶ 按顺序试听</button></div>'+
    '<div class="st-btnrow"><button id="stC3">▶ 3</button><button id="stC2">▶ 2</button>'+
      '<button id="stC1">▶ 1</button><button id="stCAll">▶ 整段 3·2·1</button></div>';
}
function mixBody(){
  return '<div class="st-hint">五路同时作用于预览与导出；总音量可放大到 200%，超过 0.95 的峰值自动软限幅。</div>'+
    A.ROUTES.map(function(r){
      var name={master:'总音量',voice:'人声',bgm:'配乐',sfx:'音效',count:'倒数'}[r];
      var v=Math.round((S.vol[r]||0)*100);
      return '<div class="st-mix" data-r="'+r+'"><span>'+name+'</span>'+
        '<input type="range" min="0" max="200" value="'+v+'" data-vol="'+r+'">'+
        '<b data-vv="'+r+'">'+v+'%</b><div class="st-meter"><i data-lv="'+r+'"></i></div></div>';
    }).join('')+
    '<label class="st-switch"><input type="checkbox" id="stDuck" checked>'+
      '<span>人声响起时自动压低配乐（防盖音 ducking）</span></label>'+
    '<div class="st-status" id="stLevels">电平：待播放</div>';
}
function subBody(){
  return row('字幕','<div class="st-seg" id="stSubSw"><button data-v="1" class="on">开</button>'+
      '<button data-v="0">关</button></div>')+
    row('字幕跟随口播','<div class="st-seg" id="stSubSync"><button data-v="1" class="on">跟随</button>'+
      '<button data-v="0">补充短句</button></div>'+
      '<div class="st-note">跟随 = 字幕 / 画面大字 / 听到的第一句是同一句；关闭则回到补充短句模式。</div>')+
    row('模式','<select id="stSubMode"><option value="always">始终显示</option>'+
      '<option value="smart">画面大字已含该句时不叠字幕（仅补充短句模式生效）</option></select>')+
    row('位置','<select id="stSubPos"><option value="bottom">画面下方（默认）</option>'+
      '<option value="top">画面上方</option><option value="middle">画面中部</option>'+
      '<option value="custom">自定义坐标</option></select>')+
    row('水平 X / 垂直 Y','<div class="st-pair"><input type="range" id="stSubX" min="5" max="95" value="50">'+
      '<input type="range" id="stSubY" min="5" max="95" value="86"></div>'+
      '<div class="st-hint" id="stSubXY">X 50% · Y 86%（仅自定义坐标生效）</div>')+
    row('统一字号','<input type="range" id="stSubScale" min="60" max="180" value="100"><b id="stSubScaleV">100%</b>')+
    row('每行字数','<input type="range" id="stSubWrap" min="0" max="40" value="0"><b id="stSubWrapV">不限</b>')+
    row('文字 / 底色 / 强调','<div class="st-color3">'+
      '<input type="color" id="stSubFg" value="#f2f6fa" title="文字">'+
      '<input type="color" id="stSubBg" value="#101a24" title="底色">'+
      '<input type="color" id="stSubAccent" value="#e9b96a" title="竖线与圆点">'+
      '<button id="stSubColorReset">↺ 跟随模板</button></div>')+
    row('打字机','<label class="st-switch"><input type="checkbox" id="stSubTw">'+
      '<span>逐字显现</span></label><input type="range" id="stSubTwSpeed" min="30" max="250" value="100">')+
    '<div class="st-sep">水印</div>'+
    row('水印文字','<input type="text" id="stWmText" placeholder="留空则不绘制">')+
    row('位置 / 透明度','<select id="stWmPos"><option value="right-top">右上</option>'+
      '<option value="left-top">左上</option><option value="right-bottom">右下</option>'+
      '<option value="left-bottom">左下</option><option value="center">居中淡印</option></select>'+
      '<input type="range" id="stWmAlpha" min="5" max="80" value="18">')+
    '<div class="st-sep">片尾</div>'+
    row('片尾停留','<input type="range" id="stEndHold" min="0" max="10" step="0.5" value="0">'+
      '<b id="stEndHoldV">0s</b>','停留写进时间轴与导出帧；朗读结束后画面保持、字幕腰带留空。')+
    row('收尾语','<input type="text" id="stEndClose" placeholder="这期就聊到这里。">')+
    '<label class="st-switch"><input type="checkbox" id="stEndSrcOn">'+
      '<span>来源句朗读并显示</span></label>'+
    '<div class="st-sep">音频导出</div>'+
    '<div class="st-btnrow"><button id="stExpWav">⬇ WAV · PCM 无损</button>'+
      '<button id="stExpMp3">⬇ MP3 · lamejs</button><button id="stExpSrc">⬇ 来源与授权清单</button></div>'+
    '<div class="st-status" id="stExpStat">尚未导出音频。</div>'+
    '<div class="st-hint">视频仍走「出片」页的 WebM 录制；MP4 不直出，给 ffmpeg 命令，不谎报格式。</div>';
}

function build(){
  if(window.__STUDIO_UI__)return;
  A=window.__STUDIO_API__;if(!A)return;S=A.state;
  /* 只在两处留入口：「选风格」页原地卡 + 固定悬浮按钮。
     顶栏那个 99px 小按钮既挤到「主题」旁、窄屏还会溢出，属于重复入口，移除。 */
  var btn=null;
  /* 固定悬浮入口：任何屏宽、任何滚动位置都能找到 */
  var fab=document.createElement('button');
  fab.id='studioFab';fab.className='st-fab';fab.title='打开音频与字幕工作台';
  fab.innerHTML='<b>♫</b><span>音频工作台</span>';
  document.body.appendChild(fab);

  var wrap=document.createElement('div');wrap.id='studio';wrap.hidden=true;
  wrap.innerHTML='<div class="st-head"><div><b>音频与字幕工作台</b>'+
      '<small>人声 · 配乐 · 音效 · 混音 · 字幕 / 水印 / 片尾</small></div>'+
      '<button id="stFold" title="全部展开 / 全部折叠">⇕ 全部展开</button>'+
      '<button id="stClose" title="关闭">×</button></div>'+
    '<div class="st-body">'+
      group('stGVoice','🎙 人声','微软神经音色 · 逐句合成 · 真人录音',voiceBody(),true)+
      group('stGBgm','♫ 配乐','3 首内置 CC0 · 5 首在线 · 自定义上传',bgmBody())+
      group('stGSfx','✦ 音效','7 段流程 + 3·2·1',sfxBody())+
      group('stGMix','▥ 混音','五路独立 · 实时电平 · 防盖音',mixBody())+
      group('stGSub','字 字幕 · 水印 · 片尾','完整参数 · 音频导出',subBody())+
    '</div>';
  document.body.appendChild(wrap);
  window.__STUDIO_UI__={wrap:wrap,btn:btn,fab:fab};
  function openStudio(){
    wrap.hidden=false;if(btn)btn.classList.add('on');fab.classList.add('on');refresh();
  }
  function closeStudio(){
    wrap.hidden=true;if(btn)btn.classList.remove('on');fab.classList.remove('on');
  }
  window.__OPEN_STUDIO__=openStudio;window.__CLOSE_STUDIO__=closeStudio;
  fab.onclick=function(){wrap.hidden?openStudio():closeStudio();};
  /* 原地入口卡：用户按旧心智模型在「选风格」页找模块，第一眼就能看到 */
  var entry=$('#btnOpenStudio');if(entry)entry.onclick=openStudio;
  $('#stClose').onclick=closeStudio;
  $('#stFold').onclick=function(){
    var gs=Array.prototype.slice.call(wrap.querySelectorAll('.st-group'));
    var anyClosed=gs.some(function(g){return !g.open;});
    gs.forEach(function(g){g.open=anyClosed;});
    this.textContent=anyClosed?'⇕ 全部折叠':'⇕ 全部展开';
  };
  bindAll();
  window.__ST_BGM_MSG__='尚未接入音轨（成片将无配乐）';
  $('#stBgmStat').textContent=window.__ST_BGM_MSG__;
  refresh();
  startMeters();
  window.buildStudio=function(){refresh();};
}

function bindAll(){
  /* ── 人声 ── */
  var vs=$('#stVoice');vs.value=S.voice;
  vs.onchange=function(){S.voice=this.value;renderSynthMirror();refresh();};
  $('#stVoiceSearch').oninput=function(){
    var q=this.value.trim().toLowerCase();
    Array.prototype.forEach.call(vs.options,function(o){
      o.hidden=!!q&&o.textContent.toLowerCase().indexOf(q)<0;});
  };
  $('#stVUrl').oninput=function(){S.vUrl=this.value.trim();renderSynthMirror();refresh();};
  $('#stConc').oninput=function(){S.conc=+this.value;$('#stConcV').textContent=this.value+' 路';};
  $('#stTry').onclick=function(){var b=$('#btnTryVoice');if(b)b.click();else toast('试听按钮不可用');};
  $('#stSynth').onclick=function(){var b=$('#btnSynthAll');if(b)b.click();};
  $('#stCancel').onclick=function(){var b=$('#btnSynthCancel');if(b)b.click();};
  $('#stClear').onclick=function(){S.tts.clear();S.ttsFail.clear();S.voiceTakeName='';
    A.rebuildStudio();toast('已清空人声缓存');};
  $('#stTake').onchange=function(){
    if(!this.files.length)return;
    A.importVoiceFiles(this.files,'take',function(err){toast(err||'整条录音已切句并写入时间轴');refresh();});
  };
  $('#stWavs').onchange=function(){
    if(!this.files.length)return;
    A.importVoiceFiles(this.files,'wav',function(err){toast(err||'逐句 WAV 已按顺序替换');refresh();});
  };
  /* ── 配乐 ── */
  var bs=$('#stBgm');bs.value=S.bgmSel||'off';
  /* 只刷新授权卡，绝不回写 select —— 否则用户选的曲目会被 S.bgmSel('off')
     覆盖，点「接入」时实际接入的是「关闭」。这是实测抓到的真 bug。 */
  bs.onchange=function(){refreshLicense();};
  $('#stBgmListen').onclick=function(){A.bgmListen(bs.value);$('#stBgmStat').textContent='试听：'+bs.selectedOptions[0].textContent;};
  $('#stBgmStop').onclick=function(){A.stopBgmListen();$('#stBgmStat').textContent='已停止试听';};
  $('#stBgmUse').onclick=function(){
    var v=bs.value,label=bs.selectedOptions[0].textContent;
    A.applyBgm(v,function(err){
      window.__ST_BGM_MSG__=err||('已接入：'+(S.bgmName||label)+'（预览与导出同源）');
      $('#stBgmStat').textContent=window.__ST_BGM_MSG__;
      if(err)toast(err);else toast('配乐已接入，预览与导出同源');refresh();});
  };
  $('#stBgmDl').onclick=function(){
    var e=A.BGM_LIB.filter(function(x){return x.v===bs.value;})[0];
    if(!e||!e.url){toast('该曲目是内置 CC0 或自定义，不需要下载');return;}
    var a=document.createElement('a');a.href=e.url;a.download=e.n.replace(/[^\w\u4e00-\u9fa5]+/g,'_')+'.mp3';
    a.target='_blank';document.body.appendChild(a);a.click();a.remove();
    $('#stBgmStat').textContent='已发起下载；若浏览器直接播放，请另存为本地文件后再用「⬆ 接入本地音乐」。';
  };
  $('#stBgmFile').onchange=function(){
    if(!this.files.length)return;A.importBgm(this.files[0]);
    bs.value='custom';$('#stBgmStat').textContent='已接入自定义：'+this.files[0].name;refresh();
  };
  /* ── 音效 ── */
  Array.prototype.forEach.call(document.querySelectorAll('[data-sfx]'),function(sel){
    sel.value=(S.sfx||{})[sel.dataset.sfx]||'off';
    sel.onchange=function(){S.sfx[sel.dataset.sfx]=this.value;};
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-try]'),function(b){
    b.onclick=function(){var k=b.dataset.try,sel=document.querySelector('[data-sfx="'+k+'"]');
      A.playSfx(sel.value,k);};
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-up]'),function(inp){
    inp.onchange=function(){if(this.files.length){A.importSfxFile(inp.dataset.up,this.files[0]);
      document.querySelector('[data-sfx="'+inp.dataset.up+'"]').value='custom';
      S.sfx[inp.dataset.up]='custom';}};
  });
  $('#stSfxOff').onclick=function(){A.SFX_SEG.forEach(function(g){S.sfx[g.k]='off';
    document.querySelector('[data-sfx="'+g.k+'"]').value='off';});toast('全部音效已关闭');};
  $('#stSfxAll').onclick=function(){
    var v=document.querySelector('[data-sfx="hook"]').value;
    A.SFX_SEG.forEach(function(g){S.sfx[g.k]=v;document.querySelector('[data-sfx="'+g.k+'"]').value=v;});
    toast('已统一套用');};
  $('#stSfxSeq').onclick=function(){
    A.SFX_SEG.forEach(function(g,i){if(S.sfx[g.k]&&S.sfx[g.k]!=='off')
      setTimeout(function(){A.playSfx(S.sfx[g.k],g.k);},i*260);});};
  ['3','2','1'].forEach(function(n){
    $('#stC'+n).onclick=function(){A.playSfx(S.sfx.count||'click','count');};
  });
  $('#stCAll').onclick=function(){[0,1,2].forEach(function(k){
    setTimeout(function(){A.playSfx(S.sfx.count||'click','count');},k*520);});};
  /* ── 混音 ── */
  Array.prototype.forEach.call(document.querySelectorAll('[data-vol]'),function(inp){
    inp.oninput=function(){var r=inp.dataset.vol,v=+inp.value/100;
      A.setVol(r,v);document.querySelector('[data-vv="'+r+'"]').textContent=inp.value+'%';};
  });
  $('#stDuck').onchange=function(){S.duckOn=this.checked;};
  /* ── 字幕 / 水印 / 片尾 ── */
  $('#stSubSw').onclick=function(e){
    var b=e.target.closest('button');if(!b)return;
    S.sub=b.dataset.v==='1';
    Array.prototype.forEach.call(this.querySelectorAll('button'),function(x){x.classList.toggle('on',x===b);});
    /* 同步播放器条上的字幕总闸，避免两处状态不一致 */
    var sw=$('#subSw');if(sw)Array.prototype.forEach.call(sw.querySelectorAll('button'),function(x){
      x.classList.toggle('on',(x.dataset.v==='1')===S.sub);});
    A.rebuildStudio();
  };
  $('#stSubSync').onclick=function(e){
    var b=e.target.closest('button');if(!b)return;
    S.subSync=b.dataset.v==='1';
    Array.prototype.forEach.call(this.querySelectorAll('button'),function(x){x.classList.toggle('on',x===b);});
    var f=$('#f_subSync');if(f)f.checked=S.subSync;
    A.rebuildStudio();
  };
  $('#stSubMode').onchange=function(){S.subMode=this.value;A.rebuildStudio();};
  $('#stSubPos').onchange=function(){S.subPos=this.value;A.rebuildStudio();};
  $('#stSubX').oninput=function(){S.subX=+this.value;syncXY();A.rebuildStudio();};
  $('#stSubY').oninput=function(){S.subY=+this.value;syncXY();A.rebuildStudio();};
  $('#stSubScale').oninput=function(){S.subScale=+this.value/100;
    $('#stSubScaleV').textContent=this.value+'%';A.rebuildStudio();};
  $('#stSubWrap').oninput=function(){S.subWrap=+this.value;
    $('#stSubWrapV').textContent=+this.value?this.value+' 字':'不限';A.rebuildStudio();};
  [['stSubFg','subFg'],['stSubBg','subBg'],['stSubAccent','subAccent']].forEach(function(x){
    $('#'+x[0]).oninput=function(){S[x[1]]=this.value;A.rebuildStudio();};
  });
  $('#stSubColorReset').onclick=function(){S.subFg='';S.subBg='';S.subAccent='';A.rebuildStudio();
    toast('颜色已恢复为跟随模板');};
  $('#stSubTw').onchange=function(){S.subTw=this.checked;A.rebuildStudio();};
  $('#stSubTwSpeed').oninput=function(){S.subTwSpeed=+this.value/100;A.rebuildStudio();};
  $('#stWmText').oninput=function(){S.wmText=this.value;A.rebuildStudio();};
  $('#stWmPos').onchange=function(){S.wmPos=this.value;A.rebuildStudio();};
  $('#stWmAlpha').oninput=function(){S.wmAlpha=+this.value/100;A.rebuildStudio();};
  /* 片尾停留会改时间轴总长，必须走完整 rebuild()，只重绘画面不生效 */
  $('#stEndHold').oninput=function(){S.endHold=+this.value;
    $('#stEndHoldV').textContent=this.value+'s';A.rebuildAll();refresh();};
  $('#stEndClose').oninput=function(){S.endClose=this.value;};
  $('#stEndSrcOn').onchange=function(){S.endSrcOn=this.checked;};
  /* ── 音频导出 ── */
  $('#stExpWav').onclick=function(){doExport('wav');};
  $('#stExpMp3').onclick=function(){doExport('mp3');};
  $('#stExpSrc').onclick=function(){var r=A.exportSrcList();
    $('#stExpStat').textContent='来源与授权清单已导出 · '+(r.bytes/1024).toFixed(1)+' KB';};
}
function refreshLicense(){
  var bs=$('#stBgm');
  var e=A.BGM_LIB.filter(function(x){return x.v===(bs?bs.value:'off');})[0];
  var el=$('#stBgmLic');if(!el)return;
  var lic=e?esc(e.lic||'—'):'—';
  el.innerHTML='<b>当前</b> '+esc(S.bgmName||'未接入配乐')+
    '<br><b>授权</b> '+lic+
    /* 接入状态与授权文案相同时不重复堆两行 */
    (S.bgmLicense&&S.bgmLicense!==(e?e.lic:'')?'<br><b>接入状态</b> '+esc(S.bgmLicense):'');
}
function syncXY(){$('#stSubXY').textContent='X '+S.subX+'% · Y '+S.subY+'%（仅自定义坐标生效）';}
function doExport(fmt){
  var st=$('#stExpStat');st.textContent='正在离线混音…';
  A.exportAudio(fmt).then(function(r){
    st.textContent='已导出 '+r.mime+' · '+(r.bytes/1024).toFixed(0)+' KB';toast('音频已导出');
  },function(e){st.textContent='导出失败：'+e.message;toast(e.message);});
}
function renderSynthMirror(){
  var list=[],seen={};
  S.frames.forEach(function(f){if(f.speak&&!seen[f.speak]){seen[f.speak]=1;list.push(f.speak);}});
  var done=list.filter(function(t){return S.tts.has(A.ttsKey(t));}).length;
  var measured=list.filter(function(t){var b=S.tts.get(A.ttsKey(t));return b&&b.duration;}).length;
  var e=$('#stSynthStat');if(e)e.textContent='逐句 '+done+' / '+list.length+' 已缓存 · '+measured+' 句有实测时长'+
    (S.voiceTakeName?' · 录音：'+S.voiceTakeName:'');
  var d=$('#stDiag');
  if(d)d.innerHTML='<div><b>音色 ID</b> '+esc(S.voice)+'</div>'+
    '<div><b>接口</b> '+esc(S.vUrl||'libretts.is-an.org/api/tts')+'</div>'+
    '<div><b>在线神经音色</b> 以接口实际返回为准，先点「试听一句」确认；本工具不伪造本地模型。</div>'+
    '<div><b>离线兜底</b> 上传真人录音或逐句 WAV（完全本地，授权链在你手里）</div>'+
    '<div><b>隐私</b> 题目与讲稿全文会发送给上述接口</div>';
}
function refresh(){
  if(!A||!S)return;
  refreshLicense();
  /* 不覆盖「在线曲目需先下载」等最近一次操作提示；只有显式 syncBgmStat 才刷新 */
  if(window.__ST_BGM_MSG__)$('#stBgmStat').textContent=window.__ST_BGM_MSG__;
  $('#stDuck').checked=!!S.duckOn;
  $('#stSubSw').querySelectorAll('button').forEach(function(x){x.classList.toggle('on',(x.dataset.v==='1')===!!S.sub);});
  var ss=$('#stSubSync');if(ss)ss.querySelectorAll('button').forEach(function(x){
    x.classList.toggle('on',(x.dataset.v==='1')===!!S.subSync);});
  $('#stSubMode').value=S.subMode;$('#stSubPos').value=S.subPos;
  $('#stSubX').value=S.subX;$('#stSubY').value=S.subY;syncXY();
  $('#stSubScale').value=Math.round(S.subScale*100);$('#stSubScaleV').textContent=Math.round(S.subScale*100)+'%';
  $('#stSubWrap').value=S.subWrap;$('#stSubWrapV').textContent=S.subWrap?S.subWrap+' 字':'不限';
  $('#stSubTw').checked=!!S.subTw;$('#stWmText').value=S.wmText||'';
  $('#stWmPos').value=S.wmPos;$('#stWmAlpha').value=Math.round(S.wmAlpha*100);
  $('#stEndHold').value=S.endHold;$('#stEndHoldV').textContent=S.endHold+'s';
  $('#stVUrl').value=S.vUrl||'';$('#stConc').value=S.conc||4;
  $('#stConcV').textContent=(S.conc||4)+' 路';
  Array.prototype.forEach.call(document.querySelectorAll('[data-sfx]'),function(sel){
    sel.value=(S.sfx||{})[sel.dataset.sfx]||'off';});
  renderSynthMirror();
  syncEntry();
  window.__ENTRY_SYNC__=(window.__ENTRY_SYNC__||0)+1;
}
/* 原地入口卡摘要：让「模块回来了」在没打开抽屉时也是可见的事实 */
function syncEntry(){
  var g=document.getElementById('aeGrid');if(!g)return;
  var v=A.VOICES.filter(function(x){return x[0]===S.voice;})[0];
  var speaks=[],seen={};
  S.frames.forEach(function(f){if(f.speak&&!seen[f.speak]){seen[f.speak]=1;speaks.push(f.speak);}});
  var done=speaks.filter(function(t){return S.tts.has(A.ttsKey(t));}).length;
  set('aeVoice',(v?v[1].split(' · ')[0]:'晓晓')+' · '+done+'/'+speaks.length+' 句');
  set('aeBgm',S.bgmBuf?(S.bgmName||'已接入'):'未接入');
  var on=A.SFX_SEG.filter(function(x){return S.sfx&&S.sfx[x.k]&&S.sfx[x.k]!=='off';}).length;
  set('aeSfx',on+' / '+A.SFX_SEG.length+' 段开启');
  set('aeMix','五路 · 配乐 '+Math.round(S.vol.bgm*100)+'%');
  set('aeSub',(S.sub?'开':'关')+' · '+(S.subSync?'跟随口播':'补充短句'));
  function set(id,txt){var e=document.getElementById(id);if(e&&e.textContent!==txt)e.textContent=txt;}
}
function startMeters(){
  var t=0;
  function loop(){
    if(!window.__STUDIO_UI__||window.__STUDIO_UI__.wrap.hidden){requestAnimationFrame(loop);return;}
    if(++t%6===0){
      syncEntry();
      var L=A.readLevels();
      A.ROUTES.forEach(function(r){
        var e=document.querySelector('[data-lv="'+r+'"]');
        if(e)e.style.width=Math.round((L[r]||0)*100)+'%';
      });
      var s=$('#stLevels');
      if(s)s.textContent='实测电平 · 总 '+Math.round((L.master||0)*100)+'% · 人声 '+
        Math.round((L.voice||0)*100)+'% · 配乐 '+Math.round((L.bgm||0)*100)+'%';
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
window.refreshStudio=refresh;
window.buildStudio=build;
if(document.readyState!=='loading'&&window.__READY__)setTimeout(function(){if(!window.__STUDIO_UI__)build();},0);
})();
