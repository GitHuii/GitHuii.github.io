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