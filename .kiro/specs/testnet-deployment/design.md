# Design Document - BitFold Testnet Deployment

## Overview

This design document outlines the complete deployment strategy for the BitFold Vault system to ICP testnet, including integration with Bitcoin testnet, ckBTC testnet, and Maestro Ordinals API. The deployment follows a systematic approach: identity setup, resource acquisition, configuration, deployment, and testing.

## Architecture

### Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Machine                         │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ dfx Identity │───▶│ Cycles Wallet│───▶│   Deploy     │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      ICP Testnet                             │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │    Vault     │    │   Frontend   │    │ Indexer Stub │ │
│  │   Canister   │    │   Canister   │    │   Canister   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Bitcoin    │    │    ckBTC     │    │   Maestro    │
│   Testnet    │    │   Testnet    │    │     API      │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Components and Interfaces

### 1. Identity Management Module

**Purpose**: Manage dfx identities for deployment and testing

**Key Operations**:
- Create new identity: `dfx identity new <name>`
- Switch identity: `dfx identity use <name>`
- Get principal: `dfx identity get-principal`
- List identities: `dfx identity list`

**Identity Storage**:
- Location: `~/.config/dfx/identity/`
- Format: PEM-encoded private key
- Security: Protected by file system permissions

### 2. Cycles Management Module

**Purpose**: Acquire and manage cycles for canister deployment

**Acquisition Methods**:

**Method 1: ICP Faucet (Recommended)**
- URL: https://faucet.dfinity.org
- Authentication: Internet Identity
- Amount: 20 trillion cycles (free)
- Frequency: Once per identity

**Method 2: Ledger-based**
- Get account ID: `dfx ledger account-id`
- Create wallet: `dfx ledger create-canister <principal> --amount <ICP>`
- Requires: ICP tokens on testnet

**Cycles Wallet Operations**:
- Check balance: `dfx wallet balance`
- Send cycles: `dfx wallet send <amount> <destination>`

### 3. Canister Deployment Module

**Purpose**: Deploy canisters to ICP testnet

**Network Configuration**:

```json
{
  "networks": {
    "ic": {
      "providers": ["https://ic0.app"],
      "type": "persistent"
    },
    "playground": {
      "providers": ["https://playground.dfinity.network"],
      "type": "playground"
    }
  }
}
```

**Deployment Commands**:
- Build: `dfx build --network ic`
- Deploy: `dfx deploy --network ic <canister_name>`
- Upgrade: `dfx canister install --mode upgrade --network ic <canister_name>`

**Deployment Costs**:
- Vault canister: ~2-5 billion cycles
- Frontend canister: ~1-2 billion cycles
- Indexer stub: ~1-2 billion cycles

### 4. Bitcoin Testnet Integration Module

**Purpose**: Set up Bitcoin testnet wallet and acquire UTXOs

**Wallet Options**:

**Option 1: Electrum (Desktop)**
- Download: https://electrum.org
- Network: Testnet mode
- Address format: Bech32 (tb1...)

**Option 2: Online Wallet**
- URL: https://testnet.demo.btcpayserver.org
- Access: Browser-based
- Backup: Export seed phrase

**Faucet Services**:
1. Coinfaucet: https://coinfaucet.eu/en/btc-testnet/
   - Amount: 0.001 - 0.01 tBTC
   - Frequency: Every 24 hours

2. Mempool Faucet: https://testnet-faucet.mempool.co
   - Amount: 0.001 tBTC
   - Frequency: Every 24 hours

3. Bitcoin Sandbox: https://bitcoinfaucet.uo1.net
   - Amount: 0.01 tBTC
   - Frequency: Every 24 hours

**UTXO Extraction**:
- Block Explorer: https://blockstream.info/testnet/
- Required fields: txid, vout, amount (satoshis), address
- Verification: Check UTXO is unspent

### 5. ckBTC Testnet Integration Module

**Purpose**: Acquire ckBTC testnet tokens for testing

**Acquisition Method**:
- Faucet: https://faucet.dfinity.org
- Authentication: Internet Identity
- Amount: Variable (typically 0.1 - 1.0 ckBTC)
- Ledger ID: `mc6ru-gyaaa-aaaar-qaaaq-cai`

**Balance Verification**:
```bash
dfx canister call mc6ru-gyaaa-aaaar-qaaaq-cai icrc1_balance_of \
  '(record { owner = principal "YOUR_PRINCIPAL"; subaccount = null })'
```

**Transfer Testing**:
```bash
dfx canister call mc6ru-gyaaa-aaaar-qaaaq-cai icrc1_transfer \
  '(record { 
    to = record { owner = principal "DESTINATION"; subaccount = null }; 
    amount = 100000; 
    fee = null; 
    memo = null; 
    created_at_time = null 
  })'
```

### 6. Maestro API Integration Module

**Purpose**: Configure Maestro API for Ordinals inscription queries

**Registration Process**:
1. Visit: https://www.gomaestro.org
2. Sign up for free account
3. Create API key
4. Select: Bitcoin Testnet
5. Copy API key

**API Configuration**:
```rust
// In canisters/vault/src/ordinals.rs
const MAESTRO_API_KEY: &str = "YOUR_API_KEY_HERE";
const MAESTRO_API_BASE_URL: &str = "https://api.gomaestro.org/v1";
```

**API Limits**:
- Free tier: 100,000 requests/month
- Rate limit: 10 requests/second
- Response size: 10KB max

**Alternative: Alchemy**
- URL: https://www.alchemy.com
- Network: Bitcoin Testnet
- Similar free tier limits

### 7. Configuration Management Module

**Purpose**: Manage all configuration parameters for testnet deployment

**Configuration Files**:

**dfx.json**:
```json
{
  "canisters": {
    "vault": {
      "type": "rust",
      "package": "vault",
      "candid": "canisters/vault/vault.did"
    },
    "frontend": {
      "type": "assets",
      "source": ["frontend/dist"]
    }
  }
}
```

**Vault Configuration** (in code):
```rust
// Bitcoin network
const BITCOIN_NETWORK: BitcoinNetwork = BitcoinNetwork::Testnet;

// ckBTC ledger
const CKBTC_LEDGER_CANISTER_ID: &str = "mc6ru-gyaaa-aaaar-qaaaq-cai";

// Maestro API
const MAESTRO_API_KEY: &str = "YOUR_KEY";
```

**Frontend Configuration**:
```typescript
// In frontend/src/config.ts
export const VAULT_CANISTER_ID = process.env.VAULT_CANISTER_ID || "LOCAL_ID";
export const NETWORK = process.env.DFX_NETWORK || "local";
```

## Data Models

### Deployment Configuration
```typescript
interface DeploymentConfig {
  network: "local" | "ic" | "playground";
  identity: string;
  principal: string;
  cycles_wallet: string;
  canister_ids: {
    vault: string;
    frontend: string;
    indexer_stub: string;
  };
}
```

### Testnet Resources
```typescript
interface TestnetResources {
  bitcoin: {
    wallet_address: string;
    utxos: Array<{
      txid: string;
      vout: number;
      amount: number;
      address: string;
    }>;
  };
  ckbtc: {
    balance: number;
    principal: string;
  };
  maestro: {
    api_key: string;
    requests_remaining: number;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Identity persistence
*For any* dfx identity, switching to it and querying the principal should return the same principal ID consistently.
**Validates: Requirements 1.3, 1.5**

### Property 2: Cycles sufficiency
*For any* canister deployment, if cycles are insufficient, the deployment should fail before any state changes.
**Validates: Requirements 2.5**

### Property 3: Deployment idempotency
*For any* canister, deploying it multiple times to the same network should result in the same canister ID.
**Validates: Requirements 3.2**

### Property 4: Testnet address format
*For any* Bitcoin testnet address, it should start with 'tb1', 'm', or 'n' to indicate testnet network.
**Validates: Requirements 4.1**

### Property 5: UTXO unspent verification
*For any* UTXO obtained from a faucet, it should be unspent when queried on the block explorer.
**Validates: Requirements 5.5**

### Property 6: ckBTC balance consistency
*For any* ckBTC balance query, the result should match the amount received from the faucet minus any transfers.
**Validates: Requirements 6.3**

### Property 7: API key authentication
*For any* Maestro API call with a valid key, the API should return data; with an invalid key, it should return an authentication error.
**Validates: Requirements 7.4, 7.5**

### Property 8: Network configuration correctness
*For any* vault canister configuration, using testnet parameters should result in connections to testnet services only.
**Validates: Requirements 8.1, 8.2, 8.5**

### Property 9: End-to-end flow completion
*For any* complete vault flow (deposit → borrow → repay → withdraw), all operations should succeed with real testnet resources.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 10: Frontend canister accessibility
*For any* deployed frontend canister, accessing its URL should load the application without errors.
**Validates: Requirements 10.3**

### Property 11: Documentation completeness
*For any* deployment step in the documentation, following it should result in successful completion without additional research.
**Validates: Requirements 11.1**

### Property 12: Canister health monitoring
*For any* deployed canister, querying its status should return "Running" and a positive cycles balance.
**Validates: Requirements 12.1, 12.2**

## Error Handling

### Error Categories

1. **Identity Errors**
   - Identity not found
   - Invalid principal format
   - Permission denied

2. **Cycles Errors**
   - Insufficient cycles
   - Wallet not found
   - Transfer failed

3. **Deployment Errors**
   - Build failed
   - Network unreachable
   - Canister already exists

4. **Resource Acquisition Errors**
   - Faucet rate limit exceeded
   - Invalid address format
   - Transaction not confirmed

5. **Configuration Errors**
   - Missing API key
   - Invalid canister ID
   - Wrong network selected

### Error Handling Strategy

```bash
# Example error handling in deployment script
deploy_canister() {
  echo "Deploying $1..."
  if ! dfx deploy --network ic $1; then
    echo "❌ Deployment failed for $1"
    echo "Checking cycles balance..."
    dfx wallet balance
    echo "Checking canister status..."
    dfx canister status $1 --network ic
    exit 1
  fi
  echo "✅ Successfully deployed $1"
}
```

## Testing Strategy

### Unit Testing
- Identity operations (create, switch, query)
- Configuration validation
- UTXO format verification

### Integration Testing
- Complete deployment flow
- Canister interaction with testnets
- Frontend-backend communication

### End-to-End Testing
- Full user flow: deposit → borrow → repay → withdraw
- Error scenarios with invalid inputs
- Ordinals inscription verification

## Deployment Checklist

### Pre-Deployment
- [ ] dfx installed and updated
- [ ] Identity created and selected
- [ ] Cycles acquired (20T minimum)
- [ ] Bitcoin testnet wallet created
- [ ] ckBTC testnet tokens acquired
- [ ] Maestro API key obtained

### Deployment
- [ ] Code configured with testnet parameters
- [ ] Vault canister built successfully
- [ ] Vault canister deployed to testnet
- [ ] Frontend built successfully
- [ ] Frontend deployed to testnet
- [ ] Canister IDs recorded

### Post-Deployment
- [ ] Vault canister status verified
- [ ] Frontend accessible via URL
- [ ] Bitcoin API integration tested
- [ ] ckBTC ledger integration tested
- [ ] Maestro API integration tested
- [ ] Complete flow tested end-to-end

## Security Considerations

1. **API Key Protection**: Never commit API keys to version control
2. **Identity Backup**: Backup identity PEM files securely
3. **Cycles Management**: Monitor cycles balance to prevent canister freezing
4. **Testnet Only**: Ensure all configurations point to testnet, not mainnet
5. **Rate Limiting**: Respect faucet and API rate limits

## Performance Considerations

1. **Deployment Time**: ~5-10 minutes for all canisters
2. **Bitcoin Confirmation**: Wait for 1-3 confirmations (~30-90 minutes)
3. **ckBTC Transfer**: Usually instant on testnet
4. **API Response Time**: Maestro API typically responds in <1 second

## Monitoring and Maintenance

### Monitoring Commands
```bash
# Check canister status
dfx canister status vault --network ic

# Check cycles balance
dfx wallet balance --network ic

# View canister logs
dfx canister logs vault --network ic

# Check canister info
dfx canister info vault --network ic
```

### Maintenance Tasks
- Monitor cycles balance weekly
- Top up cycles when below 1T
- Update API keys if expired
- Refresh testnet tokens as needed

## Rollback Strategy

If deployment fails:
1. Stop the deployment process
2. Check error logs
3. Verify configuration
4. Fix issues
5. Redeploy with `--mode reinstall` if needed

If canister is corrupted:
1. Backup current state (if possible)
2. Uninstall canister: `dfx canister uninstall <name> --network ic`
3. Redeploy from scratch
4. Restore state if backup exists

## Future Enhancements

1. **Automated Deployment**: CI/CD pipeline for automatic deployment
2. **Multi-Network Support**: Easy switching between testnet and mainnet
3. **Monitoring Dashboard**: Real-time canister health monitoring
4. **Backup Automation**: Automatic state backups before upgrades
5. **Cost Optimization**: Cycles usage optimization strategies
