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
  const track    = document.getElementById('pcarouselTrack');
  const prevBtn  = document.getElementById('pcarouselPrev');
  const nextBtn  = document.getElementById('pcarouselNext');
  const dots     = document.querySelectorAll('#pcarouselDots .pcarousel__dot');
  if (!track) return;

  const slides   = track.querySelectorAll('.pcarousel__slide');
  const total    = slides.length;
  let current    = 1; // start on middle slide
  const GAP      = 24;

  function getOffset() {
    const vw         = track.parentElement.offsetWidth;
    const slideW     = slides[0].offsetWidth;
    const centreLeft = (vw - slideW) / 2;
    return centreLeft - current * (slideW + GAP);
  }

  function go(index) {
    current = Math.max(0, Math.min(total - 1, index));
    track.style.transform = `translateX(${getOffset()}px)`;
    dots.forEach((d, i) => d.classList.toggle('pcarousel__dot--active', i === current));
  }

  // init
  go(1);

  prevBtn.addEventListener('click', () => go(current - 1));
  nextBtn.addEventListener('click', () => go(current + 1));
  dots.forEach(d => d.addEventListener('click', () => go(+d.dataset.dot)));

  // recalc on resize
  window.addEventListener('resize', () => go(current), { passive: true });

  // touch / swipe
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) go(diff > 0 ? current + 1 : current - 1);
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
