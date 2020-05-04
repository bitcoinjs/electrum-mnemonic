import {
  generateMnemonic,
  mnemonicToSeed,
  mnemonicToSeedSync,
  validateMnemonic,
  PREFIXES,
} from './mnemonic';
import * as bitcoin from 'bitcoinjs-lib';

describe(`mnemonic`, () => {
  let freshMnemonic1: string;
  let freshMnemonic2: string;
  beforeAll(() => {
    freshMnemonic1 = generateMnemonic();
    freshMnemonic2 = generateMnemonic({ prefix: PREFIXES.standard });
  });
  it(`should generate random mnemonics`, () => {
    expect(freshMnemonic1).not.toEqual(freshMnemonic2);
  });
  it(`should convert mnemonics to seeds async`, async () => {
    const mns = [
      await mnemonicToSeed(freshMnemonic2, { prefix: PREFIXES.standard }),
      await mnemonicToSeed(freshMnemonic1),
    ];
    expect(mns[0]).not.toEqual(mns[1]);
    await expect(
      mnemonicToSeed('abc', { skipCheck: true }),
    ).resolves.toBeTruthy();
  });
  it(`should convert mnemonics to seeds sync`, () => {
    const mns = [
      mnemonicToSeedSync(freshMnemonic2, { prefix: PREFIXES.standard }),
      mnemonicToSeedSync(freshMnemonic1),
    ];
    expect(mns[0]).not.toEqual(mns[1]);
    expect(() => {
      mnemonicToSeedSync('abc', { skipCheck: true });
    }).not.toThrow();
  });
  it(`should throw error when creating seed from incorrect version`, () => {
    expect(() => {
      mnemonicToSeedSync(freshMnemonic1 + 'z');
    }).toThrowError(/Invalid Seed Version for mnemonic/);
  });
  it(`should throw if prefix not hex`, () => {
    expect(() => {
      generateMnemonic({ prefix: 'z' });
    }).toThrowError(/prefix must be a hex string/);
  });
  it(`should throw if strength too low`, () => {
    expect(() => {
      generateMnemonic({ strength: 23 }); // default prefix is 12 bits
    }).toThrowError(/strength must be at least 2x of prefix bit count.*/);
  });
  it(`should generate custom strengths`, () => {
    generateMnemonic({ strength: 133 });
  });
  it(`should validate phrases`, () => {
    expect(validateMnemonic(freshMnemonic1, PREFIXES.segwit)).toEqual(true);
    expect(validateMnemonic(freshMnemonic2, PREFIXES.standard)).toEqual(true);
    expect(validateMnemonic(freshMnemonic1, 'deadbeefdeadbeef')).toEqual(false);
    expect(validateMnemonic(freshMnemonic2, 'deadbeefdeadbeef')).toEqual(false);
  });
  it(`should generate the proper addresses`, () => {
    // segwit
    const phrase =
      'やっと　そうがんきょう　はえる　げつれい　しねま　おらんだ　にきび　たいのう　' +
      'しみん　おうえん　とかす　たいけん';
    const firstAddress = 'bc1qlslf54jr59k5l6nk4umexrwddqq6573ucnw9q7';
    expect(validateMnemonic(phrase, PREFIXES.segwit)).toEqual(true);
    expect(
      bitcoin.payments.p2wpkh({
        pubkey: bitcoin.bip32
          .fromSeed(mnemonicToSeedSync(phrase))
          .derivePath("m/0'/0/0").publicKey,
      }).address,
    ).toEqual(firstAddress);

    // legacy p2pkh
    const phrase2 =
      'かんしゃ　ふおん　なわとび　そうり　かろう　はあく　たこく　こわもて　れいせい　' +
      'こつぶ　きせい　こぜん';
    const firstAddress2 = '18pHxJbrLSYpUPPD7zFdgBZn27RxsGfWNs';
    expect(validateMnemonic(phrase2, PREFIXES.standard)).toEqual(true);
    expect(
      bitcoin.payments.p2pkh({
        pubkey: bitcoin.bip32
          .fromSeed(mnemonicToSeedSync(phrase2, { prefix: PREFIXES.standard }))
          .derivePath('m/0/0').publicKey,
      }).address,
    ).toEqual(firstAddress2);
  });
});
