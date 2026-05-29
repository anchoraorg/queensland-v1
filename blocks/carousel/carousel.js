import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Build a picture element from a plain-text image URL stored in a richtext cell.
 */
function buildPictureFromUrl(url, alt = '', eager = false) {
  return createOptimizedPicture(url, alt, eager, [
    { media: '(min-width: 900px)', width: '1200' },
    { width: '750' },
  ]);
}

function isImageUrl(text) {
  return /\.(jpg|jpeg|png|webp|svg|avif)(\?.*)?$/i.test(text.trim());
}

export default function decorate(block) {
  const slides = [...block.children];
  if (slides.length === 0) return;

  // Build slide elements
  slides.forEach((slide, i) => {
    slide.classList.add('carousel-slide');
    slide.setAttribute('data-slide-index', i);
    if (i === 0) slide.classList.add('carousel-slide--active');

    // Handle plain-text image URLs in the first cell
    const firstCell = slide.children[0];
    if (firstCell) {
      const text = firstCell.textContent.trim();
      if (isImageUrl(text) && !firstCell.querySelector('picture')) {
        const pic = buildPictureFromUrl(text, '', i === 0);
        firstCell.innerHTML = '';
        firstCell.appendChild(pic);
      }
    }

    // Optimise any picture elements (including those just created above)
    slide.querySelectorAll('picture > img').forEach((img) => {
      const optimized = createOptimizedPicture(img.src, img.alt, i === 0, [
        { media: '(min-width: 900px)', width: '1200' },
        { width: '750' },
      ]);
      moveInstrumentation(img, optimized.querySelector('img'));
      img.closest('picture').replaceWith(optimized);
    });
  });

  // Prev / Next buttons
  const prevBtn = document.createElement('button');
  prevBtn.className = 'carousel-nav carousel-nav--prev';
  prevBtn.setAttribute('aria-label', 'Previous slide');
  prevBtn.innerHTML = '&#8249;';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'carousel-nav carousel-nav--next';
  nextBtn.setAttribute('aria-label', 'Next slide');
  nextBtn.innerHTML = '&#8250;';

  // Dots
  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'carousel-dots';
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    if (i === 0) dot.classList.add('carousel-dot--active');
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.append(dot);
  });

  block.append(prevBtn, nextBtn, dotsContainer);

  let current = 0;
  let autoplayTimer;

  function goTo(index) {
    slides[current].classList.remove('carousel-slide--active');
    dotsContainer.children[current].classList.remove('carousel-dot--active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('carousel-slide--active');
    dotsContainer.children[current].classList.add('carousel-dot--active');
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => goTo(current + 1), 5000);
  }

  function stopAutoplay() {
    clearInterval(autoplayTimer);
  }

  prevBtn.addEventListener('click', () => { goTo(current - 1); startAutoplay(); });
  nextBtn.addEventListener('click', () => { goTo(current + 1); startAutoplay(); });

  // Touch / swipe
  let touchStartX = 0;
  block.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  block.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { goTo(diff > 0 ? current + 1 : current - 1); startAutoplay(); }
  }, { passive: true });

  block.addEventListener('mouseenter', stopAutoplay);
  block.addEventListener('mouseleave', startAutoplay);

  if (slides.length > 1) startAutoplay();
}
