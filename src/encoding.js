"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ENGLISH = require("./wordlists/english.json");
// Note: this cuts off extra bits from data
// A 2048 word list is 11 bits per word, so you should pass in a
// 17 byte Buffer, and the most significant 4 bits are thrown away
function encode(data, wordlist = ENGLISH) {
    const dataBitLen = data.length * 8;
    const wordBitLen = bitlen(wordlist.length);
    const wordCount = Math.floor(dataBitLen / wordBitLen);
    const binStr = bufferToBin(data).slice(-1 * wordCount * wordBitLen);
    const result = [];
    for (let i = 0; i < wordCount; i++) {
        const wordBin = binStr.slice(i * wordBitLen, (i + 1) * wordBitLen);
        result.push(wordlist[parseInt(wordBin, 2)]);
    }
    return result.join(' ');
}
exports.encode = encode;
function decode(mnemonic, wordlist = ENGLISH) {
    const wordBitLen = bitlen(wordlist.length);
    const binStr = mnemonic
        .split(' ')
        .map((word) => {
        const index = wordlist.indexOf(word);
        if (index === -1)
            throw new Error(`Unknown Word: ${word}\nWordlist: ${JSON.stringify(wordlist, null, 2).slice(0, 50) + '...'}`);
        return lpad(index.toString(2), '0', wordBitLen);
    })
        .join('');
    const byteLength = Math.ceil(binStr.length / 8);
    const result = Buffer.allocUnsafe(byteLength);
    const paddedStr = lpad(binStr, '0', byteLength * 8);
    for (let i = 0; i < result.length; i++) {
        result[i] = parseInt(paddedStr.slice(i * 8, (i + 1) * 8), 2);
    }
    return result;
}
exports.decode = decode;
function bitlen(num) {
    return Math.ceil(Math.log2(num));
}
exports.bitlen = bitlen;
function normalizeText(str) {
    // 1. normalize
    str = str.normalize('NFKD');
    // 2. lower
    str = str.toLowerCase();
    // 3. remove accents NOT DONE
    // TODO: find way to remove accents like python3 unicodedata.combining
    // without adding a large dependency
    // 4. normalize whitespaces DONE by NFKD normalize
    // 5. remove whitespaces between CJK
    return removeCJKSpaces(str);
}
exports.normalizeText = normalizeText;
function bufferToBin(data) {
    return Array.from(data)
        .map((n) => lpad(n.toString(2), '0', 8))
        .join('');
}
function lpad(str, pad, len) {
    return (pad.repeat(len) + str).slice(-1 * len);
}
const CJKINTERVALS = [
    [0x4e00, 0x9fff, 'CJK Unified Ideographs'],
    [0x3400, 0x4dbf, 'CJK Unified Ideographs Extension A'],
    [0x20000, 0x2a6df, 'CJK Unified Ideographs Extension B'],
    [0x2a700, 0x2b73f, 'CJK Unified Ideographs Extension C'],
    [0x2b740, 0x2b81f, 'CJK Unified Ideographs Extension D'],
    [0xf900, 0xfaff, 'CJK Compatibility Ideographs'],
    [0x2f800, 0x2fa1d, 'CJK Compatibility Ideographs Supplement'],
    [0x3190, 0x319f, 'Kanbun'],
    [0x2e80, 0x2eff, 'CJK Radicals Supplement'],
    [0x2f00, 0x2fdf, 'CJK Radicals'],
    [0x31c0, 0x31ef, 'CJK Strokes'],
    [0x2ff0, 0x2fff, 'Ideographic Description Characters'],
    [0xe0100, 0xe01ef, 'Variation Selectors Supplement'],
    [0x3100, 0x312f, 'Bopomofo'],
    [0x31a0, 0x31bf, 'Bopomofo Extended'],
    [0xff00, 0xffef, 'Halfwidth and Fullwidth Forms'],
    [0x3040, 0x309f, 'Hiragana'],
    [0x30a0, 0x30ff, 'Katakana'],
    [0x31f0, 0x31ff, 'Katakana Phonetic Extensions'],
    [0x1b000, 0x1b0ff, 'Kana Supplement'],
    [0xac00, 0xd7af, 'Hangul Syllables'],
    [0x1100, 0x11ff, 'Hangul Jamo'],
    [0xa960, 0xa97f, 'Hangul Jamo Extended A'],
    [0xd7b0, 0xd7ff, 'Hangul Jamo Extended B'],
    [0x3130, 0x318f, 'Hangul Compatibility Jamo'],
    [0xa4d0, 0xa4ff, 'Lisu'],
    [0x16f00, 0x16f9f, 'Miao'],
    [0xa000, 0xa48f, 'Yi Syllables'],
    [0xa490, 0xa4cf, 'Yi Radicals'],
];
function isCJK(c) {
    const n = c.charCodeAt(0);
    for (const [imin, imax] of CJKINTERVALS) {
        if (n >= imin && n <= imax)
            return true;
    }
    return false;
}
function removeCJKSpaces(str) {
    return str
        .split('')
        .filter((char, i, arr) => {
        const isSpace = char.trim() === '';
        const prevIsCJK = i !== 0 && isCJK(arr[i - 1]);
        const nextIsCJK = i !== arr.length - 1 && isCJK(arr[i + 1]);
        return !(isSpace && prevIsCJK && nextIsCJK);
    })
        .join('');
}
