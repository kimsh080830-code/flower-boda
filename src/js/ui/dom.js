__mods["js/ui/dom.js"] = (() => {
const $ = (selector, root = document) => root.querySelector(selector);

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'ariaLabel') node.setAttribute('aria-label', value);
    else if (key === 'hidden') node.hidden = Boolean(value);
    else if (key === 'disabled') node.disabled = Boolean(value);
    else if (key === 'checked') node.checked = Boolean(value);
    else if (key === 'selected') node.selected = Boolean(value);
    else node.setAttribute(key, value);
  }
  for (const child of (Array.isArray(children) ? children : [children]).flat()) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

function button(text, action, { kind = 'secondary', disabled = false, extraClass = '', data = {} } = {}) {
  return el('button', {
    type: 'button',
    className: `btn btn-${kind} ${extraClass}`.trim(),
    text,
    disabled,
    dataset: { action, ...data }
  });
}

function imageState(message, alt, className = '') {
  return el('span', {
    className: `${className} media-image-state state-panel`.trim(),
    role: 'status',
    ariaLabel: alt || message,
    text: message
  });
}

function imageCreditBadge(credit, imageNode, fallbackSrc = '') {
  const source = /^https:\/\//i.test(credit?.sourceUrl || '') ? 'Wikimedia Commons' : '';
  const text = [credit?.license, source].filter(Boolean).join(' · ');
  if (!text || imageNode?.tagName !== 'IMG') return null;
  const badge = el('span', { className: 'image-credit-badge', text, title: text });
  const hideForFallback = () => {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    badge.hidden = Boolean(imageNode.dataset.fallbackApplied || (offline && fallbackSrc));
  };
  imageNode.addEventListener('error', () => queueMicrotask(hideForFallback));
  hideForFallback();
  return badge;
}

function image(src, alt, className = '', fallbackSrc = '') {
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const resolvedSrc = offline && fallbackSrc ? fallbackSrc : (src || fallbackSrc);
  if (!resolvedSrc && /^팬지(?:\s|$)/.test(alt || '')) {
    return el('span', {
      className: `${className} pansy-color-placeholder`.trim(),
      role: 'img',
      ariaLabel: alt
    });
  }
  if (!resolvedSrc) return imageState('이미지가 없어요.', alt, className);
  const img = el('img', {
    src: resolvedSrc,
    alt,
    className: `${className} media-image is-loading`.trim(),
    loading: 'lazy',
    decoding: 'async'
  });
  const markLoaded = () => {
    img.classList.remove('is-loading');
    img.classList.add('is-loaded');
  };
  img.addEventListener('load', markLoaded);
  img.addEventListener('error', () => {
    if (fallbackSrc && img.src !== fallbackSrc && !img.dataset.fallbackApplied) {
      img.dataset.fallbackApplied = 'true';
      img.src = fallbackSrc;
      return;
    }
    img.replaceWith(imageState('이미지를 불러오지 못했어요.', alt, className));
  });
  if (img.complete && img.naturalWidth) queueMicrotask(markLoaded);
  return img;
}
return { "$": $, "el": el, "button": button, "image": image, "imageCreditBadge": imageCreditBadge };
})();
