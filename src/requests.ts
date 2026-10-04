import { studio, type Language } from './config.ts';
import { isAvailable, money, requestMessage, totalPrice, type Booking } from './booking.ts';

export interface DemoRequest extends Booking {
  id: string;
  phone: string;
  createdAt: string;
  total: number;
  status: 'received';
}
type RequestStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Formatting validation only; this does not verify ownership or reachability. */
export function normalizePhone(input: string): string | null {
  const compact = input.trim().replace(/[\s()-]/g, '');
  if (!/^\+?\d+$/.test(compact)) return null;
  let digits = compact.replace(/^\+/, '');
  if (!compact.startsWith('+')) {
    if (digits.length === 10) digits = '7' + digits;
    else if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1);
    else if (!(digits.length === 11 && digits.startsWith('7'))) return null;
  }
  if (digits.startsWith('7') && digits.length !== 11) return null;
  if (!/^[1-9]\d{9,14}$/.test(digits) || /^(\d)\1+$/.test(digits)) return null;
  return '+' + digits;
}

function validRecord(value: unknown, now: Date): value is DemoRequest {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<DemoRequest>;
  return typeof r.id === 'string' && /^MM-[A-F0-9]{16}$/.test(r.id)
    && r.status === 'received' && typeof r.phone === 'string' && normalizePhone(r.phone) === r.phone
    && typeof r.createdAt === 'string' && Number.isFinite(Date.parse(r.createdAt))
    && Date.parse(r.createdAt) <= now.getTime()
    && Date.parse(r.createdAt) > now.getTime() - studio.requests.retentionDays * 86400000
    && ['light-room', 'clay-date', 'paint-evening'].includes(r.serviceId ?? '')
    && typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date)
    && typeof r.time === 'string' && /^\d{2}:\d{2}$/.test(r.time)
    && Number.isInteger(r.people) && r.people! > 0 && r.people! <= 8
    && Number.isInteger(r.hours) && r.hours! > 0 && r.hours! <= studio.schedule.maxPhotoHours
    && typeof r.total === 'number' && Number.isFinite(r.total) && r.total >= 0;
}

export function readRequests(storage: RequestStorage, now = new Date()): DemoRequest[] {
  const raw = storage.getItem(studio.requests.storageKey);
  if (!raw) return [];
  try {
    const values: unknown = JSON.parse(raw);
    const kept = Array.isArray(values) ? values.filter(value => validRecord(value, now)).slice(-studio.requests.maxRecords) : [];
    if (!Array.isArray(values) || kept.length !== values.length) {
      if (kept.length) storage.setItem(studio.requests.storageKey, JSON.stringify(kept));
      else storage.removeItem(studio.requests.storageKey);
    }
    return kept;
  } catch { return []; }
}

export function latestRequest(): DemoRequest | null {
  try { return readRequests(window.localStorage).at(-1) ?? null; } catch { return null; }
}

export function saveRequest(booking: Booking, phoneInput: string, storage: RequestStorage, now = new Date()): DemoRequest {
  if (!isAvailable(booking, now)) throw new Error('unavailable');
  const phone = normalizePhone(phoneInput);
  if (!phone) throw new Error('invalid-phone');
  const records = readRequests(storage, now);
  const duplicate = records.find(r => r.phone === phone && r.serviceId === booking.serviceId && r.date === booking.date && r.time === booking.time && r.hours === booking.hours && r.people === booking.people && r.total === totalPrice(booking));
  if (duplicate) return duplicate;
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const id = 'MM-' + Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('').toUpperCase();
  const record: DemoRequest = { ...booking, phone, id, createdAt: now.toISOString(), total: totalPrice(booking), status: 'received' };
  const next = [...records, record].slice(-studio.requests.maxRecords);
  storage.setItem(studio.requests.storageKey, JSON.stringify(next));
  // A success screen is only shown after the durable write can be read back.
  if (!readRequests(storage, now).some(r => r.id === id)) throw new Error('storage-failed');
  return record;
}

export function removeRequest(id: string, storage: RequestStorage): void {
  const remaining = readRequests(storage).filter(r => r.id !== id);
  if (remaining.length) storage.setItem(studio.requests.storageKey, JSON.stringify(remaining));
  else storage.removeItem(studio.requests.storageKey);
}

export function receiptMessage(request: DemoRequest, lang: Language): string {
  const labels = lang === 'kz' ? ['Телефон', 'Демо-өтініш'] : ['Телефон', 'Демо-заявка'];
  return `${requestMessage(request, lang).replace(money(totalPrice(request)), money(request.total))}\n${labels[0]}: ${request.phone}.\n${labels[1]}: ${request.id}.`;
}
