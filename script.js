// ===== Configuration =====
const DELIVERY_CHARGE = 60;
const SITE_NAME = 'Shopnar-Shop';

// IMPORTANT: Formspree সেটআপ করার পর এখানে আপনার Form ID বসান
// যেমন: 'https://formspree.io/f/mle12345'
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

// WhatsApp number for OTP (আপনার নম্বর)
const WHATSAPP_NUMBER = '8801602673665';

// ===== Global Variables =====
let products = [];
let cart = [];
let visibleProducts = [];
let currentCategory = 'all';
let perPage = 18;
let currentPage = 1;

// Phone verification
let generatedOTP = null;
let otpTimer = null;
let isPhoneVerified = false;

// ===== Helper Functions =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"'`]/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
    "'": '&#39;', '`': '&#96;'
  })[m]);
}

// ===== Generate Products =====
function generateProducts() {
  products = [
    // Mens Hoodies - ৳599
    { id: 1, name: 'Premium Hoodie Black', price: 599, category: 'mens', desc: 'Premium quality hoodie. Soft fabric & comfortable.' },
    { id: 2, name: 'Classic Hoodie Grey', price: 599, category: 'mens', desc: 'Classic style hoodie for daily wear.' },
    { id: 3, name: 'Sports Hoodie Blue', price: 599, category: 'mens', desc: 'Athletic style hoodie for active lifestyle.' },
    { id: 4, name: 'Winter Hoodie Navy', price: 599, category: 'mens', desc: 'Warm and cozy winter hoodie.' },
    { id: 5, name: 'Street Hoodie Red', price: 599, category: 'mens', desc: 'Trendy street style hoodie.' },
    { id: 6, name: 'Casual Hoodie Green', price: 599, category: 'mens', desc: 'Comfortable casual hoodie.' },
    
    // Mens Sweatshirts - ৳499
    { id: 7, name: 'Sweatshirt Classic', price: 499, category: 'mens', desc: 'Comfortable sweatshirt for casual wear.' },
    { id: 8, name: 'Sweatshirt Modern', price: 499, category: 'mens', desc: 'Modern design sweatshirt.' },
    { id: 9, name: 'Sweatshirt Sport', price: 499, category: 'mens', desc: 'Perfect for sports and outdoor.' },
    { id: 10, name: 'Sweatshirt Urban', price: 499, category: 'mens', desc: 'Urban style sweatshirt.' },
    { id: 11, name: 'Sweatshirt Comfort', price: 499, category: 'mens', desc: 'Maximum comfort sweatshirt.' },
    
    // Baby Products - ৳99
    { id: 12, name: 'Baby Romper Cute', price: 99, category: 'baby', desc: 'Adorable baby romper.' },
    { id: 13, name: 'Baby Set Soft', price: 99, category: 'baby', desc: 'Soft baby clothing set.' },
    { id: 14, name: 'Baby Outfit Cozy', price: 99, category: 'baby', desc: 'Cozy baby outfit.' },
    { id: 15, name: 'Baby Dress Pink', price: 99, category: 'baby', desc: 'Cute pink baby dress.' },
    
    // Girls Products
    { id: 16, name: 'Girls Dress Pretty', price: 399, category: 'girls', desc: 'Beautiful dress for girls.' },
    { id: 17, name: 'Girls Top Stylish', price: 299, category: 'girls', desc: 'Stylish top for girls.' },
    { id: 18, name: 'Girls Outfit Trendy', price: 449, category: 'girls', desc: 'Trendy outfit for girls.' },
    { id: 19, name: 'Girls Skirt Cute', price: 349, category: 'girls', desc: 'Cute skirt for girls.' },
    
    // Accessories
    { id: 20, name: 'Cap Classic', price: 199, category: 'accessories', desc: 'Classic style cap.' },
    { id: 21, name: 'Bag Modern', price: 349, category: 'accessories', desc: 'Modern design bag.' },
    { id: 22, name: 'Scarf Warm', price: 249, category: 'accessories', desc: 'Warm winter scarf.' },
    { id: 23, name: 'Socks Comfort', price: 149, category: 'accessories', desc: 'Comfortable socks pack.' },
  ];
}

// ===== Product Card HTML =====
function productCardHTML(p) {
  return `
    <article class="product-card" data-id="${p.id}">
      <div class="product-thumb">
        ${p.name.split(' ')[0]}
      </div>
      <div class="product-info">
        <div class="product-title">${escapeHtml(p.name)}</div>
        <div class="product-price">৳${p.price}</div>
        <div style="color:var(--muted);font-size:13px">${escapeHtml(p.desc)}</div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn primary" onclick="addToCart(${p.id})">
            <i class="fas fa-shopping-cart"></i> Add to cart
          </button>
        </div>
      </div>
    </article>
  `;
}

// ===== Render Products =====
function renderProducts(reset = false) {
  if (reset) {
    currentPage = 1;
    visibleProducts = [];
  }
  
  let list = (currentCategory === 'all') ? products.slice() : products.filter(p => p.category === currentCategory);
  
  // Apply search filter
  const q = ($('#searchInput')?.value || '').trim().toLowerCase();
  if (q) {
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.desc.toLowerCase().includes(q)
    );
  }
  
  // Apply sort
  const sort = $('#sortSelect')?.value;
  if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  
  const start = (currentPage - 1) * perPage;
  const nextItems = list.slice(start, start + perPage);
  visibleProducts = visibleProducts.concat(nextItems);
  
  const grid = $('#productsGrid');
  if (visibleProducts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)">
        <i class="fas fa-search" style="font-size:48px;margin-bottom:16px;color:#d1d5db"></i>
        <h3>No products found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    `;
  } else {
    grid.innerHTML = visibleProducts.map(p => productCardHTML(p)).join('');
  }
  
  // Show/hide load more button
  const loadMoreBtn = $('#loadMoreBtn');
  if (start + perPage >= list.length) {
    loadMoreBtn.style.display = 'none';
  } else {
    loadMoreBtn.style.display = 'inline-block';
  }
  
  // Update title
  const titleMap = {
    'all': 'All Products',
    'mens': 'Mens Products',
    'girls': 'Girls Products',
    'baby': 'Baby Products',
    'accessories': 'Accessories'
  };
  $('#productsTitle').textContent = titleMap[currentCategory] || 'Products';
  
  updateCategoryNavActive();
}

// ===== Update Category Nav Active State =====
function updateCategoryNavActive() {
  $$('.cat-btn').forEach(btn => {
    const txt = btn.textContent.trim().toLowerCase();
    btn.classList.toggle('active', txt === currentCategory);
  });
}

// ===== Category / Search / Sort Functions =====
function showCategory(cat) {
  currentCategory = cat;
  visibleProducts = [];
  currentPage = 1;
  renderProducts(true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function performSearch() {
  visibleProducts = [];
  currentPage = 1;
  renderProducts(true);
}

function applySort() {
  visibleProducts = [];
  currentPage = 1;
  renderProducts(true);
}

function resetFilters() {
  $('#searchInput').value = '';
  $('#sortSelect').value = 'default';
  showCategory('all');
}

function loadMore() {
  currentPage++;
  renderProducts(false);
}

// ===== Cart Functions =====
function loadCart() {
  try {
    const s = localStorage.getItem('shopnar_cart_v1');
    if (s) cart = JSON.parse(s);
  } catch(e) {
    cart = [];
  }
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('shopnar_cart_v1', JSON.stringify(cart));
}

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  
  const found = cart.find(i => i.id === id);
  if (found) {
    found.qty++;
  } else {
    cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
  }
  
  saveCart();
  updateCartUI();
  showTransient('✓ Added to cart!');
}

function updateCartUI() {
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  $('#cartCount').textContent = totalItems || 0;
  
  const itemsEl = $('#cartItems');
  if (!itemsEl) return;
  
  if (cart.length === 0) {
    itemsEl.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart" style="font-size:48px;color:#d1d5db;margin-bottom:16px"></i>
        <p style="color:var(--muted)">Your cart is empty</p>
        <p style="color:var(--muted);font-size:13px;margin-top:4px">Add some products to get started!</p>
      </div>
    `;
    updateTotals();
    return;
  }
  
  itemsEl.innerHTML = cart.map(i => `
    <div style="padding:12px;border-bottom:1px solid #f3f4f6">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:14px">${escapeHtml(i.name)}</div>
          <div style="color:var(--muted);font-size:13px;margin-top:4px">৳${i.price} × ${i.qty}</div>
        </div>
        <div style="font-weight:700;font-size:16px;margin-left:8px">৳${i.price * i.qty}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn" onclick="changeQty(${i.id}, -1)" style="padding:6px 12px" title="Decrease">−</button>
        <div style="padding:6px 12px;background:#f8f9fb;border-radius:6px;min-width:40px;text-align:center;font-weight:600">${i.qty}</div>
        <button class="btn" onclick="changeQty(${i.id}, 1)" style="padding:6px 12px" title="Increase">+</button>
        <button class="btn outline" onclick="removeFromCart(${i.id})" style="margin-left:auto;padding:6px 12px" title="Remove">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
  
  updateTotals();
}

function changeQty(id, delta) {
  const it = cart.find(x => x.id === id);
  if (!it) return;
  
  it.qty += delta;
  if (it.qty <= 0) {
    removeFromCart(id);
    return;
  }
  
  saveCart();
  updateCartUI();
}

function removeFromCart(id) {
  cart = cart.filter(x => x.id !== id);
  saveCart();
  updateCartUI();
  showTransient('Item removed from cart');
}

function updateTotals() {
  const subtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
  $('#cartSubtotal').textContent = `৳${subtotal}`;
  $('#cartDelivery').textContent = `৳${DELIVERY_CHARGE}`;
  $('#cartTotal').textContent = `৳${subtotal + DELIVERY_CHARGE}`;
}

// ===== Toggle Cart =====
function toggleCart() {
  const el = $('#cartSidebar');
  if (!el) return;
  el.classList.toggle('open');
}

// ===== WhatsApp OTP System =====
function sendWhatsAppOTP() {
  const phone = $('#custPhone').value.trim();
  
  if (!phone || phone.length !== 11) {
    showTransient('⚠ Please enter a valid 11-digit phone number', 3000);
    return;
  }
  
  // Validate Bangladesh phone number
  if (!phone.startsWith('01')) {
    showTransient('⚠ Phone number must start with 01', 3000);
    return;
  }
  
  // Generate 6-digit OTP
  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Create WhatsApp message with OTP
  const message = `🔐 Your Shopnar-Shop OTP is: *${generatedOTP}*\n\nValid for 2 minutes.\n\n⚠️ Do not share this code with anyone.\n\n- Shopnar-Shop Team`;
  
  const whatsappURL = `https://wa.me/88${phone}?text=${encodeURIComponent(message)}`;
  
  // Open WhatsApp in new tab
  window.open(whatsappURL, '_blank');
  
  // Show success message
  showTransient(`📱 Opening WhatsApp to send OTP to ${phone}`, 3000);
  
  // Show OTP section
  $('#otpSection').style.display = 'block';
  $('#sendOtpBtn').innerHTML = '<i class="fas fa-check"></i> OTP Sent';
  $('#sendOtpBtn').disabled = true;
  
  // Start timer
  startOTPTimer();
  
  // Also log OTP in console for testing
  console.log('🔐 OTP for testing:', generatedOTP);
}

function startOTPTimer() {
  let timeLeft = 120; // 2 minutes
  
  if (otpTimer) clearInterval(otpTimer);
  
  otpTimer = setInterval(() => {
    timeLeft--;
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    $('#otpTimer').textContent = `⏱ OTP expires in ${mins}:${secs.toString().padStart(2, '0')}`;
    $('#otpTimer').style.color = '#6b7280';
    
    if (timeLeft <= 0) {
      clearInterval(otpTimer);
      generatedOTP = null;
      $('#otpTimer').textContent = '❌ OTP expired. Click "Send OTP" again.';
      $('#otpTimer').style.color = '#ef4444';
      $('#sendOtpBtn').disabled = false;
      $('#sendOtpBtn').innerHTML = '<i class="fas fa-redo"></i> Resend OTP';
    }
  }, 1000);
}

function verifyOTP() {
  const enteredOTP = $('#otpInput').value.trim();
  
  if (!enteredOTP || enteredOTP.length !== 6) {
    showTransient('⚠ Please enter a valid 6-digit OTP', 3000);
    return;
  }
  
  if (enteredOTP === generatedOTP) {
    isPhoneVerified = true;
    clearInterval(otpTimer);
    $('#verifiedMsg').style.display = 'block';
    $('#otpSection').style.display = 'none';
    $('#custPhone').disabled = true;
    $('#placeOrderBtn').disabled = false;
    showTransient('✓ Phone verified successfully!', 3000);
  } else {
    showTransient('❌ Invalid OTP. Please try again.', 3000);
    $('#otpInput').value = '';
    $('#otpInput').focus();
  }
}

// ===== Checkout Functions =====
function openCheckout() {
  if (cart.length === 0) {
    showTransient('⚠ Your cart is empty', 2500);
    return;
  }
  
  // Reset verification state
  isPhoneVerified = false;
  generatedOTP = null;
  if (otpTimer) clearInterval(otpTimer);
  
  $('#custPhone').disabled = false;
  $('#otpSection').style.display = 'none';
  $('#verifiedMsg').style.display = 'none';
  $('#sendOtpBtn').disabled = false;
  $('#sendOtpBtn').innerHTML = '<i class="fab fa-whatsapp"></i> Send OTP';
  $('#placeOrderBtn').disabled = true;
  $('#otpInput').value = '';
  $('#checkoutForm').reset();
  
  $('#checkoutModal').setAttribute('aria-hidden', 'false');
}

function closeCheckout() {
  $('#checkoutModal').setAttribute('aria-hidden', 'true');
  if (otpTimer) clearInterval(otpTimer);
}

function submitOrder(e) {
  e.preventDefault();
  
  if (cart.length === 0) {
    showTransient('⚠ Your cart is empty', 2500);
    return;
  }
  
  if (!isPhoneVerified) {
    showTransient('⚠ Please verify your phone number first', 3000);
    return;
  }
  
  const name = $('#custName').value.trim();
  const phone = $('#custPhone').value.trim();
  const address = $('#custAddress').value.trim();
  const paymentMethod = $('#paymentMethod').value;
  
  const order = {
    id: 'ORD' + Date.now(),
    name,
    phone,
    address,
    paymentMethod,
    items: cart,
    subtotal: cart.reduce((s, i) => s + (i.price * i.qty), 0),
    delivery: DELIVERY_CHARGE,
    total: cart.reduce((s, i) => s + (i.price * i.qty), 0) + DELIVERY_CHARGE,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  
  // Save orders locally
  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('shopnar_orders_v1') || '[]');
  } catch (e) {
    orders = [];
  }
  orders.push(order);
  localStorage.setItem('shopnar_orders_v1', JSON.stringify(orders));
  
  // Send order to email via Formspree
  sendOrderToEmail(order);
  
  // Clear cart
  cart = [];
  saveCart();
  updateCartUI();
  closeCheckout();
  
  // Show confirmation
  showTransient(`✓ Order placed successfully! Order ID: ${order.id}`, 5000);
  
  $('#checkoutForm').reset();
}

// ===== Send Order to Email via Formspree =====
async function sendOrderToEmail(order) {
  try {
    // Create items list for email
    const itemsList = order.items.map(i => 
      `${i.name} x${i.qty} = ৳${i.price * i.qty}`
    ).join('\n');
    
    // Payment method display
    const paymentDisplay = {
      'cod': 'Cash on Delivery (COD)',
      'bkash': 'bKash',
      'nagad': 'Nagad',
      'bank': 'Bank Transfer'
    };
    
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        subject: `🛒 New Order: ${order.id}`,
        message: `
NEW ORDER RECEIVED
==================

Order ID: ${order.id}
Order Date: ${new Date(order.createdAt).toLocaleString('en-BD')}

CUSTOMER DETAILS
----------------
Name: ${order.name}
Phone: ${order.phone}
Address: ${order.address}

ORDER DETAILS
-------------
${itemsList}

PRICING
-------
Subtotal: ৳${order.subtotal}
Delivery Charge: ৳${order.delivery}
TOTAL: ৳${order.total}

PAYMENT METHOD
--------------
${paymentDisplay[order.paymentMethod] || order.paymentMethod}

Please process this order as soon as possible.

---
Shopnar-Shop Automated System
        `.trim(),
        _replyto: 'shopnarshop@gmail.com',
        orderId: order.id,
        customerName: order.name,
        customerPhone: order.phone,
        orderTotal: order.total
      })
    });
    
    if (response.ok) {
      console.log('✓ Order email sent successfully to shopnarshop@gmail.com');
    } else {
      console.warn('⚠ Email sending failed. Please check Formspree setup.');
      console.log('Response:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error sending order email:', error);
    console.log('💡 Make sure to replace YOUR_FORM_ID with your actual Formspree form ID');
  }
}

// ===== Transient Message =====
function showTransient(msg, time = 2500) {
  const n = document.createElement('div');
  n.style.cssText = `
    position:fixed;
    top:80px;
    right:20px;
    background:#fff;
    padding:12px 16px;
    border-radius:8px;
    box-shadow:0 10px 30px rgba(0,0,0,0.15);
    z-index:20000;
    max-width:320px;
    animation:slideIn 0.3s ease;
  `;
  n.innerHTML = `
    <div style="font-weight:600;margin-bottom:4px">${SITE_NAME}</div>
    <div style="font-size:13px;color:var(--muted)">${msg}</div>
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { opacity:0; transform:translateX(20px); }
      to { opacity:1; transform:translateX(0); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(n);
  
  setTimeout(() => {
    n.style.opacity = '0';
    n.style.transform = 'translateX(20px)';
    n.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      n.remove();
      style.remove();
    }, 300);
  }, time);
}

// ===== Mobile Menu Toggle =====
function toggleMobileMenu() {
  const ms = $('#mobileSidebar');
  if (!ms) return;
  ms.classList.toggle('active');
}

// ===== Admin Functions (Console) =====
function viewAllOrders() {
  try {
    const orders = JSON.parse(localStorage.getItem('shopnar_orders_v1') || '[]');
    console.table(orders);
    return orders;
  } catch (e) {
    return [];
  }
}

function exportOrdersToCSV() {
  const orders = viewAllOrders();
  
  if (orders.length === 0) {
    alert('No orders to export');
    return;
  }
  
  let csv = 'Order ID,Customer Name,Phone,Address,Payment Method,Items,Subtotal,Delivery,Total,Date,Status\n';
  
  orders.forEach(order => {
    const items = order.items.map(i => `${i.name}(x${i.qty})`).join('; ');
    const row = [
      order.id,
      order.name,
      order.phone,
      order.address.replace(/,/g, ' '),
      order.paymentMethod,
      items,
      order.subtotal,
      order.delivery,
      order.total,
      new Date(order.createdAt).toLocaleString(),
      order.status || 'pending'
    ].map(field => `"${field}"`).join(',');
    
    csv += row + '\n';
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shopnar-orders-${Date.now()}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// ===== Initialize =====
function initUI() {
  generateProducts();
  loadCart();
  showCategory('all');
  
  $('#year').textContent = new Date().getFullYear();
  
  // Close modals/sidebars on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCheckout();
      const ms = $('#mobileSidebar');
      if (ms && ms.classList.contains('active')) toggleMobileMenu();
      const cs = $('#cartSidebar');
      if (cs && cs.classList.contains('open')) toggleCart();
    }
  });
  
  // Close cart when clicking outside
  document.addEventListener('click', (e) => {
    const cs = $('#cartSidebar');
    const cartBtn = $('#cartBtn');
    if (cs && cs.classList.contains('open') && !cs.contains(e.target) && !cartBtn.contains(e.target)) {
      toggleCart();
    }
  });
  
  // Search on Enter
  $('#searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // Admin console instructions
  console.log('%c📦 Shopnar-Shop Admin Panel', 'color: #2563eb; font-size: 18px; font-weight: bold');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6b7280');
  console.log('%c📊 View all orders:', 'color: #059669; font-weight: bold');
  console.log('   viewAllOrders()');
  console.log('%c💾 Export to CSV:', 'color: #059669; font-weight: bold');
  console.log('   exportOrdersToCSV()');
  console.log('%c🗑️  Clear all orders:', 'color: #dc2626; font-weight: bold');
  console.log('   localStorage.removeItem("shopnar_orders_v1")');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6b7280');
  
  // Show setup reminder if Formspree not configured
  if (FORMSPREE_ENDPOINT.includes('YOUR_FORM_ID')) {
    console.warn('%c⚠️  SETUP REQUIRED', 'color: #f59e0b; font-size: 16px; font-weight: bold');
    console.log('%cPlease configure Formspree:', 'color: #f59e0b');
    console.log('1. Go to https://formspree.io');
    console.log('2. Create a free account');
    console.log('3. Create a new form');
    console.log('4. Set email to: shopnarshop@gmail.com');
    console.log('5. Copy your form ID');
    console.log('6. Replace YOUR_FORM_ID in script.js with your actual form ID');
  }
}

// Start app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUI);
} else {
  initUI();
}