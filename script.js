(() => {
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');

  const updateHeader = () => {
    if (header && !header.classList.contains('inner-header')) {
      header.classList.toggle('scrolled', window.scrollY > 30);
    }
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    });
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        menu.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      }
    });
  }

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -35px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('visible'));
  }

  const preview = document.querySelector('[data-gallery-preview]');
  if (preview && window.ZENHOME_GALLERY) {
    const picks = [0, 27, 78, 174];
    picks.forEach((index) => {
      const item = window.ZENHOME_GALLERY.images[index];
      if (!item) return;
      const link = document.createElement('a');
      link.href = `galerie.html#${item.category}`;
      link.setAttribute('aria-label', item.categoryTitle);
      const image = document.createElement('img');
      image.src = item.thumb;
      image.alt = item.title || item.categoryTitle;
      image.loading = 'lazy';
      image.width = item.width;
      image.height = item.height;
      link.append(image);
      preview.append(link);
    });
  }

  const conceptsGrid = document.querySelector('[data-concepts-grid]');
  if (conceptsGrid && window.ZENHOME_CONCEPTS) {
    window.ZENHOME_CONCEPTS.images.forEach((item) => {
      const figure = document.createElement('figure');
      const image = document.createElement('img');
      image.src = item.thumb;
      image.alt = item.title;
      image.loading = 'lazy';
      image.width = item.width;
      image.height = item.height;
      figure.append(image);
      conceptsGrid.append(figure);
    });
  }

  const contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(contactForm);
      const subject = `Poptávka ZENHOME – ${data.get('name')}`;
      const body = [
        `Jméno: ${data.get('name')}`,
        `E-mail: ${data.get('email')}`,
        `Telefon: ${data.get('phone') || 'neuveden'}`,
        '',
        String(data.get('message')),
      ].join('\n');
      window.location.href = `mailto:andrea@zenhome.cz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();
