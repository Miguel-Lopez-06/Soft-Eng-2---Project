// kimochei/soft-eng-2---project/Soft-Eng-2---Project-c7a777b30b910032e957ba1fdbe907d8098caa2d/public/javascripts/imgViewer.js
class imageViewer{
  /**
   * @param {HTMLElement} list The container for the gallery (e.g., .galleryImgs)
   */
  constructor(list){
    this.list = list;
    this.mediaItems = list.querySelectorAll('li[data-path]');
    this.article = document.createElement('article');
    this.mediaContainer = document.createElement('div');
    this.ul = document.createElement('ul');
    this.mediaCount = this.mediaItems.length;
    this.currentImg = 0;

    if (this.mediaCount === 0) return;

    document.body.appendChild(this.article);
    this.article.appendChild(this.mediaContainer);

    // --- ADDED START ---
    // Create and add the exit button
    const exitButton = document.createElement('div');
    exitButton.innerHTML = `<svg class="imageViewerExit" xmlns="http://www.w3.org/2000/svg" fill="hsl(0, 0%, 90%)" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>`;
    this.article.appendChild(exitButton);
    this.exitBtn = this.article.querySelector('.imageViewerExit');
    // --- ADDED END ---
    
    if(this.mediaCount > 1){
      const nextArrow = document.createElement('div');
      nextArrow.innerHTML = `<svg class="nextArrow" xmlns="http://www.w3.org/2000/svg" fill="hsl(0, 0%, 90%)" viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>`;
      this.article.appendChild(nextArrow);
  
      const backArrow = document.createElement('div');
      backArrow.innerHTML = `<svg class="backArrow" xmlns="http://www.w3.org/2000/svg" fill="hsl(0, 0%, 90%)" viewBox="0 0 320 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg>`;
      this.article.appendChild(backArrow);
    }

    this.arrowNext = this.article.querySelector('.nextArrow');
    this.arrowBack = this.article.querySelector('.backArrow');  

    this.style();
    this.initHandlers();
  }

  createMediaElement(path, isPreview) {
      if (typeof path !== 'string' || !path) {
          return document.createElement('div');
      }
      const isVideo = path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.ogg');
      if (isVideo) {
          const video = document.createElement('video');
          video.src = path;
          video.autoplay = !isPreview;
          video.controls = !isPreview;
          video.muted = isPreview;
          video.loop = isPreview;
          video.playsInline = true;
          return video;
      } else {
          const img = document.createElement('img');
          img.src = path;
          img.loading = 'lazy';
          return img;
      }
  }

  style(){
    const { mediaItems, article, mediaContainer, ul, mediaCount } = this;

    for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];
        item.innerHTML = ''; 
        const thumb = this.createMediaElement(item.dataset.path, true);
        Object.assign(thumb.style, {
            width: '100%', height: '100%', objectFit: 'cover'
        });
        item.appendChild(thumb);
    }

    Object.assign(mediaContainer.style, {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100%', width: '100%'
    });
    
    if(mediaCount > 1){
      for(let i = 0; i < mediaItems.length; i++){
        const mediaSrc = mediaItems[i].dataset.path;
        if (mediaSrc) {
            const li = document.createElement('li');
            const thumb = this.createMediaElement(mediaSrc, true);
            ul.appendChild(li);
            li.appendChild(thumb);
            Object.assign(li.style, {
              display: 'flex', cursor: 'pointer', height: '60px', width: '60px'
            });
            Object.assign(thumb.style, {
                width: '100%', height: '100%', objectFit: 'cover'
            });
        }
      }
      article.appendChild(ul);
    }

    Object.assign(article.style, {
      background: 'hsla(0, 0%, 0%, 60%)', position: 'fixed',
      top: '0', left: '0', display: 'none', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', paddingBlock: '50px',
      height: '100vh', width: '100%', zIndex: '10',
    });
    Object.assign(ul.style, {
      position: 'absolute', bottom: '10px', display: 'flex',
      justifyContent: 'center', gap: '5px', padding: '5px',
      borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.2)', userSelect: 'none',
    });
    if(mediaCount > 1){
      Object.assign(this.arrowNext.style, {
        position: 'absolute', top: '50%', right: '10px',
        transform: 'translateY(-50%)', height: '25px', cursor: 'pointer',
        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))'
      });
      Object.assign(this.arrowBack.style, {
        position: 'absolute', top: '50%', left: '10px',
        transform: 'translateY(-50%)', height: '25px', cursor: 'pointer',
        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))'
      });
    }

    // --- ADDED START ---
    // Style for the new exit button
    if(this.exitBtn) {
        Object.assign(this.exitBtn.style, {
            position: 'absolute',
            top: '20px',
            right: '25px',
            height: '22px',
            cursor: 'pointer',
            zIndex: '11' // Ensure it's above other elements
        });
    }
    // --- ADDED END ---
  }
  
  updateMediaView(){
      this.mediaContainer.innerHTML = ''; 
      const currentMediaItem = this.mediaItems[this.currentImg];
      if (!currentMediaItem || !currentMediaItem.dataset.path) {
        return;
      }
      const path = currentMediaItem.dataset.path;
      const element = this.createMediaElement(path, false);
      Object.assign(element.style, {
        display: 'block', alignSelf: 'center', maxHeight: 'calc(100% - 80px)',
        maxWidth: 'calc(100% - 70px)', userSelect: 'none', borderRadius: '4px'
      });
      this.mediaContainer.appendChild(element);
  }

  initHandlers(){
    const {list, mediaItems, article, ul } = this;
    const nextMedia = () => {
      this.currentImg = (this.currentImg + 1) % this.mediaCount;
      this.updateMediaView();
    }
    const prevMedia = () => {
      this.currentImg = (this.currentImg - 1 + this.mediaCount) % this.mediaCount;
      this.updateMediaView();
    }
    const scrollEvent = (e) => { e.wheelDelta < 0 ? nextMedia() : prevMedia(); }

    list.addEventListener('click', (e) => {
      const mediaLi = e.target.closest('li[data-path]');
      if(!mediaLi) return;
      this.currentImg = Array.from(mediaItems).indexOf(mediaLi);
      article.style.display = 'flex';
      this.updateMediaView();
    });
    article.addEventListener('click', (e) => {
      // Close only if the click is on the background, not the exit button or other elements
      if(e.target === article) article.style.display = 'none';
    });
    ul.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if(!li) return;
      this.currentImg = Array.from(ul.children).indexOf(li);
      this.updateMediaView();
    });
    article.addEventListener('wheel', scrollEvent);
    if(this.mediaCount > 1){
      this.arrowNext.addEventListener('click', nextMedia);
      this.arrowBack.addEventListener('click', prevMedia);
    }
    // --- ADDED START ---
    // Add click listener for the exit button
    if (this.exitBtn) {
        this.exitBtn.addEventListener('click', () => {
            article.style.display = 'none';
        });
    }
    // --- ADDED END ---
  }
}