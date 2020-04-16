import * as ENGLISH from './wordlists/english.json';

// Note: this cuts off extra bits from data
// A 2048 word list is 11 bits per word, so you should pass in a
// 17 byte Buffer, and the most significant 4 bits are thrown away
export function encode(data: Buffer, wordlist: string[] = ENGLISH): string {
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

export function decode(mnemonic: string, wordlist: string[] = ENGLISH): Buffer {
  const wordBitLen = bitlen(wordlist.length);
  const binStr = mnemonic
    .split(' ')
    .map((word): string => {
      const index = wordlist.indexOf(word);
      if (index === -1)
        throw new Error(
          `Unknown Word: ${word}\nWordlist: ${
            JSON.stringify(wordlist, null, 2).slice(0, 50) + '...'
          }`,
        );
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

export function bitlen(num: number): number {
  return Math.ceil(Math.log2(num));
}

function bufferToBin(data: Buffer): string {
  return Array.from(data)
    .map((n): string => lpad(n.toString(2), '0', 8))
    .join('');
}

function lpad(str: string, pad: string, len: number): string {
  return (pad.repeat(len) + str).slice(-1 * len);
}
