import { request } from "./api.js";

const form = document.querySelector("#auth-form");
const message = document.querySelector("#form-message");
const isRegistration = Boolean(document.querySelector("#fullName"));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const email = String(payload.email || "").trim();
  const password = String(payload.password || "");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (isRegistration) {
    const fullName = String(payload.fullName || "").trim();
    if (fullName.length < 2 || fullName.length > 80) {
      message.textContent = "Enter a name between 2 and 80 characters.";
      return;
    }
  }
  if (!emailPattern.test(email) || email.length > 254) {
    message.textContent = "Enter a valid email address.";
    return;
  }
  if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
    message.textContent =
      "Choose a password with at least 8 characters and no more than 72 UTF-8 bytes.";
    return;
  }
  if (isRegistration && password !== payload.confirmPassword) {
    message.textContent = "Your passwords do not match.";
    return;
  }
  if (!form.checkValidity()) {
    message.textContent = "Please complete all required fields.";
    return;
  }

  delete payload.confirmPassword;
  payload.email = email;
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = isRegistration
    ? "Creating your account…"
    : "Signing you in…";
  try {
    await request(isRegistration ? "/api/auth/register" : "/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.assign(next === "checkout" ? "/checkout.html" : "/");
  } catch (error) {
    message.textContent = error.message;
    submitButton.disabled = false;
    submitButton.innerHTML = isRegistration
      ? 'Create my account <span aria-hidden="true">→</span>'
      : 'Sign in <span aria-hidden="true">→</span>';
  }
});
