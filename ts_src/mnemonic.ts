import * as randombytes from 'randombytes';
import * as createHmac from 'create-hmac';
import * as pbkdf2 from 'pbkdf2';
import * as ENGLISH from './wordlists/english.json';
import { bitlen, encode, normalizeText } from './encoding';

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
  const wordBitLen = bitlen(wordlist.length);
  const wordCount = Math.ceil(strength / wordBitLen);
  const byteCount = Math.ceil((wordCount * wordBitLen) / 8);
  let result = '';
  do {
    result = encode(rng(byteCount), wordlist);
  } while (!prefixMatches(result, prefix));
  return result;
}

interface SeedOpts {
  passphrase?: string;
  validPrefixes?: string[];
  skipCheck?: boolean;
}

const DEFAULTOPTS = {
  passphrase: '',
  validPrefixes: Object.values(PREFIXES),
  skipCheck: false,
};

export function mnemonicToSeedSync(mnemonic: string, opts?: SeedOpts): Buffer {
  const { passphrase, validPrefixes, skipCheck } = Object.assign(
    {},
    DEFAULTOPTS,
    opts,
  );
  if (!skipCheck) checkPrefix(mnemonic, validPrefixes);
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
  const { passphrase, validPrefixes, skipCheck } = Object.assign(
    {},
    DEFAULTOPTS,
    opts,
  );
  if (!skipCheck) checkPrefix(mnemonic, validPrefixes);
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

function matchesAnyPrefix(mnemonic: string, validPrefixes: string[]): boolean {
  return validPrefixes.some((prefix): boolean =>
    prefixMatches(mnemonic, prefix),
  );
}

function checkPrefix(mn: string, validPrefixes: string[]): void {
  if (!matchesAnyPrefix(mn, validPrefixes))
    throw new Error('Invalid Seed Version for mnemonic');
}

function prefixMatches(phrase: string, prefix: string): boolean {
  const hmac = createHmac('sha512', 'Seed version');
  hmac.update(normalizeText(phrase));
  return hmac.digest('hex').startsWith(prefix);
}
