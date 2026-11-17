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
    ['all', '✨ Everything'],
    ['closet', '👗 Closet'],
    ['roses', '🌹 Roses'],
    ['blackmail', '🖼️ Blackmail'],
    ['budget', '💰 Budget'],
    ['library', '📚 Library'],
    ['protocols', '📋 Protocols'],
    ['weight', '⚖️ Weight']
  ];

  var css = [
    '.ggt-hidden,html.phone [data-section].ggt-hidden,html.phone .panel.ggt-hidden{display:none!important}',
    '#ggt-bar{position:fixed;top:8px;left:8px;z-index:9999;display:flex;gap:6px;align-items:center}',
    '#ggt-bar button{width:38px;height:38px;border-radius:50%;border:2px solid #fff;background:linear-gradient(135deg,#FF69B4,#FF1493);color:#fff;font-size:1.1rem;cursor:pointer;box-shadow:0 2px 8px rgba(255,20,147,.35)}',
    '#ggt-bar select{display:none;height:38px;border-radius:19px;border:2px solid #FF69B4;background:#fff;color:#FF1493;font:600 .9rem Quicksand,sans-serif;padding:0 .7rem}',
    'html.phone #ggt-bar select{display:block}',

    /* page scrolls normally, everything stacks in one column */
    'html.phone,html.phone body{height:auto!important;overflow:auto!important;overflow-x:hidden!important}',
    'html.phone body{padding:3.4rem .5rem .8rem!important}',
    'html.phone .container{height:auto!important;display:flex!important;flex-direction:column!important;gap:.6rem!important}',
    'html.phone .top-row,html.phone .col-stack,html.phone .compact-row{display:contents!important}',
    'html.phone [data-section]{flex:none!important;width:100%!important;margin:0!important;min-height:0!important}',
    'html.phone .stats-footnote{font-size:.85rem!important;line-height:1.4}',

    /* panels: iframe height is set by hq-top to fit content */
    'html.phone .panel{display:block!important}',
    'html.phone .panel iframe{display:block;width:100%!important;flex:none!important;min-height:150px}',

    /* roses */
    'html.phone .roses-panel{height:auto!important}',
    'html.phone .roses-stats{grid-template-columns:repeat(2,1fr)!important}',
    'html.phone .roses-chart-wrap{flex:none!important;height:260px!important}',

    /* protocols: one readable column */
    'html.phone .Protocols-cols{columns:1!important}',
    'html.phone .compact-row .Protocols-cols,html.phone .compact-row .Protocols-cols *{font-size:.9rem!important;line-height:1.4!important}',

    /* weight chart */
    'html.phone [data-section="weight"]{display:block!important}',
    'html.phone #weightChart{height:260px!important}',

    'html.phone .header .subtitle{font-size:.85rem}'
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
    // tell hq-top (panels) and Chart.js to re-measure
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 50);
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 700);
  }

  var btn, sel;
  function apply(mode) {
    var phone = mode === 'phone';
    root.classList.toggle('phone', phone);
    if (btn) {
      btn.textContent = phone ? '💻' : '📱';
      btn.title = phone ? 'Switch to computer layout' : 'Switch to phone layout';
    }
    var section = phone ? (get(SECTION_KEY) || 'all') : 'all';
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
      window.scrollTo(0, 0);
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
