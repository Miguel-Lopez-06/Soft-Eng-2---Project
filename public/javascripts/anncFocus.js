const anncID = document.querySelector('#anncID').value;
const form = document.querySelector('#commentForm');

// Main form submission for top-level comments
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const textarea = form.querySelector('#comment').value;

    if (!textarea.trim()) {
        alert('Comment cannot be empty.');
        return;
    }

    // This fetch is for TOP-LEVEL comments, so parentId is null
    fetch(`/Announcement/${anncID}/addComment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textarea, parentId: null }),
        })
        .then(response => response.json())
        .then(res => {
            if (res.success) {
                form.reset();
                // Refresh all comments after posting
                fetch(`/Announcement/${anncID}/getComments`)
                    .then(response => response.json())
                    .then(res => {
                        if (res.success) {
                            loadComments(res.data);
                        }
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

/**
 * This is a helper function to create a comment element.
 * It's needed to avoid duplicating a lot of code when handling replies.
 */
function buildCommentElement(comment, isTopLevel) {
    const li = document.createElement('li');
    li.classList.add('comment-item');
    li.dataset.commentId = comment.CommentID;

    const img = document.createElement('img');
    const p = document.createElement('p');
    const span = document.createElement('span');
    const txt = document.createElement('div');
    
    const setDate = new Date(comment.CommentDate);
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
    const formattedDate = setDate.toLocaleString('en-US', options);

    p.textContent = comment.Text;
    span.textContent = formattedDate;
    img.src = '/images/svg/circle-user.svg';
    img.alt = 'user';
    img.classList.add('user-placeholder');

    txt.appendChild(span);
    txt.appendChild(p);
    
    li.appendChild(img);
    li.appendChild(txt);

    // --- Start: Conditional Reply Functionality ---
    // This block now ONLY runs if it's a top-level comment.
    if (isTopLevel) {
        const replyButton = document.createElement('button');
        replyButton.textContent = 'Reply';
        replyButton.className = 'reply-btn';
        txt.appendChild(replyButton);

        const replyForm = document.createElement('form');
        replyForm.className = 'reply-form';
        replyForm.style.display = 'none';
        replyForm.innerHTML = `
            <textarea placeholder="Write a reply..."></textarea>
            <div>
                <button type="button" class="cancel-reply-btn">Cancel</button>
                <button type="submit">Send</button>
            </div>
        `;
        li.appendChild(replyForm);

        replyButton.addEventListener('click', () => {
            replyForm.style.display = 'flex';
        });
        
        replyForm.querySelector('.cancel-reply-btn').addEventListener('click', () => {
            replyForm.style.display = 'none';
        });

        replyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const replyText = replyForm.querySelector('textarea').value;
            const parentId = comment.CommentID;

            // This fetch logic is now only attached to top-level comments
            fetch(`/Announcement/${anncID}/addComment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: replyText, parentId: parentId }),
            })
            .then(response => response.json())
            .then(res => {
                if (res.success) {
                    fetch(`/Announcement/${anncID}/getComments`)
                        .then(response => response.json())
                        .then(res => {
                            if (res.success) {
                                loadComments(res.data);
                            }
                        });
                } else {
                    alert(res.message || 'Failed to submit reply.');
                }
            })
            .catch(error => console.error('Error submitting reply:', error));
        });
    }
    // --- End: Conditional Reply Functionality ---

    // --- Recursive Replies Display ---
    if (comment.replies && comment.replies.length > 0) {
        const repliesUL = document.createElement('ul');
        repliesUL.className = 'replies-list';
        for (const reply of comment.replies) {
            // Pass `false` here because these are sub-comments.
            repliesUL.appendChild(buildCommentElement(reply, false));
        }
        li.appendChild(repliesUL);
    }
    
    return li;
}


const loadComments = (data) => {
    commentUL.innerHTML = '';
    if (flaggedUL) flaggedUL.innerHTML = '';

    for (const comment of data) {
        // Pass `true` here because these are the top-level comments.
        const commentElement = buildCommentElement(comment, true);

        if (comment.Status === 'flagged' && flaggedUL) {
            flaggedUL.appendChild(commentElement);
        } else if (comment.Status === 'approved') {
            commentUL.appendChild(commentElement);
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
    if (typeof imageViewer !== 'undefined') {
        new imageViewer(galImg);
    }
};