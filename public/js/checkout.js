import { request, euro, escapeHTML, refreshHeader } from "./api.js";

const itemsNode = document.querySelector("#checkout-items");
const placeOrder = document.querySelector("#place-order");
const message = document.querySelector("#checkout-message");
let currentCart = null;
let currentUser = null;

async function loadCheckout() {
  const [cart, auth] = await Promise.all([
    request("/api/cart"),
    request("/api/auth/me"),
  ]);
  currentCart = cart;
  currentUser = auth.user;
  document.querySelector("#checkout-subtotal").textContent = euro(
    cart.totalCents,
  );
  document.querySelector("#checkout-total").textContent = euro(cart.totalCents);
  if (!cart.items.length) {
    itemsNode.innerHTML =
      '<p class="empty-basket">Your basket is empty. Find a favourite in the shop.</p>';
    placeOrder.disabled = true;
  } else {
    itemsNode.innerHTML = cart.items
      .map(
        (item) => `
      <div class="checkout-item"><img src="${escapeHTML(item.image)}" alt=""><div><h3>${escapeHTML(item.name)}</h3><p>${item.quantity} × ${euro(item.priceCents)}</p></div><strong>${euro(item.lineTotalCents)}</strong></div>`,
      )
      .join("");
    placeOrder.disabled = false;
  }
  const authNote = document.querySelector("#checkout-auth-note");
  if (!currentUser) {
    authNote.innerHTML =
      'Please <a href="/login.html?next=checkout">sign in</a> or <a href="/register.html?next=checkout">create an account</a> to place an order.';
    placeOrder.disabled = true;
  } else {
    authNote.textContent = `Placing this order as ${currentUser.email}.`;
  }
  await refreshHeader();
}

placeOrder.addEventListener("click", async () => {
  message.textContent = "";
  placeOrder.disabled = true;
  try {
    const result = await request("/api/checkout", {
      method: "POST",
      body: "{}",
    });
    itemsNode.innerHTML = `<div class="order-success"><span aria-hidden="true">✳</span><h3>It’s on its way.</h3><p>${escapeHTML(result.message)}</p><p class="order-reference">Order #${result.orderId} · ${euro(result.totalCents)}</p></div>`;
    document.querySelector("#checkout-auth-note").textContent = "";
    document.querySelector("#checkout-subtotal").textContent = euro(0);
    document.querySelector("#checkout-total").textContent = euro(0);
    message.textContent = "Order placed successfully.";
    await refreshHeader();
  } catch (error) {
    if (error.status === 401) {
      window.location.assign("/login.html?next=checkout");
      return;
    }
    message.textContent = error.message;
    placeOrder.disabled = !currentCart?.items.length || !currentUser;
  }
});

loadCheckout().catch((error) => {
  itemsNode.innerHTML = `<p class="load-error">${escapeHTML(error.message)} Please return to the shop and try again.</p>`;
  placeOrder.disabled = true;
});
