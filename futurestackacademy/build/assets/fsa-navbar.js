// Floating glass navbar: dark glass over the hero, light glass after 80px of scroll,
// plus an iOS-style sliding indicator behind the nav links.
// Runs right after </header>, before the hero is parsed, so it starts in the dark
// state and re-checks for a dark hero once the DOM is ready.
(function () {
  var header = document.querySelector('[data-cit-header]');
  if (!header) return;

  /* ---------- dark / scrolled state ---------- */
  var hasDarkHero = true;
  var hero = null;
  var lastY = window.scrollY;
  function firstScreenEnd() {
    // the "first page" ends at the bottom of the hero, or one screen height if there is none
    if (hero) return hero.getBoundingClientRect().bottom + window.scrollY - 40;
    return window.innerHeight;
  }
  function update() {
    var y = window.scrollY;
    var scrolled = !hasDarkHero || y > 80;
    header.classList.toggle('fsa-nav--scrolled', scrolled);
    header.classList.toggle('fsa-nav--dark', !scrolled);

    // leave with an animation after the first screen; come back when scrolling up or to the top
    var past = y > firstScreenEnd();
    if (!past) header.classList.remove('fsa-nav--hidden');
    else if (y > lastY + 4) header.classList.add('fsa-nav--hidden');
    else if (y < lastY - 8) header.classList.remove('fsa-nav--hidden');
    if (Math.abs(y - lastY) > 4) lastY = y;
  }
  update();
  document.addEventListener('DOMContentLoaded', function () {
    hero = document.querySelector('[data-fsa-hero], .fsa-hero');
    hasDarkHero = !!hero;
    update();
  });
  window.addEventListener('scroll', update, { passive: true });
  // keep the bar visible while someone is using it with the keyboard
  header.addEventListener('focusin', function () { header.classList.remove('fsa-nav--hidden'); });

  /* ---------- sliding indicator ---------- */
  var nav = header.querySelector('nav');
  if (!nav) return;
  var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
  if (!links.length) return;
  var active = nav.querySelector('a.font-bold') || null;
  var KEY = 'fsaNavFrom';

  var pill = document.createElement('span');
  pill.className = 'fsa-nav-indicator';
  pill.setAttribute('aria-hidden', 'true');
  nav.insertBefore(pill, nav.firstChild);

  function rectOf(a) {
    var n = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
    return { x: r.left - n.left, y: r.top - n.top, w: r.width, h: r.height };
  }
  function place(r, instant) {
    if (instant) pill.classList.add('is-instant');
    pill.style.width = r.w + 'px';
    pill.style.height = r.h + 'px';
    pill.style.transform = 'translate(' + r.x + 'px,' + r.y + 'px)';
    pill.style.opacity = '1';
    if (instant) { void pill.offsetWidth; pill.classList.remove('is-instant'); }
  }
  function hide() { pill.style.opacity = '0'; }
  function mark(a) {
    links.forEach(function (l) { l.classList.toggle('fsa-nav-on', l === a); });
  }
  function rest() {
    if (active) { place(rectOf(active)); mark(active); } else { hide(); mark(null); }
  }

  function init() {
    var from = null;
    try { from = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (e) {}
    if (active && from && typeof from.x === 'number') {
      // start where the pill was on the previous page, then glide to the new item
      place(from, true);
      requestAnimationFrame(function () { requestAnimationFrame(rest); });
    } else if (active) {
      place(rectOf(active), true); mark(active);
    } else {
      hide();
    }
  }

  links.forEach(function (a) {
    a.addEventListener('mouseenter', function () {
      if (pill.style.opacity === '0') place(rectOf(a), true);
      place(rectOf(a)); mark(a);
    });
    a.addEventListener('focus', function () { place(rectOf(a)); mark(a); });
    a.addEventListener('click', function () {
      // remember where the pill was so the next page can animate from it
      var r = active ? rectOf(active) : rectOf(a);
      try { sessionStorage.setItem(KEY, JSON.stringify(r)); } catch (e) {}
      place(rectOf(a)); mark(a);
    });
  });
  nav.addEventListener('mouseleave', rest);
  nav.addEventListener('focusout', function (e) { if (!nav.contains(e.relatedTarget)) rest(); });
  window.addEventListener('resize', function () { if (active) place(rectOf(active), true); });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else init();
})();
