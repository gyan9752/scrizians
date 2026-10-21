/*
 * TOTP (RFC 6238) helpers - compatible with Google Authenticator,
 * Microsoft Authenticator, Authy, 1Password, etc.
 * No external dependency: only Node's built-in crypto.
 */
const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;

const base32Encode = (buffer) => {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
};

const base32Decode = (input) => {
  const clean = String(input).replace(/=+$/, '').replace(/\s/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);

    if (index === -1) {
      throw new Error('Invalid base32 secret.');
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
};

const generateSecret = () => base32Encode(crypto.randomBytes(20));

const hotp = (secretBuffer, counter) => {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto
    .createHmac('sha1', secretBuffer)
    .update(counterBuffer)
    .digest();

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;

  return String(binary % 10 ** DIGITS).padStart(DIGITS, '0');
};

const currentStep = (now = Date.now()) =>
  Math.floor(now / 1000 / STEP_SECONDS);

const generateToken = (secret, now = Date.now()) =>
  hotp(base32Decode(secret), currentStep(now));

const safeEqual = (a, b) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

/*
 * Returns the matched time-step (a number) when the code is valid,
 * otherwise null.
 *
 * - window: how many 30s steps of clock drift are tolerated each way.
 * - lastUsedStep: steps <= this value are rejected, so a code that was
 *   already used (or shoulder-surfed) cannot be replayed.
 */
const verifyToken = (
  secret,
  code,
  { window = 1, lastUsedStep = 0, now = Date.now() } = {}
) => {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return null;
  }

  const secretBuffer = base32Decode(secret);
  const nowStep = currentStep(now);

  for (let offset = -window; offset <= window; offset += 1) {
    const step = nowStep + offset;

    if (step <= (lastUsedStep || 0)) {
      continue;
    }

    if (safeEqual(hotp(secretBuffer, step), code)) {
      return step;
    }
  }

  return null;
};

const buildOtpAuthUrl = ({ secret, account, issuer }) => {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(STEP_SECONDS)
  });

  return `otpauth://totp/${label}?${params.toString()}`;
};

module.exports = {
  generateSecret,
  generateToken,
  verifyToken,
  buildOtpAuthUrl,
  base32Encode,
  base32Decode
};
