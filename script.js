(() => {
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  const menuBackdrop = document.querySelector('[data-menu-backdrop]');

  const updateHeader = () => {
    if (header && !header.classList.contains('inner-header')) {
      header.classList.toggle('scrolled', window.scrollY > 30);
    }
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if (menuButton && menu && menuBackdrop) {
    const setMenu = (open) => {
      menu.classList.toggle('open', open);
      menuBackdrop.classList.toggle('open', open);
      menuButton.classList.toggle('open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    };
    menuButton.addEventListener('click', () => {
      const open = !menu.classList.contains('open');
      setMenu(open);
      if (open) menu.querySelector('a')?.focus({ preventScroll: true });
    });
    menuBackdrop.addEventListener('click', () => setMenu(false));
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.classList.contains('open')) {
        setMenu(false);
        menuButton.focus();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 980) setMenu(false);
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

  const conceptsGrid = document.querySelector('[data-concepts-grid]');
  if (conceptsGrid && window.ZENHOME_CONCEPTS) {
    window.ZENHOME_CONCEPTS.images.forEach((item) => {
      const figure = document.createElement('figure');
      const link = document.createElement('a');
      link.href = item.full;
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('aria-label', 'Otevřít koncept ve větším rozlišení');
      const image = document.createElement('img');
      image.src = item.thumb;
      image.alt = item.title;
      image.loading = 'lazy';
      image.width = item.width;
      image.height = item.height;
      link.append(image);
      figure.append(link);
      conceptsGrid.append(figure);
    });
  }

  const reviewsSlider = document.querySelector('[data-reviews-slider]');
  if (reviewsSlider) {
    const slides = [...reviewsSlider.querySelectorAll('[data-review-slide]')];
    const dotsContainer = reviewsSlider.querySelector('[data-review-dots]');
    const pauseButton = reviewsSlider.querySelector('[data-review-pause]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current = 0;
    let timer = null;
    let explicitlyPaused = reducedMotion;
    let temporarilyPaused = false;
    let touchStart = null;

    const dots = slides.map((slide, index) => {
      slide.setAttribute('aria-hidden', String(index !== 0));
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Zobrazit recenzi ${index + 1}`);
      button.classList.toggle('active', index === 0);
      button.addEventListener('click', () => show(index));
      dotsContainer.append(button);
      return button;
    });

    const delayForCurrentSlide = () => {
      const words = slides[current].textContent.trim().split(/\s+/).length;
      return Math.max(8500, Math.min(15000, 5000 + words * 150));
    };
    const schedule = () => {
      window.clearTimeout(timer);
      if (!explicitlyPaused && !temporarilyPaused && !document.hidden) {
        timer = window.setTimeout(() => show(current + 1), delayForCurrentSlide());
      }
    };
    const show = (index) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === current;
        slide.classList.toggle('active', active);
        slide.setAttribute('aria-hidden', String(!active));
        dots[slideIndex].classList.toggle('active', active);
      });
      schedule();
    };

    reviewsSlider.querySelector('[data-review-prev]').addEventListener('click', () => show(current - 1));
    reviewsSlider.querySelector('[data-review-next]').addEventListener('click', () => show(current + 1));
    pauseButton.addEventListener('click', () => {
      explicitlyPaused = !explicitlyPaused;
      pauseButton.textContent = explicitlyPaused ? '▶' : 'Ⅱ';
      pauseButton.setAttribute('aria-label', explicitlyPaused ? 'Spustit automatické přehrávání' : 'Pozastavit automatické přehrávání');
      schedule();
    });
    reviewsSlider.addEventListener('mouseenter', () => { temporarilyPaused = true; schedule(); });
    reviewsSlider.addEventListener('mouseleave', () => { temporarilyPaused = false; schedule(); });
    reviewsSlider.addEventListener('focusin', () => { temporarilyPaused = true; schedule(); });
    reviewsSlider.addEventListener('focusout', (event) => {
      if (!reviewsSlider.contains(event.relatedTarget)) { temporarilyPaused = false; schedule(); }
    });
    reviewsSlider.addEventListener('pointerdown', (event) => { touchStart = event.clientX; });
    reviewsSlider.addEventListener('pointerup', (event) => {
      if (touchStart === null) return;
      const distance = event.clientX - touchStart;
      touchStart = null;
      if (Math.abs(distance) > 55) show(current + (distance < 0 ? 1 : -1));
    });
    document.addEventListener('visibilitychange', schedule);
    schedule();
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
