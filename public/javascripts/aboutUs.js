document.addEventListener('DOMContentLoaded', () => {
    // This script should only run on the announcement details page.
    const anncIDElement = document.querySelector('#anncID');
    if (!anncIDElement) {
        return; // Exit if not on the correct page
    }

    const anncID = anncIDElement.value;
    const form = document.querySelector('#commentForm');
    const galImg = document.querySelector('.galleryImgs');

    // --- Comment form logic ---
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const textarea = form.querySelector('#comment').value;
            if (!textarea.trim()) {
                alert('Comment cannot be empty.');
                return;
            }
            // Fetch logic for submitting a comment...
        });
    }

    // --- Image viewer logic ---
    if (galImg && typeof imageViewer !== 'undefined') {
        new imageViewer(galImg);
    }
    
    // --- Initial data load for the page ---
    fetch(`/Announcement/${anncID}/getComments`)
        .then(response => response.json())
        .then(res => {
            if (res.success) {
                // Your loadComments(res.data) function would go here
            }
        });
});