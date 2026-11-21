/* ==========================================================================
   HERLOOM — theme.js (vanilla, no dependencies)
   ========================================================================== */
(() => {
  'use strict';

  const H = window.Herloom || { routes: {}, strings: {} };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conn = navigator.connection || {};
  const saveData = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
  };

  /* ---------- Toast ---------- */
  function toast(msg) {
    const region = $('[data-toasts]');
    if (!region) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    region.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal(root = document) {
    const els = $$('.reveal:not(.is-visible)', root);
    if (reducedMotion || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-visible')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(e => io.observe(e));
  }

  /* ---------- Header ---------- */
  function initHeader() {
    const header = $('[data-header]');
    if (!header) return;
    const transparent = header.hasAttribute('data-transparent');
    const onScroll = () => {
      const y = window.scrollY > 40;
      header.classList.toggle('is-scrolled', y);
      if (transparent) header.classList.toggle('is-solid', y || header.matches(':hover') || !!$('[data-mega].is-open', header));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    if (transparent) {
      header.addEventListener('mouseenter', () => header.classList.add('is-solid'));
      header.addEventListener('mouseleave', onScroll);
      header.addEventListener('focusin', () => header.classList.add('is-solid'));
    }
    onScroll();

    $$('[data-mega]', header).forEach(item => {
      const btn = $('button', item);
      const panel = $('.mega', item);
      let timer;
      const open = () => { clearTimeout(timer); item.classList.add('is-open'); panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); header.classList.add('is-solid'); };
      const close = () => { item.classList.remove('is-open'); panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); onScroll(); };
      btn.addEventListener('click', () => (panel.hidden ? open() : close()));
      if (window.matchMedia('(hover: hover)').matches) {
        item.addEventListener('mouseenter', open);
        item.addEventListener('mouseleave', () => { timer = setTimeout(close, 120); });
      }
      item.addEventListener('keydown', e => { if (e.key === 'Escape') { close(); btn.focus(); } });
      item.addEventListener('focusout', e => { if (!item.contains(e.relatedTarget)) close(); });
    });
  }

  /* ---------- Drawers (focus trap, Esc, scroll lock) ---------- */
  const Drawer = {
    active: null, returnFocus: null,
    open(name, trigger) {
      const d = $(`[data-drawer="${name}"]`);
      if (!d) return false;
      if (this.active && this.active !== d) this.close(true);
      this.returnFocus = trigger || document.activeElement;
      d.classList.add('is-open');
      d.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      this.active = d;
      $$(`[aria-controls="${d.id}"]`).forEach(b => b.setAttribute('aria-expanded', 'true'));
      const focusTarget = $('input:not([type=hidden]):not([disabled]), button, a', $('.drawer__panel', d)) || $('.drawer__panel', d);
      setTimeout(() => (name === 'search' ? $('[data-predictive-input]', d) : focusTarget)?.focus(), 60);
      return true;
    },
    close(silent) {
      const d = this.active;
      if (!d) return;
      d.classList.remove('is-open');
      d.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      $$(`[aria-controls="${d.id}"]`).forEach(b => b.setAttribute('aria-expanded', 'false'));
      this.active = null;
      if (!silent && this.returnFocus) this.returnFocus.focus?.();
    }
  };
  function initDrawers() {
    document.addEventListener('click', e => {
      const opener = e.target.closest('[data-drawer-open]');
      if (opener) {
        if (Drawer.open(opener.dataset.drawerOpen, opener)) e.preventDefault();
        return;
      }
      if (e.target.closest('[data-drawer-close]')) { e.preventDefault(); Drawer.close(); }
    });
    document.addEventListener('keydown', e => {
      if (!Drawer.active) return;
      if (e.key === 'Escape') { Drawer.close(); return; }
      if (e.key === 'Tab') {
        const f = $$('a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])', Drawer.active).filter(el => el.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- Video (hero + autoplay sections) ---------- */
  function initVideo() {
    const allowAutoplay = !reducedMotion && !saveData;
    $$('[data-hero]').forEach(hero => {
      const vids = $$('[data-hero-video]', hero).filter(v => getComputedStyle(v).display !== 'none');
      const toggle = $('[data-hero-toggle]', hero);
      const setState = playing => {
        if (!toggle) return;
        toggle.setAttribute('aria-pressed', String(!playing));
        toggle.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
        $('.hero__icon-pause', toggle).hidden = !playing;
        $('.hero__icon-play', toggle).hidden = playing;
      };
      const play = () => vids.forEach(v => { v.preload = 'auto'; v.play().then(() => v.classList.add('is-playing')).catch(() => {}); });
      if (allowAutoplay) { play(); setState(true); } else { setState(false); }
      toggle?.addEventListener('click', () => {
        const playing = vids.some(v => !v.paused);
        if (playing) { vids.forEach(v => v.pause()); setState(false); } else { play(); setState(true); }
      });
    });
    $$('[data-autoplay-video]').forEach(v => {
      if (!allowAutoplay) { v.removeAttribute('autoplay'); v.pause(); v.controls = true; return; }
      const io = new IntersectionObserver(([en]) => { en.isIntersecting ? v.play().catch(() => {}) : v.pause(); });
      io.observe(v);
    });
  }

  /* ---------- Horizontal scrollers ---------- */
  function initScrollers() {
    $$('[data-slider]').forEach(sec => {
      const sc = $('[data-scroller]', sec);
      if (!sc) return;
      const step = () => (sc.firstElementChild?.getBoundingClientRect().width || 300) + 24;
      $('[data-scroll-prev]', sec)?.addEventListener('click', () => sc.scrollBy({ left: -step(), behavior: reducedMotion ? 'auto' : 'smooth' }));
      $('[data-scroll-next]', sec)?.addEventListener('click', () => sc.scrollBy({ left: step(), behavior: reducedMotion ? 'auto' : 'smooth' }));
    });
  }

  /* ---------- Cart ---------- */
  const Cart = {
    sections: 'cart-drawer',
    async add(formData) {
      formData.append('sections', this.sections);
      formData.append('sections_url', window.location.pathname);
      const res = await fetch(`${H.routes.cartAdd}.js`, { method: 'POST', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: formData });
      const data = await res.json();
      if (!res.ok || data.status) throw new Error(data.description || data.message || H.strings.error);
      await this.refresh(data.sections);
      Drawer.open('cart');
      return data;
    },
    async change(line, quantity) {
      const res = await fetch(`${H.routes.cartChange}.js`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ line, quantity, sections: this.sections, sections_url: window.location.pathname }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.description || H.strings.error);
      if ($('[data-cart-page]')) { window.location.reload(); return; }
      await this.refresh(data.sections, data.item_count);
    },
    async refresh(sections, count) {
      if (sections && sections['cart-drawer']) {
        const el = $('[data-cart-drawer-content]');
        if (el) el.innerHTML = sections['cart-drawer'];
      }
      if (count === undefined) {
        const c = await fetch(`${H.routes.cart}.js`).then(r => r.json());
        count = c.item_count;
      }
      $$('[data-cart-count]').forEach(n => { n.textContent = count; });
    }
  };
  function initCart() {
    document.addEventListener('click', async e => {
      const q = e.target.closest('[data-quick-variant]');
      if (q) {
        e.preventDefault();
        const fd = new FormData();
        fd.append('id', q.dataset.quickVariant);
        fd.append('quantity', '1');
        q.classList.add('is-loading');
        try { await Cart.add(fd); } catch (err) { toast(err.message); }
        q.classList.remove('is-loading');
        return;
      }
      const c = e.target.closest('[data-qty-change]');
      if (c) {
        e.preventDefault();
        try { await Cart.change(Number(c.dataset.qtyChange), Number(c.dataset.qtyValue)); } catch (err) { toast(err.message); }
      }
    });
  }

  /* ---------- PDP ---------- */
  function initProduct() {
    const pdp = $('[data-pdp]');
    if (!pdp) return;
    const json = $('[data-product-json]', pdp);
    const variants = json ? JSON.parse(json.textContent).variants : [];
    const form = $('.pdp__form', pdp);
    const idInput = $('[data-variant-id]', pdp);
    const addBtns = $$('[data-add-button]', pdp);
    const err = $('[data-form-error]', pdp);
    const track = $('[data-gallery-track]', pdp);
    const fieldsets = $$('[data-option-index]', pdp);

    const selected = () => fieldsets.map(fs => $('input:checked', fs)?.value);
    const findVariant = opts => variants.find(v => v.options.every((o, i) => o === opts[i]));

    function markAvailability(opts) {
      fieldsets.forEach((fs, idx) => {
        $$('input[data-option-input]', fs).forEach(input => {
          const test = opts.slice(); test[idx] = input.value;
          const v = findVariant(test);
          input.nextElementSibling?.classList.toggle('is-unavailable', !v || !v.available);
        });
      });
    }

    function update() {
      const opts = selected();
      const v = findVariant(opts);
      markAvailability(opts);
      fieldsets.forEach((fs, i) => { const s = $('[data-option-selected]', fs); if (s) s.textContent = opts[i]; });
      if (!v) { addBtns.forEach(b => { b.disabled = true; }); return; }
      idInput.value = v.id;
      addBtns.forEach(b => { b.disabled = !v.available; const l = $('[data-add-label]', b); if (l) l.textContent = v.available ? H.strings.addToBag : H.strings.soldOut; });
      const priceEl = $('[data-pdp-price]', pdp);
      if (priceEl) priceEl.innerHTML = v.compare ? `<span class="price"><span>${v.price}</span><s>${v.compare}</s></span>` : `<span class="price"><span>${v.price}</span></span>`;
      const barPrice = $('[data-pdp-bar-price]', pdp); if (barPrice) barPrice.textContent = v.price;
      const url = new URL(window.location.href); url.searchParams.set('variant', v.id);
      history.replaceState({}, '', url.toString());
      if (v.media && track) {
        const item = $(`[data-media-id="${v.media}"]`, track);
        if (item) {
          if (window.innerWidth < 1024) track.scrollTo({ left: item.offsetLeft, behavior: reducedMotion ? 'auto' : 'smooth' });
          else if (item.getBoundingClientRect().top < 0 || item.getBoundingClientRect().top > window.innerHeight) item.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
      }
    }
    fieldsets.forEach(fs => fs.addEventListener('change', update));
    if (fieldsets.length) markAvailability(selected());

    form?.addEventListener('submit', async e => {
      e.preventDefault();
      err.hidden = true;
      if (!validateMeasurements(pdp)) return;
      saveMeasurements(pdp);
      addBtns.forEach(b => b.classList.add('is-loading'));
      try { await Cart.add(new FormData(form)); }
      catch (ex) { err.textContent = ex.message; err.hidden = false; }
      addBtns.forEach(b => b.classList.remove('is-loading'));
    });

    // Gallery counter (mobile)
    const idx = $('[data-gallery-index]', pdp);
    if (track && idx) track.addEventListener('scroll', () => { idx.textContent = Math.round(track.scrollLeft / track.clientWidth) + 1; }, { passive: true });

    // Sticky mobile bar shows when main Add button leaves viewport
    const bar = $('[data-pdp-bar]', pdp);
    const mainAdd = $('.pdp__add', pdp);
    if (bar && mainAdd && 'IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        const show = !en.isIntersecting && en.boundingClientRect.top < 0;
        bar.classList.toggle('is-visible', show);
        bar.setAttribute('aria-hidden', String(!show));
        $('button', bar).tabIndex = show ? 0 : -1;
      }).observe(mainAdd);
    }

    initMeasurements(pdp);
  }

  /* ---------- Custom measurements ---------- */
  const MKEY = 'herloom:measurements';
  function initMeasurements(root) {
    const wrap = $('[data-measurements]', root);
    if (!wrap) return;
    const toggle = $('[data-measure-toggle]', wrap);
    const fields = $('.measure__fields', wrap);
    const inputs = $$('[data-measure-key]', wrap);
    const flag = $('[data-measure-flag]', wrap);
    const saved = store.get(MKEY, {});
    inputs.forEach(i => { if (!i.value && saved[i.dataset.measureKey]) i.value = saved[i.dataset.measureKey]; });
    toggle.addEventListener('change', () => {
      const on = toggle.checked;
      fields.hidden = !on;
      toggle.setAttribute('aria-expanded', String(on));
      inputs.forEach(i => { i.disabled = !on; i.required = on; });
      flag.disabled = !on;
      if (on) inputs[0]?.focus();
    });
  }
  function validateMeasurements(root) {
    const inputs = $$('[data-measure-key]:not([disabled])', root);
    for (const i of inputs) { if (!i.checkValidity()) { i.reportValidity(); return false; } }
    return true;
  }
  function saveMeasurements(root) {
    const inputs = $$('[data-measure-key]:not([disabled])', root);
    if (!inputs.length) return;
    const data = {};
    inputs.forEach(i => { if (i.value) data[i.dataset.measureKey] = i.value; });
    store.set(MKEY, data);
  }

  /* ---------- Wishlist (local, per device) ---------- */
  const WKEY = 'herloom:wishlist';
  let syncWishlist = () => {};
  function initWishlist() {
    const list = new Set(store.get(WKEY, []));
    const sync = syncWishlist = () => $$('[data-wishlist-toggle]').forEach(b => b.setAttribute('aria-pressed', String(list.has(b.dataset.wishlistToggle))));
    sync();
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-wishlist-toggle]');
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      const h = b.dataset.wishlistToggle;
      if (list.has(h)) { list.delete(h); toast(H.strings.wishlistRemoved); } else { list.add(h); toast(H.strings.wishlistAdded); }
      store.set(WKEY, [...list]);
      sync();
    });
    const grid = $('[data-wishlist-grid]');
    if (grid && list.size) {
      Promise.all([...list].slice(0, 8).map(h => fetch(`${H.routes.root.replace(/\/$/, '')}/products/${h}.js`).then(r => (r.ok ? r.json() : null)).catch(() => null)))
        .then(items => {
          const ok = items.filter(Boolean);
          if (!ok.length) return;
          grid.innerHTML = ok.map(p => `<a href="${p.url}" class="journal__card"><div class="media ratio-4-5">${p.featured_image ? `<img src="${p.featured_image}&width=400" alt="${p.title.replace(/"/g, '&quot;')}" loading="lazy">` : ''}</div><span class="card__title">${p.title}</span></a>`).join('');
        });
    }
  }

  /* ---------- PLP: sort, filters, columns, load more ---------- */
  function initCollection() {
    const plp = $('[data-plp]');
    if (!plp) return;
    const grid = $('[data-plp-grid]', plp);

    $('[data-plp-sort]', plp)?.addEventListener('change', e => {
      const url = new URL(window.location.href);
      url.searchParams.set('sort_by', e.target.value);
      url.searchParams.delete('page');
      window.location.href = url.toString();
    });

    const filterForm = $('[data-filter-form]', plp);
    filterForm?.addEventListener('submit', e => {
      e.preventDefault();
      const params = new URLSearchParams();
      new FormData(filterForm).forEach((v, k) => { if (v !== '') params.append(k, v); });
      window.location.href = `${filterForm.action}?${params.toString()}`;
    });

    // Grid columns (remembered per device)
    const colsKey = 'herloom:cols';
    const applyCols = (n, mobile) => {
      if (!grid) return;
      if (mobile) grid.dataset.mobileCols = n; else grid.style.setProperty('--cols', n);
      $$(`.plp__col-btn--${mobile ? 'm' : 'd'}`, plp).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cols === String(n))));
    };
    const savedCols = store.get(colsKey, {});
    if (savedCols.d) applyCols(savedCols.d, false);
    if (savedCols.m) applyCols(savedCols.m, true);
    $$('.plp__col-btn', plp).forEach(b => b.addEventListener('click', () => {
      const mobile = b.classList.contains('plp__col-btn--m');
      applyCols(b.dataset.cols, mobile);
      const s = store.get(colsKey, {}); s[mobile ? 'm' : 'd'] = b.dataset.cols; store.set(colsKey, s);
    }));

    // Load more + restore on back navigation
    const cacheKey = `herloom:plp:${location.pathname}${location.search}`;
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
      if (cached && grid && performance.getEntriesByType('navigation')[0]?.type === 'back_forward') {
        grid.insertAdjacentHTML('beforeend', cached.html);
        const more = $('.plp__more', plp);
        if (cached.next) { if (more) $('[data-load-more]', more).href = cached.next; } else more?.remove();
        requestAnimationFrame(() => window.scrollTo(0, cached.y));
      } else sessionStorage.removeItem(cacheKey);
    } catch (e) { /* ignore */ }

    plp.addEventListener('click', async e => {
      const btn = e.target.closest('[data-load-more]');
      if (!btn) return;
      e.preventDefault();
      btn.classList.add('is-loading');
      try {
        const html = await fetch(btn.href).then(r => r.text());
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const items = $$('[data-plp-grid] > [data-grid-item]', doc);
        const fragHtml = items.map(n => n.outerHTML).join('');
        grid.insertAdjacentHTML('beforeend', fragHtml);
        initReveal(grid);
        syncWishlist();
        const nextBtn = $('[data-load-more]', doc);
        let cache = {};
        try { cache = JSON.parse(sessionStorage.getItem(cacheKey) || '{}'); } catch (er) { cache = {}; }
        cache.html = (cache.html || '') + fragHtml;
        cache.next = nextBtn ? nextBtn.href : null;
        if (nextBtn) { btn.href = nextBtn.href; const label = $('.plp__more .meta', doc); if (label) $('.plp__more .meta', plp).textContent = label.textContent; }
        else $('.plp__more', plp)?.remove();
        try { sessionStorage.setItem(cacheKey, JSON.stringify(cache)); } catch (er) { /* full */ }
      } catch (ex) { window.location.href = btn.href; }
      btn.classList.remove('is-loading');
    });
    window.addEventListener('pagehide', () => {
      try { const c = JSON.parse(sessionStorage.getItem(cacheKey) || 'null'); if (c) { c.y = window.scrollY; sessionStorage.setItem(cacheKey, JSON.stringify(c)); } } catch (e) { /* ignore */ }
    });
  }

  /* ---------- Hotspots ---------- */
  function initHotspots() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-hotspot]');
      $$('[data-hotspot][aria-expanded="true"]').forEach(b => {
        if (b !== btn && !e.target.closest('.hotspot__card')) { b.setAttribute('aria-expanded', 'false'); $('#' + b.getAttribute('aria-controls')).hidden = true; }
      });
      if (!btn) return;
      const card = $('#' + btn.getAttribute('aria-controls'));
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      card.hidden = !open;
    });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      $$('[data-hotspot][aria-expanded="true"]').forEach(b => { b.setAttribute('aria-expanded', 'false'); $('#' + b.getAttribute('aria-controls')).hidden = true; b.focus(); });
    });
  }

  /* ---------- Recommendations ---------- */
  function initRecs() {
    $$('[data-recs]').forEach(async el => {
      try {
        const html = await fetch(el.dataset.url).then(r => r.text());
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const inner = $('[data-recs]', doc);
        if (inner && inner.innerHTML.trim()) { el.innerHTML = inner.innerHTML; initReveal(el); }
      } catch (e) { /* silent */ }
    });
  }

  /* ---------- Predictive search ---------- */
  function initSearch() {
    const input = $('[data-predictive-input]');
    const out = $('[data-predictive-results]');
    if (!input || !out) return;
    let t, ctrl;
    input.addEventListener('input', () => {
      clearTimeout(t);
      const q = input.value.trim();
      if (q.length < 2) { out.innerHTML = ''; return; }
      t = setTimeout(async () => {
        ctrl?.abort(); ctrl = new AbortController();
        try {
          const url = `${H.routes.predictiveSearch}?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=4&section_id=predictive-search`;
          const html = await fetch(url, { signal: ctrl.signal }).then(r => r.text());
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const sec = doc.querySelector('.shopify-section') || doc.body;
          out.innerHTML = sec.innerHTML;
        } catch (e) { /* aborted */ }
      }, 250);
    });
  }

  /* ---------- Auth (login ↔ recover) ---------- */
  function initAuth() {
    const login = $('[data-auth-login]'), rec = $('[data-auth-recover]');
    if (!login || !rec) return;
    const show = recover => { login.hidden = recover; rec.hidden = !recover; };
    if (location.hash === '#recover') show(true);
    $$('[data-auth-toggle]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); show(login.hidden === false); }));
  }

  /* ---------- Newsletter slide-in (delayed, dismissible, once) ---------- */
  function initSlideIn() {
    const el = $('[data-slide-in]');
    if (!el || store.get('herloom:slidein', false)) return;
    const delay = Number(el.dataset.delay || 25) * 1000;
    setTimeout(() => el.classList.add('is-open'), delay);
    $('[data-slide-in-close]', el)?.addEventListener('click', () => { el.classList.remove('is-open'); store.set('herloom:slidein', true); });
    $('form', el)?.addEventListener('submit', () => store.set('herloom:slidein', true));
  }

  /* ---------- Country select default for address forms ---------- */
  function initAddressSelects() {
    $$('select[data-default]').forEach(s => { if (s.dataset.default) s.value = s.dataset.default; });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initReveal(); initHeader(); initDrawers(); initVideo(); initScrollers(); initCart();
    initProduct(); initWishlist(); initCollection(); initHotspots(); initRecs(); initSearch();
    initAuth(); initSlideIn(); initAddressSelects();
  });

  // Theme editor support
  document.addEventListener('shopify:section:load', e => { initReveal(e.target); initVideo(); initScrollers(); });
})();
