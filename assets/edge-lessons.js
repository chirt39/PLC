"use strict";
(() => {
  const DURATION = 15;
  const COLORS = {
    ink: "#183c45",
    muted: "#657b80",
    line: "#dfe7e2",
    paper: "#f8f9f4",
    teal: "#008579",
    pale: "#e4f3ec",
    orange: "#dc6430",
    warm: "#fff0e5",
    blue: "#527da0",
    bluePale: "#e9f0f5",
    white: "#ffffff"
  };
  const lessons = {
    rising: {
      number: "07",
      showCounter: true,
      title: "上升沿检测",
      question: "按下按钮时，PLC何时触发上升沿？",
      description: "观察输入从 0 变为 1 时，上升沿输出如何产生一个扫描周期的脉冲。",
      edgeName: "上升沿输出",
      instruction: "R_TRIG.Q",
      edgeColor: COLORS.teal,
      edgePale: COLORS.pale,
      edgeEvents: [{ t: 0, v: 0 }, { t: 2, v: 1 }, { t: 3, v: 0 }, { t: 9, v: 1 }, { t: 10, v: 0 }],
      labels: [
        { start: 0, end: 2, text: "按钮松开，输入为 0，上升沿输出为 0。" },
        { start: 2, end: 4, text: "按下：输入从 0 变为 1，产生上升沿脉冲。" },
        { start: 4, end: 7, text: "保持按下，输入为 1；没有新的上升沿，脉冲回到 0。" },
        { start: 7, end: 9, text: "松开：输入从 1 变为 0，不触发上升沿。" },
        { start: 9, end: 12, text: "再次按下，输入再次从 0 变为 1，产生新的上升沿脉冲。" },
        { start: 12, end: 15, text: "只有 0 → 1 会触发上升沿；输出脉冲持续一个扫描周期。" }
      ],
      takeAway: "上升沿只对应输入由 0 变为 1 的瞬间。",
      explanation: "R_TRIG 将本次输入状态与上一扫描周期的状态比较。输入由 0 变为 1 时，Q 输出 1 一个扫描周期；输入保持为 1 时，Q 回到 0。",
      question2: "按钮保持按下时，上升沿输出会一直为 1 吗？",
      answer: "不会。只有输入发生 0 → 1 的变化时，才产生一个扫描周期的脉冲。"
    },
    falling: {
      number: "08",
      showCounter: true,
      title: "下降沿检测",
      question: "松开按钮时，PLC何时触发下降沿？",
      description: "观察输入从 1 变为 0 时，下降沿输出如何产生一个扫描周期的脉冲。",
      edgeName: "下降沿输出",
      instruction: "F_TRIG.Q",
      edgeColor: COLORS.blue,
      edgePale: COLORS.bluePale,
      edgeEvents: [{ t: 0, v: 0 }, { t: 6, v: 1 }, { t: 7, v: 0 }, { t: 12, v: 1 }, { t: 13, v: 0 }],
      labels: [
        { start: 0, end: 2, text: "按钮松开，输入为 0，下降沿输出为 0。" },
        { start: 2, end: 4, text: "先按下：输入从 0 变为 1，这不是下降沿。" },
        { start: 4, end: 6, text: "保持按下，输入为 1；下降沿输出仍为 0。" },
        { start: 6, end: 8, text: "松开：输入从 1 变为 0，产生下降沿脉冲。" },
        { start: 8, end: 12, text: "再次按下并保持，输入为 1；下降沿输出回到 0。" },
        { start: 12, end: 15, text: "只有 1 → 0 会触发下降沿；输出脉冲持续一个扫描周期。" }
      ],
      takeAway: "下降沿只对应输入由 1 变为 0 的瞬间。",
      explanation: "F_TRIG 将本次输入状态与上一扫描周期的状态比较。输入由 1 变为 0 时，Q 输出 1 一个扫描周期；按下按钮使输入由 0 变为 1，不会触发下降沿。",
      question2: "按下按钮时，会产生下降沿脉冲吗？",
      answer: "不会。下降沿发生在输入由 1 变为 0 时，也就是本例中松开按钮的瞬间。"
    }
  };
  const inputEvents = [{ t: 0, v: 0 }, { t: 2, v: 1 }, { t: 6, v: 0 }, { t: 9, v: 1 }, { t: 12, v: 0 }];
  const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const n = (v) => Number(v.toFixed(2));
  const txt = (x, y, value, size = 32, color = COLORS.ink, weight = 400, anchor = "start") =>
    `<text x="${n(x)}" y="${n(y)}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${esc(value)}</text>`;
  const line = (x1, y1, x2, y2, color = COLORS.line, width = 2, extra = "") =>
    `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
  const path = (d, color, width = 6, extra = "") =>
    `<path d="${d}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const rect = (x, y, w, h, fill, radius = 16, stroke = "none") =>
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  const dot = (x, y, r, color) => `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${color}"/>`;
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const current = (events, t) => events.reduce((v, e) => t >= e.t ? e.v : v, events[0].v);
  const xAt = (seconds) => 560 + clamp(seconds / DURATION) * 820;
  function trace(events, t, low, high) {
    let value = events[0].v;
    let d = `M560 ${value ? high : low}`;
    for (const event of events.slice(1)) {
      if (event.t > t) break;
      d += `H${n(xAt(event.t))}V${event.v ? high : low}`;
      value = event.v;
    }
    d += `H${n(xAt(t))}`;
    return d;
  }
  function button(t, input) {
    let lastChange = 0;
    for (const event of inputEvents) if (event.t <= t) lastChange = event.t;
    const travel = clamp((t - lastChange) / 0.18);
    const depression = lastChange === 0 ? 0 : input ? travel : 1 - travel;
    const y = 365 + 24 * depression;
    return rect(151, 424, 198, 131, "#dde7e0", 26, "#c2d3c9") +
      `<ellipse cx="250" cy="430" rx="84" ry="29" fill="#a9bdb1"/>` +
      rect(172, y, 156, 69 - 24 * depression, input ? COLORS.orange : "#b85227", 12) +
      `<ellipse cx="250" cy="${n(y)}" rx="78" ry="30" fill="${input ? COLORS.orange : "#f09b6e"}"/>` +
      dot(250, 510, 11, input ? COLORS.teal : "#9bada3") +
      (input ? path("M250 302V335M237 323L250 337L263 323", COLORS.orange, 5) : "");
  }
  function activeLabel(config, t, input) {
    const falling = config.number === "08";
    if (t >= 2 && t < 3) return falling ? "上升沿：不触发" : "0 → 1，上升沿";
    if (t >= 6 && t < 7) return falling ? "1 → 0，下降沿" : "下降沿：不触发";
    if (t >= 9 && t < 10) return falling ? "上升沿：不触发" : "0 → 1，上升沿";
    if (t >= 12 && t < 13) return falling ? "1 → 0，下降沿" : "下降沿：不触发";
    return input ? "输入保持为 1" : "输入保持为 0";
  }
  function render(config, t) {
    const input = current(inputEvents, t);
    const pulseStart = config.edgeEvents.filter((e) => e.v === 1).map((e) => e.t);
    const pulse = pulseStart.some((start) => t >= start && t < start + 1);
    const pulseCount = pulseStart.filter((start) => t >= start).length;
    const action = t < 2 ? "松开" : t < 6 ? "按住" : t < 9 ? "松开" : t < 12 ? "按住" : "松开";
    const label = config.labels.find((item) => t >= item.start && t < item.end)?.text ?? config.labels.at(-1).text;
    const gx = 560, gw = 820, nowX = xAt(t);
    let body = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="${esc(config.title)}" style="font-family:'Noto Sans SC',sans-serif">`;
    body += rect(0, 0, 1920, 1080, COLORS.paper, 0);
    body += txt(96, 70, "PLC 应用技术", 25, COLORS.muted, 500);
    body += txt(1824, 70, `微动画 ${config.number} / 15 秒`, 25, COLORS.muted, 400, "end");
    body += txt(96, 157, config.title, 54, COLORS.ink, 700);
    body += line(96, 199, 1824, 199);

    body += txt(250, 277, "按钮", 33, COLORS.ink, 600, "middle") + button(t, input);
    body += txt(250, 636, action, 38, input ? COLORS.orange : COLORS.muted, 600, "middle");
    body += txt(250, 690, input ? "输入为 1" : "输入为 0", 29, COLORS.muted, 400, "middle");
    body += line(383, 424, 465, 424, input ? COLORS.orange : "#baccc2", 4) + path("M453 415L465 424L453 433", input ? COLORS.orange : "#baccc2", 4);

    body += txt(gx, 277, "输入电平", 33, COLORS.orange, 600);
    body += txt(gx, 536, config.edgeName, 33, config.edgeColor, 600);
    for (let i = 0; i <= 15; i++) {
      const x = xAt(i);
      body += line(x, 325, x, 430, COLORS.line, 1, 'stroke-dasharray="3 8"');
      body += line(x, 585, x, 690, COLORS.line, 1, 'stroke-dasharray="3 8"');
    }
    for (const [y, value] of [[340, "1"], [430, "0"], [600, "1"], [690, "0"]]) {
      body += line(gx, y, gx + gw, y, COLORS.line, 1) + txt(gx - 30, y + 11, value, 30, COLORS.muted, 400, "end");
    }
    body += path(trace(inputEvents, t, 430, 340), COLORS.orange, 7);
    body += path(trace(config.edgeEvents, t, 690, 600), config.edgeColor, 7);
    if (t > 0 && t < DURATION) body += line(nowX, 310, nowX, 710, "#829e97", 2, 'stroke-dasharray="5 8" opacity="0.45"');
    for (const start of pulseStart) {
      if (t >= start + 0.3) {
        body += dot(xAt(start), 600, 7, config.edgeColor);
        body += path(`M${n(xAt(start))} 718V733H${n(xAt(start + 1))}V718`, config.edgeColor, 3);
        if (start === pulseStart[0]) body += txt(xAt(start + 0.5), 777, "1 个扫描周期", 27, config.edgeColor, 500, "middle");
        if (t >= start && t < start + 1) body += txt(xAt(start), 570, config.number === "07" ? "上升沿" : "下降沿", 30, config.edgeColor, 600, "middle");
      }
      if (t >= 12.8) body += rect(xAt(start) - 8, 590, gw / DURATION + 16, 110, "none", 9, config.edgeColor);
    }
    if (t >= 2.8 && t < 6) body += txt(xAt(2.4), 315, "保持为 1", 30, COLORS.orange, 600, "middle");
    if (t >= 6 && t < 9) body += txt(xAt(6), 315, config.number === "07" ? "松开：不触发" : "1 → 0", 28, config.number === "07" ? COLORS.muted : COLORS.blue, 600, "middle");
    body += txt(gx + gw, 828, "时间 →", 27, COLORS.muted, 400, "end");

    body += txt(1640, 277, config.showCounter ? "计数" : config.instruction, 33, COLORS.ink, 600, "middle");
    body += `<circle cx="1640" cy="465" r="133" fill="${pulse ? config.edgePale : "#edf1ed"}"/>`;
    body += txt(1640, 521, config.showCounter ? String(pulseCount) : pulse ? "1" : "0", 160, pulse ? config.edgeColor : config.showCounter ? COLORS.teal : "#a8b5af", 600, "middle");
    body += txt(1640, 633, config.showCounter ? `共计 ${pulseCount} 次` : pulse ? "脉冲输出" : "无脉冲", 34, config.showCounter ? COLORS.teal : pulse ? config.edgeColor : COLORS.muted, 500, "middle");
    if (config.showCounter && pulse) body += txt(1640, 690, config.number === "07" ? "本次上升沿 +1" : "本次下降沿 +1", 25, COLORS.muted, 400, "middle");
    else if (!config.showCounter) body += txt(1640, 690, activeLabel(config, t, input), 25, COLORS.muted, 400, "middle");

    body += rect(96, 880, 1728, 110, COLORS.ink, 18);
    body += txt(960, 949, label, 38, COLORS.white, 500, "middle");
    body += txt(96, 1041, "教学慢放示意；每个边沿均被采样，1 拍 = 1 个扫描周期。", 26, COLORS.muted, 400);
    body += rect(1390, 1026, 434, 5, "#dce6df", 2) + rect(1390, 1026, 434 * t / DURATION, 5, COLORS.teal, 2);
    return body + "</svg>";
  }

  const lessonKey = document.body.dataset.edgeLesson;
  const combined = lessonKey === "combined";
  const playbackDuration = combined ? DURATION * 2 : DURATION;
  const config = lessons[combined ? "rising" : lessonKey];
  const stage = document.querySelector("#stage");
  const toggle = document.querySelector("#toggle");
  const restart = document.querySelector("#restart");
  const timer = document.querySelector("#timer");
  const progress = document.querySelector("#progress");
  const fullscreen = document.querySelector("#fullscreen");
  const stillTime = new URLSearchParams(location.search).get("t");
  let seconds = stillTime === null ? 0 : clamp(Number(stillTime) || 0, 0, DURATION);
  let playing = stillTime === null && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  let previous = performance.now();
  let handle = 0;
  function renderPlaybackFrame(t) {
    if (!combined) return render(config, t);
    return t < DURATION ? render(lessons.rising, t) : render(lessons.falling, t - DURATION);
  }
  function paint() {
    stage.innerHTML = renderPlaybackFrame(seconds);
    stage.dataset.time = seconds.toFixed(3);
    timer.textContent = `${Math.min(playbackDuration, Math.floor(seconds)).toString().padStart(2, "0")} / ${playbackDuration} s`;
    progress.style.width = `${seconds / playbackDuration * 100}%`;
    toggle.textContent = playing ? "暂停" : seconds >= playbackDuration ? "再看一遍" : "播放";
    toggle.setAttribute("aria-label", playing ? "暂停动画" : seconds >= playbackDuration ? "重播动画" : "播放动画");
    restart.hidden = seconds >= playbackDuration;
    const status = document.querySelector("#play-status");
    if (status) status.textContent = seconds >= playbackDuration ? "已结束 · 停留在结论" : combined ? seconds < DURATION ? "第一段：上升沿" : "第二段：下降沿" : "无声 · 自动演示";
  }
  function tick(now) {
    if (playing && !document.hidden) {
      seconds = Math.min(playbackDuration, seconds + Math.max(0, now - previous) / 1000);
      if (seconds >= playbackDuration) playing = false;
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
  toggle.addEventListener("click", () => {
    if (seconds >= playbackDuration) seconds = 0;
    playing = !playing;
    begin();
  });
  restart.addEventListener("click", () => { seconds = 0; playing = true; begin(); });
  if (fullscreen && !document.fullscreenEnabled) fullscreen.hidden = true;
  fullscreen?.addEventListener("click", async () => {
    const viewer = document.querySelector(".viewer");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await viewer?.requestFullscreen();
    } catch { fullscreen.textContent = "全屏不可用"; }
  });
  document.addEventListener("fullscreenchange", () => {
    if (fullscreen) fullscreen.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
  });
  document.addEventListener("visibilitychange", begin);
  begin();
  void document.fonts?.load('500 24px "Noto Sans SC"').catch(() => {});
})();
