"use strict";
(() => {
  const DURATION = 15;
  const COLORS = { ink: "#183c45", muted: "#657b80", line: "#dfe7e2", paper: "#f8f9f4", teal: "#008579", pale: "#e4f3ec", orange: "#dc6430", warm: "#fff0e5", blue: "#527da0", bluePale: "#e9f0f5", white: "#ffffff" };
  const inputEvents = [{ t: 0, v: 0 }, { t: 2, v: 1 }, { t: 6, v: 0 }, { t: 9, v: 1 }, { t: 12, v: 0 }];
  const riseTimes = [2, 9];
  const fallTimes = [6, 12];
  const lessons = {
    ctu: {
      key: "ctu",
      number: "15",
      title: "PLC上升沿检测CTU直接计数",
      labels: [
        { start: 0, end: 2, text: "按钮松开，I0.0=0，CTU.CU=0，当前计数为 0。" },
        { start: 2, end: 4, text: "按下：CU 从 0 变 1，CTU 内部识别上升沿，CV 加 1。" },
        { start: 4, end: 6, text: "保持按下：CU 一直为 1，没有新的上升沿，CV 保持 1。" },
        { start: 6, end: 9, text: "松开：CU 从 1 变 0，是下降沿；不计数，为下次按下作准备。" },
        { start: 9, end: 11, text: "再次按下：新的 0→1 上升沿，CTU.CV 从 1 增加到 2。" },
        { start: 11, end: 12, text: "保持按下：没有新的上升沿，CV 继续保持 2。" },
        { start: 12, end: 14, text: "再次松开：出现下降沿，但 CTU 不加数，CV 仍为 2。" },
        { start: 14, end: 15, text: "标准 CTU 直接接收输入；上升沿加 1，下降沿不计数。" }
      ]
    },
    rtrig: {
      key: "rtrig",
      number: "16",
      title: "PLC上升沿检测R_TRIG计数",
      labels: [
        { start: 0, end: 2, text: "按钮松开，CLK=0，R_TRIG.Q=0，CTU.CV=0。" },
        { start: 2, end: 4, text: "按下：CLK 出现上升沿，R_TRIG.Q 输出一个扫描周期脉冲。" },
        { start: 4, end: 6, text: "Q 脉冲已结束；按钮仍按住，Q=0，计数保持 1。" },
        { start: 6, end: 9, text: "松开：CLK 出现下降沿，R_TRIG 不输出脉冲，计数不变。" },
        { start: 9, end: 11, text: "再次按下：R_TRIG.Q 再输出一个扫描周期脉冲，CTU 加 1。" },
        { start: 11, end: 12, text: "按钮保持按下：没有新的上升沿，Q=0，计数保持 2。" },
        { start: 12, end: 14, text: "再次松开：只有输入下降沿，R_TRIG.Q 和计数都保持为 0、2。" },
        { start: 14, end: 15, text: "R_TRIG 负责产生上升沿脉冲；CTU 接收脉冲并累计。" }
      ]
    }
  };
  const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const n = (v) => Number(v.toFixed(2));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const txt = (x, y, value, size = 24, color = COLORS.ink, weight = 400, anchor = "start") => `<text x="${n(x)}" y="${n(y)}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${esc(value)}</text>`;
  const line = (x1, y1, x2, y2, color = COLORS.line, width = 2, extra = "") => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
  const path = (d, color, width = 5, extra = "") => `<path d="${d}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const rect = (x, y, w, h, fill, radius = 14, stroke = "none") => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  const x0 = 635, plotWidth = 790;
  const xAt = (t) => x0 + clamp(t / DURATION) * plotWidth;
  const inputAt = (t) => inputEvents.reduce((value, event) => t >= event.t ? event.v : value, 0);
  const countAt = (t) => riseTimes.filter((rise) => t >= rise).length;
  const pulseAt = (t) => riseTimes.some((rise) => t >= rise && t < rise + 0.52);
  const pulseEvents = [{ t: 0, v: 0 }, { t: 2, v: 1 }, { t: 2.52, v: 0 }, { t: 9, v: 1 }, { t: 9.52, v: 0 }];
  function stepTrace(events, t, yFor) {
    let value = events[0].v;
    let d = `M${n(x0)} ${n(yFor(value))}`;
    for (const event of events.slice(1)) {
      if (event.t > t) break;
      d += `H${n(xAt(event.t))}V${n(yFor(event.v))}`;
      value = event.v;
    }
    return `${d}H${n(xAt(t))}`;
  }
  function button(input) {
    const top = input ? 392 : 360;
    return rect(132, 438, 216, 124, "#dde7e0", 24, "#c2d3c9") +
      `<ellipse cx="240" cy="444" rx="88" ry="28" fill="#a9bdb1"/>` +
      rect(158, top, 164, input ? 73 : 105, input ? "#b85227" : COLORS.orange, 14) +
      `<ellipse cx="240" cy="${top}" rx="82" ry="29" fill="${input ? "#b85227" : COLORS.orange}"/>` +
      txt(240, 652, input ? "按下" : "松开", 34, input ? COLORS.orange : COLORS.muted, 600, "middle") +
      txt(240, 705, `输入 I0.0 = ${input}`, 25, COLORS.muted, 500, "middle") +
      txt(240, 758, input ? "高电平保持" : "低电平保持", 22, input ? COLORS.orange : COLORS.muted, 400, "middle");
  }
  function makeInputAndEdges(t, rowTop, rowBottom, body, showEdgeMarkers = true) {
    body += txt(470, 383, "输入 I0.0", 25, COLORS.orange, 600);
    body += line(x0, rowTop, x0 + plotWidth, rowTop, COLORS.line, 1) + line(x0, rowBottom, x0 + plotWidth, rowBottom, COLORS.line, 1);
    body += txt(x0 - 16, rowTop + 9, "1", 20, COLORS.muted, 400, "end") + txt(x0 - 16, rowBottom + 9, "0", 20, COLORS.muted, 400, "end");
    body += path(stepTrace(inputEvents, t, (v) => v ? rowTop : rowBottom), COLORS.orange, 7);
    if (showEdgeMarkers) {
      for (const edge of [...riseTimes.map((time) => ({ time, rising: true })), ...fallTimes.map((time) => ({ time, rising: false }))].sort((a, b) => a.time - b.time)) {
        if (t >= edge.time) {
          const x = xAt(edge.time);
          body += line(x, 330, x, 777, "#b9c9c0", 2, 'stroke-dasharray="5 7" opacity="0.65"');
          body += txt(x, 452, edge.rising ? "↑" : "↓", 27, edge.rising ? COLORS.teal : COLORS.blue, 700, "middle");
        }
      }
    }
    body += txt(470, 455, "↑上升沿 · ↓下降沿", 18, COLORS.muted, 400);
    return body;
  }
  function directBlock(count) {
    return rect(1535, 250, 305, 590, "#ffffff", 18, COLORS.line) +
      txt(1687, 300, "CTU 计数器", 29, COLORS.ink, 650, "middle") +
      rect(1570, 337, 235, 210, COLORS.bluePale, 16, "#b9ccd7") +
      txt(1687, 382, "CU  ←  I0.0", 26, COLORS.blue, 600, "middle") +
      txt(1687, 428, "R = 0", 22, COLORS.muted, 500, "middle") +
      txt(1687, 467, "PV = 999", 22, COLORS.muted, 500, "middle") +
      txt(1687, 514, "CU 上升沿时 CV +1", 20, COLORS.ink, 500, "middle") +
      txt(1687, 602, "当前计数 CV", 24, COLORS.muted, 500, "middle") +
      rect(1580, 627, 215, 128, "#202b2e", 14, "#39494b") +
      txt(1687, 713, String(count).padStart(3, "0"), 68, "#58e0aa", 600, "middle") +
      txt(1687, 790, "无需单独外接脉冲", 21, COLORS.teal, 550, "middle");
  }
  function rtrigBlock(count, pulse, t) {
    const falling = fallTimes.some((fall) => t >= fall && t < fall + 1);
    return rect(1535, 250, 305, 590, "#ffffff", 18, COLORS.line) +
      txt(1687, 320, "计数值", 29, COLORS.ink, 650, "middle") +
      `<circle cx="1687" cy="500" r="118" fill="${pulse ? COLORS.pale : "#edf1ed"}"/>` +
      txt(1687, 545, String(count), 132, pulse ? COLORS.teal : COLORS.ink, 600, "middle") +
      txt(1687, 660, `共计 ${count} 次`, 28, COLORS.teal, 500, "middle") +
      txt(1687, 720, pulse ? "本次上升沿 +1" : falling ? "下降沿 · 不计数" : "等待下一次上升沿", 20, pulse ? COLORS.teal : falling ? COLORS.blue : COLORS.muted, 500, "middle");
  }
  function render(config, t) {
    const input = inputAt(t), count = countAt(t), pulse = config.key === "rtrig" && pulseAt(t);
    const label = config.labels.find((item) => t >= item.start && t < item.end)?.text ?? config.labels.at(-1).text;
    let body = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="${esc(config.title)}" style="font-family:'Noto Sans SC',sans-serif">`;
    body += rect(0, 0, 1920, 1080, COLORS.paper, 0);
    body += txt(96, 70, "PLC 应用技术", 25, COLORS.muted, 500) + txt(1824, 70, `微动画 ${config.number} / ${DURATION} 秒`, 25, COLORS.muted, 400, "end");
    body += txt(96, 157, config.title, 54, COLORS.ink, 700) + line(96, 199, 1824, 199);
    body += rect(80, 250, 320, 590, "#ffffff", 18, COLORS.line) + txt(240, 305, "按钮输入", 29, COLORS.ink, 600, "middle") + button(input);
    body += rect(430, 250, 1070, 590, "#ffffff", 18, COLORS.line) + txt(470, 300, "同步信号 · 共用时间轴", 26, COLORS.ink, 600);
    for (let second = 0; second <= DURATION; second++) {
      const x = xAt(second);
      body += line(x, 330, x, 777, COLORS.line, 1, 'stroke-dasharray="3 8"');
      if (second % 3 === 0) body += txt(x, 808, String(second), 17, COLORS.muted, 400, "middle");
    }
    body = makeInputAndEdges(t, 355, 405, body, config.key !== "ctu");
    if (config.key === "ctu") {
      body += rect(500, 565, 430, 150, COLORS.pale, 16, "#b9d9c8") +
        txt(715, 615, "0→1 上升沿", 25, COLORS.teal, 650, "middle") +
        txt(715, 660, "CTU 内部识别，右侧计数 +1", 19, COLORS.ink, 500, "middle") +
        rect(950, 565, 430, 150, COLORS.bluePale, 16, "#c6d7e1") +
        txt(1165, 615, "1→0 下降沿", 25, COLORS.blue, 650, "middle") +
        txt(1165, 660, "不计数，等待下一次按下", 19, COLORS.ink, 500, "middle");
      body += directBlock(count);
    } else {
      body += txt(470, 515, "R_TRIG.Q 脉冲", 24, COLORS.blue, 600);
      body += line(x0, 485, x0 + plotWidth, 485, COLORS.line, 1) + line(x0, 535, x0 + plotWidth, 535, COLORS.line, 1);
      body += txt(x0 - 16, 493, "1", 18, COLORS.muted, 400, "end") + txt(x0 - 16, 543, "0", 18, COLORS.muted, 400, "end");
      body += path(stepTrace(pulseEvents, t, (value) => value ? 485 : 535), COLORS.blue, 7);
      body += txt(1040, 575, "脉冲仅在 0→1 时出现；下降沿不触发 R_TRIG", 19, COLORS.muted, 500, "middle");
      body += rect(500, 625, 430, 112, COLORS.pale, 16, "#b9d9c8") +
        txt(715, 670, "上升沿 → Q 脉冲 → 右侧计数 +1", 19, COLORS.teal, 600, "middle") +
        txt(715, 710, "Q 只保持一个扫描周期", 18, COLORS.ink, 400, "middle") +
        rect(950, 625, 430, 112, COLORS.bluePale, 16, "#c6d7e1") +
        txt(1165, 670, "下降沿 → Q 不触发", 20, COLORS.blue, 600, "middle") +
        txt(1165, 710, "右侧计数保持不变", 18, COLORS.ink, 400, "middle");
      body += rtrigBlock(count, pulse, t);
    }
    body += txt(1425, 808, "时间 / 秒 →", 17, COLORS.muted, 400, "end");
    body += rect(96, 880, 1728, 110, COLORS.ink, 18) + txt(960, 949, label, 34, COLORS.white, 500, "middle");
    body += txt(96, 1041, config.key === "rtrig" ? "示意动画：脉冲宽度放大以便观察；实际 R_TRIG.Q 脉冲持续一个扫描周期。" : "示意动画：按下为 0→1 上升沿，松开为 1→0 下降沿；输入直接接入 CTU.CU。", 22, COLORS.muted, 400);
    body += rect(1390, 1026, 434, 5, "#dce6df", 2) + rect(1390, 1026, 434 * t / DURATION, 5, COLORS.teal, 2);
    return body + "</svg>";
  }
  const key = document.body.dataset.counterLesson;
  const config = lessons[key];
  const stage = document.querySelector("#stage"), toggle = document.querySelector("#toggle"), restart = document.querySelector("#restart");
  const timer = document.querySelector("#timer"), progress = document.querySelector("#progress"), fullscreen = document.querySelector("#fullscreen");
  const stillTime = new URLSearchParams(location.search).get("t");
  let seconds = stillTime === null ? 0 : clamp(Number(stillTime) || 0, 0, DURATION);
  let playing = stillTime === null && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  let previous = performance.now(), handle = 0;
  function paint() {
    stage.innerHTML = render(config, seconds);
    stage.dataset.time = seconds.toFixed(3);
    timer.textContent = `${Math.min(DURATION, Math.floor(seconds)).toString().padStart(2, "0")} / ${DURATION} s`;
    progress.style.width = `${seconds / DURATION * 100}%`;
    toggle.textContent = playing ? "暂停" : seconds >= DURATION ? "再看一遍" : "播放";
    toggle.setAttribute("aria-label", playing ? "暂停动画" : seconds >= DURATION ? "重播动画" : "播放动画");
    restart.hidden = seconds >= DURATION;
    const status = document.querySelector("#play-status");
    if (status) status.textContent = seconds >= DURATION ? "已结束 · 停留在结论" : "无声 · 自动演示";
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
