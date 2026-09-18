/* ============================================================
   Dr. Saee Anawalikar — interactions
   ============================================================ */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const isTouch = window.matchMedia('(hover: none)').matches;

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    // Stops the mobile URL bar showing/hiding from triggering full refreshes.
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  /* ---------------- Smooth scroll (Lenis) ---------------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: -10 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };

  /* ---------------- Footer year ---------------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------------- Split headings into words ---------------- */
  document.querySelectorAll('[data-split]').forEach((el) => {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((chunk) => {
            if (!chunk.trim()) { frag.appendChild(document.createTextNode(chunk)); return; }
            const word = document.createElement('span');
            word.className = 'word';
            const inner = document.createElement('span');
            inner.className = 'word-i';
            inner.textContent = chunk;
            word.appendChild(inner);
            frag.appendChild(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.classList.contains('word')) {
          walk(child);
        }
      });
    };
    walk(el);
  });

  /* ---------------- Entrance / scroll animations ---------------- */
  if (hasGSAP && !reduced) {
    // Headings: masked word reveal
    document.querySelectorAll('[data-split]').forEach((el) => {
      const words = el.querySelectorAll('.word-i');
      if (!words.length) return;
      gsap.to(words, {
        y: '0%',
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.055,
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

    // Generic fades — batched into a single ScrollTrigger instead of ~40 separate
    // ones, which keeps per-scroll bookkeeping cheap.
    ScrollTrigger.batch('[data-anim="fade"]', {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.07,
        overwrite: true,
      }),
    });

    // Image clip-path wipes. data-zoom holds the resting scale (crops tighter).
    gsap.utils.toArray('[data-reveal-img]').forEach((fig) => {
      const img = fig.querySelector('img');
      if (!img) return;
      const rest = parseFloat(fig.dataset.zoom) || 1;
      gsap.fromTo(img,
        { clipPath: 'inset(100% 0 0 0)', scale: rest * 1.16 },
        {
          clipPath: 'inset(0% 0 0 0)',
          scale: rest,
          duration: 1.5,
          ease: 'expo.out',
          scrollTrigger: { trigger: fig, start: 'top 85%' },
        }
      );
    });

    // Depth parallax between stacked figures
    gsap.utils.toArray('[data-parallax]').forEach((el) => {
      gsap.to(el, {
        yPercent: parseFloat(el.dataset.parallax) || 0,
        ease: 'none',
        scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // Hero background parallax
    const heroBg = document.getElementById('heroBg');
    if (heroBg) {
      gsap.to(heroBg, {
        yPercent: 16,
        ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
      });
    }


    // Case grid stagger on first view
    gsap.utils.toArray('.case-panel').forEach((panel) => {
      gsap.from(panel.querySelectorAll('.case'), {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: 'power3.out',
        stagger: { each: 0.05, from: 'start' },
        scrollTrigger: { trigger: panel, start: 'top 85%' },
      });
    });
  }

  /* ---------------- Scroll progress + sticky header + active link ---------------- */
  const header = document.getElementById('siteHeader');
  const progressFill = document.getElementById('progressFill');
  const navAnchors = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = navAnchors
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-stuck', y > 40);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progressFill) progressFill.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;

    const mid = y + window.innerHeight * 0.35;
    let active = null;
    sections.forEach((sec) => { if (sec.offsetTop <= mid) active = sec; });
    navAnchors.forEach((a) => {
      a.classList.toggle('is-active', !!active && a.getAttribute('href') === `#${active.id}`);
    });
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------- Nav: smooth anchors + mobile menu ---------------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  const setMenu = (open) => {
    navLinks.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (lenis) open ? lenis.stop() : lenis.start();
  };

  navToggle.addEventListener('click', () => {
    setMenu(!navLinks.classList.contains('open'));
    navToggle.blur(); // don't leave a focus ring boxed around the X after a tap
  });
  document.getElementById('navScrim').addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) setMenu(false);
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      setMenu(false);
      scrollTo(target);
    });
  });

  /* ---------------- Counters ---------------- */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const pad = parseInt(el.dataset.pad, 10) || 0;
    const render = (v) => {
      const n = String(Math.round(v));
      el.textContent = (pad ? n.padStart(pad, '0') : n) + suffix;
    };

    if (!hasGSAP || reduced) { render(target); return; }

    // immediateRender:false keeps the real value in the markup visible until the
    // count-up actually starts, so a trigger that never fires can't leave a "0".
    const obj = { v: 0 };
    gsap.fromTo(obj, { v: 0 }, {
      v: target,
      duration: 1.8,
      ease: 'power2.out',
      immediateRender: false,
      onUpdate: () => render(obj.v),
      scrollTrigger: { trigger: el, start: 'top 92%' },
    });
  });

  /* ---------------- Case filters ---------------- */
  const filters = document.querySelectorAll('#cases .filter');
  const panels = document.querySelectorAll('#cases .case-panel');
  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.tab;
      filters.forEach((f) => f.classList.toggle('active', f === btn));
      panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === key));

      const active = document.querySelector(`.case-panel[data-panel="${key}"]`);
      if (hasGSAP && !reduced && active) {
        gsap.fromTo(active.querySelectorAll('.case'),
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.035, clearProps: 'transform' }
        );
      }
      if (hasGSAP) ScrollTrigger.refresh();
    });
  });

  /* ---------------- Gallery rail (built from files + drag to scroll) ---------------- */
  const rail = document.getElementById('journeyRail');
  if (rail) {
    // Prizes and recognitions lead the gallery, then postgraduate life.
    const GALLERY = [
      { src: 'assets/images/prizes/best-postgraduate-student',        label: 'Best Postgraduate Student' },
      { src: 'assets/images/prizes/best-postgraduate-student-1',      label: 'Best Postgraduate Student' },
      { src: 'assets/images/prizes/best-paper-adai-national-conference',   label: 'Best Paper — ADAI National Conference' },
      { src: 'assets/images/prizes/best-poster-iacde-national-convention', label: 'Best Poster — IACDE National Convention' },
      { src: 'assets/images/prizes/best-poster-presentation-star-summit',  label: 'Best Poster Presentation — STAR Summit' },
      { src: 'assets/images/prizes/star-summit-poster-presentation',  label: 'Poster Presentation — STAR Summit' },
      { src: 'assets/images/prizes/pfa-fellowship',                   label: 'PFA Fellowship' },
      { src: 'assets/images/prizes/cbct-workshop',                    label: 'CBCT Workshop' },
      { src: 'assets/images/prizes/btr-file-retrieval-workshop',      label: 'BTR File Retrieval Workshop' },
    ];
    for (let i = 1; i <= 10; i++) {
      GALLERY.push({ src: `assets/images/journey/photo-${i}`, label: 'Postgraduate life' });
    }

    GALLERY.forEach(({ src, label }) => {
      const fig = document.createElement('figure');
      fig.dataset.full = `${src}.jpg`;
      fig.innerHTML =
        `<img src="${src}-thumb.jpg" alt="${label}" loading="lazy" decoding="async">` +
        `<figcaption>${label}</figcaption>`;
      rail.appendChild(fig);
    });


    // On the mobile mosaic the full set is very tall, so collapse it behind a
    // "see more". The CSS rule that hides the overflow only exists under the
    // mobile breakpoint, so this class is inert on desktop.
    const moreBtn = document.getElementById('galleryMore');
    if (moreBtn) {
      rail.classList.add('is-collapsed');
      moreBtn.addEventListener('click', () => {
        const collapsed = rail.classList.toggle('is-collapsed');
        moreBtn.setAttribute('aria-expanded', String(!collapsed));
        moreBtn.querySelector('span').textContent = collapsed ? 'See more' : 'Show less';
        if (collapsed) rail.scrollIntoView({ block: 'start', behavior: 'smooth' });
        if (hasGSAP) ScrollTrigger.refresh();
      });
    }

    // Drag-to-scroll only applies while the rail is actually a horizontal strip;
    // on narrow screens it becomes a static mosaic grid.
    const canDrag = () => rail.scrollWidth > rail.clientWidth + 4;

    let down = false, startX = 0, startScroll = 0, moved = 0;
    rail.addEventListener('pointerdown', (e) => {
      if (!canDrag()) return;
      down = true; moved = 0;
      startX = e.clientX;
      startScroll = rail.scrollLeft;
      rail.classList.add('is-dragging');
      rail.setPointerCapture(e.pointerId);
    });
    rail.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.abs(dx);
      rail.scrollLeft = startScroll - dx;
    });
    const endDrag = () => { down = false; rail.classList.remove('is-dragging'); };
    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);
    rail.addEventListener('click', (e) => {
      if (moved > 6) { e.stopPropagation(); e.preventDefault(); }
    }, true);
  }

  /* ---------------- Gallery: Photos / Videos tabs ---------------- */
  const gTabs = document.querySelectorAll('[data-gtab]');
  const gPanels = document.querySelectorAll('[data-gpanel]');
  const vRail = document.getElementById('videoRail');
  const vNav = document.querySelector('.video-nav');
  const vPrev = document.getElementById('videoPrev');
  const vNext = document.getElementById('videoNext');

  // Arrows only appear when the cards actually overflow, and grey out at the ends
  const updateVideoNav = () => {
    if (!vRail || !vNav) return;
    const overflow = vRail.scrollWidth > vRail.clientWidth + 4;
    vNav.hidden = !overflow;
    vPrev.disabled = vRail.scrollLeft <= 2;
    vNext.disabled = vRail.scrollLeft + vRail.clientWidth >= vRail.scrollWidth - 2;
  };

  gTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.gtab;
      gTabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', String(on));
      });
      gPanels.forEach((p) => p.classList.toggle('active', p.dataset.gpanel === key));
      updateVideoNav();
      if (hasGSAP) ScrollTrigger.refresh();
    });
  });

  if (vRail) {
    const step = () => {
      const card = vRail.querySelector('.video-card');
      return card ? card.getBoundingClientRect().width + 16 : 300;
    };
    vPrev.addEventListener('click', () => vRail.scrollBy({ left: -step(), behavior: 'smooth' }));
    vNext.addEventListener('click', () => vRail.scrollBy({ left: step(), behavior: 'smooth' }));
    vRail.addEventListener('scroll', updateVideoNav, { passive: true });
    window.addEventListener('resize', updateVideoNav);
  }

  /* ---------------- Video modal ---------------- */
  const vModal = document.getElementById('videoModal');
  const vPlayer = document.getElementById('videoPlayer');
  const vTitle = document.getElementById('videoTitle');
  const vClose = document.getElementById('videoClose');
  let vOpener = null;

  const openVideo = (card) => {
    vOpener = card;
    vPlayer.poster = card.dataset.poster;
    vPlayer.src = card.dataset.video;
    vTitle.textContent = card.dataset.title;
    vModal.hidden = false;
    if (lenis) lenis.stop();
    vClose.focus();
    if (hasGSAP && !reduced) gsap.fromTo(vModal, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    // Opened by a click, so play() is allowed; if a browser still refuses,
    // the controls are there and the viewer can press play themselves.
    const p = vPlayer.play();
    if (p && p.catch) p.catch(() => {});
  };

  const closeVideo = () => {
    if (!vModal || vModal.hidden) return;
    vPlayer.pause();
    vPlayer.removeAttribute('src');   // stops the download, not just playback
    vPlayer.load();
    vModal.hidden = true;
    if (lenis) lenis.start();
    if (vOpener) vOpener.focus();
  };

  if (vModal) {
    document.querySelectorAll('.video-card').forEach((card) => {
      card.addEventListener('click', () => openVideo(card));
    });
    vClose.addEventListener('click', closeVideo);
    vModal.addEventListener('click', (e) => { if (e.target === vModal) closeVideo(); });
    document.addEventListener('keydown', (e) => {
      if (vModal.hidden) return;
      if (e.key === 'Escape') closeVideo();
      // keep keyboard focus inside the dialog
      if (e.key === 'Tab') {
        const stops = [vClose, vPlayer];
        const i = stops.indexOf(document.activeElement);
        e.preventDefault();
        stops[(i + (e.shiftKey ? -1 : 1) + stops.length) % stops.length].focus();
      }
    });
  }

  /* ---------------- Lightbox ---------------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');

  const openLightbox = (src, caption) => {
    lightboxImg.src = src;
    lightboxImg.alt = caption || '';
    lightboxCaption.textContent = caption || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
    if (hasGSAP && !reduced) {
      gsap.fromTo(lightbox, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
      gsap.fromTo(lightboxImg, { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'expo.out' });
    }
  };

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
  };

  document.addEventListener('click', (e) => {
    const item = e.target.closest('[data-full]');
    if (!item) return;
    const caption = item.querySelector('figcaption')?.textContent.replace(/^\d+/, '').trim()
      || item.querySelector('h3')?.textContent.trim()
      || '';
    openLightbox(item.dataset.full, caption);
  });

  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  /* ---------------- Testimonials ---------------- */
  const quotes = [...document.querySelectorAll('.quote')];
  const quoteStage = document.getElementById('quoteStage');
  const quoteCurrent = document.getElementById('quoteCurrent');
  const quoteTotal = document.getElementById('quoteTotal');

  const quoteImage = document.getElementById('quoteImage');
  // Cycles alongside the quotes. Add more paths here and they join the rotation.
  const QUOTE_IMAGES = [
    'assets/images/testimonials/microscope-1.jpg',
  ];
  // Warm the cache so swapping never shows a blank frame mid-crossfade
  QUOTE_IMAGES.forEach((src) => { const i = new Image(); i.src = src; });

  if (quotes.length && quoteStage) {
    let qi = 0;
    let qTimer = null;
    let qTl = null;
    let imgTl = null;

    quoteTotal.textContent = quotes.length;

    // Quotes are absolutely stacked, so the stage needs an explicit height —
    // the tallest quote wins, remeasured whenever the width changes.
    const sizeStage = () => {
      const prevH = quoteStage.style.height;
      quoteStage.style.height = 'auto';
      const tallest = quotes.reduce((max, q) => Math.max(max, q.offsetHeight), 0);
      quoteStage.style.height = tallest ? `${tallest}px` : prevH;
      if (hasGSAP) ScrollTrigger.refresh();
    };

    const showQuote = (next, dir = 1) => {
      const from = quotes[qi];
      const to = quotes[(next + quotes.length) % quotes.length];
      if (to === from) return;

      qi = (next + quotes.length) % quotes.length;
      quoteCurrent.textContent = qi + 1;

      quotes.forEach((q) => q.classList.remove('active'));
      to.classList.add('active');

      // Swap the accompanying photo, crossfading so it doesn't pop
      if (quoteImage && QUOTE_IMAGES.length) {
        const next = QUOTE_IMAGES[qi % QUOTE_IMAGES.length];
        if (quoteImage.getAttribute('src') !== next) {
          if (hasGSAP && !reduced) {
            // Kill any in-flight swap first, otherwise a finishing crossfade
            // can overwrite a newer image when clicks come quickly.
            if (imgTl) imgTl.kill();
            imgTl = gsap.timeline()
              .to(quoteImage, { opacity: 0, duration: 0.28, ease: 'power2.in' })
              .add(() => { quoteImage.src = next; })
              .to(quoteImage, { opacity: 1, duration: 0.5, ease: 'power2.out' });
          } else {
            quoteImage.src = next;
          }
        }
      }

      if (!hasGSAP || reduced) {
        gsap?.set?.(quotes, { clearProps: 'all' });
        return;
      }

      if (qTl) qTl.kill();
      qTl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        .to(from, { opacity: 0, y: -18 * dir, duration: 0.35, ease: 'power2.in' }, 0)
        .fromTo(to, { opacity: 0, y: 18 * dir }, { opacity: 1, y: 0, duration: 0.6 }, 0.22);
    };

    const restart = () => {
      clearInterval(qTimer);
      if (!reduced) qTimer = setInterval(() => showQuote(qi + 1, 1), 7000);
    };

    document.getElementById('quoteNext').addEventListener('click', () => { showQuote(qi + 1, 1); restart(); });
    document.getElementById('quotePrev').addEventListener('click', () => { showQuote(qi - 1, -1); restart(); });

    sizeStage();
    window.addEventListener('load', sizeStage);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeStage);

    let resizeTimer;
    let lastW = window.innerWidth;
    window.addEventListener('resize', () => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(sizeStage, 180);
    });

    restart();
  }

  /* ---------------- Magnetic buttons ---------------- */
  if (hasGSAP && !reduced && !isTouch) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });

      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.35);
        yTo((e.clientY - r.top - r.height / 2) * 0.45);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------------- Case tilt ---------------- */
  if (hasGSAP && !reduced && !isTouch) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      const rotX = gsap.quickTo(card, 'rotationX', { duration: 0.7, ease: 'power3' });
      const rotY = gsap.quickTo(card, 'rotationY', { duration: 0.7, ease: 'power3' });

      card.addEventListener('pointerenter', () => {
        gsap.set(card, { transformPerspective: 900 });
      });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rotY(px * 7);
        rotX(-py * 7);
      });
      card.addEventListener('pointerleave', () => { rotX(0); rotY(0); });
    });
  }

  /* ---------------- Keep ScrollTrigger honest after images load ---------------- */
  if (hasGSAP) {
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
