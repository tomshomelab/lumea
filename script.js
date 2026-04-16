/* ============================================
   LUMEA — script.js
   ============================================ */

/* ---------- Nav: scroll behaviour ---------- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ---------- Nav: burger / mobile drawer ---------- */
const burger = document.getElementById('burger');
const drawer = document.getElementById('navDrawer');

burger.addEventListener('click', () => {
  const open = drawer.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});

// close drawer on link click
drawer.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    drawer.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

/* ---------- Scroll-reveal (fade-up) ---------- */
const fadeEls = document.querySelectorAll('.fade-up');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // stagger siblings slightly
      const siblings = [...entry.target.parentElement.querySelectorAll('.fade-up:not(.visible)')];
      const delay = siblings.indexOf(entry.target) * 80;
      setTimeout(() => entry.target.classList.add('visible'), delay);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

fadeEls.forEach(el => observer.observe(el));

/* ---------- Hero: trigger fade-up immediately ---------- */
document.querySelectorAll('.hero .fade-up').forEach(el => {
  setTimeout(() => el.classList.add('visible'), 200);
});

/* ---------- Smooth scroll for anchor links ---------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-total')) || 152;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ---------- Video play button (placeholder) ---------- */
const playBtn = document.querySelector('.video-section__play');
if (playBtn) {
  playBtn.addEventListener('click', () => {
    const poster = playBtn.closest('.video-section__poster');
    poster.innerHTML = `<div style="
      width:100%;height:100%;background:#111;display:flex;align-items:center;
      justify-content:center;color:rgba(255,255,255,0.4);font-size:18px;
      font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:0.05em;
    ">[ Video placeholder — embed your video here ]</div>`;
  });
}

/* ---------- Product Carousel ---------- */
(function () {
  const track   = document.getElementById('pcarouselTrack');
  const prevBtn = document.getElementById('pcarouselPrev');
  const nextBtn = document.getElementById('pcarouselNext');
  const dots    = document.querySelectorAll('#pcarouselDots .pcarousel__dot');
  if (!track) return;

  const realSlides = [...track.querySelectorAll('.pcarousel__slide')];
  const total      = realSlides.length;
  const GAP        = 24;

  // Clone first & last slide for seamless infinite loop
  const lastClone  = realSlides[total - 1].cloneNode(true);
  const firstClone = realSlides[0].cloneNode(true);
  [lastClone, firstClone].forEach(c => c.setAttribute('aria-hidden', 'true'));
  track.prepend(lastClone);
  track.append(firstClone);
  // Extended track: [lastClone, 0, 1, 2, firstClone]

  let current = 1; // real first slide is now at index 1

  function allSlides() { return track.querySelectorAll('.pcarousel__slide'); }

  function getOffset(idx) {
    const sl     = allSlides();
    const vw     = track.parentElement.offsetWidth;
    const slideW = sl[0].offsetWidth;
    return (vw - slideW) / 2 - idx * (slideW + GAP);
  }

  function setPos(idx, animated) {
    track.style.transition = animated
      ? 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)'
      : 'none';
    track.style.transform = `translateX(${getOffset(idx)}px)`;
  }

  function syncDots(idx) {
    const real = ((idx - 1) % total + total) % total;
    dots.forEach((d, i) => d.classList.toggle('pcarousel__dot--active', i === real));
  }

  function go(idx) {
    current = idx;
    setPos(current, true);
    syncDots(current);
  }

  // After transition: silently snap from clone to real counterpart
  track.addEventListener('transitionend', () => {
    if (current === 0)         { current = total;     setPos(current, false); }
    else if (current === total + 1) { current = 1;    setPos(current, false); }
  });

  setPos(current, false);
  syncDots(current);

  prevBtn.addEventListener('click', () => go(current - 1));
  nextBtn.addEventListener('click', () => go(current + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => go(i + 1)));

  window.addEventListener('resize', () => setPos(current, false), { passive: true });

  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) go(diff > 0 ? current + 1 : current - 1);
  });
})();

/* ---------- Haircare Carousel (hcarousel) ---------- */
(function () {
  const track   = document.getElementById('hcarouselTrack');
  const prevBtn = document.getElementById('hcarouselPrev');
  const nextBtn = document.getElementById('hcarouselNext');
  const dots    = document.querySelectorAll('#hcarouselDots .hcarousel__dot');
  if (!track) return;

  const realSlides = [...track.querySelectorAll('.hcarousel__slide')];
  const total      = realSlides.length;
  const GAP        = 24;
  let timer;

  // Clone first & last slide for seamless infinite loop
  const lastClone  = realSlides[total - 1].cloneNode(true);
  const firstClone = realSlides[0].cloneNode(true);
  [lastClone, firstClone].forEach(c => c.setAttribute('aria-hidden', 'true'));
  track.prepend(lastClone);
  track.append(firstClone);
  // Extended track: [lastClone, 0, 1, 2, firstClone]

  let current = 1; // real first slide is now at index 1

  function allSlides() { return track.querySelectorAll('.hcarousel__slide'); }

  function getOffset(idx) {
    const sl     = allSlides();
    const vw     = track.parentElement.offsetWidth;
    const slideW = sl[0].offsetWidth;
    return (vw - slideW) / 2 - idx * (slideW + GAP);
  }

  function setPos(idx, animated) {
    track.style.transition = animated
      ? 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)'
      : 'none';
    track.style.transform = `translateX(${getOffset(idx)}px)`;
  }

  function syncDots(idx) {
    const real = ((idx - 1) % total + total) % total;
    dots.forEach((d, i) => d.classList.toggle('hcarousel__dot--active', i === real));
  }

  function go(idx) {
    current = idx;
    setPos(current, true);
    syncDots(current);
  }

  // After transition: silently snap from clone to real counterpart
  track.addEventListener('transitionend', () => {
    if (current === 0)              { current = total; setPos(current, false); }
    else if (current === total + 1) { current = 1;     setPos(current, false); }
  });

  function startTimer() { timer = setInterval(() => go(current + 1), 4500); }
  function resetTimer() { clearInterval(timer); startTimer(); }

  setPos(current, false);
  syncDots(current);
  startTimer();

  prevBtn.addEventListener('click',  () => { go(current - 1); resetTimer(); });
  nextBtn.addEventListener('click',  () => { go(current + 1); resetTimer(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { go(i + 1); resetTimer(); }));

  window.addEventListener('resize', () => setPos(current, false), { passive: true });

  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { go(diff > 0 ? current + 1 : current - 1); resetTimer(); }
  });
})();

/* ---------- Nav active category on scroll ---------- */
const sections = document.querySelectorAll('main section[id]');
const catLinks = document.querySelectorAll('.nav__cat');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 200) current = section.id;
  });
  // no-op for demo; extend if you add matching cat ids
}, { passive: true });
