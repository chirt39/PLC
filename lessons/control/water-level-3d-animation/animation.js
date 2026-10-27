(() => {
  const TOTAL = 84, W = 1920, H = 1080, STAGE_W = 1520, PANEL_X = 1532;
  const iframe = document.getElementById('model');
  const filmCanvas = document.getElementById('film-canvas');
  const ctx = filmCanvas.getContext('2d', { alpha:false });
  const renderMode = new URLSearchParams(location.search).has('render');
  if (renderMode) document.body.classList.add('render-mode');
  const scenes = [
    {start:0,end:7,title:'01 / 10 · 装置与数据链',text:'水位数据链从水箱开始：变送器采集液位，PLC换算并判断，再控制补水和报警。'},
    {start:7,end:15,title:'02 / 10 · 液位变送',text:'LT-01 将 0–10 m 液位线性转换为 4–20 mA，并把模拟信号送入 PLC 的 AI0。'},
    {start:15,end:23,title:'03 / 10 · AI0量程换算',text:'以 5 m 为例：12 mA 对应 AI0 原始值 5000，按量程缩放后得到 5.00 m 工程液位。'},
    {start:23,end:32,title:'04 / 10 · 低位启动补水',text:'液位降到 4 m 及以下，PLC 接通 Q0.0，补水泵启动，补水阀同步打开。'},
    {start:32,end:41,title:'05 / 10 · 回差保持',text:'4–8 m 是回差区间。液位在区间内变化时，泵阀保持原状态，避免频繁启停。'},
    {start:41,end:50,title:'06 / 10 · 高位停止补水',text:'液位达到 8 m，PLC 断开 Q0.0，补水泵停止，补水阀同步关闭。'},
    {start:50,end:62,title:'07 / 10 · 高液位报警',text:'液位达到 9 m 触发高液位报警。回到 1–9 m 正常范围后，手动复位才能清除。'},
    {start:62,end:74,title:'08 / 10 · 低液位报警',text:'液位降至 1 m 及以下触发低液位报警；回到正常范围后，同样需要手动复位。'},
    {start:74,end:80,title:'09 / 10 · 完整控制链路',text:'完整链路：液位 → 4–20 mA → AI0 原始值 → 工程量 → 回差判断 → Q0.0 → 泵阀。'},
    {start:80,end:84,title:'10 / 10 · 工程使用提示',text:'原始值 0–10000 是教学示意；实际 PLC 的量程、原始值范围和接线方式以设备为准。'},
  ];
  let api = null, ready = false, playing = false, elapsed = 0, startedAt = 0, currentScene = -1;
  let highResetDone = false, lowResetDone = false, finalResetDone = false;
  let recorder = null, recorderChunks = [];

  function injectModelStyle() {
    const doc = iframe.contentDocument;
    if (!doc || doc.getElementById('water-film-style')) return;
    const style = doc.createElement('style');
    style.id = 'water-film-style';
    style.textContent = `html,body,#app{width:100%;height:100%;overflow:hidden!important}#app{grid-template-columns:minmax(0,1fr)!important}#panel{display:none!important}.stage-title,.view-bar,.stage-hint{display:none!important}#toast{display:none!important}`;
    doc.head.append(style);
  }
  function apiReady() {
    try {
      const w = iframe.contentWindow;
      if (!w || !w.__APP_READY__ || !w.__APP__?.isReady()) return false;
      api = w.__APP__;
      injectModelStyle();
      if (!ready) { api.reset(); api.setView('iso'); api.setLevel(5); ready = true; }
      return true;
    } catch { return false; }
  }
  iframe.addEventListener('load', apiReady);
  const clamp = x => Math.max(0, Math.min(1, x));
  const lerp = (a,b,x) => a+(b-a)*clamp(x);
  function sceneIndexAt(t) { return scenes.findIndex(s => t >= s.start && t < s.end); }
  function setSceneState(index) {
    if (index === currentScene) return;
    currentScene = index;
    if (index === 0) { api.reset(); api.setView('iso'); api.setLevel(5); }
    if (index === 3) { api.setAutoFill(false); api.setLevel(5); }
    if (index === 4) { api.setAutoFill(true); api.setLevel(3.8); }
    if (index === 5) { api.setAutoFill(true); api.setLevel(6); }
    if (index === 6) { api.setAutoFill(false); api.setLevel(8); highResetDone = false; }
    if (index === 7) { api.setAutoFill(false); api.setLevel(8.5); lowResetDone = false; }
    if (index === 8 && !finalResetDone) { api.reset(); api.setView('iso'); finalResetDone = true; }
  }
  function levelForTime(index,t) {
    const s=scenes[index], p=clamp((t-s.start)/(s.end-s.start));
    if (index===0) return 5;
    if (index===1) return lerp(5,7.7,p);
    if (index===2) return lerp(7.7,5,Math.min(1,p*2.7));
    if (index===3) return lerp(5,3.8,p);
    if (index===4) return lerp(3.8,6,p);
    if (index===5) return lerp(6,8,Math.min(1,p*1.15));
    if (index===6) { const q=t-s.start; if(q<3.4)return lerp(8,9.3,q/3.4);if(q<6.2)return 9.3;return lerp(9.3,8.5,(q-6.2)/3.8); }
    if (index===7) { const q=t-s.start; if(q<4.4)return lerp(8.5,.8,q/4.4);if(q<6.8)return .8;return lerp(.8,2,(q-6.8)/3.2); }
    return 5;
  }
  function applyTime(t) {
    if (!apiReady()) return;
    elapsed=Math.max(0,Math.min(TOTAL,t));
    let index=sceneIndexAt(elapsed); if(index<0)index=scenes.length-1;
    setSceneState(index);
    api.setLevel(levelForTime(index,elapsed));
    if(index===6&&elapsed>=60.5&&!highResetDone){api.setLevel(8.5);api.alarmReset();highResetDone=true;}
    if(index===7&&elapsed>=73.0&&!lowResetDone){api.setLevel(2);api.alarmReset();lowResetDone=true;}
    if(elapsed>=TOTAL){playing=false;const b=document.getElementById('play');if(b)b.textContent='重播';}
  }
  function roundRect(x,y,w,h,r,fill,stroke) {
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
  }
  function text(str,x,y,size,color,weight='500',align='left') {
    ctx.font=`${weight} ${size}px "Microsoft YaHei", "PingFang SC", sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(str,x,y);
  }
  function wrapText(str,x,y,maxWidth,lineHeight,size,color,weight='600',maxLines=2) {
    ctx.font=`${weight} ${size}px "Microsoft YaHei", "PingFang SC", sans-serif`;
    let line='',lines=[];
    for(const ch of str){const test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=ch;}else line=test;}
    if(line)lines.push(line);lines=lines.slice(0,maxLines);
    ctx.fillStyle=color;ctx.font=`${weight} ${size}px "Microsoft YaHei", "PingFang SC", sans-serif`;ctx.textAlign='left';ctx.textBaseline='alphabetic';
    lines.forEach((v,i)=>ctx.fillText(v,x,y+i*lineHeight));
  }
  function drawPill(x,y,label,on,color='#178563') {
    const w=Math.max(70,ctx.measureText(label).width+30);roundRect(x,y,w,30,15,on?'#e3f5ef':'#eef2f5',on?'#b6e1d1':'#e1e8ed');
    ctx.beginPath();ctx.arc(x+14,y+15,4,0,Math.PI*2);ctx.fillStyle=on?color:'#a7b4bd';ctx.fill();text(label,x+24,y+20,12,on?'#215c4b':'#627887','700');return w;
  }
  function drawFrame() {
    requestAnimationFrame(drawFrame);
    ctx.fillStyle='#edf3f8';ctx.fillRect(0,0,W,H);
    let source=null;
    try { source=iframe.contentDocument?.querySelector('#scene-host canvas'); } catch {}
    if(source&&source.width&&source.height){try{ctx.drawImage(source,0,0,STAGE_W,H);}catch{}}
    else {const g=ctx.createLinearGradient(0,0,STAGE_W,H);g.addColorStop(0,'#eff6fc');g.addColorStop(1,'#dfeaf3');ctx.fillStyle=g;ctx.fillRect(0,0,STAGE_W,H);}
    const state=api?.getState?.()||{level:5,mA:12,raw:5000,eng:5,pumpOn:false,valveOpen:false,alarm:'normal',alarmText:'正常'};
    const index=Math.max(0,sceneIndexAt(elapsed));const scene=scenes[index<0?scenes.length-1:index];
    // Title block
    roundRect(25,22,410,105,14,'rgba(255,255,255,.94)','rgba(38,75,101,.13)');
    text('PLC CONTROL · 3D TEACHING FILM',44,47,11,'#4e738b','700');
    text('水位数据链',44,78,25,'#18384e','800');
    text('模拟量采集 · 回差控制 · 报警',44,103,13,'#5a7485','600');
    // Live data panel
    ctx.fillStyle='#f8fafc';ctx.fillRect(PANEL_X,0,W-PANEL_X,H);ctx.fillStyle='#d9e4eb';ctx.fillRect(PANEL_X,0,1,H);
    text('PLC 水位控制',PANEL_X+22,47,20,'#18384e','800');text('实时工艺数据',PANEL_X+22,78,12,'#698191','700');
    let py=100;const rows=[['水箱液位',`${Number(state.level).toFixed(2)} m`],['LT-01 电流',`${Number(state.mA).toFixed(2)} mA`],['AI0 原始值',`${state.raw}`],['工程液位',`${Number(state.eng).toFixed(2)} m`]];
    rows.forEach((r,i)=>{roundRect(PANEL_X+18,py,350,48,8,i%2?'#f1f5f8':'#fff','#e6edf2');text(r[0],PANEL_X+31,py+30,13,'#607887','600');text(r[1],PANEL_X+350,py+30,16,'#1c3d52','800','right');py+=55;});
    text('控制输出',PANEL_X+22,py+22,12,'#698191','700');py+=35;
    const pumpOn=!!state.pumpOn, alarm=state.alarm||'normal';
    let px=PANEL_X+18;px+=drawPill(px,py,'Q0.0 '+(pumpOn?'ON':'OFF'),pumpOn,pumpOn?'#21845c':'#778a95')+8;
    px+=drawPill(px,py,'水泵 '+(pumpOn?'运行':'停止'),pumpOn,'#21845c')+8;
    drawPill(px,py,'阀 '+(state.valveOpen?'开':'关'),!!state.valveOpen,'#21845c');
    py+=52;const alarmColor=alarm==='normal'?'#27815c':'#c24537';
    roundRect(PANEL_X+18,py,350,45,9,alarm==='normal'?'#eff7f3':'#fff0ee',alarm==='normal'?'#d5eadf':'#f2c8c2');
    text('报警状态',PANEL_X+31,py+28,13,'#607887','600');text(state.alarmText||'正常',PANEL_X+350,py+28,15,alarmColor,'800','right');
    py+=67;text('信号与控制链',PANEL_X+22,py,12,'#698191','700');py+=13;
    const chain=['LT-01','AI0','原始值','工程量','阈值','Q0.0'];
    chain.forEach((label,i)=>{const x=PANEL_X+18+i*59;roundRect(x,py,54,30,7,i>=4?(pumpOn?'#e4f5ec':'#f0f3f5'):'#edf4f9',i>=4?(pumpOn?'#b4dfc7':'#e2e8ec'):'#d7e4ed');text(label,x+27,py+20,9,i>=4?(pumpOn?'#28694c':'#748792'):'#44667e','700','center');if(i<chain.length-1)text('›',x+56,py+20,14,'#8da1af','700','center');});
    py+=52;roundRect(PANEL_X+18,py,350,90,9,'#fff','#e4ebf0');
    text('量程换算',PANEL_X+31,py+22,11,'#647e8e','700');wrapText('I = 4 + 16 × L / 10 mA',PANEL_X+31,py+45,315,18,12,'#36566b','600',1);wrapText('L工程 = AI0 / 10000 × 10 m',PANEL_X+31,py+66,315,18,12,'#36566b','600',1);
    py+=105;roundRect(PANEL_X+18,py,350,123,9,'#f4f7f9','#e2e9ee');
    text('控制与报警规则',PANEL_X+31,py+22,11,'#647e8e','700');
    wrapText('≤4 m 启泵；≥8 m 停泵；4–8 m 保持原输出。',PANEL_X+31,py+47,320,17,11,'#36566b','600',2);
    wrapText('高报 9 m / 低报 1 m；回到 1–9 m 后手动复位。',PANEL_X+31,py+83,320,17,11,'#36566b','600',2);
    // Subtitle and timeline
    const capY=H-158;roundRect(25,capY,STAGE_W-50,136,15,'rgba(11,39,57,.95)','rgba(255,255,255,.28)');
    text(scene.title,50,capY+25,13,'#bed3df','700');text(`${fmt(elapsed)} / 01:24`,STAGE_W-50,capY+25,13,'#dbe8ef','700','right');
    wrapText(scene.text,50,capY+60,STAGE_W-100,34,23,'#f7fbfd','700',2);
    roundRect(50,capY+113,STAGE_W-100,4,2,'rgba(218,233,241,.22)',null);roundRect(50,capY+113,(STAGE_W-100)*(elapsed/TOTAL),4,2,'#54d3ad',null);
    if (window.__FILM_DRAW_READY !== true) window.__FILM_DRAW_READY=true;
  }
  function fmt(s){const n=Math.floor(s);return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
  function applyTime(t) {
    if(!apiReady())return;elapsed=Math.max(0,Math.min(TOTAL,t));let index=sceneIndexAt(elapsed);if(index<0)index=scenes.length-1;setSceneState(index);api.setLevel(levelForTime(index,elapsed));
    if(index===6&&elapsed>=60.5&&!highResetDone){api.setLevel(8.5);api.alarmReset();highResetDone=true;}
    if(index===7&&elapsed>=73.0&&!lowResetDone){api.setLevel(2);api.alarmReset();lowResetDone=true;}
    if(elapsed>=TOTAL){playing=false;const b=document.getElementById('play');if(b)b.textContent='重播';}
  }
  function tick(now){requestAnimationFrame(tick);if(!ready){apiReady();return;}if(playing)applyTime((now-startedAt)/1000);}
  function play(){if(!apiReady())return;if(elapsed>=TOTAL){elapsed=0;currentScene=-1;highResetDone=false;lowResetDone=false;finalResetDone=false;}playing=true;startedAt=performance.now()-elapsed*1000;document.getElementById('play').textContent='播放中';}
  function pause(){playing=false;document.getElementById('play').textContent='继续';}
  function restart(){elapsed=0;currentScene=-1;highResetDone=false;lowResetDone=false;finalResetDone=false;applyTime(0);play();}
  function startCapture(){
    if(!window.MediaRecorder||!filmCanvas.captureStream)throw new Error('当前浏览器不支持画布录制');
    const stream=filmCanvas.captureStream(30);const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm;codecs=vp8';
    recorderChunks=[];recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8000000});
    recorder.ondataavailable=e=>{if(e.data&&e.data.size)recorderChunks.push(e.data);};
    recorder.onstop=()=>{window.__FILM_BLOB=new Blob(recorderChunks,{type:'video/webm'});window.__FILM_CAPTURE_DONE=true;stream.getTracks().forEach(t=>t.stop());};
    window.__FILM_CAPTURE_DONE=false;recorder.start(1000);return mime;
  }
  function stopCapture(){return new Promise(resolve=>{if(!recorder||recorder.state==='inactive'){resolve();return;}recorder.addEventListener('stop',resolve,{once:true});recorder.stop();});}
  document.getElementById('play').addEventListener('click',play);document.getElementById('pause').addEventListener('click',pause);document.getElementById('restart').addEventListener('click',restart);
  window.WATER_FILM={play,pause,restart,setTime:applyTime,getTime:()=>elapsed,getReady:()=>ready,getScenes:()=>scenes,startCapture,stopCapture,getState:()=>api?.getState?.()||null};
  requestAnimationFrame(drawFrame);requestAnimationFrame(tick);
})();
