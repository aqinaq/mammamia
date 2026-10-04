import { services, studio, type Language, type ServiceId } from './config.ts';
export type Booking = { serviceId: ServiceId; date: string; time: string; people: number; hours: number };

export function todayInAlmaty(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: studio.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return `${parts.find(p => p.type === 'year')!.value}-${parts.find(p => p.type === 'month')!.value}-${parts.find(p => p.type === 'day')!.value}`;
}
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10);
}
export function validDate(date: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return false;
  const today = todayInAlmaty(now);
  return date >= today && date <= addDays(today, studio.schedule.horizonDays - 1);
}
export function slotCapacity(serviceId: ServiceId, date: string, time: string): number {
  const day = Number(date.slice(-2)); const hour = Number(time.slice(0, 2));
  if (serviceId === 'light-room') return studio.schedule.blockedPhotoHours.includes(hour) ? 0 : 6;
  if ((day + hour) % 5 === 0) return 0;
  return serviceId === 'clay-date' ? 2 : Math.max(1, 8 - ((day + hour) % 4));
}
export function getTimes(serviceId: ServiceId): string[] {
  return serviceId === 'light-room'
    ? Array.from({ length: studio.schedule.closingHour - studio.schedule.openingHour }, (_, i) => `${studio.schedule.openingHour + i}:00`)
    : studio.schedule.workshopTimes[serviceId];
}
export function isAvailable(booking: Booking, now = new Date()): boolean {
  const { serviceId, date, time, people, hours } = booking;
  const service = services.find(s => s.id === serviceId);
  if (!service || !validDate(date, now) || !getTimes(serviceId).includes(time)) return false;
  // Almaty has a fixed UTC+05 offset. Recheck at submission so a stale tab cannot book a past slot.
  if (new Date(`${date}T${time}:00+05:00`).getTime() <= now.getTime()) return false;
  if (!Number.isInteger(people) || people < 1 || people > service.capacity) return false;
  if (serviceId === 'clay-date' && people !== 2) return false;
  if (serviceId === 'light-room') {
    if (!Number.isInteger(hours) || hours < 1 || hours > studio.schedule.maxPhotoHours) return false;
    const start = Number(time.slice(0, 2));
    if (start + hours > studio.schedule.closingHour) return false;
    return Array.from({ length: hours }, (_, i) => slotCapacity(serviceId, date, `${start + i}:00`)).every(n => n >= people);
  }
  return slotCapacity(serviceId, date, time) >= people;
}
export function totalPrice(booking: Booking): number {
  const service = services.find(s => s.id === booking.serviceId)!;
  return service.price * (service.id === 'light-room' ? booking.hours : service.id === 'paint-evening' ? booking.people : 1);
}
export const money = (value: number) => new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
// Explicit names keep Kazakh fully localized even in browsers with incomplete kk-KZ ICU data.
export function formatDate(date: string, lang: Language, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
  const d = new Date(`${date}T12:00:00Z`);
  const months = lang === 'kz'
    ? ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
    : ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const shortMonths = lang === 'kz'
    ? ['қаң', 'ақп', 'нау', 'сәу', 'мам', 'мау', 'шіл', 'там', 'қыр', 'қаз', 'қар', 'жел']
    : ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const weekdays = lang === 'kz' ? ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб'] : ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  if (options.weekday) return weekdays[d.getUTCDay()];
  const month = options.month === 'short' ? shortMonths[d.getUTCMonth()] : months[d.getUTCMonth()];
  return [options.year && lang === 'kz' ? `${d.getUTCFullYear()} жылғы` : '', options.day ? d.getUTCDate() : '', options.month ? month : '', options.year && lang === 'ru' ? d.getUTCFullYear() : ''].filter(Boolean).join(' ');
}
export function requestMessage(booking: Booking, lang: Language): string {
  const service = services.find(s => s.id === booking.serviceId)!;
  const count = lang === 'kz' ? `${booking.people} адам${service.id === 'light-room' ? ` / ${booking.hours} сағат` : ''}` : `${booking.people} чел.${service.id === 'light-room' ? ` / ${booking.hours} ч.` : ''}`;
  return lang === 'kz'
    ? `Сәлеметсіз бе! Жазылғым келеді: ${service.name}, ${formatDate(booking.date, lang)}, ${booking.time}, ${count}. Құны: ${money(totalPrice(booking))}. Осы уақыттың қолжетімділігін растауыңызды сұраймын.`
    : `Здравствуйте! Хочу записаться: ${service.name}, ${formatDate(booking.date, lang)}, ${booking.time}, ${count}. Стоимость: ${money(totalPrice(booking))}. Подтвердите, пожалуйста, доступность.`;
}
export function whatsappLink(message: string): string | null {
  const number = studio.whatsappNumber.replace(/[\s()+-]/g, '');
  return /^[1-9]\d{9,14}$/.test(number) ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}
