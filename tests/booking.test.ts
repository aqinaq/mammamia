import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, formatDate, isAvailable, requestMessage, todayInAlmaty, totalPrice, validDate, whatsappLink, type Booking } from '../src/booking.ts';
import { studio } from '../src/config.ts';

const now = new Date('2026-10-01T05:30:00Z'); // 10:30 in Almaty
const base: Booking = { serviceId: 'light-room', date: '2026-10-02', time: '10:00', people: 1, hours: 1 };
test('Almaty date rolls over at UTC 19:00', () => {
  assert.equal(todayInAlmaty(new Date('2026-10-01T19:01:00Z')), '2026-10-02');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});
test('Kazakh and Russian date names do not depend on browser locale support', () => {
  assert.equal(formatDate('2026-10-02', 'kz'), '2026 жылғы 2 қазан');
  assert.equal(formatDate('2026-10-02', 'kz', { weekday: 'short' }), 'Жм');
  assert.equal(formatDate('2026-10-02', 'ru'), '2 октября 2026');
});
test('date bounds reject past, invalid and beyond-horizon dates', () => {
  assert.equal(validDate('2026-09-30', now), false);
  assert.equal(validDate('2026-10-01', now), true);
  assert.equal(validDate('2026-10-30', now), true);
  assert.equal(validDate('2026-10-31', now), false);
  assert.equal(validDate('2026-02-31', now), false);
  assert.equal(validDate('', now), false);
});
test('photo pricing depends on hours, painting on participants, clay is fixed', () => {
  assert.equal(totalPrice({ ...base, hours: 3, people: 6 }), 36000);
  assert.equal(totalPrice({ ...base, serviceId: 'paint-evening', people: 3 }), 30000);
  assert.equal(totalPrice({ ...base, serviceId: 'clay-date', people: 2 }), 24000);
});
test('photo booking checks every hour, closing time and participant limits', () => {
  assert.equal(isAvailable(base, now), true);
  assert.equal(isAvailable({ ...base, hours: 3 }, now), true);
  assert.equal(isAvailable({ ...base, hours: 4 }, now), false); // includes occupied 13:00
  assert.equal(isAvailable({ ...base, time: '19:00', hours: 2 }, now), false);
  assert.equal(isAvailable({ ...base, time: '16:00' }, now), false);
  assert.equal(isAvailable({ ...base, people: 7 }, now), false);
  assert.equal(isAvailable({ ...base, people: 0 }, now), false);
  assert.equal(isAvailable({ ...base, hours: 1.5 }, now), false);
});
test('past times on current day and stale requests are rejected', () => {
  assert.equal(isAvailable({ ...base, date: '2026-10-01', time: '10:00' }, now), false);
  assert.equal(isAvailable({ ...base, date: '2026-10-01', time: '11:00' }, now), true);
  assert.equal(isAvailable({ ...base, date: '2026-10-01', time: '10:00' }, new Date('2026-10-01T05:00:00Z')), false);
});
test('workshops enforce pairs, capacity and defined time slots', () => {
  assert.equal(isAvailable({ ...base, serviceId: 'clay-date', time: '11:00', people: 2 }, now), true);
  assert.equal(isAvailable({ ...base, serviceId: 'clay-date', time: '11:00', people: 1 }, now), false);
  assert.equal(isAvailable({ ...base, serviceId: 'clay-date', time: '12:00', people: 2 }, now), false);
  assert.equal(isAvailable({ ...base, serviceId: 'paint-evening', time: '12:00', people: 6 }, now), true);
  assert.equal(isAvailable({ ...base, serviceId: 'paint-evening', time: '12:00', people: 7 }, now), false);
});
test('both request languages include all booking details', () => {
  const kz = requestMessage({ ...base, hours: 2, people: 3 }, 'kz');
  const ru = requestMessage(base, 'ru');
  assert.ok(kz.startsWith('Сәлеметсіз бе!')); assert.ok(kz.includes('3 адам / 2 сағат')); assert.ok(kz.includes('24 000 ₸'));
  assert.ok(ru.startsWith('Здравствуйте!')); assert.ok(ru.includes('LIGHT ROOM')); assert.ok(ru.includes('10:00'));
});
test('WhatsApp is disabled until valid config, then safely encodes the draft', () => {
  assert.equal(whatsappLink('test'), null);
  studio.whatsappNumber = 'invalid'; assert.equal(whatsappLink('test'), null);
  studio.whatsappNumber = '+1 (202) 555-0100';
  assert.equal(whatsappLink('a & b'), 'https://wa.me/12025550100?text=a%20%26%20b');
  studio.whatsappNumber = '';
});
