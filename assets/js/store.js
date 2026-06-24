/* ============================================================
   WATER4PEPTIDES store engine — product data, bespoke SVG vials,
   localStorage cart, drawer, checkout. No dependencies.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Product catalog (single source of truth — swap for prospect) ---------- */
  const PRODUCTS = [
    {
      id: "BW-10", name: "Bacteriostatic Water — 10 mL", sku: "BW-10-09BA",
      ml: 10, price: 14.99, color: "#0aa39a", fill: 0.62, tag: "Single vial",
      chips: ["10 mL", "0.9% BA", "USP-grade"]
    },
    {
      id: "BW-30", name: "Bacteriostatic Water — 30 mL", sku: "BW-30-09BA",
      ml: 30, price: 24.99, color: "#0aa39a", fill: 0.78, tag: "Best value",
      chips: ["30 mL", "0.9% BA", "USP-grade"]
    },
    {
      id: "BW-30x3", name: "30 mL Vial — 3-Pack", sku: "BW-30-3PK",
      ml: 30, price: 64.99, was: 74.97, color: "#0b6fb0", fill: 0.82, tag: "Save 13%",
      chips: ["3 × 30 mL", "0.9% BA", "Bulk"]
    },
    {
      id: "BW-10x5", name: "10 mL Vial — 5-Pack", sku: "BW-10-5PK",
      ml: 10, price: 59.99, was: 74.95, color: "#0b6fb0", fill: 0.58, tag: "Save 20%",
      chips: ["5 × 10 mL", "0.9% BA", "Bulk"]
    },
    {
      id: "KIT-1", name: "Reconstitution Starter Kit", sku: "KIT-RC-01",
      ml: 30, price: 49.99, color: "#0aa39a", fill: 0.9, tag: "Kit",
      chips: ["2 × 30 mL", "30 syringes", "30 prep pads"]
    }
  ];

  const FREE_SHIP_AT = 75;
  const FLAT_SHIP = 7.95;
  const CART_KEY = "water4peptides_cart_v1";

  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const money = (n) => "$" + n.toFixed(2);

  /* ---------- Bespoke vial illustration (fill scales with volume) ---------- */
  function vial(p, w) {
    const width = w || 120;
    const fillTop = 150 - p.fill * 96; // body spans y 54..150
    const grad = "g_" + p.id.replace(/[^a-z0-9]/gi, "");
    return `
<svg viewBox="0 0 120 220" width="${width}" role="img" aria-label="${p.name} vial">
  <defs>
    <linearGradient id="${grad}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.color}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${p.color}" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  <!-- crimp cap -->
  <rect x="40" y="6" width="40" height="20" rx="3" fill="#9fb2bb"/>
  <rect x="44" y="2" width="32" height="8" rx="2" fill="#cdd9de"/>
  <rect x="40" y="20" width="40" height="6" fill="#7f949d"/>
  <!-- neck -->
  <path d="M46 26 h28 v10 l4 8 v8 H42 v-8 l4-8 z" fill="#e7eef0" stroke="#c3d3d8" stroke-width="1.5"/>
  <!-- body (glass) -->
  <rect x="34" y="50" width="52" height="150" rx="12" fill="#f3f8f9" stroke="#c3d3d8" stroke-width="2"/>
  <!-- liquid -->
  <clipPath id="clip_${grad}"><rect x="36" y="52" width="48" height="146" rx="10"/></clipPath>
  <g clip-path="url(#clip_${grad})">
    <rect x="36" y="${fillTop}" width="48" height="${200 - fillTop}" fill="url(#${grad})"/>
    <ellipse cx="60" cy="${fillTop}" rx="24" ry="4" fill="${p.color}" opacity="0.35"/>
  </g>
  <!-- glass highlight -->
  <rect x="40" y="58" width="7" height="130" rx="4" fill="#fff" opacity="0.55"/>
  <!-- label band -->
  <rect x="30" y="120" width="60" height="46" rx="4" fill="#fff" stroke="#dce6e9"/>
  <text x="60" y="138" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="11" font-weight="600" fill="#0b1f2a">${p.ml} mL</text>
  <line x1="36" y1="144" x2="84" y2="144" stroke="#dce6e9"/>
  <text x="60" y="156" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="7" fill="#5e747f">0.9% BENZYL ALC.</text>
</svg>`;
  }

  /* ---------- Cart state ---------- */
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); sync(); }
  function count() { return getCart().reduce((n, l) => n + l.qty, 0); }
  function subtotal() { return getCart().reduce((s, l) => s + (byId[l.id] ? byId[l.id].price * l.qty : 0), 0); }

  function add(id, qty) {
    const c = getCart();
    const line = c.find((l) => l.id === id);
    if (line) line.qty += qty || 1; else c.push({ id, qty: qty || 1 });
    saveCart(c);
  }
  function setQty(id, qty) {
    let c = getCart();
    if (qty <= 0) c = c.filter((l) => l.id !== id);
    else { const l = c.find((x) => x.id === id); if (l) l.qty = qty; }
    saveCart(c);
  }
  function remove(id) { saveCart(getCart().filter((l) => l.id !== id)); }

  /* ---------- DOM helpers ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- Render: product grid ---------- */
  function renderGrid() {
    const grid = $("#product-grid");
    if (!grid) return;
    grid.innerHTML = PRODUCTS.map((p) => `
      <article class="card reveal">
        <span class="card__tag">${p.tag}</span>
        <div class="card__viz">${vial(p, 130)}</div>
        <span class="card__sku">SKU · ${p.sku}</span>
        <h3 class="card__name">${p.name}</h3>
        <div class="card__spec">${p.chips.map((c) => `<span class="chip">${c}</span>`).join("")}</div>
        <div class="card__foot">
          <span class="price">${p.was ? `<del>${money(p.was)}</del>` : ""}${money(p.price)} <small>USD</small></span>
          <button class="add-btn" data-add="${p.id}" aria-label="Add ${p.name} to cart">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            Add
          </button>
        </div>
      </article>`).join("");
    observeReveals();
  }

  /* ---------- Render: cart drawer ---------- */
  function renderDrawer() {
    const wrap = $("#drawer-items");
    if (!wrap) return;
    const c = getCart();
    const foot = $("#drawer-foot");
    if (!c.length) {
      wrap.innerHTML = `
        <div class="drawer__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.4 12.3a2 2 0 0 0 2 1.7h8.3a2 2 0 0 0 2-1.6L23 7H6"/></svg>
          <div><strong>Your cart is empty</strong><br><span style="font-size:.88rem">Add a product to get started.</span></div>
        </div>`;
      if (foot) foot.hidden = true;
      renderShipBar();
      return;
    }
    if (foot) foot.hidden = false;
    wrap.innerHTML = c.map((l) => {
      const p = byId[l.id]; if (!p) return "";
      return `
      <div class="line">
        <div class="line__viz">${vial(p, 40)}</div>
        <div>
          <div class="line__name">${p.name}</div>
          <div class="line__sku">${p.sku}</div>
          <div class="qty">
            <button data-dec="${p.id}" aria-label="Decrease quantity of ${p.name}">&minus;</button>
            <span aria-live="polite">${l.qty}</span>
            <button data-inc="${p.id}" aria-label="Increase quantity of ${p.name}">+</button>
          </div>
        </div>
        <div class="line__right">
          <div class="line__price">${money(p.price * l.qty)}</div>
          <button class="line__rm" data-rm="${p.id}">Remove</button>
        </div>
      </div>`;
    }).join("");
    const tot = $("#drawer-total");
    if (tot) tot.textContent = money(subtotal());
    renderShipBar();
  }

  function renderShipBar() {
    const bar = $("#ship-bar");
    if (!bar) return;
    const sub = subtotal();
    const left = Math.max(0, FREE_SHIP_AT - sub);
    const pct = Math.min(100, (sub / FREE_SHIP_AT) * 100);
    bar.querySelector("[data-ship-msg]").innerHTML = sub === 0
      ? `Spend <b>${money(FREE_SHIP_AT)}</b> to unlock free discreet shipping.`
      : left > 0
        ? `You're <b>${money(left)}</b> from <b>free shipping</b>.`
        : `🎉 You've unlocked <b>free discreet shipping</b>.`;
    bar.querySelector("[data-ship-fill]").style.width = pct + "%";
  }

  /* ---------- Badge sync ---------- */
  function sync() {
    const n = count();
    $$("[data-cart-count]").forEach((el) => {
      el.textContent = n;
      el.classList.toggle("is-on", n > 0);
    });
    renderDrawer();
    renderSummary();
  }

  /* ---------- Drawer open/close ---------- */
  const scrim = $("#scrim");
  const drawer = $("#drawer");
  function openDrawer() { if (!drawer) return; drawer.classList.add("is-open"); scrim.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; }
  function closeDrawer() { if (!drawer) return; drawer.classList.remove("is-open"); scrim.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    let t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>${msg}`;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  /* ---------- Reveal on scroll ---------- */
  let io;
  function observeReveals() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach((e) => e.classList.add("in")); return; }
    if (!io) io = new IntersectionObserver((ents) => {
      ents.forEach((e, i) => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add("in"), (i % 6) * 70); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    $$(".reveal:not(.in)").forEach((e) => io.observe(e));
  }

  /* ---------- Checkout: order summary ---------- */
  function renderSummary() {
    const box = $("#summary-items");
    if (!box) return;
    const c = getCart();
    if (!c.length) {
      const empty = $("#checkout-empty");
      const form = $("#checkout-main");
      if (empty && form) { empty.hidden = false; form.hidden = true; }
      return;
    }
    box.innerHTML = c.map((l) => {
      const p = byId[l.id]; if (!p) return "";
      return `<div class="summary__line"><span class="q">${l.qty}×</span><span>${p.name}</span><span style="font-family:var(--f-mono)">${money(p.price * l.qty)}</span></div>`;
    }).join("");
    const sub = subtotal();
    const ship = sub >= FREE_SHIP_AT || sub === 0 ? 0 : FLAT_SHIP;
    const tax = +(sub * 0.07).toFixed(2);
    const total = sub + ship + tax;
    const set = (sel, val) => { const el = $(sel); if (el) el.textContent = val; };
    set("#sum-sub", money(sub));
    set("#sum-ship", ship === 0 ? "FREE" : money(ship));
    set("#sum-tax", money(tax));
    set("#sum-total", money(total));
  }

  /* ---------- Wire up ---------- */
  function init() {
    renderGrid();
    // hydrate hero vial (30 mL reference lot)
    const hero = $("#hero-vial");
    if (hero && byId["BW-30"]) hero.innerHTML = vial(byId["BW-30"], 120);
    sync();
    observeReveals();

    // delegated clicks
    document.addEventListener("click", (e) => {
      const addB = e.target.closest("[data-add]");
      if (addB) {
        add(addB.dataset.add);
        addB.classList.add("added");
        addB.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Added`;
        const cb = $("#cart-button"); if (cb) { cb.classList.remove("bump"); void cb.offsetWidth; cb.classList.add("bump"); }
        toast(byId[addB.dataset.add].name.split("—")[0].trim() + " added to cart");
        setTimeout(() => { addB.classList.remove("added"); addB.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Add`; }, 1400);
        return;
      }
      if (e.target.closest("[data-open-cart]")) { e.preventDefault(); openDrawer(); return; }
      if (e.target.closest("[data-close-cart]") || e.target.id === "scrim") { closeDrawer(); return; }
      const inc = e.target.closest("[data-inc]"); if (inc) { const id = inc.dataset.inc; const l = getCart().find((x) => x.id === id); setQty(id, (l ? l.qty : 0) + 1); return; }
      const dec = e.target.closest("[data-dec]"); if (dec) { const id = dec.dataset.dec; const l = getCart().find((x) => x.id === id); setQty(id, (l ? l.qty : 1) - 1); return; }
      const rm = e.target.closest("[data-rm]"); if (rm) { remove(rm.dataset.rm); return; }
      const mt = e.target.closest("#menu-toggle"); if (mt) { $("#nav").classList.toggle("is-open"); return; }
    });

    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

    // checkout form
    const form = $("#checkout-form");
    if (form) {
      renderSummary();
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const num = "PB-" + Date.now().toString(36).toUpperCase().slice(-6) + "-" + Math.floor(Math.random() * 900 + 100);
        localStorage.removeItem(CART_KEY);
        const main = $("#checkout-main"); const conf = $("#confirm");
        if (main) main.hidden = true;
        if (conf) {
          conf.hidden = false;
          const on = $("#order-number"); if (on) on.textContent = num;
          const em = $("#confirm-email"); const input = $("#email"); if (em && input) em.textContent = input.value || "your inbox";
          conf.scrollIntoView({ behavior: "reduced-motion" in window ? "auto" : "smooth", block: "start" });
        }
        sync();
      });
    }

    // year
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
