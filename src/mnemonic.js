"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const randombytes = require("randombytes");
const createHmac = require("create-hmac");
const pbkdf2 = require("pbkdf2");
const ENGLISH = require("./wordlists/english.json");
const encoding_1 = require("./encoding");
exports.PREFIXES = {
    segwit: '100',
    standard: '01',
    '2fa': '101',
    '2fa-segwit': '102',
};
function generateMnemonic(prefix = exports.PREFIXES.segwit, strength = 132, // 12 words x 2048 wordlist === 132 bits
rng = randombytes, wordlist = ENGLISH) {
    const wordBitLen = encoding_1.bitlen(wordlist.length);
    const wordCount = Math.ceil(strength / wordBitLen);
    const byteCount = Math.ceil((wordCount * wordBitLen) / 8);
    let result = '';
    do {
        result = encoding_1.encode(rng(byteCount), wordlist);
    } while (!prefixMatches(result, prefix));
    return result;
}
exports.generateMnemonic = generateMnemonic;
const DEFAULTOPTS = {
    passphrase: '',
    validPrefixes: Object.values(exports.PREFIXES),
    skipCheck: false,
};
function mnemonicToSeedSync(mnemonic, opts) {
    const { passphrase, validPrefixes, skipCheck } = Object.assign({}, DEFAULTOPTS, opts);
    if (!skipCheck)
        checkPrefix(mnemonic, validPrefixes);
    return pbkdf2.pbkdf2Sync(mnemonic.normalize('NFKD'), 'electrum' + passphrase.normalize('NFKD'), 2048, 64, 'sha512');
}
exports.mnemonicToSeedSync = mnemonicToSeedSync;
async function mnemonicToSeed(mnemonic, opts) {
    const { passphrase, validPrefixes, skipCheck } = Object.assign({}, DEFAULTOPTS, opts);
    if (!skipCheck)
        checkPrefix(mnemonic, validPrefixes);
    return new Promise((resolve, reject) => {
        pbkdf2.pbkdf2(mnemonic.normalize('NFKD'), 'electrum' + passphrase.normalize('NFKD'), 2048, 64, 'sha512', (err, res) => {
            /* istanbul ignore next */
            if (err)
                return reject(err);
            else
                return resolve(res);
        });
    });
}
exports.mnemonicToSeed = mnemonicToSeed;
function matchesAnyPrefix(mnemonic, validPrefixes) {
    return validPrefixes.some((prefix) => prefixMatches(mnemonic, prefix));
}
function checkPrefix(mn, validPrefixes) {
    if (!matchesAnyPrefix(mn, validPrefixes))
        throw new Error('Invalid Seed Version for mnemonic');
}
function prefixMatches(phrase, prefix) {
    const hmac = createHmac('sha512', 'Seed version');
    hmac.update(phrase.normalize('NFKD'));
    return hmac.digest('hex').startsWith(prefix);
}
