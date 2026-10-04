import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { copy } from './i18n';
import { CreativePlayground } from './CreativePlayground';
import { ScrollExperience } from './ScrollExperience';
import { PhoneInput, formatPhone } from './PhoneInput';
import { faq, services, studio, type Language, type Service, type ServiceId } from './config';
import { addDays, formatDate, getTimes, isAvailable, money, requestMessage, slotCapacity, todayInAlmaty, totalPrice, validDate, whatsappLink, type Booking } from './booking';

import { latestRequest, normalizePhone, receiptMessage, removeRequest, saveRequest, type DemoRequest } from './requests';

const Locale = createContext<Language>('kz');
const useText = () => copy[useContext(Locale)];
const Arrow = ({ diagonal = false }: { diagonal?: boolean }) => <span aria-hidden="true" className="arrow">{diagonal ? '↗' : '→'}</span>;
const Eyebrow = ({ children }: { children: ReactNode }) => <p className="eyebrow">{children}</p>;

function Photo({ src, alt, className = '', eager = false }: { src: string; alt: string; className?: string; eager?: boolean }) {
  const isDetail = src.includes('detail');
  return <img src={src} srcSet={isDetail ? undefined : `${src.replace('.webp', '-small.webp')} 720w, ${src} 1536w`} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 60vw, 1200px" alt={alt} className={className} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" width={isDetail ? 1000 : 1536} height={isDetail ? 1000 : 1024} />;
}

function Gallery({ images, alts, children, className = '', captions = false }: { images: string[]; alts: string[]; children?: ReactNode; className?: string; captions?: boolean }) {
  const t = useText(); const dialog = useRef<HTMLDialogElement>(null); const [index, setIndex] = useState(0);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function open(i: number) { previousFocus.current = document.activeElement as HTMLElement; setIndex(i); setClosing(false); dialog.current?.showModal(); }
  function close() {
    const element = dialog.current;
    if (!element?.open || closeTimer.current !== null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { element.close(); return; }
    setClosing(true);
    // Keep the modal and focus trap active until its exit animation finishes.
    closeTimer.current = setTimeout(() => element.close(), 300);
  }
  function advance(direction: number) { setIndex(i => (i + direction + images.length) % images.length); }
  useEffect(() => {
    const element = dialog.current;
    const onClose = () => {
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
      closeTimer.current = null; setClosing(false);
      document.body.style.overflow = ''; previousFocus.current?.focus();
    };
    element?.addEventListener('close', onClose);
    const observer = new MutationObserver(() => { if (element?.open) document.body.style.overflow = 'hidden'; });
    if (element) observer.observe(element, { attributes: true, attributeFilter: ['open'] });
    return () => {
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
      element?.removeEventListener('close', onClose); observer.disconnect(); document.body.style.overflow = '';
    };
  }, []);
  return <>
    <div className={`gallery ${className}`} aria-label={t.galleryLabel}>
      {images.map((src, i) => <button key={src} type="button" className="gallery-image" onClick={() => open(i)} aria-label={`${t.openPhoto}: ${alts[i]}`}><Photo src={src} alt={alts[i]} />{captions && <span className="gallery-caption">{alts[i]}</span>}<span className="gallery-expand" aria-hidden="true">↗</span>{i === 0 && children}</button>)}
    </div>
    <dialog className="lightbox" ref={dialog} data-closing={closing || undefined} aria-label={t.galleryLabel} onCancel={e => { e.preventDefault(); close(); }} onAnimationEnd={e => { if (e.target === e.currentTarget && e.animationName === 'lightbox-out') dialog.current?.close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }} onKeyDown={e => { if (e.key === 'ArrowRight') advance(1); if (e.key === 'ArrowLeft') advance(-1); }}>
      <div className="lightbox-top"><span>{index + 1} / {images.length}</span><button autoFocus type="button" onClick={close} aria-label={t.close}>{t.close} <span aria-hidden="true">×</span></button></div>
      <img src={images[index]} alt={alts[index]} />
      <div className="lightbox-controls"><button type="button" onClick={() => advance(-1)} aria-label={t.previous}>←</button><p>{alts[index]}</p><button type="button" onClick={() => advance(1)} aria-label={t.next}>→</button></div>
    </dialog>
  </>;
}

function Header({ lang, setLang }: { lang: Language; setLang: (value: Language) => void }) {
  const t = useText(); const [menu, setMenu] = useState(false); const location = useLocation();
  useEffect(() => { setMenu(false); }, [location]);
  return <header className="header"><div className="shell header-inner">
    <Link className="wordmark" to="/" aria-label={`MammaMia! Studio — ${t.home}`}>MammaMia!<span>STUDIO · ALMATY</span></Link>
    <nav className="desktop-nav" aria-label={t.menu}><Link to="/#offers">{t.navOffers}</Link><Link to="/#about">{t.navAbout}</Link><Link to="/#faq">FAQ</Link><Link to="/#contact">{t.navContact}</Link></nav>
    <div className="header-actions"><div className="language" aria-label="Тіл / Язык">{(['kz', 'ru'] as const).map(l => <button key={l} onClick={() => setLang(l)} aria-pressed={l === lang} lang={l === 'kz' ? 'kk' : 'ru'}>{l.toUpperCase()}</button>)}</div><Link to="/#booking" className="button header-book">{t.book}<Arrow diagonal /></Link><button className="menu-toggle" aria-expanded={menu} aria-controls="mobile-menu" aria-label={menu ? t.close : t.menu} onClick={() => setMenu(!menu)}>{menu ? '×' : <><span /><span /></>}</button></div>
  </div>{menu && <nav className="mobile-menu" id="mobile-menu" aria-label={t.menu} onKeyDown={e => { if (e.key === 'Escape') setMenu(false); }}><Link to="/#offers">{t.navOffers}<Arrow /></Link><Link to="/#about">{t.navAbout}<Arrow /></Link><Link to="/#faq">FAQ<Arrow /></Link><Link to="/#contact">{t.navContact}<Arrow /></Link></nav>}</header>;
}

function ServiceCard({ service, number }: { service: Service; number: number }) {
  const lang = useContext(Locale); const t = useText();
  return <article className="service-card"><Link to={`/offers/${service.id}`} className="card-image-link" tabIndex={-1} aria-hidden="true"><Photo src={service.image} alt="" /><span className="image-tag">{service.category === 'photo' ? t.photo : t.workshop}</span><span className="card-image-arrow" aria-hidden="true">↗</span></Link><div className="card-heading"><h3><Link to={`/offers/${service.id}`}>{service.name}</Link></h3><span className="card-number">0{number}</span></div><p className="card-summary">{service.summary[lang]}</p><div className="card-meta"><span>{service.duration[lang]}</span><span className="meta-dot">·</span><span>{service.id === 'light-room' ? `60 м² · 1–6 ${t.people}` : service.id === 'clay-date' ? `2 ${t.people}` : `8 ${t.places}`}</span></div><div className="card-footer"><p><strong>{money(service.price)}</strong><span>{service.unit[lang]}</span></p><Link to={`/offers/${service.id}`} className="text-link" aria-label={`${t.details}: ${service.name}`}>{t.details}<Arrow /></Link></div></article>;
}

function Offers() {
  const t = useText(); const [filter, setFilter] = useState('all');
  return <section id="offers" className="section shell"><Eyebrow>{t.offersEyebrow}</Eyebrow><div className="section-heading"><div><h2>{t.offersTitle}</h2><p className="section-intro">{t.offersIntro}</p></div><div className="filters" aria-label={t.navOffers}>{[['all', t.all], ['photo', t.photo], ['workshop', t.workshop]].map(([id, label]) => <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div></div><div className="service-grid" aria-live="polite">{services.filter(s => filter === 'all' || s.category === filter).map(s => <ServiceCard key={s.id} service={s} number={services.indexOf(s) + 1} />)}</div></section>;
}

function About() {
  const lang = useContext(Locale); const t = useText();
  return <section id="about" className="about-section"><div className="shell"><div className="about-grid"><div className="about-visual"><Gallery images={services.map(s => s.gallery[1])} alts={services.map(s => s.imageAlt[lang])} className="about-gallery"><span className="photo-caption">{t.moments}</span></Gallery><span className="handwritten" aria-hidden="true">{t.slow}</span></div><div className="about-copy"><Eyebrow>{t.aboutEyebrow}</Eyebrow><h2>{t.aboutTitle1}<br /><em>{t.aboutTitle2}</em></h2><p>{t.aboutBody}</p><p>{t.aboutBody2}</p><Link to="/#booking" className="text-link">{t.book}<Arrow /></Link></div></div><div className="steps"><h3>{t.how}</h3>{t.steps.map(([title, body], i) => <div className="step" key={title}><span>0{i + 1}</span><div><h4>{title}</h4><p>{body}</p></div></div>)}</div></div></section>;
}

function BookingForm() {
  const lang = useContext(Locale); const t = useText(); const location = useLocation();
  const [clock, setClock] = useState(() => new Date());
  const today = todayInAlmaty(clock);
  const [selection, setSelection] = useState<Booking>({ serviceId: 'light-room', date: addDays(today, 1), time: '', people: 1, hours: 1 });
  const [prepared, setPrepared] = useState<DemoRequest | null>(latestRequest);
  const [phone, setPhone] = useState('+7');
  const liveWhatsApp = Boolean(whatsappLink(''));
  const [handoff, setHandoff] = useState(false);
  const handoffHeading = useRef<HTMLHeadingElement>(null);
  const handoffUrl = whatsappLink(`${requestMessage(selection, lang)}\n${t.phone}: ${normalizePhone(phone)}.`);
  useEffect(() => { if (handoff) handoffHeading.current?.focus(); }, [handoff]);
  const [phoneError, setPhoneError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const submitting = useRef(false);
  const phoneField = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false); const [copyError, setCopyError] = useState(false); const [error, setError] = useState(false);
  const resultHeading = useRef<HTMLHeadingElement>(null); const messageField = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const service = services.find(s => s.id === selection.serviceId)!;
  const times = getTimes(selection.serviceId);
  const availableTimes = times.filter(time => isAvailable({ ...selection, time }, clock));
  const message = prepared ? receiptMessage(prepared, lang) : '';
  const whatsapp = whatsappLink(message);
  useEffect(() => { const interval = setInterval(() => setClock(new Date()), 30000); return () => clearInterval(interval); }, []);
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('service') as ServiceId | null;
    if (id && services.some(s => s.id === id)) {
      setSelection(current => ({ ...current, serviceId: id, people: id === 'clay-date' ? 2 : 1, hours: 1, time: '' }));
      setPrepared(null); setHandoff(false); setCopied(false); setError(false);
    }
  }, [location.search]);
  useEffect(() => { if (prepared) resultHeading.current?.focus(); }, [prepared]);
  useEffect(() => { setCopied(false); setCopyError(false); }, [lang]);
  function update(next: Partial<Booking>) {
    setSelection(current => {
      const changed = { ...current, ...next };
      if (next.serviceId) { changed.people = next.serviceId === 'clay-date' ? 2 : 1; changed.hours = 1; changed.time = ''; }
      if (!isAvailable(changed)) changed.time = '';
      return changed;
    }); setPrepared(null); setError(false); setCopied(false); setCopyError(false);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    setSaveError(false);
    if (!isAvailable(selection)) { setError(true); setClock(new Date()); return; }
    if (!normalizePhone(phone)) { setPhoneError(true); phoneField.current?.focus(); return; }
    if (liveWhatsApp) {
      setHandoff(true);
      return;
    }
    submitting.current = true; setSaving(true); setPhoneError(false); setError(false);
    try {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      const accepted = saveRequest(selection, phone, window.localStorage);
      setPrepared(accepted); setCopied(false);
    } catch (failure) {
      if (failure instanceof Error && failure.message === 'unavailable') { setError(true); setClock(new Date()); }
      else setSaveError(true);
    } finally { submitting.current = false; setSaving(false); }
  }
  function startNew() {
    if (prepared) {
      setSelection({ serviceId: prepared.serviceId, date: validDate(prepared.date) ? prepared.date : addDays(today, 1), time: '', people: prepared.people, hours: prepared.hours });
      setPhone(formatPhone(prepared.phone));
    }
    setPrepared(null); setSaveError(false); setPhoneError(false); setCopied(false);
    requestAnimationFrame(() => formRef.current?.querySelector('select')?.focus());
  }
  function deleteSaved() {
    if (!prepared) return;
    try { removeRequest(prepared.id, window.localStorage); startNew(); setPhone('+7'); }
    catch { setSaveError(true); }
  }
  async function copyMessage() {
    try { await navigator.clipboard.writeText(message); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); messageField.current?.focus(); messageField.current?.select(); }
  }
  return <section id="booking" className="booking-section"><div className="shell booking-grid"><div className="booking-copy"><Eyebrow>{t.bookingEyebrow}</Eyebrow><h2>{t.bookingTitle1}<br /><em>{t.bookingTitle2}</em></h2><p>{t.bookingIntro}</p><div className="demo-notice"><span className="demo-dot" /><div><strong>{t.demoSchedule}</strong><p>{t.demoNote}</p></div></div><p className="timezone">{t.timezone}</p><div className="booking-art" aria-hidden="true"><svg viewBox="0 0 280 180" fill="none"><path d="M75 142c-15-23-10-53 13-68 25-16 64-7 77 18 9 17 7 41-8 53M54 146h147M102 68c-24-30-17-49-3-50 18 0 31 18 32 51m-6-1c-1-30 14-54 30-48 16 8 5 30-20 51m7 3c25-25 48-23 54-9 6 16-18 24-43 17M86 101c18 8 52 12 78 0M84 119c25 7 50 8 80 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg><span>{t.magic}</span></div></div>
    <div className="booking-panel">
      {handoff ? <div className="request-result handoff-result"><h3 ref={handoffHeading} tabIndex={-1}>{lang === 'kz' ? 'Хабарлама дайын' : 'Сообщение готово'}</h3><p>{lang === 'kz' ? 'WhatsApp-ты ашып, хабарламаны жіберіңіз. Әкімші бос уақыт пен бағаны нақтылап, жазылуды растайды.' : 'Откройте WhatsApp и отправьте сообщение. Администратор уточнит время и стоимость и подтвердит запись.'}</p><a className="button prepare-button" href={handoffUrl!} target="_blank" rel="noopener noreferrer">{lang === 'kz' ? 'WhatsApp арқылы жіберу' : 'Отправить в WhatsApp'}<Arrow diagonal /></a><button className="text-link" type="button" onClick={() => setHandoff(false)}>{lang === 'kz' ? 'Таңдауды өзгерту' : 'Изменить выбор'}</button></div> : (!prepared || liveWhatsApp) ? <form onSubmit={submit} ref={formRef} noValidate aria-busy={saving}>
        <div className="form-title"><h3>{t.book}</h3><span className="demo-pill">{t.demoSchedule}</span></div>
        <label className="field-label" htmlFor="service">{t.service}</label><select id="service" value={selection.serviceId} onChange={e => update({ serviceId: e.target.value as ServiceId })}>{services.map(s => <option key={s.id} value={s.id}>{s.name} — {money(s.price)} {s.unit[lang]}</option>)}</select>
        <fieldset><legend>{t.date}</legend><div className="date-choices">{Array.from({ length: 7 }, (_, i) => addDays(today, i)).map(date => <button type="button" key={date} aria-pressed={selection.date === date} aria-label={formatDate(date, lang)} onClick={() => update({ date })}><span>{formatDate(date, lang, { weekday: 'short' })}</span><strong>{Number(date.slice(-2))}</strong><small>{formatDate(date, lang, { month: 'short' }).replace('.', '')}</small></button>)}</div><div className="date-input-row"><label htmlFor="date">{t.anotherDate}</label><input id="date" type="date" min={today} max={addDays(today, studio.schedule.horizonDays - 1)} value={selection.date} onChange={e => update({ date: e.target.value })} aria-describedby={!validDate(selection.date, clock) ? 'date-error' : undefined} aria-invalid={!validDate(selection.date, clock)} required /></div>{!validDate(selection.date, clock) && <p id="date-error" className="form-error" role="alert">{t.dateError}</p>}</fieldset>
        <div className="quantity-row"><div><label className="field-label" htmlFor="people">{t.attendees}</label><select id="people" value={selection.people} onChange={e => update({ people: Number(e.target.value) })} disabled={service.id === 'clay-date'}>{(service.id === 'clay-date' ? [2] : Array.from({ length: service.capacity }, (_, i) => i + 1)).map(n => <option key={n} value={n}>{n} {t.people}{service.id === 'clay-date' ? ` · ${t.fixed}` : ''}</option>)}</select></div>{service.id === 'light-room' && <div><label className="field-label" htmlFor="hours">{t.hours}</label><select id="hours" value={selection.hours} onChange={e => update({ hours: Number(e.target.value) })}>{Array.from({ length: studio.schedule.maxPhotoHours }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} {t.hour}</option>)}</select></div>}</div>
        <fieldset><legend>{t.time}</legend><div className="time-choices">{times.map(time => { const available = availableTimes.includes(time); return <button key={time} type="button" disabled={!available} aria-pressed={selection.time === time && available} onClick={() => update({ time })}>{time}{service.id === 'paint-evening' && <small>{slotCapacity(service.id, selection.date, time)} {t.places}</small>}</button>; })}</div><p className="field-note">{availableTimes.length ? t.slotsNote : t.noSlots}</p></fieldset>
        <div className="contact-field"><label className="field-label" htmlFor="phone">{t.phone}<span aria-hidden="true"> *</span></label><PhoneInput ref={phoneField} id="phone" name="phone" placeholder={t.phonePlaceholder} value={phone} required aria-invalid={phoneError} aria-describedby={`phone-hint privacy-note${phoneError ? ' phone-error' : ''}`} onChange={value => { setPhone(value); setPhoneError(false); setSaveError(false); }} onBlur={() => { if (phone !== '+7' && !normalizePhone(phone)) setPhoneError(true); }} /><p id="phone-hint" className="field-note">{t.phoneHint}</p>{phoneError && <p id="phone-error" className="form-error" role="alert">{t.phoneError}</p>}</div>
        <div className="booking-summary" aria-live="polite"><div className="summary-details"><span>{t.summary}</span><strong>{service.name}</strong><p>{validDate(selection.date, clock) ? formatDate(selection.date, lang, { day: 'numeric', month: 'long' }) : '—'} · {selection.time || t.notChosen}</p><p>{selection.people} {t.people} · {service.id === 'light-room' ? `${selection.hours} ${t.hour}` : service.duration[lang]}</p></div><div className="summary-price"><span>{t.total}</span><strong data-testid="total">{money(totalPrice(selection))}</strong></div></div>
        <p id="privacy-note" className="local-demo-note">{liveWhatsApp ? (lang === 'kz' ? 'Таңдауыңыз бен нөміріңіз WhatsApp хабарламасына қосылады. Жіберуді WhatsApp-та өзіңіз растайсыз.' : 'Ваш выбор и телефон попадут в сообщение WhatsApp. Отправку вы подтвердите в WhatsApp.') : t.localNotice}</p>{error && <p className="form-error" role="alert">{t.selectionError}</p>}{saveError && <p className="form-error" role="alert">{t.saveError}</p>}<button type="submit" className="button prepare-button" disabled={saving}>{saving ? t.sending : liveWhatsApp ? (lang === 'kz' ? 'Хабарлама дайындау' : 'Подготовить сообщение') : t.prepare}{saving ? <span className="button-spinner" aria-hidden="true" /> : <Arrow />}</button><p className="no-payment">{t.noPayment}</p>
      </form> : <div className="request-result">
        <div className="receipt-top"><span className="result-check" aria-hidden="true">✓</span><span className="demo-pill">{t.demoRequest}</span></div>
        <h3 ref={resultHeading} tabIndex={-1}>{t.ready}</h3>
        <p className="confirmation" role="status">{t.confirmation}</p>
        <div className="receipt-id"><span>{t.requestNumber}</span><strong data-testid="request-id">{prepared.id}</strong></div>
        <div className="result-summary"><strong>{services.find(s => s.id === prepared.serviceId)!.name}</strong><span>{formatDate(prepared.date, lang)} · {prepared.time}</span><span>{prepared.people} {t.people}{prepared.serviceId === 'light-room' ? ` · ${prepared.hours} ${t.hour}` : ''}</span><span className="receipt-phone">{t.phone}: <b>{prepared.phone}</b></span><strong>{money(prepared.total)}</strong></div>
        <ol className="request-timeline"><li><span className="timeline-mark" aria-hidden="true">✓</span><div><strong>{t.receivedStep}</strong><p>{t.receivedDetail}</p></div></li><li><span className="timeline-mark pending" aria-hidden="true">2</span><div><strong>{t.pendingStep}</strong><p>{t.pendingDetail}</p></div></li></ol>
        <p className="local-demo-note">{t.localNotice}</p><p className="receipt-note">{t.receiptNote}</p>
        <button className="button prepare-button new-request" type="button" onClick={startNew}>{t.edit}<Arrow /></button>
        <details className="message-details"><summary>{t.optionalMessage}<span aria-hidden="true">+</span></summary><label htmlFor="message" className="field-label">{t.preview}</label><textarea ref={messageField} id="message" readOnly value={message} rows={7} /><button type="button" onClick={copyMessage} className="button button-outline">{copied ? t.copied : t.copy}<span aria-hidden="true">{copied ? '✓' : '⧉'}</span></button><p aria-live="polite" className={copyError ? 'form-error' : 'copy-status'}>{copyError ? t.copyError : copied ? t.copied : ''}</p>{whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="button button-outline">{t.whatsapp}<Arrow diagonal /></a> : <><button className="button button-outline" disabled>{t.whatsappUnavailable}</button><p className="field-note">{t.whatsappNote}</p></>}</details>
        {saveError && <p className="form-error" role="alert">{t.deleteError}</p>}<button type="button" className="delete-request" onClick={deleteSaved}>{t.deleteRequest}</button>
      </div>}

    </div></div></section>;
}

function FAQ() { const lang = useContext(Locale); const t = useText(); return <section id="faq" className="section shell faq-grid"><div><Eyebrow>{t.faqEyebrow}</Eyebrow><h2>{t.faqTitle}</h2><p className="faq-flower" aria-hidden="true">✳</p></div><div className="faq-items">{faq.map((item, i) => <details key={i}><summary>{item.question[lang]}<span aria-hidden="true">+</span></summary><p>{item.answer[lang]}</p></details>)}</div></section>; }

function Contact() { const lang = useContext(Locale); const t = useText(); return <section id="contact" className="contact-section"><div className="shell contact-grid"><div><Eyebrow>{t.contactEyebrow}</Eyebrow><h2>{t.contactTitle}<br /><em>{t.contactTitleItalic}</em></h2><Link to="/#booking" className="button contact-button">{t.choose}<Arrow diagonal /></Link></div><div className="contact-details"><span className="contact-demo">{t.demoContacts}</span><div><span>{t.address}</span><p>{studio.contact.city[lang]}<br />{studio.contact.address[lang]}</p>{studio.contact.mapUrl && <a className="text-link" href={studio.contact.mapUrl} target="_blank" rel="noopener noreferrer">{lang === 'kz' ? 'Картадан ашу' : 'Открыть на карте'}<Arrow diagonal /></a>}{studio.contact.phone && <a className="contact-phone" href={`tel:${studio.contact.phone.replace(/[^+0-9]/g, '')}`}>{studio.contact.phone}</a>}</div><div className="contact-bottom"><div><span>{t.contactHours}</span><p>{studio.contact.hours[lang]}</p></div><div><span>{t.email}</span><p>{studio.email}</p></div></div><p className="contact-note">{t.contactNote}</p></div></div></section>; }

function Footer() { const t = useText(); return <footer className="footer shell"><Link className="wordmark" to="/">MammaMia!<span>STUDIO · ALMATY</span></Link><p>{t.footer}</p><span>{t.footerSmall}</span></footer>; }

function Home() {
  const t = useText(); const lang = useContext(Locale);
  return <>
    <ScrollExperience />
    <section id="create" className="hero hero-story shell">
      <div className="hero-sticky">
        <div className="hero-heading">
          <Eyebrow><span className="tiny-sun" aria-hidden="true">✳</span>{t.eyebrow}</Eyebrow>
          <h1>{t.hero1}<br /><em>{t.hero2}</em></h1>
          <div className="hero-intro"><p>{t.intro}</p><Link to="/#offers" className="button">{t.choose}<Arrow diagonal /></Link><Link to="/#contact" className="text-link">{t.navContact}<Arrow diagonal /></Link></div>
        </div>
        <CreativePlayground lang={lang} />
      </div>
    </section>
    <section className="hero-photography shell" aria-label={t.navAbout}><div className="hero-image"><Photo src={services[0].image} alt={services[0].imageAlt[lang]} eager /><div className="hero-photo-label"><span className="live-dot" />LIGHT ROOM<span className="hero-photo-label-line" />60 м²</div><div className="hero-stamp" aria-hidden="true"><span>{t.stamp1}</span><strong>m!</strong><span>{t.stamp2}</span></div></div><div className="hero-image-caption"><span>{t.heroCaption}</span><span>{t.heroSide}</span></div></section>
    <div className="ribbon"><div className="shell">{t.ribbon.map(item => <span key={item}><span aria-hidden="true">✳</span>{item}</span>)}</div></div>
    <Offers /><About /><BookingForm /><FAQ /><Contact />
  </>;
}

function ServicePage() {
  const { id } = useParams(); const service = services.find(s => s.id === id); const lang = useContext(Locale); const t = useText();
  if (!service) return <NotFound />;
  return <><section className="detail-section shell"><Link to="/#offers" className="text-link back-link">← {t.back}</Link><div className="detail-heading"><div><Eyebrow>{service.category === 'photo' ? t.photo : t.workshop}</Eyebrow><h1>{service.name}</h1><p>{service.summary[lang]}</p></div><div className="detail-price"><strong>{money(service.price)}</strong><span>{service.unit[lang]}</span><Link to={`/?service=${service.id}#booking`} className="button detail-book">{t.bookThis}<Arrow /></Link></div></div><Gallery className="detail-gallery" images={service.gallery} alts={service.galleryCaptions?.map(caption => caption[lang]) ?? [service.imageAlt[lang], `${service.name} · ${t.photoOf} 2`]} captions={Boolean(service.galleryCaptions)} /><p className="gallery-disclosure">{t.serviceDemo}</p><div className="detail-content"><div><Eyebrow>{service.duration[lang]} · {service.capacity} {t.people}</Eyebrow><h2>{service.summary[lang]}</h2><p>{service.description[lang]}</p><h3>{t.included}</h3><ul className="included-list">{service.features.map((item, i) => <li key={i}><span aria-hidden="true">✓</span>{item[lang]}</li>)}</ul></div><aside className="detail-aside"><h3>{t.conditions}</h3><ul>{service.conditions.map((item, i) => <li key={i}>{item[lang]}</li>)}</ul><Link to={`/?service=${service.id}#booking`} className="button">{t.bookThis}<Arrow /></Link><p className="field-note">{t.serviceDemo}</p></aside></div></section><FAQ /><Contact /></>;
}
function NotFound() { const t = useText(); return <section className="not-found shell"><Eyebrow>404</Eyebrow><h1>{t.notFound}</h1><p>{t.notFoundText}</p><Link to="/" className="button">{t.home}<Arrow /></Link></section>; }

function ScrollAndMetadata() {
  const location = useLocation(); const lang = useContext(Locale);
  useEffect(() => {
    const frame = requestAnimationFrame(() => { if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' }); else window.scrollTo({ top: 0, behavior: 'instant' }); });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash, location.key]);
  useEffect(() => {
    document.documentElement.lang = lang === 'kz' ? 'kk' : 'ru';
    const service = services.find(s => location.pathname === `/offers/${s.id}`);
    document.title = `${service ? `${service.name} — ` : ''}MammaMia! Studio — ${lang === 'kz' ? 'шығармашылық кеңістік, Алматы' : 'творческое пространство, Алматы'}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', service ? service.description[lang] : copy[lang].intro);
  }, [lang, location.pathname]);
  return null;
}

export default function App() {
  const [lang, setLanguage] = useState<Language>(() => { try { return localStorage.getItem('mammamia-language') === 'ru' ? 'ru' : 'kz'; } catch { return 'kz'; } });
  const location = useLocation(); const service = services.find(s => location.pathname === `/offers/${s.id}`);
  function setLang(value: Language) { setLanguage(value); try { localStorage.setItem('mammamia-language', value); } catch { /* Language still works without storage. */ } }
  const t = copy[lang];
  return <Locale.Provider value={lang}><ScrollAndMetadata /><a className="skip-link" href="#main">{t.skip}</a><Header lang={lang} setLang={setLang} /><main id="main" key={location.pathname} className="page-transition"><Routes><Route path="/" element={<Home />} /><Route path="/offers/:id" element={<ServicePage />} /><Route path="*" element={<NotFound />} /></Routes></main><Footer /><div className="mobile-booking"><span>MammaMia! <em>Studio</em></span><Link to={service ? `/?service=${service.id}#booking` : '/#booking'} className="button">{t.book}<Arrow diagonal /></Link></div></Locale.Provider>;
}
