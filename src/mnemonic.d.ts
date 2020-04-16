/// <reference types="node" />
export declare const PREFIXES: {
    segwit: string;
    standard: string;
    '2fa': string;
    '2fa-segwit': string;
};
export declare function generateMnemonic(prefix?: string, strength?: number, // 12 words x 2048 wordlist === 132 bits
rng?: (size: number) => Buffer, wordlist?: string[]): string;
interface Opts {
    passphrase?: string;
    validPrefixes?: string[];
    skipCheck?: boolean;
}
export declare function mnemonicToSeedSync(mnemonic: string, opts?: Opts): Buffer;
export declare function mnemonicToSeed(mnemonic: string, opts?: Opts): Promise<Buffer>;
export {};
