const anncID = document.querySelector('#anncID').value;
const form = document.querySelector('#commentForm');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const textarea = form.querySelector('#comment').value;

  if (!textarea.trim()) {
    alert('Comment cannot be empty.');
    return;
  }

  fetch(`/Announcement/${anncID}/addComment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: textarea }),
  })
    .then(response => response.json())
    .then(res => {
      if (res.success) {
        form.reset();

        fetch(`/Announcement/${anncID}/getComments`)
          .then(response => response.json())
          .then(res => {
            if (res.success) {
              loadComments(res.data);
            }
          })
          .catch(error => {
            console.error('Error fetching comments:', error);
          });
      } else {
        alert(res.message || 'Failed to submit comment.');
      }
    })
    .catch(error => {
      console.error('Error submitting comment:', error);
    });
});

const commentUL = document.querySelector('.commentList');
const flaggedUL = document.querySelector('.flaggedList');

const loadComments = (data) => {
  commentUL.innerHTML = '';
  flaggedUL.innerHTML = '';

  for (const comment of data) {
    const { Text, CommentDate, Status } = comment;
    const li = document.createElement('li');
    const img = document.createElement('img');
    const p = document.createElement('p');
    const span = document.createElement('span');
    const txt = document.createElement('div');

    const setDate = new Date(CommentDate);
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
    const formattedDate = setDate.toLocaleString('en-US', options);

    p.textContent = Text;
    span.textContent = formattedDate;
    img.src = '../images/svg/circle-user.svg';
    img.alt = 'user';
    img.classList.add('user-placeholder');

    txt.appendChild(span);
    txt.appendChild(p);
    li.appendChild(img);
    li.appendChild(txt);

    if (Status === 'flagged') {
      flaggedUL.appendChild(li);
    } else if (Status === 'approved') {
      commentUL.appendChild(li);
    }
  }
};

window.onload = () => {
  fetch(`/Announcement/${anncID}/getComments`)
    .then(response => response.json())
    .then(res => {
      if (res.success) {
        loadComments(res.data);
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });

  const galImg = document.querySelector('.galleryImgs');

  new imageViewer(galImg);
};