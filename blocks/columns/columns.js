import { createOptimizedPicture } from '../../scripts/aem.js';

function isImageUrl(text) {
  return /\.(jpg|jpeg|png|webp|svg|avif)(\?.*)?$/i.test(text.trim());
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      // Handle plain-text image URL stored in richtext/text field
      const text = col.textContent.trim();
      if (col.children.length <= 1 && isImageUrl(text)) {
        const pic = createOptimizedPicture(text, '', false, [{ width: '750' }]);
        col.innerHTML = '';
        col.appendChild(pic);
        col.classList.add('columns-img-col');
        return;
      }

      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-img-col');
        }
        // Optimize existing picture
        const img = pic.querySelector('img');
        if (img) {
          const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
          pic.replaceWith(optimized);
        }
      }
    });
  });
}
