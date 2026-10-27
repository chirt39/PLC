(()=>{
  "use strict";
  const M=window.TROLLEY_MODEL;
  if(!M){console.error("台车模型接口尚未加载");return;}
  const TOTAL=64,STEP=1/60,PLAYBACK_RATE=Math.max(.5,Math.min(20,Number(new URLSearchParams(location.search).get("playbackRate"))||Number(new URLSearchParams(location.search).get("testRate"))||1));
  const sim=M.sim, plc=M.plc;
  const $=s=>document.querySelector(s);
  const hud=document.createElement("div");hud.id="lesson-hud";hud.innerHTML=`
    <div class="lesson-brand"><div class="eyebrow">PLC CONTROL · 3D TEACHING FILM</div><h1>台车自动往返控制</h1><p>启动保持 · 限位换向 · 原点计数 · 停止减速</p></div>
    <div class="lesson-status" id="lesson-status"><span class="dot"></span><span id="lesson-state">原点待机</span></div>
    <div class="state-row"><span class="coil-chip" id="coil-plc">PLC 运行</span><span class="coil-chip" id="coil-km1">KM1 正转</span><span class="coil-chip km2" id="coil-km2">KM2 反转</span><span class="coil-chip" id="limit-sq1">SQ1 前限位</span><span class="coil-chip" id="limit-sq2">SQ2 原点</span><span class="coil-chip" id="lesson-count">往返 0 次</span></div>
    <div class="lesson-caption"><div class="caption-head"><span id="caption-step">01 / 07 · 装置与原点</span><span class="time"><span id="clock">00:00</span> / 01:04</span></div><div class="caption-text" id="caption-text"></div><div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div></div>
    <div class="lesson-controls"><button class="lesson-control primary" id="lesson-play">▶ 播放</button><button class="lesson-control" id="lesson-pause" disabled>Ⅱ 暂停</button><button class="lesson-control" id="lesson-replay">↻ 重播</button></div>
    <div class="lesson-summary" id="lesson-summary">控制关系 <span data-part="sq1">SQ1 换向</span><span data-part="sq2">SQ2 计数</span><span data-part="km1">KM1 正转</span><span data-part="km2">KM2 反转</span></div>`;
  document.querySelector("#stage").appendChild(hud);
  const scenes=[
    {a:0,b:6,title:"01 / 07 · 装置与原点",text:"台车沿两条导轨往返运行。左端 SQ2 是原点，右端 SQ1 是前限位。"},
    {a:6,b:14,title:"02 / 07 · 启动与正转",text:"按下启动按钮后，运行命令保持，PLC 接通正转接触器 KM1。"},
    {a:14,b:24,title:"03 / 07 · 正向运行",text:"KM1 吸合驱动电动机正转，台车向右运行；KM2 保持断开，正反转互锁。"},
    {a:24,b:32,title:"04 / 07 · 前限位换向",text:"台车触发右端 SQ1，PLC 断开 KM1；互锁确认后接通 KM2，台车换向。"},
    {a:32,b:44,title:"05 / 07 · 返回与计数",text:"KM2 驱动台车向左返回；触发原点 SQ2 时，完成一次往返，计数加一。"},
    {a:44,b:56,title:"06 / 07 · 停止与减速",text:"台车完成原点计数后再次右行。按下停止按钮，KM1、KM2 断开，台车减速停稳。"},
    {a:56,b:64,title:"07 / 07 · 控制关系总结",text:"SQ1 负责右端换向，SQ2 负责原点计数与换向；KM1 和 KM2 不会同时吸合。"}
  ];
  let elapsed=0,last=0,accumulator=0,playing=false,done=false,startEvent=false,stopEvent=false;
  function setInitial(){
    M.setMode("assembled");M.goToView("iso",false);
    sim.positionX=-3.3;sim.velocity=0;sim.direction=1;sim.lastDirection=1;sim.commandRunning=false;sim.phase="idle";sim.dwellTimer=0;sim.nextDirection=1;sim.rightVisited=false;sim.count=0;sim.pendingStart=false;sim.hasRun=false;sim.pressStart=0;sim.pressStop=0;sim.speedScale=.23;
    plc.inputs.SB1=false;plc.inputs.SB2=false;plc.inputs.SQ1=false;plc.inputs.SQ2=true;
    M.resetCycleCount();M.advanceSimulation(.016,.016);
  }
  function start(){if(playing)return;if(done){replay();return;}playing=true;last=performance.now();$("#lesson-play").textContent="▶ 继续";$("#lesson-pause").disabled=false;}
  function pause(){if(!playing)return;playing=false;$("#lesson-play").textContent="▶ 继续";$("#lesson-pause").disabled=true;}
  function replay(){playing=false;done=false;elapsed=0;last=0;accumulator=0;startEvent=false;stopEvent=false;setInitial();$("#lesson-play").textContent="▶ 播放";$("#lesson-pause").disabled=true;renderHud(0);}
  function events(t){
    if(t>=6&&!startEvent){sim.speedScale=.23;M.requestStart();startEvent=true;}
    if(t>=44.0){sim.speedScale=.42;}
    if(t>=50.8&&!stopEvent){M.requestStop();stopEvent=true;}
  }
  function shouldHold(t){return (sim.phase==="dwellRight"&&t<26)||(sim.phase==="dwellLeft"&&t<44);}
  function renderHud(t){document.body.classList.toggle("summary-on",t>=56);
    let i=scenes.findIndex(s=>t>=s.a&&t<s.b);if(i<0)i=scenes.length-1;const s=scenes[i];
    $("#caption-step").textContent=s.title;$("#caption-text").textContent=s.text;
    $("#clock").textContent=`${String(Math.floor(t/60)).padStart(2,"0")}:${String(Math.floor(t%60)).padStart(2,"0")}`;
    $("#progress-fill").style.width=`${Math.min(100,t/TOTAL*100)}%`;
    const phase=sim.phase;let label="原点待机";
    if(phase==="forward")label="正转运行 · 台车向右";
    else if(phase==="reverse")label="反转运行 · 台车向左";
    else if(phase==="dwellRight")label="SQ1 触发 · 正在换向";
    else if(phase==="dwellLeft")label="SQ2 触发 · 往返计数 +1";
    else if(phase==="stopping"||sim.velocity>.01)label="停止输出 · 台车减速中";
    else if(sim.hasRun||sim.count>0)label="已停止 · 等待启动";
    $("#lesson-state").textContent=label;$("#lesson-status").classList.toggle("active",sim.commandRunning||sim.velocity>.01);
    $("#coil-plc").classList.toggle("on",!!plc.outputs.RUN);
    $("#coil-km1").classList.toggle("on",!!plc.outputs.KM1);
    $("#coil-km2").classList.toggle("on",!!plc.outputs.KM2);
    $("#limit-sq1").classList.toggle("on",!!plc.inputs.SQ1);
    $("#limit-sq2").classList.toggle("on",!!plc.inputs.SQ2);
    $("#lesson-count").textContent=`往返 ${sim.count} 次`;
    document.querySelectorAll(".lesson-summary span").forEach((el,j)=>el.classList.toggle("glow",t>=56&&Math.floor((t-56)/2)%4===j));
  }
  function tick(now){requestAnimationFrame(tick);if(!playing)return;const dt=Math.max(0,(now-last)/1000*PLAYBACK_RATE);last=now;accumulator+=dt;while(accumulator>=STEP&&elapsed<TOTAL){elapsed=Math.min(TOTAL,elapsed+STEP);events(elapsed);if(!shouldHold(elapsed))M.stepSimulation(STEP);accumulator-=STEP;}
    renderHud(elapsed);
    if(elapsed>=TOTAL){playing=false;done=true;setTimeout(stopCapture,350);$("#lesson-play").textContent="▶ 重播";$("#lesson-pause").disabled=true;window.__LESSON_RENDER_DONE=true;}
  }
  $("#lesson-play").addEventListener("click",start);$("#lesson-pause").addEventListener("click",pause);$("#lesson-replay").addEventListener("click",replay);

  let composite=null,compositeCtx=null,recorder=null,captureChunks=[];
  const C_W=1920,C_H=1080;
  function rr(c,x,y,w,h,r,fill,stroke){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.stroke()}}
  function text(c,value,x,y,size,color,weight='600'){c.font=weight+' '+size+'px "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';c.fillStyle=color;c.fillText(value,x,y)}
  function drawCallouts(c){const stage=$('#stage').getBoundingClientRect();c.save();c.setLineDash([3,3]);c.lineWidth=1;c.strokeStyle='rgba(29,50,60,.55)';document.querySelectorAll('#leader-svg .leader-line').forEach(el=>{if(getComputedStyle(el).display==='none')return;const d=el.getAttribute('d');if(!d)return;try{c.stroke(new Path2D(d))}catch{}});c.setLineDash([]);document.querySelectorAll('#leader-svg .leader-dot').forEach(el=>{if(getComputedStyle(el).display==='none')return;const x=Number(el.getAttribute('cx')),y=Number(el.getAttribute('cy'));if(!Number.isFinite(x)||!Number.isFinite(y))return;c.beginPath();c.arc(x,y,2.5,0,Math.PI*2);c.fillStyle=getComputedStyle(el).fill||'#d78b15';c.fill();c.lineWidth=1;c.strokeStyle='rgba(255,255,255,.95)';c.stroke()});document.querySelectorAll('#callout-layer .callout').forEach(el=>{if(getComputedStyle(el).display==='none')return;const r=el.getBoundingClientRect(),x=r.left-stage.left,y=r.top-stage.top,w=r.width,h=r.height;if(w<2||h<2)return;rr(c,x,y,w,h,8,'rgba(253,253,250,.96)','rgba(29,50,60,.16)');rr(c,x,y,3,h,1,getComputedStyle(el).getPropertyValue('--tone').trim()||'#d78b15');const title=el.querySelector('.callout__title'),code=el.querySelector('.callout__code'),note=el.querySelector('.callout__note');const titleText=title?Array.from(title.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join(''):el.textContent;text(c,titleText.trim().replace(/\s+/g,' '),x+10,y+17,10,'#243a49','700');if(code)text(c,code.textContent.trim(),x+w-31,y+17,9,'#b55a2a','800');if(note)text(c,note.textContent.trim(),x+10,y+h-7,9,'#617583','500')});c.restore()}
  function drawComposite(){if(!composite)return;const c=compositeCtx,canvas=$('#viewport');c.clearRect(0,0,C_W,C_H);c.fillStyle='#eaf1f4';c.fillRect(0,0,C_W,C_H);try{c.drawImage(canvas,0,0,C_W,C_H)}catch{}drawCallouts(c);
    const bg=c.createLinearGradient(0,0,0,C_H);bg.addColorStop(0,'rgba(13,41,57,.12)');bg.addColorStop(.22,'rgba(13,41,57,0)');bg.addColorStop(.75,'rgba(13,41,57,0)');bg.addColorStop(1,'rgba(13,41,57,.15)');c.fillStyle=bg;c.fillRect(0,0,C_W,C_H);
    rr(c,42,30,390,106,14,'rgba(255,255,255,.91)','rgba(49,83,103,.16)');text(c,'PLC CONTROL · 3D TEACHING FILM',62,57,12,'#47718a','700');text(c,'台车自动往返控制',62,88,26,'#16364d','800');text(c,'启动保持 · 限位换向 · 原点计数 · 停止减速',62,116,14,'#567081','600');
    let label='原点待机';if(sim.phase==='forward')label='正转运行 · 台车向右';else if(sim.phase==='reverse')label='反转运行 · 台车向左';else if(sim.phase==='dwellRight')label='SQ1 触发 · 正在换向';else if(sim.phase==='dwellLeft')label='SQ2 触发 · 往返计数 +1';else if(sim.phase==='stopping'||sim.velocity>.01)label='停止输出 · 台车减速中';else if(sim.hasRun||sim.count>0)label='已停止 · 等待启动';
    const chip=(x,y,w,txt,on,color='#12845a')=>{rr(c,x,y,w,36,18,on?'rgba(230,247,237,.96)':'rgba(255,255,255,.9)',on?'rgba(18,132,90,.38)':'rgba(49,83,103,.16)');c.beginPath();c.arc(x+14,y+18,4,0,Math.PI*2);c.fillStyle=on?color:'#99a8af';c.fill();text(c,txt,x+24,y+23,13,on?'#146647':'#617583','800')};
    const statusW=Math.min(390,Math.max(240,label.length*16+52));chip(C_W-42-statusW,30,statusW,label,true,'#18a56a');
    let x=C_W-42-650;const y=82;chip(x,y,88,'PLC 扫描',!!plc.outputs.RUN);x+=96;chip(x,y,105,'KM1 正转',!!plc.outputs.KM1);x+=113;chip(x,y,105,'KM2 反转',!!plc.outputs.KM2,'#d78b15');x+=113;chip(x,y,108,'SQ1 前限位',!!plc.inputs.SQ1);x+=116;chip(x,y,98,'SQ2 原点',!!plc.inputs.SQ2);x+=106;chip(x,y,94,'往返 '+sim.count+' 次',sim.count>0);
    let sceneIndex=scenes.findIndex(a=>elapsed>=a.a&&elapsed<a.b);if(sceneIndex<0)sceneIndex=scenes.length-1;const scene=scenes[sceneIndex];const boxW=1120,boxH=116,bx=(C_W-boxW)/2,by=C_H-boxH-35;rr(c,bx,by,boxW,boxH,16,'rgba(14,37,53,.93)','rgba(255,255,255,.08)');text(c,scene.title,bx+24,by+28,13,'#a9c8d7','800');const clockText=String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(Math.floor(elapsed%60)).padStart(2,'0')+' / 01:04';c.textAlign='right';text(c,clockText,bx+boxW-24,by+28,13,'#d9edf6','700');c.textAlign='left';c.font='600 22px "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';c.fillStyle='#fff';const words=scene.text;let line='',lines=[],max=boxW-50;for(const ch of words){const next=line+ch;if(c.measureText(next).width>max&&line){lines.push(line);line=ch}else line=next}if(line)lines.push(line);lines.slice(0,2).forEach((v,i)=>text(c,v,bx+24,by+62+i*29,22,'#fff','600'));rr(c,bx+24,by+boxH-14,boxW-48,4,2,'rgba(255,255,255,.18)');rr(c,bx+24,by+boxH-14,(boxW-48)*Math.min(1,elapsed/TOTAL),4,2,'#42c39b');
    if(elapsed>=56){const labels=['SQ1 换向','SQ2 计数','KM1 正转','KM2 反转'];let sx=C_W-42-468,sy=C_H-210;rr(c,sx-12,sy-10,480,48,12,'rgba(255,255,255,.89)','rgba(49,83,103,.14)');text(c,'控制关系',sx,sy+20,12,'#537082','700');sx+=78;labels.forEach((v,i)=>{const w=88,active=Math.floor((elapsed-56)/2)%4===i;rr(c,sx,sy,w,28,8,active?'#e8f5ff':'rgba(19,64,88,.08)',active?'rgba(38,143,203,.22)':null);text(c,v,sx+8,sy+19,11,active?'#0c6096':'#627989','700');sx+=94;});}
  }
  function compositeLoop(){if(!composite)return;drawComposite();requestAnimationFrame(compositeLoop)}
  function startCapture(){if(recorder)return;composite=document.createElement('canvas');window.__LESSON_COMPOSITE_CANVAS=composite;composite.width=C_W;composite.height=C_H;compositeCtx=composite.getContext('2d');const stream=composite.captureStream(30);const mimeType=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!mimeType)throw new Error('WebM recording is not supported in this browser');recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:12000000});captureChunks=[];window.__LESSON_CAPTURE_DONE=false;window.__LESSON_RECORDER=recorder;recorder.onerror=e=>window.__LESSON_CAPTURE_ERROR=String(e.error||e.message||e);recorder.ondataavailable=e=>{if(e.data&&e.data.size)captureChunks.push(e.data)};recorder.onstop=()=>{window.__LESSON_CAPTURE_BLOB=new Blob(captureChunks,{type:mimeType});window.__LESSON_CAPTURE_DONE=true};recorder.start(1000);requestAnimationFrame(compositeLoop);}
  function stopCapture(){if(recorder&&recorder.state==='recording')recorder.stop()}

  window.__LESSON_RENDER_DONE=false;window.__LESSON_FILM={play:start,pause,replay,getTime:()=>elapsed,getState:()=>M.getDebug(),startCapture,stopCapture};
  setInitial();renderHud(0);requestAnimationFrame(tick);
  if(new URLSearchParams(location.search).has("render")){document.body.classList.add("lesson-render");setTimeout(()=>{startCapture();start();},600);}
})();





