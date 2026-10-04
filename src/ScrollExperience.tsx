import { useEffect, useRef } from 'react';

/** Native scrolling stays in charge; only decorative layers follow it. */
export function ScrollExperience() {
  const progress = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const main = document.getElementById('main');
    if (!main) return;
    const targets = Array.from(main.querySelectorAll<HTMLElement>(
      '.section-heading, .service-grid, .about-copy, .about-visual, .steps, .booking-copy, .booking-panel, .faq-grid, .contact-grid',
    ));
    const photo = main.querySelector<HTMLElement>('.hero-photography');
    let frame = 0;
    const reveal = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.setAttribute('data-revealed', 'true');
        reveal.unobserve(entry.target);
      }
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });
    const update = () => {
      frame = 0;
      const distance = document.documentElement.scrollHeight - innerHeight;
      progress.current?.style.setProperty('--page-progress', String(distance > 0 ? scrollY / distance : 0));
      if (photo && !preference.matches) {
        const rect = photo.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
        photo.style.setProperty('--photo-progress', p.toFixed(4));
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const configure = () => {
      reveal.disconnect();
      for (const target of targets) {
        const alreadyVisible = target.getBoundingClientRect().top < innerHeight - 24;
        target.dataset.reveal = 'true';
        if (preference.matches || alreadyVisible) target.dataset.revealed = 'true';
        else reveal.observe(target);
      }
      schedule();
    };
    // Keyboard navigation must never land on a visually concealed control.
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      event.target.closest('[data-reveal]')?.setAttribute('data-revealed', 'true');
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(main);
    configure();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    main.addEventListener('focusin', onFocus);
    preference.addEventListener('change', configure);
    return () => {
      cancelAnimationFrame(frame); reveal.disconnect(); resize.disconnect();
      removeEventListener('scroll', schedule); removeEventListener('resize', schedule);
      main.removeEventListener('focusin', onFocus);
      preference.removeEventListener('change', configure);
      targets.forEach(target => { delete target.dataset.reveal; delete target.dataset.revealed; });
    };
  }, []);
  return <div className="scroll-progress" ref={progress} aria-hidden="true"><span /></div>;
}
