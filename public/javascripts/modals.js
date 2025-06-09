const modalPN = () => {
  const divPN = document.createElement('div');
  divPN.innerHTML =
  `<article style="display: flex; justify-content: center; align-items: center; position: relative;">` +
    `<section class="content" style="display: flex; flex-direction: column; font-size: var(--fs-12-14); width: fit-content;">` +
      `<img class="icon" style="display: none; user-select: none;" alt="icon">` +
      `<b style="display: none; margin-bottom: 8px;"></b>` +
      `<div class="info" style="display: flex; align-items: center; gap: 10px;">` +
        `<img class="icon" style="display: none; user-select: none;" alt="icon">` +
        `<div style="display: flex; flex-direction: column; gap: 10px">` +
          `<p style="max-width: 200px"></p>` +
          `<input name="input" style="background: hsl(222, 8%, 100%); display: none; width: 180px; padding: 5px; border: 1px solid hsl(222, 9%, 20%); border-radius: 5px;" required>` +
          `<select name="option" style="background: hsl(222, 8%, 100%); display: none; width: 180px; padding: 5px; border: 1px solid hsl(222, 9%, 20%); border-radius: 5px;"></select>` +
        `</div>` +
      `</div>` +
      `<span style="color: hsl(0, 85%, 54%); text-align: center; opacity: 0; display: none; margin: 5px 0;">aaa</span>` +
    `</section>` +
    `<section class="mainBtn" style="position: absolute; bottom: 10px; right: 50%; display: none; gap: 10px; transform: translate(50%, 0);">` +
      `<button class="confirm" style="padding: 7px 14px; border-radius: 4px;"></button>` +
      `<button class="close" style="padding: 7px 14px; border-radius: 4px;"></button>` +
    `</section>` +
  `</article>`;
  const article = divPN.querySelector('article');
  const content = article.querySelector('.content')
  const mainBtn = article.querySelector('.mainBtn');
  const confirm = mainBtn.querySelector('.confirm');
  const cancel = mainBtn.querySelector('.close');
  const info = content.querySelector('.info');
  const img = content.querySelectorAll('.icon');
  const b = content.querySelector('b');
  const p = content.querySelector('p');
  const inputTag = content.querySelector('input');
  const selectTag = content.querySelector('select');
  const span = content.querySelector('span');
  const icons = {
    check: '../images/svg/circle-check.svg',
    info: '../images/svg/circle-info.svg',
    warning: '../images/svg/circle-exclamation.svg',
    error: '../images/svg/circle-xmark.svg',
    question: '../images/svg/circle-question.svg',
  }
  const locationStyles = {
    'top-left': {
      top: '15px',
      left: '0',
      transform: 'translate(-101%, 0)',
      transition: '0.3s'
    },
    'bottom-left': {
      bottom: '15px',
      left: '0',
      transform: 'translate(-101%, 0)',
      transition: '0.3s'
    },
    'top-right': {
      top: '15px',
      right: '0',
      transform: 'translate(101%, 0)',
      transition: '0.3s'
    },
    'bottom-right': {
      right: '0',
      bottom: '15px',
      transform: 'translate(101%, 0)',
      transition: '0.3s'
    },
    center: {
      right: '50%',
      bottom: '50%',
    },
  }
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  Object.assign(divPN.style, {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '10',
  });

  function validate(data, arr){
    arr.forEach(item => {
      if (data[item] !== undefined) return;
      throw new Error(`${item} is not defined.`);
    });
    if(arr.includes('options') && data.option && typeof data.option !== 'object')
      throw new Error(`Invalid options: '${data.option}'. Options must be an array.`);
  }
  function setStyles(type, data){
    let {icon, location, backgroundColor, borderColor, padding} = data;
    let iconFound = false;
    let locStyle = null;

    if(!location && type === 'alert')
      location = 'top-left';
    if(typeof location === 'string')
      locStyle = locationStyles[location];
    if(locStyle)
      for(const style in locStyle)
        divPN.style[style] = locStyle[style];
    else
      throw new Error(`Invalid input: '${location}'.`);
    
    data.location = location;

    if(icon){
      for(iconName in icons)
      if(icon === iconName){
        img[0].src = icons[iconName];
        img[1].src = icons[iconName];
        iconFound = true;
      }
      
      if(!iconFound)
        throw new Error(`Invalid icon: '${icon}'.`);
    }

    divPN.style.position = 'fixed';
    Object.assign(article.style, {
      background: backgroundColor || 'hsl(222, 8%, 88%)',
      border: (borderColor) ? `1px solid ${borderColor}` : '',
      padding: padding || '10px',
    });
    if(location === 'center'){
      Object.assign(document.body.style, {
        position: 'fixed',
        overflowY: 'auto',
        width: '100%',
      });
      Object.assign(divPN.style, {
        background: 'hsla(222, 2%, 6%, 30%)',
        inset: '0 auto auto 0',
        height: '100vh',
        width: '100%',
      });
      Object.assign(article.style, {
        height: '200px',
        width: '370px',
        borderRadius: '7px',
        marginInline: '10px',
      });
      if(type === 'input'){
        span.style.display = 'inline';
      }
      if(type === 'alert'){
        Object.assign(img[0].style, {
          display: (iconFound) ? 'block' : 'none',
          height: '65px',
          marginBottom: '15px',
        });
        divPN.style.transition = '0.3s';
        content.style.alignItems = 'center';
      }
      else{
        Object.assign(img[1].style, {
          display: (iconFound) ? 'block' : 'none',
          height: '40px',
        });
        mainBtn.style.display = 'flex';
      }
    }
    else{
      Object.assign(article.style, {
        minWidth: '200px',
        maxWidth: '250px',
      });
      if(type === 'alert'){
        article.style.minHeight = '80px';
      }
      if(location.split('-')[1] === 'left'){
        article.style.borderRadius = '0 7px 7px 0';
        info.style.flexDirection = 'row-reverse';
      }
      if(location.split('-')[1] === 'right'){
        article.style.borderRadius = '7px 0 0 7px';
      }
      Object.assign(img[1].style, {
        display: (iconFound) ? 'block' : 'none',
        height: '30px',
      });
      b.style.textAlign = 'center';
    }
  }
  function buttonEvents(type, callback){
    divPN.addEventListener('click', e => {
      const tArticle = e.target.closest('article');
      const tButton = e.target.closest('button');
      let tag = null;
      let result = {};
      
      if(type === 'option')
        tag = selectTag;
      else
        tag = inputTag;
      
      if(!tArticle || tButton){
        const isConfirm = tButton ? tButton.classList.contains('confirm') : false;
        const isClose = tButton ? tButton.classList.contains('close') : false;
        result.isConfirmed = isConfirm;
        result.isCancelled = isClose;

        if(tButton){
          if(isConfirm){
            if(type !== 'confirm'){
              if(inputTag.checkValidity() || ['option'].includes(type)){
                result.value = tag.value;
                callback(result);
              }
              else if(tag.validationMessage !== ''){
                span.innerText = 'Invalid Input';
                span.style.opacity = 1;
              }
            }
            else callback(result);
          }
          else callback(result);
        }
        else callback(null)
      }
    })
  }
  function setTexts(data){
    const {title, text, titleColor, textColor, confirmBtnText, cancelBtnText, confirmBtnTextColor, cancelBtnTextColor, confirmBtnBackground, cancelBtnBackground, confirmBtnBorder, cancelBtnBorder} = data;
    
    if(title){
      b.innerText = title;
      b.style.color = titleColor || '';
      b.style.display = 'block';
    }
    p.innerText = text;
    p.style.color = textColor || '';

    confirm.innerText = confirmBtnText || 'Confirm';
    confirm.style.color = confirmBtnTextColor || 'hsl(222, 8%, 88%)';
    confirm.style.background = confirmBtnBackground || 'hsl(222, 9%, 20%)';
    confirm.style.border = confirmBtnBorder || '1px solid hsl(222, 9%, 20%)';

    cancel.innerText = cancelBtnText || 'Cancel';
    cancel.style.color = cancelBtnTextColor || '';
    cancel.style.background = cancelBtnBackground || '';
    cancel.style.border = cancelBtnBorder || '1px solid black';
  }

  return {
    /**
     * @typedef {'check' | 'info' | 'warning' | 'error' | 'question'} Icon
     * @typedef {'top-left' | 'bottom-left' | 'top-right' | 'bottom-right' | 'center'} Location
     * 
     * @param {Object} data
     * @param {string} data.title
     * @param {string} data.text
     * @param {Icon} data.icon
     * @param {Location} data.location
     * @param {number} data.timer
     */
    alert: async function(data){
      const {timer} = data;
      
      validate(data, ['text']);
      setStyles('alert', data);
      setTexts(data);
      
      document.body.appendChild(divPN);
      if(data.location === 'center'){
        article.style.transform = 'scale(0.2)';
        article.style.transition = '0.3s';
        article.style.transitionTimingFunction = 'cubic-bezier(0.15, 0.4, 0.2, 1.3)';
        await delay(1);
        article.style.transform = 'scale(1)';
        await delay(timer || 2000);
        divPN.style.opacity = 0;
        article.style.transform = 'scale(0.8)';
        await delay(200);
        Object.assign(document.body.style, {
          position: '',
          overflowY: '',
          width: '',
        });
      }
      else{
        await delay(1);
        divPN.style.transform = '';
        await delay(timer || 2000);
        divPN.style.transform = `translate(${(data.location.split('-')[1] === 'left') ? '-' : ''}101%, 0)`;
        await delay(300);
      }
      document.body.removeChild(divPN);
    },
    /**
     * @typedef {'text' | 'number' | 'email' | 'option'} Input
     * 
     * @param {Object} data
     * @param {string} data.title
     * @param {string} data.text
     * @param {Icon} data.icon
     * @param {Input} data.input
     * @param {string} data.inputPlaceholder
     * @param {Array} data.options
     * @param {Function} callback
     */
    input: function(data, callback){
      const {input, inputPlaceholder, options} = data;
      data.location = 'center';

      if(typeof callback !== 'function')
        throw new Error(`${callback} type must be a function.`);
      if(!input || ['text', 'number', 'email'].includes(input)){
        validate(data, ['text']);

        inputTag.type = input || 'text';
        inputTag.placeholder = inputPlaceholder || '';
        inputTag.style.display = 'block';
      }
      else if(input === 'option'){
        validate(data, ['text', 'options']);

        for(const option in options)
          selectTag.innerHTML += `<option value="${options[option]}">${options[option]}</option>`;

        selectTag.style.display = 'block';
      }
      else throw new Error(`Invalid input type: '${input}'.`);

      setStyles('input', data);
      setTexts(data);
      
      document.body.appendChild(divPN);
      buttonEvents(input, function(result){
        if(result) callback(result);
        Object.assign(document.body.style, {
          position: '',
          overflowY: '',
          width: '',
        });
        document.body.removeChild(divPN);
      });
    },
    /**
     * @param {Object} data
     * @param {string} data.title
     * @param {string} data.text
     * @param {Icon} data.icon
     * @param {string} data.confirmButtonText
     * @param {string} data.cancelButtonText
     * @param {Function} callback
     */
    confirm: function(data, callback){
      // const {} = data;
      data.location = 'center';
      
      if(typeof callback !== 'function')
        throw new Error(`${callback} type must be a function.`);
      validate(data, ['text']);
      setStyles('confirm', data);
      setTexts(data);
      
      b.style.textAlign = 'center';
      
      document.body.appendChild(divPN);
      buttonEvents('confirm', function(result){
        if(result) callback(result);
        Object.assign(document.body.style, {
          position: '',
          overflowY: '',
          width: '',
        });
        document.body.removeChild(divPN);
      });
    },
  }
}