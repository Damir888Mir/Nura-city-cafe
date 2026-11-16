(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Прелоадер ---------- */
  document.body.classList.add('is-loading');
  const finishLoading = () => {
    const pre = $('#preloader');
    if (pre) { pre.classList.add('is-done'); setTimeout(() => pre.remove(), 1200); }
    document.body.classList.remove('is-loading');
    requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));
  };
  const minTime = reduce ? 0 : 1300;
  const start = performance.now();
  let loaded = false;
  const onLoad = () => {
    if (loaded) return; loaded = true;
    setTimeout(finishLoading, Math.max(0, minTime - (performance.now() - start)));
  };
  // ждём только главное фото и шрифты, а не карту
  const heroImg = $('.arch--hero img');
  Promise.all([
    heroImg && !heroImg.complete ? new Promise(r => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); }) : null,
    document.fonts ? document.fonts.ready : null
  ]).then(onLoad);
  setTimeout(onLoad, 2500); // страховка

  /* ---------- Шапка ---------- */
  const header = $('#header');
  const wa = $('.wa-float');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 30);
    header.classList.toggle('is-hidden', y > 500 && y > lastY && !nav.classList.contains('is-open'));
    wa.classList.toggle('is-visible', y > 600);
    lastY = y;
  };

  /* ---------- Мобильное меню ---------- */
  const burger = $('#burger');
  const nav = $('#nav');
  const toggleNav = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggleNav(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => toggleNav(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { toggleNav(false); closeLightbox(); } });

  /* ---------- Появление при скролле ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      if (en.target.querySelector('[data-count]') || en.target.matches('.stat')) runCounter(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .reveal-img').forEach(el => io.observe(el));

  /* ---------- Счётчики ---------- */
  function runCounter(scope) {
    const el = scope.querySelector('[data-count]');
    if (!el || el.dataset.done) return;
    el.dataset.done = 1;
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || 0, 10);
    const suffix = el.dataset.suffix || '';
    const fmt = v => v.toFixed(dec).replace('.', ',') + suffix;
    if (reduce) { el.textContent = fmt(target); return; }
    const dur = 1800, t0 = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(target * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Параллакс ---------- */
  const parallaxEls = $$('[data-parallax]');
  const parallax = () => {
    if (reduce || window.innerWidth < 900) return;
    const vh = window.innerHeight;
    parallaxEls.forEach(el => {
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(-mid * parseFloat(el.dataset.parallax)).toFixed(1)}px, 0)`;
    });
  };

  /* ---------- Активный пункт навигации ---------- */
  const sections = $$('main section[id]');
  const navLinks = $$('.nav a[href^="#"]');
  const spy = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = '';
    sections.forEach(s => { if (s.offsetTop <= y) current = s.id; });
    navLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + current));
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); parallax(); spy(); ticking = false; });
  }, { passive: true });
  onScroll(); parallax(); spy();

  /* ---------- Магнитные кнопки ---------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Вкладки меню ---------- */
  const tabs = $$('.tab');
  const ink = $('.tabs__ink');
  const moveInk = (tab) => {
    ink.style.width = tab.offsetWidth + 'px';
    ink.style.transform = `translateX(${tab.offsetLeft - 6}px)`;
  };
  const selectTab = (tab) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      panel.classList.toggle('is-active', on);
    });
    moveInk(tab);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus(); selectTab(next);
    });
  });
  // карточки «Что мы готовим» открывают нужную вкладку меню
  $$('.card[data-tab]').forEach(card => card.addEventListener('click', () => {
    const t = document.getElementById(card.dataset.tab);
    if (t) selectTab(t);
  }));
  const syncInk = () => moveInk($('.tab.is-active'));
  window.addEventListener('resize', syncInk);
  document.fonts?.ready.then(syncInk);
  syncInk();

  /* ---------- Слайдер отзывов ---------- */
  const slides = $$('.review');
  const dots = $('.slider__dots');
  let idx = 0, timer;
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Отзыв ${i + 1}`);
    b.addEventListener('click', () => go(i, true));
    dots.appendChild(b);
  });
  const go = (i, user) => {
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === idx));
    $$('button', dots).forEach((d, k) => d.classList.toggle('is-active', k === idx));
    if (user) restart();
  };
  const restart = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => go(idx + 1), 7000); };
  $$('.slider__btn').forEach(b => b.addEventListener('click', () => go(idx + parseInt(b.dataset.dir, 10), true)));
  go(0); restart();

  /* ---------- Видео ---------- */
  const film = $('#film');
  const video = $('#filmVideo');
  const filmBtn = $('#filmToggle');
  const filmLabel = $('.film__label', filmBtn);
  let userPaused = false;
  const ensureSrc = () => {
    if (video.src) return;
    video.src = window.innerWidth <= 700 ? video.dataset.srcSm : video.dataset.src;
  };
  const setFilmState = (playing) => {
    film.classList.toggle('is-playing', playing);
    filmBtn.setAttribute('aria-pressed', playing);
    filmLabel.textContent = playing ? 'Пауза' : 'Смотреть видео';
  };
  const playFilm = () => { ensureSrc(); const p = video.play(); if (p) p.catch(() => setFilmState(false)); };
  video.addEventListener('play', () => setFilmState(true));
  video.addEventListener('pause', () => setFilmState(false));
  filmBtn.addEventListener('click', () => {
    if (video.paused) { userPaused = false; playFilm(); } else { userPaused = true; video.pause(); }
  });
  video.addEventListener('click', () => filmBtn.click());
  new IntersectionObserver((en) => {
    en.forEach(e => {
      if (e.isIntersecting) { if (!reduce && !userPaused) playFilm(); }
      else if (!video.paused) video.pause();
    });
  }, { threshold: 0.35 }).observe(film);

  /* ---------- Лайтбокс ---------- */
  const lb = $('#lightbox');
  const lbImg = $('img', lb);
  let lastFocus;
  $$('.m-btn').forEach(btn => btn.addEventListener('click', () => {
    lastFocus = btn;
    lbImg.src = btn.dataset.full;
    lbImg.alt = btn.querySelector('img').alt;
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    $('.lightbox__close', lb).focus();
    document.body.style.overflow = 'hidden';
  }));
  function closeLightbox() {
    if (lb.hidden) return;
    lb.classList.remove('is-open');
    setTimeout(() => { lb.hidden = true; }, 350);
    document.body.style.overflow = '';
    lastFocus?.focus();
  }
  lb.addEventListener('click', e => { if (e.target !== lbImg) closeLightbox(); });

  /* ---------- Открыто / закрыто (время Алматы, UTC+5) ---------- */
  const status = $('#openStatus');
  if (status) {
    const now = new Date();
    const almaty = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5 * 3600000);
    const h = almaty.getHours() + almaty.getMinutes() / 60;
    const open = h >= 8 && h < 22;
    status.textContent = open ? 'Сейчас открыто' : 'Сейчас закрыто';
    status.classList.add(open ? 'is-open' : 'is-closed');
  }
  const year = $('#year'); if (year) year.textContent = new Date().getFullYear();

  /* ---------- Карта 2ГИС ---------- */
  const LAT = 43.246771, LON = 76.912125;
  const mapEl = $('#map');
  const fallback = () => {
    if (mapEl.dataset.ready) return;
    mapEl.innerHTML = '<div class="map-fallback"><div><p>Nūra city cafe<br>ЖК Novella, Байзакова, 225</p><a class="btn btn--dark" href="https://2gis.kz/almaty/firm/70000001110583932" target="_blank" rel="noopener">Открыть карту 2ГИС</a></div></div>';
  };
  const initMap = () => {
    const L = window.L;
    if (!L || mapEl.dataset.ready) return;
    mapEl.dataset.ready = 1;
    const map = L.map(mapEl, { center: [LAT, LON], zoom: 17, scrollWheelZoom: false, zoomControl: true });
    L.tileLayer('https://tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1', {
      subdomains: '0123', maxZoom: 18,
      attribution: '&copy; <a href="https://2gis.kz/almaty" target="_blank" rel="noopener">2ГИС</a>'
    }).addTo(map);
    // колесо мыши включается после клика по карте, чтобы не мешать прокрутке страницы
    map.on('click focus', () => map.scrollWheelZoom.enable());
    mapEl.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());
    const icon = L.divIcon({
      className: 'map-pin-wrap',
      html: '<div class="map-pin"><svg viewBox="0 0 100 100"><use href="#logo"/></svg></div>',
      iconSize: [54, 54], iconAnchor: [27, 54], popupAnchor: [0, -54]
    });
    L.marker([LAT, LON], { icon, title: 'Nūra city cafe' }).addTo(map)
      .bindPopup('<b>Nūra city cafe</b><br>ЖК Novella, Байзакова, 225, 1 этаж<br>Ежедневно 08:00–22:00<br><a href="https://2gis.kz/almaty/firm/70000001110583932" target="_blank" rel="noopener">Маршрут в 2ГИС →</a>')
      .openPopup();
  };
  // Карта грузится, когда секция контактов близко к экрану
  let mapStarted = false;
  const startMap = () => {
    if (mapStarted) return;
    mapStarted = true;
    mapIO.disconnect();
    let tries = 0;
    const wait = () => {
      if (window.L) return initMap();
      if (++tries > 40) return fallback();
      setTimeout(wait, 250);
    };
    wait();
  };
  const mapIO = new IntersectionObserver((en) => { if (en[0].isIntersecting) startMap(); }, { rootMargin: '600px' });
  mapIO.observe(mapEl);
  // запасной вариант: карта всё равно загрузится через пару секунд после открытия страницы
  window.addEventListener('load', () => setTimeout(startMap, 2500));
})();
