"use strict";
(() => {
  const DURATION = 36;
  const C = { ink: "#183c45", muted: "#657b80", line: "#dfe7e2", paper: "#f8f9f4", teal: "#008579", pale: "#e4f3ec", orange: "#dc6430", warm: "#fae8d8", blue: "#527da0", bluePale: "#e9f0f5", white: "#fff", dark: "#202b2e", red: "#bd5340" };
  const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const n = (v) => Number(v.toFixed(2));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const txt = (x, y, value, size = 24, color = C.ink, weight = 400, anchor = "start") => `<text x="${n(x)}" y="${n(y)}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${esc(value)}</text>`;
  const line = (x1, y1, x2, y2, color = C.line, width = 2, extra = "") => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
  const path = (d, color, width = 4, extra = "") => `<path d="${d}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const rect = (x, y, w, h, fill, radius = 12, stroke = "none", sw = 2) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const circle = (x, y, r, fill, stroke = "none", sw = 2) => `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const phases = [
    { start: 0, end: 4, text: "初始：台车停在左端原点，SQ2动作，KM1和KM2均断开。" },
    { start: 4, end: 10, text: "按下启动，RUN置位，KM1正转；台车向右运行并离开原点。" },
    { start: 10, end: 11, text: "到达右端，前限位SQ1动作；KM1断开，准备反向。" },
    { start: 11, end: 17, text: "KM2反转，台车向左返回；离开右端后SQ1复位。" },
    { start: 17, end: 18, text: "回到左端，原点限位SQ2动作；KM2断开，准备再次正转。" },
    { start: 18, end: 24, text: "KM1再次接通，台车向右；自动往返进入下一轮。" },
    { start: 24, end: 25, text: "第二次到达右端，SQ1再次触发，正转断开，反转接通。" },
    { start: 25, end: 31, text: "台车向左返回；KM1和KM2互锁，两个方向不会同时接通。" },
    { start: 31, end: 32, text: "第二次回到原点，SQ2动作；按下停止后 RUN 复位。" },
    { start: 32, end: 36, text: "停止状态：KM1、KM2均断开，台车停在当前位置。" }
  ];
  function between(t, a, b) { return t >= a && t < b; }
  function lerp(a, b, t) { return a + (b - a) * clamp(t); }
  function trolleyPosition(t) {
    const left = 355, right = 1055;
    if (t < 4) return left;
    if (t < 10) return lerp(left, right, (t - 4) / 6);
    if (t < 11) return right;
    if (t < 17) return lerp(right, left, (t - 11) / 6);
    if (t < 18) return left;
    if (t < 24) return lerp(left, right, (t - 18) / 6);
    if (t < 25) return right;
    if (t < 31) return lerp(right, left, (t - 25) / 6);
    return left;
  }
  function stateAt(t) {
    const run = between(t, 4, 31.5);
    const start = between(t, 4, 4.5);
    const stop = t >= 31.5;
    const sqRight = between(t, 10, 11) || between(t, 24, 25);
    const sqLeft = t < 4.4 || between(t, 17, 18) || between(t, 31, DURATION);
    const forward = between(t, 4.4, 10) || between(t, 18, 24);
    const reverse = between(t, 11, 17) || between(t, 25, 31);
    let stage = "停止待机";
    if (start) stage = "启动按钮按下";
    else if (forward && t < 17) stage = "正转：向右运行";
    else if (sqRight) stage = "右端限位：切换反向";
    else if (reverse && t < 17) stage = "反转：向左返回";
    else if (sqLeft && t >= 17) stage = "原点限位：切换正向";
    else if (forward && t < 24) stage = "正转：进入下一轮";
    else if (reverse) stage = "反转：返回原点";
    else if (forward) stage = "正转：新一轮启动";
    if (stop) stage = "停止按钮按下：输出断开";
    return { x: trolleyPosition(t), run, start, stop, sqRight, sqLeft, forward, reverse, stage };
  }
  function limitSwitch(x, active, label, side) {
    const leverEndX = side === "left" ? x + 38 : x - 38;
    const leverEndY = active ? 576 : 558;
    return rect(x - 26, 592, 52, 42, active ? C.warm : "#e9eeea", 7, active ? C.orange : "#aebdb4") +
      rect(x - 17, 600, 34, 18, active ? C.orange : "#8ca198", 5) +
      path(`M${x} 592L${leverEndX} ${leverEndY}`, active ? C.orange : "#718780", 5) +
      circle(leverEndX, leverEndY, 7, active ? C.orange : "#718780") +
      txt(x, 475, label, 22, active ? C.orange : C.muted, 600, "middle") +
      txt(x, 505, active ? "已触发" : "未触发", 18, active ? C.orange : C.muted, 500, "middle");
  }
  function trolley(x, t, moving) {
    const angle = moving ? t * 470 : 0;
    let out = rect(x - 108, 514, 216, 84, moving ? "#dcece4" : "#e7ece8", 13, "#80968d", 3);
    out += rect(x - 66, 478, 132, 37, "#cfd8d3", 6, "#80968d", 3);
    out += rect(x - 49, 435, 98, 43, "#d89052", 7, "#a66c3d", 3);
    out += line(x - 56, 478, x + 56, 478, "#80968d", 4);
    for (const offset of [-69, 69]) {
      out += circle(x + offset, 624, 26, "#39484a", "#17282a", 3);
      out += `<g transform="rotate(${n(angle)} ${n(x + offset)} 624)">` +
        line(x + offset - 17, 624, x + offset + 17, 624, "#c8d1cc", 4) +
        line(x + offset, 607, x + offset, 641, "#c8d1cc", 4) +
        "</g>";
      out += circle(x + offset, 624, 6, "#c8d1cc");
    }
    out += rect(x - 35, 535, 70, 30, moving ? C.teal : "#718780", 7) +
      txt(x, 557, "台车", 19, C.white, 600, "middle");
    return out;
  }
  function signalRow(y, tag, label, active, color, stateLabel) {
    return rect(1330, y - 29, 475, 43, active ? (color === C.orange ? C.warm : C.pale) : "#f0f3ef", 9, active ? color : "#dce4de") +
      circle(1354, y - 7, 8, active ? color : "#aab8b0") +
      txt(1375, y, tag, 19, C.muted, 600) +
      txt(1455, y, label, 19, C.ink, 500) +
      txt(1785, y, active ? stateLabel : "0", 18, active ? color : C.muted, 600, "end");
  }
  function render(t) {
    const s = stateAt(t);
    const phase = phases.find((item) => t >= item.start && t < item.end)?.text ?? phases.at(-1).text;
    const directionColor = s.forward ? C.teal : s.reverse ? C.blue : C.muted;
    let body = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="案例策划：台车自动往返控制" style="font-family:'Noto Sans SC',sans-serif">`;
    body += rect(0, 0, 1920, 1080, C.paper, 0);
    body += txt(96, 70, "PLC 应用技术", 25, C.muted, 500) + txt(1824, 70, `微动画 17 / ${DURATION} 秒`, 25, C.muted, 400, "end");
    body += txt(96, 157, "案例策划：台车自动往返控制", 52, C.ink, 700) + line(96, 199, 1824, 199);

    body += rect(80, 240, 1185, 600, "#ffffff", 18, C.line) +
      txt(125, 292, "台车运行场景", 27, C.ink, 600) +
      txt(1220, 292, s.stage, 21, directionColor, 600, "end") +
      txt(125, 335, "到达行程端点后，限位开关向 PLC 提供换向信号", 20, C.muted, 400);

    // 导轨、基础和支撑梁
    body += rect(180, 682, 1060, 45, "#dfe5e0", 8, "#bdc9c1") +
      rect(205, 652, 1010, 13, "#697c76", 5) + rect(205, 675, 1010, 13, "#697c76", 5);
    for (let x = 220; x <= 1200; x += 70) body += rect(x, 645, 10, 47, "#9eaaa3", 3);
    // 端点和限位开关
    body += line(250, 570, 250, 650, "#82938b", 6) + line(1180, 570, 1180, 650, "#82938b", 6);
    body += limitSwitch(250, s.sqLeft, "SQ2 原点限位", "left");
    body += limitSwitch(1180, s.sqRight, "SQ1 前限位", "right");
    body += txt(250, 760, "左端原点", 19, C.muted, 500, "middle") + txt(1180, 760, "右端行程终点", 19, C.muted, 500, "middle");
    // 方向箭头
    if (s.forward || s.reverse) {
      const startX = s.forward ? s.x + 100 : s.x - 100;
      const endX = s.forward ? s.x + 172 : s.x - 172;
      body += line(startX, 455, endX, 455, directionColor, 6) +
        (s.forward ? path(`M${endX - 14} 444L${endX} 455L${endX - 14} 466`, directionColor, 6) : path(`M${endX + 14} 444L${endX} 455L${endX + 14} 466`, directionColor, 6)) +
        txt(s.x, 425, s.forward ? "正转 →" : "← 反转", 21, directionColor, 600, "middle");
    }
    body += trolley(s.x, t, s.forward || s.reverse);
    body += rect(380, 780, 590, 38, s.run ? C.pale : "#f0f3ef", 9, s.run ? "#b9d9c8" : "#dce4de") +
      txt(675, 806, s.run ? "自动运行中 · KM1 / KM2 电气互锁" : "当前停止 · 正反转输出均断开", 19, s.run ? C.teal : C.muted, 500, "middle");

    // PLC 状态面板
    body += rect(1290, 240, 550, 600, "#ffffff", 18, C.line) + txt(1330, 292, "PLC 输入 / 输出状态", 27, C.ink, 600);
    body += rect(1330, 315, 475, 52, s.run ? C.pale : "#f0f3ef", 10, s.run ? "#b9d9c8" : "#dce4de") +
      circle(1355, 341, 9, s.run ? C.teal : "#aab8b0") + txt(1378, 349, "RUN 运行保持", 20, C.ink, 600) +
      txt(1785, 349, s.run ? "ON" : "OFF", 19, s.run ? C.teal : C.muted, 700, "end");
    body += txt(1330, 404, "输入信号", 20, C.muted, 600) +
      signalRow(443, "I0.0", "启动按钮", s.start, C.teal, "按下") +
      signalRow(488, "I0.1", "停止按钮", s.stop, C.orange, "按下") +
      signalRow(533, "I0.2", "SQ1 前限位", s.sqRight, C.orange, "触发") +
      signalRow(578, "I0.3", "SQ2 原点限位", s.sqLeft, C.orange, "触发");
    body += txt(1330, 635, "方向输出", 20, C.muted, 600) +
      signalRow(674, "Q0.0", "KM1 正转", s.forward, C.teal, "接通") +
      signalRow(719, "Q0.1", "KM2 反转", s.reverse, C.blue, "接通") +
      rect(1330, 755, 475, 52, "#f3f5f1", 9, "#dce4de") +
      txt(1567, 788, "互锁检查：KM1 与 KM2 不同时接通", 18, C.muted, 500, "middle");

    body += rect(96, 880, 1728, 110, C.ink, 18) + txt(960, 949, phase, 32, C.white, 500, "middle");
    body += txt(96, 1041, "分步慢放 · 两次往返后演示停止；画面短暂停留用于观察限位换向。", 23, C.muted, 400);
    body += rect(1390, 1026, 434, 5, "#dce6df", 2) + rect(1390, 1026, 434 * t / DURATION, 5, C.teal, 2);
    return body + "</svg>";
  }
  const stage = document.querySelector("#stage"), toggle = document.querySelector("#toggle"), restart = document.querySelector("#restart");
  const timer = document.querySelector("#timer"), progress = document.querySelector("#progress"), fullscreen = document.querySelector("#fullscreen");
  const stillTime = new URLSearchParams(location.search).get("t");
  let seconds = stillTime === null ? 0 : clamp(Number(stillTime) || 0, 0, DURATION);
  let playing = stillTime === null && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  let previous = performance.now(), handle = 0;
  function paint() {
    stage.innerHTML = render(seconds);
    stage.dataset.time = seconds.toFixed(3);
    timer.textContent = `${Math.min(DURATION, Math.floor(seconds)).toString().padStart(2, "0")} / ${DURATION} s`;
    progress.style.width = `${seconds / DURATION * 100}%`;
    toggle.textContent = playing ? "暂停" : seconds >= DURATION ? "再看一遍" : "播放";
    toggle.setAttribute("aria-label", playing ? "暂停动画" : seconds >= DURATION ? "重播动画" : "播放动画");
    restart.hidden = seconds >= DURATION;
    const status = document.querySelector("#play-status");
    if (status) status.textContent = seconds >= DURATION ? "已结束 · 停留在总结" : "无声 · 自动演示 · 36秒";
  }
  function tick(now) {
    if (playing && !document.hidden) {
      seconds = Math.min(DURATION, seconds + Math.max(0, now - previous) / 1000);
      if (seconds >= DURATION) playing = false;
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
  toggle.addEventListener("click", () => { if (seconds >= DURATION) seconds = 0; playing = !playing; begin(); });
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
