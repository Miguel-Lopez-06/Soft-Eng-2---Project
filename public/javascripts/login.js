const form = document.querySelector('form');
const error = document.querySelector('p');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const username = form.querySelector('#username').value;
  const password = form.querySelector('#password').value;
  
  fetch('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  .then(response => response.json())
  .then(res => {
    if(res.success){
      window.location.href = '/admin';
    }
    else{
      error.style.opacity = '1';
      error.textContent = res.message;
    }
  })
  .catch(err => {
    console.error('Login failed', err);
    error.style.opacity = '1';
    error.textContent = 'An error occurred. Please try again.';
  });
});