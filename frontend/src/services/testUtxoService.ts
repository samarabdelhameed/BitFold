/**
 * Test UTXO Service - Simulated UTXO Engine for Testing
 * This service provides simulated UTXOs for testing without real Bitcoin transactions
 */

export interface TestUTXO {
  txid: string;
  vout: number;
  amount: bigint;
  address: string;
  ordinalInfo?: {
    inscription_id: string;
    content_type: string;
    content_preview?: string;
    metadata?: string;
  };
}

// Test accounts with pre-generated UTXOs
const TEST_ACCOUNTS: Record<string, TestUTXO[]> = {
  // Test account 1: Has 3 UTXOs with Ordinals
  'tb1qtest1': [
    {
      txid: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
      vout: 0,
      amount: BigInt(100000000), // 1 BTC
      address: 'tb1qtest1',
      ordinalInfo: {
        inscription_id: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456i0',
        content_type: 'image/png',
        content_preview: 'Test Ordinal #1',
        metadata: '{"name": "Test Ordinal", "collection": "Test Collection"}'
      }
    },
    {
      txid: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
      vout: 1,
      amount: BigInt(50000000), // 0.5 BTC
      address: 'tb1qtest1',
      ordinalInfo: {
        inscription_id: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678i0',
        content_type: 'text/plain',
        content_preview: 'Test Ordinal #2',
        metadata: '{"name": "Test Text Ordinal"}'
      }
    },
    {
      txid: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890',
      vout: 0,
      amount: BigInt(25000000), // 0.25 BTC
      address: 'tb1qtest1'
    }
  ],
  // Test account 2: Has 2 UTXOs without Ordinals
  'tb1qtest2': [
    {
      txid: 'd4e5f6789012345678901234567890abcdef1234567890abcdef1234567890ab',
      vout: 0,
      amount: BigInt(200000000), // 2 BTC
      address: 'tb1qtest2'
    },
    {
      txid: 'e5f6789012345678901234567890abcdef1234567890abcdef1234567890abcd',
      vout: 1,
      amount: BigInt(75000000), // 0.75 BTC
      address: 'tb1qtest2'
    }
  ]
};

/**
 * Get UTXOs for a test address
 */
export function getTestUtxos(address: string): TestUTXO[] {
  // Check if address is in test accounts
  if (TEST_ACCOUNTS[address]) {
    return TEST_ACCOUNTS[address];
  }

  // Generate random UTXOs for any test address
  return [
    {
      txid: generateRandomTxid(),
      vout: 0,
      amount: BigInt(Math.floor(Math.random() * 100000000) + 10000000), // 0.1 - 1 BTC
      address
    }
  ];
}

/**
 * Generate a random transaction ID (64 hex characters)
 */
function generateRandomTxid(): string {
  const chars = '0123456789abcdef';
  let txid = '';
  for (let i = 0; i < 64; i++) {
    txid += chars[Math.floor(Math.random() * chars.length)];
  }
  return txid;
}

/**
 * Check if an address is a test address
 */
export function isTestAddress(address: string): boolean {
  return address.startsWith('tb1q') || address.startsWith('bcrt1') || address.startsWith('m') || address.startsWith('n');
}

/**
 * Get test account addresses
 */
export function getTestAccounts(): string[] {
  return Object.keys(TEST_ACCOUNTS);
}

/**
 * Create a new test UTXO for an address
 */
export function createTestUtxo(address: string, amount: bigint, ordinalInfo?: TestUTXO['ordinalInfo']): TestUTXO {
  return {
    txid: generateRandomTxid(),
    vout: 0,
    amount,
    address,
    ordinalInfo
  };
}

