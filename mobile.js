/* GGT phone/computer layout
   Add to any page:  <script src="mobile.js?v=4" defer></script>  (just under <head>)
   - Phone layout picked automatically on narrow screens (< 600px)
   - 📱/💻 button at the top left flips layouts; choice is remembered on that device
   - Phone layout: dropdown at the top picks which section to show
   - On phones, small boxes don't scroll on their own; only the page scrolls */
(function () {
  var KEY = 'ggt-view', SKEY = 'ggt-section';
  var root = document.documentElement;
  var touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  var cards = [];

  var css = document.createElement('style');
  css.textContent = [
    '.ggt-stack>*{min-width:0}',
    '.ggt-stack canvas{max-width:100% !important}',
    /* top bar: floats over the top-left corner on computer, sits at the top of the page on phone */
    '#ggt-bar{position:absolute;top:8px;left:8px;z-index:99999;display:flex;gap:6px;align-items:center;font-family:inherit}',
    '#ggt-bar button{border:none;border-radius:999px;padding:6px 11px;font-size:18px;line-height:1;',
    'background:rgba(255,105,180,.92);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.2);cursor:pointer}',
    '#ggt-bar select{display:none;flex:1;min-width:0;font:inherit;font-size:16px;font-weight:600;color:#e0559b;',
    'background:#fff;border:2px solid #ff69b4;border-radius:12px;padding:7px 10px}',
    'html.phone #ggt-bar{position:relative;top:auto;left:auto;margin:0 0 .6rem}',
    'html.phone #ggt-bar select{display:block}',
    'html.phone .ggt-card.ggt-hidden{display:none !important}',
    'html.phone body{padding:.5rem !important}',
    'html.phone img,html.phone canvas,html.phone iframe,html.phone table,html.phone video{max-width:100% !important}',
    'html.phone .ggt-stack{grid-template-columns:1fr !important;flex-direction:column !important;flex-wrap:nowrap !important}',
    'html.phone .ggt-stack>*{width:auto !important;max-width:100% !important;min-width:0 !important;flex-basis:auto !important}',
    'html.phone h1{font-size:1.6rem !important}',
    'html.phone h2{font-size:1.2rem !important}',
    'html.noscroll .ggt-scrollbox{overflow:visible !important;max-height:none !important;height:auto !important}',
    'html.noscroll iframe.ggt-fit{overflow:hidden !important}'
  ].join('');
  document.head.appendChild(css);

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function isPhone() { return root.classList.contains('phone'); }
  function noScroll() { return touch || isPhone(); }

  // Find side-by-side layouts and scroll boxes while in computer layout
  function mark() {
    var wasPhone = isPhone();
    root.classList.remove('phone');
    document.querySelectorAll('body *').forEach(function (el) {
      var cs = getComputedStyle(el);
      if (/(auto|scroll)/.test(cs.overflowY) && !/^(TEXTAREA|SELECT)$/.test(el.tagName)) el.classList.add('ggt-scrollbox');
      if (cs.display.indexOf('grid') > -1) {
        if (cs.gridTemplateColumns.trim().split(/\s+/).length > 1) el.classList.add('ggt-stack');
      } else if (cs.display.indexOf('flex') > -1 && cs.flexDirection === 'row') {
        var kids = Array.prototype.filter.call(el.children, function (c) {
          return /^(DIV|SECTION|ARTICLE|ASIDE|IFRAME|UL|OL|FORM)$/.test(c.tagName);
        });
        if (kids.length >= 2 && kids.length === el.children.length) el.classList.add('ggt-stack');
      }
    });
    if (wasPhone) root.classList.add('phone');

    // Sections = the boxes inside the side-by-side rows (outermost rows only)
    document.querySelectorAll('.ggt-stack').forEach(function (row) {
      if (row.parentElement && row.parentElement.closest('.ggt-stack')) return;
      collect(row);
    });
  }

  function collect(row) {
    Array.prototype.forEach.call(row.children, function (c) {
      if (c.classList.contains('ggt-stack')) collect(c);
      else { c.classList.add('ggt-card'); cards.push(c); }
    });
  }

  var usedNames = {};
  function tidy(t) {
    t = (t || '').replace(/\s+/g, ' ').trim();
    return t.length > 32 ? t.slice(0, 30) + '…' : t;
  }
  function nameOf(el, i) {
    var opts = [];
    var h = el.querySelector('h1,h2,h3,h4,[class*="title"],[class*="header"]');
    if (h) opts.push(h.textContent);
    var f = el.tagName === 'IFRAME' ? el : el.querySelector('iframe');
    if (f) {
      opts.push(f.getAttribute('title'));
      var src = f.getAttribute('src') || '';
      var hash = src.split('#')[1], q = (src.split('?')[1] || '').split('#')[0];
      [hash, q && q.split('=').pop()].forEach(function (x) {
        if (x) { x = decodeURIComponent(x).replace(/[-_]/g, ' '); opts.push(x.charAt(0).toUpperCase() + x.slice(1)); }
      });
      // what's actually visible at the top of the panel
      try {
        var d = f.contentDocument, r = f.getBoundingClientRect();
        if (d) {
          var scroller = d.scrollingElement || d.documentElement;
          var best = null;
          d.querySelectorAll('h1,h2,h3,[class*="title"]').forEach(function (x) {
            var top = x.getBoundingClientRect().top;
            if (top >= -5 && x.offsetParent !== null && (best === null || top < best.top)) best = { el: x, top: top };
          });
          if (best) opts.push(best.el.textContent);
        }
      } catch (e) {}
      var file = src.split('#')[0].split('?')[0].split('/').pop().replace(/\.html?$/, '').replace(/^hq-/, '').replace(/[-_]/g, ' ');
      if (file) opts.push(file.charAt(0).toUpperCase() + file.slice(1));
    } else if (el.querySelector('canvas')) opts.push('📈 Weight');
    for (var k = 0; k < opts.length; k++) {
      var t = tidy(opts[k]);
      if (t && !usedNames[t]) { usedNames[t] = 1; return t; }
    }
    var base = tidy(opts[0]) || 'Section';
    usedNames[base + i] = 1;
    return base + ' ' + (i + 1);
  }

  function showSection(v) {
    cards.forEach(function (c, i) { c.classList.toggle('ggt-hidden', v !== 'all' && String(i) !== v); });
    fitFrames();
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 50);
  }

  // Panels from your own site get stretched to fit instead of scrolling
  function flattenFrame(f) {
    try {
      var d = f.contentDocument;
      if (!d || !d.body || f.offsetParent === null) return;
      d.documentElement.style.setProperty('overflow', 'hidden', 'important');
      d.body.style.setProperty('overflow', 'hidden', 'important');
      d.querySelectorAll('body *').forEach(function (el) {
        if (/^(TEXTAREA|SELECT)$/.test(el.tagName)) return;
        var cs = d.defaultView.getComputedStyle(el);
        if (/(auto|scroll)/.test(cs.overflowY) || /(auto|scroll)/.test(cs.overflowX)) {
          el.style.setProperty('overflow', 'visible', 'important');
          el.style.setProperty('max-height', 'none', 'important');
          el.style.setProperty('height', 'auto', 'important');
        }
      });
      var h = Math.min(Math.max(d.documentElement.scrollHeight, d.body.scrollHeight), 6000);
      if (h && Math.abs(f.offsetHeight - h) > 4) {
        f.style.setProperty('height', h + 'px', 'important');
        f.style.setProperty('max-height', 'none', 'important');
      }
      f.setAttribute('scrolling', 'no');
      f.classList.add('ggt-fit');
    } catch (e) { /* panel from another site: leave it alone */ }
  }
  function fitFrames() { if (noScroll()) document.querySelectorAll('iframe').forEach(flattenFrame); }
  function unfitFrames() {
    document.querySelectorAll('iframe.ggt-fit').forEach(function (f) {
      f.classList.remove('ggt-fit');
      f.removeAttribute('scrolling');
      f.style.removeProperty('height');
      f.style.removeProperty('max-height');
      f.src = f.src; // reload so it gets its normal layout back
    });
  }

  function apply(mode, resize) {
    root.classList.toggle('phone', mode === 'phone');
    root.classList.toggle('noscroll', noScroll());
    var b = document.getElementById('ggt-toggle');
    if (b) {
      b.textContent = mode === 'phone' ? '💻' : '📱';
      b.title = mode === 'phone' ? 'Switch to computer layout' : 'Switch to phone layout';
    }
    var sel = document.getElementById('ggt-select');
    if (sel) showSection(mode === 'phone' ? sel.value : 'all');
    if (noScroll()) fitFrames(); else unfitFrames();
    if (resize) setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 50);
  }

  function current() { return get(KEY) || (window.innerWidth < 600 ? 'phone' : 'computer'); }

  // A panel shown inside another HQ page doesn't get its own bar
  var inPanel = false;
  try { inPanel = window.parent !== window && !!window.parent.document.getElementById('ggt-bar'); } catch (e) {}

  function init() {
    mark();
    try { inPanel = inPanel || (window.parent !== window && !!window.parent.document.querySelector('script[src*="mobile.js"]')); } catch (e) {}
    if (inPanel) { apply(current()); return; }

    var bar = document.createElement('div');
    bar.id = 'ggt-bar';
    var b = document.createElement('button');
    b.id = 'ggt-toggle';
    b.type = 'button';
    b.addEventListener('click', function () {
      var next = isPhone() ? 'computer' : 'phone';
      set(KEY, next);
      apply(next, true);
    });
    var sel = document.createElement('select');
    sel.id = 'ggt-select';
    sel.setAttribute('aria-label', 'Choose section');
    var all = document.createElement('option');
    all.value = 'all'; all.textContent = '✨ Everything';
    sel.appendChild(all);
    cards.forEach(function (c, i) {
      var o = document.createElement('option');
      o.value = String(i); o.textContent = nameOf(c, i);
      sel.appendChild(o);
    });
    var saved = get(SKEY);
    sel.value = saved && sel.querySelector('option[value="' + saved + '"]') ? saved : (cards.length ? '0' : 'all');
    sel.addEventListener('change', function () {
      set(SKEY, sel.value);
      showSection(sel.value);
      window.scrollTo(0, 0);
    });
    bar.appendChild(b);
    bar.appendChild(sel);
    document.body.insertBefore(bar, document.body.firstChild);

    apply(current());
    setInterval(fitFrames, 1000); // panels load their data a bit later, keep fitting them
  }

  if (current() === 'phone') root.classList.add('phone');
  if (current() === 'phone' || touch) root.classList.add('noscroll');
  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
