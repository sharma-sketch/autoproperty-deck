/* Language for the investor deck. Each published link is one language: the build marks the page data-lang-lock and
   leaves the NO/EN switch out, so ?lang= and the browser's last choice are ignored there. Without the lock (an unlocked
   build) the old behaviour stays: Norwegian first, English on the NO/EN switch in the controls. The template writes every
   text in both languages (.l-nb and .l-en); this sets html[data-lang] and the page shows one of them. The choice comes from
   ?lang=en|nb, then this browser's last choice, then the page's own default (the English-first build for the English PDF).
   It also keeps what the language reaches outside the text: the labels read aloud, the slide numbers ("4 av 20" or
   "4 of 20") and the PDF the button downloads. And it plays the film in a dialog: the English film in both languages (Tor, 8 Nov 2026). */
(function(){
  var doc = document.documentElement, KEY = 'autoproperty-investor-lang', LOCK = doc.hasAttribute('data-lang-lock');
  var q = new URLSearchParams(location.search).get('lang');
  var saved = null; try { saved = localStorage.getItem(KEY); } catch(e){}
  var norm = function(l){ return l === 'en' ? 'en' : (l === 'nb' || l === 'no') ? 'nb' : null; };
  var lang = LOCK ? (norm(doc.getAttribute('data-lang')) || 'nb') : (norm(q) || norm(saved) || norm(doc.getAttribute('data-lang')) || 'nb');

  function nums(){
    var pages = [].filter.call(document.querySelectorAll('main.apd > .apd-page'), function(p){ return !p.hasAttribute('data-nonum'); });
    [].forEach.call(pages, function(p, i){
      [].forEach.call(p.querySelectorAll('.apd-num'), function(n){ n.textContent = (i + 1) + (lang === 'en' ? ' of ' : ' av ') + pages.length; });
    });
  }
  function apply(){
    doc.setAttribute('data-lang', lang);
    doc.setAttribute('lang', lang === 'en' ? 'en' : 'nb');
    [].forEach.call(document.querySelectorAll('[data-aria-en]'), function(el){
      if(!el.hasAttribute('data-aria-nb')) el.setAttribute('data-aria-nb', el.getAttribute('aria-label') || '');
      el.setAttribute('aria-label', el.getAttribute(lang === 'en' ? 'data-aria-en' : 'data-aria-nb'));
      if(el.hasAttribute('title')) el.setAttribute('title', el.getAttribute('aria-label'));
    });
    var pdf = document.querySelector('.ui .pdf');
    if(pdf){ pdf.setAttribute('href', pdf.getAttribute('data-href-' + lang)); pdf.setAttribute('download', pdf.getAttribute('data-file-' + lang)); }
    [].forEach.call(document.querySelectorAll('.ui .lang [data-l]'), function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-l') === lang ? 'true' : 'false'); });
    nums();
  }
  window.apLang = { get: function(){ return lang; }, set: function(l){ l = norm(l); if(LOCK || !l || l === lang) return; lang = l; try { localStorage.setItem(KEY, l); } catch(e){} apply(); } };
  apply();
  // the kit numbers the slides in English once it has laid them out; say it again in the page's language
  setTimeout(nums, 0); addEventListener('DOMContentLoaded', nums); addEventListener('load', nums); setTimeout(nums, 1500);

  document.addEventListener('click', function(e){
    var b = e.target.closest('.ui .lang [data-l]');
    if(b){ e.preventDefault(); window.apLang.set(b.getAttribute('data-l')); }
  });

  // ---------- the film: a dialog over the deck; Escape, the close button or a click outside the video closes it
  var film = document.getElementById('film');
  if(!film) return;
  var video = film.querySelector('video');
  function openFilm(){
    // the film in the language on screen (data-src-nb / data-src-en; the Norwegian cut takes its slot when it arrives)
    var want = video.getAttribute('data-src-' + lang) || video.getAttribute('src');
    if(want && video.getAttribute('src') !== want){ video.setAttribute('src', want); video.load(); }
    var poster = video.getAttribute('data-poster-' + lang); if(poster && video.getAttribute('poster') !== poster) video.setAttribute('poster', poster);
    film.hidden = false; document.body.classList.add('film-open');
    try { video.currentTime = 0; var p = video.play(); if(p && p.catch) p.catch(function(){}); } catch(e){}
    var x = film.querySelector('.film-x'); if(x) x.focus({preventScroll: true});
  }
  function closeFilm(){ try { video.pause(); } catch(e){} film.hidden = true; document.body.classList.remove('film-open'); }
  document.addEventListener('click', function(e){
    if(e.target.closest('[data-film-open]')){ e.preventDefault(); e.stopPropagation(); openFilm(); return; }
    if(!film.hidden && (e.target.closest('[data-film-close]') || e.target === film)){ e.preventDefault(); closeFilm(); }
  }, true);
  addEventListener('keydown', function(e){
    if(film.hidden) return;
    if(e.key === 'Escape'){ e.preventDefault(); closeFilm(); }
    e.stopPropagation();
  }, true);
})();
