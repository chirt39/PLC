"use strict";
(() => {
  // src/model.ts
  var DURATION = 15;
  var FILTER_MS = 6.4;
  var clamp = (n2, min = 0, max = 1) => Math.min(max, Math.max(min, n2));
  var INPUT_SCANS = [0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0];
  var SCAN_SECONDS = 1;
  var SCAN_START = 0;
  function edgeSamples(inputs) {
    let previous2 = 0;
    let cv = 0;
    return inputs.map((input, scan) => {
      const pulse = input === 1 && previous2 === 0 ? 1 : 0;
      cv += pulse;
      previous2 = input;
      return { scan, input, pulse, cv };
    });
  }
  var SCANS = edgeSamples(INPUT_SCANS);
  function edgeState(seconds2) {
    const position = Number(clamp((seconds2 - SCAN_START) / SCAN_SECONDS, 0, 12).toFixed(9));
    const index = Math.min(11, Math.floor(position));
    return { ...SCANS[index], position, summary: seconds2 >= 12 };
  }
  var RAW = [
    { ms: 0, value: 0 },
    { ms: 1.6, value: 1 },
    { ms: 2.4, value: 0 },
    { ms: 3.2, value: 1 },
    { ms: 4, value: 0 },
    { ms: 6.4, value: 1 }
  ];
  function filterAt(ms, transitions = RAW, threshold = FILTER_MS) {
    let accumulated = 0;
    let output = 0;
    let raw = 0;
    let start = 0;
    for (const change of [...transitions, { ms: Infinity, value: 0 }]) {
      const until = Math.min(ms, change.ms);
      if (until > start) {
        accumulated = clamp(accumulated + (raw ? 1 : -1) * (until - start), 0, threshold);
        if (accumulated >= threshold - 1e-9) output = 1;
        if (accumulated <= 1e-9) output = 0;
      }
      if (change.ms > ms) break;
      raw = change.value;
      start = change.ms;
    }
    return { ms, raw, accumulated, output };
  }
  function filterState(seconds2) {
    const ms = Number((clamp((seconds2 - 1) / 10) * 16).toFixed(9));
    return { ...filterAt(ms), summary: seconds2 >= 11 };
  }
  var subtitles = {
    "rising-edge": [
      { start: 0, end: 2, text: "\u677E\u5F00\u65F6\u8F93\u5165\u4E3A 0\uFF0C\u6309\u4E0B\u65F6\u8F93\u5165\u4E3A 1\u3002" },
      { start: 2, end: 4, text: "0 \u53D8\u4E3A 1\uFF1A\u51FA\u73B0\u4E0A\u5347\u6CBF\uFF0C\u8BA1\u6570\u52A0 1\u3002" },
      { start: 4, end: 7, text: "\u4E00\u76F4\u6309\u4F4F\uFF0C\u6CA1\u6709\u65B0\u4E0A\u5347\u6CBF\uFF0C\u8BA1\u6570\u4FDD\u6301 1\u3002" },
      { start: 7, end: 9, text: "\u677E\u5F00\u662F\u4E0B\u964D\u6CBF\uFF0C\u4E0D\u589E\u52A0\u8BA1\u6570\u3002" },
      { start: 9, end: 12, text: "\u518D\u6B21\u6309\u4E0B\uFF0C\u51FA\u73B0\u65B0\u7684\u4E0A\u5347\u6CBF\uFF0C\u8BA1\u6570\u53D8\u4E3A 2\u3002" },
      { start: 12, end: 15, text: "\u53EA\u5728 0 \u2192 1 \u65F6\u8BA1\u6570\uFF1B\u4FDD\u6301\u4E3A 1 \u4E0D\u91CD\u590D\u8BA1\u6570\u3002" }
    ],
    "input-filter": [
      { start: 0, end: 5, text: "\u672C\u4F8B\u7684\u77ED\u6682\u6296\u52A8\u672A\u8FBE\u6EE4\u6CE2\u9608\u503C\uFF0C\u8F93\u51FA\u4FDD\u6301 0\u3002" },
      { start: 5, end: 9, text: "\u8F93\u5165\u6301\u7EED\u4E3A 1\uFF0C\u6EE4\u6CE2\u7D2F\u8BA1\u503C\u9010\u6E10\u589E\u52A0\u3002" },
      { start: 9, end: 11, text: "\u8FBE\u5230\u9608\u503C\uFF0C\u8F93\u51FA\u624D\u53D8\u4E3A 1\u3002" },
      { start: 11, end: 15, text: "\u6EE4\u6CE2\u6291\u5236\u77ED\u6682\u6270\u52A8\uFF0C\u4E5F\u4F1A\u5E26\u6765\u54CD\u5E94\u5EF6\u8FDF\u3002" }
    ]
  };
  function subtitleAt(lesson2, seconds2) {
    return subtitles[lesson2].find((c) => seconds2 >= c.start && seconds2 < c.end)?.text ?? subtitles[lesson2].at(-1).text;
  }
  var titles = {
    "rising-edge": "\u4E0A\u5347\u6CBF\u68C0\u6D4B\u4E0E\u8BA1\u6570\u5668\u5355\u6B21\u8BA1\u6570",
    "input-filter": "PLC \u8F93\u5165\u6EE4\u6CE2\u4E0E\u4FE1\u53F7\u6296\u52A8\u6D88\u9664\u8FC7\u7A0B"
  };

  // src/scene.ts
  var C = { ink: "#183c45", muted: "#657b80", line: "#dfe7e2", paper: "#f8f9f4", teal: "#008579", pale: "#e4f3ec", orange: "#dc6430", warm: "#fff0e5", white: "#ffffff" };
  var esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  var n = (v) => Number(v.toFixed(3));
  var text = (x, y, s, size = 32, color = C.ink, weight = 400, anchor = "start") => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${esc(s)}</text>`;
  var rect = (x, y, w, h, fill, radius = 16, stroke = "none") => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  var line = (x1, y1, x2, y2, color = C.line, width = 2, extra = "") => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
  var path = (d, color, width = 6, extra = "") => `<path d="${d}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  var dot = (x, y, r, color) => `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${color}"/>`;
  var group = (opacity, body) => `<g opacity="${n(clamp(opacity))}">${body}</g>`;
  var arrow = (x1, y, x2, color = C.line) => line(x1, y, x2, y, color, 4) + path(`M${x2 - 12} ${y - 9}L${x2} ${y}L${x2 - 12} ${y + 9}`, color, 4);
  function frame(lesson2, t, body) {
    const first = lesson2 === "rising-edge";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="${titles[lesson2]}" style="font-family:'Noto Sans SC',sans-serif">
  ${rect(0, 0, 1920, 1080, C.paper, 0)}
  ${text(96, 70, "PLC \u5E94\u7528\u6280\u672F", 25, C.muted, 500)}
  ${text(1824, 70, `\u5FAE\u52A8\u753B ${first ? "06" : "10"} / 15 \u79D2`, 25, C.muted, 400, "end")}
  ${text(96, 157, first ? "\u4E0A\u5347\u6CBF\u4E0E\u5355\u6B21\u8BA1\u6570" : "\u8F93\u5165\u6EE4\u6CE2\u4E0E\u4FE1\u53F7\u6296\u52A8", 54, C.ink, 700)}
  ${line(96, 199, 1824, 199)}
  ${body}
  ${rect(96, 880, 1728, 110, C.ink, 18)}
  ${text(960, 949, subtitleAt(lesson2, t), 38, C.white, 500, "middle")}
  ${text(96, 1041, first ? "\u793A\u610F\u5DF2\u6162\u653E\uFF1B\u4E00\u62CD = \u4E00\u4E2A\u626B\u63CF\u5468\u671F\u3002" : "\u793A\u4F8B\u6EE4\u6CE2\u9608\u503C 6.4 ms\uFF1B\u65F6\u95F4\u5DF2\u6162\u653E\u3002", 26, C.muted)}
  ${rect(1390, 1026, 434, 5, "#dce6df", 2)}${rect(1390, 1026, 434 * t / 15, 5, C.teal, 2)}
  </svg>`;
  }
  function pushButton(t, input) {
    const last = t >= 11 ? 11 : t >= 9 ? 9 : t >= 7 ? 7 : t >= 2 ? 2 : 0;
    const travel = clamp((t - last) / 0.18);
    const depression = last === 0 ? 0 : input ? travel : 1 - travel;
    const y = 365 + 24 * depression;
    const x = 160;
    return rect(x - 9, 424, 198, 131, "#dde7e0", 26, "#c2d3c9") + `<ellipse cx="250" cy="430" rx="84" ry="29" fill="#a9bdb1"/>` + rect(x + 12, y, 156, 69 - 24 * depression, "#b85227", 12) + `<ellipse cx="250" cy="${n(y)}" rx="78" ry="30" fill="${input ? C.orange : "#f09b6e"}"/>` + dot(250, 510, 11, input ? C.teal : "#9bada3") + (input ? path("M250 302V335M237 323L250 337L263 323", C.orange, 5) : "");
  }
  function step(values, end, low, high, x, w) {
    let d = `M${x} ${values[0] ? high : low}`;
    for (let i = 0; i < Math.ceil(end); i++) {
      d += `H${n(x + Math.min(i + 1, end) / 12 * w)}`;
      if (i + 1 <= end && i + 1 < values.length) d += `V${values[i + 1] ? high : low}`;
    }
    return d;
  }
  function rising(t) {
    const s = edgeState(t), gx = 560, gw = 820;
    const x = (cycle) => gx + cycle / 12 * gw;
    const pressAge = t >= 9 ? t - 9 : t - 2;
    const pressFlash = pressAge >= 0 && pressAge < 1 ? 1 - pressAge * 0.65 : 0;
    const status = t < 2 ? "\u677E\u5F00" : t < 4 ? "\u6309\u4E0B" : t < 7 ? "\u4E00\u76F4\u6309\u4F4F" : t < 9 ? "\u677E\u5F00" : t < 11 ? "\u518D\u6B21\u6309\u4E0B" : "\u677E\u5F00";
    let body = text(250, 277, "\u6309\u94AE", 33, C.ink, 600, "middle") + pushButton(t, s.input) + text(250, 636, status, 38, s.input ? C.orange : C.muted, 600, "middle") + text(250, 690, s.input ? "\u8F93\u5165\u4E3A 1" : "\u8F93\u5165\u4E3A 0", 29, C.muted, 400, "middle") + arrow(383, 424, 465, s.input ? C.orange : "#baccc2");
    body += text(gx, 277, "\u8F93\u5165\u7535\u5E73", 33, C.orange, 600) + text(gx, 546, "\u8FB9\u6CBF\u8109\u51B2", 33, C.teal, 600);
    for (let i = 0; i <= 12; i++) {
      body += line(x(i), 340, x(i), 430, C.line, 1, 'stroke-dasharray="3 8"') + line(x(i), 600, x(i), 690, C.line, 1, 'stroke-dasharray="3 8"');
    }
    for (const [y, value] of [[340, "1"], [430, "0"], [600, "1"], [690, "0"]]) {
      body += line(gx, y, gx + gw, y, C.line, 1) + text(gx - 30, y + 11, value, 30, C.muted, 400, "end");
    }
    body += path(step(SCANS.map((v) => v.input), s.position, 430, 340, gx, gw), C.orange, 7) + path(step(SCANS.map((v) => v.pulse), s.position, 690, 600, gx, gw), C.teal, 7);
    if (t > 0 && t < 12) body += line(x(s.position), 325, x(s.position), 707, "#829e97", 2, 'stroke-dasharray="5 8" opacity="0.5"');
    if (t >= 2) {
      body += dot(x(2), 340, 7, C.orange) + path(`M${x(2)} 720V733H${x(3)}V720`, C.teal, 3) + text(x(2.5), 776, "1 \u4E2A\u626B\u63CF\u5468\u671F", 29, C.teal, 500, "middle");
    }
    if (t >= 9) body += dot(x(9), 340, 7, C.orange);
    if (t >= 2 && t < 4) body += text(x(2), 315, "\u4E0A\u5347\u6CBF", 32, C.orange, 600, "middle");
    if (t >= 4 && t < 7) body += text(x(4.4), 315, "\u4FDD\u6301\u4E3A 1", 32, C.orange, 600, "middle");
    if (t >= 7 && t < 9) body += text(x(7), 315, "\u4E0B\u964D\u6CBF", 32, C.muted, 500, "middle");
    if (t >= 9 && t < 12) body += text(x(9), 315, "\u65B0\u7684\u4E0A\u5347\u6CBF", 32, C.orange, 600, "middle");
    if (s.summary) {
      for (const cycle of [2, 9]) {
        body += rect(x(cycle) - 10, 590, gw / 12 + 20, 110, "none", 9, C.teal);
      }
      body += text(1100, 315, "2 \u6B21\u4E0A\u5347\u6CBF", 32, C.orange, 600, "middle");
    }
    body += text(gx + gw, 828, "\u65F6\u95F4 \u2192", 27, C.muted, 400, "end");
    body += text(1640, 277, "\u8BA1\u6570", 33, C.ink, 600, "middle") + dot(1640, 465, 133, C.pale) + text(1640, 521, String(s.cv), 160, C.teal, 600, "middle");
    if (pressFlash) body += group(pressFlash, text(1640, 664 - pressAge * 16, "+1", 56, C.teal, 600, "middle"));
    else body += text(1640, 659, s.summary ? "\u5171\u8BA1 2 \u6B21" : s.cv ? `\u4FDD\u6301 ${s.cv}` : "\u4ECE 0 \u5F00\u59CB", 34, C.muted, 500, "middle");
    if (s.pulse) body += path("M1410 645H1450Q1468 645 1468 626V500H1485", C.teal, 4) + path("M1476 491L1487 500L1476 509", C.teal, 4);
    return frame("rising-edge", t, body);
  }
  function filter(t) {
    const s = filterState(t), gx = 440, gw = 1050;
    const x = (ms) => gx + ms / 16 * gw;
    const output = [{ ms: 0, value: 0 }, { ms: 12.8, value: 1 }];
    let body = text(108, 378, "\u6EE4\u6CE2\u524D", 39, C.orange, 600) + text(108, 425, "\u539F\u59CB\u8F93\u5165", 28, C.muted) + text(108, 700, "\u6EE4\u6CE2\u540E", 39, C.teal, 600) + text(108, 747, "\u8F93\u51FA\u4FE1\u53F7", 28, C.muted);
    for (let ms = 0; ms <= 16; ms += 4) {
      body += line(x(ms), 331, x(ms), 423, C.line, 1, 'stroke-dasharray="3 8"') + line(x(ms), 656, x(ms), 748, C.line, 1, 'stroke-dasharray="3 8"');
    }
    for (const [y, value] of [[335, "1"], [415, "0"], [660, "1"], [740, "0"]]) {
      body += line(gx, y, gx + gw, y, C.line, 1) + text(gx - 30, y + 11, value, 30, C.muted, 400, "end");
    }
    const trace = (points, low) => {
      let d = `M${gx} ${low}`;
      for (const p of points) {
        if (p.ms > s.ms) break;
        d += `H${n(x(p.ms))}V${low - p.value * 80}`;
      }
      return d + `H${n(x(s.ms))}`;
    };
    if (t >= 2) {
      body += rect(x(1.6) - 14, 317, x(4) - x(1.6) + 28, 117, C.warm, 12) + text(x(2.8), 287, "\u77ED\u6682\u6296\u52A8", 32, C.orange, 500, "middle");
    }
    body += path(trace(RAW, 415), C.orange, 7) + path(trace(output, 740), C.teal, 7);
    body += text(1640, 407, String(s.raw), 90, C.orange, 600, "middle") + text(1640, 732, String(s.output), 90, C.teal, 600, "middle");
    const meterX = 650, meterW = 580;
    body += text(gx, 539, "\u7D2F\u8BA1\u503C", 30, C.muted) + text(meterX + meterW / 2, 500, `${s.accumulated.toFixed(1)} ms`, 32, C.ink, 600, "middle") + rect(meterX, 523, meterW, 22, "#dde7e0", 11) + rect(meterX, 523, meterW * s.accumulated / 6.4, 22, s.output ? C.teal : C.orange, 11) + line(meterX + meterW, 513, meterX + meterW, 555, C.teal, 3) + text(1270, 542, "\u9608\u503C 6.4 ms", 30, C.teal, 500);
    if (t >= 3.9 && t < 9) body += text(x(2.8), 697, "\u672A\u901A\u8FC7", 30, C.teal, 500, "middle");
    if (t >= 5 && t < 9) body += text(x(9), 287, "\u6301\u7EED\u4E3A 1", 32, C.orange, 500, "middle");
    if (t >= 9) {
      body += dot(x(12.8), 660, 8, C.teal) + line(x(6.4), 440, x(6.4), 470, "#9cbbb0", 2, 'stroke-dasharray="6 9"') + line(x(6.4), 585, x(6.4), 806, "#9cbbb0", 2, 'stroke-dasharray="6 9"') + line(x(12.8), 670, x(12.8), 806, "#9cbbb0", 2, 'stroke-dasharray="6 9"') + path(`M${x(6.4)} 787V804H${x(12.8)}V787`, C.teal, 3) + text(x(9.6), 849, "\u5EF6\u8FDF 6.4 ms", 31, C.teal, 600, "middle");
    }
    if (s.summary) body += text(x(2.8), 697, "\u6296\u52A8\u672A\u901A\u8FC7", 30, C.teal, 500, "middle") + text(x(13.5), 620, "\u6709\u6548\u4FE1\u53F7\u901A\u8FC7", 31, C.teal, 600, "middle");
    body += text(1768, 837, "\u65F6\u95F4 \u2192", 27, C.muted, 400, "end");
    return frame("input-filter", t, body);
  }
  function renderScene(lesson2, seconds2) {
    const t = clamp(Number.isFinite(seconds2) ? seconds2 : 0, 0, 15);
    return lesson2 === "rising-edge" ? rising(t) : filter(t);
  }

  // src/player.ts
  var lesson = document.body.dataset.lesson;
  var stage = document.querySelector("#stage");
  var toggle = document.querySelector("#toggle");
  var restart = document.querySelector("#restart");
  var timer = document.querySelector("#timer");
  var progress = document.querySelector("#progress");
  var stillTime = new URLSearchParams(location.search).get("t");
  var seconds = stillTime === null ? 0 : Math.max(0, Math.min(15, Number(stillTime) || 0));
  var playing = stillTime === null && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  var previous = performance.now();
  var handle = 0;
  function paint() {
    stage.innerHTML = renderScene(lesson, seconds);
    stage.dataset.time = seconds.toFixed(3);
    timer.textContent = `${Math.min(15, Math.floor(seconds)).toString().padStart(2, "0")} / 15 s`;
    progress.style.width = `${seconds / DURATION * 100}%`;
    toggle.textContent = playing ? "\u6682\u505C" : seconds >= DURATION ? "\u518D\u770B\u4E00\u904D" : "\u64AD\u653E";
    toggle.setAttribute("aria-label", playing ? "\u6682\u505C\u52A8\u753B" : seconds >= DURATION ? "\u91CD\u65B0\u64AD\u653E\u52A8\u753B" : "\u64AD\u653E\u52A8\u753B");
    restart.hidden = seconds >= DURATION;
    const status = document.querySelector("#play-status");
    if (status) status.textContent = seconds >= DURATION ? "\u5DF2\u7ED3\u675F \xB7 \u505C\u7559\u5728\u7ED3\u8BBA" : "\u65E0\u58F0 \xB7 \u81EA\u52A8\u6F14\u793A";
  }
  function tick(now) {
    if (playing && !document.hidden) {
      seconds = Math.min(DURATION, seconds + Math.max(0, now - previous) / 1e3);
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
  toggle.addEventListener("click", () => {
    if (seconds >= DURATION) seconds = 0;
    playing = !playing;
    begin();
  });
  restart.addEventListener("click", () => {
    seconds = 0;
    playing = true;
    begin();
  });
  var fullscreen = document.querySelector("#fullscreen");
  if (fullscreen && !document.fullscreenEnabled) fullscreen.hidden = true;
  fullscreen?.addEventListener("click", async () => {
    const viewer = document.querySelector(".viewer");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await viewer?.requestFullscreen();
    } catch {
      fullscreen.textContent = "\u5168\u5C4F\u4E0D\u53EF\u7528";
    }
  });
  document.addEventListener("fullscreenchange", () => {
    if (fullscreen) fullscreen.textContent = document.fullscreenElement ? "\u9000\u51FA\u5168\u5C4F" : "\u5168\u5C4F";
  });
  document.addEventListener("visibilitychange", begin);
  begin();
  void document.fonts?.load('500 24px "Noto Sans SC"').catch(() => {
  });
})();
