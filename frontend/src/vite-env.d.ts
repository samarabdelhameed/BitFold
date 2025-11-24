/// <reference types="vite/client" />

// UniSat Wallet types
interface Window {
  unisat?: {
    requestAccounts: () => Promise<string[]>;
    getAccounts: () => Promise<string[]>;
    getPublicKey: () => Promise<string>;
    sendBitcoin: (to: string, amount: number) => Promise<string>;
    signMessage: (message: string) => Promise<string>;
    switchNetwork: (network: 'livenet' | 'testnet') => Promise<void>;
    getNetwork: () => Promise<'livenet' | 'testnet'>;
    getBalance: () => Promise<{ confirmed: number; unconfirmed: number; total: number }>;
    getInscriptions: (cursor?: number, size?: number) => Promise<any>;
  };
  XverseProviders?: {
    BitcoinProvider: {
      request: (method: string, params?: any) => Promise<any>;
    };
  };
  magicEden?: {
    requestAccounts: () => Promise<string[]>;
    getAccounts: () => Promise<string[]>;
    getNetwork: () => Promise<string>;
    switchNetwork: (network: string) => Promise<void>;
  };
}
