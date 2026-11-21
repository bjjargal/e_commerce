export async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Please try again in a moment.');
  return data;
}

export function euro(cents) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export async function refreshHeader() {
  const actions = document.querySelector('#header-actions');
  if (!actions) return;
  try {
    const [{ user }, cart] = await Promise.all([request('/api/auth/me'), request('/api/cart')]);
    const count = document.querySelector('#bag-count');
    if (count) count.textContent = cart.itemCount;
    const bag = actions.querySelector('.bag-link');
    if (bag) bag.setAttribute('aria-label', `Basket, ${cart.itemCount} ${cart.itemCount === 1 ? 'item' : 'items'}`);
    if (user) {
      actions.innerHTML = `<span class="welcome-name">Hi, ${escapeHTML(user.fullName.split(' ')[0])}</span><button class="text-link" id="sign-out" type="button">Sign out</button><a class="bag-link" href="#basket" aria-label="Basket, ${cart.itemCount} items"><span aria-hidden="true">Bag</span><span class="bag-count" id="bag-count">${cart.itemCount}</span></a>`;
      document.querySelector('#sign-out')?.addEventListener('click', async () => {
        await request('/api/auth/logout', { method: 'POST', body: '{}' });
        window.location.reload();
      });
    }
  } catch {
    // The page can still render its catalogue if the account status request fails.
  }
}
