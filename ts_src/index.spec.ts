import * as index from './index';

describe('index', () => {
  it('should export all', () => {
    expect(index.generateMnemonic).toBeDefined();
    expect(index.mnemonicToSeed).toBeDefined();
    expect(index.mnemonicToSeedSync).toBeDefined();
    expect(index.validateMnemonic).toBeDefined();
    expect(Object.keys(index).sort()).toEqual([
      'PREFIXES',
      'generateMnemonic',
      'mnemonicToSeed',
      'mnemonicToSeedSync',
      'validateMnemonic',
    ]);
  });
});
