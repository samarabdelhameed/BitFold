# Design Document - BitFold Vault Integration

## Overview

The BitFold Vault Integration implements a complete Bitcoin collateral management system on the Internet Computer. The design integrates three critical external systems: ICP's native Bitcoin API for UTXO verification, the ckBTC ledger for token operations, and an Ordinals indexer for inscription metadata. The architecture follows a modular design with clear separation between API endpoints, business logic, external integrations, and state management.

### ⚠️ CRITICAL: Real Data Only - No Mock Implementation

**This system operates with REAL blockchain data:**
- All Bitcoin UTXO verifications query the actual Bitcoin testnet via ICP Bitcoin API
- All ckBTC operations interact with the real ckBTC testnet ledger canister
- All Ordinals metadata comes from real indexer APIs (Maestro)
- NO mock data, NO simulated responses, NO fake transactions
- Every function must integrate with live external systems
- Testing requires actual testnet resources (Bitcoin testnet UTXOs, ckBTC tokens)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│                  Internet Identity Auth                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Vault Canister (ICP)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   API    │  │ Bitcoin  │  │  ckBTC   │  │ Ordinals │   │
│  │  Layer   │─▶│Integration│  │Integration│  │Integration│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       │              │              │              │         │
│       ▼              ▼              ▼              ▼         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              State Management                         │  │
│  │  (Loans, UTXOs, User Mappings)                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ ICP Bitcoin  │    │ ckBTC Ledger │    │   Ordinals   │
│     API      │    │   Canister   │    │   Indexer    │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Module Structure

- **lib.rs**: Main entry point, exports API functions and Candid interface
- **api.rs**: Public API endpoints (deposit, borrow, repay, withdraw, queries)
- **bitcoin.rs**: Bitcoin network integration (UTXO verification, monitoring)
- **ckbtc.rs**: ckBTC ledger integration (transfer, mint, burn operations)
- **ordinals.rs**: Ordinals indexer integration (inscription verification)
- **state.rs**: State management with thread-local storage
- **types.rs**: Data structures and type definitions
- **helpers.rs**: Utility functions (validation, calculations)

## Components and Interfaces

### 1. Bitcoin Integration Module

**Purpose**: Verify and monitor Bitcoin UTXOs using ICP's native Bitcoin API

**Key Functions**:
- `verify_utxo(utxo: &UTXO) -> Result<bool, String>`
  - Calls ICP Bitcoin API `bitcoin_get_utxos` for the UTXO's address
  - Searches returned UTXOs for matching txid and vout
  - Verifies amount matches
  - Returns true if UTXO exists and is unspent

- `get_utxos_for_address(address: &str, min_confirmations: u32) -> Result<Vec<Utxo>, String>`
  - Calls ICP Bitcoin API to get all UTXOs for an address
  - Filters by minimum confirmations
  - Returns list of UTXOs

- `is_utxo_spent(txid: &str, vout: u32, address: &str) -> Result<bool, String>`
  - Checks if a specific UTXO is still unspent
  - Used for monitoring deposited collateral

**ICP Bitcoin API Integration**:
```rust
use ic_cdk::api::management_canister::bitcoin::{
    bitcoin_get_utxos, BitcoinNetwork, GetUtxosRequest, GetUtxosResponse
};
```

**Network Configuration**:
- Development: `BitcoinNetwork::Testnet`
- Production: `BitcoinNetwork::Bitcoin` (mainnet)

### 2. ckBTC Integration Module

**Purpose**: Interact with ckBTC ledger for token transfers, minting, and burning

**Key Functions**:
- `transfer_ckbtc(to: Principal, amount: u64) -> Result<u64, String>`
  - Calls ckBTC ledger `icrc1_transfer` method
  - Transfers ckBTC from canister to user
  - Returns block index on success

- `verify_transfer_to_canister(from: Principal, amount: u64) -> Result<bool, String>`
  - Queries ckBTC ledger to verify user transferred tokens to canister
  - Checks recent transactions for matching transfer
  - Used before burning during repayment

- `get_balance(principal: Principal) -> Result<u64, String>`
  - Calls ckBTC ledger `icrc1_balance_of` method
  - Returns ckBTC balance for a principal

**ICRC-1 Integration**:
```rust
use candid::{Nat, Principal};
use ic_cdk::call;

// Transfer args structure
struct TransferArgs {
    from_subaccount: Option<Vec<u8>>,
    to: Account,
    amount: Nat,
    fee: Option<Nat>,
    memo: Option<Vec<u8>>,
    created_at_time: Option<u64>,
}
```

**ckBTC Ledger Canister IDs**:
- Testnet: `mc6ru-gyaaa-aaaar-qaaaq-cai`
- Mainnet: `mxzaz-hqaaa-aaaar-qaada-cai`

### 3. Ordinals Integration Module

**Purpose**: Verify Ordinals inscriptions and retrieve metadata

**Key Functions**:
- `verify_ordinal(txid: &str, vout: u32) -> Result<Option<OrdinalInfo>, String>`
  - Queries Ordinals indexer for inscription on UTXO
  - Returns inscription metadata if found
  - Returns None if no inscription exists

- `get_inscription_metadata(inscription_id: &str) -> Result<OrdinalInfo, String>`
  - Fetches detailed metadata for an inscription
  - Returns content type, preview, and metadata

**Integration Options**:

**Option A: HTTP Outcalls to Maestro API**
```rust
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpMethod, HttpResponse
};

async fn query_maestro_api(inscription_id: &str) -> Result<OrdinalInfo, String> {
    let url = format!("https://api.gomaestro.org/v1/inscriptions/{}", inscription_id);
    let request = CanisterHttpRequestArgument {
        url,
        method: HttpMethod::GET,
        headers: vec![("X-API-Key".to_string(), API_KEY.to_string())],
        body: None,
        max_response_bytes: Some(1024),
        transform: None,
    };
    let response = http_request(request).await?;
    // Parse JSON response
}
```

**Option B: Inter-Canister Call to Indexer Canister**
```rust
async fn query_indexer_canister(txid: &str, vout: u32) -> Result<Option<OrdinalInfo>, String> {
    let indexer_id = Principal::from_text(INDEXER_CANISTER_ID)?;
    let result: Result<(Option<OrdinalInfo>,), _> = 
        ic_cdk::call(indexer_id, "get_inscription", (txid, vout)).await;
    result.map(|(info,)| info).map_err(|e| format!("Indexer call failed: {:?}", e))
}
```

### 4. API Layer

**Public Endpoints**:

**Update Calls**:
- `deposit_utxo(request: DepositUtxoRequest) -> Result<UtxoId, String>`
- `borrow(request: BorrowRequest) -> Result<LoanId, String>`
- `repay(request: RepayRequest) -> Result<(), String>`
- `withdraw_collateral(utxo_id: UtxoId) -> Result<(), String>`

**Query Calls**:
- `get_user_loans() -> Vec<Loan>`
- `get_collateral() -> Vec<UTXO>`
- `get_loan(loan_id: LoanId) -> Option<Loan>`
- `get_utxo(utxo_id: UtxoId) -> Option<UTXO>`

### 5. State Management

**State Structure**:
```rust
pub struct State {
    pub loans: HashMap<LoanId, Loan>,
    pub utxos: HashMap<UtxoId, UTXO>,
    pub user_loans: HashMap<Principal, Vec<LoanId>>,
    pub user_utxos: HashMap<Principal, Vec<UtxoId>>,
    pub next_loan_id: LoanId,
    pub next_utxo_id: UtxoId,
}
```

**Stable Storage** (for upgrades):
```rust
use ic_stable_structures::{
    StableBTreeMap, DefaultMemoryImpl, memory_manager::MemoryManager
};

// Pre-upgrade hook
#[pre_upgrade]
fn pre_upgrade() {
    let state = State::with_read(|s| s.clone());
    ic_cdk::storage::stable_save((state,)).expect("Failed to save state");
}

// Post-upgrade hook
#[post_upgrade]
fn post_upgrade() {
    let (state,): (State,) = ic_cdk::storage::stable_restore()
        .expect("Failed to restore state");
    State::replace(state);
}
```

## Data Models

### UTXO
```rust
pub struct UTXO {
    pub id: UtxoId,
    pub txid: String,              // 64 hex characters
    pub vout: u32,                 // Output index
    pub amount: u64,               // Satoshis
    pub address: String,           // Bitcoin address
    pub ordinal_info: Option<OrdinalInfo>,
    pub status: UtxoStatus,        // Deposited, Locked, Withdrawn
    pub deposited_at: u64,         // Timestamp in nanoseconds
}
```

### Loan
```rust
pub struct Loan {
    pub id: LoanId,
    pub user_id: Principal,
    pub collateral_utxo_id: UtxoId,
    pub borrowed_amount: u64,      // Satoshis
    pub repaid_amount: u64,        // Satoshis
    pub interest_rate: u64,        // Basis points (500 = 5%)
    pub created_at: u64,           // Timestamp
    pub status: LoanStatus,        // Active, Repaid, Liquidated
}
```

### OrdinalInfo
```rust
pub struct OrdinalInfo {
    pub inscription_id: String,
    pub content_type: String,
    pub content_preview: Option<String>,
    pub metadata: Option<String>,
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: UTXO verification calls Bitcoin API
*For any* valid UTXO submission (txid, vout, amount, address), the system should call the ICP Bitcoin API to verify the UTXO exists on the network.
**Validates: Requirements 1.1**

### Property 2: Only unspent UTXOs are accepted
*For any* UTXO verification, only UTXOs that are unspent on the Bitcoin network should be accepted as valid collateral.
**Validates: Requirements 1.2**

### Property 3: UTXO amount must match
*For any* UTXO verification, if the on-chain amount does not match the user-provided amount, the verification should fail.
**Validates: Requirements 1.3**

### Property 4: UTXO address must match
*For any* UTXO verification, if the on-chain address does not match the user-provided address, the verification should fail.
**Validates: Requirements 1.4**

### Property 5: Failed verification returns error
*For any* invalid UTXO submission, the deposit should be rejected and return a descriptive error message.
**Validates: Requirements 1.5**

### Property 6: Ordinals indexer is queried for all deposits
*For any* UTXO deposit, the system should query the Ordinals indexer to check for inscriptions.
**Validates: Requirements 3.1**

### Property 7: Inscription metadata is stored when found
*For any* UTXO with an inscription, the system should retrieve and store the inscription_id, content_type, and content_preview.
**Validates: Requirements 3.2**

### Property 8: UTXOs without inscriptions are accepted
*For any* UTXO without an inscription, the system should accept it as regular Bitcoin collateral with ordinal_info set to None.
**Validates: Requirements 3.3**

### Property 9: Max borrowable amount calculation
*For any* collateral UTXO and LTV ratio, the maximum borrowable amount should equal (UTXO amount × LTV) / 10000.
**Validates: Requirements 4.1**

### Property 10: Valid borrow creates loan and locks UTXO
*For any* valid borrow request, after successful ckBTC transfer, a loan record should exist and the collateral UTXO status should be Locked.
**Validates: Requirements 4.3**

### Property 11: Users can only borrow against owned UTXOs
*For any* borrow request, the system should verify the caller owns the collateral UTXO and reject requests for UTXOs owned by others.
**Validates: Requirements 4.5**

### Property 12: Repayment verifies ckBTC transfer
*For any* repayment request, the system should verify the user transferred ckBTC to the canister before processing the repayment.
**Validates: Requirements 5.1**

### Property 13: Full repayment unlocks collateral
*For any* loan, when the repaid amount equals or exceeds the total debt (borrowed + interest), the collateral UTXO should be unlocked and loan status should be Repaid.
**Validates: Requirements 5.3**

### Property 14: Partial repayment updates amount but keeps lock
*For any* loan, when the repayment amount is less than total debt, the repaid_amount should increase but the collateral should remain Locked.
**Validates: Requirements 5.4**

### Property 15: Withdrawal requires no active loans
*For any* UTXO withdrawal request, the system should reject the request if the UTXO has any active loans.
**Validates: Requirements 6.1, 6.4**

### Property 16: Users can only withdraw owned UTXOs
*For any* withdrawal request, the system should verify the caller owns the UTXO and reject requests for UTXOs owned by others.
**Validates: Requirements 6.2**

### Property 17: Successful withdrawal marks UTXO as withdrawn
*For any* UTXO meeting withdrawal conditions, the withdrawal should succeed and the UTXO status should change to Withdrawn.
**Validates: Requirements 6.3**

### Property 18: Interest calculation is correct
*For any* loan, the calculated interest should equal (borrowed_amount × interest_rate) / 10000.
**Validates: Requirements 7.1**

### Property 19: Loans store interest rate and timestamp
*For any* created loan, the loan record should contain a non-zero interest_rate and created_at timestamp.
**Validates: Requirements 7.2**

### Property 20: Loan value includes interest
*For any* loan query, the returned total debt should equal borrowed_amount + interest - repaid_amount.
**Validates: Requirements 7.4**

### Property 21: Invalid inputs are rejected
*For any* invalid input (malformed txid, invalid address, zero amount), the system should reject the request with a descriptive error.
**Validates: Requirements 8.1**

### Property 22: API failures don't modify state
*For any* external API call failure (Bitcoin API, ckBTC ledger, Ordinals indexer), the system should return an error without modifying any state.
**Validates: Requirements 8.2**

### Property 23: Unauthorized actions are rejected
*For any* action requiring authorization, the system should verify the caller's principal and reject unauthorized requests.
**Validates: Requirements 8.3**

### Property 24: Bitcoin address validation
*For any* Bitcoin address input, the system should validate the format (26-62 characters, valid base58/bech32) and reject invalid addresses.
**Validates: Requirements 8.4**

### Property 25: Transaction ID validation
*For any* transaction ID input, the system should verify it is exactly 64 hexadecimal characters and reject invalid formats.
**Validates: Requirements 8.5**

### Property 26: User loan queries return only user's loans
*For any* user querying their loans, the returned list should contain only loans where user_id matches the caller's principal.
**Validates: Requirements 9.1**

### Property 27: User collateral queries return only user's UTXOs
*For any* user querying their collateral, the returned list should contain only UTXOs deposited by the caller's principal.
**Validates: Requirements 9.2**

### Property 28: Query functions are idempotent
*For any* query function call, the state before and after the call should be identical (no state modifications).
**Validates: Requirements 9.5**

### Property 29: Canister upgrades preserve loans
*For any* canister upgrade, all loan records existing before the upgrade should exist after the upgrade with identical data.
**Validates: Requirements 10.1**

### Property 30: Canister upgrades preserve UTXOs
*For any* canister upgrade, all UTXO records existing before the upgrade should exist after the upgrade with identical data.
**Validates: Requirements 10.2**

### Property 31: Canister upgrades preserve user mappings
*For any* canister upgrade, all user-to-loans and user-to-UTXOs mappings should be preserved.
**Validates: Requirements 10.3**

### Property 32: Canister upgrades preserve ID counters
*For any* canister upgrade, the next_loan_id and next_utxo_id counters should be preserved to prevent ID collisions.
**Validates: Requirements 10.4**

### Property 33: Frontend connects to vault canister
*For any* user opening the application, the frontend should successfully establish a connection to the vault canister using ICP Agent.
**Validates: Requirements 11.1**

### Property 34: Authentication provides principal
*For any* successful Internet Identity authentication, the frontend should obtain and store the user's principal.
**Validates: Requirements 11.2**

### Property 35: Frontend calls match API methods
*For any* user action (deposit, borrow, repay, withdraw), the frontend should call the corresponding vault canister method with correct parameters.
**Validates: Requirements 11.3, 11.4, 11.5, 11.6**

### Property 36: Dashboard displays real data
*For any* user viewing their dashboard, the displayed loans and collateral should match the data returned from the vault canister.
**Validates: Requirements 11.7**

### Property 37: Frontend handles errors gracefully
*For any* canister call failure, the frontend should display a user-friendly error message without crashing.
**Validates: Requirements 11.8**

### Property 38: UI updates after successful operations
*For any* successful canister call, the frontend should update the UI to reflect the new state.
**Validates: Requirements 11.9**

### Property 39: Liquidation threshold enforcement
*For any* loan where LTV exceeds the liquidation threshold, the system should allow liquidation.
**Validates: Requirements 12.1**

### Property 40: Liquidation transfers collateral
*For any* liquidated loan, the collateral should be transferred to the liquidator and loan status should be Liquidated.
**Validates: Requirements 12.2**

### Property 41: Health factor calculation
*For any* loan, the health factor should accurately reflect the current LTV ratio and distance from liquidation.
**Validates: Requirements 12.3**

### Property 42: Statistics calculations are accurate
*For any* user or vault statistics query, the returned values should accurately reflect the sum of all relevant data.
**Validates: Requirements 12.5, 12.6**

## Error Handling

### Error Categories

1. **Validation Errors**: Invalid input format (txid, address, amounts)
   - Return immediately with descriptive message
   - No state modification

2. **Authorization Errors**: Caller doesn't own resource
   - Verify principal before any operation
   - Return "Unauthorized" error

3. **Business Logic Errors**: LTV exceeded, UTXO already locked
   - Check conditions before state changes
   - Return specific error messages

4. **External API Errors**: Bitcoin API, ckBTC ledger, Ordinals indexer failures
   - Wrap external calls in Result types
   - Propagate errors without state changes
   - Log errors for debugging

### Error Handling Pattern

```rust
pub async fn deposit_utxo(request: DepositUtxoRequest) -> Result<UtxoId, String> {
    // 1. Validate inputs
    validate_inputs(&request)?;
    
    // 2. Call external APIs (no state changes yet)
    let verified = bitcoin::verify_utxo(&utxo).await?;
    let ordinal_info = ordinals::verify_ordinal(&utxo.txid, utxo.vout).await?;
    
    // 3. Only modify state after all validations pass
    let utxo_id = State::with(|state| {
        // State modifications here
    });
    
    Ok(utxo_id)
}
```

## Testing Strategy

### Unit Testing

Unit tests will cover:
- Helper functions (validation, calculations)
- State management operations
- Error handling paths

**Example Unit Tests**:
- `test_calculate_max_borrowable()`: Verify LTV calculations
- `test_is_valid_txid()`: Test txid validation with valid/invalid inputs
- `test_is_valid_btc_address()`: Test address validation
- `test_calculate_loan_value()`: Verify interest calculations
- `test_is_loan_repaid()`: Test repayment completion logic

### Property-Based Testing

Property-based tests will verify universal properties using **proptest** crate for Rust.

**Configuration**:
- Library: `proptest = "1.4"`
- Minimum iterations per property: 100
- Each property test tagged with: `// Feature: bitfold-vault-integration, Property N: [property text]`

**Property Test Examples**:

```rust
use proptest::prelude::*;

proptest! {
    #[test]
    // Feature: bitfold-vault-integration, Property 9: Max borrowable amount calculation
    fn prop_max_borrowable_calculation(
        amount in 1000u64..100_000_000u64,
        ltv in 1u64..10000u64
    ) {
        let utxo = create_test_utxo(amount);
        let max_borrowable = calculate_max_borrowable(&utxo, ltv);
        let expected = (amount * ltv) / 10000;
        assert_eq!(max_borrowable, expected);
    }
}
```

**Property Tests to Implement**:
- Property 9: Max borrowable calculation for all amounts and LTV ratios
- Property 18: Interest calculation for all loan amounts and rates
- Property 24: Address validation rejects all invalid formats
- Property 25: Txid validation rejects all non-64-hex strings
- Property 28: Query functions don't modify state for any inputs

### Integration Testing

Integration tests will verify:
- Complete flows: deposit → borrow → repay → withdraw
- External API mocking and error scenarios
- State persistence across operations

**Test Scenarios**:
1. Happy path: User deposits UTXO, borrows, repays, withdraws
2. Error path: Invalid UTXO rejection
3. Error path: Borrowing more than LTV allows
4. Error path: Withdrawing locked collateral
5. Concurrent operations: Multiple users, multiple loans

### Testing with Real APIs

**Bitcoin Testnet Testing**:
- Use real Bitcoin testnet addresses and transactions
- Verify UTXO verification with actual blockchain data
- Test with confirmed and unconfirmed transactions

**ckBTC Testnet Testing**:
- Deploy to ICP testnet
- Use ckBTC testnet ledger: `mc6ru-gyaaa-aaaar-qaaaq-cai`
- Test actual token transfers and burns

**Ordinals Testing**:
- Use Maestro testnet API or local indexer
- Test with real inscription IDs from testnet
- Verify metadata retrieval

## Security Considerations

1. **Principal Verification**: Always verify `ic_cdk::api::caller()` matches resource owner
2. **Input Validation**: Validate all inputs before external calls
3. **State Consistency**: Only modify state after all validations pass
4. **Reentrancy Protection**: Use Rust's ownership system to prevent reentrancy
5. **Cycles Management**: Monitor cycles usage for Bitcoin API calls
6. **Rate Limiting**: Consider rate limiting for expensive operations

## Performance Considerations

1. **Bitcoin API Costs**: Each `bitcoin_get_utxos` call costs ~100M cycles
   - Cache UTXO verification results when possible
   - Batch verification requests

2. **State Access**: Use `State::with_read()` for queries to avoid unnecessary borrows

3. **Candid Serialization**: Keep response sizes reasonable for large queries

## Deployment Strategy

### Development Phase
1. Deploy to local dfx replica
2. Use Bitcoin testnet
3. Use ckBTC testnet ledger
4. Mock Ordinals indexer initially

### Testing Phase
1. Deploy to ICP testnet
2. Connect to real Bitcoin testnet API
3. Connect to real ckBTC testnet ledger
4. Integrate Maestro testnet API for Ordinals

### Production Phase
1. Deploy to ICP mainnet
2. Switch to Bitcoin mainnet
3. Use ckBTC mainnet ledger
4. Use production Ordinals indexer

## Future Enhancements

1. **Liquidation System**: Automatic liquidation when LTV exceeds threshold
2. **Price Oracles**: Real-time BTC price feeds for accurate LTV
3. **Compound Interest**: More sophisticated interest calculations
4. **Multi-Collateral**: Support multiple UTXOs per loan
5. **Governance**: DAO-controlled parameters (LTV, interest rates)
6. **Analytics**: Dashboard for vault statistics and health metrics
