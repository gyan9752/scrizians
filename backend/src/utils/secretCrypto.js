/*
 * Encrypts small secrets (e.g. the TOTP secret) before they are
 * stored in MongoDB, using AES-256-GCM.
 *
 * Key source: TWO_FACTOR_ENCRYPTION_KEY (recommended) or, as a
 * fallback, JWT_SECRET. Do not change the key after users have
 * enrolled, otherwise they must re-enroll (see `npm run reset-2fa`).
 */
const crypto = require('crypto');

const getKey = () => {
  const source =
    process.env.TWO_FACTOR_ENCRYPTION_KEY || process.env.JWT_SECRET;

  if (!source) {
    throw new Error(
      'TWO_FACTOR_ENCRYPTION_KEY (or JWT_SECRET) is not configured.'
    );
  }

  return crypto.createHash('sha256').update(String(source)).digest();
};

const encryptSecret = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plain), 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return ['v1', iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':');
};

const decryptSecret = (stored) => {
  const [version, iv, tag, data] = String(stored).split(':');

  if (version !== 'v1' || !iv || !tag || !data) {
    throw new Error('Unsupported secret format.');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getKey(),
    Buffer.from(iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(data, 'base64')),
    decipher.final()
  ]).toString('utf8');
};

module.exports = { encryptSecret, decryptSecret };
