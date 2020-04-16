import { encode, decode } from './encoding';

const data = Buffer.from('0fde0102030405060708090a0b0c0d0e0f', 'hex');
const phrase =
  'worth above amount gauge agree coral search bamboo pass maid crouch sea';

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
});
