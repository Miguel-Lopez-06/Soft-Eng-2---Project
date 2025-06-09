class slider{
  /**
   * @typedef {Object} Pagination
   * @property {'numbers' | 'dots'} type
   * @property {string} backgroundColor
   * @property {string} color
   * @property {string} hoverBackgroundColor
   * @property {string} hoverColor
   * @property {string} selectedBackgroundColor
   * @property {string} selectedColor
   *
   * @typedef {Object} Breakpoints
   * @property {number} perPage
   * @property {number} perMove
   * @property {number} gap
   * 
   * @param {HTMLElement} parent
   * @param {Object} data
   * @param {'normal' | 'loop' | 'auto-scroll'} data.type
   * @param {Boolean} data.spanWidth
   * @param {Boolean} data.arrows
   * @param {Boolean} data.draggable
   * @param {Boolean} data.scrollable
   * @param {Number} data.perPage
   * @param {Number} data.perMove
   * @param {Number} data.gap
   * @param {Number} data.interval
   * @param {Pagination} data.pagination
   * @param {Object.<number, Breakpoints>} data.breakpoints
   */
  constructor(parent, data){
    this.paginationWrapper = document.createElement('div');
    this.arrowWrapper = document.createElement('div');
    this.listWrapper = document.createElement('div');
    this.nextArrow = document.createElement('img');
    this.prevArrow = document.createElement('img');
    this.paginationCont = document.createElement('div');
    this.paginationUl = document.createElement('ul');
    this.parent = parent;
    this.cards = parent.children;
    this.maxCards = parent.children.length;
    this.translateVal = 0;
    this.currentSlide = 1;
    this.data = {
      type: data.type || 'normal',
      spanWidth: data.spanWidth || false,
      arrows: data.arrows ?? false,
      draggable: data.draggable ?? false,
      scrollable: data.scrollable ?? false,
      cardAspectRatio: data.cardAspectRatio ?? '3 / 2',
      perPage: data.perPage ?? 3,
      perMove: data.perMove ?? 1,
      gap: data.gap ?? 10,
      interval: data.interval ?? 3000,
      breakpoints: data.breakpoints,
    };
    if(typeof data.pagination === 'object'){
      this.data.pagination = {
        type: data.pagination.type || 'dots',
        backgroundColor: data.pagination.backgroundColor || 'hsl(222, 5%, 65%)',
        color: data.pagination.color || 'hsl(0, 0%, 20%)',
        hoverBackgroundColor: data.pagination.hoverBackgroundColor || 'hsl(222, 5%, 50%)',
        hoverColor: data.pagination.hoverColor || 'hsl(0, 0%, 95%)',
        selectedBackgroundColor: data.pagination.selectedBackgroundColor || 'hsl(222, 5%, 25%)',
        selectedColor: data.pagination.selectedColor || 'hsl(0, 0%, 95%)',
      }
    }
    
    this.validation();

    this.parent.parentNode.insertBefore(this.listWrapper, parent);
    this.listWrapper.appendChild(parent);
    
    this.styles();
    this.initEventHandlers();
  }
  validation(){
    function validate(option, validType, validator = null){
      if(!(typeof option === validType && (validator ? validator(option) : true)))
        throw new Error(`Invalid value for option: ${option}`);
    }
    
    if(!(this.parent instanceof HTMLElement))
      throw new Error(`Invalid data format '${this.parent}'. Parent must be a HTMLElement`);
    if(typeof this.data !== 'object'){
      this.data = {};
    }
    const {type, spanWidth, arrows, draggable, cardAspectRatio, perPage, perMove, scrollable, interval, pagination, gap, breakpoints} = this.data;

    if(typeof cardAspectRatio === 'string'){
      const frac = cardAspectRatio.split(/(\s*\/\s*)/);
      if(!(frac.length === 3 && parseFloat(frac[0].trim()) && frac[1].trim() === '/' && parseFloat(frac[2].trim())))
        throw new Error(`Invalid value for option: ${cardAspectRatio}`);
    }
    if(typeof cardAspectRatio === 'number'){
      if(cardAspectRatio <= 0)
        throw new Error(`Invalid value for option: ${cardAspectRatio}`);
    }

    validate(type, 'string', val => ['normal', 'loop', 'auto-scroll'].includes(val));
    validate(spanWidth, 'boolean');
    validate(arrows, 'boolean');
    validate(draggable, 'boolean');
    validate(perPage, 'number', val => val > 0);
    validate(perMove, 'number', val => val > 0);
    validate(scrollable, 'boolean');
    validate(interval, 'number', val => val >= 3000);
    validate(gap, 'number', val => val > 0);
    if(typeof pagination !== 'undefined'){
      if(typeof pagination === 'object'){
        validate(pagination.type, 'string', val => ['numbers', 'dots'].includes(val));
        validate(pagination.backgroundColor, 'string');
        validate(pagination.color, 'string');
        validate(pagination.hoverBackgroundColor, 'string');
        validate(pagination.hoverColor, 'string');
        validate(pagination.selectedBackgroundColor, 'string');
        validate(pagination.selectedColor, 'string');
      }
      else throw new Error(`Invalid data format 'pagination'`);
    }
    else this.data.pagination = {type: false};
    
    if(type === 'loop' && perMove >= this.cards.length)
      throw new Error(`PerMove must be less than the number of cards when type = 'loop'`)
    for(const bpVal in breakpoints){
      if(!(!isNaN(parseInt(bpVal)) && bpVal > 0))
        throw new Error('All breakpoint values must be a positive number.');

      const bPerPage = breakpoints[bpVal].perPage;
      const bPerMove = breakpoints[bpVal].perMove;
      const bGap = breakpoints[bpVal].gap;

      if(typeof bPerPage !== 'undefined' && !(typeof bPerPage === 'number' && bPerPage > 0))
        throw new Error(`Invalid value for perPage: '${bPerPage}'. perPage must be a positive number.`);
      if(typeof bPerMove !== 'undefined' && !(typeof bPerMove === 'number' && bPerMove > 0))
        throw new Error(`Invalid value for perMove: '${bPerMove}'. perMove must be a positive number.`);
      if(typeof bGap !== 'undefined' && !(typeof bGap === 'number' && bGap > 0))
        throw new Error(`Invalid value for gap: '${bGap}'. gap must be a positive number.`);
    }
    if(typeof breakpoints !== 'undefined' && breakpoints){
      breakpoints[10000] = {
        perPage: this.data.perPage,
        perMove: this.data.perMove,
        gap: this.data.gap,
      }
    }
  }
  styles(){
    const {paginationWrapper, arrowWrapper, listWrapper, nextArrow, prevArrow, paginationCont, paginationUl, pages, parent, cards, maxCards, cardWidth, currentSlide, data} = this;
    const {type, spanWidth, arrows, draggable, cardAspectRatio, perPage, perMove, scrollable, interval, pagination, gap, breakpoints} = data;
    
    for(const card of cards){
      const img = card.querySelector('img');

      Object.assign(card.style, {
        display: 'flex',
        minWidth: `calc((100% - ${gap * (perPage - 1)}px) / ${perPage})`,
        aspectRatio: cardAspectRatio,
      });
      Object.assign(img.style, {
        objectFit: 'cover',
        width: '100%',
        height: '100%',
        userSelect: 'none',
      })
    }
    switch(type){
      case 'loop':
        for(const card of cards){
          card.dataset.nthChild = Array.from(cards).indexOf(card) + 1;
        }
        break;
      case 'auto-scroll':
        this.data.draggable = false;
        this.data.arrows = false;
        this.data.scrollable = false;
        this.data.pagination.type =  false;
        break;
    }
    if(['loop', 'auto-scroll'].includes(type)){
      const fragment = document.createDocumentFragment();

      for(const card of cards){
        const newCard = card.cloneNode(true);
        fragment.appendChild(newCard);
      }
      if(type === 'loop'){
        for(const card of cards){
          const newCard = card.cloneNode(true);
          fragment.appendChild(newCard);
        }
      }
      parent.appendChild(fragment);
    }
    if(this.data.arrows){
      this.listWrapper.parentNode.insertBefore(this.arrowWrapper, this.listWrapper);
      this.arrowWrapper.appendChild(this.listWrapper);
      nextArrow.src = `./assets/images/svg/chevron-right.svg`;
      prevArrow.src = `./assets/images/svg/chevron-left.svg`;
      nextArrow.alt = 'nextArrow';
      prevArrow.alt = 'prevArrow';
      nextArrow.dataset.sliderArrow = 'nextArrow';
      prevArrow.dataset.sliderArrow = 'prevArrow';
      arrowWrapper.appendChild(nextArrow);
      arrowWrapper.appendChild(prevArrow);
      
      Object.assign(nextArrow.style, {
        position: 'absolute',
        bottom: '50%',
        right: '0',
        width: '15px',
        transform: 'translate(100%, 50%)',
        cursor: 'pointer',
      });
      Object.assign(prevArrow.style, {
        position: 'absolute',
        bottom: '50%',
        left: '0',
        width: '15px',
        transform: 'translate(-100%, 50%)',
        cursor: 'pointer',
      });
      
      if(type === 'normal')
        prevArrow.style.opacity = '0.3';
    }
    if(this.data.pagination.type){
      arrowWrapper.parentNode.insertBefore(paginationWrapper, arrowWrapper);
      paginationWrapper.appendChild(arrowWrapper);
      paginationWrapper.appendChild(paginationCont);
      paginationCont.appendChild(paginationUl);

      for(let i = 0; i < this.maxCards; i++){
        paginationUl.appendChild(document.createElement('li'));
      }
      this.pages = paginationUl.children;
      
      Object.assign(paginationCont.style, {
        alignSelf: 'center',
      });
      Object.assign(paginationUl.style, {
        display: 'flex',
        gap: `8px`,
      });
      for(let i = 0; i < this.pages.length; i++){
        Object.assign(this.pages[i].style, {
          background: pagination.backgroundColor,
          aspectRatio: '1',
          cursor: 'pointer',
        });
        if(pagination.type === 'dots'){
          Object.assign(this.pages[i].style, {
            height: '12px',
            borderRadius: '50%',
          });
        }
        else if(pagination.type === 'numbers'){
          Object.assign(this.pages[i].style, {
            color: pagination.color,
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '32px',
            lineHeight: '100%',
            borderRadius: '4px',
          });
          this.pages[i].innerText = i + 1;
        }
      }
      this.pages[0].dataset.currentPage = 'true';
      this.pages[0].style.background = pagination.selectedBackgroundColor;
      this.pages[0].style.color = pagination.selectedColor;
    }

    for(let i = 0; i < this.cards.length; i++){
      if(i % this.maxCards === this.currentSlide - 1)
        this.cards[i].classList.add('currentSlide');
      else
        this.cards[i].classList.remove('currentSlide');
    }

    Object.assign(paginationWrapper.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      height: 'fit-content',
    });
    Object.assign(arrowWrapper.style, {
      position: 'relative',
      marginInline: (this.data.arrows) ? '15px' : '',
      height: 'fit-content',
    });
    Object.assign(listWrapper.style, {
      overflow: (spanWidth) ? '' : 'hidden',
      height: 'fit-content',
    });
    Object.assign(parent.style, {
      display: 'flex',
      userSelect: 'none',
      marginInline: '1px',
      gap: `${gap}px`,
    });
  }
  initEventHandlers(){
    const {paginationWrapper, arrowWrapper, listWrapper, nextArrow, prevArrow, paginationCont, paginationUl, pages, parent, cards, maxCards, cardWidth, currentSlide, data} = this;
    const {type, spanWidth, arrows, draggable, cardAspectRatio, perPage, perMove, scrollable, interval, pagination, gap, breakpoints} = data;
    let isDragging = false;
    let dragStart, dragVal, valStart;
    let lastMouseX, velocity = 0, acceleration = 0.25;

    const updateSliderTranslate = (ms) => {
      const {translateStart, translateVal, cardWidth, currentSlide, endCard} = this;
      const delay = ms || 400;

      switch(type){
        case 'normal':
          parent.style.transform = `translateX(-${translateVal}px)`;
          if(arrows){
            nextArrow.style.opacity = (currentSlide === endCard) ? '0.3' : '1';
            prevArrow.style.opacity = (currentSlide === 1) ? '0.3' : '1';
          }
          break;
        case 'loop':
          const totalTranslate = translateStart + translateVal;
    
          parent.style.transform = `translateX(-${totalTranslate}px)`;
          if(totalTranslate <= cardWidth * (maxCards - perPage)){
            this.translateVal = totalTranslate;
            setTimeout(() => {
              parent.style.transform = `translateX(-${totalTranslate + translateStart}px)`;
            }, delay);
          }
          else if(totalTranslate >= translateStart * 2){
            this.translateVal -= translateStart;
            setTimeout(() => {
              parent.style.transform = `translateX(-${totalTranslate - translateStart}px)`;
            }, delay);
          }
          break;
        case 'auto-scroll':
          this.translateVal = this.cardWidth * (this.currentSlide - 1);
          this.currentSlide = this.currentSlide % maxCards || maxCards;
          
          parent.style.transform = `translateX(-${this.translateVal}px)`;
          if(this.translateVal === this.translateEnd){
            this.translateVal = 0;
            setTimeout(() => {
              parent.style.transform = `translateX(-${this.translateVal}px)`;
            }, delay);
          }
          break;
      }
      parent.style.transition = `transform ${delay}ms`;
      setTimeout(() => {
        parent.style.transition = '';
      }, delay);

      for(let i = 0; i < this.cards.length; i++){
        if(i % this.maxCards === this.currentSlide - 1)
          this.cards[i].classList.add('currentSlide');
        else
          this.cards[i].classList.remove('currentSlide');
      }
    }
    const updatePagination = () => {
      for(let i = 0; i < pages.length; i++){
        if(i === (this.currentSlide - 1)){
          Object.assign(pages[i].style, {
            background: pagination.selectedBackgroundColor,
            color: pagination.selectedColor,
          });
          pages[i].dataset.currentPage = 'true';
        }
        else{
          Object.assign(pages[i].style, {
            background: pagination.backgroundColor,
            color: pagination.color,
          });
          pages[i].dataset.currentPage = 'false';
        }
      }
    }
    const pressStart = (e) => {
      isDragging = true;
      const event = (e.type === 'touchstart') ? e.touches[0] : e;
      dragStart = event.pageX;
      lastMouseX = event.pageX;
      valStart = this.translateVal;
    }
    const pressMove = (e) => {
      if(!isDragging) return;
      const {translateStart, cardWidth, data} = this;
      const {perPage} = data;
      const dragEnd = cardWidth * (cards.length - perPage);
      const event = (e.type === 'touchmove') ? e.touches[0] : e;
      const deltaX = event.pageX - lastMouseX;
      velocity += deltaX * acceleration;
      lastMouseX = event.pageX;

      dragVal = valStart - (event.pageX - dragStart) - velocity;

      switch(type){
        case 'normal':
          if(dragVal > dragEnd){
            parent.style.transform = `translateX(-${dragEnd}px)`;
            this.translateVal = dragEnd;
            velocity = 0;
          }
          else if(dragVal < 0){
            parent.style.transform = `translateX(0)`;
            this.translateVal = 0;
            velocity = 0;
          }
          else{
            parent.style.transform = `translateX(-${dragVal}px)`;
            this.translateVal = dragVal;
          }
          break;
        case 'loop':
          parent.style.transform = `translateX(-${dragVal + translateStart}px)`;
          this.translateVal = dragVal;
          break;
      }
    }
    const pressEnd = () => {
      const {translateStart, cardWidth, endCard} = this;
      velocity = 0;

      if(isDragging){
        let translatedNum = [];
        let closestCard;

        switch(type){
          case 'normal':
            for(let i = 0; i < endCard; i++)
              translatedNum.push(Math.abs(i * cardWidth - dragVal));
            closestCard = translatedNum.indexOf(Math.min(...translatedNum));
            this.currentSlide = closestCard + 1;
            this.translateVal = closestCard * cardWidth;
            break;
          case 'loop':
            for(let i = 0; i < cards.length; i++){
              translatedNum.push(Math.abs(i * cardWidth - (dragVal + translateStart)));
            }
            closestCard = translatedNum.indexOf(Math.min(...translatedNum));
            this.currentSlide = (closestCard % maxCards) + 1;
            this.translateVal = (closestCard * cardWidth) - translateStart;
            break;
        }

        updateSliderTranslate();
        if(pagination.type) updatePagination();
      }
      isDragging = false;
    }
    const btnPressed = (btn) => {
      const {translateStart, translateVal, cardWidth, currentSlide, endCard, data} = this;
      const {perMove} = data;
  
      if(btn === 'nextArrow'){
        this.translateVal += cardWidth * perMove;
        this.currentSlide += perMove;
      }
      else if(btn === 'prevArrow'){
        this.translateVal -= cardWidth * perMove;
        this.currentSlide -= perMove;
      }
      switch(type){
        case 'normal':
          if(this.currentSlide > endCard){
            this.translateVal = cardWidth * (endCard - 1);
            this.currentSlide = endCard;
          }
          else if(this.currentSlide < 1){ 
            this.translateVal = 0;
            this.currentSlide = 1;
          }
          break;
        case 'loop':
          let currentCard = ((this.translateVal + translateStart) / cardWidth) + 1;
          if(this.currentSlide < 1){
            this.currentSlide += maxCards;
          }
          else if(this.currentSlide > maxCards){
            this.currentSlide -= maxCards;
          }
          this.translateVal = (cardWidth * (currentCard - 1)) - translateStart;
          break;
      }
      updateSliderTranslate();
      if(pagination.type) updatePagination();
    }
    const scrollUpdatePosition = (e) => {
      const {translateStart, translateVal, cardWidth, currentSlide, endCard} = this;
      e.preventDefault();

      switch(type){
        case 'normal':
          if(e.wheelDelta < 0){
            if(currentSlide < endCard)
              this.currentSlide++;
          }
          else{
            if(currentSlide > 1)
              this.currentSlide--;
          }
          this.translateVal = cardWidth * (this.currentSlide - 1);
          break;
        case 'loop':
          let currentCard = ((translateVal + translateStart) / cardWidth) + 1;
          if(e.wheelDelta < 0)
            currentCard++;
          else
            currentCard--;
          this.currentSlide = currentCard % maxCards || maxCards;
          this.translateVal = (cardWidth * (currentCard - 1)) - translateStart;
          break;
      }
      updateSliderTranslate(150);
      if(pagination.type) updatePagination();
    }
    const paginationUpdatePosition = (e) => {
      const {cardWidth} = this;
      const target = e.target.closest('li');
      const pagePressed = Array.from(pages).indexOf(target);

      this.currentSlide = pagePressed + 1;
      this.translateVal = cardWidth * (this.currentSlide - 1);
      
      switch(type){
        case 'normal':
          break;
        case 'loop':
          if(this.currentSlide < 1)
            this.currentSlide += maxCards;
          else if(this.currentSlide > maxCards)
            this.currentSlide -= maxCards;
          break;
      }
      updateSliderTranslate();
      if(pagination.type) updatePagination();
    }
    const pageHoverOn = (page) => {
      if(page.dataset.currentPage === 'false'){
        Object.assign(page.style, {
          background: pagination.hoverBackgroundColor,
          color: pagination.hoverColor,
        });
      }
    }
    const pageHoverOff = (page) => {
      if(page.dataset.currentPage === 'false'){
        Object.assign(page.style, {
          background: pagination.backgroundColor,
          color: pagination.color,
        });
      }
    }
    const autoScroll = () => {
      setTimeout(() => {
        this.currentSlide++;
        updateSliderTranslate();
        autoScroll();
      }, interval);
    }
    const updateSliderConfig = () => {
      this.cardWidth = this.cards[0].getBoundingClientRect().width + this.data.gap;
      this.translateVal = this.cardWidth * (this.currentSlide - 1);
      
      switch(type){
        case 'normal':
          parent.style.transform = `translateX(-${this.translateVal}px)`;
          this.endCard = maxCards - (this.data.perPage - 1);
          
          if(this.currentSlide > this.endCard)
            this.currentSlide = this.endCard;
          if(arrows){
            nextArrow.style.opacity = (this.currentSlide === this.endCard) ? '0.3' : '1';
            prevArrow.style.opacity = (this.currentSlide === 1) ? '0.3' : '1';
          }
          if(pagination.type){
            for(let i = 0; i < pages.length; i++){
              pages[i].style.display = (i < this.endCard) ? 'flex' : 'none';
            }
            updatePagination();
          }
          break;
        case 'loop':
          this.translateStart = this.cardWidth * (this.cards.length / 3);
          const totalTranslate = this.translateStart + this.translateVal;
    
          parent.style.transform = `translateX(-${totalTranslate}px)`;
          break;
        case 'auto-scroll':
          this.translateEnd = this.cardWidth * (this.cards.length / 2);
          this.translateVal = this.cardWidth * (this.currentSlide - 1);
    
          parent.style.transform = `translateX(-${this.translateVal}px)`;
          break;
      }
    }
    const breakpointsHandler = () => {
      const viewportWidth = window.innerWidth;
      let closestBpVal = null;

      for(const bpVal in breakpoints){
        const bpValue = parseInt(bpVal);
        if(bpValue >= viewportWidth && (closestBpVal === null || bpValue < closestBpVal)){
          closestBpVal = bpValue;
        }
      }

      if(closestBpVal !== null){
        const bPerPage = breakpoints[closestBpVal].perPage
        const bPerMove = breakpoints[closestBpVal].perMove
        const bGap = breakpoints[closestBpVal].gap

        this.data.perPage = bPerPage || this.data.perPage;
        this.data.gap = bGap || this.data.gap;
        this.data.perMove = bPerMove || this.data.perMove;
        
        if(type === 'normal' && arrows){
          nextArrow.style.opacity = (this.currentSlide === this.endCard) ? '0.3' : '1';
          prevArrow.style.opacity = (this.currentSlide === 1) ? '0.3' : '1';
        }
        
        const {perPage, gap} = this.data;
        parent.style.gap = `${gap}px`;
        for(const card of cards){
          card.style.minWidth = `calc((100% - ${gap * (perPage - 1)}px) / ${perPage})`;
        }
      }
    }
    if(type === 'auto-scroll'){
      autoScroll();
    }
    else{
      parent.addEventListener('touchstart', pressStart);
      parent.addEventListener('touchmove', pressMove);
      document.addEventListener('touchend', pressEnd);
    }
    if(this.data.draggable){
      parent.addEventListener('mousedown', pressStart);
      parent.addEventListener('mousemove', pressMove);
      document.addEventListener('mouseup', pressEnd);
    }
    if(this.data.arrows){
      nextArrow.addEventListener('click', () => {btnPressed('nextArrow')});
      prevArrow.addEventListener('click', () => {btnPressed('prevArrow')});
    }
    if(this.data.scrollable){
      parent.addEventListener('wheel', scrollUpdatePosition);
    }
    if(this.data.pagination.type){
      paginationUl.addEventListener('click', paginationUpdatePosition);
      for(const page of pages){
        page.addEventListener('mouseover', () => {pageHoverOn(page)});
        page.addEventListener('mouseout', () => {pageHoverOff(page)});
      }
    }
    window.addEventListener('resize', () => {
      breakpointsHandler();
      updateSliderConfig();
    });
    setTimeout(() => {
      breakpointsHandler();
      updateSliderConfig();
    }, 1);
  }
}