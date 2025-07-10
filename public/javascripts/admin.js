// kimochei/soft-eng-2---project/Soft-Eng-2---Project-c24c8b05dea436a72ccda853b6f8d09b5d7fbf56/public/javascripts/admin.js

const mainTabs = document.querySelectorAll('[data-nav-tabs]');
const mainWindows = document.querySelectorAll('[data-nav-windows]');
let logsLoaded = false;
let currentLogs = []; // Variable to store log data for export

mainTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    mainWindows.forEach((window, i) => {
      if (tab.dataset.navTabs === window.dataset.navWindows) {
        mainTabs[i].classList.add('selected');
        window.classList.add('show');
      } else {
        mainTabs[i].classList.remove('selected');
        window.classList.remove('show');
      }
    });

    if (tab.dataset.navTabs === 'Logs' && !logsLoaded) {
      loadAdminLogs();
    }
  });
});

/**
 * Fetches log data from the server and triggers display functions.
 */
async function loadAdminLogs() {
  try {
    const response = await fetch('/admin/logs');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (data.success) {
      currentLogs = data.logs; // Store logs for later use (like export)
      displayLogTable(currentLogs);
      displayLogAnalytics(currentLogs);
      logsLoaded = true; // Mark logs as loaded to prevent re-fetching
    } else {
      console.error('Failed to load logs:', data.message);
      document.querySelector('.logs-tbody').innerHTML = `<tr><td colspan="4">Error: ${data.message}</td></tr>`;
    }
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    document.querySelector('.logs-tbody').innerHTML = `<tr><td colspan="4">Could not fetch logs. See console for details.</td></tr>`;
  }
}

/**
 * Renders the fetched log data into the main table.
 */
function displayLogTable(logs) {
    const tbody = document.querySelector('.logs-tbody');
    if (!tbody) return;

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No logs found.</td></tr>';
        return;
    }

    const rowsHTML = logs.map(log => {
      const formattedTimestamp = new Date(log.Timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

      return `
        <tr>
            <td>${log.LogID}</td>
            <td>${log.AdminID}</td>
            <td>${log.Action}</td>
            <td>${formattedTimestamp}</td>
        </tr>
    `}).join('');
    
    tbody.innerHTML = rowsHTML;
}

/**
 * Processes log data to calculate analytics and displays them.
 */
function displayLogAnalytics(logs) {
    const analyticsContainer = document.querySelector('.analytics-container');
    if (!analyticsContainer) return;

    const analytics = {};
    logs.forEach(log => {
        if (!analytics[log.AdminID]) {
            analytics[log.AdminID] = { total: 0, actions: {} };
        }
        analytics[log.AdminID].total++;
        const actionType = log.Action.split(' ')[0].toUpperCase().replace(':', '');
        analytics[log.AdminID].actions[actionType] = (analytics[log.AdminID].actions[actionType] || 0) + 1;
    });

    let analyticsHTML = '';
    for (const adminId in analytics) {
        const data = analytics[adminId];
        let actionsHTML = '';
        for (const action in data.actions) {
            actionsHTML += `<li>${action}: <strong>${data.actions[action]}</strong></li>`;
        }
        analyticsHTML += `
            <div class="analytics-card">
                <h3>Admin ID: ${adminId}</h3>
                <p>Total Actions: <strong>${data.total}</strong></p>
                <ul>${actionsHTML}</ul>
            </div>
        `;
    }
    analyticsContainer.innerHTML = analyticsHTML || '<p>No activity to analyze.</p>';
}

/**
 * Exports the currently stored log data to an Excel file.
 */
function exportLogsToSheet() {
    if (currentLogs.length === 0) {
        alert('No log data to export.');
        return;
    }
    // Create a new worksheet from the JSON data
    const worksheet = XLSX.utils.json_to_sheet(currentLogs);
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "AdminLogs");
    // Write the workbook and trigger a download
    XLSX.writeFile(workbook, "AdminActivityLogs.xlsx");
}

// Attach event listener to the export button after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('export-logs-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportLogsToSheet);
    }
});


// =================================================================
// BELOW IS YOUR EXISTING CODE FOR OTHER TABS, LEFT UNCHANGED
// =================================================================

const anncForm = document.querySelector('#announcementForm');
const anncUpdateId = anncForm.querySelector('[type=hidden]');
const anncMainImg = anncForm.querySelector('#ancMainImg');
const anncLabel = anncForm.querySelector('label[for="ancMainImg"]');
const mainImg = anncLabel.querySelector('.imagePreview');
const anncP = anncLabel.querySelector('p');
const anncTitle = anncForm.querySelector('#ancTitle');
const anncDesc = anncForm.querySelector('#ancDescription');
const anncGalImg = anncForm.querySelector('#ancGalleryImg');
const galImg = anncForm.querySelector('.galleryImages');
const anncError = anncForm.querySelector('.errorMsg');
let formType;

function createGalleryItem(file) {
    const li = document.createElement('li');
    li.fileData = file;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = `<img src="../images/svg/xmark.svg" loading="lazy" alt="xmark">`;
    li.appendChild(btn);
    const mediaElement = createMediaElement(URL.createObjectURL(file));
    mediaElement.classList.add('galImg');
    li.appendChild(mediaElement);
    btn.addEventListener('click', () => {
        galImg.removeChild(li);
    });
    return li;
}

anncGalImg.addEventListener('change', (e) => {
  const files = e.target.files;
  const addGalleryImg = galImg.querySelector('.addImg');
  for(const file of files){
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      const galleryItem = createGalleryItem(file);
      addGalleryImg.before(galleryItem);
    }
  }
   e.target.value = null;
});

function clearAnncForm(){
  galImg.innerHTML = `<li class="addImg"><label for="ancGalleryImg"><div>+</div></label></li>`;
  anncForm.reset();
  mainImg.src = '';
  mainImg.style.display = 'none';
  anncLabel.classList.remove('hasImg');
  anncP.style.display = 'block';
  anncMainImg.value = '';
  anncGalImg.value = '';
}

anncForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const mainImgFile = anncMainImg.files[0];
  if (!mainImgFile && formType === 'Add') {
    anncError.innerText = '*No cover photo/video selected.';
    anncError.style.opacity = '1';
    return;
  }
  anncError.style.opacity = '0';
  const formData = new FormData();
  formData.append('title', anncTitle.value);
  formData.append('description', anncDesc.value);
  if (mainImgFile) {
    formData.append('mainImg', mainImgFile);
  } else if (formType === 'Edit') {
    formData.append('existingMainImg', mainImg.dataset.imgPath || '');
  }
  let url = '/admin/anncAdd';
  if (formType === 'Edit') {
    url = '/admin/anncUpdate';
    formData.append('id', anncUpdateId.value);
    const galleryItems = galImg.querySelectorAll('li:not(.addImg)');
    galleryItems.forEach(item => {
        if (item.fileData) {
            formData.append('galleryImgs', item.fileData);
        } else if (item.dataset.imgPath) {
            formData.append('existingGalleryImgs', item.dataset.imgPath);
        }
    });
  } else {
    const galleryItems = galImg.querySelectorAll('li:not(.addImg)');
    galleryItems.forEach(item => {
        if(item.fileData) {
            formData.append('galleryImgs', item.fileData);
        }
    });
  }
  fetch(url, {
    method: 'POST',
    body: formData,
  })
  .then(response => response.json())
  .then(res => {
    if (res.success) {
      clearAnncForm();
      closeModal();
      getData('annc').then(data => {
        if (data && data.success) loadAnnouncements(data);
      });
    } else {
      anncError.innerText = res.message || 'An error occurred during submission.';
      anncError.style.opacity = '1';
    }
  })
  .catch(error => {
    console.error("Error submitting form:", error);
    anncError.innerText = 'A network error occurred. Please try again.';
    anncError.style.opacity = '1';
  });
});

const conlForm = document.querySelector('#councilForm');
const conlUpdateId = conlForm.querySelector('[type=hidden]');
const conlMemberImg = conlForm.querySelector('#memberImg');
const memberLabel = conlForm.querySelector('label[for="memberImg"]');
const memberImg = memberLabel.querySelector('.imagePreview');
const conlP = memberLabel.querySelector('p');
const conlFName = conlForm.querySelector('#firstName');
const conlMInitial = conlForm.querySelector('#middleInitial');
const conlLName = conlForm.querySelector('#lastName');
const conlPosition = conlForm.querySelector('#position');
const conlError = conlForm.querySelector('.errorMsg');

function imageChange(inputElement, previewElement, labelElement, paragraphElement){
  inputElement.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      previewElement.src = URL.createObjectURL(file);
      previewElement.style.display = 'block';
      labelElement.classList.add('hasImg');
      paragraphElement.style.display = 'none';
    } else {
      previewElement.src = '';
      previewElement.style.display = 'none';
      labelElement.classList.remove('hasImg');
      paragraphElement.style.display = 'block';
    }
  });
}
imageChange(anncMainImg, mainImg, anncLabel, anncP);
imageChange(conlMemberImg, memberImg, memberLabel, conlP);

function clearConlForm(){
  conlForm.reset();
  memberImg.src = '';
  memberImg.style.display = 'none';
  memberLabel.classList.remove('hasImg');
  conlP.style.display = 'block';
}

conlForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const image = memberImg.dataset.imgName;
  if(!image){
    conlError.innerText = '*No cover photo selected.';
    conlError.style.opacity = '1';
    return;
  }
  conlError.style.opacity = '0';
  const data = {
    image: `../images/council members/${image}`,
    firstName: conlFName.value,
    mInitial: conlMInitial.value,
    lastName: conlLName.value,
    position: conlPosition.value,
  };
  let url = '/admin/councilAdd';
  if(formType === 'Edit'){
    url = '/admin/councilUpdate';
    data.id = conlUpdateId.value;
  }
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(res => {
      if(res.success){
        clearConlForm();
        closeModal();
        getData('council').then(data => {
          if(data && data.success) loadCouncil(data);
        });
      }
    });
});

const modalList = document.querySelector('.course-modal');
const modals = modalList.querySelectorAll('article');
const anncList = document.querySelector('.anncPreview');
const councilList = document.querySelector('.councilPreview');

function createMediaElement(path) {
    if (!path) return document.createElement('div');
    const isVideo = path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.ogg');
    if (isVideo) {
        const video = document.createElement('video');
        video.src = path;
        video.controls = false;
        video.muted = true;
        video.autoplay = true;
        video.loop = true;
        video.playsInline = true;
        return video;
    } else {
        const img = document.createElement('img');
        img.src = path;
        img.loading = 'lazy';
        return img;
    }
}

function loadAnnouncements(data){
  const { announcements, galImages } = data;
  anncList.innerHTML = '';
  for(const annc of announcements){
    const { AnnouncementID, Title, Description, Image, DatePosted } = annc;
    const li = document.createElement('li');
    const h2 = document.createElement('h2');
    const span = document.createElement('span');
    const p = document.createElement('p');
    const ancMain = document.createElement('div');
    const ancGallery = document.createElement('div');
    const txt = document.createElement('div');
    const icon = document.createElement('div');
    const mainMediaTag = createMediaElement(Image);
    const edit = document.createElementNS('http://www.w3.org/2000/svg', "svg");
    const del = document.createElementNS('http://www.w3.org/2000/svg', "svg");
    const setDate = new Date(DatePosted);
    const formattedDate =
      `${setDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ${setDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    txt.classList.add('txt');
    ancMain.classList.add('ancMain');
    mainMediaTag.classList.add('mainImg');
    ancGallery.classList.add('ancGallery');
    icon.classList.add('icon');
    li.appendChild(ancMain);
    li.appendChild(ancGallery);
    li.appendChild(icon);
    ancMain.appendChild(mainMediaTag);
    ancMain.appendChild(txt);
    txt.appendChild(h2);
    txt.appendChild(span);
    txt.appendChild(p);
    icon.appendChild(edit);
    icon.appendChild(del);
    anncList.appendChild(li);
    mainMediaTag.dataset.mainImg = "";
    h2.innerText = Title;
    span.innerText = formattedDate;
    p.innerText = Description;
    for(const img of galImages){
      if(img.AnnouncementID === AnnouncementID && img.ImagePath !== null){
        const galMediaTag = createMediaElement(img.ImagePath);
        galMediaTag.dataset.mainImg = "";
        ancGallery.appendChild(galMediaTag);
      }
    }
    new imageViewer(ancMain);
    new imageViewer(ancGallery);
    edit.setAttributeNS(null, 'viewBox', '0 0 512 512');
    del.setAttributeNS(null, 'viewBox', '0 0 448 512');
    edit.innerHTML = '<path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/>';
    del.innerHTML = '<path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/>';
    edit.addEventListener('click', () => {
        openModal("anncModal", "Edit");
        clearAnncForm();
        anncUpdateId.value = AnnouncementID;
        anncTitle.value = Title;
        anncDesc.value = Description;
        mainImg.src = mainMediaTag.src;
        mainImg.style.display = 'block';
        mainImg.dataset.imgPath = Image;
        anncLabel.classList.add('hasImg');
        anncP.style.display = 'none';
        const addGalleryImg = galImg.querySelector('.addImg');
        for (const imgData of galImages) {
            if (imgData.AnnouncementID === AnnouncementID && imgData.ImagePath) {
                const galLi = document.createElement('li');
                galLi.dataset.imgPath = imgData.ImagePath;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.innerHTML = `<img src="../images/svg/xmark.svg" loading="lazy" alt="xmark">`;
                const mediaEl = createMediaElement(imgData.ImagePath);
                mediaEl.classList.add('galImg');
                galLi.appendChild(btn);
                galLi.appendChild(mediaEl);
                addGalleryImg.before(galLi);
                btn.addEventListener('click', () => galImg.removeChild(galLi));
            }
        }
    });
    del.addEventListener('click', () =>{
      modalPN().confirm({
        title: 'Delete Announcement',
        text: 'Are you want to delete this announcement?',
        icon: 'warning',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      },
      function(res){
        if(res.isConfirmed){
          fetch('/admin/anncDelete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: AnnouncementID }),
          })
          .then(response => response.json())
          .then(res2 => {
            if(res2.success){
              anncList.removeChild(li);
            }
          });
        }
      });
    });
  }
}

function loadCouncil(data){
  const { councilMembers } = data;
  councilList.innerHTML = '';
  for(const member of councilMembers){
    const { CouncilID, FirstName, MiddleInitial, LastName, Position, Image } = member;
    const li = document.createElement('li');
    const memImg = document.createElement('img');
    const txt = document.createElement('div');
    const p = document.createElement('p');
    const span = document.createElement('span');
    const icon = document.createElement('div');
    const edit = document.createElementNS('http://www.w3.org/2000/svg', "svg");
    const del = document.createElementNS('http://www.w3.org/2000/svg', "svg");
    txt.classList.add('txt');
    icon.classList.add('icon');
    li.appendChild(memImg);
    li.appendChild(txt);
    li.appendChild(icon);
    txt.appendChild(p);
    txt.appendChild(span);
    icon.appendChild(edit);
    icon.appendChild(del);
    councilList.appendChild(li);
    p.innerText = `${FirstName} ${MiddleInitial ? (MiddleInitial.toUpperCase() + '.') : ''} ${LastName}`;
    span.innerText = Position;
    Object.assign(memImg, { src: Image, loading: 'lazy', alt: LastName });
    edit.setAttributeNS(null, 'viewBox', '0 0 512 512');
    edit.setAttributeNS(null, 'onclick', 'openModal("conlModal", "Edit")');
    edit.innerHTML = '<path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/>';
    del.setAttributeNS(null, 'viewBox', '0 0 448 512');
    del.innerHTML = '<path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/>';
    edit.addEventListener('click', () => {
      const memImgName = memImg.src.split("/");
      conlUpdateId.value = CouncilID;
      conlFName.value = FirstName;
      conlMInitial.value = MiddleInitial;
      conlLName.value = LastName;
      conlPosition.value = Position;
      memberImg.src = memImg.src;
      memberImg.style.display = 'block';
      memberImg.dataset.imgName = memImgName[memImgName.length - 1];
      memberLabel.classList.add('hasImg');
      conlP.style.display = 'none';
    });
    del.addEventListener('click', () =>{
      modalPN().confirm({
        title: 'Delete Member',
        text: 'Are you want to delete this council member?',
        icon: 'warning',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      },
      function(res){
        if(res.isConfirmed){
          fetch('/admin/councilDelete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: CouncilID }),
          })
          .then(response => response.json())
          .then(res2 => {
            if(res2.success){
              councilList.removeChild(li);
            }
          });
        }
      });
    });
  }
}

async function getData(name){
  try{
    const response = await fetch(`/admin/${name}Get`);
    const data = await response.json();
    return data;
  }
  catch(error){
    console.error('Error fetching data:', error);
  }
}

window.onload = () => {
  getData('annc')
  .then(data => {
    if(data && data.success) loadAnnouncements(data);
  })
  .catch(error => { console.error("Error loading announcements:", error); });
  
  getData('council')
  .then(data => {
    if(data && data.success) loadCouncil(data);
  })
  .catch(error => { console.error("Error loading council data:", error); });
};

function openModal(className, type){
  const modalH1 = modalList.querySelector(`.${className} > h1`);
  modalList.classList.add('show');
  formType = type;
  if(className === 'anncModal'){
    modalH1.innerText = `${type} Announcement`;
    if (type === 'Add') clearAnncForm();
  }
  if(className === 'conlModal'){
    modalH1.innerText = `${type} Council Member`;
  }
  for(const tag of modals){
    if(tag.classList.contains(className)){
      tag.classList.add('show');
      tag.scrollTop = 0;
    }
  }
}

function closeModal(){
  modalList.classList.remove('show');
  for(i = 0; i < modals.length; i++){
    modals[i].classList.remove('show');
  }
  clearAnncForm();
  clearConlForm();
}

document.getElementById('toggle-flagged-comments').addEventListener('click', function () {
  const container = document.getElementById('flagged-comments-container');
  if (container.style.display === 'none') {
    container.style.display = 'block';
    this.textContent = 'Hide Flagged Comments';
    loadFlaggedComments();
  } else {
    container.style.display = 'none';
    this.textContent = 'Show Flagged Comments';
  }
});

function loadFlaggedComments() {
  fetch('/admin/flaggedComments')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const flaggedCommentsList = document.querySelector('.flaggedCommentsList');
        flaggedCommentsList.innerHTML = '';
        data.flaggedComments.forEach(comment => {
          const li = document.createElement('li');
          li.innerHTML = `
            <p>${comment.Text}</p>
            <button onclick="approveComment(${comment.CommentID})">Approve</button>
            <button onclick="deleteComment(${comment.CommentID})">Delete</button>
          `;
          flaggedCommentsList.appendChild(li);
        });
      }
    })
    .catch(error => console.error('Error loading flagged comments:', error));
}

function approveComment(commentId) {
  fetch('/admin/approveComment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commentId }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) loadFlaggedComments();
    })
    .catch(error => console.error('Error approving comment:', error));
}

function deleteComment(commentId) {
  fetch('/admin/deleteComment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commentId }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) loadFlaggedComments();
    })
    .catch(error => console.error('Error deleting comment:', error));
}