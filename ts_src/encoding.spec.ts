import { encode, decode, normalizeText } from './encoding';

const data = Buffer.from('0fde0102030405060708090a0b0c0d0e0f', 'hex');
const phrase =
  'worth above amount gauge agree coral search bamboo pass maid crouch sea';
const pretext = ' aBc あ　いが㍍ ああ ああ  ';
const posttext = ' abc あいがメートルああああ  ';

describe(`encoding`, () => {
  it(`should encode given data`, () => {
    expect(encode(data)).toEqual(phrase);
  });
  it(`should decode given data`, () => {
    expect(decode(phrase)).toEqual(data);
  });
  it(`should fail to decode given data`, () => {
    expect(() => {
      decode(phrase.replace('worth', 'aaaaa'));
    }).toThrowError(/Unknown Word: aaaaa\n.*/);
  });
  it(`should encode normalize text`, () => {
    expect(normalizeText(pretext)).toEqual(posttext);
  });
});
