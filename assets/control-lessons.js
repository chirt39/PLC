"use strict";
(() => {
  const DURATION = 15;
  const C = { ink: "#183c45", muted: "#657b80", line: "#dfe7e2", paper: "#f8f9f4", teal: "#008579", pale: "#e4f3ec", orange: "#dc6430", warm: "#fff0e5", blue: "#527da0", bluePale: "#e9f0f5", white: "#fff" };
  const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const n = (v) => Number(v.toFixed(2));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const txt = (x, y, value, size = 32, color = C.ink, weight = 400, anchor = "start") => `<text x="${n(x)}" y="${n(y)}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${esc(value)}</text>`;
  const line = (x1, y1, x2, y2, color = C.line, width = 2, extra = "") => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
  const path = (d, color, width = 5, extra = "") => `<path d="${d}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const rect = (x, y, w, h, fill, radius = 14, stroke = "none") => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  const dot = (x, y, r, color) => `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${color}"/>`;

  const lessons = {
    contacts: {
      number: "12",
      duration: 28,
      title: "常开/常闭触点与线圈逻辑",
      question: "按钮松开和按下时，常开、常闭支路分别会怎样变化？",
      description: "先看输入信号，再用较慢节奏对照两条支路和输出线圈。",
      note: "常开、常闭在这里是 PLC 程序的判断规则，不表示按钮内部的金属触点结构。",
      labels: [
        { start: 0, end: 4, text: "先看按钮松开：输入信号为 0，表示当前没有信号。" },
        { start: 4, end: 11, text: "输入为 0：常开支路断开，线圈 A 失电；常闭支路接通，线圈 B 得电。" },
        { start: 11, end: 19, text: "按下按钮，输入变为 1：常开支路接通、线圈 A 得电；常闭支路断开、线圈 B 失电。" },
        { start: 19, end: 24, text: "松开按钮，输入回到 0：两条支路恢复到刚才的状态。" },
        { start: 24, end: 28, text: "记住：常开判断输入为 1，常闭判断输入为 0；线圈看支路是否接通。" }
      ]
    },
    jog: {
      number: "13",
      duration: 30,
      title: "点动与长动控制",
      question: "松开按钮后，电动机什么时候停止，什么时候继续运行？",
      description: "前10秒看点动：松开即停；后20秒看长动：启动支路如何转为自锁保持。",
      note: "前10秒演示点动，后20秒分步展示长动：启动使 KM 线圈得电，辅助常开触点闭合并联保持，按停止后自锁解除。",
      labels: [
        { start: 0, end: 2, text: "点动｜初始状态：SB1 松开，常开触点断开，KM 线圈失电，电动机停止。" },
        { start: 2, end: 4, text: "按住 SB1：常开触点闭合，回路接通，KM 线圈得电，电动机运行。" },
        { start: 4, end: 6, text: "松开 SB1：触点立即断开，KM 线圈失电，电动机停止。" },
        { start: 6, end: 8, text: "再次按住 SB1，回路再次接通，电动机重新运行。" },
        { start: 8, end: 10, text: "再次松开，电动机停止。点动必须持续按住按钮。" },
        { start: 10, end: 12, text: "长动｜初始状态：停止触点闭合，启动和自锁触点断开，KM 失电。" },
        { start: 12, end: 14, text: "按下启动 SB1：电流先经过停止触点和启动触点，KM 线圈得电。" },
        { start: 14, end: 17, text: "KM 线圈得电后，辅助常开触点闭合，与启动支路并联，形成保持支路。" },
        { start: 17, end: 21, text: "松开 SB1：启动支路断开，电流改经 KM 辅助触点，线圈仍得电。" },
        { start: 21, end: 24, text: "按下停止 SB0：串联常闭触点断开，KM 线圈失电，自锁触点随之断开。" },
        { start: 24, end: 26, text: "松开停止按钮后，停止触点复位；启动支路仍断开，电动机保持停止。" },
        { start: 26, end: 28, text: "再次按下启动：KM 线圈重新得电，辅助常开触点再次闭合。" },
        { start: 28, end: 30, text: "松开启动：电流由辅助触点保持。长动的关键是启动后形成了并联保持支路。" }
      ]
    }
  };

  function button(x, y, pressed, label, color = C.orange) {
    const depression = pressed ? 20 : 0;
    const downColor = color === C.teal ? "#006d63" : "#b85227";
    const topColor = color === C.teal ? "#51b5a8" : "#f09b6e";
    return rect(x - 72, y + 38, 144, 72, "#dde7e0", 18, "#c2d3c9") +
      `<ellipse cx="${x}" cy="${y + 43}" rx="59" ry="19" fill="#a9bdb1"/>` +
      rect(x - 53, y - 2 + depression, 106, 48 - depression * 0.5, pressed ? downColor : color, 11) +
      `<ellipse cx="${x}" cy="${n(y - 2 + depression)}" rx="53" ry="20" fill="${pressed ? topColor : color}"/>` +
      txt(x, y + 145, label, 26, pressed ? color : C.muted, 600, "middle");
  }

  function contact(x, y, kind, active, color) {
    const c = active ? color : "#91a19b";
    let out = line(x - 42, y, x - 8, y, active ? color : C.line, 5);
    out += line(x + 32, y, x + 62, y, active ? color : C.line, 5);
    out += line(x - 8, y - 31, x - 8, y + 31, c, 5);
    out += line(x + 32, y - 31, x + 32, y + 31, c, 5);
    if (kind === "NC") out += line(x - 15, y + 29, x + 39, y - 29, c, 4);
    return out;
  }

  function coil(x, y, active, color, label) {
    const c = active ? color : "#91a19b";
    return path(`M${x - 40} ${y}H${x - 24}M${x + 24} ${y}H${x + 40}`, c, 5) +
      `<path d="M${x - 23} ${y - 23}C${x - 4} ${y - 23},${x - 4} ${y + 23},${x - 23} ${y + 23}M${x + 23} ${y - 23}C${x + 4} ${y - 23},${x + 4} ${y + 23},${x + 23} ${y + 23}" fill="none" stroke="${c}" stroke-width="5"/>` +
      txt(x, y + 62, label, 24, C.muted, 500, "middle");
  }

  function motor(x, y, running, phase) {
    const shell = running ? C.pale : "#edf1ed";
    const color = running ? C.teal : "#a8b5af";
    const rotation = running ? phase * 95 : 0;
    return `<g><rect x="${x - 76}" y="${y - 58}" width="152" height="116" rx="22" fill="${shell}" stroke="#c2d3c9" stroke-width="3"/><path d="M${x - 54} ${y - 48}V${y + 48}M${x + 54} ${y - 48}V${y + 48}" stroke="#a9bdb1" stroke-width="6"/><circle cx="${x}" cy="${y}" r="34" fill="${C.white}" stroke="${color}" stroke-width="5"/><g transform="rotate(${n(rotation)} ${x} ${y})" fill="${color}"><path d="M${x - 8} ${y - 7}L${x - 4} ${y - 29}Q${x} ${y - 36} ${x + 4} ${y - 29}L${x + 8} ${y - 7}Z"/><path d="M${x - 8} ${y - 7}L${x - 4} ${y - 29}Q${x} ${y - 36} ${x + 4} ${y - 29}L${x + 8} ${y - 7}Z" transform="rotate(120 ${x} ${y})"/><path d="M${x - 8} ${y - 7}L${x - 4} ${y - 29}Q${x} ${y - 36} ${x + 4} ${y - 29}L${x + 8} ${y - 7}Z" transform="rotate(240 ${x} ${y})"/></g><circle cx="${x}" cy="${y}" r="7" fill="${color}"/></g>`;
  }

  function frame(config, t, body, footer) {
    const label = config.labels.find((item) => t >= item.start && t < item.end)?.text ?? config.labels.at(-1).text;
    const duration = config.duration ?? DURATION;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="${esc(config.title)}" style="font-family:'Noto Sans SC',sans-serif">` +
      rect(0, 0, 1920, 1080, C.paper, 0) +
      txt(96, 70, "PLC 应用技术", 25, C.muted, 500) +
      (duration === 30 ? txt(1460, 70, t < 10 ? "第一段 · 点动" : "第二段 · 长动自锁", 22, C.teal, 600, "middle") : "") +
      txt(1824, 70, `微动画 ${config.number} / ${duration} 秒`, 25, C.muted, 400, "end") +
      txt(96, 157, config.title, 54, C.ink, 700) + line(96, 199, 1824, 199) +
      body +
      rect(96, 880, 1728, 110, C.ink, 18) + txt(960, 949, label, 38, C.white, 500, "middle") +
      txt(96, 1041, footer, 25, C.muted, 400) +
      rect(1390, 1026, 434, 5, "#dce6df", 2) + rect(1390, 1026, 434 * t / duration, 5, C.teal, 2) +
      (duration === 30 ? line(1607, 1018, 1607, 1038, C.muted, 2) : "") +
      "</svg>";
  }

  function contactScene(t) {
    const input = t >= 11 && t < 19 ? 1 : 0;
    const noOn = input === 1;
    const ncOn = input === 0;
    const pressed = input === 1;
    const action = pressed ? "按钮按下" : "按钮松开";
    let body = rect(100, 260, 300, 535, "#ffffff", 18, C.line) +
      txt(250, 320, "按钮输入", 34, C.ink, 600, "middle") +
      txt(250, 380, "输入信号：" + input, 32, input ? C.orange : C.muted, 600, "middle") +
      button(250, 470, pressed, action) +
      txt(250, 700, "0 = 无信号　1 = 有信号", 21, C.muted, 500, "middle") +
      txt(250, 742, input ? "按钮按下 · 有信号" : "按钮松开 · 无信号", 21, input ? C.orange : C.muted, 600, "middle") +
      line(410, 520, 465, 520, input ? C.orange : "#baccc2", 4) + path("M453 511L465 520L453 529", input ? C.orange : "#baccc2", 4);
    body += rect(470, 260, 1350, 535, "#ffffff", 18, C.line) + txt(540, 320, "PLC 程序里的两条判断支路", 31, C.ink, 600) +
      txt(1750, 320, input ? "当前：有信号" : "当前：无信号", 21, input ? C.orange : C.muted, 600, "end");
    body += line(565, 365, 565, 720, "#91a19b", 5);

    const drawRung = (y, kind, active, outputLabel, outputX, color) => {
      let g = txt(625, y - 54, kind === "NO" ? "常开：输入为1时接通" : "常闭：输入为0时接通", 25, color, 600);
      g += line(565, y, 700, y, active ? color : C.line, 5);
      g += contact(742, y, kind, active, color);
      g += line(804, y, 1324, y, active ? color : C.line, 5);
      if (active) g += dot(965 + ((t * 55) % 280), y, 8, color);
      g += coil(1385, y, active, color, outputLabel);
      g += line(1425, y, 1570, y, active ? color : C.line, 5);
      g += `<circle cx="${outputX}" cy="${y}" r="46" fill="${active ? (kind === "NO" ? C.pale : C.bluePale) : "#edf1ed"}" stroke="${active ? color : "#cbd5ce"}" stroke-width="4"/>`;
      g += txt(outputX, y + 11, active ? "得电" : "失电", 21, active ? color : C.muted, 700, "middle");
      g += txt(outputX, y + 77, outputLabel, 23, C.muted, 500, "middle");
      return g;
    };
    body += drawRung(470, "NO", noOn, "输出线圈 A", 1665, C.teal);
    body += drawRung(675, "NC", ncOn, "输出线圈 B", 1665, C.blue);
    body += txt(742, 540, "判断输入 = 1", 21, C.muted, 500, "middle") + txt(742, 745, "判断输入 = 0", 21, C.muted, 500, "middle");
    body += txt(1780, 828, "接通 → 得电　断开 → 失电", 21, C.muted, 400, "end");
    return frame(config, t, body, "图中的常开、常闭是程序判断规则，不是按钮内部触点结构。");
  }

  function jogScene(t) {
    if (t >= 10) return continuousScene(t - 10);
    const pressed = (t >= 2 && t < 4) || (t >= 6 && t < 8);
    const phase = t;
    const stateColor = pressed ? C.teal : C.muted;
    let body = rect(90, 250, 430, 590, "#ffffff", 18, C.line) +
      rect(555, 250, 1275, 590, "#ffffff", 18, C.line);
    body += txt(130, 315, "操作按钮", 31, C.ink, 600) +
      button(305, 470, pressed, pressed ? "按住" : "松开") +
      txt(305, 690, `SB1：${pressed ? "按下" : "松开"}`, 29, stateColor, 600, "middle") +
      txt(305, 738, "常开按钮", 23, C.muted, 400, "middle");

    body += txt(610, 315, "点动控制回路", 31, C.ink, 600) +
      txt(610, 360, "按钮与 KM 线圈串联；回路没有自锁支路。", 23, C.muted);
    const y = 500;
    body += line(680, 395, 680, 655, "#91a19b", 5) +
      line(680, y, 875, y, pressed ? C.teal : C.line, 6) +
      contact(920, y, "NO", pressed, C.teal) +
      txt(920, 565, "SB1", 24, C.muted, 500, "middle") +
      line(982, y, 1260, y, pressed ? C.teal : C.line, 6) +
      coil(1305, y, pressed, C.teal, "KM 线圈") +
      line(1345, y, 1515, y, pressed ? C.teal : C.line, 6);
    if (pressed) body += dot(1080 + ((t * 150) % 150), y, 9, C.teal);
    body += rect(1515, 430, 245, 140, pressed ? C.pale : "#f0f3ef", 18, pressed ? C.teal : C.line) +
      txt(1637, 485, pressed ? "得电" : "失电", 31, pressed ? C.teal : C.muted, 650, "middle") +
      txt(1637, 535, "KM 线圈状态", 22, C.muted, 400, "middle") +
      line(1637, 570, 1637, 605, pressed ? C.teal : "#a8b5af", 5) +
      motor(1637, 690, pressed, phase) +
      txt(1637, 790, pressed ? "电动机运行" : "电动机停止", 26, stateColor, 600, "middle");
    return frame(config, t, body, "第一段 · 点动：回路没有保持支路，SB1 必须持续按住；松开后 KM 线圈立即失电。");
  }

  function continuousScene(t) {
    const startPressed = (t >= 2 && t < 7) || (t >= 16 && t < 18);
    const stopPressed = t >= 11 && t < 14;
    const running = (t >= 2 && t < 11) || t >= 16;
    const auxClosed = (t >= 4 && t < 11) || t >= 17;
    const phase = t + 10;
    let body = rect(70, 250, 405, 590, "#ffffff", 18, C.line) +
      rect(510, 250, 1320, 590, "#ffffff", 18, C.line);
    body += txt(110, 315, "操作按钮", 31, C.ink, 600) +
      button(190, 420, stopPressed, "停止 SB0", C.orange) +
      button(190, 625, startPressed, "启动 SB1", C.teal) +
      txt(380, 470, stopPressed ? "断开" : "闭合", 22, stopPressed ? C.orange : C.teal, 550, "middle") +
      txt(380, 505, "停止常闭", 18, C.muted, 400, "middle") +
      txt(380, 675, startPressed ? "已按下" : "松开", 22, startPressed ? C.teal : C.muted, 550, "middle") +
      txt(380, 710, "启动常开", 18, C.muted, 400, "middle");

    body += txt(560, 315, "长动控制回路", 31, C.ink, 600) +
      txt(560, 360, "同一接触器 KM 内机械联动：线圈得电→辅助常开触点闭合；SB1 与其并联，SB0 串联。", 20, C.muted);
    const y = 510, top = 430, bottom = 590;
    const pathOn = running && !stopPressed;
    const c = pathOn ? C.teal : C.line;
    body += line(620, 390, 620, 670, "#91a19b", 5) +
      line(620, y, 700, y, stopPressed ? C.line : pathOn ? C.teal : C.line, 6) +
      contact(745, y, "NC", !stopPressed, C.teal) +
      txt(745, 580, "SB0 停止", 22, C.muted, 500, "middle") +
      line(807, y, 875, y, c, 6) +
      line(875, top, 875, bottom, c, 6) +
      line(875, top, 950, top, startPressed ? C.teal : C.line, 6) +
      contact(995, top, "NO", startPressed, C.teal) +
      txt(995, 390, "SB1 启动", 22, C.muted, 500, "middle") +
      line(1057, top, 1130, top, startPressed ? C.teal : C.line, 6) +
      line(875, bottom, 950, bottom, auxClosed ? C.teal : C.line, 6) +
      contact(995, bottom, "NO", auxClosed, C.teal) +
      txt(995, 650, "KM 辅助触点", 21, C.muted, 500, "middle") +
      line(1057, bottom, 1130, bottom, auxClosed ? C.teal : C.line, 6) +
      line(1130, top, 1130, bottom, pathOn ? C.teal : C.line, 6) +
      line(1130, y, 1200, y, pathOn ? C.teal : C.line, 6) +
      coil(1245, y, pathOn, C.teal, "KM 线圈") +
      line(1285, y, 1420, y, pathOn ? C.teal : C.line, 6);
    if (pathOn) body += dot(1138 + ((t * 140) % 110), y, 9, C.teal);
    body += rect(1420, 440, 330, 140, pathOn ? C.pale : "#f0f3ef", 18, pathOn ? C.teal : C.line) +
      txt(1585, 495, pathOn ? "线圈得电" : "线圈失电", 30, pathOn ? C.teal : C.muted, 650, "middle") +
      txt(1585, 542, "KM 状态", 22, C.muted, 400, "middle") +
      line(1585, 580, 1585, 610, pathOn ? C.teal : "#a8b5af", 5) +
      motor(1585, 690, pathOn, phase) +
      txt(1585, 790, pathOn ? "电动机运行" : "电动机停止", 26, pathOn ? C.teal : C.muted, 600, "middle");
    if (t >= 2 && t < 4) body += rect(770, 700, 580, 58, C.pale, 12) + txt(1060, 739, "按下启动 · KM 线圈吸合", 22, C.teal, 550, "middle");
    else if (t >= 4 && t < 7) body += rect(770, 700, 580, 58, C.pale, 12) + txt(1060, 739, "线圈吸合 · 同一接触器触点随之闭合", 20, C.teal, 550, "middle");
    else if (t >= 7 && t < 11) body += rect(770, 700, 580, 58, C.pale, 12) + txt(1060, 739, "松开启动 · 辅助触点继续给线圈供电", 20, C.teal, 550, "middle");
    else if (stopPressed) body += rect(770, 700, 580, 58, C.warm, 12) + txt(1060, 739, "线圈失电 · 辅助触点复位断开 · 自锁解除", 19, C.orange, 550, "middle");
    else if (t >= 14 && t < 16) body += rect(770, 700, 580, 58, C.bluePale, 12) + txt(1060, 739, "停止触点复位，但启动支路断开，电机仍停止", 19, C.blue, 550, "middle");
    else if (t >= 16 && t < 18) body += rect(770, 700, 580, 58, C.pale, 12) + txt(1060, 739, "再次启动 · 线圈吸合，辅助触点随之闭合", 19, C.teal, 550, "middle");
    else if (t >= 18 && t < 20) body += rect(770, 700, 580, 58, C.pale, 12) + txt(1060, 739, "松开启动 · 辅助触点继续给线圈供电", 19, C.teal, 550, "middle");
    return frame(config, t + 10, body, "第二段 · 长动：启动触点先使 KM 得电，KM 辅助常开触点闭合后形成并联保持支路；按停止断开总回路，解除自锁。");
  }

  const key = document.body.dataset.controlLesson;
  const config = lessons[key];
  const duration = config.duration ?? DURATION;
  const stage = document.querySelector("#stage");
  const toggle = document.querySelector("#toggle");
  const restart = document.querySelector("#restart");
  const timer = document.querySelector("#timer");
  const progress = document.querySelector("#progress");
  const fullscreen = document.querySelector("#fullscreen");
  const stillTime = new URLSearchParams(location.search).get("t");
  let seconds = stillTime === null ? 0 : clamp(Number(stillTime) || 0, 0, duration);
  let playing = stillTime === null && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  let previous = performance.now();
  let handle = 0;
  function paint() {
    stage.innerHTML = key === "contacts" ? contactScene(seconds) : jogScene(seconds);
    stage.dataset.time = seconds.toFixed(3);
    timer.textContent = `${Math.min(duration, Math.floor(seconds)).toString().padStart(2, "0")} / ${duration} s`;
    progress.style.width = `${seconds / duration * 100}%`;
    toggle.textContent = playing ? "暂停" : seconds >= duration ? "再看一遍" : "播放";
    toggle.setAttribute("aria-label", playing ? "暂停动画" : seconds >= duration ? "重播动画" : "播放动画");
    restart.hidden = seconds >= duration;
    const status = document.querySelector("#play-status");
    if (status) status.textContent = seconds >= duration ? "已结束 · 停留在结论" : "无声 · 自动演示";
  }
  function tick(now) {
    if (playing && !document.hidden) {
      seconds = Math.min(duration, seconds + Math.max(0, now - previous) / 1000);
      if (seconds >= duration) playing = false;
    }
    previous = now;
    paint();
    if (playing && !document.hidden) handle = requestAnimationFrame(tick);
  }
  function begin() {
    cancelAnimationFrame(handle);
    previous = performance.now();
    paint();
    if (playing && !document.hidden) handle = requestAnimationFrame(tick);
  }
  toggle.addEventListener("click", () => { if (seconds >= duration) seconds = 0; playing = !playing; begin(); });
  restart.addEventListener("click", () => { seconds = 0; playing = true; begin(); });
  if (fullscreen && !document.fullscreenEnabled) fullscreen.hidden = true;
  fullscreen?.addEventListener("click", async () => {
    const viewer = document.querySelector(".viewer");
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await viewer?.requestFullscreen(); }
    catch { fullscreen.textContent = "全屏不可用"; }
  });
  document.addEventListener("fullscreenchange", () => { if (fullscreen) fullscreen.textContent = document.fullscreenElement ? "退出全屏" : "全屏"; });
  document.addEventListener("visibilitychange", begin);
  begin();
  void document.fonts?.load('500 24px "Noto Sans SC"').catch(() => {});
})();
