import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, readRequests, receiptMessage, removeRequest, saveRequest } from '../src/requests.ts';
import { studio } from '../src/config.ts';
import type { Booking } from '../src/booking.ts';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}
const now = new Date('2026-10-01T05:30:00Z');
const booking: Booking = { serviceId: 'light-room', date: '2026-10-02', time: '10:00', people: 2, hours: 2 };
const phone = '+1 (202) 555-0100'; // Reserved fictional example, never transmitted.

test('phone formatting accepts local and international formats, rejects malformed input', () => {
  assert.equal(normalizePhone(phone), '+12025550100');
  assert.equal(normalizePhone('8 (701) 234-56-78'), '+77012345678');
  assert.equal(normalizePhone('7012345678'), '+77012345678');
  for (const input of ['', '123', '+77777777777', 'abc+12025550100', '++12025550100', '+12025550100 ext2', '+012025550100', '+1234567890123456']) assert.equal(normalizePhone(input), null);
});
test('request is persisted with receipt, contact, pending-booking status and price snapshot', () => {
  const storage = memoryStorage();
  const saved = saveRequest(booking, phone, storage, now);
  assert.match(saved.id, /^MM-[A-F0-9]{16}$/);
  assert.equal(saved.status, 'received');
  assert.equal(saved.total, 24000);
  assert.equal(saved.phone, '+12025550100');
  assert.deepEqual(readRequests(storage, now), [saved]);
  assert.ok(receiptMessage(saved, 'kz').includes('Телефон: +12025550100'));
  assert.ok(receiptMessage(saved, 'ru').includes(saved.id));
});
test('repeat submission is idempotent; different selection creates a new receipt', () => {
  const storage = memoryStorage();
  const first = saveRequest(booking, phone, storage, now);
  const duplicate = saveRequest(booking, '+12025550100', storage, now);
  assert.equal(first.id, duplicate.id);
  assert.equal(readRequests(storage, now).length, 1);
  assert.notEqual(saveRequest({ ...booking, hours: 1 }, phone, storage, now).id, first.id);
  assert.equal(readRequests(storage, now).length, 2);
});
test('no accepted receipt is returned when storage fails or input is invalid', () => {
  const storage = memoryStorage();
  assert.throws(() => saveRequest(booking, 'invalid', storage, now), /invalid-phone/);
  assert.throws(() => saveRequest({ ...booking, time: '13:00' }, phone, storage, now), /unavailable/);
  const blocked = { ...storage, setItem: () => { throw new Error('storage-disabled'); } };
  assert.throws(() => saveRequest(booking, phone, blocked, now), /storage-disabled/);
  const silent = { ...storage, setItem: () => {} };
  assert.throws(() => saveRequest(booking, phone, silent, now), /storage-failed/);
  assert.equal(storage.getItem(studio.requests.storageKey), null);
});
test('expired requests are removed on next read and corrupt entries are ignored', () => {
  const storage = memoryStorage();
  saveRequest(booking, phone, storage, now);
  assert.deepEqual(readRequests(storage, new Date('2026-11-02T05:30:00Z')), []);
  assert.equal(storage.getItem(studio.requests.storageKey), null);
  storage.setItem(studio.requests.storageKey, JSON.stringify([{ id: 'bad', phone: 'test' }]));
  assert.deepEqual(readRequests(storage, now), []);
  storage.setItem(studio.requests.storageKey, '{broken');
  assert.deepEqual(readRequests(storage, now), []);
});
test('user can remove the saved demo receipt and its phone number', () => {
  const storage = memoryStorage();
  const saved = saveRequest(booking, phone, storage, now);
  removeRequest(saved.id, storage);
  assert.equal(storage.getItem(studio.requests.storageKey), null);
});
