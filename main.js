// LATENT — site behaviour: typed prologue, scroll reveals, subtitle language, scene timecodes, hero loop.
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const film = document.getElementById('film');
const hero = document.querySelector('.hero-video');

// ---------------------------------------------------------------- typed prologue
function type(el, done) {
  const text = el.dataset.text, t = el.querySelector('.t');
  if (reduce) { t.textContent = text; el.classList.add('done'); done && done(); return; }
  el.classList.add('typing');
  let i = 0;
  const step = () => {
    t.textContent = text.slice(0, ++i);
    if (i < text.length) {
      const ch = text[i - 1];
      setTimeout(step, (ch === '.' ? 420 : ch === ' ' ? 70 : 48) + Math.random() * 40);
    } else {
      el.classList.remove('typing'); el.classList.add('done'); done && done();
    }
  };
  setTimeout(step, 300);
}
const typed = [...document.querySelectorAll('.prologue .typed')];
let started = false;
new IntersectionObserver((entries, obs) => {
  if (started || !entries.some(e => e.isIntersecting)) return;
  started = true; obs.disconnect();
  const run = k => { if (k < typed.length) setTimeout(() => type(typed[k], () => run(k + 1)), +(typed[k].dataset.delay || 0)); };
  run(0);
}, { threshold: 0.6 }).observe(document.querySelector('.prompt-box'));

// ---------------------------------------------------------------- reveal on scroll
const io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ---------------------------------------------------------------- subtitles
const select = document.getElementById('subs');
const codes = [...select.options].map(o => o.value);
function preferred() {
  for (const l of navigator.languages || [navigator.language || 'en']) {
    const s = l.toLowerCase();
    if (s.startsWith('zh')) return /(tw|hk|mo|hant)/.test(s) ? 'zh-Hant' : 'zh-Hans';
    if (s.startsWith('pt')) return 'pt-BR';
    const base = s.split('-')[0];
    if (codes.includes(base)) return base;
  }
  return 'en';
}
function showTrack(code) {
  for (const tr of film.textTracks) tr.mode = tr.language === code ? 'showing' : 'disabled';
  select.value = code;
}
showTrack(preferred());
select.addEventListener('change', () => showTrack(select.value));
film.textTracks.addEventListener('change', () => {           // the player's own CC menu
  const on = [...film.textTracks].find(t => t.mode === 'showing');
  select.value = on ? on.language : 'off';
});

// ---------------------------------------------------------------- scene timecodes
function seek(t) {
  const go = () => { film.currentTime = t; film.play().catch(() => {}); };
  if (film.readyState >= 1) go(); else film.addEventListener('loadedmetadata', go, { once: true });
  document.getElementById('watch').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}
document.querySelectorAll('.tc').forEach(b => b.addEventListener('click', () => seek(+b.dataset.t)));

// ---------------------------------------------------------------- hero loop: only while visible
if (reduce) { hero.removeAttribute('autoplay'); hero.pause(); }
else new IntersectionObserver(([e]) => { e.isIntersecting ? hero.play().catch(() => {}) : hero.pause(); }).observe(hero);
film.addEventListener('play', () => hero.pause());
