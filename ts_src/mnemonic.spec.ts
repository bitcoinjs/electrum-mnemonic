import {
  generateMnemonic,
  generateMnemonicAsync,
  mnemonicToSeed,
  mnemonicToSeedSync,
} from './mnemonic';
import * as bitcoin from 'bitcoinjs-lib';

describe(`mnemonic`, () => {
  let freshMnemonic1: string;
  let freshMnemonic2: string;
  let freshMnemonic3: string;
  let freshMnemonic4: string;
  beforeAll(async () => {
    freshMnemonic1 = generateMnemonic();
    freshMnemonic2 = await generateMnemonicAsync({
      prefix: '01',
    });
    freshMnemonic3 = await generateMnemonicAsync();
    freshMnemonic4 = await generateMnemonicAsync({
      interval: 49,
    });
  });
  it(`should generate random mnemonics`, () => {
    expect(freshMnemonic1).not.toEqual(freshMnemonic2);
  });
  it(`should convert mnemonics to seeds async`, async () => {
    const mns = [
      await mnemonicToSeed(freshMnemonic2),
      await mnemonicToSeed(freshMnemonic1),
    ];
    expect(mns[0]).not.toEqual(mns[1]);
    await expect(
      mnemonicToSeed('abc', { skipCheck: true }),
    ).resolves.toBeTruthy();
  });
  it(`should convert mnemonics to seeds sync`, () => {
    const mns = [
      mnemonicToSeedSync(freshMnemonic3),
      mnemonicToSeedSync(freshMnemonic4),
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
  it(`should generate the proper addresses`, () => {
    // segwit
    const phrase =
      'やっと　そうがんきょう　はえる　げつれい　しねま　おらんだ　にきび　たいのう　' +
      'しみん　おうえん　とかす　たいけん';
    const firstAddress = 'bc1qlslf54jr59k5l6nk4umexrwddqq6573ucnw9q7';
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
    expect(
      bitcoin.payments.p2pkh({
        pubkey: bitcoin.bip32
          .fromSeed(mnemonicToSeedSync(phrase2))
          .derivePath('m/0/0').publicKey,
      }).address,
    ).toEqual(firstAddress2);
  });
});
