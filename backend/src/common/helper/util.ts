import { BadRequestException } from '@nestjs/common';
import { randomBytes, randomInt } from 'node:crypto';

/** Round to 2 decimals (poisha) to avoid float drift in money maths. */
export const money = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;

/** Accepts 01XXXXXXXXX, 8801XXXXXXXXX or +8801XXXXXXXXX; returns +8801XXXXXXXXX. */
export function normalizeBdPhone(input: string): string {
  const digits = input.replace(/[^\d]/g, '');
  let local: string | undefined;
  if (/^01[3-9]\d{8}$/.test(digits)) local = digits;
  else if (/^8801[3-9]\d{8}$/.test(digits)) local = digits.slice(2);
  if (!local)
    throw new BadRequestException(
      'Enter a valid Bangladeshi mobile number, e.g. 017XXXXXXXX',
    );
  return `+88${local}`;
}

export function maskPhone(phone: string): string {
  return phone.length > 6
    ? `${phone.slice(0, 6)}*****${phone.slice(-2)}`
    : phone;
}

/** Latin slug; falls back to a random suffix for Bangla-only names. */
export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `item-${randomBytes(3).toString('hex')}`;
}

export const randomDigits = (length: number) =>
  Array.from({ length }, () => randomInt(0, 10)).join('');

const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // no 0/O/1/I confusion

export function randomCode(length: number): string {
  return Array.from(
    { length },
    () => CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)],
  ).join('');
}

/** CM-261022-4F7K2 */
export function makeOrderNo(date = new Date()): string {
  const y = String(date.getFullYear()).slice(2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `CM-${y}${m}${d}-${randomCode(5)}`;
}

export const subOrderSuffix = (index: number) =>
  String.fromCharCode(65 + (index % 26));

export const addHours = (date: Date, hours: number) =>
  new Date(date.getTime() + hours * 3_600_000);
export const addMinutes = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60_000);
