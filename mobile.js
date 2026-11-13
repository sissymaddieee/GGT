/* GGT phone/computer layout toggle
   Add to any page:  <script src="mobile.js" defer></script>  (just before </head>)
   - Picks phone layout automatically on narrow screens (< 600px)
   - 📱/💻 button in the corner flips between them; choice is remembered on that device */
(function () {
  var KEY = 'ggt-view';
  var root = document.documentElement;

  var css = document.createElement('style');
  css.textContent = [
    '.ggt-stack>*{min-width:0}',
    '.ggt-stack canvas{max-width:100% !important}',
    'html.phone body{padding:.5rem !important;overflow-x:hidden !important}',
    'html.phone img,html.phone canvas,html.phone iframe,html.phone table,html.phone video{max-width:100% !important}',
    'html.phone table{display:block;overflow-x:auto}',
    'html.phone .ggt-stack{grid-template-columns:1fr !important;flex-direction:column !important;flex-wrap:nowrap !important}',
    'html.phone .ggt-stack>*{width:auto !important;max-width:100% !important;min-width:0 !important;flex-basis:auto !important}',
    'html.noscroll .ggt-scrollbox{overflow:visible !important;max-height:none !important;height:auto !important}',
    'html.noscroll iframe.ggt-fit{overflow:hidden !important}',
    'html.phone h1{font-size:1.6rem !important}',
    'html.phone h2{font-size:1.2rem !important}',
    '#ggt-toggle{position:fixed;top:10px;left:10px;z-index:99999;border:none;border-radius:999px;',
    'padding:6px 11px;font-size:18px;line-height:1;background:rgba(255,105,180,.92);color:#fff;',
    'box-shadow:0 2px 8px rgba(0,0,0,.2);cursor:pointer}'
  ].join('');
  document.head.appendChild(css);

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  // Find side-by-side layouts while still in computer layout, so phone mode can stack them
  function markStackables() {
    var wasPhone = root.classList.contains('phone');
    root.classList.remove('phone');
    document.querySelectorAll('body *').forEach(function (el) {
      if (el.id === 'ggt-toggle') return;
      var cs = getComputedStyle(el);
      if (/(auto|scroll)/.test(cs.overflowY) && el.tagName !== 'TEXTAREA' && el.tagName !== 'SELECT') el.classList.add('ggt-scrollbox');
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
  }

  // On phones, nothing inside the page scrolls on its own: boxes grow to fit, so only the page scrolls
  var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  function noScroll() { return touch || root.classList.contains('phone'); }

  function flattenFrame(f) {
    try {
      var d = f.contentDocument;
      if (!d || !d.body) return;
      d.documentElement.style.setProperty('overflow', 'hidden', 'important');
      d.body.style.setProperty('overflow', 'hidden', 'important');
      d.querySelectorAll('body *').forEach(function (el) {
        if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return;
        var cs = d.defaultView.getComputedStyle(el);
        if (/(auto|scroll)/.test(cs.overflowY) || /(auto|scroll)/.test(cs.overflowX)) {
          el.style.setProperty('overflow', 'visible', 'important');
          el.style.setProperty('max-height', 'none', 'important');
          el.style.setProperty('height', 'auto', 'important');
        }
      });
      var h = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight);
      h = Math.min(h, 6000);
      if (h && Math.abs(f.offsetHeight - h) > 4) {
        f.style.setProperty('height', h + 'px', 'important');
        f.style.setProperty('max-height', 'none', 'important');
      }
      f.setAttribute('scrolling', 'no');
      f.classList.add('ggt-fit');
    } catch (e) { /* page from another site: leave it alone */ }
  }

  function fitFrames() {
    if (!noScroll()) return;
    document.querySelectorAll('iframe').forEach(flattenFrame);
  }

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
    if (noScroll()) fitFrames(); else unfitFrames();
    var b = document.getElementById('ggt-toggle');
    if (b) {
      b.textContent = mode === 'phone' ? '💻' : '📱';
      b.title = mode === 'phone' ? 'Switch to computer layout' : 'Switch to phone layout';
    }
    // let Chart.js and other widgets resize
    if (resize) setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 50);
  }

  function current() {
    return get() || (window.innerWidth < 600 ? 'phone' : 'computer');
  }

  function init() {
    markStackables();
    var b = document.createElement('button');
    b.id = 'ggt-toggle';
    b.type = 'button';
    b.addEventListener('click', function () {
      var next = root.classList.contains('phone') ? 'computer' : 'phone';
      set(next);
      apply(next, true);
    });
    document.body.appendChild(b);
    apply(current());
    // panels load their data a bit later, so keep resizing them to fit
    setInterval(fitFrames, 1000);
  }

  // apply early to avoid a flash, then finish once everything (charts, images) has loaded
  if (current() === 'phone') root.classList.add('phone', 'noscroll');
  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
