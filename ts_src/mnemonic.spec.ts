import {
  generateMnemonic,
  mnemonicToSeed,
  mnemonicToSeedSync,
} from './mnemonic';

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
});
