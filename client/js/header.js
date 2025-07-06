const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');

burger.addEventListener('click', () => {
  burger.classList.toggle('open');            
  mobileMenu.classList.toggle('hidden');     
});

const links = mobileMenu.querySelectorAll("a, button");
links.forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');        
    burger.classList.remove('open');
  });
});
