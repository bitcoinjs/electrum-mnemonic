import * as index from './index';

describe('index', () => {
  it('should export all', () => {
    expect(index.generateMnemonic).toBeDefined();
    expect(index.mnemonicToSeed).toBeDefined();
    expect(index.mnemonicToSeedSync).toBeDefined();
  });
});
