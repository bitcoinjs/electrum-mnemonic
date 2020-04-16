/// <reference types="node" />
export declare const PREFIXES: {
    segwit: string;
    standard: string;
    '2fa': string;
    '2fa-segwit': string;
};
interface GenerateOpts {
    prefix?: string;
    strength?: number;
    rng?: (size: number) => Buffer;
    wordlist?: string[];
}
export declare function generateMnemonic(opts?: GenerateOpts): string;
interface SeedOpts {
    passphrase?: string;
    validPrefixes?: string[];
    skipCheck?: boolean;
}
export declare function mnemonicToSeedSync(mnemonic: string, opts?: SeedOpts): Buffer;
export declare function mnemonicToSeed(mnemonic: string, opts?: SeedOpts): Promise<Buffer>;
export {};
