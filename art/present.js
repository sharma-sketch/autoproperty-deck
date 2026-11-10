/* Presenter for the Autoproperty investor deck. The BG deck's presenter
   (work/investor-brief-2027/art/present.js): the same builds and glass controls (previous, next, the NO/EN switch and the
   PDF), slides fitted inside a margin with their ground drawn to the screen's edges, and the next slide fading in over
   the last one with its ground; builds written for these eighteen slides, the appendix builds by the generic rule. The
   language itself is art/lang.js. ?print=1 or a headless check (navigator.webdriver) keeps the
   kit's plain page, so check-doc and the PDF see every slide. */
(function(){
  var doc = document.documentElement;
  var q = new URLSearchParams(location.search);
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var deck = document.querySelector('main.apd');
  if(!deck) return;
  var pages = [].slice.call(deck.querySelectorAll(':scope > .apd-page'));
  function two(n){ return ('0' + n).slice(-2); }
  // print (and the PDF): the kit prints one slide per page; nothing to stage
  if(q.get('print')) return;
  var asked = q.get('mode');
  if(navigator.webdriver && !asked) return;
  // which view: a phone held sideways presents, full screen; a phone held upright, or any window under 600 px wide,
  // reads (art/phone.css reflows each slide into one column); anything larger presents. ?mode= present|read|pages
  // forces one; ?mode=auto decides as a viewer's browser would (for checks).
  var phone = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600;
  function want(){ return phone ? (innerWidth > innerHeight ? 'present' : 'read') : (innerWidth < 600 || innerHeight < 340 ? 'read' : 'present'); }
  var mode = asked && asked !== 'auto' ? asked : want();
  // turning the phone changes the view at the same slide
  if(phone && (!asked || asked === 'auto')){
    var turned = function(){
      if(want() === mode) return;
      var vs = [].slice.call(document.querySelectorAll('video')), fe = document.fullscreenElement || document.webkitFullscreenElement;
      // the film in its own full screen turns by itself; the view changes once it is closed
      if((fe && fe.tagName === 'VIDEO') || vs.some(function(v){ return v.webkitDisplayingFullscreen; })) return;
      var id = doc.getAttribute('data-at'); if(id) try { history.replaceState(null, '', '#' + id); } catch(e){}
      // the film keeps its place: where it was, and whether it was playing
      var fv = document.querySelector('#film-step video');
      if(fv && id === 'film-step' && fv.currentTime > 0) try { sessionStorage.setItem('ap-film', JSON.stringify({t: fv.currentTime, on: !fv.paused})); } catch(e){}
      if(fe && document.exitFullscreen) try { document.exitFullscreen(); } catch(e){}
      location.reload();
    };
    addEventListener('orientationchange', function(){ setTimeout(turned, 250); });
    addEventListener('resize', function(){ clearTimeout(turned.t); turned.t = setTimeout(turned, 350); });
    document.addEventListener('fullscreenchange', function(){ setTimeout(turned, 300); });
    document.addEventListener('webkitendfullscreen', function(){ setTimeout(turned, 300); }, true);
  }
  var resume = null; try { resume = JSON.parse(sessionStorage.getItem('ap-film') || 'null'); sessionStorage.removeItem('ap-film'); } catch(e){}
  function resumeFilm(v){
    if(!resume || !v) return false;
    var at = resume; resume = null;
    var go = function(){ try { v.currentTime = at.t; if(at.on){ var pp = v.play(); if(pp && pp.catch) pp.catch(function(){}); } } catch(e){} };
    if(v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, {once: true});
    return true;
  }
  if(mode === 'read'){ read(); return; }
  if(mode !== 'present') return;

  // ---------- present: the presenter owns the screen; the kit's fit and toolbar step aside
  doc.classList.add('present');
  deck.dataset.fit = 'off'; deck.dataset.toolbar = 'off'; deck.classList.remove('is-deck');
  var kitBar = document.querySelector('.apd-bar'); if(kitBar) kitBar.remove();
  pages.forEach(function(p){ p.classList.remove('is-current'); });
  var stage = deck;
  var ui = document.querySelector('.ui'), top = null, countEl = ui && ui.querySelector('.count'), prevBtn = ui && ui.querySelector('.prev'), nextBtn = ui && ui.querySelector('.next');
  var prog = document.querySelector('.prog'), progBar = prog && prog.firstElementChild;
  var ov = document.getElementById('overview');
  pages.forEach(function(p){ var bd = document.createElement('div'); bd.className = 'deck-bd'; bd.setAttribute('aria-hidden', 'true'); p.insertBefore(bd, p.firstChild); });
  function ground(p){
    var g = p.querySelector(':scope > .apd-ground') || p.querySelector(':scope > .deck-bd'), c = getComputedStyle(g || p).backgroundColor;
    return (!c || c === 'rgba(0, 0, 0, 0)' || c === 'transparent') ? getComputedStyle(p).backgroundColor : c;
  }

  // ---------- builds: [selector, start ms, fx, stagger ms, duration ms]; parts not listed are on the slide from the start
  var DUR = {fade:600, rise:700, pop:520, left:650, right:650, zoom:1200, wipe:950, count:900};
  var T = function(sel, at){ return [sel, at == null ? 80 : at, 'rise', 0, 800]; };
  var HEAD = [['.s-head .apd-kicker', 0, 'fade', 0, 500], ['.s-head .apd-title', 80, 'rise', 0, 800]];
  var PLAYS = {
    cover: [['.p-cover .apd-lockup', 0, 'fade', 0, 700],
          ['.p-cover h1', 150, 'rise', 0, 900],
          ['.p-cover .apd-meta', 1300, 'fade', 0, 700]],
    problem: HEAD.concat([['.pb-c', 350, 'rise', 170, 750], ['.pb-viz', 1150, 'fade', 170, 600], ['.pb-so', 1900, 'rise', 0, 800]]),
    solution: HEAD.concat([['.lp-svg', 200, 'fade', 0, 900], ['.lp-core', 250, 'pop', 0, 800], ['.lp-step', 500, 'pop', 110, 450], ['.sl-ag li', 450, 'left', 180, 550], ['.sl-rails', 1300, 'fade', 0, 600]]),
    'film-step': [['.fm', 0, 'fade', 0, 500]],
    workflow: HEAD.concat([['.dy-h', 300, 'fade', 120, 500], ['.dy-row', 400, 'fade', 500, 500], ['.dy-c.is-old', 450, 'rise', 500, 650], ['.dy-c:not(.is-old)', 1250, 'pop', 500, 700],
          ['.dy-so', 2500, 'rise', 0, 800], ['.apd-source', 2900, 'fade', 0, 600]]),
    levels: HEAD.concat([['.lv-s', 350, 'rise', 200, 700], ['.lv-ppl .k', 1500, 'fade', 0, 500], ['.lv-row > div', 1600, 'rise', 160, 550], ['.apd-source', 2600, 'fade', 0, 600]]),
    tech: HEAD.concat([['.tk-ch', 300, 'left', 90, 500], ['.tk-wires', 450, 'fade', 0, 900], ['.tk-agent', 650, 'pop', 0, 600], ['.tk-gate', 950, 'pop', 0, 700], ['.tk-fork', 1350, 'pop', 120, 400], ['.tk-out', 1450, 'right', 220, 600], ['.tk-mem, .tk-lbl', 1800, 'rise', 0, 600]]),
    competitors: HEAD.concat([['.cp tbody tr', 350, 'rise', 70, 450]]),
    position: HEAD.concat([['.s-head .apd-dek', 400, 'rise', 0, 650], ['.ps-y, .ps-x', 550, 'fade', 0, 600], ['.ps-q', 700, 'rise', 140, 600],
          ['.ps-ap', 1250, 'pop', 0, 700], ['.ps-elise', 1800, 'fade', 0, 600]]),
    value: HEAD.concat([['.va-l > .k', 300, 'fade', 0, 500], ['.va-row', 400, 'left', 260, 600], ['.va-trk', 500, 'grow', 260, 900], ['.va-leg', 1300, 'fade', 0, 500],
          ['.va-big > div', 1500, 'rise', 200, 700], ['.va-own', 900, 'rise', 0, 700], ['.va-pe .trk', 1200, 'grow', 200, 800], ['.va-own p', 1700, 'fade', 0, 600], ['.apd-source', 2400, 'fade', 0, 600]]),
    now: HEAD.concat([['.wn > div', 350, 'rise', 260, 800], ['.apd-source', 1500, 'fade', 0, 600]]),
    memory: HEAD.concat([['.lc-tools', 300, 'fade', 0, 700], ['.lc-stage', 450, 'pop', 110, 450], ['.lc-plot', 1200, 'wipe', 0, 2200], ['.apd-source', 3200, 'fade', 0, 600]]),
    customers: HEAD.concat([['.cu-rows li', 350, 'left', 220, 600], ['.cu-field rect', 500, 'fade', 9, 260], ['.apd-source', 1900, 'fade', 0, 600]]),
    business: HEAD.concat([['.bm-fee', 300, 'pop', 0, 800], ['.bm-next', 1600, 'rise', 0, 700], ['.bm-col:last-child > .k, .bm-col:last-child > p', 700, 'rise', 120, 600], ['.bm-blocks li', 1100, 'pop', 90, 450]]),
    plan: HEAD.concat([['.r-line', 350, 'wipe', 0, 1500], ['.r-mark', 420, 'pop', 170, 500], ['.r-stop', 500, 'rise', 170, 650]]),
    budget: HEAD.concat([['.s-head .apd-dek', 400, 'rise', 0, 650], ['.lab', 450, 'fade', 0, 600], ['.scn2', 550, 'rise', 180, 750]]),
    ladder: HEAD.concat([['.ld-bar', 400, 'grow-up', 220, 800], ['.ld-v', 450, 'fade', 220, 500], ['.ld-ms > div', 900, 'rise', 150, 600], ['.apd-source', 2000, 'fade', 0, 600]]),
    returns: HEAD.concat([['.rt-big', 300, 'rise', 0, 800], ['.rt-rows li', 600, 'left', 160, 550], ['.rt-bar', 700, 'grow', 160, 700], ['.apd-source', 1700, 'fade', 0, 600]]),
    round: HEAD.concat([['.rd-loud > b', 300, 'rise', 0, 900], ['.rd-loud .sub', 550, 'fade', 0, 600], ['.rd-split', 800, 'fade', 0, 700], ['.rd-terms > div', 700, 'rise', 110, 550], ['.rd-use', 1500, 'fade', 0, 600]]),
    team: HEAD.concat([['.tm-people li', 350, 'rise', 130, 650], ['.tm-own', 1200, 'fade', 0, 700], ['.apd-source', 1600, 'fade', 0, 600]]),
    devcost: HEAD.concat([['.dv-big', 300, 'rise', 0, 800], ['.dv-cmp .k', 650, 'fade', 0, 500], ['.dv-row', 750, 'rise', 300, 650], ['.dv-row .ppl .apd-icon', 950, 'pop', 120, 400], ['.dv-deal', 1700, 'fade', 0, 600]]),
    sources: HEAD.concat([['.ax-src li', 350, 'rise', 60, 500]]),
    legal: HEAD.concat([['.lg-party', 350, 'rise', 320, 650], ['.lg-deal', 600, 'fade', 0, 600], ['.lg-uses', 1100, 'pop', 0, 500], ['.lg-pts li', 800, 'left', 180, 600]]),
    risks: HEAD.concat([['.rk > div', 350, 'rise', 120, 600]]),
    market: HEAD.concat([['.mk-rows li', 400, 'left', 160, 550], ['.mk-map', 450, 'fade', 0, 900], ['.mk-lbl', 1000, 'pop', 160, 450], ['.mk-sum', 1200, 'rise', 0, 600], ['.mk-note', 1500, 'fade', 0, 600]]),
    close: [['.p-close .apd-lockup', 0, 'fade', 0, 700], ['.p-close .apd-statement', 150, 'rise', 0, 900], ['.cl-ask > .k', 700, 'fade', 0, 500], ['.cl-h', 750, 'rise', 0, 650], ['.cl-asks li', 800, 'left', 180, 600],
          ['.p-close-scene .h-ground', 200, 'fade', 0, 1000], ['.p-close-scene .h', 300, 'up', 55, 750], ['.p-pin', 1500, 'pop', 220, 550],
          ['.p-next', 1800, 'fade', 0, 700]]
  };
  function bigs(p){
    var big = [].filter.call(p.querySelectorAll('b, strong, span, div, p'), function(el){
      if(el.children.length > 1) return false;
      var t = (el.firstChild && el.firstChild.nodeType === 3) ? el.firstChild.nodeValue : '';
      if(!/\d/.test(t) || /[:,\s\u00a0\u2013]/.test(t.trim()) || t.trim().length > 12) return false;
      return parseFloat(getComputedStyle(el).fontSize) >= 88;
    }).slice(0, 4);
    return big.length ? [[big, 600, 'count', 150, 1000]] : [];
  }
  // generic: the head first, then the slide's blocks in reading order, cards and tiles one by one, big numbers count
  function generic(p){
    var spec = [[':scope :is(.apd-kicker,.kicker,.s-kicker)', 0, 'fade', 0, 500],
                [':scope :is(h1,h2,.apd-title,.apd-statement,.apd-cover h1)', 80, 'rise', 0, 750],
                [':scope :is(.apd-dek,.apd-voice)', 450, 'rise', 0, 650]];
    var skip = '.apd-ground,.s-foot,.apd-sample,script,style,.notes';
    var units = [];
    [].forEach.call(p.children, function(el){
      if(el.matches(skip)) return;
      if(el.matches('.apd-body,.s-body,.apd-cover')) [].forEach.call(el.children, function(k){ if(!k.matches(skip + ',.s-head,h1,h2,.apd-title')) units.push(k); });
      else if(!el.matches('h1,h2,.apd-title,.s-head')) units.push(el);
    });
    var at = 520;
    units.forEach(function(u){
      if(u.matches('.s-head') || u.querySelector(':scope > :is(h1,h2,.apd-title)')){ return; }
      var kids = u.matches('.apd-bento,.apd-kpis,.apd-cast,.apd-iconrows,ul,ol,[class*="grid"],[class*="cols"],[class*="row"]') ? [].slice.call(u.children) : null;
      var fx = u.matches('.apd-scene,.apd-hex,figure,.apd-fade,.apd-im,img') ? 'zoom' : u.matches('.apd-chart,.apd-figure') ? 'wipe' : 'rise';
      if(kids && kids.length > 1 && kids.length < 13){ spec.push([kids, at, fx === 'wipe' ? 'rise' : 'rise', 130, 650]); at += Math.min(kids.length, 6) * 130 + 200; }
      else { spec.push([[u], at, fx, 0, fx === 'zoom' ? 1100 : 700]); at += 220; }
    });
    return spec;
  }

  function prepCount(el, at, dur){
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n, m;
    while((n = w.nextNode())){ m = n.nodeValue.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/); if(m) break; }
    if(!n || !m) return null;
    var raw = m[2];
    return {node:n, pre:m[1], post:m[3], target:parseFloat(raw.replace(/,/g, '')), dec:(raw.split('.')[1] || '').length, group:raw.indexOf(',') >= 0, at:at, dur:dur, text:n.nodeValue};
  }
  function fmt(c, v){
    var s = v.toFixed(c.dec);
    if(c.group){ var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); s = p.join('.'); }
    return c.pre + s + c.post;
  }
  pages.forEach(function(f, i){
    var s = f, spec = (PLAYS[s.id] || generic(s)).concat(bigs(s)), total = 0, counts = [];
    var named = spec.map(function(e){ return typeof e[0] === 'string' ? e[0] : ''; }).join(' ');
    var lastAt = spec.reduce(function(m, e){ var n = typeof e[0] === 'string' ? s.querySelectorAll(e[0]).length : e[0].length; return Math.max(m, e[1] + Math.max(0, n - 1) * (e[3] || 0)); }, 0);
    if(PLAYS[s.id]){
      if(named.indexOf('.apd-dek') < 0 && s.querySelector('.s-head .apd-dek')) spec.push(['.s-head .apd-dek', 400, 'rise', 0, 650]);
      if(named.indexOf('.apd-source') < 0 && s.querySelector('.apd-source')) spec.push(['.apd-source', lastAt + 450, 'fade', 0, 600]);
    }
    spec.forEach(function(e){
      var fx = e[2], d = e[1], st = e[3] || 0, dur = e[4] || DUR[fx];
      var els = typeof e[0] === 'string' ? s.querySelectorAll(e[0]) : e[0];
      els = [].filter.call(els, function(el){ return !el.classList.contains('anim'); });
      [].forEach.call(els, function(el, k){
        var at = d + k * st;
        if(fx === 'count'){
          // a number counts once it is on screen: never before the build that brings it in
          var host = el.closest('.anim'); if(host){ at = Math.max(at, (parseFloat(host.style.getPropertyValue('--d')) || 0) + 150); }
          var c = prepCount(el, at, dur); if(c) counts.push(c);
        }
        else {
          el.classList.add('anim'); el.setAttribute('data-fx', fx);
          el.style.setProperty('--d', at + 'ms'); el.style.setProperty('--dur', dur + 'ms');
          if(fx === 'draw'){ var len = 1; try { len = Math.ceil(el.getTotalLength()) + 1; } catch(err){} el.style.setProperty('--len', len); }
        }
        total = Math.max(total, at + dur);
      });
    });
    f._total = total; f._counts = counts;
  });

  if(phone) doc.classList.add('phone-land');
  function fit(){
    var m = phone ? 0 : Math.round(Math.max(16, Math.min(innerWidth, innerHeight) * .035));
    var s = Math.min((innerWidth - 2 * m) / 1920, (innerHeight - 2 * m) / 1080);
    var tx = Math.round((innerWidth - 1920 * s) / 2), ty = Math.round((innerHeight - 1080 * s) / 2);
    stage.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
    // the screen's box in slide units, one pixel over on each side, so each slide's ground reaches every edge
    stage.style.setProperty('--vx', (-tx / s - 1).toFixed(1) + 'px'); stage.style.setProperty('--vy', (-ty / s - 1).toFixed(1) + 'px');
    stage.style.setProperty('--vw', (innerWidth / s + 2).toFixed(1) + 'px'); stage.style.setProperty('--vh', (innerHeight / s + 2).toFixed(1) + 'px');
  }
  addEventListener('resize', fit); fit();

  var cur = -1, t0 = 0, raf = 0;
  function settleCounts(f){ (f._counts || []).forEach(function(c){ c.node.nodeValue = c.text; }); }
  function runCounts(f){
    cancelAnimationFrame(raf);
    var cs = f._counts; if(!cs.length) return;
    (function tick(){
      var now = performance.now() - t0, live = false;
      cs.forEach(function(c){
        var t = Math.min(1, Math.max(0, (now - c.at) / c.dur));
        c.node.nodeValue = t >= 1 ? c.text : fmt(c, c.target * (1 - Math.pow(1 - t, 3)));
        if(t < 1) live = true;
      });
      if(live) raf = requestAnimationFrame(tick);
    })();
  }
  function building(){ var f = pages[cur]; return f && f.classList.contains('play') && !f.classList.contains('ff') && performance.now() - t0 < f._total + 60; }
  function finish(){ var f = pages[cur]; if(!f) return; f.classList.add('ff'); cancelAnimationFrame(raf); settleCounts(f); }

  function show(i, build){
    i = Math.max(0, Math.min(pages.length - 1, i));
    if(i === cur) return;
    var old = pages[cur], f = pages[i];
    cancelAnimationFrame(raf);
    f.classList.remove('off', 'play', 'ff', 'pre');
    var animate = build && !reduce;
    if(animate){ f.classList.add('pre'); f._counts.forEach(function(c){ c.node.nodeValue = fmt(c, 0); }); }
    else settleCounts(f);
    void f.offsetWidth;
    f.classList.add('on');
    if(old){
      old.classList.remove('on'); old.classList.add('off');
      (function(o){ setTimeout(function(){ if(pages[cur] !== o){ o.classList.remove('off', 'play', 'pre', 'ff'); settleCounts(o); } }, 620); })(old);
    }
    cur = i;
    film(f, old);
    if(animate) requestAnimationFrame(function(){ requestAnimationFrame(function(){ if(pages[cur] !== f) return; f.classList.remove('pre'); f.classList.add('play'); t0 = performance.now(); runCounts(f); }); });
    paint();
  }
  // the film step: entering it (next, a click, a swipe or the wheel) plays the film from the start; leaving pauses it
  var fstep = document.getElementById('film-step'), fv = fstep && fstep.querySelector('video');
  function film(f, old){
    if(!fv) return;
    if(f === fstep && resumeFilm(fv)) return;
    if(f === fstep){ try { fv.currentTime = 0; var pp = fv.play(); if(pp && pp.catch) pp.catch(function(){ fv.muted = true; fv.play().catch(function(){}); }); } catch(e){} }
    else if(old === fstep){ try { fv.pause(); } catch(e){} }
  }
  function next(){ if(building()) finish(); else if(cur < pages.length - 1) show(cur + 1, true); }
  function prev(){ if(cur > 0) show(cur - 1, false); }

  function paint(){
    var s = pages[cur];
    document.body.style.setProperty('--deck-ground', ground(s));
    if(countEl) countEl.textContent = (cur + 1) + ' / ' + pages.length;
    if(progBar) progBar.style.setProperty('--p', (cur + 1) / pages.length * 100 + '%');
    if(prevBtn) prevBtn.disabled = cur === 0;
    if(nextBtn) nextBtn.disabled = cur === pages.length - 1;
    var id = s.id, h = cur === 0 ? '' : '#' + id;
    doc.setAttribute('data-at', id);
    if(location.hash !== h) try { history.replaceState(null, '', h || location.pathname + location.search); } catch(e){}
  }

  // ---------- controls: keys, clicks, swipes, one wheel gesture per slide
  addEventListener('keydown', function(e){
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    if(document.body.classList.contains('film-open')) return;
    var k = e.key;
    if(!ov.hidden){ if(k === 'Escape' || k === 'g' || k === 'G'){ e.preventDefault(); closeOv(); } return; }
    var t = e.target; if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if(t && (t.tagName === 'BUTTON' || t.tagName === 'A') && (k === 'Enter' || k === ' ')) return;
    if(k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === 'Enter' || k === 'j' || k === 'n' || (k === ' ' && !e.shiftKey)){ e.preventDefault(); next(); }
    else if(k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace' || k === 'k' || k === 'p' || (k === ' ' && e.shiftKey)){ e.preventDefault(); prev(); }
    else if(k === 'Home'){ e.preventDefault(); show(0, true); }
    else if(k === 'End'){ e.preventDefault(); show(pages.length - 1, false); }
    else if(k === 'g' || k === 'G' || k === 'Escape'){ if(k !== 'Escape'){ e.preventDefault(); openOv(); } }
    else if(k === 'f' || k === 'F'){ e.preventDefault(); toggleFs(); }
  });
  var area = deck;
  area.addEventListener('click', function(e){
    if(e.target.closest('a,button,input,label,select,video')) return;
    if(e.clientX < innerWidth * 0.18) prev(); else next();
  });
  var tx = 0, ty = 0;
  var onCtl = false;
  area.addEventListener('touchstart', function(e){ onCtl = !!e.target.closest('input,label,select'); tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, {passive:true});
  area.addEventListener('touchend', function(e){
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if(!onCtl && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)){ e.preventDefault(); if(dx < 0) next(); else prev(); }
  });
  var wheelLock = false, quiet = 0;
  addEventListener('wheel', function(e){
    if(!ov.hidden || document.body.classList.contains('film-open')) return;
    clearTimeout(quiet); quiet = setTimeout(function(){ wheelLock = false; }, 280);
    var d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if(!wheelLock && Math.abs(d) > 24){ wheelLock = true; if(d > 0) next(); else prev(); }
  }, {passive:true});
  if(ui){
    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);
    var allBtn = ui.querySelector('.all'), fsBtn = ui.querySelector('.fs');   // optional: G and F do the same
    if(allBtn) allBtn.addEventListener('click', openOv);
    if(fsBtn) fsBtn.addEventListener('click', toggleFs);
  }
  function toggleFs(){
    try {
      if(document.fullscreenElement) document.exitFullscreen();
      else if(doc.requestFullscreen) doc.requestFullscreen().catch(function(){});
    } catch(e){}
  }

  // the PDF: a plain download on the site; inside the claude.ai artifact the viewer's frame blocks downloads a page starts,
  // so the button goes through the artifact's downloads capability, and stays hidden when this view cannot save
  var pdf = ui && ui.querySelector('.pdf');
  if(pdf && ui.dataset.build === 'artifact'){
    // inside the claude.ai artifact a page cannot start a download, so the button saves through the viewer's downloads
    // capability (the viewer confirms); window.claude can arrive after this script, so ask for it until it does
    var dl = null, asked = false, tries = 0;
    var ask = function(){
      if(asked || !(window.claude && typeof window.claude.use === 'function')) return;
      asked = true;
      window.claude.use('downloads').then(function(d){ dl = d; }, function(){});
    };
    ask();
    var poll = setInterval(function(){ ask(); if(asked || ++tries > 60) clearInterval(poll); }, 250);
    pdf.addEventListener('click', function(e){
      e.preventDefault();
      if(pdf.classList.contains('busy')) return;
      var href = new URL(pdf.getAttribute('href'), location.href).href;
      if(!dl){ var a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.click(); return; }
      pdf.classList.add('busy');
      fetch(href).then(function(r){ if(!r.ok) throw {code: 'unavailable'}; return r.blob(); })
        .then(function(b){ return dl.save({filename: pdf.getAttribute('download') || 'Autoproperty-Investorpresentasjon.pdf', data: b}); })
        .catch(function(){})
        .then(function(){ pdf.classList.remove('busy'); });
    });
  }

  // the controls step aside while you talk and come back when the mouse moves
  var idle = 0;
  function wake(){ [ui, top].forEach(function(b){ if(b) b.classList.remove('idle'); }); clearTimeout(idle); idle = setTimeout(function(){ [ui, top].forEach(function(b){ if(b && !b.contains(document.activeElement)) b.classList.add('idle'); }); }, phone ? 2200 : 3200); }
  addEventListener('mousemove', wake); if(ui) ui.addEventListener('focusin', wake); if(top) top.addEventListener('focusin', wake);
  // a phone held sideways: every touch brings the controls back for a moment; the first tap asks for the full screen
  // where the browser allows it (Android; an iPhone keeps its browser bar, and the slide fills the rest)
  if(phone){
    addEventListener('touchstart', wake, {passive:true});
    var asked4fs = false;
    addEventListener('touchend', function(){
      if(asked4fs || document.fullscreenElement || !doc.requestFullscreen || !document.fullscreenEnabled) return;
      asked4fs = true; try { doc.requestFullscreen({navigationUI: 'hide'}).catch(function(){}); } catch(e){}
    }, {passive:true});
  }

  // ---------- all slides
  var built = false;
  function buildOv(){
    built = true;
    finish();
    var grid = ov.querySelector('[data-group=pitch]');
    pages.forEach(function(f, i){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ov-t';
      var box = document.createElement('div'); box.className = 'ov-box';
      var c = f.cloneNode(true); c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(function(x){ x.removeAttribute('id'); }); c.classList.remove('on', 'off', 'pre', 'play', 'ff'); c.inert = true; c.setAttribute('aria-hidden', 'true');
      box.appendChild(c);
      var hd = f.querySelector('h1,h2,.apd-title,.apd-statement');
      var said = function(drop){
        if(!hd) return '';
        var tc = hd.cloneNode(true); tc.querySelectorAll(drop).forEach(function(x){ x.remove(); });
        tc.querySelectorAll('br').forEach(function(x){ x.after(' '); });
        return tc.textContent.replace(/\s+/g, ' ').trim();
      };
      var nb = said('.l-en, l-en') || f.getAttribute('data-aria-nb') || f.getAttribute('aria-label') || '', en = said('.l-nb, l-nb') || f.getAttribute('data-aria-en') || nb;
      var l = document.createElement('div'); l.className = 'ov-l';
      l.innerHTML = '<em></em><span><span class="l-nb"></span><span class="l-en"></span></span>';
      l.firstChild.textContent = two(i + 1);
      l.querySelector('.l-nb').textContent = nb; l.querySelector('.l-en').textContent = en;
      b.appendChild(box); b.appendChild(l); b.setAttribute('aria-label', two(i + 1) + ' ' + nb); b.setAttribute('data-aria-en', two(i + 1) + ' ' + en);
      b.addEventListener('click', function(){ closeOv(); show(i, true); });
      grid.appendChild(b);
    });
    var first = ov.querySelector('.ov-box');
    var size = function(){ ov.style.setProperty('--k', first.clientWidth / 1920); };
    if('ResizeObserver' in window) new ResizeObserver(size).observe(first); else addEventListener('resize', size);
    size();
  }
  function openOv(){
    if(!built) buildOv(); else finish();
    ov.hidden = false;
    var ts = ov.querySelectorAll('.ov-t');
    ts.forEach(function(t, i){ t.classList.toggle('cur', i === cur); });
    var c = ts[cur]; if(c){ c.focus({preventScroll:true}); c.scrollIntoView({block:'center'}); }
    if(ui) ui.classList.add('idle'); if(top) top.classList.add('idle');
  }
  function closeOv(){ ov.hidden = true; wake(); }
  ov.querySelector('.ov-x').addEventListener('click', closeOv);

  // ---------- start: from the slide in the link, once the type has loaded so nothing reflows mid-build
  var start = 0;
  if(location.hash){ var at = pages.findIndex(function(s){ return s.id === location.hash.slice(1); }); if(at >= 0) start = at; }
  addEventListener('hashchange', function(){
    var at = pages.findIndex(function(s){ return s.id === location.hash.slice(1); });
    if(at >= 0 && at !== cur){ if(!ov.hidden) closeOv(); show(at, true); }
  });
  var begun = false;
  function begin(){ if(begun) return; begun = true; show(start, true); wake(); }
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(begin, begin);
  setTimeout(begin, 1200);
  // ---------- read: a phone held upright. The slides one under another, each reflowed by art/phone.css into one column
  // 720 design px wide and scaled to the screen; nothing builds; the film plays in its own player (full screen turns it
  // sideways); the slide on screen goes into the link, so turning the phone presents from there.
  function read(){
    doc.classList.add('read');
    // a reload (turning the phone reloads) starts at the slide in the link, not at the browser's remembered scroll
    try { history.scrollRestoration = 'manual'; } catch(e){}
    deck.dataset.fit = 'off'; deck.dataset.toolbar = 'off'; deck.classList.remove('is-deck');
    var bar = document.querySelector('.apd-bar'); if(bar) bar.remove();
    pages.forEach(function(p){ p.classList.remove('is-current'); });
    function size(){ doc.style.setProperty('--rz', (doc.clientWidth / 720).toFixed(4)); }
    addEventListener('resize', size); size();
    var fv = document.querySelector('#film-step video');
    if(fv){ fv.setAttribute('controls', ''); fv.setAttribute('preload', 'metadata'); fv.removeAttribute('autoplay'); if(location.hash === '#film-step') resumeFilm(fv); }
    // appendix F reads one company a block: each cell says its column's name, in the page's language
    var cp = document.querySelector('table.cp');
    if(cp){
      var en = doc.getAttribute('data-lang') === 'en';
      var heads = [].map.call(cp.querySelectorAll('thead th'), function(th){ var l = th.querySelector(en ? 'l-en' : 'l-nb'); return (l || th).textContent.trim(); });
      [].forEach.call(cp.querySelectorAll('tbody tr'), function(tr){
        [].forEach.call(tr.children, function(td, i){
          if(!i) return;
          td.setAttribute('data-l', heads[i] || '');
          var s = document.createElement('span'); while(td.firstChild) s.appendChild(td.firstChild); td.appendChild(s);
        });
      });
    }
    // start at the slide in the link (after a turn: the slide that was on screen), then keep the link at the slide in view
    var target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    if(target) doc.setAttribute('data-at', target.id);
    var watch = function(){
      if(!('IntersectionObserver' in window)) return;
      var seen = new IntersectionObserver(function(es){
        if(phone && want() !== mode) return;   // mid-turn the page rescales under the same scroll: keep the slide that was on screen
        es.forEach(function(e){ if(e.isIntersecting){ doc.setAttribute('data-at', e.target.id);
          try { history.replaceState(null, '', e.target === pages[0] ? location.pathname + location.search : '#' + e.target.id); } catch(err){} } });
      }, {rootMargin: '-45% 0px -50% 0px'});
      pages.forEach(function(p){ seen.observe(p); });
    };
    var begun = false;
    var go = function(){
      if(begun) return; begun = true;
      if(target) target.scrollIntoView({block: 'start'});
      requestAnimationFrame(function(){ requestAnimationFrame(watch); });
    };
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(go, go);
    setTimeout(go, 1200);
  }
})();
