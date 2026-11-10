/* Autoproperty documents · charts (DESIGN.md § 5–6). No dependencies.
   Markup: <div class="apd-chart"><script type="application/json">{ "type": "bars", ... }</script></div>
   APCharts.renderAll() draws every chart on the page; charts redraw when their box changes width.
   Rules carried here: colour by job (emphasis = ink + stone; categorical = data hues in fixed order, never cycled);
   one axis; thin marks (bars ≤ 24 px, 4 px rounded data ends, 2 px lines, ≥ 8 px markers with a 2 px surface ring,
   2 px gaps); direct labels only where the title points; a legend for two or more series; a table view; an accessible
   name that reads the chart as one sentence; Norwegian number formats. */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const RC = 0.3813; // the polygon family's corner: 38.13 % of the outer radius
  const D2R = Math.PI / 180;

  /* ---------- helpers ---------- */
  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs || {}) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  // The kit's CSS sets svg text size and colour, and CSS beats presentation attributes: a size, colour or weight given
  // here is written as an inline style so it wins (a class such as lbl-strong keeps its own colour and weight).
  function styled(attrs) {
    const a = Object.assign({}, attrs || {}), css = [];
    [["font-size", v => v + "px"], ["fill", v => v], ["font-weight", v => v]].forEach(([k, f]) => { if (a[k] != null && a.class && k !== "font-size") { delete a[k]; return; } if (a[k] != null) { css.push(`${k}:${f(a[k])}`); delete a[k]; } });
    if (css.length) a.style = css.join(";");
    return a;
  }
  function text(parent, x, y, str, attrs) {
    const t = el("text", Object.assign({ x, y }, styled(attrs)), parent);
    t.textContent = str;
    return t;
  }
  // Norwegian numbers: a no-break space for thousands, a comma for decimals ("14 250", "8,4").
  function num(v, d) {
    if (v == null || Number.isNaN(v)) return "–";
    const dec = d == null ? (Math.abs(v) < 10 && v % 1 ? 1 : 0) : d;
    const s = Math.abs(v).toFixed(dec).split(".");
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return (v < 0 ? "−" : "") + s.join(",");
  }
  function fmt(v, spec) {
    const u = spec.unit || "";
    const n = num(v, spec.decimals);
    if (!u) return n;
    if (u === "%") return n + " %";
    return n + " " + u;
  }
  function niceTicks(min, max, count) {
    if (max === min) max = min + 1;
    const raw = (max - min) / Math.max(1, count);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || raw;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, out = [];
    for (let v = lo; v <= hi + step / 2; v += step) out.push(+v.toFixed(10));
    return out;
  }
  // The polygon family: rounded n-gon, corner circle at 38.13 % of the outer radius; odd counts point up.
  function ngonPath(n, cx, cy, Rout, rot) {
    if (n <= 2 || n > 12) return `M${cx - Rout} ${cy}a${Rout} ${Rout} 0 1 0 ${Rout * 2} 0a${Rout} ${Rout} 0 1 0 ${-Rout * 2} 0Z`;
    rot = rot == null ? -90 : rot;
    const rc = Rout * RC, R = Rout - rc, steps = 10, pts = [];
    for (let k = 0; k < n; k++) {
      const a = (rot + 360 * k / n) * D2R, vx = cx + R * Math.cos(a), vy = cy + R * Math.sin(a);
      const a0 = (rot + 360 * (k - .5) / n) * D2R, a1 = (rot + 360 * (k + .5) / n) * D2R;
      for (let s = 0; s <= steps; s++) { const t = a0 + (a1 - a0) * s / steps; pts.push([vx + rc * Math.cos(t), vy + rc * Math.sin(t)]); }
    }
    return "M" + pts.map(p => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + "Z";
  }
  // Series markers: circle, diamond (4), home (5), triangle (3) — a second channel beside colour.
  const SHAPES = [0, 4, 5, 3];
  function marker(parent, slot, cx, cy, r, color) {
    const n = SHAPES[slot % SHAPES.length];
    const R = n === 0 ? r : n === 4 ? r * 1.25 : n === 3 ? r * 1.35 : r * 1.18;
    const d = n === 0 ? ngonPath(0, cx, cy, r) : ngonPath(n, cx, cy, R, n === 4 ? -90 : -90);
    return el("path", { d, fill: color, stroke: "var(--page)", "stroke-width": 2, "paint-order": "stroke" }, parent);
  }
  function legendIcon(slot, color) {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 12 12"); s.setAttribute("aria-hidden", "true");
    marker(s, slot, 6, 6, 4.2, color).setAttribute("stroke", "none");
    return s;
  }
  const dataColor = i => `var(--data-${(i % 4) + 1})`;
  function colorOf(name) {
    const map = { mark: "var(--mark)", accent: "var(--accent)", quiet: "var(--chart-quiet)", needs: "var(--needs-you)", wait: "var(--waiting)", done: "var(--done)", info: "var(--info)" };
    if (!name) return null;
    if (map[name]) return map[name];
    const m = /^data-(\d)$/.exec(name);
    return m ? `var(--data-${m[1]})` : name;
  }
  // A bar with a rounded data end and a square baseline end.
  function barPath(x, y, w, h, horizontal) {
    const r = Math.min(4, (horizontal ? h : w) / 2, horizontal ? w : h);
    if (h <= 0 || w <= 0) return "";
    if (!horizontal) return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
    return `M${x} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x}Z`;
  }
  function cssNum(node, prop, fallback) {
    const v = parseFloat(getComputedStyle(node).getPropertyValue(prop));
    return Number.isFinite(v) ? v : fallback;
  }
  // Mark scale: 1 on paper, larger on slides (the format's label size against A4's 11.5 px).
  const kOf = box => Math.max(1, cssNum(box, "--t-label", 11.5) / 11.5);
  // Rough text width (Inter at its size); used only to reserve room for labels.
  const tw = (s, size) => String(s).length * size * 0.56;

  // A short paragraph in SVG: words wrapped at `chars` per line; returns the lines drawn.
  function para(parent, x, y, str, size, lh, chars, attrs) {
    const words = String(str).split(/\s+/), lines = [];
    let cur = "";
    words.forEach(w => { if (cur && (cur + " " + w).length > chars) { lines.push(cur); cur = w; } else cur = cur ? cur + " " + w : w; });
    if (cur) lines.push(cur);
    const t = el("text", Object.assign({ x, y }, styled(Object.assign({ "font-size": size }, attrs || {}))), parent);
    lines.forEach((l, i) => { const s = el("tspan", { x, dy: i ? lh : 0 }, t); s.textContent = l; });
    return lines.length;
  }

  /* ---------- the chart shell: svg, legend, tooltip, table view ---------- */
  function shell(box, spec, W, H) {
    box.textContent = "";
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", "aria-label": spec.summary || spec.title || "Chart" }, box);
    const tip = document.createElement("div");
    tip.className = "apd-tip"; tip.setAttribute("aria-hidden", "true");
    box.appendChild(tip);
    return { svg, tip };
  }
  function hover(box, tip, target, label) {
    const show = () => {
      const k = box.getBoundingClientRect().width / (parseFloat(getComputedStyle(box).width) || 1) || 1;
      const b = box.getBoundingClientRect(), r = target.getBoundingClientRect();
      tip.textContent = label;
      tip.style.left = ((r.left + r.width / 2 - b.left) / k) + "px";
      tip.style.top = ((r.top - b.top) / k) + "px";
      tip.classList.add("is-on");
    };
    const hide = () => tip.classList.remove("is-on");
    target.addEventListener("pointerenter", show);
    target.addEventListener("pointerleave", hide);
    target.addEventListener("focus", show);
    target.addEventListener("blur", hide);
    target.setAttribute("tabindex", "0");
    target.setAttribute("aria-label", label);
    target.style.cursor = "default";
    target.style.outline = "none";
  }
  function legend(fig, items) {
    if (!items || items.length < 2) return;
    const L = document.createElement("div");
    L.className = "apd-legend";
    items.forEach(it => {
      const s = document.createElement("span");
      s.appendChild(legendIcon(it.slot, it.color));
      s.appendChild(document.createTextNode(it.label));
      L.appendChild(s);
    });
    fig.appendChild(L);
  }
  function tableView(fig, head, rows, id) {
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "apd-tablebtn"; btn.textContent = "Show the numbers";
    const t = document.createElement("table");
    t.className = "apd-table apd-datatable"; t.hidden = true; t.id = id;
    btn.setAttribute("aria-controls", id); btn.setAttribute("aria-expanded", "false");
    const tr = document.createElement("tr");
    head.forEach((h, i) => { const th = document.createElement("th"); th.textContent = h; if (i) th.className = "n"; tr.appendChild(th); });
    const thead = document.createElement("thead"); thead.appendChild(tr); t.appendChild(thead);
    const tb = document.createElement("tbody");
    rows.forEach(r => { const row = document.createElement("tr"); r.forEach((c, i) => { const td = document.createElement("td"); td.textContent = c; if (i) td.className = "n"; row.appendChild(td); }); tb.appendChild(row); });
    t.appendChild(tb);
    btn.addEventListener("click", () => { t.hidden = !t.hidden; btn.setAttribute("aria-expanded", String(!t.hidden)); btn.textContent = t.hidden ? "Show the numbers" : "Hide the numbers"; });
    fig.appendChild(btn); fig.appendChild(t);
  }

  /* ---------- the forms ---------- */
  const F = {};

  // Columns over time: the highlighted period in ink, the rest in stone; its value written once above it.
  F.bars = (box, spec, W) => {
    const cap = cssNum(box, "--t-cap", 10.5), H = spec.height || Math.round(Math.max(120, W * 0.42));
    const { svg, tip } = shell(box, spec, W, H);
    const v = spec.values, n = v.length, hi = spec.highlight == null ? n - 1 : spec.highlight;
    const top = cap * 2.4, bottom = cap * 2, left = spec.axis ? tw(num(Math.max(...v)), cap) + 8 : 0;
    const max = spec.max || niceTicks(0, Math.max(...v), 4).slice(-1)[0];
    const ph = H - top - bottom, slot = (W - left) / n, bw = Math.min(24 * kOf(box), slot * 0.62);
    if (spec.axis) niceTicks(0, max, 4).forEach(t => { const y = top + ph - ph * t / max; el("line", { x1: left, x2: W, y1: y, y2: y, stroke: "var(--chart-grid)" }, svg); text(svg, left - 6, y + cap * .35, num(t), { "text-anchor": "end" }); });
    el("line", { x1: left, x2: W, y1: top + ph, y2: top + ph, stroke: "var(--chart-axis)" }, svg);
    v.forEach((val, i) => {
      const h = ph * val / max, x = left + slot * i + (slot - bw) / 2, y = top + ph - h;
      const isHi = i === hi || (spec.red || []).includes(i);
      const p = el("path", { d: barPath(x, y, bw, h), fill: (spec.red || []).includes(i) ? "var(--needs-you)" : isHi ? "var(--mark)" : "var(--chart-quiet)" }, svg);
      hover(box, tip, p, `${spec.labels[i]}: ${fmt(val, spec)}`);
      if (n <= 16 || i % Math.ceil(n / 12) === 0 || i === n - 1) text(svg, x + bw / 2, H - cap * .5, spec.labels[i], { "text-anchor": "middle", class: i === hi ? "lbl-strong" : null });
      if (i === hi) text(svg, x + bw / 2, y - cap * .7, fmt(val, spec), { "text-anchor": "middle", class: "lbl-strong" });
    });
    return { head: [spec.xLabel || "", spec.valueLabel || "Value"], rows: v.map((x, i) => [spec.labels[i], fmt(x, spec)]) };
  };

  // Ranked bars: sorted, label left, value at the end; over the named threshold in ink and bold (red stays for the lit card, BRIEF § 11.1).
  F.ranked = (box, spec, W) => {
    const cap = cssNum(box, "--t-cap", 10.5), lab = cssNum(box, "--t-label", 11.5);
    let items = spec.labels.map((l, i) => ({ l, v: spec.values[i], i }));
    if (spec.sort !== false) items.sort((a, b) => b.v - a.v);
    const row = Math.max(lab * 2.2, 22), H = spec.height || Math.round(items.length * row + cap * 2);
    const { svg, tip } = shell(box, spec, W, H);
    const left = Math.min(W * .42, Math.max(...items.map(d => tw(d.l, lab))) + 12), right = tw(fmt(Math.max(...spec.values), spec), lab) + 10;
    const max = spec.max || Math.max(...spec.values, spec.threshold ? spec.threshold.value : 0) * 1.02, pw = W - left - right, bh = Math.min(16, row * .5);
    items.forEach((d, k) => {
      const y = k * row + (row - bh) / 2, w = Math.max(2, pw * d.v / max), over = spec.threshold && d.v > spec.threshold.value;
      const focus = spec.highlight != null && spec.highlight === d.i;
      text(svg, left - 10, y + bh / 2 + lab * .35, d.l, { "text-anchor": "end", "font-size": lab, class: over || focus ? "lbl-strong" : null, fill: "var(--text-body)" });
      const p = el("path", { d: barPath(left, y, w, bh, true), fill: over || focus ? "var(--mark)" : spec.threshold ? "var(--chart-quiet)" : "var(--mark)" }, svg);
      hover(box, tip, p, `${d.l}: ${fmt(d.v, spec)}`);
      text(svg, left + w + 6, y + bh / 2 + lab * .35, fmt(d.v, spec), { "font-size": lab, class: "lbl-strong" });
    });
    if (spec.threshold) {
      const x = left + pw * spec.threshold.value / max;
      el("line", { x1: x, x2: x, y1: 0, y2: items.length * row, stroke: "var(--line-strong)", "stroke-width": 1, "stroke-dasharray": "3 3" }, svg);
      text(svg, x + 4, H - cap * .3, spec.threshold.label || fmt(spec.threshold.value, spec), {});
    }
    return { head: [spec.itemLabel || "", spec.valueLabel || "Value"], rows: items.map(d => [d.l, fmt(d.v, spec)]) };
  };

  // Lines over time. One series: ink with a 10 % wash. Several: data hues with markers at the end and end labels,
  // or emphasis (one in ink, the rest in stone) when spec.emphasis names the series the title is about.
  F.line = (box, spec, W) => {
    const cap = cssNum(box, "--t-cap", 10.5), H = spec.height || Math.round(Math.max(140, W * 0.45));
    const { svg, tip } = shell(box, spec, W, H);
    const S = spec.series, all = S.flatMap(s => s.values).filter(v => v != null);
    const ticks = niceTicks(spec.yMin != null ? spec.yMin : Math.min(0, ...all), spec.yMax || Math.max(...all), 4);
    const lo = ticks[0], hi = ticks[ticks.length - 1];
    const left = tw(num(hi), cap) + 8, endRoom = S.length > 1 || spec.endLabel !== false ? Math.max(...S.map(s => tw(s.name + " " + fmt(s.values[s.values.length - 1], spec), cap))) + 14 : 10;
    const top = cap, bottom = cap * 2.2, pw = W - left - endRoom, ph = H - top - bottom, n = spec.labels.length;
    const X = i => left + pw * (n === 1 ? .5 : i / (n - 1)), Y = v => top + ph - ph * (v - lo) / (hi - lo);
    // Phases: quiet bands behind the line, each named once at its top (STYLE.md: annotated data).
    (spec.bands || []).forEach((b, bi) => { const x0 = X(b.from), x1 = X(b.to); if (bi % 2 === 0 && x1 > x0) el("rect", { x: x0, y: top, width: x1 - x0, height: ph, fill: "var(--chart-grid)", opacity: .6 }, svg); text(svg, x0 + 6, top + cap * 1.2, b.label, { class: "lbl-strong" }); });
    ticks.forEach(t => { el("line", { x1: left, x2: left + pw, y1: Y(t), y2: Y(t), stroke: t === lo ? "var(--chart-axis)" : "var(--chart-grid)" }, svg); text(svg, left - 6, Y(t) + cap * .35, num(t), { "text-anchor": "end" }); });
    const every = Math.ceil(n / 8);
    spec.labels.forEach((l, i) => { if ((i % every === 0 && n - 1 - i >= every) || i === n - 1) text(svg, X(i), H - cap * .4, l, { "text-anchor": i === 0 ? "start" : i === n - 1 ? "end" : "middle" }); });
    const single = S.length === 1, emph = spec.emphasis;
    const ends = [];
    S.forEach((s, si) => {
      const lead = single || si === emph, hue = colorOf(spec.color) || "var(--mark)";
      const color = single ? hue : emph != null ? (si === emph ? hue : "var(--chart-quiet)") : dataColor(si);
      const pts = s.values.map((v, i) => v == null ? null : [X(i), Y(v)]);
      const d = pts.reduce((acc, p, i) => p ? acc + (acc && pts[i - 1] ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1) : acc, "");
      if ((single && spec.area !== false) || s.area) el("path", { d: d + `L${X(n - 1)} ${Y(lo)}L${X(0)} ${Y(lo)}Z`, fill: color, "fill-opacity": .07, stroke: "none" }, svg);
      // Luminous: the lead line glows on a dark ground; two wide, faint strokes beneath it (vector, prints the same).
      if (spec.glow && lead) [[14, .08], [7, .16]].forEach(([w, o]) => el("path", { d: spec.forecastFrom != null ? pts.slice(0, spec.forecastFrom + 1).reduce((acc, p) => p ? acc + (acc ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1) : acc, "") : d, fill: "none", stroke: color, "stroke-width": w * Math.min(1.5, kOf(box)), "stroke-opacity": o, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg));
      // A forecast is never drawn like a fact: the lead line turns dashed from spec.forecastFrom.
      const f = lead && spec.forecastFrom != null ? spec.forecastFrom : null;
      const part = (a, b) => pts.slice(a, b + 1).reduce((acc, p) => p ? acc + (acc ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1) : acc, "");
      const sw = (lead && spec.glow ? 2.5 : 2) * Math.min(1.5, kOf(box));
      if (f == null) el("path", { d, fill: "none", stroke: color, "stroke-width": sw, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
      else { el("path", { d: part(0, f), fill: "none", stroke: color, "stroke-width": sw, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
        el("path", { d: part(f, n - 1), fill: "none", stroke: color, "stroke-width": sw, "stroke-dasharray": `${sw * 2} ${sw * 2.2}`, "stroke-linecap": "round" }, svg);
        const noted = (spec.notes || []).some(nt => nt.at === f), nx = pts[f + 1], fy = pts[f] ? pts[f][1] : top + ph, rising = nx && nx[1] < fy - 2;
        if (spec.forecastLabel !== "" && !noted) text(svg, X(f) + 12, rising ? Math.min(top + ph - cap * .3, fy + cap * 1.4) : Math.max(top + cap, fy - cap * 1.1), spec.forecastLabel || "Forecast", { fill: "var(--text-secondary)" }); }
      const last = pts.filter(Boolean).slice(-1)[0];
      if (last) { marker(svg, single || emph != null ? 0 : si, last[0], last[1], 4 * kOf(box), color); ends.push({ y: last[1], s, si, strong: single || emph === si || emph == null }); }
      s.values.forEach((v, i) => { if (v == null) return; const hit = el("circle", { cx: X(i), cy: Y(v), r: 8, fill: "transparent" }, svg); hover(box, tip, hit, `${s.name} · ${spec.labels[i]}: ${fmt(v, spec)}`); });
    });
    // Notes on the line: a ringed dot, a leader and ≤ 10 words, above or below the point.
    (spec.notes || []).forEach(nt => {
      const s = S[nt.series != null ? nt.series : (emph != null ? emph : 0)], v = s.values[nt.at];
      if (v == null) return;
      const x = X(nt.at), y = Y(v), up = nt.side !== "below", len = (nt.lift || 3.2) * cap, ty = up ? y - len : y + len;
      const chars = nt.chars || 22, anchor = nt.at === 0 ? "start" : nt.at === n - 1 ? "end" : (nt.anchor || "middle");
      el("line", { x1: x, x2: x, y1: y + (up ? -6 : 6), y2: ty + (up ? cap * .5 : -cap * .9), stroke: "var(--line-strong)", "stroke-width": 1 }, svg);
      marker(svg, 0, x, y, 3.5 * kOf(box), nt.accent ? "var(--accent)" : "var(--mark)");
      const lines = Math.ceil(String(nt.text).length / chars);
      para(svg, x, up ? ty - (lines - 1) * cap * 1.25 : ty + cap * .2, nt.text, cap, cap * 1.25, chars, { "text-anchor": anchor, fill: "var(--text-body)" });
    });
    if (spec.endLabel !== false) {
      ends.sort((a, b) => a.y - b.y);
      for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < cap * 1.3) ends[i].y = ends[i - 1].y + cap * 1.3;
      ends.forEach(e => text(svg, left + pw + 8 + 4 * kOf(box), e.y + cap * .35, (S.length > 1 ? e.s.name + " " : "") + fmt(e.s.values[e.s.values.length - 1], spec), { class: e.strong ? "lbl-strong" : null }));
    }
    return { head: ["", ...S.map(s => s.name)], rows: spec.labels.map((l, i) => [l, ...S.map(s => fmt(s.values[i], spec))]), legend: S.length > 1 && emph == null ? S.map((s, i) => ({ label: s.name, slot: i, color: dataColor(i) })) : null };
  };
  F.area = (box, spec, W) => F.line(box, Object.assign({ area: true }, spec), W);

  // Stacked horizontal bars: part to whole per row; 2 px gaps; the total at the end.
  F.stacked = (box, spec, W) => {
    const cap = cssNum(box, "--t-cap", 10.5), lab = cssNum(box, "--t-label", 11.5);
    const rows = spec.labels, keys = spec.keys, row = Math.max(lab * 2.4, 26), H = spec.height || Math.round(rows.length * row);
    const { svg, tip } = shell(box, spec, W, H);
    const totals = spec.values.map(r => r.reduce((a, b) => a + b, 0)), max = spec.percent ? 100 : Math.max(...totals);
    const left = Math.min(W * .38, Math.max(...rows.map(l => tw(l, lab))) + 12), right = spec.percent ? 8 : tw(fmt(max, spec), lab) + 10, pw = W - left - right, bh = Math.min(18, row * .55);
    rows.forEach((l, ri) => {
      const y = ri * row + (row - bh) / 2;
      text(svg, left - 10, y + bh / 2 + lab * .35, l, { "text-anchor": "end", "font-size": lab, fill: "var(--text-body)" });
      let x = left;
      spec.values[ri].forEach((v, ki) => {
        const w = pw * (spec.percent ? v / totals[ri] * 100 : v) / max;
        if (w <= 0) return;
        const p = el("rect", { x, y, width: Math.max(0, w - 2), height: bh, rx: 2, fill: colorOf(spec.colors && spec.colors[ki]) || dataColor(ki) }, svg);
        hover(box, tip, p, `${l} · ${keys[ki]}: ${fmt(v, spec)}${spec.percent ? ` (${num(v / totals[ri] * 100, 0)} %)` : ""}`);
        x += w;
      });
      if (!spec.percent) text(svg, x + 4, y + bh / 2 + lab * .35, fmt(totals[ri], spec), { "font-size": lab, class: "lbl-strong" });
    });
    return { head: ["", ...keys, "Total"], rows: rows.map((l, ri) => [l, ...spec.values[ri].map(v => fmt(v, spec)), fmt(totals[ri], spec)]), legend: keys.map((k, i) => ({ label: k, slot: i, color: colorOf(spec.colors && spec.colors[i]) || dataColor(i) })) };
  };

  // The DS Share bar: one 12 px bar split by 2 px gaps; the key carries the words and counts.
  F.share = (box, spec, W) => {
    const lab = cssNum(box, "--t-label", 11.5), H = spec.height || 12;
    const { svg, tip } = shell(box, spec, W, H);
    const total = spec.total || spec.parts.reduce((a, p) => a + p.value, 0), base = ["mark", "data-1", "data-2", "quiet"];
    let x = 0;
    spec.parts.forEach((p, i) => {
      const w = W * p.value / total, color = colorOf(p.color || base[i % base.length]);
      const r = el("rect", { x, y: 0, width: Math.max(0, w - (i < spec.parts.length - 1 ? 2 : 0)), height: H, rx: Math.min(6, H / 2), fill: color }, svg);
      hover(box, tip, r, `${p.label}: ${num(p.value)} of ${num(total)}`);
      x += w;
    });
    const L = document.createElement("div");
    L.className = "apd-legend";
    spec.parts.forEach((p, i) => { const s = document.createElement("span"); const ic = document.createElementNS(NS, "svg"); ic.setAttribute("viewBox", "0 0 12 12"); el("circle", { cx: 6, cy: 6, r: 4.5, fill: colorOf(p.color || base[i % base.length]) }, ic); s.appendChild(ic); s.appendChild(document.createTextNode(`${num(p.value)} ${p.label}`)); L.appendChild(s); });
    box.appendChild(L);
    return { head: ["", "Count"], rows: spec.parts.map(p => [p.label, num(p.value)]) };
  };

  // Steps (the DS funnel): bars in step order, the last in ink; how many went on, beside each bar.
  F.steps = (box, spec, W) => {
    const lab = cssNum(box, "--t-label", 11.5), cap = cssNum(box, "--t-cap", 10.5), st = spec.steps;
    const row = Math.max(lab * 2.6, 28), H = spec.height || Math.round(st.length * row);
    const { svg, tip } = shell(box, spec, W, H);
    const left = Math.min(W * .34, Math.max(...st.map(s => tw(s.label, lab))) + 12), right = tw("100\u00a0% went on", cap) + tw(num(st[0].value), lab) + 20;
    const pw = W - left - right, bh = Math.min(18, row * .55), max = st[0].value;
    st.forEach((s, i) => {
      const y = i * row + (row - bh) / 2, w = Math.max(2, pw * s.value / max), last = i === st.length - 1;
      text(svg, left - 10, y + bh / 2 + lab * .35, s.label, { "text-anchor": "end", "font-size": lab, fill: "var(--text-body)", class: last ? "lbl-strong" : null });
      const p = el("path", { d: barPath(left, y, w, bh, true), fill: last ? "var(--mark)" : "var(--chart-quiet)" }, svg);
      const on = i ? Math.round(100 * s.value / st[i - 1].value) : null;
      hover(box, tip, p, `${s.label}: ${num(s.value)}${on != null ? ` · ${on} % of the step before` : ""}`);
      text(svg, left + w + 6, y + bh / 2 + lab * .35, num(s.value), { "font-size": lab, class: "lbl-strong" });
      if (on != null) text(svg, left + w + 12 + tw(num(s.value), lab), y + bh / 2 + lab * .35, `${on}\u00a0% went on`);
    });
    return { head: ["Step", "Count", "Of the step before"], rows: st.map((s, i) => [s.label, num(s.value), i ? Math.round(100 * s.value / st[i - 1].value) + " %" : "–"]) };
  };

  // Radar (spider): one scale on every axis, 3–8 axes, ≤ 3 series. The grid is the polygon family (five axes =
  // the home). Polygons are 2 px lines with a 10 % wash; values written at the vertices of the series in focus.
  F.radar = (box, spec, W) => {
    const lab = cssNum(box, "--t-label", 11.5), cap = cssNum(box, "--t-cap", 10.5), A = spec.axes, n = A.length;
    const S = spec.series.slice(0, 3), max = spec.max || 100, levels = spec.levels || 4;
    const labW = Math.max(...A.map(a => tw(a, lab))) + 12;
    const size = Math.min(W, spec.height || W), H = Math.round(Math.min(size, W) * (spec.aspect || 0.86));
    const { svg, tip } = shell(box, spec, W, H);
    const cx = W / 2, cy = H / 2 + (n % 2 ? lab * .6 : 0), R = Math.max(40, Math.min(W / 2 - labW, H / 2 - lab * 2.4));
    const ang = i => (-90 + 360 * i / n) * D2R;
    for (let l = levels; l >= 1; l--) el("path", { d: ngonPath(n, cx, cy, R * l / levels), fill: l === levels ? "var(--chart-grid)" : "none", "fill-opacity": l === levels ? .5 : null, stroke: "var(--chart-axis)", "stroke-width": l === levels ? 1 : .75, "stroke-opacity": l === levels ? 1 : .6 }, svg);
    A.forEach((a, i) => {
      el("line", { x1: cx, y1: cy, x2: cx + R * Math.cos(ang(i)), y2: cy + R * Math.sin(ang(i)), stroke: "var(--chart-axis)", "stroke-opacity": .6 }, svg);
      const lx = cx + (R + 12) * Math.cos(ang(i)), ly = cy + (R + 12) * Math.sin(ang(i)), c = Math.cos(ang(i));
      const anchor = Math.abs(c) < .2 ? "middle" : c > 0 ? "start" : "end", dy = Math.sin(ang(i)) < -.5 ? -lab * .4 : Math.sin(ang(i)) > .5 ? lab * 1.1 : lab * .35;
      text(svg, lx, ly + dy, a, { "text-anchor": anchor, "font-size": lab, fill: "var(--text-body)", "font-weight": 500 });
      const f = spec.focus == null ? (S.length === 1 ? 0 : null) : spec.focus;
      if (f != null) text(svg, lx, ly + dy + lab * 1.15, fmt(S[f].values[i], spec), { "text-anchor": anchor, class: "lbl-strong", "font-size": cap });
    });
    const single = S.length === 1;
    S.forEach((s, si) => {
      const color = single ? "var(--mark)" : spec.focus != null && spec.focus !== si && spec.emphasis ? "var(--chart-quiet)" : dataColor(si);
      const pts = s.values.map((v, i) => [cx + R * (v / max) * Math.cos(ang(i)), cy + R * (v / max) * Math.sin(ang(i))]);
      const d = "M" + pts.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z";
      el("path", { d, fill: color, "fill-opacity": .1, stroke: color, "stroke-width": 2 * Math.min(1.5, kOf(box)), "stroke-linejoin": "round" }, svg);
      pts.forEach((p, i) => { const m = marker(svg, single ? 0 : si, p[0], p[1], 4 * kOf(box), color); hover(box, tip, m, `${s.name} · ${A[i]}: ${fmt(s.values[i], spec)}`); });
    });
    return { head: ["", ...S.map(s => s.name)], rows: A.map((a, i) => [a, ...S.map(s => fmt(s.values[i], spec))]), legend: S.length > 1 ? S.map((s, i) => ({ label: s.name, slot: i, color: dataColor(i) })) : null };
  };

  // Slope: before → after per item; the items the title names in ink, the rest in stone.
  F.slope = (box, spec, W) => {
    const lab = cssNum(box, "--t-label", 11.5), cap = cssNum(box, "--t-cap", 10.5), it = spec.items;
    const H = spec.height || Math.round(Math.max(160, it.length * lab * 2.2));
    const { svg, tip } = shell(box, spec, W, H);
    const all = it.flatMap(d => [d.a, d.b]), lo = spec.yMin != null ? spec.yMin : Math.min(...all), hi = spec.yMax || Math.max(...all);
    const lw = Math.max(...it.map(d => tw(d.label + " " + fmt(d.a, spec), lab))) + 12, top = cap * 2.4, bottom = lab;
    const x1 = lw, x2 = W - lw, Y = v => top + (H - top - bottom) * (1 - (v - lo) / ((hi - lo) || 1));
    text(svg, x1, cap, spec.aLabel || "Before", { "text-anchor": "middle", class: "lbl-strong" });
    text(svg, x2, cap, spec.bLabel || "After", { "text-anchor": "middle", class: "lbl-strong" });
    el("line", { x1, x2: x1, y1: top - 6, y2: H - bottom + 4, stroke: "var(--chart-axis)" }, svg);
    el("line", { x1: x2, x2, y1: top - 6, y2: H - bottom + 4, stroke: "var(--chart-axis)" }, svg);
    const place = key => { const arr = it.map((d, i) => ({ i, y: Y(d[key]) })).sort((a, b) => a.y - b.y); for (let k = 1; k < arr.length; k++) if (arr[k].y - arr[k - 1].y < lab * 1.2) arr[k].y = arr[k - 1].y + lab * 1.2; const out = []; arr.forEach(o => out[o.i] = o.y); return out; };
    const la = place("a"), lb = place("b");
    it.forEach((d, i) => {
      const focus = (spec.focus || []).includes(d.label), color = focus ? "var(--mark)" : "var(--chart-quiet)";
      const line = el("line", { x1, y1: Y(d.a), x2, y2: Y(d.b), stroke: color, "stroke-width": 2, "stroke-linecap": "round" }, svg);
      marker(svg, 0, x1, Y(d.a), 4, color); marker(svg, 0, x2, Y(d.b), 4, color);
      hover(box, tip, line, `${d.label}: ${fmt(d.a, spec)} → ${fmt(d.b, spec)}`);
      text(svg, x1 - 10, la[i] + lab * .35, `${d.label} ${fmt(d.a, spec)}`, { "text-anchor": "end", "font-size": lab, class: focus ? "lbl-strong" : null });
      text(svg, x2 + 10, lb[i] + lab * .35, `${fmt(d.b, spec)} ${d.label}`, { "font-size": lab, class: focus ? "lbl-strong" : null });
    });
    return { head: ["", spec.aLabel || "Before", spec.bLabel || "After"], rows: it.map(d => [d.label, fmt(d.a, spec), fmt(d.b, spec)]) };
  };

  // Dumbbell: a range or a gap per item; two shades of one ink (stone = a, ink = b).
  F.dumbbell = (box, spec, W) => {
    const lab = cssNum(box, "--t-label", 11.5), cap = cssNum(box, "--t-cap", 10.5), it = spec.items;
    const row = Math.max(lab * 2.3, 24), H = spec.height || Math.round(it.length * row + cap * 2.2);
    const { svg, tip } = shell(box, spec, W, H);
    const all = it.flatMap(d => [d.a, d.b]), ticks = niceTicks(spec.xMin != null ? spec.xMin : Math.min(...all), spec.xMax || Math.max(...all), 4);
    const lo = ticks[0], hi = ticks[ticks.length - 1], left = Math.min(W * .36, Math.max(...it.map(d => tw(d.label, lab))) + 14), pw = W - left - 16;
    const X = v => left + pw * (v - lo) / (hi - lo), ph = it.length * row;
    ticks.forEach(t => { el("line", { x1: X(t), x2: X(t), y1: 0, y2: ph, stroke: "var(--chart-grid)" }, svg); text(svg, X(t), H - cap * .3, fmt(t, spec), { "text-anchor": "middle" }); });
    it.forEach((d, i) => {
      const y = i * row + row / 2;
      text(svg, left - 12, y + lab * .35, d.label, { "text-anchor": "end", "font-size": lab, fill: "var(--text-body)" });
      el("line", { x1: X(d.a), x2: X(d.b), y1: y, y2: y, stroke: "var(--chart-quiet)", "stroke-width": 2 }, svg);
      const a = marker(svg, 0, X(d.a), y, 4.5, "var(--chart-quiet)"), b = marker(svg, 0, X(d.b), y, 4.5, "var(--mark)");
      hover(box, tip, a, `${d.label} · ${spec.aLabel || "A"}: ${fmt(d.a, spec)}`); hover(box, tip, b, `${d.label} · ${spec.bLabel || "B"}: ${fmt(d.b, spec)}`);
    });
    return { head: ["", spec.aLabel || "A", spec.bLabel || "B"], rows: it.map(d => [d.label, fmt(d.a, spec), fmt(d.b, spec)]), legend: [{ label: spec.aLabel || "A", slot: 0, color: "var(--chart-quiet)" }, { label: spec.bLabel || "B", slot: 0, color: "var(--mark)" }] };
  };

  // Dot plot: where values fall per row; the value the title is about in ink, with its label.
  F.dots = (box, spec, W) => {
    const lab = cssNum(box, "--t-label", 11.5), cap = cssNum(box, "--t-cap", 10.5), G = spec.groups;
    const row = Math.max(lab * 2.4, 26), H = spec.height || Math.round(G.length * row + cap * 2.2);
    const { svg, tip } = shell(box, spec, W, H);
    const all = G.flatMap(g => g.values), ticks = niceTicks(spec.xMin != null ? spec.xMin : Math.min(...all), spec.xMax || Math.max(...all), 4);
    const lo = ticks[0], hi = ticks[ticks.length - 1], left = Math.min(W * .34, Math.max(...G.map(g => tw(g.label, lab))) + 14), pw = W - left - 16;
    const X = v => left + pw * (v - lo) / (hi - lo), ph = G.length * row;
    ticks.forEach(t => { el("line", { x1: X(t), x2: X(t), y1: 0, y2: ph, stroke: "var(--chart-grid)" }, svg); text(svg, X(t), H - cap * .3, fmt(t, spec), { "text-anchor": "middle" }); });
    G.forEach((g, i) => {
      const y = i * row + row / 2;
      text(svg, left - 12, y + lab * .35, g.label, { "text-anchor": "end", "font-size": lab, fill: "var(--text-body)" });
      g.values.forEach((v, k) => { const focus = g.focus === k; const m = marker(svg, 0, X(v), y, focus ? 5 : 3.5, focus ? "var(--mark)" : "var(--chart-quiet)"); m.setAttribute("fill-opacity", focus ? 1 : .9); hover(box, tip, m, `${g.label}: ${fmt(v, spec)}`); if (focus) text(svg, X(v), y - 9, fmt(v, spec), { "text-anchor": "middle", class: "lbl-strong" }); });
    });
    return { head: ["", "Values"], rows: G.map(g => [g.label, g.values.map(v => fmt(v, spec)).join(", ")]) };
  };

  // Heatmap: magnitude on the fjord ramp, 2 px gaps, the largest cell labelled.
  F.heatmap = (box, spec, W) => {
    const cap = cssNum(box, "--t-cap", 10.5), R = spec.rows, C = spec.cols, V = spec.values;
    const left = Math.max(...R.map(r => tw(r, cap))) + 10, top = cap * 2, cw = (W - left) / C.length, ch = spec.cell || Math.min(cw, 26), H = top + R.length * ch + cap * 2.4;
    const { svg, tip } = shell(box, spec, W, H);
    const flat = V.flat(), mx = Math.max(...flat), mn = Math.min(...flat), steps = 8;
    let maxCell = null;
    C.forEach((c, j) => { if (C.length <= 14 || j % Math.ceil(C.length / 12) === 0) text(svg, left + cw * j + cw / 2, cap * 1.2, c, { "text-anchor": "middle" }); });
    R.forEach((r, i) => {
      text(svg, left - 8, top + ch * i + ch / 2 + cap * .35, r, { "text-anchor": "end" });
      C.forEach((c, j) => {
        const v = V[i][j], k = mx === mn ? steps : Math.max(1, Math.ceil((v - mn) / (mx - mn) * steps));
        const rect = el("rect", { x: left + cw * j + 1, y: top + ch * i + 1, width: Math.max(0, cw - 2), height: Math.max(0, ch - 2), rx: 3, fill: v ? `var(--seq-${k})` : "var(--chart-grid)" }, svg);
        hover(box, tip, rect, `${r} · ${c}: ${fmt(v, spec)}`);
        if (v === mx && !maxCell) maxCell = { x: left + cw * j + cw / 2, y: top + ch * i + ch / 2, v };
      });
    });
    if (maxCell && cw > tw(num(mx), cap) + 4) text(svg, maxCell.x, maxCell.y + cap * .35, num(maxCell.v), { "text-anchor": "middle", fill: "var(--page)", "font-weight": 600 });
    const ly = H - cap * .8, lw = Math.min(160, W * .4);
    text(svg, left, ly + 3, fmt(mn, spec), { "text-anchor": "start" });
    for (let s = 1; s <= steps; s++) el("rect", { x: left + tw(fmt(mn, spec), cap) + 6 + (s - 1) * lw / steps, y: ly - 6, width: lw / steps - 1, height: 8, rx: 2, fill: `var(--seq-${s})` }, svg);
    text(svg, left + tw(fmt(mn, spec), cap) + 12 + lw, ly + 3, fmt(mx, spec), { "text-anchor": "start" });
    return { head: ["", ...C], rows: R.map((r, i) => [r, ...V[i].map(v => fmt(v, spec))]) };
  };

  // Ring (the DS Score ring): one ratio, the number inside, red only when it needs someone.
  F.ring = (box, spec, W) => {
    const size = Math.min(W, spec.size || 120), big = cssNum(box, "--t-h", 18);
    const { svg, tip } = shell(box, spec, size, size);
    svg.setAttribute("width", size); svg.style.width = size + "px";
    const r = size / 2 - 7, c = size / 2, frac = Math.max(0, Math.min(1, spec.value / (spec.total || 100)));
    el("circle", { cx: c, cy: c, r, fill: "none", stroke: "var(--chart-grid)", "stroke-width": 8 }, svg);
    const arc = el("circle", { cx: c, cy: c, r, fill: "none", stroke: spec.red ? "var(--needs-you)" : "var(--mark)", "stroke-width": 8, "stroke-linecap": "round", "stroke-dasharray": `${2 * Math.PI * r * frac} ${2 * Math.PI * r}`, transform: `rotate(-90 ${c} ${c})` }, svg);
    hover(box, tip, arc, `${spec.label || ""} ${num(spec.value)} of ${num(spec.total || 100)}`.trim());
    text(svg, c, c + big * .35, spec.center || (spec.total ? num(spec.value) : num(spec.value) + " %"), { "text-anchor": "middle", class: "lbl-strong", "font-size": big * 1.3 });
    if (spec.total) text(svg, c, c + big * 1.2, `of ${num(spec.total)}`, { "text-anchor": "middle" });
    return { head: ["", "Value"], rows: [[spec.label || "", `${num(spec.value)} of ${num(spec.total || 100)}`]] };
  };

  // Meter: a value against a target on one track.
  F.meter = (box, spec, W) => {
    const lab = cssNum(box, "--t-label", 11.5), H = spec.height || 34;
    const { svg, tip } = shell(box, spec, W, H);
    const min = spec.min || 0, max = spec.max || Math.max(spec.value, spec.target || 0) * 1.1, X = v => W * (v - min) / (max - min);
    el("rect", { x: 0, y: 6, width: W, height: 10, rx: 5, fill: "var(--chart-grid)" }, svg);
    const f = el("rect", { x: 0, y: 6, width: Math.max(10, X(spec.value)), height: 10, rx: 5, fill: spec.red ? "var(--needs-you)" : "var(--mark)" }, svg);
    hover(box, tip, f, `${spec.label || "Value"}: ${fmt(spec.value, spec)}`);
    if (spec.target != null) { el("line", { x1: X(spec.target), x2: X(spec.target), y1: 0, y2: 22, stroke: "var(--text-primary)", "stroke-width": 2 }, svg); text(svg, Math.min(W - 2, X(spec.target)), H - 1, `Target ${fmt(spec.target, spec)}`, { "text-anchor": X(spec.target) > W * .8 ? "end" : "middle", "font-size": lab * .9 }); }
    return { head: ["", "Value"], rows: [["Value", fmt(spec.value, spec)], ["Target", spec.target != null ? fmt(spec.target, spec) : "–"]] };
  };

  // Units: one home shape per home. The group the title is about in ink.
  F.units = (box, spec, W) => {
    const total = spec.groups.reduce((a, g) => a + g.count, 0), cols = spec.cols || Math.min(total, Math.max(10, Math.round(Math.sqrt(total * 2.2))));
    const cell = Math.min(22 * kOf(box), W / cols), rows = Math.ceil(total / cols), H = rows * cell;
    const { svg, tip } = shell(box, spec, W, H);
    const base = ["mark", "wait", "quiet", "needs"];
    let k = 0;
    spec.groups.forEach((g, gi) => {
      const color = colorOf(g.color || base[gi % base.length]);
      for (let i = 0; i < g.count; i++, k++) {
        const x = (k % cols) * cell + cell / 2, y = Math.floor(k / cols) * cell + cell / 2;
        const p = el("path", { d: ngonPath(5, x, y + cell * .04, cell * .44), fill: color }, svg);
        if (i === 0) hover(box, tip, p, `${g.label}: ${num(g.count)} of ${num(total)}`);
      }
    });
    const L = document.createElement("div");
    L.className = "apd-legend";
    spec.groups.forEach((g, gi) => { const s = document.createElement("span"); const ic = document.createElementNS(NS, "svg"); ic.setAttribute("viewBox", "0 0 12 12"); el("path", { d: ngonPath(5, 6, 6.3, 5.4), fill: colorOf(g.color || base[gi % base.length]) }, ic); s.appendChild(ic); s.appendChild(document.createTextNode(`${num(g.count)} ${g.label}`)); L.appendChild(s); });
    box.appendChild(L);
    return { head: ["", "Homes"], rows: spec.groups.map(g => [g.label, num(g.count)]) };
  };

  // Sparkline: a small trend in a tile or a table cell; the last value marked.
  F.spark = (box, spec, W) => {
    const H = spec.height || 28, v = spec.values, lo = Math.min(...v), hi = Math.max(...v);
    const { svg } = shell(box, spec, W, H);
    const X = i => 3 + (W - 6) * i / (v.length - 1), Y = x => 3 + (H - 6) * (1 - (x - lo) / ((hi - lo) || 1));
    el("path", { d: "M" + v.map((x, i) => X(i).toFixed(1) + " " + Y(x).toFixed(1)).join("L"), fill: "none", stroke: "var(--chart-quiet)", "stroke-width": 1.5, "stroke-linejoin": "round" }, svg);
    marker(svg, 0, X(v.length - 1), Y(v[v.length - 1]), 3, "var(--mark)");
    return { head: ["", "Value"], rows: v.map((x, i) => [String(i + 1), fmt(x, spec)]) };
  };

  // Scatter: two measures per item, at most three groups, marker shapes as the second channel.
  F.scatter = (box, spec, W) => {
    const cap = cssNum(box, "--t-cap", 10.5), H = spec.height || Math.round(W * .62), S = spec.series.slice(0, 3);
    const { svg, tip } = shell(box, spec, W, H);
    const P = S.flatMap(s => s.points), xt = niceTicks(spec.xMin != null ? spec.xMin : Math.min(...P.map(p => p[0])), spec.xMax || Math.max(...P.map(p => p[0])), 4), yt = niceTicks(spec.yMin != null ? spec.yMin : Math.min(...P.map(p => p[1])), spec.yMax || Math.max(...P.map(p => p[1])), 4);
    const left = tw(num(yt[yt.length - 1]), cap) + 10, bottom = cap * 3.4, top = cap, right = 12, pw = W - left - right, ph = H - top - bottom;
    const X = v => left + pw * (v - xt[0]) / (xt[xt.length - 1] - xt[0]), Y = v => top + ph - ph * (v - yt[0]) / (yt[yt.length - 1] - yt[0]);
    yt.forEach(t => { el("line", { x1: left, x2: left + pw, y1: Y(t), y2: Y(t), stroke: t === yt[0] ? "var(--chart-axis)" : "var(--chart-grid)" }, svg); text(svg, left - 6, Y(t) + cap * .35, num(t), { "text-anchor": "end" }); });
    xt.forEach(t => text(svg, X(t), top + ph + cap * 1.4, num(t), { "text-anchor": "middle" }));
    text(svg, left + pw, H - cap * .2, spec.xLabel || "", { "text-anchor": "end" });
    text(svg, left, top - 2, spec.yLabel || "", { "text-anchor": "start" });
    S.forEach((s, si) => s.points.forEach(p => { const m = marker(svg, si, X(p[0]), Y(p[1]), 4.5, S.length === 1 ? "var(--mark)" : dataColor(si)); hover(box, tip, m, `${p[2] ? p[2] + " · " : ""}${s.name}: ${num(p[0])}, ${num(p[1])}`); if (p[3]) text(svg, X(p[0]) + 8, Y(p[1]) - 6, p[2], { class: "lbl-strong" }); }));
    return { head: ["", spec.xLabel || "x", spec.yLabel || "y"], rows: S.flatMap(s => s.points.map(p => [`${s.name}${p[2] ? " · " + p[2] : ""}`, num(p[0]), num(p[1])])), legend: S.length > 1 ? S.map((s, i) => ({ label: s.name, slot: i, color: dataColor(i) })) : null };
  };

  // Journey: the phases of a plan as one path (STYLE.md § 3). Stops gain a corner each (the counted corners); the path
  // is solid in the accent up to now and dashed after it; each stop has a when, a title (≤ 4 words), a line (≤ 10) and
  // up to three activities. direction "across" (slides, landscape) or "down" (posters).
  // The family's corner counts: triangle → square → pentagon (the home) → hexagon → octagon → decagon → circle (0).
  const FAMILY = [3, 4, 5, 6, 8, 10, 0];
  F.journey = (box, spec, W) => {
    // The done path and the done/now marks in the accent ink (≥ 4,3 : 1 on light grounds); the wide glow and the aura keep coral.
    const hue = spec.color === "mark" ? "var(--mark)" : (colorOf(spec.color) || "var(--accent-ink)");
    const halo = colorOf(spec.color) || "var(--accent)";
    const cap = cssNum(box, "--t-cap", 10.5), lab = cssNum(box, "--t-label", 11.5), k = kOf(box), st = spec.stops, n = st.length;
    const down = spec.direction === "down", H = spec.height || Math.round(down ? W * 1.25 : W * .44);
    const { svg, tip } = shell(box, spec, W, H);
    const r = (spec.r || 13) * k, lw = 6 * k, amp = spec.flat ? 0 : down ? W * (spec.amp || .16) : H * (spec.amp || .17);
    const pad = down ? r * 2.2 : Math.max(r * 2, W * .06);
    const P = st.map((s, i) => down
      ? [W / 2 + (i % 2 ? amp : -amp), pad + (H - pad * 2) * (n === 1 ? .5 : i / (n - 1))]
      : [pad + (W - pad * 2) * (n === 1 ? .5 : i / (n - 1)), H / 2 + (i % 2 ? amp : -amp)]);
    const nowAt = Math.max(-1, ...st.map((s, i) => s.state === "now" || s.state === "done" ? i : -1));
    for (let i = 1; i < n; i++) {
      const [x0, y0] = P[i - 1], [x1, y1] = P[i];
      const d = down ? `M${x0} ${y0}C${x0} ${(y0 + y1) / 2} ${x1} ${(y0 + y1) / 2} ${x1} ${y1}` : `M${x0} ${y0}C${(x0 + x1) / 2} ${y0} ${(x0 + x1) / 2} ${y1} ${x1} ${y1}`;
      const done = i <= nowAt;
      if (done) el("path", { d, fill: "none", stroke: halo, "stroke-width": lw * 2.4, "stroke-opacity": .18, "stroke-linecap": "round" }, svg);
      el("path", { d, fill: "none", stroke: done ? hue : "var(--line-strong)", "stroke-width": done ? lw : 2 * k, "stroke-dasharray": done ? null : `${6 * k} ${6 * k}`, "stroke-linecap": "round" }, svg);
    }
    const chars = Math.max(14, Math.floor((down ? W / 2 - amp - r * 2 : (W - pad * 2) / Math.max(1, n - 1) * 1.7) / (cap * .55)));
    st.forEach((s, i) => {
      const [x, y] = P[i], sides = FAMILY[Math.min(FAMILY.length - 1, FAMILY.indexOf(spec.marker === "circle" ? 0 : spec.from ?? 3) + i)], isNow = s.state === "now", isDone = s.state === "done";
      if (isNow) el("path", { d: ngonPath(sides, x, y, r * 1.9), fill: halo, "fill-opacity": .22 }, svg);
      const m = el("path", { d: ngonPath(sides, x, y, isNow ? r * 1.25 : r), fill: isDone || isNow ? hue : "var(--page)", stroke: isDone || isNow ? "var(--page)" : "var(--line-strong)", "stroke-width": isDone || isNow ? 2 : 2 * k, "paint-order": "stroke" }, svg);
      hover(box, tip, m, `${s.when}: ${s.title}${isNow ? " (now)" : ""}`);
      // The label block sits on the outer side of the bend, so the path never crosses it.
      const up = down ? null : i % 2 === 0, left = down ? i % 2 === 0 : null;
      const lines = [[s.when + (isNow ? " · now" : ""), cap, isNow ? (spec.color === "mark" ? "var(--text-primary)" : "var(--accent-ink)") : "var(--text-secondary)", 600, 1],
        [s.title, lab * (k > 1.5 ? 1.45 : 1.15), "var(--text-primary)", 600, 1], [s.line, cap, "var(--text-body)", 400, 0], ...(s.items || []).slice(0, 3).map(t => ["· " + t, cap, "var(--text-secondary)", 400, 0])].filter(l => l[0]);
      const anchor = down ? (left ? "end" : "start") : i === 0 ? "start" : i === n - 1 ? "end" : "middle";
      const lx = down ? (left ? x - r * 2.2 : x + r * 2.2) : i === 0 ? x - r : i === n - 1 ? x + r : x;
      const heights = lines.map(l => (l[4] ? 1 : Math.ceil(String(l[0]).length / chars)) * l[1] * 1.3);
      const total = heights.reduce((a, b) => a + b, 0);
      let ly = down ? y - total / 2 + lines[0][1] : up ? y - r * 2.1 - total + lines[0][1] : y + r * 2.1 + lines[0][1];
      lines.forEach((l, li) => {
        if (l[4]) text(svg, lx, ly, l[0], { "text-anchor": anchor, "font-size": l[1], fill: l[2], "font-weight": l[3] });
        else para(svg, lx, ly, l[0], l[1], l[1] * 1.3, chars, { "text-anchor": anchor, fill: l[2], "font-weight": l[3] });
        ly += heights[li] - l[1] + (lines[li + 1] ? lines[li + 1][1] : 0) + (li === 1 ? l[1] * .15 : 0);
      });
    });
    return { head: ["When", "Phase", "What it means"], rows: st.map(s => [s.when, s.title + (s.state === "now" ? " (now)" : ""), s.line || ""]) };
  };

  /* ---------- render ---------- */
  let seq = 0;
  function render(box) {
    const src = box.querySelector('script[type="application/json"]');
    if (src) box._spec = JSON.parse(src.textContent);
    const spec = box._spec;
    if (!spec || !F[spec.type]) return;
    const W = Math.max(120, Math.round(parseFloat(getComputedStyle(box).width) || box.clientWidth || 480));
    // .is-fill: the chart takes the height its box is given (a bento card, the rest of a slide) instead of its own.
    const fillH = box.classList.contains("is-fill") ? Math.floor(parseFloat(getComputedStyle(box).height) || 0) : 0;
    if (box._w === W && box._h === fillH && box.dataset.rendered) return;
    box._w = W; box._h = fillH;
    const fig = box.closest(".apd-figure") || box.parentElement;
    fig.querySelectorAll(":scope > .apd-legend, :scope > .apd-tablebtn, :scope > .apd-datatable").forEach(n => n.remove());
    const out = F[spec.type](box, fillH > 60 ? Object.assign({}, spec, { height: fillH }) : spec, W) || {};
    if (src) box.appendChild(src);
    if (out.legend) { const after = box.nextSibling; legend(fig, out.legend); const L = fig.querySelector(":scope > .apd-legend"); if (L && after) fig.insertBefore(L, after); }
    if (out.head && spec.table !== false) {
      const src2 = fig.querySelector(":scope > .apd-source");
      tableView(fig, out.head, out.rows, "apd-t-" + (++seq));
      if (src2) fig.appendChild(src2);
    }
    box.dataset.rendered = "1";
  }
  function renderAll(root) {
    (root || document).querySelectorAll(".apd-chart").forEach(b => { b.dataset.rendered = ""; b._w = 0; render(b); });
  }
  const ro = "ResizeObserver" in window ? new ResizeObserver(es => es.forEach(e => render(e.target))) : null;
  function boot() {
    document.querySelectorAll(".apd-chart").forEach(b => { render(b); if (ro) ro.observe(b); });
  }
  window.APCharts = { render, renderAll, ngonPath, marker, num, fmt, para };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => renderAll());
})();
