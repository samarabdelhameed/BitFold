# Complete Implementation Plan - BitFold BTC Ordinals Smart Vault

## 📋 Current Status Summary

### ✅ What Has Been Completed:

1. **Basic Structure**:

   - Organized canisters (vault, indexer_stub, governance)
   - Complete React frontend with all pages
   - Types and State management ready
   - API endpoints defined in `api.rs`

2. **Existing Issues**:
   - `lib.rs` in vault uses old simple code instead of organized files
   - Bitcoin/ckBTC/Ordinals functions are all mock (TODO)
   - Frontend is not actually connected to canisters
   - No integration with ICP Bitcoin API
   - No integration with ckBTC ledger

---

## 🎯 Implementation Plan - Step by Step

### **Phase 1: Fix Basic Structure of Vault Canister** (Day 1)

#### Step 1.1: Update `lib.rs` to Use Organized Files

- Delete old code from `lib.rs`
- Import and use `api.rs`, `types.rs`, `state.rs`
- Ensure all modules are connected correctly

#### Step 1.2: Update `Cargo.toml` to Add Required Dependencies

- Add `ic-bitcoin` or `ic-cdk` for Bitcoin API
- Add `icrc-ledger` for ckBTC
- Add any other required dependencies

#### Step 1.3: Test Basic Structure

- `dfx build` to ensure no errors
- `dfx deploy` to ensure the canister works

---

### **Phase 2: Implement Bitcoin Integration** (Day 1-2)

#### Step 2.1: Implement `bitcoin.rs` - UTXO Verification

```rust
// Use ICP Bitcoin API
use ic_btc_types::*;
use ic_cdk::api::management_canister::bitcoin::*;

// verify_utxo function:
// 1. Call get_utxos to get UTXOs
// 2. Verify the required UTXO exists
// 3. Verify UTXO is not spent
// 4. Verify amount and address
```

#### Step 2.2: Add Additional Bitcoin Functions

- `get_utxos_for_address()` - Get all UTXOs for an address
- `wait_for_confirmation()` - Wait for transaction confirmation
- `check_utxo_spent()` - Verify UTXO hasn't been spent

#### Step 2.3: Test Bitcoin Integration

- Test on Bitcoin testnet
- Verify UTXO verification works

---

### **Phase 3: Implement Ordinals Indexer Integration** (Day 2)

#### Step 3.1: Implement `ordinals.rs` - Ordinals Verification

```rust
// Option 1: Use Maestro API (HTTP outcall)
// Option 2: Use local indexer canister
// Option 3: Mock indexer for dev/test

// verify_ordinal function:
// 1. Call indexer to verify inscription
// 2. Fetch metadata (content_type, content_preview)
// 3. Verify provenance
```

#### Step 3.2: Update `indexer_stub` Canister

- Add mock functions for Ordinals verification
- Add test data for testing

#### Step 3.3: Test Ordinals Integration

- Test with real Ordinal on testnet
- Verify metadata fetching works correctly

---

### **Phase 4: Implement ckBTC Integration** (Day 2-3)

#### Step 4.1: Implement `ckbtc.rs` - Mint/Burn/Transfer

```rust
// Use ICRC-1 interface for ckBTC ledger
use icrc_ledger_types::*;

// mint_ckbtc function:
// 1. Call ckBTC minter canister
// 2. Mint ckBTC to user
// 3. Verify success

// burn_ckbtc function:
// 1. Verify user sent ckBTC to canister
// 2. Call burn on ledger
// 3. Update loan state
```

#### Step 4.2: Add ckBTC Balance Checking

- Function to check user's ckBTC balance
- Function to check canister balance

#### Step 4.3: Test ckBTC Integration

- Test on ckBTC dev ledger
- Verify mint/burn/transfer

---

### **Phase 5: Complete API Functions** (Day 3)

#### Step 5.1: Review and Update `api.rs`

- Ensure all functions use Bitcoin/ckBTC/Ordinals integrations
- Add comprehensive error handling
- Add input validation

#### Step 5.2: Add Additional Functions

- `liquidate_loan()` - For automatic liquidation
- `get_loan_health()` - Calculate health factor
- `calculate_interest()` - Calculate interest

#### Step 5.3: Add Query Functions

- `get_all_loans()` - Get all loans
- `get_user_stats()` - User statistics
- `get_vault_stats()` - Vault statistics

---

### **Phase 6: Frontend Integration** (Day 4)

#### Step 6.1: Setup ICP Agent in Frontend

```typescript
// Add @dfinity/agent
// Setup connection to canisters
// Create service for vault canister
```

#### Step 6.2: Create Service Layer

```typescript
// services/vaultService.ts
// - depositUtxo()
// - borrow()
// - repay()
// - withdraw()
// - getLoans()
```

#### Step 6.3: Update Pages to Use Services

- `ScanOrdinal.tsx` - Call deposit_utxo
- `LoanOffer.tsx` - Call borrow
- `Repay.tsx` - Call repay
- `Dashboard.tsx` - Fetch loans from canister
- `Withdraw.tsx` - Call withdraw_collateral

#### Step 6.4: Add Wallet Connection

- Internet Identity integration
- Bitcoin wallet connection (optional)
- Store Principal in context

---

### **Phase 7: Testing & Debugging** (Day 5)

#### Step 7.1: Unit Tests

- Test all functions in vault canister
- Test helpers and calculations

#### Step 7.2: Integration Tests

- Test complete flow: deposit → borrow → repay → withdraw
- Test error cases

#### Step 7.3: Frontend Testing

- Test all pages
- Test integration with canisters
- Test error handling in UI

---

### **Phase 8: Deployment & Demo** (Day 5-6)

#### Step 8.1: Local Deployment

- `dfx deploy` on local replica
- Test everything works locally

#### Step 8.2: Testnet Deployment

- Deploy on ICP testnet
- Test with Bitcoin testnet
- Test with ckBTC testnet

#### Step 8.3: Setup Demo Video

- Record 3-minute video
- Show complete flow
- Explain technologies used

---

## 📝 Recommended Implementation Order

### Day 1:

1. ✅ Fix `lib.rs` and connect all modules
2. ✅ Update `Cargo.toml` with dependencies
3. ✅ Implement `bitcoin.rs` - UTXO verification
4. ✅ Test Bitcoin integration

### Day 2:

1. ✅ Implement `ordinals.rs` - Ordinals verification
2. ✅ Update `indexer_stub` canister
3. ✅ Implement `ckbtc.rs` - Mint/Burn
4. ✅ Test ckBTC integration

### Day 3:

1. ✅ Complete `api.rs` with all integrations
2. ✅ Add comprehensive error handling
3. ✅ Add additional query functions
4. ✅ Unit tests for canister

### Day 4:

1. ✅ Setup ICP Agent in frontend
2. ✅ Create service layer
3. ✅ Update all pages
4. ✅ Add wallet connection

### Day 5:

1. ✅ Integration tests
2. ✅ Frontend testing
3. ✅ Debugging and fixing issues
4. ✅ Local deployment

### Day 6:

1. ✅ Testnet deployment
2. ✅ Final testing
3. ✅ Record Demo video
4. ✅ Setup README and documentation

---

## 🔧 Files That Need Modification

### Backend (Rust):

1. `canisters/vault/src/lib.rs` - **Needs complete rewrite**
2. `canisters/vault/src/bitcoin.rs` - **Actual implementation**
3. `canisters/vault/src/ckbtc.rs` - **Actual implementation**
4. `canisters/vault/src/ordinals.rs` - **Actual implementation**
5. `canisters/vault/src/api.rs` - **Review and update**
6. `canisters/vault/src/helpers.rs` - **Review**
7. `canisters/vault/Cargo.toml` - **Add dependencies**
8. `canisters/indexer_stub/src/lib.rs` - **Improve mock functions**

### Frontend (TypeScript):

1. `frontend/src/services/vaultService.ts` - **Create new**
2. `frontend/src/contexts/AppContext.tsx` - **Add canister connection**
3. `frontend/src/pages/ScanOrdinal.tsx` - **Connect to canister**
4. `frontend/src/pages/LoanOffer.tsx` - **Connect to canister**
5. `frontend/src/pages/Repay.tsx` - **Connect to canister**
6. `frontend/src/pages/Dashboard.tsx` - **Connect to canister**
7. `frontend/src/pages/Withdraw.tsx` - **Connect to canister**
8. `frontend/package.json` - **Add @dfinity/agent**

---

## 🚨 Important Implementation Points

### 1. Bitcoin API Integration:

- Use `ic_btc_types` and `ic_cdk::api::management_canister::bitcoin`
- Ensure using Bitcoin testnet for testing
- Verify confirmations before considering UTXO trusted

### 2. ckBTC Integration:

- Use ICRC-1 interface
- Get ckBTC ledger canister ID from testnet
- Ensure error handling is correct

### 3. Ordinals Verification:

- Start with mock indexer for dev
- Move to Maestro API or indexer canister later
- Verify inscription_id correctly

### 4. Error Handling:

- Add Result types in all functions
- Clear error messages
- Logging for errors

### 5. Security:

- Verify caller in all update functions
- Verify ownership before any operation
- Rate limiting (optional)

---

## 📚 Reading Resources

1. **ICP Bitcoin Integration**:

   - https://internetcomputer.org/docs/current/developer-docs/integrations/bitcoin/

2. **ckBTC Documentation**:

   - https://internetcomputer.org/docs/current/developer-docs/defi/ckbtc/

3. **ICRC-1 Standard**:

   - https://github.com/dfinity/ICRC-1

4. **Ordinals Indexer (Maestro)**:
   - https://docs.gomaestro.org/

---

## ✅ Pre-Submission Checklist

- [ ] All functions in vault canister work
- [ ] Bitcoin UTXO verification works
- [ ] Ordinals verification works
- [ ] ckBTC mint/burn works
- [ ] Frontend connected to canisters
- [ ] All pages work
- [ ] Comprehensive error handling
- [ ] Tests exist
- [ ] Complete documentation
- [ ] Demo video ready
- [ ] Deployed on testnet

---

## 🎬 Final Notes

1. **Start Simple**: Implement mock functions first, then replace with actual implementation
2. **Test Continuously**: After each function, test it
3. **Use Testnet**: Don't test on mainnet
4. **Document Everything**: Write comments and documentation
5. **Focus on MVP**: You don't need all features, just the basics for the demo

---

**Ready to start? Begin with Phase 1! 🚀**
