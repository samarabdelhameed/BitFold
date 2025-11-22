# Ordinals Flow

## Overview

BitFold supports Bitcoin Ordinals NFTs as collateral. This document describes how Ordinals are verified and handled.

## Flow

### 1. Deposit Ordinal

1. User provides UTXO details (txid, vout)
2. Vault queries Ordinals indexer to verify inscription
3. Indexer returns:
   - Inscription ID
   - Content type
   - Content preview (if applicable)
4. Vault stores Ordinal metadata with UTXO

### 2. Valuation

- Ordinals may have different LTV ratios
- Valuation can be:
  - Fixed by governance
  - Market-based (if indexer provides)
  - User-provided (with verification)

### 3. Display

- Frontend fetches Ordinal metadata
- Displays preview/image if available
- Shows inscription ID and details

## Indexer Integration

### Indexer API (Expected)

```
GET /ordinal/{txid}/{vout}
Response: {
  inscription_id: string,
  content_type: string,
  content_preview?: string,
  metadata?: object
}
```

### Stub Implementation

For testing, `indexer_stub` canister provides mock responses.

## Security Considerations

- Verify inscription exists before accepting as collateral
- Store inscription ID for verification
- Prevent double-spending of Ordinals
- Validate content type and size

