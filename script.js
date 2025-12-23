/* script.js
   - Generates product placeholders (30 per category)
   - Handles filtering, add-to-cart, cart in localStorage
   - Checkout (COD & manual payment instructions)
   - Simple giveaway submission (stores in localStorage; shows confirmation)
   - + Address autocomplete (OpenStreetMap Nominatim)
   - + Hero button active toggles & hover effects
   - + WhatsApp floating button already included in HTML (link uses 01602673665 -> 8801602673665)
*/

/* Config */
const CATEGORIES = ['mens','girls','baby','accessories'];
const SLOTS_PER_CATEGORY = 30; // as requested
const DELIVERY_CHARGE = 60;
const SITE_NAME = 'Shopnar-Shop';

/* Utility */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* Generate placeholder products */
let products = [];
function generateProducts() {
  products = [];
  let id = 1;
  CATEGORIES.forEach(cat => {
    for (let i = 1; i <= SLOTS_PER_CATEGORY; i++) {
      products.push({
        id: id++,
        name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} item ${i}`,
        price: Math.floor(500 + Math.random() * 3000),
        category: cat,
        image: '', // placeholder — user will replace later
        desc: 'Placeholder description. Replace with real product details.'
      });
    }
  });
}

/* Render products (supports pagination) */
let visibleProducts = [];
let currentCategory = 'all';
let perPage = 18;
let currentPage = 1;

function renderProducts(reset = false) {
  if (reset) {
    currentPage = 1;
    visibleProducts = [];
  }
  let list = (currentCategory === 'all') ? products.slice() : products.filter(p => p.category === currentCategory);
  // apply search filter
  const q = ($('#searchInput')?.value || '').trim().toLowerCase();
  if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
  // apply sort (if any)
  const sort = $('#sortSelect')?.value;
  if (sort === 'price-asc') list.sort((a,b)=>a.price-b.price);
  else if (sort === 'price-desc') list.sort((a,b)=>b.price-a.price);

  const start = (currentPage-1)*perPage;
  const nextItems = list.slice(start, start+perPage);
  visibleProducts = visibleProducts.concat(nextItems);

  const grid = $('#productsGrid');
  grid.innerHTML = visibleProducts.map(p => productCardHTML(p)).join('');
  // show/hide load more
  const loadMoreBtn = $('#loadMoreBtn');
  if (start + perPage >= list.length) loadMoreBtn.style.display = 'none';
  else loadMoreBtn.style.display = 'inline-block';

  $('#productsTitle').textContent = (currentCategory === 'all') ? 'All Products' : `${currentCategory.toUpperCase()}`;

  // update category nav active styles
  updateCategoryNavActive();
  // update hero button active state if relevant
  updateHeroActionsActive();
}

function productCardHTML(p){
  return `
    <article class="product-card" data-id="${p.id}">
      <div class="product-thumb">${p.image ? `<img src="${p.image}" alt="${p.name}" style="max-width:100%;height:100%;object-fit:cover;border-radius:8px">` : `<span style="font-size:13px;color:var(--muted)">Image placeholder</span>`}</div>
      <div class="product-info">
        <div class="product-title">${p.name}</div>
        <div class="product-price">৳${p.price}</div>
        <div style="color:var(--muted);font-size:13px">${p.desc}</div>
        <div style="margin-top:8px;display:flex;gap:8px">
          <button class="btn" onclick="addToCart(${p.id})"><i class="fas fa-shopping-cart"></i> Add to cart</button>
          <button class="btn outline" onclick="quickView(${p.id})">Quick view</button>
        </div>
      </div>
    </article>
  `;
}

/* Load more */
function loadMore(){
  currentPage++;
  renderProducts(false);
}

/* Category / search / sort */
function showCategory(cat){
  currentCategory = cat;
  visibleProducts = [];
  currentPage = 1;
  renderProducts(true);
}
function performSearch(){
  visibleProducts = [];
  currentPage = 1;
  renderProducts(true);
}
function applySort(){
  visibleProducts = [];
  currentPage = 1;
  renderProducts(true);
}
function resetFilters(){
  $('#searchInput').value = '';
  $('#sortSelect').value = 'default';
  showCategory('all');
}

/* Quick view (simple alert/modal placeholder) */
function quickView(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  alert(`${p.name}\nPrice: ৳${p.price}\n\n${p.desc}\n\nReplace this quick view with a modal if you want.`);
}

/* Cart (localStorage) */
let cart = [];
function loadCart(){
  try {
    const s = localStorage.getItem('shopnar_cart_v1');
    if (s) cart = JSON.parse(s);
  } catch(e){ cart = []; }
  updateCartUI();
}
function saveCart(){ localStorage.setItem('shopnar_cart_v1', JSON.stringify(cart)); }

function addToCart(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  const found = cart.find(i=>i.id===id);
  if(found) found.qty++;
  else cart.push({ id:p.id, name:p.name, price:p.price, qty:1 });
  saveCart();
  updateCartUI();
  showTransient('Added to cart');
}

function updateCartUI(){
  $('#cartCount').textContent = cart.reduce((s,i)=>s+i.qty,0) || 0;
  const itemsEl = $('#cartItems');
  if(!itemsEl) return;
  if(cart.length === 0){
    itemsEl.innerHTML = `<div class="empty-cart"><small>Your cart is empty</small></div>`;
    updateTotals();
    return;
  }
  itemsEl.innerHTML = cart.map(i=>`
    <div style="display:flex;gap:8px;align-items:center;padding:8px;border-bottom:1px solid #f3f4f6">
      <div style="width:48px;height:48px;background:#f8fafc;border-radius:8px;display:flex;align-items:center;justify-content:center">${i.name.split(' ')[0]}</div>
      <div style="flex:1">
        <div style="font-weight:600">${i.name}</div>
        <div style="color:var(--muted)">৳${i.price} x ${i.qty}</div>
        <div style="margin-top:6px;display:flex;gap:8px">
          <button class="btn" onclick="changeQty(${i.id}, -1)">-</button>
          <div style="padding:6px 10px;border-radius:6px;background:#fff;border:1px solid #eee">${i.qty}</div>
          <button class="btn" onclick="changeQty(${i.id}, 1)">+</button>
          <button class="btn outline" onclick="removeFromCart(${i.id})" style="margin-left:auto">Remove</button>
        </div>
      </div>
    </div>
  `).join('');
  updateTotals();
}

function changeQty(id, delta){
  const it = cart.find(x=>x.id===id);
  if(!it) return;
  it.qty += delta;
  if(it.qty <= 0) removeFromCart(id);
  saveCart();
  updateCartUI();
}
function removeFromCart(id){
  cart = cart.filter(x=>x.id!==id);
  saveCart();
  updateCartUI();
}
function updateTotals(){
  const subtotal = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  $('#cartSubtotal').textContent = `৳${subtotal}`;
  $('#cartDelivery').textContent = `৳${DELIVERY_CHARGE}`;
  $('#cartTotal').textContent = `৳${subtotal + DELIVERY_CHARGE}`;
}

/* Toggle cart */
function toggleCart(){
  const el = $('#cartSidebar');
  if(!el) return;
  el.classList.toggle('open');
  if(el.classList.contains('open')) el.setAttribute('aria-hidden','false');
  else el.setAttribute('aria-hidden','true');
}

/* Checkout */
function openCheckout(){
  $('#checkoutModal').setAttribute('aria-hidden','false');
  $('#checkoutModal').style.display = 'flex';
}
function closeCheckout(){
  $('#checkoutModal').setAttribute('aria-hidden','true');
  $('#checkoutModal').style.display = 'none';
}
function onPaymentMethodChange(){
  // For manual payments we show instructions; for COD hide instructions (but allow trx id optional)
  const pm = $('#paymentMethod')?.value;
  const manual = $('#manualPaymentInfo');
  if(!pm || !manual) return;
  manual.style.display = (pm === 'cod') ? 'none' : 'block';
}

/* Submit Order (demo — store in localStorage and optionally POST to a form endpoint) */
function submitOrder(e){
  e.preventDefault();
  if(cart.length === 0){
    showTransient('Your cart is empty');
    return;
  }
  const name = $('#custName').value.trim();
  const phone = $('#custPhone').value.trim();
  const address = $('#custAddress').value.trim();
  const paymentMethod = $('#paymentMethod').value;
  const trx = $('#transactionId').value.trim();

  const order = {
    id: 'ORD' + Date.now(),
    name, phone, address, paymentMethod, trx,
    items: cart,
    subtotal: cart.reduce((s,i)=>s + i.price * i.qty,0),
    delivery: DELIVERY_CHARGE,
    total: cart.reduce((s,i)=>s + i.price * i.qty,0) + DELIVERY_CHARGE,
    createdAt: new Date().toISOString()
  };

  // Save orders locally (demo). Later you can send to Formspree or your backend.
  let orders = [];
  try { orders = JSON.parse(localStorage.getItem('shopnar_orders_v1') || '[]'); } catch(e){ orders = []; }
  orders.push(order);
  localStorage.setItem('shopnar_orders_v1', JSON.stringify(orders));

  // Clear cart
  cart = [];
  saveCart();
  updateCartUI();
  closeCheckout();

  // Show confirmation
  showTransient(`Order placed. Your order id: ${order.id}. We will contact you soon.`);
}

/* Giveaway form handling (simple) */
function submitGiveawayForm(e){
  e.preventDefault();
  const name = $('#giftName').value.trim();
  const phone = $('#giftPhone').value.trim();
  const fb = $('#giftFB').value.trim();
  const file = $('#giftFile').files[0];
  if(!name || !phone || !fb || !file) { $('#giveawayMessage').textContent = 'Please fill all fields and upload screenshot.'; return; }

  // Convert image to base64 (only for demo/local storage). In production, use proper backend / form handler.
  const reader = new FileReader();
  reader.onload = function(evt){
    const dataUrl = evt.target.result;
    const submission = {
      id: 'G' + Date.now(),
      name, phone, fb, screenshot: dataUrl, createdAt: new Date().toISOString()
    };
    let submissions = [];
    try { submissions = JSON.parse(localStorage.getItem('shopnar_giveaway_v1') || '[]'); } catch(e){ submissions = []; }
    submissions.push(submission);
    localStorage.setItem('shopnar_giveaway_v1', JSON.stringify(submissions));
    $('#giveawayMessage').textContent = 'Submitted. We will verify and contact you. Thank you!';
    $('#giveawayForm').reset();
  };
  reader.readAsDataURL(file);
}

/* Quick helper: transient message */
function showTransient(msg, time = 2200){
  const n = document.createElement('div');
  n.style.cssText = 'position:fixed;top:80px;right:20px;background:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.12);z-index:20000';
  n.innerHTML = `<strong>${SITE_NAME}</strong><div style="font-size:13px;margin-top:6px">${msg}</div>`;
  document.body.appendChild(n);
  setTimeout(()=>{ n.style.opacity = '0'; n.style.transform = 'translateX(10px)'; setTimeout(()=>n.remove(),300); }, time);
}

/* ===== Address autocomplete (OpenStreetMap Nominatim) =====
   - Debounced fetch to Nominatim search
   - Shows up to 5 suggestions
   - On select fills the custAddress textarea
*/
let addressDebounceTimer = null;
let lastAddressQuery = '';
let selectedAddressMeta = null; // store lat/lon if needed

function initAddressAutocomplete() {
  const addrEl = $('#custAddress');
  const suggestionsWrap = $('#addressSuggestions');
  if(!addrEl || !suggestionsWrap) return;
  suggestionsWrap.innerHTML = '<div class="list" role="listbox" aria-hidden="true" style="display:none"></div>';
  const listEl = suggestionsWrap.querySelector('.list');

  function showSuggestions(items){
    if(!listEl) return;
    if(!items || items.length === 0){
      listEl.style.display = 'none';
      suggestionsWrap.setAttribute('aria-hidden','true');
      return;
    }
    listEl.innerHTML = items.map((it, idx) => {
      const display = it.display_name;
      return `<div class="item" role="option" data-index="${idx}" data-lat="${it.lat}" data-lon="${it.lon}">${escapeHtml(display)}</div>`;
    }).join('');
    listEl.style.display = 'block';
    suggestionsWrap.setAttribute('aria-hidden','false');
  }

  addrEl.addEventListener('input', (e) => {
    const q = addrEl.value.trim();
    selectedAddressMeta = null;
    if(addressDebounceTimer) clearTimeout(addressDebounceTimer);
    if(!q || q.length < 3){
      showSuggestions([]);
      return;
    }
    addressDebounceTimer = setTimeout(()=> {
      if(q === lastAddressQuery) return;
      lastAddressQuery = q;
      fetchAddressSuggestions(q).then(results => {
        showSuggestions(results);
      }).catch(()=> showSuggestions([]));
    }, 350);
  });

  // click on suggestion
  listEl.addEventListener('click', (ev) => {
    const item = ev.target.closest('.item');
    if(!item) return;
    const idx = item.getAttribute('data-index');
    const text = item.textContent;
    addrEl.value = text;
    selectedAddressMeta = { lat: item.getAttribute('data-lat'), lon: item.getAttribute('data-lon') };
    showSuggestions([]);
  });

  // close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if(!suggestionsWrap.contains(e.target) && e.target !== addrEl){
      listEl.style.display = 'none';
      suggestionsWrap.setAttribute('aria-hidden','true');
    }
  });

  // keyboard navigation (simple)
  addrEl.addEventListener('keydown', (e) => {
    const visible = listEl && listEl.style.display === 'block';
    if(!visible) return;
    const items = Array.from(listEl.querySelectorAll('.item'));
    const active = listEl.querySelector('.item.active');
    let idx = active ? items.indexOf(active) : -1;
    if(e.key === 'ArrowDown'){ e.preventDefault(); idx = Math.min(items.length - 1, idx + 1); setActiveItem(items, idx); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); idx = Math.max(0, idx - 1); setActiveItem(items, idx); }
    else if(e.key === 'Enter'){ e.preventDefault(); if(idx >= 0 && items[idx]) { items[idx].click(); } }
  });

  function setActiveItem(items, idx){
    items.forEach(it => it.classList.remove('active'));
    if(idx >= 0 && items[idx]) items[idx].classList.add('active');
  }
}

async function fetchAddressSuggestions(q){
  // Use Nominatim public API (free, small demo). For heavy usage, use an API key / paid service.
  // Encode query
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`;
  try{
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' }});
    if(!res.ok) return [];
    const data = await res.json();
    return data;
  }catch(e){ return []; }
}

function escapeHtml(s){
  return s.replace(/[&<>"'`]/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'})[m]);
}

/* ===== Hero action active toggles ===== */
function initHeroActions(){
  const heroBtns = Array.from(document.querySelectorAll('.hero-action'));
  heroBtns.forEach(b => {
    b.addEventListener('click', (e) => {
      const cat = b.getAttribute('data-cat');
      // set active classes
      heroBtns.forEach(x => x.classList.toggle('active', x === b));
      // showCategory will be called via onclick attr; ensure category state updated
      currentCategory = cat;
    });
  });
}

function updateHeroActionsActive(){
  const heroBtns = Array.from(document.querySelectorAll('.hero-action'));
  heroBtns.forEach(b => {
    const cat = b.getAttribute('data-cat');
    b.classList.toggle('active', cat === currentCategory);
  });
}

function updateCategoryNavActive(){
  const navBtns = Array.from(document.querySelectorAll('.cat-btn'));
  navBtns.forEach(btn => {
    const txt = btn.textContent.trim().toLowerCase();
    // map 'all' vs others; categories like 'mens' 'girls' 'baby' 'accessories'
    const mapTxt = (txt === 'all') ? 'all' : (txt === 'mens' ? 'mens' : (txt === 'girls' ? 'girls' : (txt === 'baby' ? 'baby' : (txt === 'accessories' ? 'accessories' : ''))));
    btn.classList.toggle('active', mapTxt === currentCategory);
  });
}

/* Toggle mobile menu */
function toggleMobileMenu(){
  const ms = $('#mobileSidebar');
  if(!ms) return;
  ms.classList.toggle('active');
  ms.classList.contains('active') ? ms.setAttribute('aria-hidden','false') : ms.setAttribute('aria-hidden','true');
}

/* DOM ready */
document.addEventListener('DOMContentLoaded', initUI);

function initUI(){
  generateProducts();
  loadCart();
  showCategory('all');
  document.getElementById('year').textContent = new Date().getFullYear();

  // hide manual payment info initially (COD default)
  onPaymentMethodChange();

  // address autocomplete init
  initAddressAutocomplete();

  // hero actions init
  initHeroActions();

  // keyboard escape: close modals & sidebars
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCheckout();
      const ms = document.getElementById('mobileSidebar');
      if (ms && ms.classList.contains('active')) toggleMobileMenu();
      const cs = document.getElementById('cartSidebar');
      if (cs && cs.classList.contains('open')) toggleCart();
      const w = document.getElementById('welcomePopup');
      if (w) w.style.display = 'none';
    }
  });
}