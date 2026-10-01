(() => {
  const data = window.ZENHOME_GALLERY;
  const grid = document.querySelector('[data-gallery-grid]');
  const filters = document.querySelector('[data-filters]');
  const count = document.querySelector('[data-gallery-count]');
  const lightbox = document.querySelector('[data-lightbox]');
  if (!data || !grid || !filters || !count || !lightbox) return;

  const categoryMap = new Map();
  data.images.forEach((item) => {
    if (!categoryMap.has(item.category)) categoryMap.set(item.category, item.categoryTitle);
  });

  let activeCategory = 'all';
  let visibleImages = data.images;
  let lightboxIndex = 0;
  let lastFocused = null;

  const filterOptions = [['all', 'Všechny realizace'], ...categoryMap.entries()];
  filterOptions.forEach(([key, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-button';
    button.textContent = label;
    button.dataset.category = key;
    button.classList.toggle('active', key === activeCategory);
    button.addEventListener('click', () => setFilter(key, true));
    filters.append(button);
  });

  const render = () => {
    visibleImages = activeCategory === 'all'
      ? data.images
      : data.images.filter((item) => item.category === activeCategory);
    count.textContent = `${visibleImages.length} ${visibleImages.length === 1 ? 'fotografie' : 'fotografií'}`;
    grid.replaceChildren();
    const fragment = document.createDocumentFragment();
    visibleImages.forEach((item, index) => {
      const figure = document.createElement('figure');
      figure.className = 'gallery-item';
      figure.tabIndex = 0;
      figure.setAttribute('role', 'button');
      figure.setAttribute('aria-label', `Zvětšit: ${item.title || item.categoryTitle}`);
      const image = document.createElement('img');
      image.src = item.thumb;
      image.alt = item.title || item.categoryTitle;
      image.loading = index < 8 ? 'eager' : 'lazy';
      image.decoding = 'async';
      image.width = item.width;
      image.height = item.height;
      const caption = document.createElement('figcaption');
      caption.textContent = item.title || item.categoryTitle;
      figure.append(image, caption);
      figure.addEventListener('click', () => openLightbox(index, figure));
      figure.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(index, figure);
        }
      });
      fragment.append(figure);
    });
    grid.append(fragment);
  };

  const setFilter = (category, updateHash) => {
    activeCategory = categoryMap.has(category) ? category : 'all';
    filters.querySelectorAll('button').forEach((button) => {
      button.classList.toggle('active', button.dataset.category === activeCategory);
    });
    render();
    if (updateHash) {
      const hash = activeCategory === 'all' ? '' : `#${activeCategory}`;
      history.replaceState(null, '', `${location.pathname}${hash}`);
    }
  };

  const updateLightbox = () => {
    const item = visibleImages[lightboxIndex];
    const image = lightbox.querySelector('[data-lightbox-image]');
    image.src = item.full;
    image.alt = item.title || item.categoryTitle;
    lightbox.querySelector('[data-lightbox-caption]').textContent = `${item.categoryTitle}${item.title ? ` — ${item.title}` : ''} · ${lightboxIndex + 1}/${visibleImages.length}`;
  };

  function openLightbox(index, trigger) {
    lightboxIndex = index;
    lastFocused = trigger;
    updateLightbox();
    lightbox.classList.add('open');
    document.body.classList.add('menu-open');
    lightbox.querySelector('[data-lightbox-close]').focus();
  }

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    document.body.classList.remove('menu-open');
    lightbox.querySelector('[data-lightbox-image]').removeAttribute('src');
    if (lastFocused) lastFocused.focus();
  };

  const move = (delta) => {
    lightboxIndex = (lightboxIndex + delta + visibleImages.length) % visibleImages.length;
    updateLightbox();
  };

  lightbox.querySelector('[data-lightbox-close]').addEventListener('click', closeLightbox);
  lightbox.querySelector('[data-lightbox-prev]').addEventListener('click', () => move(-1));
  lightbox.querySelector('[data-lightbox-next]').addEventListener('click', () => move(1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
  });

  setFilter(decodeURIComponent(location.hash.slice(1)) || 'all', false);
})();
