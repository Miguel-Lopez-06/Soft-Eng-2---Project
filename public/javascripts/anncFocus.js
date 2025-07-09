document.addEventListener('DOMContentLoaded', () => {
    const anncIDElement = document.querySelector('#anncID');

    // --- Main safety check ---
    // Only run this code if we are on an announcement details page.
    if (!anncIDElement) {
        return;
    }
    
    const anncID = anncIDElement.value;
    const form = document.querySelector('#commentForm');

    if (form) {
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
              fetchComments();
            } else {
              alert(res.message || 'Failed to submit comment.');
            }
          });
      });
    }

    const commentUL = document.querySelector('.commentList');
    const flaggedUL = document.querySelector('.flaggedList');

    const loadComments = (data) => {
        if (!commentUL || !flaggedUL) return;
        commentUL.innerHTML = '';
        flaggedUL.innerHTML = '';
        // ... (rest of loadComments function remains the same) ...
    };

    const fetchComments = () => {
        fetch(`/Announcement/${anncID}/getComments`)
          .then(response => response.json())
          .then(res => {
            if (res.success) {
              loadComments(res.data);
            }
          });
    };

    // Initial load for the page
    fetchComments();
    const galImg = document.querySelector('.galleryImgs');
    if (galImg && typeof imageViewer !== 'undefined') {
        new imageViewer(galImg);
    }
});