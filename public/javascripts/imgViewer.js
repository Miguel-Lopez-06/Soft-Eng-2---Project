class imageViewer{
  /**
   * @param {HTMLElement} list
   * @param {Object} data
   */
  constructor(list, data){
    this.list = list;
    this.images = list.querySelectorAll('[data-main-img]');
    this.article = document.createElement('article');
    this.selectedImg = document.createElement('img');
    this.ul = document.createElement('ul');
    this.imgs = this.images.length;
    this.data = {

    };

    document.body.appendChild(this.article);
    this.article.appendChild(this.selectedImg);
    
    if(this.images.length > 1){
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
  style(){
    const {list, images, article, selectedImg, arrowNext, arrowBack, ul, imgs} = this;

    if(imgs > 1){
      for(let i = 0; i < images.length; i++){
        const li = document.createElement('li');
        const img = document.createElement('img');
  
        ul.appendChild(li);
        li.appendChild(img);
  
        Object.assign(li.style, {
          display: 'flex',
          cursor: 'pointer',
        });
  
        img.src = images[i].src;
        img.alt = images[i].alt;
      }
      article.appendChild(ul);
    }

    Object.assign(article.style, {
      background: 'hsla(0, 0%, 0%, 60%)',
      position: 'fixed',
      top: '0',
      left: '0',
      display: 'none',
      justifyContent: 'center',
      alignContent: 'center',
      paddingBlock: '50px',
      height: '100vh',
      width: '100%',
      zIndex: '10',
    });
    Object.assign(selectedImg.style, {
      display: 'block',
      alignSelf: 'center',
      height: 'fit-content',
      maxHeight: '100%',
      width: 'auto',
      maxWidth: 'calc(100% - 70px)',
      userSelect: 'none',
    });
    Object.assign(ul.style, {
      position: 'absolute',
      bottom: '0',
      display: 'flex',
      justifyContent: 'center',
      gap: '3px',
      height: '60px',
      marginBottom: '10px',
      userSelect: 'none',
    });
    if(imgs > 1){
      Object.assign(arrowNext.style, {
        position: 'absolute',
        bottom: '50%',
        right: '10px',
        transform: 'translateY(50%)',
        height: '20px',
        cursor: 'pointer',
      });
      Object.assign(arrowBack.style, {
        position: 'absolute',
        bottom: '50%',
        left: '10px',
        transform: 'translateY(50%)',
        height: '20px',
        cursor: 'pointer',
      });
    }
  }
  initHandlers(){
    const {list, images, article, selectedImg, arrowNext, arrowBack, ul, imgs} = this;
    let currentImg;
    let translateVal;
    let imgWidth = [];

    const updateCurrentImg = () => {
      selectedImg.src = images[currentImg].src;
      selectedImg.alt = images[currentImg].alt;
    }
    const nextImg = () => {
      if(currentImg + 1 > images.length - 1) return;

      currentImg++;
      updateCurrentImg();
      updateTranslateValue();
    }
    const prevImg = () => {
      if(currentImg - 1 < 0) return;

      currentImg--;
      updateCurrentImg();
      updateTranslateValue();
    }
    const scrollEvent = (e) => {
      if(e.wheelDelta < 0)
        nextImg();
      else
        prevImg();
    }

    const updateTranslateValue = (bool) => {
      translateVal = imgWidth.reduce((prev, curr, i) => {
        if(i <= currentImg){
          return prev + curr + (i ? 3 : 0);
        }
        return prev;
      }, 0) - (imgWidth[currentImg] / 2);
      
      ul.style.transform = `translateX(calc(50% - ${translateVal}px))`;

      if(bool) return;
      ul.style.transition = `transform 0.3s`;
      setTimeout(() => {
        ul.style.transition = ``;
      }, 300);
    }

    list.addEventListener('click', (e) => {
      const img = e.target.closest('img[data-main-img]');

      if(!img) return;
      currentImg = Array.from(images).indexOf(img);

      article.style.display = 'flex';
      
      if(!imgWidth.length)
      for(let i = 0; i < ul.children.length; i++)
        imgWidth.push(ul.children[i].getBoundingClientRect().width);
      
      updateCurrentImg();
      updateTranslateValue(true);
    });
    article.addEventListener('click', (e) => {
      if(e.target.tagName === 'ARTICLE')
        article.style.display = 'none';
    });
    ul.addEventListener('click', (e) => {
      const li = e.target.closest('li');

      if(!li) return;

      currentImg = Array.from(ul.children).indexOf(li);
      updateCurrentImg();
      updateTranslateValue();
    });

    article.addEventListener('wheel', scrollEvent);
    if(imgs > 1){
      arrowNext.addEventListener('click', nextImg);
      arrowBack.addEventListener('click', prevImg);
    }
  }
}