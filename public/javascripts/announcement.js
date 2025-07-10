document.addEventListener('DOMContentLoaded', () => {
    const anncList = document.querySelector('.anncList');

    if (anncList) {
        anncList.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (li) {
                const hiddenInput = li.querySelector('input[type=hidden]');
                if (hiddenInput && hiddenInput.value) {
                    window.location.href = `/Announcement/${hiddenInput.value}`;
                }
            }
        });
    }
});