/* Alps — 共通スクリプト */
(function () {
  /* ---- スクロール連動の出現アニメ（この環境でも確実に動く方式） ---- */
  function revealAll() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var els = document.querySelectorAll('.reveal:not(.is-visible), .band-head:not(.is-visible)');
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > -40) els[i].classList.add('is-visible');
    }
  }
  var ticking = false;
  function onScroll() {
    // rAF はバックグラウンド時にスロットリングされ得るため直接呼ぶ（要素は徐々に減るので軽量）
    revealAll();
    if (!ticking) {
      ticking = true;
      setTimeout(function () { revealAll(); ticking = false; }, 120);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', revealAll);
  document.addEventListener('DOMContentLoaded', revealAll);
  revealAll();
  setTimeout(revealAll, 80);
  setTimeout(revealAll, 320);
  setTimeout(revealAll, 900);

  /* ---- ヘッダー: スクロールで影 ---- */
  var header = document.querySelector('.site-header');
  window.addEventListener('scroll', function () {
    if (!header) return;
    header.classList.toggle('is-scrolled', (window.scrollY || 0) > 12);
  }, { passive: true });

  /* ---- 連動型サービスタブ ---- */
  function initSvcTabs(root) {
    var tabs = root.querySelectorAll('.svc-tab');
    var panels = root.querySelectorAll('.svc-panel');
    function activate(idx) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-svc') === String(idx);
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-svc') === String(idx));
      });
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { activate(t.getAttribute('data-svc')); });
      t.addEventListener('mouseenter', function () { activate(t.getAttribute('data-svc')); });
    });
  }
  document.querySelectorAll('.svc-tabs').forEach(initSvcTabs);

  /* ---- 現在ページをナビでハイライト ---- */
  var path = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav a, .mobile-nav a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href === path || (path === 'index.html' && href === 'index.html')) a.classList.add('is-active');
  });

  /* ---- モバイルメニュー（ハンバーガー） ---- */
  var navToggle = document.querySelector('.nav-toggle');
  var mobileNav = document.getElementById('mobileNav');
  if (navToggle && mobileNav) {
    function closeMenu() {
      navToggle.classList.remove('is-open');
      mobileNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
    navToggle.addEventListener('click', function () {
      var open = !navToggle.classList.contains('is-open');
      navToggle.classList.toggle('is-open', open);
      mobileNav.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1060) closeMenu();
    });
  }
})();

/* ---- 数字カウントアップ（.js-count） ---- */
(function () {
  var els = document.querySelectorAll('.js-count');
  if (!els.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function run(el) {
    var raw = el.getAttribute('data-raw');
    if (raw === null) { raw = el.textContent; el.setAttribute('data-raw', raw); }
    var m = String(raw).match(/^(\D*?)(\d[\d,]*)(.*)$/);
    if (!m) return;
    var prefix = m[1], target = parseInt(m[2].replace(/,/g, ''), 10), suffix = m[3];
    if (isNaN(target)) return;
    if (reduce) { el.textContent = prefix + target.toLocaleString('en-US') + suffix; return; }
    var dur = 1300, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased).toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target.toLocaleString('en-US') + suffix;
    }
    requestAnimationFrame(step);
  }

  if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.45 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---- カードのカーソル追従（クリックでなくカーソルで発火） ---- */
(function () {
  var sel = '.card, .business-card, .page-card, .service-item, .reason-item, .case-point, .case-visual, .value-item, .m-pillar, .business-detail-card, .flow-item';
  var nodes = document.querySelectorAll(sel);
  if (!nodes.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  nodes.forEach(function (el) {
    var tilt = !reduce && el.matches('.service-item, .business-card, .page-card, .card');
    var badge = el.matches('.flow-item') ? el.querySelector('.flow-badge') : null;

    el.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'touch') return;
      el.classList.add('is-hover');
    });
    el.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = el.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty('--mx', x + 'px');
      el.style.setProperty('--my', y + 'px');
      var px = x / r.width - 0.5, py = y / r.height - 0.5;
      if (tilt) {
        el.style.transform = 'perspective(760px) rotateY(' + (px * 5).toFixed(2) + 'deg) rotateX(' + (-py * 5).toFixed(2) + 'deg) translateY(-6px)';
      }
      if (badge) {
        badge.style.transform = 'translate(' + (px * 14).toFixed(1) + 'px, ' + (-6 + py * 10).toFixed(1) + 'px)';
      }
    });
    el.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'touch') return;
      el.classList.remove('is-hover');
      if (tilt) el.style.transform = '';
      if (badge) badge.style.transform = '';
    });
  });
})();
