# Implementation Plan - BitFold Vault Integration

- [x] 1. Fix vault canister structure and dependencies
  - Update `lib.rs` to use modular structure (api, bitcoin, ckbtc, ordinals, state, types, helpers)
  - Update `Cargo.toml` with required dependencies (ic-btc-interface, ic-cdk-timers, serde_json)
  - Ensure all modules are properly connected and exported
  - _Requirements: All_

- [x] 2. Implement Bitcoin integration with ICP Bitcoin API
  - [x] 2.1 Implement `verify_utxo()` function using ICP Bitcoin API
    - Call `bitcoin_get_utxos` management canister method
    - Search returned UTXOs for matching txid and vout
    - Verify amount and address match
    - Return verification result
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Write property test for UTXO verification
    - **Property 1: UTXO verification calls Bitcoin API**
    - **Property 2: Only unspent UTXOs are accepted**
    - **Property 3: UTXO amount must match**
    - **Property 4: UTXO address must match**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

  - [x] 2.3 Implement `get_utxos_for_address()` function
    - Call ICP Bitcoin API with address and min_confirmations
    - Parse and return UTXO list
    - Handle API errors gracefully
    - _Requirements: 1.1_

  - [x] 2.4 Implement `is_utxo_spent()` function
    - Check if UTXO still exists in address's UTXO set
    - Return spent status
    - _Requirements: 2.2_

  - [ ]* 2.5 Write unit tests for Bitcoin integration
    - Test UTXO verification with valid data
    - Test UTXO verification with invalid data
    - Test error handling for API failures
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Implement Ordinals indexer integration
  - [x] 3.1 Implement `verify_ordinal()` using HTTP outcalls to Maestro API
    - Create HTTP request to Maestro API endpoint
    - Parse JSON response for inscription data
    - Return OrdinalInfo if inscription exists, None otherwise
    - Handle API errors and timeouts
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 3.2 Write property test for Ordinals verification
    - **Property 6: Ordinals indexer is queried for all deposits**
    - **Property 7: Inscription metadata is stored when found**
    - **Property 8: UTXOs without inscriptions are accepted**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 3.3 Implement `get_inscription_metadata()` function
    - Query Maestro API for detailed inscription metadata
    - Parse and return OrdinalInfo
    - _Requirements: 3.2_

  - [x] 3.4 Write unit tests for Ordinals integration
    - Test inscription verification with valid inscription
    - Test handling of non-inscription UTXOs
    - Test error handling for indexer failures
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 4. Implement ckBTC ledger integration
  - [ ] 4.1 Implement `transfer_ckbtc()` using ICRC-1 interface
    - Create inter-canister call to ckBTC ledger
    - Call `icrc1_transfer` method with proper arguments
    - Handle transfer result and errors
    - Return block index on success
    - _Requirements: 4.2_

  - [ ] 4.2 Implement `verify_transfer_to_canister()` function
    - Query ckBTC ledger for recent transactions
    - Verify user transferred specified amount to canister
    - Return verification result
    - _Requirements: 5.1_

  - [ ] 4.3 Implement `get_balance()` function
    - Call `icrc1_balance_of` on ckBTC ledger
    - Return balance for specified principal
    - _Requirements: 5.1_

  - [ ]* 4.4 Write property test for ckBTC integration
    - **Property 12: Repayment verifies ckBTC transfer**
    - **Validates: Requirements 5.1**

  - [ ]* 4.5 Write unit tests for ckBTC integration
    - Test ckBTC transfer with valid parameters
    - Test transfer verification
    - Test balance queries
    - Test error handling for ledger failures
    - _Requirements: 4.2, 5.1, 5.2_

- [ ] 5. Update API functions to use real integrations
  - [ ] 5.1 Update `deposit_utxo()` to use real Bitcoin and Ordinals verification
    - Remove mock implementations
    - Call `bitcoin::verify_utxo()` with actual API
    - Call `ordinals::verify_ordinal()` with actual indexer
    - Handle all error cases properly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4_

  - [ ]* 5.2 Write property test for deposit_utxo
    - **Property 5: Failed verification returns error**
    - **Property 21: Invalid inputs are rejected**
    - **Validates: Requirements 1.5, 8.1**

  - [ ] 5.3 Update `borrow()` to use real ckBTC transfer
    - Remove mock ckBTC minting
    - Call `ckbtc::transfer_ckbtc()` with actual ledger
    - Verify transfer success before creating loan
    - Handle transfer failures properly
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 5.4 Write property test for borrow
    - **Property 9: Max borrowable amount calculation**
    - **Property 10: Valid borrow creates loan and locks UTXO**
    - **Property 11: Users can only borrow against owned UTXOs**
    - **Validates: Requirements 4.1, 4.3, 4.5**

  - [ ] 5.5 Update `repay()` to use real ckBTC verification and burning
    - Call `ckbtc::verify_transfer_to_canister()` before processing
    - Remove mock burning implementation
    - Handle verification and burning errors
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 5.6 Write property test for repay
    - **Property 13: Full repayment unlocks collateral**
    - **Property 14: Partial repayment updates amount but keeps lock**
    - **Validates: Requirements 5.3, 5.4**

  - [ ] 5.7 Update `withdraw_collateral()` with proper validation
    - Verify no active loans exist for UTXO
    - Verify caller ownership
    - Update UTXO status to Withdrawn
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 5.8 Write property test for withdraw_collateral
    - **Property 15: Withdrawal requires no active loans**
    - **Property 16: Users can only withdraw owned UTXOs**
    - **Property 17: Successful withdrawal marks UTXO as withdrawn**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [ ] 6. Implement helper functions and validation
  - [ ] 6.1 Update `calculate_max_borrowable()` with proper LTV calculation
    - Implement formula: (amount × LTV) / 10000
    - Add bounds checking
    - _Requirements: 4.1_

  - [ ]* 6.2 Write property test for calculate_max_borrowable
    - **Property 9: Max borrowable amount calculation**
    - **Validates: Requirements 4.1**

  - [ ] 6.3 Update `calculate_loan_value()` with interest calculation
    - Implement formula: borrowed + interest - repaid
    - Calculate interest based on time elapsed
    - _Requirements: 7.1, 7.3, 7.4_

  - [ ]* 6.4 Write property test for loan value calculation
    - **Property 18: Interest calculation is correct**
    - **Property 20: Loan value includes interest**
    - **Validates: Requirements 7.1, 7.4**

  - [ ] 6.5 Improve `is_valid_btc_address()` validation
    - Add proper base58/bech32 format checking
    - Validate address length and characters
    - _Requirements: 8.4_

  - [ ]* 6.6 Write property test for address validation
    - **Property 24: Bitcoin address validation**
    - **Validates: Requirements 8.4**

  - [ ] 6.7 Verify `is_valid_txid()` implementation
    - Ensure 64 hex character validation
    - Test with various invalid formats
    - _Requirements: 8.5_

  - [ ]* 6.8 Write property test for txid validation
    - **Property 25: Transaction ID validation**
    - **Validates: Requirements 8.5**

- [ ] 7. Implement state persistence for canister upgrades
  - [ ] 7.1 Add pre_upgrade and post_upgrade hooks
    - Implement `#[pre_upgrade]` to save state to stable memory
    - Implement `#[post_upgrade]` to restore state from stable memory
    - Use `ic_cdk::storage::stable_save` and `stable_restore`
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 7.2 Write property test for state persistence
    - **Property 29: Canister upgrades preserve loans**
    - **Property 30: Canister upgrades preserve UTXOs**
    - **Property 31: Canister upgrades preserve user mappings**
    - **Property 32: Canister upgrades preserve ID counters**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

  - [ ]* 7.3 Write integration test for upgrade flow
    - Create state before upgrade
    - Simulate upgrade
    - Verify all data preserved
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 8. Add comprehensive error handling
  - [ ] 8.1 Implement error handling pattern for all API functions
    - Validate inputs first
    - Call external APIs without state changes
    - Only modify state after all validations pass
    - Return descriptive errors
    - _Requirements: 8.1, 8.2_

  - [ ]* 8.2 Write property test for error handling
    - **Property 21: Invalid inputs are rejected**
    - **Property 22: API failures don't modify state**
    - **Property 23: Unauthorized actions are rejected**
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [ ] 8.3 Add authorization checks to all update functions
    - Verify caller principal for ownership-based operations
    - Return "Unauthorized" errors for invalid callers
    - _Requirements: 8.3_

- [ ] 9. Implement query functions with proper filtering
  - [ ] 9.1 Verify `get_user_loans()` filters by caller
    - Ensure only caller's loans are returned
    - Test with multiple users
    - _Requirements: 9.1_

  - [ ]* 9.2 Write property test for get_user_loans
    - **Property 26: User loan queries return only user's loans**
    - **Validates: Requirements 9.1**

  - [ ] 9.3 Verify `get_collateral()` filters by caller
    - Ensure only caller's UTXOs are returned
    - Test with multiple users
    - _Requirements: 9.2_

  - [ ]* 9.4 Write property test for get_collateral
    - **Property 27: User collateral queries return only user's UTXOs**
    - **Validates: Requirements 9.2**

  - [ ] 9.5 Verify query functions don't modify state
    - Ensure all query functions use `State::with_read()`
    - Test state before and after queries
    - _Requirements: 9.5_

  - [ ]* 9.6 Write property test for query idempotence
    - **Property 28: Query functions are idempotent**
    - **Validates: Requirements 9.5**

- [ ] 10. Add additional API functions for vault management
  - [ ] 10.1 Implement `liquidate_loan()` function
    - Check if loan LTV exceeds liquidation threshold
    - Transfer collateral to liquidator
    - Mark loan as liquidated
    - _Requirements: 4.1_

  - [ ] 10.2 Implement `get_loan_health()` function
    - Calculate current LTV ratio
    - Return health factor (distance from liquidation)
    - _Requirements: 4.1, 7.1_

  - [ ] 10.3 Implement `get_all_loans()` query function
    - Return all loans in the system (admin function)
    - Include pagination support
    - _Requirements: 9.3_

  - [ ] 10.4 Implement `get_user_stats()` query function
    - Calculate total collateral value for user
    - Calculate total borrowed amount
    - Calculate average LTV
    - Return user statistics
    - _Requirements: 9.1, 9.2_

  - [ ] 10.5 Implement `get_vault_stats()` query function
    - Calculate total value locked (TVL)
    - Calculate total loans outstanding
    - Calculate total number of users
    - Return vault statistics
    - _Requirements: 9.1, 9.2_

  - [ ]* 10.6 Write unit tests for additional functions
    - Test liquidation logic
    - Test health factor calculation
    - Test statistics calculations
    - _Requirements: 4.1, 7.1, 9.1, 9.2_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Build and deploy to local dfx
  - [ ] 12.1 Build vault canister
    - Run `dfx build vault`
    - Fix any compilation errors
    - Verify Candid interface generation

  - [ ] 12.2 Deploy to local replica
    - Start local dfx replica
    - Deploy vault canister
    - Verify deployment success

  - [ ] 12.3 Test basic functionality locally with real testnet data
    - Test deposit_utxo with REAL Bitcoin testnet UTXO
    - Test borrow flow with REAL ckBTC testnet ledger
    - Test repay flow with REAL ckBTC transfers
    - Test withdraw flow with verified data
    - NO MOCK DATA - all tests use real blockchain data

- [ ] 13. Configure for Bitcoin testnet integration
  - [ ] 13.1 Update Bitcoin network configuration
    - Set network to `BitcoinNetwork::Testnet`
    - Configure testnet parameters
    - _Requirements: 1.1_

  - [ ] 13.2 Test with real Bitcoin testnet UTXO
    - Find a real testnet UTXO
    - Test deposit_utxo with real data
    - Verify Bitcoin API integration works
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 14. Configure for ckBTC testnet integration
  - [ ] 14.1 Update ckBTC ledger canister ID
    - Set to testnet ledger: `mc6ru-gyaaa-aaaar-qaaaq-cai`
    - Configure ICRC-1 interface
    - _Requirements: 4.2, 5.1_

  - [ ] 14.2 Test with real ckBTC testnet
    - Test transfer_ckbtc with testnet ledger
    - Test balance queries
    - Verify ckBTC integration works
    - _Requirements: 4.2, 5.1, 5.2_

- [ ] 15. Configure Ordinals indexer integration
  - [ ] 15.1 Set up Maestro API integration
    - Configure API endpoint and key
    - Implement HTTP outcalls
    - _Requirements: 3.1_

  - [ ] 15.2 Test with real Ordinals data
    - Test verify_ordinal with real inscription
    - Test with non-inscription UTXO
    - Verify indexer integration works
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 16. Frontend integration with ICP Agent
  - [ ] 16.1 Add @dfinity/agent dependencies to frontend
    - Install @dfinity/agent, @dfinity/auth-client, @dfinity/candid
    - Update package.json
    - _Requirements: All (Frontend)_

  - [ ] 16.2 Generate Candid declarations for vault canister
    - Run dfx generate to create TypeScript declarations
    - Copy declarations to frontend/src/declarations
    - _Requirements: All (Frontend)_

  - [ ] 16.3 Create ICP Agent service
    - Create frontend/src/services/icpAgent.ts
    - Initialize HttpAgent with local/testnet URL
    - Configure agent for authentication
    - _Requirements: All (Frontend)_

  - [ ] 16.4 Create vault service layer
    - Create frontend/src/services/vaultService.ts
    - Implement depositUtxo() function
    - Implement borrow() function
    - Implement repay() function
    - Implement withdrawCollateral() function
    - Implement getUserLoans() function
    - Implement getCollateral() function
    - _Requirements: All (Frontend)_

  - [ ] 16.5 Add Internet Identity authentication
    - Install @dfinity/auth-client
    - Create authentication context
    - Implement login/logout functions
    - Store authenticated principal
    - _Requirements: All (Frontend)_

  - [ ] 16.6 Update AppContext with canister connection
    - Add vault canister actor to context
    - Add authentication state
    - Add user principal
    - Provide context to all pages
    - _Requirements: All (Frontend)_

  - [ ] 16.7 Update ScanOrdinal page to call deposit_utxo
    - Connect form submission to vaultService.depositUtxo()
    - Handle success/error responses
    - Display transaction result
    - _Requirements: 1.1, 3.1_

  - [ ] 16.8 Update LoanOffer page to call borrow
    - Connect borrow button to vaultService.borrow()
    - Calculate max borrowable amount
    - Handle ckBTC transfer
    - Display loan details
    - _Requirements: 4.1, 4.2_

  - [ ] 16.9 Update Repay page to call repay
    - Connect repayment form to vaultService.repay()
    - Show current loan balance
    - Handle ckBTC transfer verification
    - Update loan status
    - _Requirements: 5.1, 5.2_

  - [ ] 16.10 Update Dashboard page to fetch loans from canister
    - Call vaultService.getUserLoans() on page load
    - Display real loan data
    - Show collateral status
    - Calculate health factors
    - _Requirements: 9.1, 9.2_

  - [ ] 16.11 Update Withdraw page to call withdraw_collateral
    - Connect withdrawal button to vaultService.withdrawCollateral()
    - Verify loan is repaid
    - Handle withdrawal confirmation
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 16.12 Add error handling to all frontend pages
    - Display user-friendly error messages
    - Handle network errors
    - Handle authentication errors
    - Handle canister errors
    - _Requirements: 8.1, 8.2_

  - [ ]* 16.13 Test frontend integration locally
    - Test all pages with local dfx
    - Test authentication flow
    - Test all CRUD operations
    - Test error scenarios
    - _Requirements: All (Frontend)_

- [ ] 17. Final integration testing
  - [ ] 17.1 Test complete flow with real APIs
    - Deposit real testnet UTXO
    - Borrow ckBTC from testnet ledger
    - Repay loan
    - Withdraw collateral

  - [ ] 17.2 Test error scenarios
    - Test with invalid UTXO
    - Test with insufficient collateral
    - Test unauthorized operations

  - [ ] 17.3 Test with Ordinals
    - Deposit UTXO with inscription
    - Verify metadata is stored
    - Complete borrow/repay/withdraw flow

  - [ ] 17.4 Test frontend with real APIs
    - Test deposit with real Bitcoin testnet UTXO
    - Test borrow with real ckBTC testnet
    - Test repay flow
    - Test withdraw flow
    - Verify all UI updates correctly

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Documentation and deployment preparation
  - [ ] 19.1 Update README with deployment instructions
    - Document how to build and deploy
    - Document API endpoints
    - Document testing procedures

  - [ ] 19.2 Document configuration parameters
    - Bitcoin network selection
    - ckBTC ledger canister IDs
    - Ordinals indexer configuration

  - [ ] 19.3 Prepare for testnet deployment
    - Verify all configurations
    - Test deployment script
    - Document deployment process

  - [ ] 19.4 Create demo video script
    - Outline 3-minute demo flow
    - Prepare test data (testnet UTXO, ckBTC)
    - Document key features to showcase
    - Verify all configurations
    - Test deployment script
    - Document deployment process


---

## ⚠️ IMPORTANT: NO MOCK DATA POLICY

**This project uses REAL data from live testnets:**

1. **Bitcoin Integration**: 
   - Uses ICP Bitcoin API connected to Bitcoin testnet
   - All UTXO verifications query real Bitcoin blockchain
   - NO mock Bitcoin responses

2. **ckBTC Integration**:
   - Uses real ckBTC testnet ledger: `mc6ru-gyaaa-aaaar-qaaaq-cai`
   - All transfers/burns interact with real ledger canister
   - NO mock ckBTC operations

3. **Ordinals Integration**:
   - Uses Maestro API for real inscription data
   - Queries real Ordinals indexer on testnet
   - NO mock inscription metadata

4. **Testing**:
   - All tests use real testnet UTXOs
   - All tests verify against real blockchain data
   - Integration tests require actual testnet tokens

**Before starting implementation:**
- Ensure you have access to Bitcoin testnet
- Obtain Maestro API key for Ordinals indexer
- Have testnet ckBTC for testing
- All functions must call real APIs, no mocking allowed
