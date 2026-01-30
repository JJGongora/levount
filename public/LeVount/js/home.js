let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const totalSlides = slides.length;

function showSlide(index) {
    // Ocultar todos
    slides.forEach(slide => {
        slide.classList.remove('active');
        slide.style.transform = 'translateY(20px)'; // Resetear la posición para la animación
    });
    dots.forEach(dot => dot.classList.remove('active'));

    // Mostrar el actual
    currentSlide = index;
    slides[currentSlide].classList.add('active');
    slides[currentSlide].style.transform = 'translateY(0)';
    dots[currentSlide].classList.add('active');
}

// Rotación automática
setInterval(() => {
    let next = (currentSlide + 1) % totalSlides;
    showSlide(next);
}, 10000);

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('scrollContainer');
    const prevBtn = document.querySelector('.btn-prev');
    const nextBtn = document.querySelector('.btn-next');

    if (container && prevBtn && nextBtn) {

        // Función para calcular cuánto mover (ancho de tarjeta + gap)
        const getScrollAmount = () => {
            // Ancho de tarjeta (250) + Gap (30) = 280
            return 280;
        };

        nextBtn.addEventListener('click', () => {
            container.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            container.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });
    }
});