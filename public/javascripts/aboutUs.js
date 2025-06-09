const left = document.querySelector('.left');
const slideshow = left.querySelector('.slideshowAbout');

new slider(slideshow, {
  type: 'auto-scroll',
  perPage: 1,
  interval: 12000,
});
const mediaQueries = [
  '(max-width: 1400px)',
  '(max-width: 1250px)',
]
const setStyle = () => left.style.top = `calc(50vh - ${left.clientHeight / 2}px)`;

mediaQueries.forEach(query => {
  window.matchMedia(query).addEventListener('change', setStyle);
  setStyle();
});