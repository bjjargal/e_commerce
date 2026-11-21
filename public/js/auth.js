import { request } from './api.js';

const form = document.querySelector('#auth-form');
const message = document.querySelector('#form-message');
const isRegistration = Boolean(document.querySelector('#fullName'));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  if (!form.reportValidity()) return;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = isRegistration ? 'Creating your account…' : 'Signing you in…';
  try {
    await request(isRegistration ? '/api/auth/register' : '/api/auth/login', {
      method: 'POST', body: JSON.stringify(payload)
    });
    window.location.assign('/');
  } catch (error) {
    message.textContent = error.message;
    submitButton.disabled = false;
    submitButton.innerHTML = isRegistration ? 'Create my account <span aria-hidden="true">→</span>' : 'Sign in <span aria-hidden="true">→</span>';
  }
});
