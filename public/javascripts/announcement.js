const anncList = document.querySelector('.anncList');

anncList.addEventListener('click', (e) => {
  const li = e.target.closest('li');

  if(li){
    const hiddenInput = li.querySelector('input[type=hidden]');
    if(hiddenInput){
      const id = hiddenInput.value;
      
      window.location.href = `/Announcement/${id}`;
    }
  }
});