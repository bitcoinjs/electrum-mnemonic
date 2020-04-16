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

export function normalizeText(str: string): string {
  // 1. normalize
  str = str.normalize('NFKD');
  // 2. lower
  str = str.toLowerCase();
  // 3. remove accents DONE
  str = removeCombiningCharacters(str);
  // 4. normalize whitespaces DONE by NFKD normalize
  // 5. remove whitespaces between CJK
  return removeCJKSpaces(str);
}

function bufferToBin(data: Buffer): string {
  return Array.from(data)
    .map((n): string => lpad(n.toString(2), '0', 8))
    .join('');
}

function lpad(str: string, pad: string, len: number): string {
  return (pad.repeat(len) + str).slice(-1 * len);
}

function isCJK(c: string): boolean {
  const n = c.charCodeAt(0);
  for (const [imin, imax] of CJKINTERVALS) {
    if (n >= imin && n <= imax) return true;
  }
  return false;
}

function removeCJKSpaces(str: string): string {
  return str
    .split('')
    .filter((char, i, arr): boolean => {
      const isSpace = char.trim() === '';
      const prevIsCJK = i !== 0 && isCJK(arr[i - 1]);
      const nextIsCJK = i !== arr.length - 1 && isCJK(arr[i + 1]);
      return !(isSpace && prevIsCJK && nextIsCJK);
    })
    .join('');
}

function removeCombiningCharacters(str: string): string {
  return str
    .split('')
    .filter((char): boolean => {
      return COMBININGCODEPOINTS.indexOf(char.charCodeAt(0)) === -1;
    })
    .join('');
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

const COMBININGCODEPOINTS = (
  '300|301|302|303|304|305|306|307|308|309|30a|30b|30c|30d|30e|30f|310|311|312|' +
  '313|314|315|316|317|318|319|31a|31b|31c|31d|31e|31f|320|321|322|323|324|' +
  '325|326|327|328|329|32a|32b|32c|32d|32e|32f|330|331|332|333|334|335|336|' +
  '337|338|339|33a|33b|33c|33d|33e|33f|340|341|342|343|344|345|346|347|348|' +
  '349|34a|34b|34c|34d|34e|350|351|352|353|354|355|356|357|358|359|35a|35b|' +
  '35c|35d|35e|35f|360|361|362|363|364|365|366|367|368|369|36a|36b|36c|36d|' +
  '36e|36f|483|484|485|486|487|591|592|593|594|595|596|597|598|599|59a|59b|' +
  '59c|59d|59e|59f|5a0|5a1|5a2|5a3|5a4|5a5|5a6|5a7|5a8|5a9|5aa|5ab|5ac|5ad|' +
  '5ae|5af|5b0|5b1|5b2|5b3|5b4|5b5|5b6|5b7|5b8|5b9|5ba|5bb|5bc|5bd|5bf|5c1|' +
  '5c2|5c4|5c5|5c7|610|611|612|613|614|615|616|617|618|619|61a|64b|64c|64d|' +
  '64e|64f|650|651|652|653|654|655|656|657|658|659|65a|65b|65c|65d|65e|65f|' +
  '670|6d6|6d7|6d8|6d9|6da|6db|6dc|6df|6e0|6e1|6e2|6e3|6e4|6e7|6e8|6ea|6eb|' +
  '6ec|6ed|711|730|731|732|733|734|735|736|737|738|739|73a|73b|73c|73d|73e|' +
  '73f|740|741|742|743|744|745|746|747|748|749|74a|7eb|7ec|7ed|7ee|7ef|7f0|' +
  '7f1|7f2|7f3|816|817|818|819|81b|81c|81d|81e|81f|820|821|822|823|825|826|' +
  '827|829|82a|82b|82c|82d|859|85a|85b|8d4|8d5|8d6|8d7|8d8|8d9|8da|8db|8dc|' +
  '8dd|8de|8df|8e0|8e1|8e3|8e4|8e5|8e6|8e7|8e8|8e9|8ea|8eb|8ec|8ed|8ee|8ef|' +
  '8f0|8f1|8f2|8f3|8f4|8f5|8f6|8f7|8f8|8f9|8fa|8fb|8fc|8fd|8fe|8ff|93c|94d|' +
  '951|952|953|954|9bc|9cd|a3c|a4d|abc|acd|b3c|b4d|bcd|c4d|c55|c56|cbc|ccd|' +
  'd4d|dca|e38|e39|e3a|e48|e49|e4a|e4b|eb8|eb9|ec8|ec9|eca|ecb|f18|f19|f35|' +
  'f37|f39|f71|f72|f74|f7a|f7b|f7c|f7d|f80|f82|f83|f84|f86|f87|fc6|1037|1039|' +
  '103a|108d|135d|135e|135f|1714|1734|17d2|17dd|18a9|1939|193a|193b|1a17|1a18|' +
  '1a60|1a75|1a76|1a77|1a78|1a79|1a7a|1a7b|1a7c|1a7f|1ab0|1ab1|1ab2|1ab3|1ab4|' +
  '1ab5|1ab6|1ab7|1ab8|1ab9|1aba|1abb|1abc|1abd|1b34|1b44|1b6b|1b6c|1b6d|1b6e|' +
  '1b6f|1b70|1b71|1b72|1b73|1baa|1bab|1be6|1bf2|1bf3|1c37|1cd0|1cd1|1cd2|1cd4|' +
  '1cd5|1cd6|1cd7|1cd8|1cd9|1cda|1cdb|1cdc|1cdd|1cde|1cdf|1ce0|1ce2|1ce3|1ce4|' +
  '1ce5|1ce6|1ce7|1ce8|1ced|1cf4|1cf8|1cf9|1dc0|1dc1|1dc2|1dc3|1dc4|1dc5|1dc6|' +
  '1dc7|1dc8|1dc9|1dca|1dcb|1dcc|1dcd|1dce|1dcf|1dd0|1dd1|1dd2|1dd3|1dd4|1dd5|' +
  '1dd6|1dd7|1dd8|1dd9|1dda|1ddb|1ddc|1ddd|1dde|1ddf|1de0|1de1|1de2|1de3|1de4|' +
  '1de5|1de6|1de7|1de8|1de9|1dea|1deb|1dec|1ded|1dee|1def|1df0|1df1|1df2|1df3|' +
  '1df4|1df5|1dfb|1dfc|1dfd|1dfe|1dff|20d0|20d1|20d2|20d3|20d4|20d5|20d6|20d7|' +
  '20d8|20d9|20da|20db|20dc|20e1|20e5|20e6|20e7|20e8|20e9|20ea|20eb|20ec|20ed|' +
  '20ee|20ef|20f0|2cef|2cf0|2cf1|2d7f|2de0|2de1|2de2|2de3|2de4|2de5|2de6|2de7|' +
  '2de8|2de9|2dea|2deb|2dec|2ded|2dee|2def|2df0|2df1|2df2|2df3|2df4|2df5|2df6|' +
  '2df7|2df8|2df9|2dfa|2dfb|2dfc|2dfd|2dfe|2dff|302a|302b|302c|302d|302e|302f|' +
  '3099|309a|a66f|a674|a675|a676|a677|a678|a679|a67a|a67b|a67c|a67d|a69e|a69f|' +
  'a6f0|a6f1|a806|a8c4|a8e0|a8e1|a8e2|a8e3|a8e4|a8e5|a8e6|a8e7|a8e8|a8e9|a8ea|' +
  'a8eb|a8ec|a8ed|a8ee|a8ef|a8f0|a8f1|a92b|a92c|a92d|a953|a9b3|a9c0|aab0|aab2|' +
  'aab3|aab4|aab7|aab8|aabe|aabf|aac1|aaf6|abed|fb1e|fe20|fe21|fe22|fe23|fe24|' +
  'fe25|fe26|fe27|fe28|fe29|fe2a|fe2b|fe2c|fe2d|fe2e|fe2f|101fd|102e0|10376|' +
  '10377|10378|10379|1037a|10a0d|10a0f|10a38|10a39|10a3a|10a3f|10ae5|10ae6|' +
  '11046|1107f|110b9|110ba|11100|11101|11102|11133|11134|11173|111c0|111ca|' +
  '11235|11236|112e9|112ea|1133c|1134d|11366|11367|11368|11369|1136a|1136b|' +
  '1136c|11370|11371|11372|11373|11374|11442|11446|114c2|114c3|115bf|115c0|' +
  '1163f|116b6|116b7|1172b|11c3f|16af0|16af1|16af2|16af3|16af4|16b30|16b31|' +
  '16b32|16b33|16b34|16b35|16b36|1bc9e|1d165|1d166|1d167|1d168|1d169|1d16d|' +
  '1d16e|1d16f|1d170|1d171|1d172|1d17b|1d17c|1d17d|1d17e|1d17f|1d180|1d181|' +
  '1d182|1d185|1d186|1d187|1d188|1d189|1d18a|1d18b|1d1aa|1d1ab|1d1ac|1d1ad|' +
  '1d242|1d243|1d244|1e000|1e001|1e002|1e003|1e004|1e005|1e006|1e008|1e009|' +
  '1e00a|1e00b|1e00c|1e00d|1e00e|1e00f|1e010|1e011|1e012|1e013|1e014|1e015|' +
  '1e016|1e017|1e018|1e01b|1e01c|1e01d|1e01e|1e01f|1e020|1e021|1e023|1e024|' +
  '1e026|1e027|1e028|1e029|1e02a|1e8d0|1e8d1|1e8d2|1e8d3|1e8d4|1e8d5|1e8d6|' +
  '1e944|1e945|1e946|1e947|1e948|1e949|1e94a'
)
  .split('|')
  .map((hx): number => parseInt(hx, 16));
