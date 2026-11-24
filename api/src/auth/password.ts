import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (password: string | Buffer, salt: string | Buffer, keylen: number, options: ScryptOptions) => Promise<Buffer>;
const VERSION = 'v1';
const ALGORITHM = 'scrypt';
const DEFAULT_N = 2 ** 15;
const DEFAULT_R = 8;
const DEFAULT_P = 1;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const MAXMEM = 64 * 1024 * 1024;

export class PasswordHashError extends Error {}

export interface ScryptParameters { n: number; r: number; p: number; }

/**
 * Format: scrypt$v1$N=32768,r=8,p=1$<base64url salt>$<base64url derived key>
 * The version and parameters make future cost upgrades explicit and reversible.
 */
export async function hashPassword(password: string, parameters: ScryptParameters = { n: DEFAULT_N, r: DEFAULT_R, p: DEFAULT_P }): Promise<string> {
  validatePassword(password);
  validateParameters(parameters);
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scrypt(password, salt, KEY_LENGTH, { N: parameters.n, r: parameters.r, p: parameters.p, maxmem: MAXMEM }) as Buffer;
  return `${ALGORITHM}$${VERSION}$N=${parameters.n},r=${parameters.r},p=${parameters.p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  try {
    validatePassword(password);
    const parsed = parseHash(encodedHash);
    const derived = await scrypt(password, parsed.salt, parsed.key.length, { N: parsed.parameters.n, r: parsed.parameters.r, p: parsed.parameters.p, maxmem: MAXMEM }) as Buffer;
    return derived.length === parsed.key.length && timingSafeEqual(derived, parsed.key);
  } catch (error) {
    if (error instanceof PasswordHashError || error instanceof TypeError || error instanceof RangeError) return false;
    throw error;
  }
}

function validatePassword(password: string): void {
  if (typeof password !== 'string' || password.length === 0 || password.length > 1024) throw new PasswordHashError('Password must contain between 1 and 1024 characters.');
}

function validateParameters(parameters: ScryptParameters): void {
  if (!Number.isInteger(parameters.n) || parameters.n < 2 ** 14 || parameters.n > 2 ** 18 || (parameters.n & (parameters.n - 1)) !== 0 ||
      !Number.isInteger(parameters.r) || parameters.r < 1 || parameters.r > 32 ||
      !Number.isInteger(parameters.p) || parameters.p < 1 || parameters.p > 8 || parameters.n * parameters.r * 128 > MAXMEM) {
    throw new PasswordHashError('Unsupported scrypt parameters.');
  }
}

function decode(value: string, label: string, minBytes: number, maxBytes: number): Buffer {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) throw new PasswordHashError(`Invalid password hash ${label}.`);
  const decoded = Buffer.from(value, 'base64url');
  if (decoded.length < minBytes || decoded.length > maxBytes) throw new PasswordHashError(`Invalid password hash ${label}.`);
  return decoded;
}

function parseHash(encodedHash: string): { parameters: ScryptParameters; salt: Buffer; key: Buffer } {
  if (typeof encodedHash !== 'string' || encodedHash.length > 512) throw new PasswordHashError('Invalid password hash.');
  const parts = encodedHash.split('$');
  if (parts.length !== 5 || parts[0] !== ALGORITHM || parts[1] !== VERSION) throw new PasswordHashError('Unsupported password hash format.');
  const parameters = /^N=(\d+),r=(\d+),p=(\d+)$/.exec(parts[2] ?? '');
  if (!parameters) throw new PasswordHashError('Invalid password hash parameters.');
  const parsed = { n: Number(parameters[1]), r: Number(parameters[2]), p: Number(parameters[3]) };
  validateParameters(parsed);
  return { parameters: parsed, salt: decode(parts[3] ?? '', 'salt', 16, 64), key: decode(parts[4] ?? '', 'derived key', KEY_LENGTH, KEY_LENGTH) };
}
