/* 1LINE Answers: shared behaviour for lifekit333.com/blog | v1.0 | 7 Nov 2026
   Everything here is progressive: pages read fine without it. */
(function () {
  'use strict';

  /* Fade-in on scroll */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); ro.unobserve(e.target); } });
    }, { threshold: 0.08 });
    reveals.forEach(function (el) { ro.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add('visible'); }); }

  /* Product links always carry the blog tag, so visits and sales are counted as coming from the blog */
  document.querySelectorAll('a[data-product]').forEach(function (a) {
    try {
      var u = new URL(a.getAttribute('href'), location.href);
      if (!u.searchParams.has('ref')) u.searchParams.set('ref', 'acis-blog');
      if (!u.searchParams.has('campaign')) u.searchParams.set('campaign', a.getAttribute('data-product'));
      a.setAttribute('href', u.toString());
    } catch (e) {}
  });

  /* ================= Home page: search and topics ================= */
  var list = document.getElementById('posts');
  if (list) {
    var cards = Array.prototype.slice.call(list.querySelectorAll('.card'));
    var feature = document.getElementById('feature');
    var empty = document.getElementById('empty');
    var input = document.getElementById('q');
    var chips = Array.prototype.slice.call(document.querySelectorAll('.topics .chip'));
    var latestHead = document.getElementById('latest-head');
    var state = { topic: 'all', q: '' };

    chips.forEach(function (c) {
      var t = c.getAttribute('data-topic');
      var n = t === 'all' ? cards.length : cards.filter(function (k) { return k.getAttribute('data-topic') === t; }).length;
      var badge = c.querySelector('.count'); if (badge) badge.textContent = n;
    });

    function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9£ ]+/g, ' '); }
    function apply() {
      var words = norm(state.q).split(/\s+/).filter(Boolean);
      var shown = 0;
      cards.forEach(function (k) {
        var okTopic = state.topic === 'all' || k.getAttribute('data-topic') === state.topic;
        var hay = norm(k.textContent + ' ' + (k.getAttribute('data-keywords') || ''));
        var okText = words.every(function (w) { return hay.indexOf(w) !== -1; });
        var on = okTopic && okText; k.hidden = !on; if (on) shown++;
      });
      var filtering = state.topic !== 'all' || words.length > 0;
      if (feature) feature.hidden = filtering;
      if (latestHead) latestHead.textContent = filtering ? (shown + (shown === 1 ? ' answer' : ' answers')) : 'Latest answers';
      if (empty) empty.hidden = shown > 0;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-topic') === state.topic)); });
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        state.topic = c.getAttribute('data-topic');
        try { history.replaceState(null, '', state.topic === 'all' ? location.pathname : '#' + state.topic); } catch (e) {}
        apply();
      });
    });
    if (input) {
      input.addEventListener('input', function () { state.q = input.value; apply(); });
      document.addEventListener('keydown', function (e) {
        if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
        if (e.key === 'Escape' && document.activeElement === input) { input.value = ''; state.q = ''; apply(); input.blur(); }
      });
    }
    var h = location.hash.replace('#', '');
    if (h && chips.some(function (c) { return c.getAttribute('data-topic') === h; })) state.topic = h;
    apply();
  }

  /* ================= Article page ================= */
  var prose = document.querySelector('.prose');
  if (!prose) return;

  /* Reading progress */
  var bar = document.querySelector('.progress');
  if (bar) {
    var onScroll = function () {
      var r = prose.getBoundingClientRect();
      var total = r.height - window.innerHeight * 0.6;
      var p = Math.min(1, Math.max(0, -r.top / (total > 0 ? total : 1)));
      bar.style.width = (p * 100).toFixed(2) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  /* Reading time */
  var rt = document.querySelector('[data-readtime]');
  if (rt) {
    var words = (prose.innerText || prose.textContent).trim().split(/\s+/).length;
    rt.textContent = Math.max(1, Math.round(words / 220)) + ' min read';
  }

  /* Contents list from the h2s */
  var toc = document.getElementById('toc');
  var heads = Array.prototype.slice.call(prose.querySelectorAll('h2'));
  if (toc && heads.length) {
    heads.forEach(function (hd, i) {
      if (!hd.id) hd.id = (hd.textContent || 's' + i).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      var li = document.createElement('li'); var a = document.createElement('a');
      a.href = '#' + hd.id; a.textContent = hd.textContent; li.appendChild(a); toc.appendChild(li);
    });
    var links = toc.querySelectorAll('a');
    if ('IntersectionObserver' in window) {
      var to = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id); });
        });
      }, { rootMargin: '-15% 0px -70% 0px' });
      heads.forEach(function (hd) { to.observe(hd); });
    }
  } else if (toc) { var wrap = toc.closest('.toc-wrap'); if (wrap) wrap.hidden = true; }

  /* Copy link / share */
  document.querySelectorAll('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = location.href.split('#')[0];
      var done = function () { var t = b.textContent; b.textContent = 'Link copied'; setTimeout(function () { b.textContent = t; }, 1800); };
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
      } else if (navigator.clipboard) { navigator.clipboard.writeText(url).then(done, function () {}); }
      else { var ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); }
    });
  });
})();
