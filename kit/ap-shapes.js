/* Autoproperty documents · shapes, icons and spacing guides (lab module, 1 Nov 2026; REPORT-shapes.md).
   Load after ap-charts.js and ap-doc.js. No dependencies; draws on DOMContentLoaded and again when fonts are ready.

   1. The polygon family (DS assets/Polygons): every corner is a circle of 38,13 % of the outer radius on the vertex of
      the sharp inner polygon (drawn by APCharts.ngonPath). Orientation follows the DS family drawing
      (polygon-family.svg): odd counts point up; even counts stand on a flat edge (the hexagon is the HexPhoto hexclip).
        <span class="apd-shape" data-n="6" data-style="outline" style="--shape-size: 240px"></span>
      data-n      2 (the line) · 3 4 5 6 8 10 (12) · 0 or "circle" · "home" (the logo's pentagon with its door)
      data-style  fill (default) · tint · outline · dash · number (tint + the text inside) · glow (light inside) ·
                  glass (over Ember only) · photo (data-src, data-alt, data-focus) · seal · family · field
      data-light  glow palette: ember · coral · haze · warm · fjord · sage   data-from  bottom · top · center · corner
      data-halo   a soft light spilling round a glow shape     data-ring  a hairline echo at that × radius (1.18)
      data-rot    override the orientation in degrees          data-edge  a hairline on a photo or glow edge
      Text inside the element becomes the label, set at the shape's optical centre.
   2. Composites: data-style="family" (data-layout row · nest · column, data-stops, data-labels) and
      data-style="field" (a field of homes: data-count, data-on, data-mark, data-fade, data-door). Growth rows
      (.apd-grow[data-max] with .apd-shape[data-value]) are sized so each shape's AREA is proportional to its value.
   3. Icons: the DS icon sprite (60 icons, kit/icons/build-sprite.py) is injected inline, so
      <svg class="apd-icon"><use href="#ap-home"/></svg> works on file:// and published. [data-icon] fills itself.
   4. Spacing guides: <section class="apd-page" data-guides="margin cols"> draws hairline guides; children marked
      data-guide-gap, data-guide-pad and data-guide-base="group" get their gap, padding and first baseline drawn. */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const RC = 0.3813, D2R = Math.PI / 180;
  const STOPS = [3, 4, 5, 6, 8, 10, 0];
  let seq = 0;
  const uid = p => "apd-" + p + "-" + (++seq);

  /* ---------- geometry ---------- */
  // The DS family orientation: odd counts point up; even counts sit on a flat edge (no vertex at the top).
  function rotFor(n) { return n % 2 ? -90 : 90 - 180 / n; }
  function parseN(v) { if (v === "home") return 5; if (v === "circle" || v === "0" || v == null || v === "") return 0; return Math.max(2, +v || 0); }
  // The family path. Uses APCharts.ngonPath (the kit's one implementation) when present.
  function ngonD(n, cx, cy, R, rot) {
    if (n === 2) { const h = R * .12, r = h / 2; return `M${cx - R + r} ${cy - r}H${cx + R - r}A${r} ${r} 0 0 1 ${cx + R - r} ${cy + r}H${cx - R + r}A${r} ${r} 0 0 1 ${cx - R + r} ${cy - r}Z`; }
    if (n === 0) return `M${cx - R} ${cy}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0Z`;
    rot = rot == null ? rotFor(n) : rot;
    if (window.APCharts && APCharts.ngonPath) return APCharts.ngonPath(n, cx, cy, R, rot);
    const rc = R * RC, Ri = R - rc, pts = [];
    for (let k = 0; k < n; k++) {
      const a = (rot + 360 * k / n) * D2R, vx = cx + Ri * Math.cos(a), vy = cy + Ri * Math.sin(a);
      const a0 = (rot + 360 * (k - .5) / n) * D2R, a1 = (rot + 360 * (k + .5) / n) * D2R;
      for (let s = 0; s <= 10; s++) { const t = a0 + (a1 - a0) * s / 10; pts.push([vx + rc * Math.cos(t), vy + rc * Math.sin(t)]); }
    }
    return "M" + pts.map(p => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + "Z";
  }
  // The family's outline as points around 0,0 (the same construction as ngonPath), for hit tests.
  function ngonPts(n, R, rot) {
    if (n === 0) return [...Array(72).keys()].map(k => [R * Math.cos(k * 5 * D2R), R * Math.sin(k * 5 * D2R)]);
    rot = rot == null ? rotFor(n) : rot;
    const rc = R * RC, Ri = R - rc, pts = [];
    for (let k = 0; k < n; k++) {
      const a = (rot + 360 * k / n) * D2R, vx = Ri * Math.cos(a), vy = Ri * Math.sin(a);
      const a0 = (rot + 360 * (k - .5) / n) * D2R, a1 = (rot + 360 * (k + .5) / n) * D2R;
      for (let q = 0; q <= 10; q++) { const t = a0 + (a1 - a0) * q / 10; pts.push([vx + rc * Math.cos(t), vy + rc * Math.sin(t)]); }
    }
    return pts;
  }
  // Where a ray from the centre at `deg` meets the outline (distance from the centre).
  function radiusAt(n, R, rot, deg) {
    if (n === 0) return R;
    const pts = ngonPts(n, R, rot), dx = Math.cos(deg * D2R), dy = Math.sin(deg * D2R);
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length], ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = (x1 * ey - y1 * ex) / den, u = (x1 * dy - y1 * dx) / den;
      if (t > 0 && u >= 0 && u <= 1) return t;
    }
    return R;
  }
  // Distance from the centre to the shape's top and bottom (for an upright shape), as a share of R.
  function extent(n, rot) {
    if (n === 0) return [1, 1];
    if (n === 2) return [.06, .06];
    rot = rot == null ? rotFor(n) : rot;
    const Ri = 1 - RC; let top = 0, bot = 0;
    for (let k = 0; k < n; k++) { const y = Ri * Math.sin((rot + 360 * k / n) * D2R); top = Math.max(top, -y); bot = Math.max(bot, y); }
    return [top + RC, bot + RC];
  }
  // Distance from the centre to the shape's left and right edges, as a share of R.
  function hextent(n, rot) {
    if (n === 0 || n === 2) return [1, 1];
    rot = rot == null ? rotFor(n) : rot;
    const Ri = 1 - RC; let l = 0, r = 0;
    for (let k = 0; k < n; k++) { const x = Ri * Math.cos((rot + 360 * k / n) * D2R); l = Math.max(l, -x); r = Math.max(r, x); }
    return [l + RC, r + RC];
  }
  // Shift that centres the shape's box (a triangle's circumcentre sits high): positive moves the shape down.
  function centreShift(n, rot) { const [t, b] = extent(n, rot); return (t - b) / 2; }
  // The edge distance (apothem) of a rounded n-gon as a share of R: how far its flat sides sit from the centre.
  function apothem(n) { return n === 0 ? 1 : (1 - RC) * Math.cos(Math.PI / n) + RC; }
  // Area of a family shape with outer radius 1: the sharp polygon grown by the corner circle (Minkowski sum).
  function area(n) {
    if (n === 0) return Math.PI;
    if (n === 2) return 2 * .12;
    const ri = 1 - RC, poly = n / 2 * ri * ri * Math.sin(2 * Math.PI / n), per = 2 * n * ri * Math.sin(Math.PI / n);
    return poly + per * RC + Math.PI * RC * RC;
  }
  // The logo's door: a slot centred under the knob, .232 R wide, .545 R tall, its top .092 R below the centre.
  function doorD(cx, cy, R) {
    const w = R * .232, h = R * .545, r = w / 2, x = cx - w / 2, y = cy + R * .092;
    return `M${x + r} ${y}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
  }

  /* ---------- helpers ---------- */
  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs || {}) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  function boxSize(node) { return node.offsetWidth || parseFloat(getComputedStyle(node).width) || 96; }
  // Move an SVG's drawn children (not its defs) into one group, so the group can be copied or masked.
  function wrapAll(svg, defs) { const g = el("g", {}); [...svg.childNodes].filter(c => c !== defs).forEach(c => g.appendChild(c)); svg.appendChild(g); return g; }
  // A small deterministic random (the same field on every render and in the PDF).
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  /* ---------- light: the grounds module's construction (kit/ap-grounds.css) ----------
     A lit shape is a ground in miniature: one base colour, then one glow from the light's side. The glow keeps the
     module's two DS colours (the light, then its echo) and its alpha eased over nine stops (0, 10, 22, 40, 54, 68, 82,
     93, 100 %: 1, .88, .68, .444, .32, .196, .089, .027, 0); SVG cannot write `in oklab`, so each step between stops is
     filled with OKLab-interpolated stops. A halo is the module's .apd-halo profile (a at 50 %, .55 a at 62 %, .22 a at
     78 %, .06 a at 90 %), drawn as a vector gradient so it stays sharp-free in the PDF.
     Meaning (BRIEF § 8, WORLD.md): ember = needs you / broken now; warm = a lived-in home, comfort; moss = fixed, done;
     fjord = calm; the -paper variants sit on light pages. Red never lights a thing that is fine. */
  const POS = [0, .10, .22, .40, .54, .68, .82, .93, 1], FAC = [1, .88, .68, .444, .32, .196, .089, .027, 0];
  const LIGHT = {
    ember: { base: "#4f1a18", a: "#df695c", b: "#b54a46", alpha: .95, halo: "#df695c" },        // ember-glow → Bryggen red on ember-deep
    warm: { base: "#452a00", a: "#e9d3b8", b: "#c79a60", alpha: .95, halo: "#c79a60" },         // ochre-200 → ochre-400 on ochre-900 (lamplight)
    "warm-paper": { base: "#e9d3b8", a: "#fbf5ed", b: "#f4e8d9", alpha: 1, halo: "#e9d3b8" },  // ochre-50 → ochre-100 on ochre-200
    moss: { base: "#26361d", a: "#b1c5a7", b: "#779468", alpha: .95, halo: "#779468" },         // moss-300 → moss-500 on moss-900 (moss dusk)
    "moss-paper": { base: "#cfdcc8", a: "#f3f7f2", b: "#e5ece2", alpha: 1, halo: "#cfdcc8" },  // moss-50 → moss-100 on moss-200
    fjord: { base: "#173443", a: "#a3c3d5", b: "#5f91ab", alpha: .95, halo: "#5f91ab" },        // fjord-300 → fjord-500 on fjord-900
    // The golden home (round 5): a home you can see on its ground, lit from within. On dark its rim is ochre-400 (7,8 : 1
    // on ink); on paper ochre-300 with an ochre-600 edge (4,7 : 1). Monochrome ochre, so the ramp never passes grey.
    gold: { base: "#c79a60", a: "#fbf5ed", b: "#e9d3b8", alpha: 1, halo: "#c79a60" },
    "gold-paper": { base: "#dab78e", a: "#fbf5ed", b: "#f4e8d9", alpha: 1, halo: "#e9d3b8" }
  };
  LIGHT.coral = LIGHT.ember; LIGHT.haze = LIGHT["warm-paper"]; LIGHT.sage = LIGHT.moss;          // older names
  const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = c => c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4), gam = c => c <= .0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - .055;
  function toLab(h) {
    const [r, g, b] = hex2rgb(h).map(lin);
    const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), q = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
    return [.2104542553 * l + .7936177850 * m - .0040720468 * q, 1.9779984951 * l - 2.4285922050 * m + .4505937099 * q, .0259040371 * l + .7827717662 * m - .8086757660 * q];
  }
  function fromLab([L, A, B]) {
    const l = Math.pow(L + .3963377774 * A + .2158037573 * B, 3), m = Math.pow(L - .1055613458 * A - .0638541728 * B, 3), q = Math.pow(L - .0894841775 * A - 1.2914855480 * B, 3);
    const rgb = [4.0767416621 * l - 3.3077115913 * m + .2309699292 * q, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * q, -.0041960863 * l - .7034186147 * m + 1.7076147010 * q];
    return "#" + rgb.map(c => Math.round(Math.max(0, Math.min(1, gam(c))) * 255).toString(16).padStart(2, "0")).join("");
  }
  // Stops [colour, alpha, position] joined by OKLab-interpolated stops (`per` steps between neighbours).
  function oklabStops(stops, per) {
    const out = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const a = toLab(stops[i][0]), b = toLab(stops[i + 1][0]);
      for (let k = 0; k < per; k++) { const t = k / per; out.push([fromLab(a.map((v, j) => v + (b[j] - v) * t)), stops[i][1] + (stops[i + 1][1] - stops[i][1]) * t, stops[i][2] + (stops[i + 1][2] - stops[i][2]) * t]); }
    }
    out.push(stops[stops.length - 1]);
    return out;
  }
  function addStops(g, stops) { oklabStops(stops, 3).forEach(st => el("stop", { offset: st[2].toFixed(4), "stop-color": st[0], "stop-opacity": +st[1].toFixed(4) }, g)); }
  // The module's glow: the light colour for the first three stops, its echo after, alpha eased.
  function glowStops(L) { return POS.map((q, i) => [i < 3 ? L.a : L.b, L.alpha * FAC[i], q]); }
  function haloStops(colour, a) { return [[colour, a, 0], [colour, a, .5], [colour, a * .55, .62], [colour, a * .22, .78], [colour, a * .06, .9], [colour, 0, 1]]; }
  function radial(defs, light, from, R) {
    const id = uid("light"), L = LIGHT[light] || LIGHT.ember;
    const pos = { bottom: [0, .95, 1.6], top: [0, -.95, 1.6], center: [0, .1, 1.15], corner: [.8, .85, 1.9], left: [-.95, .1, 1.6], right: [.95, .1, 1.6] }[from] || [0, .95, 1.6];
    const g = el("radialGradient", { id, gradientUnits: "userSpaceOnUse", cx: pos[0] * R, cy: pos[1] * R, r: pos[2] * R }, defs);
    addStops(g, glowStops(L));
    return id;
  }
  // A halo is a glow round a subject (BRIEF § 11.2): large and soft. Its radius defaults to 2,4 × the shape's outer
  // radius (data-halo-r), with the module's long eased falloff (FAC), so it reads as light, never as a rim; it is drawn
  // in its own layer behind the shape and never behind text (keep words outside it).
  function halo(defs, svg, colour, a, cx, cy, R) {
    const id = uid("halo"), g = el("radialGradient", { id, gradientUnits: "userSpaceOnUse", cx, cy, r: R }, defs);
    addStops(g, POS.map((q, i) => [colour, a * FAC[i], q]));
    el("circle", { class: "apd-shape-halo", cx, cy, r: R, style: `fill:url(#${id})` }, svg);
  }
  // The layer is the shape's own box with its paint overflowing (SVG paint overflow is not layout overflow, so a large
  // halo never grows the page or trips the overflow check).
  function haloLayer(box, s, dy, colour, a) {
    const R = s / 2, HR = R * +(box.dataset.haloR || 2.4);
    const hs = el("svg", { class: "apd-shape-halo-svg", viewBox: `${-R} ${-R} ${s} ${s}`, "aria-hidden": "true", focusable: "false",
      style: "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none" });
    halo(el("defs", {}, hs), hs, colour, a, 0, dy, HR);
    box.prepend(hs);
  }

  /* ---------- one shape ---------- */
  function adoptLabel(box) {
    let lbl = box.querySelector(":scope > .apd-shape-label");
    if (lbl) return lbl;
    const kids = [...box.childNodes].filter(c => !(c.nodeType === 1 && (c.classList.contains("apd-shape-svg") || c.classList.contains("apd-shape-blur") || c.classList.contains("apd-shape-img"))));
    if (!kids.some(c => c.nodeType === 1 || (c.textContent || "").trim())) { kids.forEach(c => c.remove()); return null; }
    lbl = document.createElement("span"); lbl.className = "apd-shape-label";
    kids.forEach(c => lbl.appendChild(c));
    box.appendChild(lbl);
    return lbl;
  }
  function clear(box) { box.querySelectorAll(":scope > .apd-shape-svg, :scope > .apd-shape-blur, :scope > .apd-shape-img, :scope > .apd-shape-defs, :scope > .apd-shape-halo-svg").forEach(n => n.remove()); }

  function drawShape(box) {
    const st = box.dataset.style || "fill";
    const nRaw = box.dataset.n, home = nRaw === "home";
    const n = parseN(nRaw);
    const rot = box.dataset.rot != null ? +box.dataset.rot : (n > 2 ? rotFor(n) : 0);
    const s = boxSize(box), R = s / 2;
    box.style.setProperty("--s-px", s + "px");
    // Centre the shape's box, or stand it on the box's floor (growth rows: every shape on one baseline).
    const align = box.dataset.align || (box.closest(".apd-grow") ? "bottom" : "centre");
    const dy = align === "bottom" ? R * (1 - extent(n, rot)[1]) : n > 2 ? centreShift(n, rot) * R : 0;
    box.style.setProperty("--label-dy", ((n === 3 ? dy * 1.12 : dy) / s * 100).toFixed(2) + "%");
    clear(box);
    const label = adoptLabel(box);
    const d = ngonD(n, 0, dy, R, rot) + (home ? doorD(0, dy, R) : "");
    const svg = el("svg", { class: "apd-shape-svg", viewBox: `${-R} ${-R} ${s} ${s}`, "aria-hidden": "true", focusable: "false" });
    const defs = el("defs", {}, svg);
    const ring = +box.dataset.ring || 0;
    if (ring) el("path", { class: "apd-shape-ring", d: ngonD(n, 0, dy, R * ring, rot) }, svg);

    if (st === "glow") {
      const light = box.dataset.light || "ember", L = LIGHT[light] || LIGHT.ember;
      el("path", { class: "apd-shape-base", d, style: `fill:${L.base}`, "fill-rule": "evenodd" }, svg);
      const g = radial(defs, light, box.dataset.from || "bottom", R);
      el("path", { class: "apd-shape-lit", d, style: `fill:url(#${g})`, "fill-rule": "evenodd" }, svg);
      if (box.hasAttribute("data-edge")) el("path", { class: "apd-shape-edge", d }, svg);
    } else if (st === "glass") {
      // Glass over Ember: white 16 % → 4 % with an 18 px blur (DS docs/02-depth-and-parallax.md). The blur is a layer
      // clipped to the shape; the gradient and the hairline carry the look where blur is not printed.
      const cid = uid("clip"), cs = el("svg", { class: "apd-shape-defs", width: 0, height: 0, "aria-hidden": "true" });
      const cp = el("clipPath", { id: cid, clipPathUnits: "objectBoundingBox" }, el("defs", {}, cs));
      el("path", { d: ngonD(n, .5, .5 + dy / s, .5, rot) + (home ? doorD(.5, .5 + dy / s, .5) : ""), "clip-rule": "evenodd" }, cp);
      const blur = document.createElement("span"); blur.className = "apd-shape-blur"; blur.style.clipPath = `url(#${cid})`; blur.style.webkitClipPath = `url(#${cid})`;
      box.prepend(blur); box.prepend(cs);
      const lg = uid("glass"), g = el("linearGradient", { id: lg, x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
      el("stop", { offset: 0, "stop-color": "#ffffff", "stop-opacity": .16 }, g); el("stop", { offset: 1, "stop-color": "#ffffff", "stop-opacity": .04 }, g);
      el("path", { class: "apd-shape-lit is-glass", d, style: `fill:url(#${lg})`, "fill-rule": "evenodd" }, svg);
      el("path", { class: "apd-shape-edge is-glass", d }, svg);
    } else if (st === "photo") {
      const cid = uid("clip"), cs = el("svg", { class: "apd-shape-defs", width: 0, height: 0, "aria-hidden": "true" });
      const cp = el("clipPath", { id: cid, clipPathUnits: "objectBoundingBox" }, el("defs", {}, cs));
      el("path", { d: ngonD(n, .5, .5 + dy / s, .5, rot) }, cp);
      const img = document.createElement("img"); img.className = "apd-shape-img"; img.src = box.dataset.src || ""; img.alt = box.dataset.alt || "";
      img.decoding = "sync"; if (box.dataset.focus) img.style.objectPosition = box.dataset.focus;
      img.style.clipPath = `url(#${cid})`; img.style.webkitClipPath = `url(#${cid})`;
      box.prepend(img); box.prepend(cs);
      if (box.hasAttribute("data-edge")) el("path", { class: "apd-shape-edge", d }, svg);
    } else {
      el("path", { class: "apd-shape-path", d, "fill-rule": "evenodd" }, svg);
    }
    if (svg.childNodes.length > 1) box.insertBefore(svg, label || null);
    // The halo layer goes first, behind the photo, the blur and the shape.
    if (box.hasAttribute("data-halo")) {
      const L = LIGHT[box.dataset.light] || (st === "glow" ? LIGHT.ember : LIGHT["warm-paper"]);
      haloLayer(box, s, dy, box.dataset.haloColour || L.halo, +(box.dataset.halo || .5));
    }
    if (st === "photo") keepInPage(box);
    box.dataset.drawn = s;
  }

  // A photo in a shape shows the photo (BRIEF § 11.5): a window placed past the page edge is pulled back so no more than
  // data-bleed of its size (default 0, at most .08) leaves the page on any side. Focus stays with data-focus.
  function keepInPage(box) {
    const page = box.closest(".apd-page"); if (!page || !box.offsetWidth) return;
    box.style.translate = "";
    const pr = page.getBoundingClientRect(), k = pr.width / page.offsetWidth, r = box.getBoundingClientRect();
    const s = box.offsetWidth, b = Math.min(.08, Math.max(0, +(box.dataset.bleed || 0))) * s;
    const L = (r.left - pr.left) / k, T = (r.top - pr.top) / k, Rr = L + s, B = T + box.offsetHeight;
    let dx = 0, dy = 0;
    if (L < -b) dx = -b - L; else if (Rr > page.offsetWidth + b) dx = page.offsetWidth + b - Rr;
    if (T < -b) dy = -b - T; else if (B > page.offsetHeight + b) dy = page.offsetHeight + b - B;
    if (dx || dy) box.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
  }

  /* ---------- the seal: the decagon with a tick, for a moment that is done (DS Seal) ---------- */
  function drawSeal(box) {
    clear(box);
    const label = box.dataset.label || "";
    const svg = el("svg", { class: "apd-shape-svg apd-seal-svg", viewBox: "-60 -60 120 120", role: label ? "img" : null, "aria-label": label || null, "aria-hidden": label ? null : "true" });
    if (+box.dataset.ring) el("path", { class: "apd-shape-ring", d: ngonD(10, 0, 0, 56 * +box.dataset.ring, -90) }, svg);
    el("path", { class: "apd-seal-shape", d: ngonD(10, 0, 0, 56, -90) }, svg);    // the DS Seal: data-ngon="10,56"
    el("path", { class: "apd-seal-tick", d: "M-22 0 l14 14 l30 -31" }, svg);
    box.prepend(svg);
    box.dataset.drawn = boxSize(box);
  }

  /* ---------- the family: a row, a column, or nested "counted corners" rings ---------- */
  function drawFamily(box) {
    clear(box);
    const W = box.offsetWidth || 800, H = box.offsetHeight || 200;
    const stops = (box.dataset.stops || "3 4 5 6 8 10 0").split(/[\s,]+/).map(parseN);
    const layout = box.dataset.layout || "row", mode = box.dataset.mode || "outline";
    const labels = box.hasAttribute("data-labels"), fs = +box.dataset.fs || 14;
    const svg = el("svg", { class: "apd-shape-svg", viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", preserveAspectRatio: "xMidYMid meet" });
    const cls = mode === "fill" ? "apd-shape-path" : "apd-shape-path is-line";
    const name = k => k === 0 ? "∞" : String(k);
    if (layout === "nest") {
      // Rings keep an even clearance: each shape's flat sides clear the vertices of the one inside it.
      const cx = box.dataset.cx != null ? parseFloat(box.dataset.cx) / 100 * W : W / 2, cy = box.dataset.cy != null ? parseFloat(box.dataset.cy) / 100 * H : H / 2;
      const rMax = box.dataset.r ? +box.dataset.r : Math.min(W, H) / 2 - 2, gap = +(box.dataset.gap || .16);
      // data-core reserves a circle at the centre (px) for a photo: the first ring clears it by the same gap.
      const core = +(box.dataset.core || 0);
      const r = [1]; for (let i = 1; i < stops.length; i++) r.push(r[i - 1] / apothem(stops[i]) + gap);
      let k = rMax / r[r.length - 1];
      if (core) { const r0 = core / apothem(stops[0]); const g2 = gap * rMax; const rr = [r0 + g2 * .6]; for (let i = 1; i < stops.length; i++) rr.push(rr[i - 1] / apothem(stops[i]) + g2); const kk = rMax / rr[rr.length - 1]; r.splice(0, r.length, ...rr.map(v => v * kk)); k = 1; }
      const kind = box.dataset.labels || "count", at = box.dataset.labelAt || "top", names = kind.includes("|") ? kind.split("|") : null;
      const glowN = box.dataset.glow != null ? +box.dataset.glow : null, deg = +(box.dataset.labelAngle || -150);
      stops.forEach((n, i) => {
        const R = r[i] * k;
        // A ring with light along it (the step that is now): soft strokes under the hairline, vector so it prints.
        // data-glow marks the ring that is now: ink at 1,5 px and a bold label. No glow strokes: its label sits on the ring,
        // and a glow never goes behind text (BRIEF § 11.2); light the home at the centre instead.
        const p = el("path", { class: cls, d: ngonD(n, cx, cy, R) }, svg);
        const isAcc = box.dataset.accent != null && +box.dataset.accent === n;
        if (isAcc) p.classList.add("is-accent");
        if (glowN === n) p.classList.add("is-lit");
        if (labels) {
          const txt = names ? names[i] || "" : kind === "index" ? String(i + 1) : name(n);
          const ra = at === "ray" ? radiusAt(n, R, null, deg) : 0;
          const [x, y] = at === "ray" ? [cx + ra * Math.cos(deg * D2R), cy + ra * Math.sin(deg * D2R)] : at === "left" ? [cx - R * hextent(n)[0], cy] : [cx, cy - R * extent(n)[0]];
          const t = el("text", { class: "apd-family-lbl" + (isAcc ? " is-accent" : "") + (glowN === n ? " is-lit" : ""), x, y, "text-anchor": "middle", "dominant-baseline": "central", style: `font-size:${fs}px` }, svg);
          t.textContent = txt;
        }
      });
    } else {
      const col = layout === "column", count = stops.length;
      const step = (col ? H : W) / count, R = Math.min(step * (+box.dataset.fill || .36), (col ? W : H) / 2 * .9);
      stops.forEach((n, i) => {
        const c = step * i + step / 2, dy = n > 2 ? centreShift(n) * R : 0;
        const [x, y] = col ? [W / 2, c + dy] : [c, H / 2 + dy - (labels ? fs : 0)];
        el("path", { class: cls, d: ngonD(n, x, y, R) }, svg);
        if (labels && !col) { const t = el("text", { class: "apd-family-lbl", x, y: H / 2 + R + fs * .6, "text-anchor": "middle", style: `font-size:${fs}px` }, svg); t.textContent = name(n); }
      });
    }
    box.prepend(svg);
    knockLabels(svg);
    box.dataset.drawn = W + "x" + H;
  }

  /* Labels on rings: the rings stop round each label (a vector even-odd clip with a hole per label box), so the ground
     shows through and the text stays plain text. A stroked knock-out (paint-order: stroke) printed as Type 3 glyphs. */
  let knockN = 0;
  function knockLabels(svg) {
    const lbls = [...svg.querySelectorAll("text.apd-family-lbl")]; if (!lbls.length) return;
    const holes = [];
    for (const t of lbls) {
      let b; try { b = t.getBBox(); } catch (e) { b = null; }
      if (!b || !b.width) continue;
      const fs = parseFloat(t.style.fontSize) || 14, px = Math.max(4, fs * .3), py = Math.max(2, fs * .12);
      const x = b.x - px, y = b.y - py, w = b.width + 2 * px, h = b.height + 2 * py, r = Math.min(h / 2, fs * .3);
      holes.push(`M${(x + r).toFixed(1)} ${y.toFixed(1)}h${(w - 2 * r).toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${r.toFixed(1)} ${r.toFixed(1)}v${(h - 2 * r).toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(-r).toFixed(1)} ${r.toFixed(1)}h${(-(w - 2 * r)).toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(-r).toFixed(1)} ${(-r).toFixed(1)}v${(-(h - 2 * r)).toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${r.toFixed(1)} ${(-r).toFixed(1)}Z`);
    }
    if (!holes.length) return;
    const id = "apd-knock-" + (++knockN), defs = el("defs", {}), cp = el("clipPath", { id }, defs);
    el("path", { d: "M-10000 -10000H20000V20000H-10000Z" + holes.join(""), "clip-rule": "evenodd" }, cp);
    svg.prepend(defs);
    svg.querySelectorAll("path.apd-shape-path").forEach(p => p.setAttribute("clip-path", `url(#${id})`));
  }

  /* ---------- a field of homes: texture that tells the truth (data-count homes, data-on filled, the rest outlined) ---------- */
  function drawField(box) {
    clear(box);
    const W = box.offsetWidth || 800, H = box.offsetHeight || 600;
    const count = +box.dataset.count || 0, on = box.dataset.on != null ? +box.dataset.on : count, mark = +box.dataset.mark || 0;
    let pitch = +box.dataset.pitch || 0, cols, rows;
    const stagger0 = box.dataset.stagger !== "0", rowK = +(box.dataset.row || .9);
    if (count && !pitch) { pitch = Math.sqrt(W * H / (count * rowK)); for (let i = 0; i < 80; i++) { cols = Math.max(1, Math.floor(W / pitch - (stagger0 ? .5 : 0))); rows = Math.ceil(count / cols); if ((rows - 1) * pitch * rowK + pitch * .8 <= H) break; pitch *= .97; } }
    pitch = pitch || 40;
    const stagger = box.dataset.stagger !== "0";
    if (box.dataset.cols) cols = +box.dataset.cols; else cols = Math.max(1, Math.floor(W / pitch - (stagger ? .5 : 0)));
    const rowH = pitch * +(box.dataset.row || .9);
    const texture = box.dataset.mode === "texture";
    rows = count && !texture ? Math.ceil(count / cols) : Math.floor(H / rowH);
    const total = count || cols * rows, r = pitch * (+box.dataset.scale || .34);
    const stag = stagger && rows > 1;                               // one row (a legend swatch) needs no stagger offset
    const ox = (W - (cols - 1) * pitch - (stag ? pitch / 2 : 0)) / 2, oy = (H - (rows - 1) * rowH) / 2;
    const svg = el("svg", { class: "apd-shape-svg apd-field-svg", viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true" });
    const defs = el("defs", {}, svg);
    const fade = box.dataset.fade;
    let g = svg;
    if (fade && fade !== "none") {
      const m = uid("fade"), lg = el("linearGradient", { id: m + "-g", gradientUnits: "objectBoundingBox", x1: fade === "left" ? 0 : fade === "right" ? 1 : 0, y1: fade === "top" ? 0 : fade === "bottom" ? 1 : 0, x2: fade === "left" ? 1 : 0, y2: fade === "top" ? 1 : 0 }, defs);
      if (fade === "center") { const rg = el("radialGradient", { id: m + "-r", cx: .5, cy: .5, r: .62 }, defs); el("stop", { offset: 0, "stop-color": "#fff", "stop-opacity": 0 }, rg); el("stop", { offset: .55, "stop-color": "#fff", "stop-opacity": .25 }, rg); el("stop", { offset: 1, "stop-color": "#fff" }, rg); }
      else { el("stop", { offset: 0, "stop-color": "#fff", "stop-opacity": 0 }, lg); el("stop", { offset: .45, "stop-color": "#fff", "stop-opacity": .35 }, lg); el("stop", { offset: 1, "stop-color": "#fff" }, lg); }
      const mask = el("mask", { id: m, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: W, height: H }, defs);
      el("rect", { x: 0, y: 0, width: W, height: H, fill: `url(#${m}-${fade === "center" ? "r" : "g"})` }, mask);
      g = el("g", { mask: `url(#${m})` }, svg);
    }
    const seed = +box.dataset.seed || 7;
    box.dataset.seed = seed;                                        // the seed is recorded on the element (and in the caption)
    if (texture) {
      // A pattern from a recorded seed (algorithmic-art's method): the same seed draws the same field on screen and in
      // every PDF. Parameters: pitch, jitter (≤ 3°), opacity range (6–14 %), thinning toward the text side.
      const rand = rng(seed), jit = Math.min(3, +(box.dataset.jitter || 0)), lo = +(box.dataset.min || .06), hi = +(box.dataset.max || .14), thin = box.dataset.thin;
      const want = +box.dataset.count || 0, cells = [];
      for (let i = 0; i < cols * rows; i++) {
        const row = Math.floor(i / cols), c = i % cols, x = ox + c * pitch + (stag && row % 2 ? pitch / 2 : 0), y = oy + row * rowH;
        const t = !thin ? 1 : thin === "left" ? x / W : thin === "right" ? 1 - x / W : thin === "top" ? y / H : 1 - y / H;
        const w = Math.max(.0001, Math.pow(Math.max(0, Math.min(1, t * 1.1)), 1.4)), u = rand();
        cells.push({ x, y, key: want ? Math.pow(u, 1 / w) : (u <= w ? 1 : 0), b: rand(), o: rand() });
      }
      // With data-count the field holds exactly that many homes (weighted sampling: denser away from the words), so a
      // texture can be true; without it, cells are kept with the thinning chance.
      const keep = want ? cells.sort((p1, p2) => p2.key - p1.key).slice(0, want) : cells.filter(cl => cl.key);
      keep.forEach(cl => {
        const rot = -90 + (cl.b * 2 - 1) * jit, shift = centreShift(5) * r;
        el("path", { d: ngonD(5, cl.x, cl.y + shift, r, rot), fill: "currentColor", "fill-opacity": (lo + (hi - lo) * cl.o).toFixed(3) }, g);
      });
      box.dataset.homes = keep.length;
      frost(box, g === svg ? wrapAll(svg, defs) : g, defs, W, H);
      box.prepend(svg); box.dataset.drawn = W + "x" + H; box.dataset.colsDrawn = cols;
      return;
    }
    // Which homes are off (outlined) and which carry the mark: spread, deterministic.
    const rand = rng(seed), idx = [...Array(total).keys()];
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    // data-off lists the homes that are off by position (0 = top left), e.g. a building's vacant flat; else the seed spreads them.
    const off = box.dataset.off != null ? new Set(box.dataset.off.split(/[\s,]+/).filter(Boolean).map(Number)) : new Set(idx.slice(0, Math.max(0, total - on)));
    const marked = new Set(idx.slice(0, Math.min(mark, total)));
    const door = box.hasAttribute("data-door") && r > 5;
    // data-let="warm": a lived-in home is ink (or a dark tone on dark grounds) with its door lit in warm ochre, the
    // lit-window idea (BRIEF § 8.1); vacant homes stay outlined. The default keeps the quiet texture fill.
    const warm = box.dataset.let === "warm";
    if (warm) svg.classList.add("apd-field-warm");
    const fill = el("g", { class: "apd-field-on" }, g), line = el("g", { class: "apd-field-off" }, g), acc = el("g", { class: "apd-field-mark" }, g);
    let dOn = "", dOff = "", dMark = "", dDoor = "";
    const at = [];
    for (let i = 0; i < total; i++) {
      const row = Math.floor(i / cols), c = i % cols, x = ox + c * pitch + (stag && row % 2 ? pitch / 2 : 0), y = oy + row * rowH;
      const shift = centreShift(5) * r, p = ngonD(5, x, y + shift, r, -90) + (door ? doorD(x, y + shift, r) : "");
      at.push([x, y + shift]);
      if (marked.has(i)) dMark += p; else if (off.has(i)) dOff += ngonD(5, x, y + shift, r, -90); else { dOn += p; if (door && warm) dDoor += doorD(x, y + shift, r); }
    }
    if (dOn) el("path", { class: "home", d: dOn, "fill-rule": "evenodd" }, fill);
    if (dDoor) el("path", { class: "door", d: dDoor }, fill);
    if (dOff) el("path", { d: dOff }, line);
    if (dMark) el("path", { d: dMark, "fill-rule": "evenodd" }, acc);
    // data-mark-at: rings round homes by position (0 = top left, row by row; in a building stack the top row is the top
    // floor, so flat 301 in a 3-a-floor, 4-floor stack is position 3).
    if (box.dataset.markAt != null) {
      const ring = el("g", { class: "apd-field-ring" }, g);
      box.dataset.markAt.split(/[\s,]+/).filter(Boolean).map(Number).forEach(i => { if (at[i]) el("path", { d: ngonD(5, at[i][0], at[i][1], r * 1.42, -90) }, ring); });
    }
    frost(box, g === svg ? wrapAll(svg, defs) : g, defs, W, H);
    box.prepend(svg);
    box.dataset.drawn = W + "x" + H;
    box.dataset.colsDrawn = cols;
  }

  // Print fallback for glass over a field: backdrop-filter does not reach the PDF, so the field under each glass shape on
  // the same page is drawn again, blurred by an SVG filter (filters do print) and masked to the glass. Screen keeps the
  // live backdrop blur; print hides it and shows this frost instead.
  function frost(box, g, defs, W, H) {
    const page = box.closest(".apd-page"), glass = page ? [...page.querySelectorAll('.apd-shape[data-style="glass"]')] : [];
    if (!glass.length || !box.offsetWidth) return;
    const fr = box.getBoundingClientRect(), k = fr.width / W || 1;
    const d = glass.map(gl => {
      const r = gl.getBoundingClientRect(), sz = r.width / k, n = parseN(gl.dataset.n), rot = gl.dataset.rot != null ? +gl.dataset.rot : (n > 2 ? rotFor(n) : 0);
      const cx = (r.left - fr.left) / k + sz / 2, cy = (r.top - fr.top) / k + sz / 2 + (n > 2 ? centreShift(n, rot) * sz / 2 : 0);
      return ngonD(n, cx, cy, sz / 2, rot);
    }).join("");
    const id = uid("frost");
    const mOut = el("mask", { id: id + "-out", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: W, height: H }, defs);
    el("rect", { x: 0, y: 0, width: W, height: H, fill: "#fff" }, mOut); el("path", { d, fill: "#000" }, mOut);
    const mIn = el("mask", { id: id + "-in", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: W, height: H }, defs);
    el("path", { d, fill: "#fff" }, mIn);
    const f = el("filter", { id: id + "-blur", x: "-20%", y: "-20%", width: "140%", height: "140%" }, defs);
    el("feGaussianBlur", { stdDeviation: 18 }, f);                   // CSS blur(18px) = a standard deviation of 18
    const copy = g.cloneNode(true); copy.removeAttribute("mask");
    const wrap = el("g", { class: "apd-field-frost", mask: `url(#${id}-in)` }, g.parentNode);
    const inner = el("g", { filter: `url(#${id}-blur)` }, wrap); inner.appendChild(copy);
    g.classList.add("apd-field-sharp"); g.style.setProperty("--print-mask", `url(#${id}-out)`);
  }

  /* ---------- growth rows: each shape's area is proportional to its value ---------- */
  function sizeGrowth(row) {
    const items = [...row.querySelectorAll(".apd-shape[data-value]")];
    if (!items.length) return;
    const max = +row.dataset.max || 400;
    const need = items.map(it => +it.dataset.value / area(parseN(it.dataset.n)));
    const top = Math.max(...need);
    items.forEach((it, i) => it.style.setProperty("--shape-size", (max * Math.sqrt(need[i] / top)).toFixed(1) + "px"));
  }

  // A family shape inside any small SVG: <path data-ngon="5"> (or "5,12" for an outer radius of 12), centred on 0,0.
  function fillPaths(root) {
    (root || document).querySelectorAll("path[data-ngon]").forEach(p => {
      const [nn, rr] = p.dataset.ngon.split(","), R = +rr || 12;
      if (nn === "door") { p.setAttribute("d", doorD(0, centreShift(5) * R, R)); return; }   // the home's door alone (to light it)
      const n = parseN(nn);
      p.setAttribute("d", ngonD(n, 0, n > 2 ? centreShift(n) * R : 0, R) + (nn === "home" ? doorD(0, centreShift(5) * R, R) : ""));
    });
  }
  function draw(box) {
    const st = box.dataset.style;
    if (st === "family") return drawFamily(box);
    if (st === "field") return drawField(box);
    if (st === "seal") return drawSeal(box);
    return drawShape(box);
  }

  /* ---------- icons: the DS sprite, inline ---------- */
  const ICONS = /*@icons*/"<defs><clipPath id=\"ap-access-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M5.2 12.0a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-approve-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M6.200 12.400L6.210 12.243L6.241 12.089L6.291 11.941L6.361 11.800L6.448 11.669L6.551 11.552L6.670 11.448L6.800 11.361L6.941 11.291L7.089 11.241L7.243 11.210L7.400 11.200L7.557 11.210L7.711 11.241L7.859 11.291L8.000 11.361L8.130 11.448L8.248 11.552L11.448 14.552L11.552 14.669L11.639 14.800L11.709 14.941L11.759 15.089L11.790 15.243L11.800 15.400L11.790 15.557L11.759 15.711L11.709 15.859L11.639 16.000L11.552 16.131L11.448 16.248L11.331 16.352L11.200 16.439L11.059 16.509L10.911 16.559L10.757 16.590L10.600 16.600L10.443 16.590L10.289 16.559L10.141 16.509L10.000 16.439L9.870 16.352L9.752 16.248L6.551 13.248L6.448 13.130L6.361 13.000L6.291 12.859L6.241 12.711L6.210 12.557Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-approve-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M9.400 15.400L9.410 15.243L9.441 15.089L9.491 14.941L9.561 14.800L9.648 14.669L9.752 14.552L15.752 8.451L15.870 8.348L16.000 8.261L16.141 8.191L16.289 8.141L16.443 8.110L16.600 8.100L16.757 8.110L16.911 8.141L17.059 8.191L17.200 8.261L17.331 8.348L17.448 8.451L17.552 8.569L17.639 8.700L17.709 8.841L17.759 8.989L17.790 9.143L17.800 9.300L17.790 9.457L17.759 9.611L17.709 9.759L17.639 9.900L17.552 10.030L17.448 10.149L11.448 16.248L11.331 16.352L11.200 16.439L11.059 16.509L10.911 16.559L10.757 16.590L10.600 16.600L10.443 16.590L10.289 16.559L10.141 16.509L10.000 16.439L9.870 16.352L9.752 16.248L9.648 16.131L9.561 16.000L9.491 15.859L9.441 15.711L9.410 15.557Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-autopilot-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M15.426 7.854 A1.827 1.827 0 0 1 17.574 7.854L20.397 9.904 A1.827 1.827 0 0 1 21.061 11.948L19.982 15.266 A1.827 1.827 0 0 1 18.244 16.528L14.756 16.528 A1.827 1.827 0 0 1 13.018 15.266L11.939 11.948 A1.827 1.827 0 0 1 12.603 9.904 Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-calendar-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M7.45 9.6H16.55A0.95 0.95 0 0 1 17.5 10.549999999999999V10.55A0.95 0.95 0 0 1 16.55 11.5H7.45A0.95 0.95 0 0 1 6.5 10.55V10.549999999999999A0.95 0.95 0 0 1 7.45 9.6Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-calendar-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M14.1 13.4H15.7A1.5 1.5 0 0 1 17.2 14.9V16.5A1.5 1.5 0 0 1 15.7 18.0H14.1A1.5 1.5 0 0 1 12.6 16.5V14.9A1.5 1.5 0 0 1 14.1 13.4Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-calendar-c3\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M5.500 2.900L5.501 2.849L5.504 2.798L5.515 2.628L5.521 2.578L5.528 2.527L5.538 2.478L5.571 2.311L5.583 2.261L5.597 2.212L5.613 2.164L5.668 2.003L5.686 1.955L5.705 1.908L5.727 1.862L5.803 1.710L5.827 1.665L5.852 1.621L5.880 1.578L5.974 1.437L6.004 1.395L6.035 1.355L6.068 1.316L6.180 1.188L6.214 1.150L6.250 1.114L6.288 1.080L6.416 0.968L6.455 0.935L6.495 0.904L6.537 0.874L6.678 0.780L6.721 0.752L6.765 0.727L6.810 0.703L6.962 0.627L7.008 0.606L7.055 0.586L7.103 0.568L7.264 0.513L7.312 0.497L7.361 0.483L7.411 0.471L7.577 0.438L7.628 0.428L7.678 0.421L7.729 0.415L7.898 0.404L7.949 0.401L8.000 0.400L8.051 0.401L8.102 0.404L8.271 0.415L8.322 0.421L8.373 0.428L8.422 0.438L8.589 0.471L8.639 0.483L8.688 0.497L8.736 0.513L8.897 0.568L8.945 0.586L8.992 0.606L9.038 0.627L9.190 0.703L9.235 0.727L9.279 0.752L9.322 0.780L9.463 0.874L9.505 0.904L9.545 0.935L9.584 0.968L9.712 1.080L9.750 1.114L9.786 1.150L9.820 1.188L9.932 1.316L9.965 1.355L9.996 1.395L10.026 1.437L10.120 1.578L10.148 1.621L10.173 1.665L10.197 1.710L10.273 1.862L10.294 1.908L10.315 1.955L10.332 2.003L10.387 2.164L10.403 2.212L10.417 2.261L10.429 2.311L10.462 2.478L10.472 2.527L10.479 2.578L10.485 2.628L10.496 2.798L10.499 2.849L10.500 2.900L10.500 5.500L10.499 5.551L10.496 5.602L10.485 5.771L10.479 5.822L10.472 5.872L10.462 5.923L10.429 6.089L10.417 6.139L10.403 6.188L10.387 6.236L10.332 6.397L10.315 6.445L10.294 6.492L10.273 6.538L10.197 6.690L10.173 6.735L10.148 6.779L10.120 6.822L10.026 6.963L9.996 7.005L9.965 7.045L9.932 7.084L9.820 7.212L9.786 7.250L9.750 7.286L9.712 7.320L9.584 7.432L9.545 7.465L9.505 7.496L9.463 7.526L9.322 7.620L9.279 7.648L9.235 7.673L9.190 7.697L9.038 7.773L8.992 7.795L8.945 7.814L8.897 7.832L8.736 7.887L8.688 7.903L8.639 7.917L8.589 7.929L8.422 7.962L8.373 7.972L8.322 7.979L8.271 7.985L8.102 7.996L8.051 7.999L8.000 8.000L7.949 7.999L7.898 7.996L7.729 7.985L7.678 7.979L7.628 7.972L7.577 7.962L7.411 7.929L7.361 7.917L7.312 7.903L7.264 7.887L7.103 7.832L7.055 7.814L7.008 7.795L6.962 7.773L6.810 7.697L6.765 7.673L6.721 7.648L6.678 7.620L6.537 7.526L6.495 7.496L6.455 7.465L6.416 7.432L6.288 7.320L6.250 7.286L6.214 7.250L6.180 7.212L6.068 7.084L6.035 7.045L6.004 7.005L5.974 6.963L5.880 6.822L5.852 6.779L5.827 6.735L5.803 6.690L5.727 6.538L5.705 6.492L5.686 6.445L5.668 6.397L5.613 6.236L5.597 6.188L5.583 6.139L5.571 6.089L5.538 5.923L5.528 5.872L5.521 5.822L5.515 5.771L5.504 5.602L5.501 5.551L5.500 5.500Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-calendar-c4\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M13.500 2.900L13.501 2.849L13.504 2.798L13.515 2.628L13.521 2.578L13.528 2.527L13.538 2.478L13.571 2.311L13.583 2.261L13.597 2.212L13.613 2.164L13.668 2.003L13.685 1.955L13.706 1.908L13.727 1.862L13.803 1.710L13.827 1.665L13.852 1.621L13.880 1.578L13.974 1.437L14.004 1.395L14.035 1.355L14.068 1.316L14.180 1.188L14.214 1.150L14.250 1.114L14.288 1.080L14.416 0.968L14.455 0.935L14.495 0.904L14.537 0.874L14.678 0.780L14.721 0.752L14.765 0.727L14.810 0.703L14.962 0.627L15.008 0.606L15.055 0.586L15.103 0.568L15.264 0.513L15.312 0.497L15.361 0.483L15.411 0.471L15.578 0.438L15.627 0.428L15.678 0.421L15.729 0.415L15.898 0.404L15.949 0.401L16.000 0.400L16.051 0.401L16.102 0.404L16.271 0.415L16.322 0.421L16.372 0.428L16.422 0.438L16.589 0.471L16.639 0.483L16.688 0.497L16.736 0.513L16.897 0.568L16.945 0.586L16.992 0.606L17.038 0.627L17.190 0.703L17.235 0.727L17.279 0.752L17.322 0.780L17.463 0.874L17.505 0.904L17.545 0.935L17.584 0.968L17.712 1.080L17.750 1.114L17.786 1.150L17.820 1.188L17.932 1.316L17.965 1.355L17.996 1.395L18.026 1.437L18.120 1.578L18.148 1.621L18.173 1.665L18.197 1.710L18.273 1.862L18.294 1.908L18.314 1.955L18.332 2.003L18.387 2.164L18.403 2.212L18.417 2.261L18.429 2.311L18.462 2.478L18.472 2.527L18.479 2.578L18.485 2.628L18.496 2.798L18.499 2.849L18.500 2.900L18.500 5.500L18.499 5.551L18.496 5.602L18.485 5.771L18.479 5.822L18.472 5.872L18.462 5.923L18.429 6.089L18.417 6.139L18.403 6.188L18.387 6.236L18.332 6.397L18.314 6.445L18.294 6.492L18.273 6.538L18.197 6.690L18.173 6.735L18.148 6.779L18.120 6.822L18.026 6.963L17.996 7.005L17.965 7.045L17.932 7.084L17.820 7.212L17.786 7.250L17.750 7.286L17.712 7.320L17.584 7.432L17.545 7.465L17.505 7.496L17.463 7.526L17.322 7.620L17.279 7.648L17.235 7.673L17.190 7.697L17.038 7.773L16.992 7.795L16.945 7.814L16.897 7.832L16.736 7.887L16.688 7.903L16.639 7.917L16.589 7.929L16.422 7.962L16.372 7.972L16.322 7.979L16.271 7.985L16.102 7.996L16.051 7.999L16.000 8.000L15.949 7.999L15.898 7.996L15.729 7.985L15.678 7.979L15.627 7.972L15.578 7.962L15.411 7.929L15.361 7.917L15.312 7.903L15.264 7.887L15.103 7.832L15.055 7.814L15.008 7.795L14.962 7.773L14.810 7.697L14.765 7.673L14.721 7.648L14.678 7.620L14.537 7.526L14.495 7.496L14.455 7.465L14.416 7.432L14.288 7.320L14.250 7.286L14.214 7.250L14.180 7.212L14.068 7.084L14.035 7.045L14.004 7.005L13.974 6.963L13.880 6.822L13.852 6.779L13.827 6.735L13.803 6.690L13.727 6.538L13.706 6.492L13.685 6.445L13.668 6.397L13.613 6.236L13.597 6.188L13.583 6.139L13.571 6.089L13.538 5.923L13.528 5.872L13.521 5.822L13.515 5.771L13.504 5.602L13.501 5.551L13.500 5.500Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-credit-check-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M9.6 10.2a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-credit-check-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M12.0 10.9H12.0A1.0 1.0 0 0 1 13.0 11.9V14.9A1.0 1.0 0 0 1 12.0 15.9H12.0A1.0 1.0 0 0 1 11.0 14.9V11.9A1.0 1.0 0 0 1 12.0 10.9Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-deposit-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M12.0 7.5H11.999999999999998A1.3 1.3 0 0 1 13.299999999999999 8.8V15.2A1.3 1.3 0 0 1 11.999999999999998 16.5H12.0A1.3 1.3 0 0 1 10.7 15.2V8.8A1.3 1.3 0 0 1 12.0 7.5Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-enquiry-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M6.1499999999999995 10.25a1.45 1.45 0 1 0 2.9 0a1.45 1.45 0 1 0 -2.9 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-enquiry-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M10.55 10.25a1.45 1.45 0 1 0 2.9 0a1.45 1.45 0 1 0 -2.9 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-enquiry-c3\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M14.95 10.25a1.45 1.45 0 1 0 2.9 0a1.45 1.45 0 1 0 -2.9 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-home-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M12.0 13.599999999999998H12.0A1.25 1.25 0 0 1 13.25 14.849999999999998V17.949999999999996A1.25 1.25 0 0 1 12.0 19.199999999999996H12.0A1.25 1.25 0 0 1 10.75 17.949999999999996V14.849999999999998A1.25 1.25 0 0 1 12.0 13.599999999999998Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-lease-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M8.45 6.4H15.55A0.95 0.95 0 0 1 16.5 7.3500000000000005V7.3500000000000005A0.95 0.95 0 0 1 15.55 8.3H8.45A0.95 0.95 0 0 1 7.5 7.3500000000000005V7.3500000000000005A0.95 0.95 0 0 1 8.45 6.4Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-lease-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M8.45 10.2H12.55A0.95 0.95 0 0 1 13.5 11.149999999999999V11.15A0.95 0.95 0 0 1 12.55 12.1H8.45A0.95 0.95 0 0 1 7.5 11.15V11.149999999999999A0.95 0.95 0 0 1 8.45 10.2Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-lease-c3\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M13.953 13.623 A1.100 1.100 0 0 1 15.247 13.623L16.946 14.858 A1.100 1.100 0 0 1 17.346 16.088L16.697 18.086 A1.100 1.100 0 0 1 15.650 18.846L13.550 18.846 A1.100 1.100 0 0 1 12.503 18.086L11.854 16.088 A1.100 1.100 0 0 1 12.254 14.858 Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-move-out-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M6.500 14.600L6.509 14.456L6.537 14.315L6.584 14.179L6.647 14.050L6.727 13.930L6.822 13.822L6.930 13.727L7.050 13.647L7.179 13.584L7.315 13.537L7.456 13.509L7.600 13.500L15.600 13.500L15.744 13.509L15.885 13.537L16.021 13.584L16.150 13.647L16.270 13.727L16.378 13.822L16.473 13.930L16.553 14.050L16.616 14.179L16.663 14.315L16.691 14.456L16.700 14.600L16.691 14.744L16.663 14.885L16.616 15.021L16.553 15.150L16.473 15.270L16.378 15.378L16.270 15.473L16.150 15.553L16.021 15.616L15.885 15.662L15.744 15.691L15.600 15.700L7.600 15.700L7.456 15.691L7.315 15.662L7.179 15.616L7.050 15.553L6.930 15.473L6.822 15.378L6.727 15.270L6.647 15.150L6.584 15.021L6.537 14.885L6.509 14.744Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-move-out-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M11.800 11.800L11.809 11.656L11.838 11.515L11.884 11.379L11.947 11.250L12.027 11.130L12.122 11.022L12.230 10.927L12.350 10.847L12.479 10.784L12.615 10.738L12.756 10.709L12.900 10.700L13.044 10.709L13.185 10.738L13.321 10.784L13.450 10.847L13.570 10.927L13.678 11.022L16.478 13.822L16.573 13.930L16.653 14.050L16.716 14.179L16.762 14.315L16.791 14.456L16.800 14.600L16.791 14.744L16.762 14.885L16.716 15.021L16.653 15.150L16.573 15.270L16.478 15.378L16.370 15.473L16.250 15.553L16.121 15.616L15.985 15.662L15.844 15.691L15.700 15.700L15.556 15.691L15.415 15.662L15.279 15.616L15.150 15.553L15.030 15.473L14.922 15.378L12.122 12.578L12.027 12.470L11.947 12.350L11.884 12.221L11.838 12.085L11.809 11.944Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-move-out-c3\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M11.800 17.400L11.809 17.256L11.838 17.115L11.884 16.979L11.947 16.850L12.027 16.730L12.122 16.622L14.922 13.822L15.030 13.727L15.150 13.647L15.279 13.584L15.415 13.537L15.556 13.509L15.700 13.500L15.844 13.509L15.985 13.537L16.121 13.584L16.250 13.647L16.370 13.727L16.478 13.822L16.573 13.930L16.653 14.050L16.716 14.179L16.762 14.315L16.791 14.456L16.800 14.600L16.791 14.744L16.762 14.885L16.716 15.021L16.653 15.150L16.573 15.270L16.478 15.378L13.678 18.178L13.570 18.273L13.450 18.353L13.321 18.416L13.185 18.462L13.044 18.491L12.900 18.500L12.756 18.491L12.615 18.462L12.479 18.416L12.350 18.353L12.230 18.273L12.122 18.178L12.027 18.070L11.947 17.950L11.884 17.821L11.838 17.685L11.809 17.544Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-needs-you-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M12.0 6.3999999999999995H11.999999999999998A1.3 1.3 0 0 1 13.299999999999999 7.699999999999999V12.5A1.3 1.3 0 0 1 11.999999999999998 13.8H12.0A1.3 1.3 0 0 1 10.7 12.5V7.699999999999999A1.3 1.3 0 0 1 12.0 6.3999999999999995Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-needs-you-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M10.5 16.6a1.5 1.5 0 1 0 3.0 0a1.5 1.5 0 1 0 -3.0 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-portfolio-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M0.650 12.358L0.650 12.307L0.652 12.257L0.654 12.207L0.665 12.037L0.669 11.986L0.673 11.936L0.678 11.886L0.684 11.836L0.691 11.786L0.699 11.736L0.708 11.686L0.717 11.637L0.750 11.470L0.761 11.421L0.772 11.372L0.784 11.323L0.797 11.274L0.811 11.225L0.826 11.177L0.841 11.129L0.896 10.968L0.912 10.921L0.930 10.873L0.948 10.826L0.967 10.779L0.987 10.733L1.007 10.687L1.029 10.641L1.051 10.596L1.126 10.443L1.149 10.399L1.173 10.354L1.198 10.310L1.223 10.266L1.249 10.223L1.276 10.181L1.304 10.138L1.398 9.997L1.426 9.955L1.456 9.914L1.485 9.873L1.516 9.833L1.547 9.794L1.579 9.755L1.612 9.716L1.724 9.588L1.757 9.550L1.791 9.513L1.826 9.477L1.861 9.441L1.897 9.405L1.934 9.370L1.971 9.336L2.009 9.303L2.136 9.191L2.175 9.158L2.214 9.126L2.253 9.094L2.293 9.064L2.334 9.034L6.734 5.837L6.775 5.807L6.816 5.779L6.958 5.684L7.000 5.657L7.042 5.629L7.085 5.603L7.129 5.578L7.173 5.553L7.217 5.529L7.262 5.506L7.307 5.483L7.460 5.408L7.505 5.386L7.551 5.366L7.597 5.346L7.644 5.327L7.691 5.308L7.738 5.291L7.786 5.274L7.947 5.219L7.995 5.204L8.043 5.189L8.091 5.175L8.140 5.161L8.189 5.149L8.238 5.137L8.287 5.127L8.454 5.094L8.504 5.084L8.553 5.075L8.603 5.067L8.653 5.060L8.703 5.054L8.753 5.048L8.804 5.044L8.854 5.040L9.024 5.029L9.074 5.026L9.124 5.025L9.175 5.024L9.225 5.024L9.276 5.025L9.326 5.026L9.376 5.029L9.546 5.040L9.596 5.044L9.647 5.048L9.697 5.054L9.747 5.060L9.797 5.067L9.847 5.075L9.896 5.084L9.946 5.094L10.113 5.127L10.162 5.137L10.211 5.149L10.260 5.161L10.309 5.175L10.357 5.189L10.405 5.204L10.453 5.219L10.614 5.274L10.662 5.291L10.709 5.308L10.756 5.327L10.803 5.346L10.849 5.366L10.895 5.386L10.940 5.408L11.093 5.483L11.138 5.506L11.183 5.529L11.227 5.553L11.271 5.578L11.315 5.603L11.358 5.629L11.400 5.657L11.442 5.684L11.584 5.779L11.625 5.807L11.666 5.837L11.829 5.955L14.029 7.553L15.944 8.945L16.066 9.034L16.107 9.064L16.147 9.094L16.186 9.126L16.225 9.158L16.264 9.191L16.392 9.303L16.429 9.336L16.466 9.370L16.503 9.405L16.539 9.441L16.574 9.477L16.609 9.513L16.643 9.550L16.676 9.588L16.788 9.716L16.821 9.755L16.853 9.794L16.884 9.833L16.915 9.873L16.945 9.914L16.974 9.955L17.002 9.997L17.096 10.138L17.124 10.181L17.151 10.223L17.177 10.266L17.203 10.310L17.227 10.354L17.251 10.399L17.274 10.443L17.349 10.596L17.371 10.641L17.393 10.687L17.413 10.733L17.433 10.779L17.452 10.826L17.470 10.873L17.488 10.921L17.504 10.968L17.559 11.129L17.574 11.177L17.589 11.225L17.603 11.274L17.616 11.323L17.628 11.372L17.639 11.421L17.650 11.470L17.683 11.637L17.692 11.686L17.701 11.736L17.709 11.786L17.716 11.836L17.722 11.886L17.727 11.936L17.731 11.986L17.735 12.037L17.746 12.207L17.748 12.257L17.750 12.307L17.750 12.358L17.750 12.408L17.749 12.459L17.747 12.509L17.744 12.559L17.733 12.729L17.729 12.779L17.725 12.829L17.719 12.880L17.713 12.930L17.705 12.980L17.697 13.029L17.688 13.079L17.655 13.246L17.645 13.295L17.634 13.345L17.622 13.393L17.610 13.442L17.596 13.491L17.582 13.539L17.567 13.588L17.536 13.683L16.882 15.695L16.041 18.282L15.901 18.713L15.886 18.761L15.870 18.808L15.815 18.969L15.798 19.017L15.780 19.064L15.762 19.111L15.743 19.158L15.723 19.204L15.701 19.250L15.680 19.295L15.604 19.448L15.582 19.493L15.559 19.537L15.534 19.582L15.509 19.625L15.484 19.669L15.457 19.712L15.430 19.754L15.307 19.938L15.279 19.979L15.249 20.020L15.219 20.060L15.188 20.100L15.157 20.140L15.124 20.178L15.091 20.216L14.979 20.344L14.946 20.382L14.911 20.419L14.876 20.455L14.841 20.491L14.805 20.526L14.768 20.561L14.730 20.594L14.602 20.706L14.564 20.740L14.526 20.772L14.487 20.804L14.447 20.835L14.407 20.865L14.366 20.895L14.325 20.924L14.283 20.952L14.141 21.047L14.099 21.074L14.056 21.101L14.013 21.127L13.969 21.152L13.925 21.176L13.880 21.200L13.835 21.223L13.683 21.298L13.638 21.320L13.592 21.341L13.546 21.361L13.499 21.381L13.452 21.399L13.405 21.417L13.358 21.434L13.197 21.489L13.149 21.505L13.101 21.521L13.053 21.535L13.004 21.549L12.955 21.562L12.906 21.574L12.857 21.585L12.808 21.595L12.641 21.628L12.591 21.637L12.542 21.646L12.492 21.653L12.442 21.660L12.392 21.666L12.341 21.671L12.291 21.675L12.122 21.686L12.071 21.689L12.021 21.691L11.970 21.693L11.920 21.693L6.480 21.693L6.430 21.693L6.379 21.691L6.329 21.689L6.278 21.686L6.109 21.675L6.059 21.671L6.008 21.666L5.958 21.660L5.908 21.653L5.858 21.646L5.809 21.637L5.759 21.628L5.592 21.595L5.543 21.585L5.494 21.574L5.445 21.562L5.396 21.549L5.347 21.535L5.299 21.521L5.251 21.505L5.203 21.489L5.042 21.434L4.995 21.417L4.948 21.399L4.901 21.381L4.854 21.361L4.808 21.341L4.762 21.320L4.717 21.298L4.564 21.223L4.519 21.200L4.475 21.176L4.431 21.152L4.387 21.127L4.344 21.101L4.301 21.074L4.259 21.047L4.117 20.952L4.075 20.924L4.034 20.895L3.993 20.865L3.953 20.835L3.913 20.804L3.874 20.772L3.836 20.740L3.797 20.706L3.670 20.594L3.632 20.561L3.595 20.526L3.559 20.491L3.524 20.455L3.489 20.419L3.454 20.382L3.421 20.344L3.309 20.216L3.276 20.178L3.243 20.140L3.212 20.100L3.181 20.060L3.151 20.020L3.121 19.979L3.092 19.938L2.970 19.754L2.943 19.712L2.916 19.669L2.891 19.625L2.866 19.582L2.841 19.537L2.818 19.493L2.796 19.448L2.720 19.295L2.699 19.250L2.678 19.204L2.657 19.158L2.638 19.111L2.619 19.064L2.602 19.017L2.585 18.969L2.530 18.808L2.514 18.761L2.499 18.713L2.359 18.282L1.518 15.695L0.864 13.683L0.833 13.588L0.818 13.539L0.804 13.491L0.790 13.442L0.778 13.393L0.766 13.345L0.755 13.295L0.745 13.246L0.712 13.079L0.703 13.029L0.695 12.980L0.687 12.930L0.681 12.880L0.675 12.829L0.671 12.779L0.667 12.729L0.656 12.559L0.653 12.509L0.651 12.459L0.650 12.408Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-portfolio-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M9.2 14.400000000000002H9.2A1.0 1.0 0 0 1 10.2 15.400000000000002V17.800000000000004A1.0 1.0 0 0 1 9.2 18.800000000000004H9.2A1.0 1.0 0 0 1 8.2 17.800000000000004V15.400000000000002A1.0 1.0 0 0 1 9.2 14.400000000000002Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-rent-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M1.0 8.4H23.0V11.0H1.0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-rent-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M5.95 14.2H9.05A0.95 0.95 0 0 1 10.0 15.149999999999999V15.149999999999999A0.95 0.95 0 0 1 9.05 16.099999999999998H5.95A0.95 0.95 0 0 1 5.0 15.149999999999999V15.149999999999999A0.95 0.95 0 0 1 5.95 14.2Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-repairs-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M18.6 1.4H18.6A1.8 1.8 0 0 1 20.400000000000002 3.2V7.6000000000000005A1.8 1.8 0 0 1 18.6 9.4H18.6A1.8 1.8 0 0 1 16.8 7.6000000000000005V3.2A1.8 1.8 0 0 1 18.6 1.4Z\" clip-rule=\"evenodd\" transform=\"rotate(45 18.6 5.4)\"/></clipPath><clipPath id=\"ap-repairs-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M4.15 18.7a1.15 1.15 0 1 0 2.3 0a1.15 1.15 0 1 0 -2.3 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-search-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M5.999999999999999 10.2a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0 -8.4 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-settings-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M15.200000000000001 7.3a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-settings-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M4.0 16.7a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ap-viewing-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M8.0 14.4a4.0 4.0 0 1 0 8.0 0a4.0 4.0 0 1 0 -8.0 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-building-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M8.50 6.00H9.50A1.00 1.00 0 0 1 10.50 7.00V8.00A1.00 1.00 0 0 1 9.50 9.00H8.50A1.00 1.00 0 0 1 7.50 8.00V7.00A1.00 1.00 0 0 1 8.50 6.00Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-building-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M14.50 6.00H15.50A1.00 1.00 0 0 1 16.50 7.00V8.00A1.00 1.00 0 0 1 15.50 9.00H14.50A1.00 1.00 0 0 1 13.50 8.00V7.00A1.00 1.00 0 0 1 14.50 6.00Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-building-c3\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M8.50 11.00H9.50A1.00 1.00 0 0 1 10.50 12.00V13.00A1.00 1.00 0 0 1 9.50 14.00H8.50A1.00 1.00 0 0 1 7.50 13.00V12.00A1.00 1.00 0 0 1 8.50 11.00Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-building-c4\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M14.50 11.00H15.50A1.00 1.00 0 0 1 16.50 12.00V13.00A1.00 1.00 0 0 1 15.50 14.00H14.50A1.00 1.00 0 0 1 13.50 13.00V12.00A1.00 1.00 0 0 1 14.50 11.00Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-building-c5\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M11.75 16.00H12.25A1.50 1.50 0 0 1 13.75 17.50V20.50A1.50 1.50 0 0 1 12.25 22.00H11.75A1.50 1.50 0 0 1 10.25 20.50V17.50A1.50 1.50 0 0 1 11.75 16.00Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-camera-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M8.00 13.50a4.00 4.00 0 1 0 8.00 0a4.00 4.00 0 1 0 -8.00 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-clock-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M11.00 7.00L11.00 12.20A1.00 1.00 0 0 0 13.00 12.20L13.00 7.00A1.00 1.00 0 0 0 11.00 7.00Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-clock-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M11.51 13.07L15.11 15.07A1.00 1.00 0 0 0 16.09 13.33L12.49 11.33A1.00 1.00 0 0 0 11.51 13.07Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-clock-c3\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M11.00 7.00a1.00 1.00 0 1 0 2.00 0a1.00 1.00 0 1 0 -2.00 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-clock-c4\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M11.00 12.20a1.00 1.00 0 1 0 2.00 0a1.00 1.00 0 1 0 -2.00 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-clock-c5\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M14.60 14.20a1.00 1.00 0 1 0 2.00 0a1.00 1.00 0 1 0 -2.00 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-delete-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M9.20 11.00L9.20 17.50A0.80 0.80 0 0 0 10.80 17.50L10.80 11.00A0.80 0.80 0 0 0 9.20 11.00Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-delete-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M13.20 11.00L13.20 17.50A0.80 0.80 0 0 0 14.80 17.50L14.80 11.00A0.80 0.80 0 0 0 13.20 11.00Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-document-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M8.50 9.85L15.50 9.85A0.85 0.85 0 0 0 15.50 8.15L8.50 8.15A0.85 0.85 0 0 0 8.50 9.85Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-document-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M8.50 13.35L15.50 13.35A0.85 0.85 0 0 0 15.50 11.65L8.50 11.65A0.85 0.85 0 0 0 8.50 13.35Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-document-c3\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M8.50 16.85L12.50 16.85A0.85 0.85 0 0 0 12.50 15.15L8.50 15.15A0.85 0.85 0 0 0 8.50 16.85Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-door-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M13.20 12.60a1.40 1.40 0 1 0 2.80 0a1.40 1.40 0 1 0 -2.80 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-edit-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M16.40 7.50a0.10 0.10 0 1 0 0.20 0a0.10 0.10 0 1 0 -0.20 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-eye-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M8.60 12.00a3.40 3.40 0 1 0 6.80 0a3.40 3.40 0 1 0 -6.80 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-inbox-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M5.5 8.5A2 2 0 0 1 7.5 6.5H16.5A2 2 0 0 1 18.5 8.5V13H15.6A1.6 1.6 0 0 0 14 14.6A2 2 0 0 1 12 16.4A2 2 0 0 1 10 14.6A1.6 1.6 0 0 0 8.4 13H5.5Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-info-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M10.90 11.20L10.90 16.60A1.10 1.10 0 0 0 13.10 16.60L13.10 11.20A1.10 1.10 0 0 0 10.90 11.20Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-info-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M10.70 7.80a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-link-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M6.60 10.40H9.60A1.60 1.60 0 0 1 11.20 12.00V12.00A1.60 1.60 0 0 1 9.60 13.60H6.60A1.60 1.60 0 0 1 5.00 12.00V12.00A1.60 1.60 0 0 1 6.60 10.40Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-link-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M14.40 10.40H17.40A1.60 1.60 0 0 1 19.00 12.00V12.00A1.60 1.60 0 0 1 17.40 13.60H14.40A1.60 1.60 0 0 1 12.80 12.00V12.00A1.60 1.60 0 0 1 14.40 10.40Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-link-c3\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M10.80 10.60H13.20A1.40 1.40 0 0 1 14.60 12.00V12.00A1.40 1.40 0 0 1 13.20 13.40H10.80A1.40 1.40 0 0 1 9.40 12.00V12.00A1.40 1.40 0 0 1 10.80 10.60Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-lock-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M12.00 4.90H12.00A2.10 2.10 0 0 1 14.10 7.00V9.00A2.10 2.10 0 0 1 12.00 11.10H12.00A2.10 2.10 0 0 1 9.90 9.00V7.00A2.10 2.10 0 0 1 12.00 4.90Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-lock-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M11.00 14.00L11.00 17.20A1.00 1.00 0 0 0 13.00 17.20L13.00 14.00A1.00 1.00 0 0 0 11.00 14.00Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-mail-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M5.50 9.75L11.50 13.75A0.90 0.90 0 0 0 12.50 12.25L6.50 8.25A0.90 0.90 0 0 0 5.50 9.75Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-mail-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M12.50 13.75L18.50 9.75A0.90 0.90 0 0 0 17.50 8.25L11.50 12.25A0.90 0.90 0 0 0 12.50 13.75Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-mail-c3\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M5.10 9.00a0.90 0.90 0 1 0 1.80 0a0.90 0.90 0 1 0 -1.80 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-mail-c4\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M11.10 13.00a0.90 0.90 0 1 0 1.80 0a0.90 0.90 0 1 0 -1.80 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-mail-c5\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M17.10 9.00a0.90 0.90 0 1 0 1.80 0a0.90 0.90 0 1 0 -1.80 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-mobile-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M9.80 4.40H14.20A1.60 1.60 0 0 1 15.80 6.00V15.40A1.60 1.60 0 0 1 14.20 17.00H9.80A1.60 1.60 0 0 1 8.20 15.40V6.00A1.60 1.60 0 0 1 9.80 4.40Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-mobile-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M11.40 18.40H12.60A0.90 0.90 0 0 1 13.50 19.30V19.30A0.90 0.90 0 0 1 12.60 20.20H11.40A0.90 0.90 0 0 1 10.50 19.30V19.30A0.90 0.90 0 0 1 11.40 18.40Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-photo-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M8.48 10.88L8.61 10.69L8.76 10.51L8.93 10.36L9.12 10.23L9.33 10.13L9.55 10.06L9.77 10.02L10.00 10.00L10.23 10.02L10.45 10.06L10.67 10.13L10.88 10.23L11.07 10.36L11.24 10.51L11.39 10.69L11.52 10.88L13.98 15.15L14.09 15.35L14.16 15.57L14.20 15.79L14.22 16.02L14.20 16.25L14.16 16.48L14.09 16.69L13.98 16.90L13.86 17.09L13.70 17.26L13.53 17.41L13.34 17.54L13.14 17.64L12.92 17.72L12.69 17.76L12.46 17.78L7.54 17.78L7.31 17.76L7.08 17.72L6.86 17.64L6.66 17.54L6.47 17.41L6.30 17.26L6.14 17.09L6.02 16.90L5.91 16.69L5.84 16.48L5.80 16.25L5.78 16.02L5.80 15.79L5.84 15.57L5.91 15.35L6.02 15.15Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-photo-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M13.60 9.00a1.60 1.60 0 1 0 3.20 0a1.60 1.60 0 1 0 -3.20 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-pin-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M9.40 10.50a2.60 2.60 0 1 0 5.20 0a2.60 2.60 0 1 0 -5.20 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-vendor-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M6.00 17.50a1.00 1.00 0 1 0 2.00 0a1.00 1.00 0 1 0 -2.00 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-vendor-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M16.00 17.50a1.00 1.00 0 1 0 2.00 0a1.00 1.00 0 1 0 -2.00 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-vendor-c3\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M16.20 10.80H17.40A1.20 1.20 0 0 1 18.60 12.00V12.40A1.20 1.20 0 0 1 17.40 13.60H16.20A1.20 1.20 0 0 1 15.00 12.40V12.00A1.20 1.20 0 0 1 16.20 10.80Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-warning-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M10.90 10.00L10.90 14.40A1.10 1.10 0 0 0 13.10 14.40L13.10 10.00A1.10 1.10 0 0 0 10.90 10.00Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-warning-c2\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M10.75 17.60a1.25 1.25 0 1 0 2.50 0a1.25 1.25 0 1 0 -2.50 0Z\" clip-rule=\"evenodd\"/></clipPath><clipPath id=\"ui-worker-c1\" clipPathUnits=\"userSpaceOnUse\"><path d=\"M-40 -40H64V64H-40Z M4.50 8.85L19.50 8.85A0.55 0.55 0 0 0 19.50 7.75L4.50 7.75A0.55 0.55 0 0 0 4.50 8.85Z\" clip-rule=\"evenodd\"/></clipPath></defs><symbol id=\"ap-access\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-access-c1)\"><circle cx=\"7.4\" cy=\"12\" r=\"5.6\" fill=\"currentColor\" /><rect x=\"10.5\" y=\"10.6\" width=\"11.5\" height=\"2.8\" rx=\"1.4\" fill=\"currentColor\" /><rect x=\"15.2\" y=\"12\" width=\"2.6\" height=\"4.6\" rx=\"1.3\" fill=\"currentColor\" /><rect x=\"19.2\" y=\"12\" width=\"2.6\" height=\"3.4\" rx=\"1.3\" fill=\"currentColor\" /></g></symbol><symbol id=\"ap-alerts\" viewBox=\"0 0 24 24\"><path d=\"M5 16.4 V10.6 A7 7 0 0 1 19 10.6 V16.4 Z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"0\" stroke-linejoin=\"round\" /><rect x=\"3\" y=\"15\" width=\"18\" height=\"3.2\" rx=\"1.6\" fill=\"currentColor\" /><circle cx=\"12\" cy=\"3.4\" r=\"1.5\" fill=\"currentColor\" /><circle cx=\"12\" cy=\"21.1\" r=\"1.7\" fill=\"currentColor\" /></symbol><symbol id=\"ap-analytics\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"12\" width=\"4.8\" height=\"10\" rx=\"2.4\" fill=\"currentColor\" /><rect x=\"9.6\" y=\"6.5\" width=\"4.8\" height=\"15.5\" rx=\"2.4\" fill=\"currentColor\" /><rect x=\"16.2\" y=\"2\" width=\"4.8\" height=\"20\" rx=\"2.4\" fill=\"currentColor\" /></symbol><symbol id=\"ap-approve\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-approve-c2)\"><g clip-path=\"url(#ap-approve-c1)\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"currentColor\" /></g></g></symbol><symbol id=\"ap-autopilot\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-autopilot-c1)\"><rect x=\"1\" y=\"5.8\" width=\"22\" height=\"12.4\" rx=\"6.2\" fill=\"currentColor\" /></g><rect x=\"15.950000000000001\" y=\"12.75\" width=\"1.3\" height=\"2.7\" rx=\"0.65\" fill=\"currentColor\" /></symbol><symbol id=\"ap-calendar\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-calendar-c4)\"><g clip-path=\"url(#ap-calendar-c3)\"><g clip-path=\"url(#ap-calendar-c2)\"><g clip-path=\"url(#ap-calendar-c1)\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"16.5\" rx=\"4.5\" fill=\"currentColor\" /></g></g></g></g><rect x=\"6.8\" y=\"1.7000000000000002\" width=\"2.4\" height=\"5\" rx=\"1.2\" fill=\"currentColor\" /><rect x=\"14.8\" y=\"1.7000000000000002\" width=\"2.4\" height=\"5\" rx=\"1.2\" fill=\"currentColor\" /></symbol><symbol id=\"ap-credit-check\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-credit-check-c2)\"><g clip-path=\"url(#ap-credit-check-c1)\"><path d=\"M14.252 20.723 A3.832 3.832 0 0 1 9.748 20.723L3.830 16.423 A3.832 3.832 0 0 1 2.438 12.139L4.698 5.182 A3.832 3.832 0 0 1 8.342 2.534L15.658 2.534 A3.832 3.832 0 0 1 19.302 5.182L21.562 12.139 A3.832 3.832 0 0 1 20.170 16.423 Z\" fill=\"currentColor\" /></g></g></symbol><symbol id=\"ap-deposit\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-deposit-c1)\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"currentColor\" /></g></symbol><symbol id=\"ap-enquiry\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-enquiry-c3)\"><g clip-path=\"url(#ap-enquiry-c2)\"><g clip-path=\"url(#ap-enquiry-c1)\"><rect x=\"2\" y=\"3.5\" width=\"20\" height=\"13.5\" rx=\"6.75\" fill=\"currentColor\" /><path d=\"M5.6 14 L11 14 L5.8 20 Z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" /></g></g></g></symbol><symbol id=\"ap-home\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-home-c1)\"><path d=\"M9.690 3.038 A3.930 3.930 0 0 1 14.310 3.038L20.380 7.448 A3.930 3.930 0 0 1 21.808 11.842L19.489 18.978 A3.930 3.930 0 0 1 15.751 21.693L8.249 21.693 A3.930 3.930 0 0 1 4.511 18.978L2.192 11.842 A3.930 3.930 0 0 1 3.620 7.448 Z\" fill=\"currentColor\" /></g></symbol><symbol id=\"ap-lease\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-lease-c3)\"><g clip-path=\"url(#ap-lease-c2)\"><g clip-path=\"url(#ap-lease-c1)\"><rect x=\"4\" y=\"2\" width=\"16\" height=\"20\" rx=\"4.2\" fill=\"currentColor\" /></g></g></g></symbol><symbol id=\"ap-move-out\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-move-out-c3)\"><g clip-path=\"url(#ap-move-out-c2)\"><g clip-path=\"url(#ap-move-out-c1)\"><path d=\"M9.690 3.038 A3.930 3.930 0 0 1 14.310 3.038L20.380 7.448 A3.930 3.930 0 0 1 21.808 11.842L19.489 18.978 A3.930 3.930 0 0 1 15.751 21.693L8.249 21.693 A3.930 3.930 0 0 1 4.511 18.978L2.192 11.842 A3.930 3.930 0 0 1 3.620 7.448 Z\" fill=\"currentColor\" /></g></g></g></symbol><symbol id=\"ap-needs-you\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-needs-you-c2)\"><g clip-path=\"url(#ap-needs-you-c1)\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"currentColor\" /></g></g></symbol><symbol id=\"ap-portfolio\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-portfolio-c2)\"><g clip-path=\"url(#ap-portfolio-c1)\"><path d=\"M14.156 3.624 A2.456 2.456 0 0 1 17.044 3.624L20.837 6.380 A2.456 2.456 0 0 1 21.730 9.126L20.281 13.586 A2.456 2.456 0 0 1 17.945 15.283L13.255 15.283 A2.456 2.456 0 0 1 10.919 13.586L9.470 9.126 A2.456 2.456 0 0 1 10.363 6.380 Z\" fill=\"currentColor\" /></g><path d=\"M7.525 6.868 A2.849 2.849 0 0 1 10.875 6.868L15.275 10.065 A2.849 2.849 0 0 1 16.311 13.251L14.630 18.424 A2.849 2.849 0 0 1 11.920 20.393L6.480 20.393 A2.849 2.849 0 0 1 3.770 18.424L2.089 13.251 A2.849 2.849 0 0 1 3.125 10.065 Z\" fill=\"currentColor\" /></g></symbol><symbol id=\"ap-rent\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-rent-c2)\"><g clip-path=\"url(#ap-rent-c1)\"><rect x=\"2\" y=\"5\" width=\"20\" height=\"14\" rx=\"3.6\" fill=\"currentColor\" /></g></g></symbol><symbol id=\"ap-repairs\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-repairs-c2)\"><g clip-path=\"url(#ap-repairs-c1)\"><circle cx=\"15.2\" cy=\"8.8\" r=\"6.2\" fill=\"currentColor\" /><rect x=\"2\" y=\"13.3\" width=\"13.2\" height=\"4.2\" rx=\"2.1\" fill=\"currentColor\" transform=\"rotate(-45 8.6 15.4)\" /></g></g></symbol><symbol id=\"ap-search\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-search-c1)\"><circle cx=\"10.2\" cy=\"10.2\" r=\"7.6\" fill=\"currentColor\" /><rect x=\"13.8\" y=\"15.8\" width=\"7.6\" height=\"3.6\" rx=\"1.8\" fill=\"currentColor\" transform=\"rotate(45 17.6 17.6)\" /></g></symbol><symbol id=\"ap-settings\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-settings-c2)\"><g clip-path=\"url(#ap-settings-c1)\"><rect x=\"2\" y=\"3.5\" width=\"20\" height=\"7.6\" rx=\"3.8\" fill=\"currentColor\" /><rect x=\"2\" y=\"12.9\" width=\"20\" height=\"7.6\" rx=\"3.8\" fill=\"currentColor\" /></g></g></symbol><symbol id=\"ap-tenant\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"7.2\" r=\"4.6\" fill=\"currentColor\" /><rect x=\"3.5\" y=\"13.4\" width=\"17\" height=\"8.6\" rx=\"4.3\" fill=\"currentColor\" /></symbol><symbol id=\"ap-viewing\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ap-viewing-c1)\"><path d=\"M9.690 3.038 A3.930 3.930 0 0 1 14.310 3.038L20.380 7.448 A3.930 3.930 0 0 1 21.808 11.842L19.489 18.978 A3.930 3.930 0 0 1 15.751 21.693L8.249 21.693 A3.930 3.930 0 0 1 4.511 18.978L2.192 11.842 A3.930 3.930 0 0 1 3.620 7.448 Z\" fill=\"currentColor\" /></g><circle cx=\"12\" cy=\"14.4\" r=\"1.7\" fill=\"currentColor\" /></symbol><symbol id=\"ui-archive\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"5\" rx=\"1.6\" /><path d=\"M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9\" /><path d=\"M10 13.5h4\" /></g></symbol><symbol id=\"ui-arrow-right\" viewBox=\"0 0 24 24\"><path d=\"M4.50 13.30L18.50 13.30A1.30 1.30 0 0 0 18.50 10.70L4.50 10.70A1.30 1.30 0 0 0 4.50 13.30ZM12.08 7.42L17.58 12.92A1.30 1.30 0 0 0 19.42 11.08L13.92 5.58A1.30 1.30 0 0 0 12.08 7.42ZM17.58 11.08L12.08 16.58A1.30 1.30 0 0 0 13.92 18.42L19.42 12.92A1.30 1.30 0 0 0 17.58 11.08ZM11.70 6.50a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0ZM17.20 12.00a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0ZM11.70 17.50a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-attach\" viewBox=\"0 0 24 24\"><path d=\"M20 11.4l-7.7 7.7a5 5 0 0 1-7.1-7.1l8.2-8.2a3.4 3.4 0 0 1 4.8 4.8l-8 8a1.8 1.8 0 0 1-2.6-2.6l7.3-7.3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /></symbol><symbol id=\"ui-building\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-building-c5)\"><g clip-path=\"url(#ui-building-c4)\"><g clip-path=\"url(#ui-building-c3)\"><g clip-path=\"url(#ui-building-c2)\"><g clip-path=\"url(#ui-building-c1)\"><path d=\"M8.10 2.50H15.90A3.60 3.60 0 0 1 19.50 6.10V18.40A3.60 3.60 0 0 1 15.90 22.00H8.10A3.60 3.60 0 0 1 4.50 18.40V6.10A3.60 3.60 0 0 1 8.10 2.50Z\" fill=\"currentColor\" /></g></g></g></g></g></symbol><symbol id=\"ui-camera\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-camera-c1)\"><path d=\"M6.90 6.50H17.10A4.40 4.40 0 0 1 21.50 10.90V16.10A4.40 4.40 0 0 1 17.10 20.50H6.90A4.40 4.40 0 0 1 2.50 16.10V10.90A4.40 4.40 0 0 1 6.90 6.50ZM10.00 4.00H14.00A2.00 2.00 0 0 1 16.00 6.00V6.00A2.00 2.00 0 0 1 14.00 8.00H10.00A2.00 2.00 0 0 1 8.00 6.00V6.00A2.00 2.00 0 0 1 10.00 4.00Z\" fill=\"currentColor\" /></g></symbol><symbol id=\"ui-check\" viewBox=\"0 0 24 24\"><path d=\"M4.04 13.52L9.04 18.22A1.40 1.40 0 0 0 10.96 16.18L5.96 11.48A1.40 1.40 0 0 0 4.04 13.52ZM11.04 18.14L20.04 8.14A1.40 1.40 0 0 0 17.96 6.26L8.96 16.26A1.40 1.40 0 0 0 11.04 18.14ZM3.60 12.50a1.40 1.40 0 1 0 2.80 0a1.40 1.40 0 1 0 -2.80 0ZM8.60 17.20a1.40 1.40 0 1 0 2.80 0a1.40 1.40 0 1 0 -2.80 0ZM17.60 7.20a1.40 1.40 0 1 0 2.80 0a1.40 1.40 0 1 0 -2.80 0Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-chevron-down\" viewBox=\"0 0 24 24\"><path d=\"M5.08 10.42L11.08 16.42A1.30 1.30 0 0 0 12.92 14.58L6.92 8.58A1.30 1.30 0 0 0 5.08 10.42ZM12.92 16.42L18.92 10.42A1.30 1.30 0 0 0 17.08 8.58L11.08 14.58A1.30 1.30 0 0 0 12.92 16.42ZM4.70 9.50a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0ZM10.70 15.50a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0ZM16.70 9.50a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-chevron-right\" viewBox=\"0 0 24 24\"><path d=\"M8.58 6.92L14.58 12.92A1.30 1.30 0 0 0 16.42 11.08L10.42 5.08A1.30 1.30 0 0 0 8.58 6.92ZM14.58 11.08L8.58 17.08A1.30 1.30 0 0 0 10.42 18.92L16.42 12.92A1.30 1.30 0 0 0 14.58 11.08ZM8.20 6.00a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0ZM14.20 12.00a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0ZM8.20 18.00a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-clock\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-clock-c5)\"><g clip-path=\"url(#ui-clock-c4)\"><g clip-path=\"url(#ui-clock-c3)\"><g clip-path=\"url(#ui-clock-c2)\"><g clip-path=\"url(#ui-clock-c1)\"><path d=\"M2.50 12.00a9.50 9.50 0 1 0 19.00 0a9.50 9.50 0 1 0 -19.00 0Z\" fill=\"currentColor\" /></g></g></g></g></g></symbol><symbol id=\"ui-close\" viewBox=\"0 0 24 24\"><path d=\"M5.08 6.92L17.08 18.92A1.30 1.30 0 0 0 18.92 17.08L6.92 5.08A1.30 1.30 0 0 0 5.08 6.92ZM17.08 5.08L5.08 17.08A1.30 1.30 0 0 0 6.92 18.92L18.92 6.92A1.30 1.30 0 0 0 17.08 5.08Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-copy\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"8.6\" y=\"8.6\" width=\"11.6\" height=\"11.6\" rx=\"3\" /><path d=\"M15.4 4.9a2.6 2.6 0 0 0-2.2-1.2H6.4a2.7 2.7 0 0 0-2.7 2.7v6.8c0 .9.5 1.7 1.2 2.2\" /></g></symbol><symbol id=\"ui-delete\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-delete-c2)\"><g clip-path=\"url(#ui-delete-c1)\"><path d=\"M8.70 7.50H15.30A3.20 3.20 0 0 1 18.50 10.70V17.80A3.20 3.20 0 0 1 15.30 21.00H8.70A3.20 3.20 0 0 1 5.50 17.80V10.70A3.20 3.20 0 0 1 8.70 7.50ZM4.00 7.20L20.00 7.20A1.20 1.20 0 0 0 20.00 4.80L4.00 4.80A1.20 1.20 0 0 0 4.00 7.20ZM11.10 2.80H12.90A1.60 1.60 0 0 1 14.50 4.40V4.80A1.60 1.60 0 0 1 12.90 6.40H11.10A1.60 1.60 0 0 1 9.50 4.80V4.40A1.60 1.60 0 0 1 11.10 2.80Z\" fill=\"currentColor\" /></g></g></symbol><symbol id=\"ui-document\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-document-c3)\"><g clip-path=\"url(#ui-document-c2)\"><g clip-path=\"url(#ui-document-c1)\"><path d=\"M8.60 2.50H15.40A3.60 3.60 0 0 1 19.00 6.10V17.90A3.60 3.60 0 0 1 15.40 21.50H8.60A3.60 3.60 0 0 1 5.00 17.90V6.10A3.60 3.60 0 0 1 8.60 2.50Z\" fill=\"currentColor\" /></g></g></g></symbol><symbol id=\"ui-door\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-door-c1)\"><path d=\"M9.40 2.50H14.60A3.40 3.40 0 0 1 18.00 5.90V18.60A3.40 3.40 0 0 1 14.60 22.00H9.40A3.40 3.40 0 0 1 6.00 18.60V5.90A3.40 3.40 0 0 1 9.40 2.50Z\" fill=\"currentColor\" /></g></symbol><symbol id=\"ui-download\" viewBox=\"0 0 24 24\"><path d=\"M10.70 3.50L10.70 13.50A1.30 1.30 0 0 0 13.30 13.50L13.30 3.50A1.30 1.30 0 0 0 10.70 3.50ZM6.58 9.92L11.08 14.42A1.30 1.30 0 0 0 12.92 12.58L8.42 8.08A1.30 1.30 0 0 0 6.58 9.92ZM12.92 14.42L17.42 9.92A1.30 1.30 0 0 0 15.58 8.08L11.08 12.58A1.30 1.30 0 0 0 12.92 14.42ZM6.20 9.00a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0ZM10.70 13.50a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0ZM15.20 9.00a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0ZM5.60 17.00H18.40A1.60 1.60 0 0 1 20.00 18.60V18.60A1.60 1.60 0 0 1 18.40 20.20H5.60A1.60 1.60 0 0 1 4.00 18.60V18.60A1.60 1.60 0 0 1 5.60 17.00Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-edit\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-edit-c1)\"><path d=\"M8.13 19.13L18.13 9.13A2.30 2.30 0 0 0 14.87 5.87L4.87 15.87A2.30 2.30 0 0 0 8.13 19.13ZM4.32 20.90L4.19 20.92L4.06 20.93L3.93 20.92L3.81 20.90L3.68 20.85L3.57 20.80L3.46 20.72L3.36 20.64L3.28 20.54L3.20 20.43L3.15 20.32L3.10 20.19L3.08 20.07L3.07 19.94L3.08 19.81L3.10 19.68L3.83 16.99L3.87 16.87L3.93 16.75L4.00 16.64L4.08 16.55L4.18 16.46L4.29 16.39L4.40 16.33L4.53 16.29L4.65 16.26L4.78 16.25L4.91 16.26L5.04 16.29L5.16 16.33L5.28 16.39L5.39 16.46L5.48 16.55L7.45 18.52L7.54 18.61L7.61 18.72L7.67 18.84L7.71 18.96L7.74 19.09L7.75 19.22L7.74 19.35L7.71 19.47L7.67 19.60L7.61 19.71L7.54 19.82L7.45 19.92L7.36 20.00L7.25 20.07L7.13 20.13L7.01 20.17Z\" fill=\"currentColor\" /></g></symbol><symbol id=\"ui-eye\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-eye-c1)\"><path d=\"M2 12C4.6 7.2 8 5 12 5s7.4 2.2 10 7c-2.6 4.8-6 7-10 7S4.6 16.8 2 12Z\" fill=\"currentColor\" /></g></symbol><symbol id=\"ui-fill-down\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3.5v11.5\" /><path d=\"M7 10.5l5 5 5-5\" /><path d=\"M5 20.5h14\" /></g></symbol><symbol id=\"ui-filter\" viewBox=\"0 0 24 24\"><path d=\"M4.00 8.30L20.00 8.30A1.30 1.30 0 0 0 20.00 5.70L4.00 5.70A1.30 1.30 0 0 0 4.00 8.30ZM7.00 13.30L17.00 13.30A1.30 1.30 0 0 0 17.00 10.70L7.00 10.70A1.30 1.30 0 0 0 7.00 13.30ZM10.00 18.30L14.00 18.30A1.30 1.30 0 0 0 14.00 15.70L10.00 15.70A1.30 1.30 0 0 0 10.00 18.30Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-inbox\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-inbox-c1)\"><path d=\"M7.60 4.00H16.40A4.60 4.60 0 0 1 21.00 8.60V15.40A4.60 4.60 0 0 1 16.40 20.00H7.60A4.60 4.60 0 0 1 3.00 15.40V8.60A4.60 4.60 0 0 1 7.60 4.00Z\" fill=\"currentColor\" /></g></symbol><symbol id=\"ui-info\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-info-c2)\"><g clip-path=\"url(#ui-info-c1)\"><path d=\"M2.50 12.00a9.50 9.50 0 1 0 19.00 0a9.50 9.50 0 1 0 -19.00 0Z\" fill=\"currentColor\" /></g></g></symbol><symbol id=\"ui-link\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-link-c3)\"><g clip-path=\"url(#ui-link-c2)\"><g clip-path=\"url(#ui-link-c1)\"><path d=\"M6.50 8.00H9.50A4.00 4.00 0 0 1 13.50 12.00V12.00A4.00 4.00 0 0 1 9.50 16.00H6.50A4.00 4.00 0 0 1 2.50 12.00V12.00A4.00 4.00 0 0 1 6.50 8.00ZM14.50 8.00H17.50A4.00 4.00 0 0 1 21.50 12.00V12.00A4.00 4.00 0 0 1 17.50 16.00H14.50A4.00 4.00 0 0 1 10.50 12.00V12.00A4.00 4.00 0 0 1 14.50 8.00Z\" fill=\"currentColor\" /></g></g></g></symbol><symbol id=\"ui-lock\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-lock-c2)\"><g clip-path=\"url(#ui-lock-c1)\"><path d=\"M8.10 10.00H15.90A3.60 3.60 0 0 1 19.50 13.60V17.90A3.60 3.60 0 0 1 15.90 21.50H8.10A3.60 3.60 0 0 1 4.50 17.90V13.60A3.60 3.60 0 0 1 8.10 10.00ZM12.00 2.80H12.00A4.20 4.20 0 0 1 16.20 7.00V9.60A4.20 4.20 0 0 1 12.00 13.80H12.00A4.20 4.20 0 0 1 7.80 9.60V7.00A4.20 4.20 0 0 1 12.00 2.80Z\" fill=\"currentColor\" /></g></g></symbol><symbol id=\"ui-mail\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-mail-c5)\"><g clip-path=\"url(#ui-mail-c4)\"><g clip-path=\"url(#ui-mail-c3)\"><g clip-path=\"url(#ui-mail-c2)\"><g clip-path=\"url(#ui-mail-c1)\"><path d=\"M6.50 5.00H17.50A4.00 4.00 0 0 1 21.50 9.00V15.00A4.00 4.00 0 0 1 17.50 19.00H6.50A4.00 4.00 0 0 1 2.50 15.00V9.00A4.00 4.00 0 0 1 6.50 5.00Z\" fill=\"currentColor\" /></g></g></g></g></g></symbol><symbol id=\"ui-minus\" viewBox=\"0 0 24 24\"><path d=\"M5.00 13.30L19.00 13.30A1.30 1.30 0 0 0 19.00 10.70L5.00 10.70A1.30 1.30 0 0 0 5.00 13.30Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-mobile\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-mobile-c2)\"><g clip-path=\"url(#ui-mobile-c1)\"><path d=\"M10.00 2.00H14.00A4.00 4.00 0 0 1 18.00 6.00V18.00A4.00 4.00 0 0 1 14.00 22.00H10.00A4.00 4.00 0 0 1 6.00 18.00V6.00A4.00 4.00 0 0 1 10.00 2.00Z\" fill=\"currentColor\" /></g></g></symbol><symbol id=\"ui-moon\" viewBox=\"0 0 24 24\"><path d=\"M20.2 14.6A8.4 8.4 0 1 1 9.4 3.8A6.6 6.6 0 0 0 20.2 14.6Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-more\" viewBox=\"0 0 24 24\"><path d=\"M3.50 12.00a2.00 2.00 0 1 0 4.00 0a2.00 2.00 0 1 0 -4.00 0ZM10.00 12.00a2.00 2.00 0 1 0 4.00 0a2.00 2.00 0 1 0 -4.00 0ZM16.50 12.00a2.00 2.00 0 1 0 4.00 0a2.00 2.00 0 1 0 -4.00 0Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-people\" viewBox=\"0 0 24 24\"><path d=\"M5.40 8.00a3.60 3.60 0 1 0 7.20 0a3.60 3.60 0 1 0 -7.20 0ZM6.50 13.00H11.50A4.00 4.00 0 0 1 15.50 17.00V17.00A4.00 4.00 0 0 1 11.50 21.00H6.50A4.00 4.00 0 0 1 2.50 17.00V17.00A4.00 4.00 0 0 1 6.50 13.00ZM14.00 8.60a3.00 3.00 0 1 0 6.00 0a3.00 3.00 0 1 0 -6.00 0ZM16.90 13.60H18.10A3.70 3.70 0 0 1 21.80 17.30V17.30A3.70 3.70 0 0 1 18.10 21.00H16.90A3.70 3.70 0 0 1 13.20 17.30V17.30A3.70 3.70 0 0 1 16.90 13.60Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-photo\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-photo-c2)\"><g clip-path=\"url(#ui-photo-c1)\"><path d=\"M21.96 10.00L22.20 10.47L22.36 10.96L22.47 11.48L22.50 12.00L22.47 12.52L22.36 13.04L22.20 13.53L21.96 14.00L18.72 19.63L18.42 20.06L18.08 20.46L17.69 20.80L17.25 21.09L16.78 21.32L16.28 21.49L15.77 21.60L15.25 21.63L8.75 21.63L8.23 21.60L7.72 21.49L7.22 21.32L6.75 21.09L6.31 20.80L5.92 20.46L5.58 20.06L5.28 19.63L2.04 14.00L1.80 13.53L1.64 13.04L1.53 12.52L1.50 12.00L1.53 11.48L1.64 10.96L1.80 10.47L2.04 10.00L5.28 4.37L5.58 3.94L5.92 3.54L6.31 3.20L6.75 2.91L7.22 2.68L7.72 2.51L8.23 2.40L8.75 2.37L15.25 2.37L15.77 2.40L16.28 2.51L16.78 2.68L17.25 2.91L17.69 3.20L18.08 3.54L18.42 3.94L18.72 4.37Z\" fill=\"currentColor\" /></g></g></symbol><symbol id=\"ui-pin\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-pin-c1)\"><path d=\"M9.57 2.51L9.91 2.21L10.28 1.96L10.69 1.76L11.11 1.62L11.55 1.53L12.00 1.50L12.45 1.53L12.89 1.62L13.31 1.76L13.72 1.96L14.09 2.21L14.43 2.51L19.99 8.07L20.29 8.41L20.54 8.78L20.74 9.19L20.88 9.61L20.97 10.05L21.00 10.50L20.97 10.95L20.88 11.39L20.74 11.81L20.54 12.22L20.29 12.59L19.99 12.93L14.43 18.49L14.09 18.79L13.72 19.04L13.31 19.24L12.89 19.38L12.45 19.47L12.00 19.50L11.55 19.47L11.11 19.38L10.69 19.24L10.28 19.04L9.91 18.79L9.57 18.49L4.01 12.93L3.71 12.59L3.46 12.22L3.26 11.81L3.12 11.39L3.03 10.95L3.00 10.50L3.03 10.05L3.12 9.61L3.26 9.19L3.46 8.78L3.71 8.41L4.01 8.07ZM13.06 21.99L12.97 22.12L12.86 22.24L12.74 22.35L12.61 22.44L12.47 22.51L12.32 22.56L12.16 22.59L12.00 22.60L11.84 22.59L11.68 22.56L11.53 22.51L11.39 22.44L11.26 22.35L11.14 22.24L11.03 22.12L10.94 21.99L9.23 19.02L9.16 18.88L9.11 18.73L9.08 18.57L9.07 18.41L9.08 18.25L9.11 18.09L9.16 17.94L9.23 17.80L9.32 17.67L9.42 17.55L9.54 17.44L9.68 17.35L9.82 17.28L9.97 17.23L10.13 17.20L10.29 17.19L13.71 17.19L13.87 17.20L14.03 17.23L14.18 17.28L14.32 17.35L14.46 17.44L14.58 17.55L14.68 17.67L14.77 17.80L14.84 17.94L14.89 18.09L14.92 18.25L14.93 18.41L14.92 18.57L14.89 18.73L14.84 18.88L14.77 19.02Z\" fill=\"currentColor\" /></g></symbol><symbol id=\"ui-plus\" viewBox=\"0 0 24 24\"><path d=\"M10.70 5.00L10.70 19.00A1.30 1.30 0 0 0 13.30 19.00L13.30 5.00A1.30 1.30 0 0 0 10.70 5.00ZM5.00 13.30L19.00 13.30A1.30 1.30 0 0 0 19.00 10.70L5.00 10.70A1.30 1.30 0 0 0 5.00 13.30Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-replay\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4.6 12a7.4 7.4 0 1 0 2.2-5.3\" /><path d=\"M4.3 3.6v4.6h4.6\" /></g></symbol><symbol id=\"ui-send\" viewBox=\"0 0 24 24\"><path d=\"M3.4 11.2l16.4-7.3c.8-.4 1.6.4 1.2 1.2l-7.3 16.4c-.4.9-1.7.8-1.9-.2l-1.5-6.4-6.4-1.5c-1-.2-1.1-1.5-.2-1.9Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-sort\" viewBox=\"0 0 24 24\"><path d=\"M6.80 5.00L6.80 19.00A1.20 1.20 0 0 0 9.20 19.00L9.20 5.00A1.20 1.20 0 0 0 6.80 5.00ZM5.65 9.05L8.85 5.85A1.20 1.20 0 0 0 7.15 4.15L3.95 7.35A1.20 1.20 0 0 0 5.65 9.05ZM7.15 5.85L10.35 9.05A1.20 1.20 0 0 0 12.05 7.35L8.85 4.15A1.20 1.20 0 0 0 7.15 5.85ZM3.60 8.20a1.20 1.20 0 1 0 2.40 0a1.20 1.20 0 1 0 -2.40 0ZM6.80 5.00a1.20 1.20 0 1 0 2.40 0a1.20 1.20 0 1 0 -2.40 0ZM10.00 8.20a1.20 1.20 0 1 0 2.40 0a1.20 1.20 0 1 0 -2.40 0ZM14.80 5.00L14.80 19.00A1.20 1.20 0 0 0 17.20 19.00L17.20 5.00A1.20 1.20 0 0 0 14.80 5.00ZM11.95 16.65L15.15 19.85A1.20 1.20 0 0 0 16.85 18.15L13.65 14.95A1.20 1.20 0 0 0 11.95 16.65ZM16.85 19.85L20.05 16.65A1.20 1.20 0 0 0 18.35 14.95L15.15 18.15A1.20 1.20 0 0 0 16.85 19.85ZM11.60 15.80a1.20 1.20 0 1 0 2.40 0a1.20 1.20 0 1 0 -2.40 0ZM14.80 19.00a1.20 1.20 0 1 0 2.40 0a1.20 1.20 0 1 0 -2.40 0ZM18.00 15.80a1.20 1.20 0 1 0 2.40 0a1.20 1.20 0 1 0 -2.40 0Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-sun\" viewBox=\"0 0 24 24\"><path d=\"M12 7.6A4.4 4.4 0 1 0 12 16.4A4.4 4.4 0 1 0 12 7.6ZM19.40 13.10L21.40 13.10A1.10 1.10 0 0 0 21.40 10.90L19.40 10.90A1.10 1.10 0 0 0 19.40 13.10ZM16.45 18.01L17.87 19.42A1.10 1.10 0 0 0 19.42 17.87L18.01 16.45A1.10 1.10 0 0 0 16.45 18.01ZM10.90 19.40L10.90 21.40A1.10 1.10 0 0 0 13.10 21.40L13.10 19.40A1.10 1.10 0 0 0 10.90 19.40ZM5.99 16.45L4.58 17.87A1.10 1.10 0 0 0 6.13 19.42L7.55 18.01A1.10 1.10 0 0 0 5.99 16.45ZM4.60 10.90L2.60 10.90A1.10 1.10 0 0 0 2.60 13.10L4.60 13.10A1.10 1.10 0 0 0 4.60 10.90ZM7.55 5.99L6.13 4.58A1.10 1.10 0 0 0 4.58 6.13L5.99 7.55A1.10 1.10 0 0 0 7.55 5.99ZM13.10 4.60L13.10 2.60A1.10 1.10 0 0 0 10.90 2.60L10.90 4.60A1.10 1.10 0 0 0 13.10 4.60ZM18.01 7.55L19.42 6.13A1.10 1.10 0 0 0 17.87 4.58L16.45 5.99A1.10 1.10 0 0 0 18.01 7.55Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-upload\" viewBox=\"0 0 24 24\"><path d=\"M10.70 4.50L10.70 14.50A1.30 1.30 0 0 0 13.30 14.50L13.30 4.50A1.30 1.30 0 0 0 10.70 4.50ZM8.42 9.92L12.92 5.42A1.30 1.30 0 0 0 11.08 3.58L6.58 8.08A1.30 1.30 0 0 0 8.42 9.92ZM11.08 5.42L15.58 9.92A1.30 1.30 0 0 0 17.42 8.08L12.92 3.58A1.30 1.30 0 0 0 11.08 5.42ZM6.20 9.00a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0ZM10.70 4.50a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0ZM15.20 9.00a1.30 1.30 0 1 0 2.60 0a1.30 1.30 0 1 0 -2.60 0ZM5.60 17.00H18.40A1.60 1.60 0 0 1 20.00 18.60V18.60A1.60 1.60 0 0 1 18.40 20.20H5.60A1.60 1.60 0 0 1 4.00 18.60V18.60A1.60 1.60 0 0 1 5.60 17.00Z\" fill=\"currentColor\" /></symbol><symbol id=\"ui-vendor\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-vendor-c3)\"><g clip-path=\"url(#ui-vendor-c2)\"><g clip-path=\"url(#ui-vendor-c1)\"><path d=\"M5.00 6.00H11.00A3.00 3.00 0 0 1 14.00 9.00V13.50A3.00 3.00 0 0 1 11.00 16.50H5.00A3.00 3.00 0 0 1 2.00 13.50V9.00A3.00 3.00 0 0 1 5.00 6.00ZM15.00 9.00H18.50A3.00 3.00 0 0 1 21.50 12.00V13.50A3.00 3.00 0 0 1 18.50 16.50H15.00A3.00 3.00 0 0 1 12.00 13.50V12.00A3.00 3.00 0 0 1 15.00 9.00ZM4.40 17.50a2.60 2.60 0 1 0 5.20 0a2.60 2.60 0 1 0 -5.20 0ZM14.40 17.50a2.60 2.60 0 1 0 5.20 0a2.60 2.60 0 1 0 -5.20 0Z\" fill=\"currentColor\" /></g></g></g></symbol><symbol id=\"ui-warning\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-warning-c2)\"><g clip-path=\"url(#ui-warning-c1)\"><path d=\"M8.20 3.99L8.52 3.52L8.90 3.08L9.33 2.71L9.81 2.39L10.32 2.13L10.87 1.95L11.43 1.84L12.00 1.80L12.57 1.84L13.13 1.95L13.68 2.13L14.19 2.39L14.67 2.71L15.10 3.08L15.48 3.52L15.80 3.99L21.96 14.67L22.21 15.18L22.40 15.72L22.51 16.29L22.55 16.86L22.51 17.43L22.40 17.99L22.21 18.54L21.96 19.05L21.64 19.53L21.26 19.96L20.83 20.34L20.35 20.66L19.84 20.91L19.30 21.09L18.73 21.20L18.16 21.24L5.84 21.24L5.27 21.20L4.70 21.09L4.16 20.91L3.65 20.66L3.17 20.34L2.74 19.96L2.36 19.53L2.04 19.05L1.79 18.54L1.60 17.99L1.49 17.43L1.45 16.86L1.49 16.29L1.60 15.72L1.79 15.18L2.04 14.67Z\" fill=\"currentColor\" /></g></g></symbol><symbol id=\"ui-worker\" viewBox=\"0 0 24 24\"><g clip-path=\"url(#ui-worker-c1)\"><path d=\"M9.90 2.40H14.10A2.30 2.30 0 0 1 16.40 4.70V4.70A2.30 2.30 0 0 1 14.10 7.00H9.90A2.30 2.30 0 0 1 7.60 4.70V4.70A2.30 2.30 0 0 1 9.90 2.40ZM5.60 7.75L18.40 7.75A0.95 0.95 0 0 0 18.40 5.85L5.60 5.85A0.95 0.95 0 0 0 5.60 7.75ZM8.80 10.60a3.20 3.20 0 1 0 6.40 0a3.20 3.20 0 1 0 -6.40 0ZM8.00 15.00H16.00A3.50 3.50 0 0 1 19.50 18.50V18.50A3.50 3.50 0 0 1 16.00 22.00H8.00A3.50 3.50 0 0 1 4.50 18.50V18.50A3.50 3.50 0 0 1 8.00 15.00Z\" fill=\"currentColor\" /></g></symbol>"/*@icons-end*/;
  function icons() {
    if (!ICONS || document.getElementById("apd-icons") || document.getElementById("ap-home")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `<svg id="apd-icons" xmlns="${NS}" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false">${ICONS}</svg>`;
    document.body.prepend(wrap.firstElementChild);
  }
  // The one [data-icon] filler for the kit (other modules call APShapes.fillIcons): it makes sure the sprite is on the
  // page, skips a node that already holds an svg.apd-icon (whoever put it there) and marks what it filled.
  function fillIcons(root) {
    icons();
    (root || document).querySelectorAll("[data-icon]").forEach(n => {
      if (n.querySelector(":scope > svg.apd-icon")) { n.dataset.iconFilled = n.dataset.iconFilled || "external"; return; }
      const svg = el("svg", { class: "apd-icon", "aria-hidden": "true", focusable: "false" });
      el("use", { href: "#" + n.dataset.icon }, svg);
      n.prepend(svg);
      n.dataset.iconFilled = "shapes";
    });
  }

  /* ---------- spacing guides (hairlines, fjord): margins, columns, gaps, padding, baselines ---------- */
  function rel(node, pr, k) { const r = node.getBoundingClientRect(); return { x: (r.left - pr.left) / k, y: (r.top - pr.top) / k, w: r.width / k, h: r.height / k }; }
  function baseline(node, pr, k) {
    // An empty inline-block sits on the first line's baseline: its bottom edge is the baseline.
    const probe = document.createElement("span"); probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
    const target = node.firstChild && node.firstChild.nodeType === 1 && getComputedStyle(node.firstChild).display !== "inline" ? node.firstElementChild : node;
    target.insertBefore(probe, target.firstChild);
    const y = (probe.getBoundingClientRect().bottom - pr.top) / k;
    probe.remove();
    return y;
  }
  function guides(page) {
    if (!page.offsetWidth) return;
    page.querySelectorAll(":scope > .apd-guides").forEach(n => n.remove());
    page.classList.add("has-guides");
    const dimY = page.dataset.guideDimY != null ? +page.dataset.guideDimY : null;
    const want = (page.dataset.guides || "").split(/\s+/), pr = page.getBoundingClientRect(), k = pr.width / page.offsetWidth;
    const W = page.offsetWidth, H = page.offsetHeight, cs = getComputedStyle(page);
    const m = { l: parseFloat(cs.paddingLeft), r: parseFloat(cs.paddingRight), t: parseFloat(cs.paddingTop), b: parseFloat(cs.paddingBottom) };
    // Two layers: columns, the frame and gap bands sit under the content (they never tint text); padding hatches,
    // baselines and value tags sit over it, where they mark empty space or a line.
    const o = document.createElement("div"); o.className = "apd-guides"; o.setAttribute("aria-hidden", "true");
    const over = document.createElement("div"); over.className = "apd-guides is-over"; over.setAttribute("aria-hidden", "true");
    const OVER = /apd-guide-(tag|pad|base)/;
    const add = (cls, x, y, w, h, txt) => { const d = document.createElement(txt != null ? "span" : "i"); d.className = cls; Object.assign(d.style, { left: x + "px", top: y + "px", width: w != null ? w + "px" : "", height: h != null ? h + "px" : "" }); if (txt != null) d.textContent = txt; (OVER.test(cls) ? over : o).appendChild(d); return d; };
    const tag = (x, y, txt, cls) => { const t = add("apd-guide-tag" + (cls ? " " + cls : ""), x, y, null, null, txt); return t; };
    if (want.includes("cols")) {
      const grid = page.querySelector("[data-guide-grid]"), gap = grid ? parseFloat(getComputedStyle(grid).columnGap) : parseFloat(getComputedStyle(page).getPropertyValue("--sp-block")) || 48;
      const cw = (W - m.l - m.r - gap * 11) / 12;
      // The columns stop above the page's foot, so no guide crosses its small text.
      const foot = page.querySelector(":scope > footer, :scope > .apd-foot");
      const colH = foot && foot.offsetHeight ? Math.max(0, (foot.getBoundingClientRect().top - pr.top) / k - 16) : H;
      for (let i = 0; i < 12; i++) add("apd-guide-col", m.l + i * (cw + gap), 0, cw, colH);
      tag(m.l + cw + gap / 2, H - m.b + 14, `12 columns · gutter ${Math.round(gap)}`, "is-under");
    }
    if (want.includes("margin")) {
      add("apd-guide-frame", m.l, m.t, W - m.l - m.r, H - m.t - m.b);
      const yy = dimY != null ? dimY : H / 2;
      add("apd-guide-dim is-h", 0, yy, m.l, 1); tag(m.l / 2, yy, String(Math.round(m.l)), "is-mid");
      add("apd-guide-dim is-h", W - m.r, yy, m.r, 1); tag(W - m.r / 2, yy, String(Math.round(m.r)), "is-mid");
      add("apd-guide-dim is-v", W / 2, 0, 1, m.t); tag(W / 2, m.t / 2, String(Math.round(m.t)), "is-mid");
    }
    page.querySelectorAll("[data-guide-gap]").forEach(node => {
      const prev = node.previousElementSibling; if (!prev) return;
      const a = rel(prev, pr, k), b = rel(node, pr, k), y0 = a.y + a.h, gap = b.y - y0;
      if (gap <= 0) return;
      add("apd-guide-band", m.l, y0, W - m.l - m.r, gap); tag(W - m.r - 4, y0 + gap / 2, (node.dataset.guideGap || "") + Math.round(gap), "is-end");
    });
    page.querySelectorAll("[data-guide-hgap]").forEach(node => {
      const a = rel(node.children[0], pr, k), b = rel(node.children[1], pr, k), x0 = a.x + a.w, gap = b.x - x0;
      if (gap <= 0) return;
      add("apd-guide-band is-v", x0, a.y, gap, a.h); tag(x0 + gap / 2, a.y + a.h / 2, String(Math.round(gap)), "is-mid");
    });
    page.querySelectorAll("[data-guide-pad]").forEach(node => {
      const r = rel(node, pr, k), c = getComputedStyle(node), pl = parseFloat(c.paddingLeft), pt = parseFloat(c.paddingTop);
      add("apd-guide-pad", r.x, r.y, pl, r.h); add("apd-guide-pad", r.x + pl, r.y, r.w - pl, pt);
      tag(r.x + pl / 2, r.y + pt / 2, String(Math.round(pt)), "is-mid");
    });
    const groups = {};
    page.querySelectorAll("[data-guide-base]").forEach(node => { (groups[node.dataset.guideBase] = groups[node.dataset.guideBase] || []).push(node); });
    Object.keys(groups).forEach(gk => {
      const ys = groups[gk].map(n => baseline(n, pr, k)), xs = groups[gk].map(n => rel(n, pr, k));
      const x0 = Math.min(...xs.map(r => r.x)) - 12, x1 = Math.max(...xs.map(r => r.x + r.w)) + 12, y = ys[0];
      const ok = ys.every(v => Math.abs(v - y) < .75);
      add("apd-guide-base" + (ok ? "" : " is-off"), x0, y, x1 - x0, 1);
      const where = groups[gk][0].dataset.guideTag || "below";
      tag(x1 - 12, y, ok ? "lines up" : "off by " + Math.round(Math.max(...ys) - Math.min(...ys)) + " px", "is-end-" + where);
    });
    page.prepend(o); page.appendChild(over);
    if (want.includes("space")) {
      // Negative space, measured: the share of the area inside the frame that no text, image, shape or card covers
      // (a 16 px grid over the boxes of leaf elements), tagged under the frame.
      const cell = 16, cols = Math.ceil(W / cell), rows = Math.ceil(H / cell), hit = new Uint8Array(cols * rows);
      page.querySelectorAll("h1,h2,h3,p,span,b,li,img,svg,.apd-card,.apd-shape").forEach(n => {
        if (n.closest(".apd-guides, .apd-sample, .apd-ground")) return;
        const leaf = /^(IMG|svg)$/i.test(n.tagName) || n.classList.contains("apd-card") || n.classList.contains("apd-shape") || !n.children.length;
        if (!leaf || (n.parentElement && n.parentElement.closest(".apd-shape, .apd-card") && !n.classList.contains("apd-card"))) return;
        const r = rel(n, pr, k); if (!r.w || !r.h) return;
        for (let y = Math.max(0, Math.floor(r.y / cell)); y < Math.min(rows, Math.ceil((r.y + r.h) / cell)); y++)
          for (let x = Math.max(0, Math.floor(r.x / cell)); x < Math.min(cols, Math.ceil((r.x + r.w) / cell)); x++) hit[y * cols + x] = 1;
      });
      let inside = 0, used = 0;
      for (let y = Math.floor(m.t / cell); y < Math.ceil((H - m.b) / cell); y++) for (let x = Math.floor(m.l / cell); x < Math.ceil((W - m.r) / cell); x++) { inside++; used += hit[y * cols + x]; }
      const empty = Math.round(100 * (1 - used / Math.max(1, inside)));
      page.dataset.space = empty;
      const t = document.createElement("span"); t.className = "apd-guide-tag is-end-above"; t.textContent = `empty ${empty}\u00a0%`;
      Object.assign(t.style, { left: (W - m.r - 8) + "px", top: (H - m.b) + "px" }); over.appendChild(t);
    }
  }
  function allGuides() { document.querySelectorAll("[data-guides]").forEach(guides); }

  /* ---------- boot ---------- */
  function drawAll(root) {
    root = root || document;
    root.querySelectorAll(".apd-grow[data-max]").forEach(sizeGrowth);
    root.querySelectorAll(".apd-shape").forEach(box => { if (box.offsetWidth || !box.dataset.drawn) draw(box); });
  }
  function redrawVisible() {
    document.querySelectorAll(".apd-shape").forEach(box => {
      const w = box.offsetWidth, comp = box.dataset.style === "family" || box.dataset.style === "field";
      if (w && (comp ? w + "x" + box.offsetHeight : String(w)) !== box.dataset.drawn) draw(box);
    });
    allGuides();
  }
  function boot() {
    icons(); fillIcons(); fillPaths(); drawAll();
    const later = () => requestAnimationFrame(() => { redrawVisible(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later); else setTimeout(later, 300);
    window.addEventListener("resize", () => requestAnimationFrame(redrawVisible));
    window.addEventListener("beforeprint", redrawVisible);
    // A shape or guided page drawn while hidden (deck mode shows one slide at a time) or before fonts settled is drawn
    // again as soon as its box changes size: ResizeObserver reports the change before the next paint.
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(entries => entries.forEach(e => {
        const n = e.target;
        if (n.classList.contains("apd-shape")) { const w = n.offsetWidth, comp = n.dataset.style === "family" || n.dataset.style === "field"; if (w && (comp ? w + "x" + n.offsetHeight : String(w)) !== n.dataset.drawn) draw(n); }
        else if (n.hasAttribute("data-guides") && n.offsetWidth) guides(n);
      }));
      document.querySelectorAll(".apd-shape, [data-guides]").forEach(n => ro.observe(n));
    }
    const mo = new MutationObserver(() => requestAnimationFrame(redrawVisible));
    document.querySelectorAll(".apd, .apd-page").forEach(n => mo.observe(n, { attributes: true, attributeFilter: ["class", "data-format"] }));
  }
  window.APShapes = { path: ngonD, points: ngonPts, radiusAt, rotFor, extent, hextent, oklabStops, fillPaths, centreShift, apothem, area, door: doorD, draw, drawAll, guides: allGuides, icons, fillIcons, STOPS, LIGHT };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
