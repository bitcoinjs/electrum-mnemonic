'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const randombytes = require('randombytes');
const createHmac = require('create-hmac');
const pbkdf2 = require('pbkdf2');
const ENGLISH = require('./wordlists/english.json');
const encoding_1 = require('./encoding');
exports.PREFIXES = {
  segwit: '100',
  standard: '01',
  '2fa': '101',
  '2fa-segwit': '102',
};
const DEFAULTGENOPTS = {
  prefix: exports.PREFIXES.segwit,
  strength: 132,
  rng: randombytes,
  wordlist: ENGLISH,
};
function generateMnemonic(opts) {
  const { prefix, strength, rng, wordlist } = Object.assign(
    {},
    DEFAULTGENOPTS,
    opts,
  );
  if (!prefix.match(/[0-9a-f]+/))
    throw new Error('prefix must be a hex string');
  if (prefix.length * 4 > strength / 2)
    throw new Error(
      `strength must be at least 2x of prefix bit count to ` +
        `lower endless loop probability.\nprefix: ${prefix} ` +
        `(${prefix.length * 4} bits)\nstrength: ${strength}`,
    );
  const wordBitLen = encoding_1.bitlen(wordlist.length);
  const wordCount = Math.ceil(strength / wordBitLen);
  const byteCount = Math.ceil((wordCount * wordBitLen) / 8);
  let result = '';
  do {
    const bytes = rng(byteCount);
    encoding_1.maskBytes(bytes, strength);
    result = encoding_1.encode(bytes, wordlist);
  } while (!prefixMatches(result, [prefix])[0]);
  return result;
}
exports.generateMnemonic = generateMnemonic;
const DEFAULTOPTS = {
  passphrase: '',
  validPrefixes: Object.values(exports.PREFIXES),
  skipCheck: false,
};
function mnemonicToSeedSync(mnemonic, opts) {
  const { passphrase, validPrefixes, skipCheck } = Object.assign(
    {},
    DEFAULTOPTS,
    opts,
  );
  if (!skipCheck) checkPrefix(mnemonic, validPrefixes);
  return pbkdf2.pbkdf2Sync(
    encoding_1.normalizeText(mnemonic),
    'electrum' + encoding_1.normalizeText(passphrase),
    2048,
    64,
    'sha512',
  );
}
exports.mnemonicToSeedSync = mnemonicToSeedSync;
async function mnemonicToSeed(mnemonic, opts) {
  const { passphrase, validPrefixes, skipCheck } = Object.assign(
    {},
    DEFAULTOPTS,
    opts,
  );
  if (!skipCheck) checkPrefix(mnemonic, validPrefixes);
  return new Promise((resolve, reject) => {
    pbkdf2.pbkdf2(
      encoding_1.normalizeText(mnemonic),
      'electrum' + encoding_1.normalizeText(passphrase),
      2048,
      64,
      'sha512',
      (err, res) => {
        /* istanbul ignore next */
        if (err) return reject(err);
        else return resolve(res);
      },
    );
  });
}
exports.mnemonicToSeed = mnemonicToSeed;
function matchesAnyPrefix(mnemonic, validPrefixes) {
  return prefixMatches(mnemonic, validPrefixes).some((v) => v);
}
function checkPrefix(mn, validPrefixes) {
  if (!matchesAnyPrefix(mn, validPrefixes))
    throw new Error('Invalid Seed Version for mnemonic');
}
function prefixMatches(phrase, prefixes) {
  const hmac = createHmac('sha512', 'Seed version');
  hmac.update(encoding_1.normalizeText(phrase));
  const hx = hmac.digest('hex');
  return prefixes.map((prefix) => hx.startsWith(prefix.toLowerCase()));
}
