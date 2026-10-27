"use strict";
(() => {
  const DURATION = 48;
  const C = { ink: "#183c45", muted: "#657b80", line: "#dfe7e2", paper: "#f8f9f4", teal: "#008579", pale: "#e4f3ec", orange: "#dc6430", warm: "#fae8d8", blue: "#527da0", bluePale: "#e8f0f6", water: "#a8d9e8", waterDark: "#5da9c0", white: "#fff", red: "#bd5340" };
  const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const n = (v) => Number(v.toFixed(2));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const txt = (x, y, value, size = 24, color = C.ink, weight = 400, anchor = "start") => `<text x="${n(x)}" y="${n(y)}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${esc(value)}</text>`;
  const line = (x1, y1, x2, y2, color = C.line, width = 2, extra = "") => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
  const path = (d, color, width = 4, extra = "") => `<path d="${d}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const rect = (x, y, w, h, fill, radius = 12, stroke = "none", sw = 2) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const circle = (x, y, r, fill, stroke = "none", sw = 2) => `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const phases = [
    { start: 0, end: 5, text: "完整数据链持续工作；画面中的各项数值表示同一时刻的对应状态。" },
    { start: 5, end: 18, text: "水位上升时，变送器电流、AI 原始值和工程水位同步更新。" },
    { start: 18, end: 25, text: "量程公式说明各数值的对应关系；三项读数仍随水位同步变化。" },
    { start: 25, end: 31, text: "水位达到 8.0 m 高位阈值，PLC 关闭水泵输出。" },
    { start: 31, end: 37, text: "用水后水位下降；在两个阈值之间，水泵保持停止。" },
    { start: 37, end: 41, text: "水位降到 4.0 m 低位阈值，PLC 重新启动水泵。" },
    { start: 41, end: 48, text: "回顾：变送、采集、换算持续工作；阈值判断根据当前水位控制水泵。" }
  ];
  function between(t, a, b) { return t >= a && t < b; }
  function lerp(a, b, p) { return a + (b - a) * clamp(p); }
  function levelAt(t) {
    if (t < 5) return 2;
    if (t < 25) return lerp(2, 8, (t - 5) / 20);
    if (t < 31) return 8;
    if (t < 37) return lerp(8, 4, (t - 31) / 6);
    if (t < 41) return lerp(4, 4.8, (t - 37) / 4);
    return 4.8;
  }
  function activeCard(y, number, title, detail, value, active, color = C.teal) {
    const bg = active ? (color === C.orange ? C.warm : color === C.blue ? C.bluePale : C.pale) : "#f3f5f1";
    return rect(1190, y, 560, 82, bg, 12, active ? color : C.line, active ? 3 : 2) +
      circle(1224, y + 41, 20, active ? color : "#aab8b0") + txt(1224, y + 48, String(number), 19, C.white, 700, "middle") +
      txt(1260, y + 31, title, 21, C.ink, 600) + txt(1260, y + 59, detail, 16, C.muted, 400) +
      txt(1718, y + 49, value, 22, active ? color : C.muted, 700, "end");
  }
  function render(t) {
    const h = levelAt(t), current = 4 + 1.6 * h, raw = Math.round(h * 1000);
    const pump = t < 25 || t >= 37;
    const phase = phases.find((item) => t >= item.start && t < item.end)?.text ?? phases.at(-1).text;
    const low = h <= 4.001, high = h >= 7.999;
    const tankTop = 405, tankBottom = 765, tankH = tankBottom - tankTop;
    const waterH = tankH * h / 10, waterTop = tankBottom - waterH;
    const valueColor = high ? C.orange : low ? C.blue : C.teal;
    let body = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="案例策划：水位数据链" style="font-family:'Noto Sans SC',sans-serif">`;
    body += rect(0, 0, 1920, 1080, C.paper, 0);
    body += txt(96, 70, "PLC 应用技术", 25, C.muted, 500) + txt(1824, 70, `微动画 18 / ${DURATION} 秒`, 25, C.muted, 400, "end");
    body += txt(96, 157, "案例策划：水位数据链", 52, C.ink, 700) + line(96, 199, 1824, 199);
    body += rect(80, 240, 1040, 620, C.white, 18, C.line) + txt(125, 292, "水箱与现场设备", 27, C.ink, 600);
    body += txt(1075, 292, pump ? "水泵运行 · 补水中" : "水泵停止", 21, pump ? C.teal : C.muted, 600, "end");
    body += txt(125, 333, "水位、传感器信号、PLC采集值和水泵状态持续对应变化", 19, C.muted, 400);

    // Tank, graduated scale, and changing water column.
    body += rect(285, tankTop, 300, tankH, "#fbfcfa", 0, "#82938b", 5);
    body += rect(290, waterTop, 290, waterH, C.water, 0) + line(292, waterTop, 578, waterTop, C.waterDark, 5);
    for (let m = 0; m <= 10; m += 2) {
      const y = tankBottom - tankH * m / 10;
      body += line(245, y, 284, y, "#82938b", 3) + txt(230, y + 7, `${m} m`, 17, C.muted, 500, "end");
    }
    const y4 = tankBottom - tankH * 0.4, y8 = tankBottom - tankH * 0.8;
    body += line(286, y4, 584, y4, C.blue, 2, 'stroke-dasharray="9 8" opacity="0.75"') + txt(598, y4 + 6, "低位 4 m", 16, C.blue, 600);
    body += line(286, y8, 584, y8, C.orange, 2, 'stroke-dasharray="9 8" opacity="0.75"') + txt(598, y8 + 6, "高位 8 m", 16, C.orange, 600);
    body += txt(435, 385, "储水箱", 21, C.ink, 600, "middle");
    body += txt(435, Math.max(tankTop + 30, waterTop - 13), `当前水位 ${h.toFixed(1)} m`, 19, valueColor, 700, "middle");

    // Level transmitter and analog signal path to the PLC input.
    body += rect(552, 708, 46, 38, C.bluePale, 7, C.blue, 3) +
      line(575, 708, 575, 660, C.blue, 5) + txt(585, 755, "LIT-01 变送器", 16, C.blue, 600);
    body += path("M598 725H710V420H765V460", C.blue, 6) +
      path("M753 444L765 460L777 444", C.blue, 5) +
      rect(625, 565, 112, 38, C.bluePale, 8, "#bdd5e5") + txt(681, 590, `${current.toFixed(1)} mA`, 18, C.blue, 700, "middle");

    // Pump, pipe, and animated flow indicator.
    body += path("M145 715H285", pump ? C.teal : "#aebbb4", 18) + path("M285 715V690", pump ? C.teal : "#aebbb4", 18);
    body += rect(115, 668, 94, 94, pump ? C.pale : "#eff2ef", 16, pump ? C.teal : "#aebbb4", 4) +
      circle(162, 715, 28, pump ? C.teal : "#aebbb4") +
      path("M150 701L178 715L150 729Z", C.white, 0) + txt(162, 794, "补水泵", 18, C.ink, 600, "middle") +
      txt(162, 824, pump ? "Q0.0 ON" : "Q0.0 OFF", 16, pump ? C.teal : C.muted, 600, "middle");
    if (pump) {
      const fx = 220 + (t * 29 % 48);
      body += circle(fx, 715, 7, C.white, C.teal, 3) + circle(fx + 46, 715, 7, C.white, C.teal, 3);
    }

    // Local PLC readout, linking the physical signal to software values.
    body += rect(765, 460, 290, 275, "#f8faf8", 14, C.teal, 3) +
      rect(765, 460, 290, 54, "#e8f1ec", 14) + txt(790, 495, "PLC · 模拟量输入 AI0", 21, C.ink, 600) +
      txt(790, 555, "输入电流", 17, C.muted, 500) + txt(1028, 555, `${current.toFixed(1)} mA`, 20, C.blue, 700, "end") +
      line(790, 575, 1030, 575, C.line, 2) + txt(790, 613, "AI 原始值", 17, C.muted, 500) + txt(1028, 613, String(raw), 20, C.teal, 700, "end") +
      line(790, 633, 1030, 633, C.line, 2) + txt(790, 672, "换算水位", 17, C.muted, 500) + txt(1028, 672, `${h.toFixed(1)} m`, 21, valueColor, 700, "end") +
      txt(910, 708, "原始值范围为教学归一示例", 14, C.muted, 400, "middle");

    // Data processing chain and threshold state.
    body += rect(1150, 240, 690, 620, C.white, 18, C.line) + txt(1190, 292, "数据处理链", 27, C.ink, 600) +
      txt(1800, 292, "连续处理 · 各项数据同步刷新", 17, C.muted, 400, "end");
    body += activeCard(330, 1, "液位变送器", "水位 → 标准电流信号", `${current.toFixed(1)} mA`, true, C.blue) +
      line(1470, 412, 1470, 426, C.teal, 4) +
      activeCard(430, 2, "PLC 模拟量输入 AI0", "读取电流并转换为原始值", String(raw), true) +
      line(1470, 512, 1470, 526, C.teal, 4) +
      activeCard(530, 3, "量程缩放", "H = AI原始值 ÷ 10000 × 10 m", `${h.toFixed(1)} m`, true) +
      line(1470, 612, 1470, 626, C.teal, 4) +
      activeCard(630, 4, "高低阈值判断", "≤4 m 启动　/　≥8 m 停止", low ? "低位启动" : high ? "高位停止" : pump ? "补水中" : "保持停止", true, low ? C.blue : high ? C.orange : C.teal) +
      line(1470, 712, 1470, 726, C.teal, 4) +
      activeCard(730, 5, "PLC 输出 Q0.0", "控制补水泵运行", pump ? "ON · 运行" : "OFF · 停止", true, pump ? C.teal : C.muted);
    body += rect(1190, 830, 560, 1, C.line, 0) + txt(1190, 848, "示例量程：0—10 m ↔ 4—20 mA；AI 原始值依模块配置而异。", 15, C.muted, 400);
    body += rect(96, 900, 1728, 105, C.ink, 18) + txt(960, 965, phase, 30, C.white, 500, "middle");
    body += txt(96, 1042, "按量程换算成工程值后，再进行阈值比较；高位停泵、低位启泵，两个阈值之间保持输出状态。", 20, C.muted, 400);
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
    if (status) status.textContent = seconds >= DURATION ? "已结束 · 停留在总结" : "无声 · 自动演示 · 48秒";
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
