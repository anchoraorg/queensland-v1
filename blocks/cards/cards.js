import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Build a picture element from a plain-text image URL stored in a richtext cell.
 * The EDS CDN cannot optimize relative image paths served from GitHub,
 * so we store the path as plain text and reconstruct the picture client-side.
 */
function buildPictureFromUrl(url, alt = '') {
  const pic = document.createElement('picture');
  const img = document.createElement('img');
  img.src = url;
  img.alt = alt;
  img.loading = 'lazy';
  pic.appendChild(img);
  return pic;
}

function isImageUrl(text) {
  return /\.(jpg|jpeg|png|webp|svg|avif)(\?.*)?$/i.test(text.trim());
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-card-image';
      } else {
        // Handle plain-text image URL stored in richtext field
        const text = div.textContent.trim();
        if (isImageUrl(text)) {
          div.className = 'cards-card-image';
          const pic = buildPictureFromUrl(text);
          div.innerHTML = '';
          div.appendChild(pic);
        } else {
          div.className = 'cards-card-body';
        }
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(ul);
}
