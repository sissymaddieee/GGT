/* GGT HQ — phone layout + 📱/💻 toggle + section picker
   Works with hq-top.html (sections are tagged with data-section="...") */
(function () {
  var root = document.documentElement;
  var LAYOUT_KEY = 'ggt-layout', SECTION_KEY = 'ggt-section';

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // real phones only (small touch screen), so touch-screen laptops keep the desktop layout
  var realPhone = (!!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) &&
                   Math.min(screen.width, screen.height) < 700) || window.innerWidth < 600;
  function current() { return get(LAYOUT_KEY) || (realPhone ? 'phone' : 'computer'); }

  var SECTIONS = [
    ['closet', '👗 Closet'],
    ['roses', '📊 Whore Stats'],
    ['blackmail', '🖼️ Blackmail'],
    ['library', '📚 Library'],
    ['protocols', '📋 Protocols']
  ];
  var DEFAULT_SECTION = 'closet';

  var css = [
    /* hidden sections are parked off-screen at full size (not display:none), so panels and charts keep their layout */
    'html.phone [data-section].ggt-hidden,html.phone .panel.ggt-hidden{position:fixed!important;left:-200vw!important;top:3.3rem!important;width:calc(100vw - .8rem)!important;height:calc(100vh - 3.7rem)!important;visibility:hidden!important;pointer-events:none!important}',
    '#ggt-bar{position:fixed;top:8px;left:8px;z-index:9999;display:flex;gap:6px;align-items:center}',
    '#ggt-bar button{width:38px;height:38px;flex:none;border-radius:50%;border:2px solid #fff;background:linear-gradient(135deg,#FF69B4,#FF1493);color:#fff;font-size:1.1rem;cursor:pointer;box-shadow:0 2px 8px rgba(255,20,147,.35)}',
    '#ggt-bar select{display:none;height:38px;border-radius:19px;border:2px solid #FF69B4;background:#fff;color:#FF1493;font:600 .95rem Quicksand,sans-serif;padding:0 .8rem}',
    'html.phone #ggt-bar{right:8px}',
    'html.phone #ggt-bar select{display:block;flex:1}',

    /* one section at a time, filling the whole screen */
    'html.phone,html.phone body{height:100%!important;overflow:hidden!important}',
    'html.phone body{padding:3.3rem .4rem .4rem!important}',
    'html.phone .container{height:100%!important;display:flex!important;flex-direction:column!important}',
    'html.phone .top-row,html.phone .col-stack,html.phone .compact-row{display:contents!important}',
    'html.phone .stats-footnote,html.phone .container > .header{display:none!important}',
    'html.phone [data-section]{flex:1 1 auto!important;width:100%!important;height:auto!important;margin:0!important;min-height:0!important}',

    /* closet / blackmail / library: panel fills the screen */
    'html.phone .panel{display:flex!important}',
    'html.phone .panel iframe{flex:1!important;height:100%!important;width:100%!important}',

    /* roses: stats on top, chart fills the rest */
    'html.phone .roses-panel{display:flex!important;flex-direction:column!important}',
    'html.phone .roses-stats{grid-template-columns:repeat(2,1fr)!important}',
    'html.phone .roses-chart-wrap{flex:1 1 auto!important;min-height:0!important}',

    /* protocols: one readable column, scrolls only if longer than the screen */
    'html.phone [data-section="protocols"]{overflow-y:auto!important;padding:.6rem!important}',
    'html.phone .Protocols-cols{columns:1!important;display:block!important}',
    'html.phone .compact-row .Protocols-cols,html.phone .compact-row .Protocols-cols *{font-size:1rem!important;line-height:1.45!important}',
    'html.phone .compact-row [data-section="protocols"] .section-title{font-size:1.5rem!important}'
  ].join('\n');

  var style = document.createElement('style');
  style.id = 'ggt-mobile-style';
  style.textContent = css;
  (document.head || root).appendChild(style);

  function showSection(name) {
    var els = document.querySelectorAll('[data-section]');
    for (var i = 0; i < els.length; i++) {
      var hide = name !== 'all' && els[i].getAttribute('data-section') !== name;
      els[i].classList.toggle('ggt-hidden', hide);
    }
  }

  function refit() {
    // tell hq-top (panels), the panels' own carousels and Chart.js to re-measure
    function kick() {
      window.dispatchEvent(new Event('resize'));
      var fs = document.querySelectorAll('iframe');
      for (var i = 0; i < fs.length; i++) {
        try { fs[i].contentWindow.dispatchEvent(new Event('resize')); } catch (e) {}
      }
    }
    setTimeout(kick, 50);
    setTimeout(kick, 400);
    setTimeout(kick, 1200);
  }

  var btn, sel;
  function apply(mode) {
    var phone = mode === 'phone';
    root.classList.toggle('phone', phone);
    if (btn) {
      btn.textContent = phone ? '💻' : '📱';
      btn.title = phone ? 'Switch to computer layout' : 'Switch to phone layout';
    }
    var saved = get(SECTION_KEY);
    var valid = SECTIONS.some(function (x) { return x[0] === saved; });
    var section = phone ? (valid ? saved : DEFAULT_SECTION) : 'all';
    if (sel) sel.value = section;
    showSection(section);
    refit();
  }

  function init() {
    // only the main HQ page gets the bar, not panels shown inside it
    var inPanel = false;
    try { inPanel = window.parent !== window && !!window.parent.document.getElementById('ggt-bar'); } catch (e) {}
    if (inPanel) return;

    var bar = document.createElement('div');
    bar.id = 'ggt-bar';

    btn = document.createElement('button');
    btn.type = 'button';
    btn.addEventListener('click', function () {
      var next = root.classList.contains('phone') ? 'computer' : 'phone';
      set(LAYOUT_KEY, next);
      apply(next);
    });

    sel = document.createElement('select');
    SECTIONS.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s[0]; o.textContent = s[1];
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () {
      set(SECTION_KEY, sel.value);
      showSection(sel.value);
      refit();
    });

    bar.appendChild(btn);
    bar.appendChild(sel);
    document.body.appendChild(bar);
    apply(current());
  }

  // apply early to avoid a flash of the desktop layout
  if (current() === 'phone') root.classList.add('phone');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
