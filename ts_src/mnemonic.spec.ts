import {
  generateMnemonic,
  mnemonicToSeed,
  mnemonicToSeedSync,
} from './mnemonic';
import * as bitcoin from 'bitcoinjs-lib';

describe(`mnemonic`, () => {
  it(`should generate random mnemonics`, () => {
    const mns = [generateMnemonic(), generateMnemonic(), generateMnemonic()];
    expect(mns[0]).not.toEqual(mns[1]);
    expect(mns[0]).not.toEqual(mns[2]);
    expect(mns[1]).not.toEqual(mns[2]);
  });
  it(`should convert mnemonics to seeds async`, async () => {
    const mns = [
      await mnemonicToSeed(generateMnemonic({ prefix: '01' })),
      await mnemonicToSeed(generateMnemonic()),
      await mnemonicToSeed(generateMnemonic({ prefix: '01' })),
    ];
    expect(mns[0]).not.toEqual(mns[1]);
    expect(mns[0]).not.toEqual(mns[2]);
    expect(mns[1]).not.toEqual(mns[2]);
    await expect(
      mnemonicToSeed('abc', { skipCheck: true }),
    ).resolves.toBeTruthy();
  });
  it(`should convert mnemonics to seeds sync`, () => {
    const mns = [
      mnemonicToSeedSync(generateMnemonic({ prefix: '01' })),
      mnemonicToSeedSync(generateMnemonic()),
      mnemonicToSeedSync(generateMnemonic({ prefix: '01' })),
    ];
    expect(mns[0]).not.toEqual(mns[1]);
    expect(mns[0]).not.toEqual(mns[2]);
    expect(mns[1]).not.toEqual(mns[2]);
    expect(() => {
      mnemonicToSeedSync('abc', { skipCheck: true });
    }).not.toThrow();
  });
  it(`should throw error when creating seed from incorrect version`, () => {
    expect(() => {
      mnemonicToSeedSync(generateMnemonic() + 'z');
    }).toThrowError(/Invalid Seed Version for mnemonic/);
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
