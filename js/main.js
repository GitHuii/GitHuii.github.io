const menu = document.querySelector(".navbar_links");
const menuBtn = document.querySelector(".navbar_icons");
const overlay = document.querySelector("#overlay");

menuBtn.addEventListener('click',()=>{
    menu.classList.toggle("navbar_open");
    menuBtn.classList.toggle("open");
    overlay.classList.toggle("show");
});

overlay.addEventListener('click',()=>{
    menu.classList.toggle("navbar_open");
    menuBtn.classList.toggle("open");
    overlay.classList.toggle("show");
});

const starContainer = document.querySelector('.starry-background');
// Hàm tạo ngôi sao ngẫu nhiên
function createStar() {
    const star = document.createElement('div');
    star.classList.add('star');
    star.style.left = `${Math.random() * 100}vw`;
    star.style.top = `${Math.random() * 100}vh`;
    star.style.width = `${Math.random() * 3 + 1}px`;
    star.style.height = star.style.width;
    starContainer.appendChild(star);
}
// Tạo nhiều ngôi sao
for (let i = 0; i < 100; i++) {
    createStar();
}