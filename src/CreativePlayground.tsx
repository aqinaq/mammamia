import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { whatsappLink } from './booking';
import type { Language } from './config';
import './creative-playground.css';

const words = {
  kz: {
    hint: 'Скролл жаса — шабыт гүлденсін', book: 'Шығармашылық сабаққа жазылу',
    whatsapp: 'WhatsApp-та менеджерге жазу', cta: 'Бірге жасайық', action: 'Жазылу',
    phases: ['Қиял', 'Өрнек', 'Гүлдену'],
    message: 'Сәлеметсіз бе! MammaMia! студиясына жазылғым келеді. Залдар мен шығармашылық сабақтар туралы айтып бересіз бе?',
  },
  ru: {
    hint: 'Листай — пусть вдохновение расцветёт', book: 'Записаться на творческое занятие',
    whatsapp: 'Написать менеджеру в WhatsApp', cta: 'Давай создавать вместе', action: 'Записаться',
    phases: ['Идея', 'Узор', 'Цветение'],
    message: 'Здравствуйте! Хочу записаться в MammaMia! Расскажите, пожалуйста, о залах и творческих занятиях.',
  },
};
const silhouette = 'M226 265 L294 265 L289 303 C290 327 327 340 330 379 C334 415 313 448 293 455 L227 455 C205 448 186 415 190 379 C193 340 230 327 231 303 Z';
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function CreativePlayground({ lang }: { lang: Language }) {
  const t = words[lang];
  const root = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '');
  const whatsapp = whatsappLink(t.message);

  useEffect(() => {
    const artwork = root.current;
    const hero = artwork?.closest<HTMLElement>('.hero-story');
    const sticky = hero?.querySelector<HTMLElement>('.hero-sticky');
    if (!artwork || !hero || !sticky) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let visible = true;
    const measure = () => {
      frame = 0;
      if (!visible) return;
      const bounds = hero.getBoundingClientRect();
      const style = getComputedStyle(hero);
      const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const pinned = getComputedStyle(sticky).position === 'sticky';
      const distance = pinned ? hero.offsetHeight - sticky.offsetHeight - padding : hero.offsetHeight * .65;
      const travelled = pinned
        ? sticky.getBoundingClientRect().top - bounds.top - parseFloat(style.paddingTop)
        : (document.querySelector('.header')?.getBoundingClientRect().bottom ?? 0) - bounds.top;
      const progress = preference.matches ? 1 : clamp(travelled / Math.max(1, distance));
      const ornament = clamp((progress - .06) / .4);
      const growth = clamp((progress - .26) / .42);
      const bloom = clamp((progress - .5) / .38);
      const warmth = clamp((progress - .62) / .38);
      const values: Record<string, number> = { progress, ornament, growth, bloom, warmth };
      for (let i = 0; i < 4; i++) values[`flower-${i}`] = clamp((progress - .48 - i * .065) / .3);
      for (const [name, value] of Object.entries(values)) artwork.style.setProperty(`--${name}`, value.toFixed(4));
      const clay = [200, 158, 123], blue = [36, 108, 170], rose = [187, 80, 118];
      const base = clay.map((value, i) => value + (blue[i] - value) * ornament);
      const color = base.map((value, i) => Math.round(value + (rose[i] - value) * warmth));
      artwork.style.setProperty('--vase-color', `rgb(${color.join(',')})`);
      artwork.dataset.progress = progress.toFixed(3);
      artwork.dataset.phase = progress < .3 ? '0' : progress < .68 ? '1' : '2';
      hero.style.setProperty('--story-progress', progress.toFixed(4));
    };
    const schedule = () => { if (visible && !frame) frame = requestAnimationFrame(measure); };
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); });
    const resize = new ResizeObserver(schedule);
    intersection.observe(hero); resize.observe(hero); resize.observe(sticky);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    preference.addEventListener('change', schedule);
    schedule();
    return () => {
      intersection.disconnect(); resize.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule);
      preference.removeEventListener('change', schedule);
    };
  }, []);

  return <div className="hero-artwork" ref={root} data-progress="0">
    <Link className="hero-art-link" to={whatsapp ?? '/#booking'} target={whatsapp ? '_blank' : undefined} rel={whatsapp ? 'noopener noreferrer' : undefined} aria-label={whatsapp ? t.whatsapp : t.book}>
      <div className="creative-canvas">
        <span className="creative-scene-top" aria-hidden="true">ATELIER / MAMMAMIA!</span>
            <svg className="creative-art" viewBox="0 0 520 500" aria-hidden="true">
              <defs>
                <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#cbe7ef" /><stop offset="1" stopColor="#f3f5e9" /></linearGradient>
                <linearGradient id={`${id}-glaze`}><stop stopColor="#fff" stopOpacity=".3" /><stop offset=".35" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#113b63" stopOpacity=".25" /></linearGradient>
                <clipPath id={`${id}-vase`}><path d={silhouette} /></clipPath>
                <pattern id={`${id}-tiles`} width="65" height="36" patternUnits="userSpaceOnUse"><path d="M0 0H65V36H0Z" fill="none" stroke="#648ba2" strokeWidth=".7" /></pattern>
              </defs>
              <path d="M84 395V210a176 176 0 0 1 352 0v185" fill={`url(#${id}-sky)`} />
              <path className="creative-sunset" d="M84 395V210a176 176 0 0 1 352 0v185" fill="#f5c6a6" />
              <path className="creative-wave creative-wave-far" d="M84 309Q166 286 260 308T436 301V395H84Z" fill="#9bc9d7" />
              <path className="creative-wave creative-wave-near" d="M84 343Q167 317 255 337T436 335V395H84Z" fill="#76b4ce" />
              <path d="M112 357h64m160-9h55m-218-23h34m69 36h36" stroke="#e9f6ee" strokeWidth="2" strokeLinecap="round" />
              <path d="M75 394V211a185 185 0 0 1 370 0v183" fill="none" stroke="#fffdf5" strokeWidth="18" />
              <path d="M62 394V211a198 198 0 0 1 396 0v183" fill="none" stroke="#c5d7dd" strokeWidth="1" />
              <path d="M0 395H520V500H0Z" fill="#e7eae1" /><path d="M0 395H520V500H0Z" fill={`url(#${id}-tiles)`} opacity=".55" />
              <ellipse cx="265" cy="459" rx="106" ry="14" fill="#123f6a" opacity=".12" />
              <path className="creative-ribbon" pathLength="1" d="M45 335C-5 220 149 112 353 151S500 344 342 365 101 304 125 240 348 189 398 267" fill="none" stroke="#d7ac49" strokeWidth="2" strokeLinecap="round" />
              <g className="creative-petals">
                {Array.from({ length: 9 }, (_, index) => <g key={index} transform={`translate(${260 + Math.cos(index * .8) * 195} ${250 + Math.sin(index * .8) * 160})`}>
                  <ellipse className={`creative-petal creative-petal-${index % 3}`} cx="0" cy="0" rx={5 + index % 3 * 2} ry="15" fill={['#c35d83', '#e9ae46', '#6d9678'][index % 3]} transform={`rotate(${index * 37})`} />
                </g>)}
              </g>
              <g className="creative-leaves" fill="none" stroke="#507963" strokeWidth="4" strokeLinecap="round">
                <path d="M254 309Q218 228 171 186M258 304Q274 208 325 168M265 300Q314 259 359 250M252 289Q234 202 247 146" />
                <g fill="#6d9678" stroke="none"><path d="M215 235q-50 2-55-33 42-5 55 33M228 255q-3-47 23-57 17 32-23 57M282 239q-5-40 25-49 9 28-25 49M308 270q12-39 41-32-1 28-41 32M242 201q-31-5-33-31 28-3 33 31" /></g>
              </g>
              <g className="creative-blooms">
                {[[171, 183, -20], [326, 165, 20], [247, 143, -8], [360, 247, 32]].map(([x, y, rotate], index) => <g key={index} transform={`translate(${x} ${y}) rotate(${rotate})`}><g className={`creative-flower creative-flower-${index}`}>
                  <g fill={index % 2 ? '#e9ae46' : '#c35d83'}>{[0, 60, 120, 180, 240, 300].map(angle => <ellipse key={angle} cx="0" cy="-16" rx="11" ry="19" transform={`rotate(${angle})`} />)}</g><circle r="9" fill="#fff0b4" /><circle r="3" fill="#99522d" />
                </g></g>)}
              </g>
              <g className="creative-vase">
                <path className="creative-vase-body" d={silhouette} />
                <g clipPath={`url(#${id}-vase)`}>
                  <path d={silhouette} fill={`url(#${id}-glaze)`} />
                  <g className="creative-pattern" fill="none" stroke="#fff5d3" strokeWidth="5" opacity=".9">
                    <path pathLength="1" d="M170 359Q192 341 214 359T258 359T302 359T346 359M170 374Q192 356 214 374T258 374T302 374T346 374M178 428H340" />
                    {[219, 260, 301].map(x => <path pathLength="1" key={x} d={`M${x} 394v17m-8-8h16`} strokeWidth="3" />)}
                  </g>
                </g>
                <path d={silhouette} fill="none" stroke="#123f6a" strokeOpacity=".2" strokeWidth="1.5" />
                <ellipse cx="260" cy="265" rx="34" ry="6" fill="#173c60" opacity=".5" />
              </g>
              <g className="creative-magic-details" fill="#b44c77">
                <path d="M106 280q-21-25-30-3-4 14 30 27 30-24 19-35-12-13-19 11Z" />
                <path d="M400 356q-17-20-24-3-4 11 24 23 23-19 15-28-9-10-15 8Z" />
                <g fill="#ce9e2f"><path d="m126 143 5 15 15 5-15 5-5 15-5-15-15-5 15-5ZM390 206l4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" /></g>
              </g>
            </svg>
        <svg className="creative-mimi" viewBox="0 0 100 100" aria-hidden="true">
          <g className="mimi-rays" stroke="#dcaa39" strokeWidth="3" strokeLinecap="round">{Array.from({ length: 12 }, (_, i) => <path key={i} d="M50 5v9" transform={`rotate(${i * 30} 50 50)`} />)}</g>
          <circle cx="50" cy="50" r="29" fill="#f8df78" stroke="#dcaa39" strokeWidth="1.5" />
          <g fill="#123f6a"><ellipse cx="40" cy="46" rx="2.8" ry="4" /><ellipse cx="60" cy="46" rx="2.8" ry="4" /></g>
          <path d="M40 56Q50 71 60 56" fill="none" stroke="#123f6a" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="32" cy="55" rx="5" ry="3" fill="#eaa09a" /><ellipse cx="68" cy="55" rx="5" ry="3" fill="#eaa09a" />
        </svg>
        <span className="creative-signature" aria-hidden="true">a little everyday magic ♡</span>
      </div>
      <span className="hero-art-cta"><span>{t.cta}<small>{whatsapp ? 'WhatsApp' : t.action}</small></span><span className="hero-art-arrow" aria-hidden="true">↗</span></span>
    </Link>
    <div className="hero-art-phases" aria-hidden="true">{t.phases.map((phase, index) => <span key={phase}><small>0{index + 1}</small> {phase}</span>)}</div>
    <div className="creative-progress" aria-hidden="true"><span /><i>✳</i></div>
    <p className="hero-art-hint"><span aria-hidden="true">↓</span>{t.hint}</p>
  </div>;
}
