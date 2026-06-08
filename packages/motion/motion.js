// @lab/motion — клиентский интерактивный слой (vanilla, без зависимостей).
// Подключение в Astro-странице:
//   <script>import { initMotion } from '@lab/motion/motion.js'; initMotion();</script>
// Навешивай в разметке data-атрибуты:
//   data-reveal [--d:<i>]   — появление при скролле (стаггер через CSS-переменную --d)
//   data-count-to=<num> [data-count-dec data-count-pre data-count-suf] — счётчик при попадании в кадр
//   data-parallax [data-parallax-speed=0.25] [data-parallax-scale=1.12] — параллакс фона на скролле
//   data-magnetic [data-mag=0.25] — «магнитная» кнопка к курсору
//   data-tilt [data-tilt-deg=8] — 3D-наклон карточки по курсору
// Уважает prefers-reduced-motion и pointer:fine.

export function initMotion(opts = {}) {
  if (typeof window === 'undefined') return;
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  // 1. Scroll-reveal со стаггером (--d)
  const reveals = document.querySelectorAll('[data-reveal]');
  if (rm) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else if (reveals.length) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  }

  // 2. Анимированные счётчики (count-up в кадре)
  const counters = document.querySelectorAll('[data-count-to]');
  if (counters.length) {
    const fmt = (v, dec) =>
      v.toLocaleString('ru-RU', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const runCount = (el) => {
      const to = parseFloat(el.dataset.countTo);
      const dec = +(el.dataset.countDec || 0);
      const pre = el.dataset.countPre || '';
      const suf = el.dataset.countSuf || '';
      if (rm) {
        el.textContent = pre + fmt(to, dec) + suf;
        return;
      }
      const dur = +(el.dataset.countDur || 1400);
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + fmt(to * e, dec) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            runCount(e.target);
            cio.unobserve(e.target);
          }
        }),
      { threshold: 0.6 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  // 3. Параллакс фона на скролле (rAF-throttle)
  const layers = [...document.querySelectorAll('[data-parallax]')];
  if (layers.length && !rm) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = scrollY;
        layers.forEach((layer) => {
          const sp = +(layer.dataset.parallaxSpeed || 0.25);
          const sc = +(layer.dataset.parallaxScale || 1.12);
          layer.style.transform = `translate3d(0, ${y * sp}px, 0) scale(${sc})`;
        });
        ticking = false;
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
  }

  // 4. Pointer-реактив: магнитные кнопки + наклон карточек (только fine-pointer)
  if (!rm && fine) {
    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      const k = +(btn.dataset.mag || 0.25);
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * k}px, ${
          (e.clientY - r.top - r.height / 2) * (k * 1.6)
        }px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      const deg = +(card.dataset.tiltDeg || 8);
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(720px) rotateX(${-py * (deg * 0.7)}deg) rotateY(${
          px * deg
        }deg) translateY(-5px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }
}

export default { initMotion };
