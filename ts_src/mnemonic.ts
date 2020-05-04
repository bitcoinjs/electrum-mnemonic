import * as randombytes from 'randombytes';
import * as createHmac from 'create-hmac';
import * as pbkdf2 from 'pbkdf2';
import * as ENGLISH from './wordlists/english.json';
import { bitlen, encode, maskBytes, normalizeText } from './encoding';

const INVALID_MNEMONIC_MESSAGE = 'Invalid Seed Version for mnemonic';

export const PREFIXES = {
  segwit: '100',
  standard: '01',
  '2fa': '101',
  '2fa-segwit': '102',
};

interface GenerateOpts {
  prefix?: string;
  strength?: number;
  rng?: (size: number) => Buffer;
  wordlist?: string[];
}

const DEFAULTGENOPTS = {
  prefix: PREFIXES.segwit,
  strength: 132, // 12 words x 2048 wordlist === 132 bits
  rng: randombytes,
  wordlist: ENGLISH,
};

export function generateMnemonic(opts?: GenerateOpts): string {
  const { prefix, strength, rng, wordlist } = Object.assign(
    {},
    DEFAULTGENOPTS,
    opts,
  );
  validatePrefixFormat(prefix);
  if (prefix.length * 4 > strength / 2)
    throw new Error(
      `strength must be at least 2x of prefix bit count to ` +
        `lower endless loop probability.\nprefix: ${prefix} ` +
        `(${prefix.length * 4} bits)\nstrength: ${strength}`,
    );
  const wordBitLen = bitlen(wordlist.length);
  const wordCount = Math.ceil(strength / wordBitLen);
  const byteCount = Math.ceil((wordCount * wordBitLen) / 8);
  let result = '';
  do {
    const bytes = rng(byteCount);
    maskBytes(bytes, strength);
    result = encode(bytes, wordlist);
  } while (!prefixMatches(result, [prefix])[0]);
  return result;
}

interface SeedOpts {
  passphrase?: string;
  prefix?: string;
  skipCheck?: boolean;
}

const DEFAULTOPTS = {
  passphrase: '',
  prefix: PREFIXES.segwit,
  skipCheck: false,
};

export function mnemonicToSeedSync(mnemonic: string, opts?: SeedOpts): Buffer {
  const { passphrase, prefix, skipCheck } = Object.assign(
    {},
    DEFAULTOPTS,
    opts,
  );
  validatePrefixFormat(prefix);
  if (!skipCheck) checkPrefix(mnemonic, [prefix]);
  return pbkdf2.pbkdf2Sync(
    normalizeText(mnemonic),
    'electrum' + normalizeText(passphrase),
    2048,
    64,
    'sha512',
  );
}

export async function mnemonicToSeed(
  mnemonic: string,
  opts?: SeedOpts,
): Promise<Buffer> {
  const { passphrase, prefix, skipCheck } = Object.assign(
    {},
    DEFAULTOPTS,
    opts,
  );
  validatePrefixFormat(prefix);
  if (!skipCheck) checkPrefix(mnemonic, [prefix]);
  return new Promise((resolve, reject): void => {
    pbkdf2.pbkdf2(
      normalizeText(mnemonic),
      'electrum' + normalizeText(passphrase),
      2048,
      64,
      'sha512',
      (err, res): void => {
        /* istanbul ignore next */
        if (err) return reject(err);
        else return resolve(res);
      },
    );
  });
}

export function validateMnemonic(mnemonic: string, prefix: string): boolean {
  validatePrefixFormat(prefix);
  try {
    checkPrefix(mnemonic, [prefix]);
    return true;
  } catch (e) {
    /* istanbul ignore else  */
    if (e.message === INVALID_MNEMONIC_MESSAGE) {
      return false;
    }
    /* istanbul ignore next */
    throw e;
  }
}

function matchesAnyPrefix(mnemonic: string, validPrefixes: string[]): boolean {
  return prefixMatches(mnemonic, validPrefixes).some((v): boolean => v);
}

function validatePrefixFormat(prefix: string): void {
  if (!prefix.match(/^[0-9a-f]+$/) || prefix.length > 128)
    throw new Error('prefix must be a hex string');
}

function checkPrefix(mn: string, validPrefixes: string[]): void {
  if (!matchesAnyPrefix(mn, validPrefixes))
    throw new Error(INVALID_MNEMONIC_MESSAGE);
}

function prefixMatches(phrase: string, prefixes: string[]): boolean[] {
  const hmac = createHmac('sha512', 'Seed version');
  hmac.update(normalizeText(phrase));
  const hx = hmac.digest('hex');
  return prefixes.map((prefix): boolean => hx.startsWith(prefix.toLowerCase()));
}
