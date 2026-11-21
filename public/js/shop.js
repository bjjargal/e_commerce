import { request, euro, escapeHTML, refreshHeader } from './api.js';

const productGrid = document.querySelector('#product-grid');
const basketItems = document.querySelector('#basket-items');
const status = document.querySelector('#shop-status');

function renderProducts(products) {
  productGrid.innerHTML = products.map((product) => `
    <article class="product-card">
      <div class="product-image-wrap"><img class="product-image" src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy"><span class="product-category">${escapeHTML(product.category)}</span></div>
      <div class="product-info"><div><h3>${escapeHTML(product.name)}</h3><p>${escapeHTML(product.description)}</p></div><div class="product-buy"><strong>${euro(product.priceCents)}</strong><button class="add-button" type="button" data-add="${product.id}" aria-label="Add ${escapeHTML(product.name)} to basket">Add <span aria-hidden="true">+</span></button></div></div>
    </article>`).join('');
  document.querySelector('#result-count').textContent = `${products.length} thoughtful pieces`;
  productGrid.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await request('/api/cart/items', { method: 'POST', body: JSON.stringify({ productId: Number(button.dataset.add) }) });
      status.textContent = 'Added to your basket.';
      await Promise.all([renderBasket(), refreshHeader()]);
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  }));
}

async function renderBasket() {
  const cart = await request('/api/cart');
  document.querySelector('#basket-total').textContent = euro(cart.totalCents);
  if (!cart.items.length) {
    basketItems.innerHTML = '<p class="empty-basket">Your basket is ready for something lovely.</p>';
  } else {
    basketItems.innerHTML = cart.items.map((item) => `
      <div class="basket-item"><img src="${escapeHTML(item.image)}" alt=""><div class="basket-item-copy"><strong>${escapeHTML(item.name)}</strong><span>${item.quantity} × ${euro(item.priceCents)}</span></div><strong>${euro(item.lineTotalCents)}</strong><button class="remove-button" type="button" data-remove="${item.id}" aria-label="Remove ${escapeHTML(item.name)} from basket">×</button></div>`).join('');
    basketItems.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', async () => {
      await request(`/api/cart/items/${button.dataset.remove}`, { method: 'DELETE' });
      await Promise.all([renderBasket(), refreshHeader()]);
    }));
  }
  const checkoutLink = document.querySelector('#checkout-link');
  checkoutLink.classList.toggle('button-disabled', !cart.items.length);
  checkoutLink.setAttribute('aria-disabled', String(!cart.items.length));
}

async function init() {
  try {
    const { products } = await request('/api/products');
    renderProducts(products);
    await renderBasket();
    await refreshHeader();
  } catch (error) {
    productGrid.innerHTML = `<p class="load-error">${escapeHTML(error.message)} Start the server and refresh the page.</p>`;
  }
}

init();
