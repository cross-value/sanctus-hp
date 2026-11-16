/* ==== 株式会社Sanctus ホームページの動き ==== */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 開いた瞬間に1回だけ動いて止まる（英字・見出し・町・ピン）
  requestAnimationFrame(function () { requestAnimationFrame(function () { document.documentElement.classList.add('is-ready'); }); });

  // 吹き出しの中身は、事業カードの見出しと1文目から取る（文の二重管理をしない）
  function info(k) {
    var card = document.getElementById('b' + k);
    var first = (card.querySelector('.desc').textContent.split('。')[0] || '') + '。';
    return [card.dataset.g === 'home' ? '個人・ご家族のお客さま' : '企業・団体のお客さま', card.querySelector('h3').textContent, first];
  }
  var pop = document.getElementById('pop'), pins = document.querySelectorAll('.pin'), openK = null;
  var town = document.getElementById('town'), copy = document.querySelector('.hero-copy');
  function show(pin) {
    var k = pin.dataset.k, d = info(k);
    pins.forEach(function (p) { p.setAttribute('aria-expanded', p === pin ? 'true' : 'false'); });
    document.getElementById('pop-g').textContent = d[0];
    document.getElementById('pop-h').textContent = d[1];
    document.getElementById('pop-t').textContent = d[2];
    document.getElementById('pop-a').href = '#b' + k;
    place(pin);
    pop.classList.add('is-on'); openK = k;
  }
  // 吹き出しの向きは 上 → 右 → 左 → 下 の順に、町の外へ出ず見出しの板とも重ならないものを選ぶ
  function place(pin) {
    var w = town.clientWidth, h = town.clientHeight;
    var x = parseFloat(pin.style.getPropertyValue('--x')) / 100 * w;
    var y = parseFloat(pin.style.getPropertyValue('--y')) / 100 * h;
    var pw = pop.offsetWidth, ph = pop.offsetHeight, head = y - 26;
    var tr = town.getBoundingClientRect(), cr = copy.getBoundingClientRect();
    var card = getComputedStyle(copy).position === 'absolute' ? { l: cr.left - tr.left, t: cr.top - tr.top, r: cr.right - tr.left, b: cr.bottom - tr.top } : null;
    function clampX(v) { return Math.min(Math.max(v, 12), w - pw - 12); }
    var cands = [
      { side: 'up', l: clampX(x - pw / 2), t: y - 58 - ph },
      { side: 'right', l: x + 34, t: head - ph / 2 },
      { side: 'left', l: x - 34 - pw, t: head - ph / 2 },
      { side: 'down', l: clampX(x - pw / 2), t: y + 14 }
    ];
    // ほかのピンの位置（吹き出しで隠さないように避ける）
    var others = [];
    pins.forEach(function (p) {
      if (p === pin) return;
      var px = parseFloat(p.style.getPropertyValue('--x')) / 100 * w, py = parseFloat(p.style.getPropertyValue('--y')) / 100 * h;
      others.push({ l: px - 24, r: px + 24, t: py - 52, b: py });
    });
    function hit(c, o) { return c.l < o.r && c.l + pw > o.l && c.t < o.b && c.t + ph > o.t; }
    function fits(c) {
      if (c.l < 8 || c.l + pw > w - 8 || c.t < 8 || c.t + ph > h - 8) return false;
      if (card && c.l < card.r + 8 && c.l + pw > card.l - 8 && c.t < card.b + 8 && c.t + ph > card.t - 8) return false;
      return true;
    }
    function covers(c) { return others.filter(function (o) { return hit(c, o); }).length; }
    var ok = cands.filter(fits);
    // 収まる向きのうち、ほかのピンを隠す数が一番少ないもの（同じなら 上 → 右 → 左 → 下 の順）
    var c = ok.length ? ok.reduce(function (a, b) { return covers(b) < covers(a) ? b : a; }) : cands[0];
    if (c.side === 'right' || c.side === 'left') c.t = Math.min(Math.max(c.t, 8), h - ph - 8);
    pop.dataset.side = c.side;
    pop.classList.toggle('is-below', c.side === 'down');
    pop.style.left = c.l + 'px';
    pop.style.top = c.t + 'px';
    pop.style.setProperty('--ax', Math.min(Math.max(x - c.l, 24), pw - 24) + 'px');
    pop.style.setProperty('--ay', Math.min(Math.max(head - c.t, 20), ph - 20) + 'px');
  }
  function hide() { pop.classList.remove('is-on'); pins.forEach(function (p) { p.setAttribute('aria-expanded', 'false'); }); openK = null; }
  pins.forEach(function (p) {
    // マウスを乗せて開いた吹き出しは、押しても閉じない（押して開いたものを、もう一度押すと閉じる）
    p.addEventListener('click', function (e) { e.stopPropagation(); if (openK === p.dataset.k && pop.dataset.via === 'click') hide(); else { show(p); pop.dataset.via = 'click'; } });
    p.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && openK !== p.dataset.k) { show(p); pop.dataset.via = 'hover'; } });
    p.addEventListener('focus', function () { if (openK !== p.dataset.k) { show(p); pop.dataset.via = 'focus'; } });
  });
  document.addEventListener('click', function (e) { if (!pop.contains(e.target)) hide(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });

  // 札を押すと、町のその場所を見せてからピンを開く（スマホは町を横に送る）
  var ts = document.getElementById('townScroll');
  document.querySelectorAll('.lg').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var pin = document.querySelector('.pin[data-k="' + b.dataset.k + '"]');
      if (ts.scrollWidth > ts.clientWidth) {
        var x = parseFloat(pin.style.getPropertyValue('--x')) / 100 * ts.scrollWidth;
        ts.scrollTo({ left: Math.max(0, x - ts.clientWidth / 2), behavior: reduced ? 'auto' : 'smooth' });
        var r = ts.getBoundingClientRect();
        if (r.top < 0 || r.bottom > innerHeight) window.scrollTo({ top: window.scrollY + r.top - 60, behavior: reduced ? 'auto' : 'smooth' });
      }
      show(pin); pop.dataset.via = 'click';
    });
  });

  // スマホでは町を横にずらして見る。開いたときに左から真ん中へ1回だけ送り、横に動かせることを見せる
  if (ts.scrollWidth > ts.clientWidth) {
    var mid = (ts.scrollWidth - ts.clientWidth) / 2;
    if (reduced) ts.scrollLeft = mid;
    else { ts.scrollLeft = 0; setTimeout(function () { ts.scrollTo({ left: mid, behavior: 'smooth' }); }, 900); }
  }

  // お客さまで絞り込む
  var fb = document.querySelectorAll('.fbtn'), cards = document.querySelectorAll('.card');
  fb.forEach(function (b) {
    b.addEventListener('click', function () {
      fb.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      cards.forEach(function (c) { c.classList.toggle('is-hidden', b.dataset.f !== 'all' && c.dataset.g !== b.dataset.f); });
    });
  });

  // 下の帯の「個人情報の取り扱い」を押したら、折りたたみを開く
  function openPrivacy() { if (location.hash === '#privacy') document.querySelector('.privacy').open = true; }
  window.addEventListener('hashchange', openPrivacy); openPrivacy();

  // 上の帯と、先頭へ戻るボタン
  var hd = document.getElementById('hd'), top = document.getElementById('totop');
  window.addEventListener('scroll', function () { var y = window.scrollY; hd.classList.toggle('is-scrolled', y > 40); top.classList.toggle('is-on', y > 600); }, { passive: true });

  // スクロールで区画が下から並ぶ
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { threshold: 0.12 });
  document.querySelectorAll('[data-rise]').forEach(function (n) { if (reduced) n.classList.add('is-in'); else io.observe(n); });
})();
