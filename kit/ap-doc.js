/* Autoproperty documents · the page script (DESIGN.md § 2–3, 8–9).
   - Sets @page for the document's format; on screen, fits pages to the window (never reflows them).
   - Screen toolbar: format (sizes the document allows), theme, and for decks one slide or all slides.
   - Numbers pages ("3 of 8"), draws the brand sprite (lockup, the logo mark, family shapes), patterns and QR codes.
   Markup: <main class="apd" data-format="a4" data-formats="a4 a5 a3 letter"> <section class="apd-page">… */
(function () {
  "use strict";
  const PAGE = { a4: "210mm 297mm", a5: "148mm 210mm", a3: "297mm 420mm", letter: "8.5in 11in", "a4-land": "297mm 210mm", slide: "1920px 1080px", card: "1200px 630px" };
  const NAME = { a4: "A4", a5: "A5", a3: "A3", letter: "Letter", "a4-land": "A4 landscape", slide: "16:9", card: "Link card" };
  const RC = 0.3813, D2R = Math.PI / 180;

  // The lockup ("Auto" in Unbounded Bold, "property" in Inter Bold) as drawn in the brand kit; ink is currentColor,
  // the knob takes --lk-knob so it reads on paper, on Ember and in dark.
  const LOCKUP = "<g transform=\"translate(0 -158.75) scale(0.44330)\"><path fill=\"currentColor\" d=\"M194 0H493A194 194 0 0 1 493 388H194A194 194 0 0 1 194 0Z\"/><path fill=\"var(--lk-knob, #F8F2ED)\" d=\"M450.505 64.354 A56.985 56.985 0 0 1 517.495 64.354L605.510 128.300 A56.985 56.985 0 0 1 626.211 192.012L592.592 295.479 A56.985 56.985 0 0 1 538.396 334.855L429.604 334.855 A56.985 56.985 0 0 1 375.408 295.479L341.789 192.012 A56.985 56.985 0 0 1 362.490 128.300 Z\"/><rect x=\"471\" y=\"219\" width=\"34\" height=\"80\" rx=\"17\" fill=\"currentColor\"/></g><path fill=\"currentColor\" d=\"M528.70-27.53L429.85-27.53L429.85-59.47L528.70-59.47L528.70-27.53ZM453.94-143.41L506.14-143.41L571.34 0L529.08 0L474.40-126.58L485.87-126.58L430.99 0L388.74 0L453.94-143.41ZM623.54 3.06L623.54 3.06Q608.24 3.06 597.44-3.25Q586.64-9.56 580.90-21.13Q575.17-32.70 575.17-48.18L575.17-48.18L575.17-109.18L614.17-109.18L614.17-53.73Q614.17-41.68 620.10-35.18Q626.03-28.68 637.12-28.68L637.12-28.68Q645.34-28.68 650.88-32.03Q656.43-35.37 659.49-41.68Q662.55-47.99 662.55-56.79L662.55-56.79L674.59-50.48Q672.49-33.08 665.13-21.13Q657.77-9.18 647.06-3.06Q636.35 3.06 623.54 3.06ZM708.63 0L669.62 0L662.55-43.79L662.55-109.18L701.55-109.18L701.55-37.67L708.63 0ZM731.96-80.31L709.78-80.31L709.78-97.32L731.96-106.31L748.78-138.63L770.96-138.63L770.96-109.18L816.85-109.18L816.85-80.31L770.96-80.31L770.96-48.18Q770.96-36.33 775.74-31.55Q780.52-26.77 793.14-26.77L793.14-26.77Q801.17-26.77 807.39-28.20Q813.60-29.64 818.76-31.93L818.76-31.93L818.76-2.49Q813.03-0.38 803.66 1.34Q794.29 3.06 784.35 3.06L784.35 3.06Q766.18 3.06 754.61-2.49Q743.05-8.03 737.50-18.45Q731.96-28.87 731.96-42.83L731.96-42.83L731.96-80.31ZM893.91 3.06L893.91 3.06Q872.88 3.06 857.20-4.11Q841.52-11.28 832.72-24.38Q823.93-37.48 823.93-54.49L823.93-54.49Q823.93-71.89 832.72-84.90Q841.52-97.90 857.20-105.16Q872.88-112.43 893.91-112.43L893.91-112.43Q914.75-112.43 930.53-105.16Q946.30-97.90 955.10-84.90Q963.89-71.89 963.89-54.49L963.89-54.49Q963.89-37.48 955.10-24.38Q946.30-11.28 930.53-4.11Q914.75 3.06 893.91 3.06ZM893.91-25.81L893.91-25.81Q903.47-25.81 910.26-29.25Q917.04-32.70 920.68-39.20Q924.31-45.70 924.31-54.49L924.31-54.49Q924.31-63.67 920.68-70.08Q917.04-76.48 910.26-79.92Q903.47-83.37 893.91-83.37L893.91-83.37Q884.35-83.37 877.46-79.92Q870.58-76.48 866.95-70.08Q863.32-63.67 863.32-54.69L863.32-54.69Q863.32-45.70 866.95-39.20Q870.58-32.70 877.46-29.25Q884.35-25.81 893.91-25.81ZM1005.69 40.82L976.39 40.82L976.39-109.18L1005.20-109.18L1005.20-90.82L1006.57-90.82Q1008.62-95.12 1012.38-99.71Q1016.14-104.30 1022.29-107.42Q1028.44-110.55 1037.72-110.55L1037.72-110.55Q1049.83-110.55 1059.89-104.30Q1069.95-98.05 1075.95-85.55Q1081.96-73.05 1081.96-54.39L1081.96-54.39Q1081.96-36.23 1076.10-23.68Q1070.24-11.13 1060.18-4.64Q1050.12 1.86 1037.52 1.86L1037.52 1.86Q1028.64 1.86 1022.48-1.17Q1016.33-4.20 1012.47-8.64Q1008.62-13.09 1006.57-17.48L1006.57-17.48L1005.69-17.48L1005.69 40.82ZM1028.54-21.68L1028.54-21.68Q1036.16-21.68 1041.38-25.88Q1046.61-30.08 1049.29-37.50Q1051.98-44.92 1051.98-54.49L1051.98-54.49Q1051.98-64.06 1049.29-71.39Q1046.61-78.71 1041.43-82.91Q1036.25-87.11 1028.54-87.11L1028.54-87.11Q1021.02-87.11 1015.75-83.06Q1010.47-79.00 1007.74-71.73Q1005.00-64.45 1005.00-54.49L1005.00-54.49Q1005.00-44.63 1007.79-37.26Q1010.57-29.88 1015.84-25.78Q1021.12-21.68 1028.54-21.68ZM1122.76 0L1093.47 0L1093.47-109.18L1121.79-109.18L1121.79-90.14L1122.96-90.14Q1125.98-100.29 1133.06-105.47Q1140.14-110.64 1149.32-110.64L1149.32-110.64Q1151.57-110.64 1154.21-110.40Q1156.84-110.16 1158.80-109.67L1158.80-109.67L1158.80-83.50Q1156.84-84.18 1153.13-84.57Q1149.42-84.96 1146.10-84.96L1146.10-84.96Q1139.46-84.96 1134.09-82.08Q1128.72-79.20 1125.74-74.07Q1122.76-68.95 1122.76-62.11L1122.76-62.11L1122.76 0ZM1214.74 2.15L1214.74 2.15Q1198.33 2.15 1186.32-4.93Q1174.31-12.01 1167.81-24.66Q1161.32-37.30 1161.32-54.10L1161.32-54.10Q1161.32-71.09 1167.81-83.74Q1174.31-96.39 1186.32-103.47Q1198.33-110.55 1214.74-110.55L1214.74-110.55Q1231.24-110.55 1243.21-103.47Q1255.17-96.39 1261.66-83.74Q1268.16-71.09 1268.16-54.10L1268.16-54.10Q1268.16-37.30 1261.66-24.66Q1255.17-12.01 1243.21-4.93Q1231.24 2.15 1214.74 2.15ZM1214.74-20.90L1214.74-20.90Q1222.55-20.90 1227.82-25.24Q1233.10-29.59 1235.73-37.16Q1238.37-44.73 1238.37-54.20L1238.37-54.20Q1238.37-63.87 1235.73-71.39Q1233.10-78.91 1227.82-83.20Q1222.55-87.50 1214.74-87.50L1214.74-87.50Q1206.93-87.50 1201.70-83.20Q1196.48-78.91 1193.84-71.39Q1191.20-63.87 1191.20-54.20L1191.20-54.20Q1191.20-44.73 1193.84-37.16Q1196.48-29.59 1201.70-25.24Q1206.93-20.90 1214.74-20.90ZM1308.86 40.82L1279.57 40.82L1279.57-109.18L1308.38-109.18L1308.38-90.82L1309.74-90.82Q1311.79-95.12 1315.55-99.71Q1319.31-104.30 1325.47-107.42Q1331.62-110.55 1340.89-110.55L1340.89-110.55Q1353.00-110.55 1363.06-104.30Q1373.12-98.05 1379.13-85.55Q1385.13-73.05 1385.13-54.39L1385.13-54.39Q1385.13-36.23 1379.27-23.68Q1373.41-11.13 1363.36-4.64Q1353.30 1.86 1340.70 1.86L1340.70 1.86Q1331.81 1.86 1325.66-1.17Q1319.51-4.20 1315.65-8.64Q1311.79-13.09 1309.74-17.48L1309.74-17.48L1308.86-17.48L1308.86 40.82ZM1331.72-21.68L1331.72-21.68Q1339.33-21.68 1344.56-25.88Q1349.78-30.08 1352.47-37.50Q1355.15-44.92 1355.15-54.49L1355.15-54.49Q1355.15-64.06 1352.47-71.39Q1349.78-78.71 1344.61-82.91Q1339.43-87.11 1331.72-87.11L1331.72-87.11Q1324.20-87.11 1318.92-83.06Q1313.65-79.00 1310.91-71.73Q1308.18-64.45 1308.18-54.49L1308.18-54.49Q1308.18-44.63 1310.96-37.26Q1313.75-29.88 1319.02-25.78Q1324.29-21.68 1331.72-21.68ZM1445.96 2.15L1445.96 2.15Q1429.26 2.15 1417.15-4.69Q1405.04-11.52 1398.55-24.12Q1392.05-36.72 1392.05-54.00L1392.05-54.00Q1392.05-70.90 1398.50-83.59Q1404.94-96.29 1416.76-103.42Q1428.57-110.55 1444.49-110.55L1444.49-110.55Q1455.23-110.55 1464.51-107.13Q1473.79-103.71 1480.82-96.83Q1487.85-89.94 1491.81-79.59Q1495.76-69.24 1495.76-55.18L1495.76-55.18L1495.76-46.97L1404.06-46.97L1404.06-65.33L1481.41-65.33L1467.73-60.45Q1467.73-68.95 1465.15-75.24Q1462.56-81.54 1457.43-85.01Q1452.30-88.48 1444.79-88.48L1444.79-88.48Q1437.17-88.48 1431.85-84.96Q1426.52-81.45 1423.79-75.44Q1421.05-69.43 1421.05-61.72L1421.05-61.72L1421.05-48.73Q1421.05-39.26 1424.23-32.81Q1427.40-26.37 1433.12-23.14Q1438.83-19.92 1446.45-19.92L1446.45-19.92Q1451.62-19.92 1455.82-21.39Q1460.02-22.85 1463.00-25.73Q1465.98-28.61 1467.54-32.81L1467.54-32.81L1494.10-27.83Q1491.47-18.85 1484.92-12.06Q1478.38-5.27 1468.56-1.56Q1458.75 2.15 1445.96 2.15ZM1536.08 0L1506.78 0L1506.78-109.18L1535.10-109.18L1535.10-90.14L1536.27-90.14Q1539.30-100.29 1546.38-105.47Q1553.46-110.64 1562.64-110.64L1562.64-110.64Q1564.89-110.64 1567.52-110.40Q1570.16-110.16 1572.11-109.67L1572.11-109.67L1572.11-83.50Q1570.16-84.18 1566.45-84.57Q1562.74-84.96 1559.42-84.96L1559.42-84.96Q1552.78-84.96 1547.41-82.08Q1542.04-79.20 1539.06-74.07Q1536.08-68.95 1536.08-62.11L1536.08-62.11L1536.08 0ZM1568.68-109.18L1633.43-109.18L1633.43-86.82L1568.68-86.82L1568.68-109.18ZM1583.72-29.39L1583.72-135.16L1613.02-135.16L1613.02-31.93Q1613.02-26.76 1615.31-24.27Q1617.61-21.78 1622.98-21.78L1622.98-21.78Q1624.64-21.78 1627.66-22.22Q1630.69-22.66 1632.25-23.05L1632.25-23.05L1636.45-1.07Q1631.57 0.39 1626.74 0.98Q1621.90 1.56 1617.51 1.56L1617.51 1.56Q1601.10 1.56 1592.41-6.45Q1583.72-14.45 1583.72-29.39L1583.72-29.39ZM1642.69 38.67L1642.69 38.67L1649.43 16.60L1653.04 17.48Q1658.90 19.04 1663.49 18.36Q1668.08 17.68 1670.86 14.65Q1673.64 11.62 1674.23 6.15L1674.23 6.15L1675.01 0.29L1634.00-109.18L1665.15-109.18L1683.51-52.54Q1686.83-41.80 1688.93-31.05Q1691.03-20.31 1693.76-8.59L1693.76-8.59L1686.93-8.59Q1689.56-20.31 1692.20-31.10Q1694.84-41.89 1698.35-52.54L1698.35-52.54L1717.49-109.18L1748.25-109.18L1701.87 12.89Q1698.55 21.68 1693.37 28.13Q1688.20 34.57 1680.48 38.09Q1672.77 41.60 1661.83 41.60L1661.83 41.60Q1655.97 41.60 1650.89 40.77Q1645.81 39.94 1642.69 38.67Z\"/>";

  // The logo mark: the switch, a pill with the home pentagon as its knob ("The logo is the turning on", founder 2 Nov
  // 2026; redesign stack REF-11). One ink as in logo-one-colour-black.svg: the knob is cut out so the ground shows
  // through, the door is ink. 687 × 388, wider than tall. The pentagon with its door alone is a tag, never the logo.
  const MARK = "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M194 0H493A194 194 0 0 1 493 388H194A194 194 0 0 1 194 0Z M450.505 64.354 A56.985 56.985 0 0 1 517.495 64.354L605.510 128.300 A56.985 56.985 0 0 1 626.211 192.012L592.592 295.479 A56.985 56.985 0 0 1 538.396 334.855L429.604 334.855 A56.985 56.985 0 0 1 375.408 295.479L341.789 192.012 A56.985 56.985 0 0 1 362.490 128.300 Z\"/><rect x=\"471\" y=\"219\" width=\"34\" height=\"80\" rx=\"17\" fill=\"currentColor\"/>";

  function ngon(n, cx, cy, Rout, rot) {
    if (n < 3) return `M${cx - Rout} ${cy}a${Rout} ${Rout} 0 1 0 ${2 * Rout} 0a${Rout} ${Rout} 0 1 0 ${-2 * Rout} 0Z`;
    rot = rot == null ? -90 : rot;
    const rc = Rout * RC, R = Rout - rc, pts = [];
    for (let k = 0; k < n; k++) {
      const a = (rot + 360 * k / n) * D2R, vx = cx + R * Math.cos(a), vy = cy + R * Math.sin(a);
      const a0 = (rot + 360 * (k - .5) / n) * D2R, a1 = (rot + 360 * (k + .5) / n) * D2R;
      for (let s = 0; s <= 10; s++) { const t = a0 + (a1 - a0) * s / 10; pts.push([vx + rc * Math.cos(t), vy + rc * Math.sin(t)]); }
    }
    return "M" + pts.map(p => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + "Z";
  }
  function line2(cx, cy, w, h) { const r = h / 2; return `M${cx - w / 2 + r} ${cy - r}H${cx + w / 2 - r}A${r} ${r} 0 0 1 ${cx + w / 2 - r} ${cy + r}H${cx - w / 2 + r}A${r} ${r} 0 0 1 ${cx - w / 2 + r} ${cy - r}Z`; }

  function sprite() {
    if (document.getElementById("apd-sprite")) return;
    const s = document.createElement("div");
    s.innerHTML = `<svg id="apd-sprite" width="0" height="0" style="position:absolute" aria-hidden="true">
      <symbol id="apd-lockup" viewBox="0 -169.5 1746.4 217.5">${LOCKUP}</symbol>
      <symbol id="apd-mark" viewBox="0 0 687 388">${MARK}</symbol>
      <symbol id="apd-diamond" viewBox="0 0 24 24"><path d="${ngon(4, 12, 12, 10)}" fill="currentColor"/></symbol>
      <symbol id="apd-home" viewBox="0 0 24 24"><path d="${ngon(5, 12, 12.8, 10.5)}" fill="currentColor"/></symbol>
      <symbol id="apd-tri" viewBox="0 0 24 24"><path d="${ngon(3, 12, 13.5, 11)}" fill="currentColor"/></symbol>
      <symbol id="apd-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="currentColor"/></symbol>
      <symbol id="apd-headsup" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><rect x="10.9" y="6" width="2.2" height="8" rx="1.1" fill="var(--sunken)"/><circle cx="12" cy="17.3" r="1.35" fill="var(--sunken)"/></symbol>
      <symbol id="apd-seal" viewBox="0 0 48 48"><path d="${ngon(10, 24, 24, 23)}" fill="currentColor"/><path d="M15.5 24.5l5.5 5.5 11.5-12" fill="none" stroke="var(--page)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    </svg>`;
    document.body.prepend(s.firstElementChild);
  }

  // The polygon family as a pattern: line → triangle → square → home → hexagon → octagon → decagon → circle.
  function patterns() {
    document.querySelectorAll(".apd-pattern[data-pattern]").forEach(p => {
      const kind = p.dataset.pattern, ns = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(ns, "svg");
      if (kind === "family") {
        const fam = [2, 3, 4, 5, 6, 8, 10, 0], W = 1600, H = 200, step = W / fam.length;
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        fam.forEach((n, i) => { const cx = step * i + step / 2, r = 80; const d = n === 2 ? line2(cx, H / 2, r * 2, r * .42) : ngon(n || 0, cx, H / 2 + (n % 2 ? r * .1 : 0), r); const path = document.createElementNS(ns, "path"); path.setAttribute("d", d); path.setAttribute("fill", "currentColor"); svg.appendChild(path); });
      } else if (kind === "homes") {
        const cols = +(p.dataset.cols || 12), rows = +(p.dataset.rows || 8), s = 40;
        svg.setAttribute("viewBox", `0 0 ${cols * s} ${rows * s}`);
        svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const path = document.createElementNS(ns, "path"); path.setAttribute("d", ngon(5, c * s + s / 2, r * s + s / 2 + 1, s * .3)); path.setAttribute("fill", "currentColor"); path.setAttribute("opacity", ((r * 7 + c * 3) % 5 === 0) ? "1" : ".35"); svg.appendChild(path); }
      } else if (kind === "count") {
        const fam = [3, 4, 5, 6, 8, 10, 0], s = 120;
        svg.setAttribute("viewBox", `0 0 ${s} ${s * fam.length}`);
        fam.forEach((n, i) => { const path = document.createElementNS(ns, "path"); path.setAttribute("d", ngon(n, s / 2, s * i + s / 2, s * .4)); path.setAttribute("fill", "currentColor"); svg.appendChild(path); });
      }
      p.textContent = ""; p.appendChild(svg);
    });
  }

  // A home's identity in the family's hexagon: <span class="apd-hex" data-src="…" data-alt="…"></span>
  let hexSeq = 0;
  function hexPhotos() {
    document.querySelectorAll(".apd-hex[data-src]").forEach(box => {
      const id = "apd-hexclip-" + (++hexSeq), alt = box.dataset.alt || "";
      box.innerHTML = `<svg viewBox="0 0 100 100" role="img" aria-label="${alt.replace(/"/g, "&quot;")}"><defs><clipPath id="${id}"><path d="${ngon(6, 50, 50, 50, 0)}"/></clipPath></defs><image href="${box.dataset.src}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/></svg>`;
    });
  }

  function qr() {
    if (!window.qrcode) return;
    document.querySelectorAll(".apd-qr[data-url]").forEach(box => {
      try {
        const q = window.qrcode(0, "M"); q.addData(box.dataset.url); q.make();
        box.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
        const s = box.querySelector("svg"); if (s) { s.setAttribute("role", "img"); s.setAttribute("aria-label", "QR code for " + box.dataset.url); }
      } catch (e) { /* the written link stays */ }
    });
  }

  function setPage(doc) {
    const f = doc.dataset.format || "a4";
    let st = document.getElementById("apd-page-size");
    if (!st) { st = document.createElement("style"); st.id = "apd-page-size"; document.head.appendChild(st); }
    st.textContent = `@page { size: ${PAGE[f] || PAGE.a4}; margin: 0; }`;
  }

  function fit(doc) {
    if (doc.dataset.fit === "off") { doc.style.setProperty("--fit", "1"); return; }
    const pages = doc.querySelectorAll(".apd-page");
    if (!pages.length) return;
    const cs = getComputedStyle(doc), pw = parseFloat(cs.getPropertyValue("--pw")), ph = parseFloat(cs.getPropertyValue("--ph")), pz = parseFloat(cs.getPropertyValue("--pz")) || 1;
    const availW = document.documentElement.clientWidth - 32;
    let k = Math.min(1, availW / (pw * pz));
    if (doc.classList.contains("is-deck")) k = Math.min(availW / (pw * pz), (window.innerHeight - 96) / (ph * pz));
    doc.style.setProperty("--fit", String(Math.max(.2, k)));
  }

  function number(doc) {
    const pages = [...doc.querySelectorAll(".apd-page")];
    pages.forEach((p, i) => p.querySelectorAll(".apd-num").forEach(n => { n.textContent = `${i + 1} of ${pages.length}`; }));
  }

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  function toolbar(doc) {
    if (doc.dataset.toolbar === "off") return;
    const bar = document.createElement("div");
    bar.className = "apd-bar"; bar.setAttribute("role", "toolbar"); bar.setAttribute("aria-label", "Document view");
    const formats = (doc.dataset.formats || doc.dataset.format || "a4").split(/\s+/);
    const btn = (label, pressed, on, title) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; if (pressed != null) b.setAttribute("aria-pressed", String(pressed)); if (title) b.title = title; b.addEventListener("click", on); bar.appendChild(b); return b; };
    const sep = () => { const s = document.createElement("span"); s.className = "sep"; bar.appendChild(s); };
    // The way back to the gallery the document was opened from (data-back="../"): history first, the link otherwise.
    if (doc.dataset.back) {
      const a = document.createElement("a");
      a.href = doc.dataset.back; a.className = "back"; a.textContent = "‹ All documents";
      a.addEventListener("click", e => {
        let fromHere = false;
        try { fromHere = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (err) { fromHere = false; }
        if (fromHere && history.length > 1) { e.preventDefault(); history.back(); }
      });
      bar.appendChild(a); sep();
    }
    if (formats.length > 1) {
      formats.forEach(f => btn(NAME[f] || f, f === doc.dataset.format, e => { doc.dataset.format = f; bar.querySelectorAll("[data-f]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.f === f))); setPage(doc); fit(doc); window.APCharts && APCharts.renderAll(doc); }).dataset.f = f);
      sep();
    }
    const root = document.documentElement;
    const themes = [["System", null], ["Light", "light"], ["Dark", "dark"]];
    const saved = store("apd-theme");
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
    themes.forEach(([label, val]) => { const b = btn(label, (root.dataset.theme || null) === val, () => { if (val) root.dataset.theme = val; else delete root.dataset.theme; store("apd-theme", val || ""); bar.querySelectorAll("[data-t]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.t === (val || "")))); }); b.dataset.t = val || ""; });
    if (doc.dataset.format === "slide") {
      sep();
      const pages = [...doc.querySelectorAll(".apd-page")];
      let i = 0;
      const count = document.createElement("span"); count.className = "note";
      const show = j => { i = Math.max(0, Math.min(pages.length - 1, j)); pages.forEach((p, k) => p.classList.toggle("is-current", k === i)); count.textContent = `${i + 1} / ${pages.length}`; };
      const deck = btn("One slide", true, () => { const on = !doc.classList.contains("is-deck"); doc.classList.toggle("is-deck", on); deck.setAttribute("aria-pressed", String(on)); deck.textContent = on ? "One slide" : "All slides"; count.hidden = !on; fit(doc); window.APCharts && APCharts.renderAll(doc); });
      bar.appendChild(count);
      doc.classList.add("is-deck"); show(0);
      document.addEventListener("keydown", e => { if (!doc.classList.contains("is-deck")) return; if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); show(i + 1); } if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); show(i - 1); } });
      doc.addEventListener("click", e => { if (!doc.classList.contains("is-deck") || e.target.closest("button, a, .apd-chart")) return; show(e.clientX > window.innerWidth / 2 ? i + 1 : i - 1); });
    }
    if (window.self === window.top) { const n = document.createElement("span"); n.className = "note"; n.textContent = "Print or save as PDF from the browser"; sep(); bar.appendChild(n); }
    document.body.appendChild(bar);
  }

  function boot() {
    sprite();
    document.querySelectorAll(".apd").forEach(doc => { setPage(doc); number(doc); toolbar(doc); fit(doc); });
    patterns(); hexPhotos(); qr();
    window.addEventListener("resize", () => document.querySelectorAll(".apd").forEach(fit));
    window.addEventListener("beforeprint", () => document.querySelectorAll(".apd").forEach(d => d.style.setProperty("--fit", "1")));
    window.addEventListener("afterprint", () => document.querySelectorAll(".apd").forEach(fit));
  }
  window.APDoc = { ngon, fit, setPage };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
