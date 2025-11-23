# Implementation Plan - BitFold Testnet Deployment

## Overview
This implementation plan guides the complete deployment of BitFold Vault to ICP testnet with integration to Bitcoin testnet, ckBTC testnet, and Maestro Ordinals API. Each task is designed to be executed step-by-step with clear verification steps.

---

## Phase 1: Identity and Cycles Setup

- [x] 1. Set up dfx identity for testnet deployment
  - [x] 1.1 Verify dfx installation and version
    - Run `dfx --version` to check dfx is installed
    - Ensure version is 0.15.0 or higher
    - Update dfx if needed: `sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"`
    - _Requirements: 1.1_

  - [x] 1.2 Create or verify testnet identity
    - Check current identity: `dfx identity whoami`
    - List all identities: `dfx identity list`
    - Create new identity if needed: `dfx identity new testnet_identity`
    - Switch to testnet identity: `dfx identity use testnet_identity`
    - _Requirements: 1.1, 1.2_

  - [x] 1.3 Get and record principal ID
    - Get principal: `dfx identity get-principal`
    - Record principal ID in deployment notes
    - Verify principal format (should end with -cai or similar)
    - _Requirements: 1.3_

  - [x] 1.4 Get and record account ID
    - Get account ID: `dfx ledger account-id`
    - Record account ID for cycles wallet creation
    - This will be used for receiving cycles
    - _Requirements: 2.3_

- [ ] 2. Acquire cycles from ICP faucet
  - [x] 2.1 Access ICP cycles faucet
    - Open browser and go to: https://faucet.dfinity.org
    - Click "Request Cycles" or similar button
    - _Requirements: 2.1_

  - [ ] 2.2 Authenticate with Internet Identity
    - Click "Internet Identity" login
    - Create new Internet Identity if you don't have one
    - Complete authentication process
    - _Requirements: 2.1_

  - [ ] 2.3 Request free cycles
    - Enter your principal ID from step 1.3
    - Request 20 trillion cycles (free tier)
    - Wait for confirmation (usually takes 1-5 minutes)
    - Check email or faucet page for confirmation
    - _Requirements: 2.2_

  - [ ] 2.4 Verify cycles received
    - Check cycles wallet balance: `dfx wallet balance --network ic`
    - If wallet doesn't exist, create it: `dfx identity deploy-wallet --network ic`
    - Verify balance shows ~20T cycles
    - Record wallet canister ID
    - _Requirements: 2.2, 2.5_

---

## Phase 2: Maestro API Configuration

- [ ] 3. Obtain Maestro API key for Ordinals
  - [ ] 3.1 Register for Maestro account
    - Go to: https://www.gomaestro.org
    - Click "Sign Up" or "Get Started"
    - Fill in registration form (email, password)
    - Verify email address
    - _Requirements: 7.1_

  - [ ] 3.2 Create API key for Bitcoin testnet
    - Log in to Maestro dashboard
    - Navigate to "API Keys" section
    - Click "Create New API Key"
    - Select "Bitcoin Testnet" as network
    - Give it a name (e.g., "BitFold Testnet")
    - _Requirements: 7.2_

  - [ ] 3.3 Copy and secure API key
    - Copy the generated API key
    - Store it securely (password manager or secure notes)
    - DO NOT commit it to git
    - Record the key for next step
    - _Requirements: 7.2_

  - [ ] 3.4 Configure API key in vault code
    - Open file: `canisters/vault/src/ordinals.rs`
    - Find line: `const MAESTRO_API_KEY: &str = "";`
    - Replace with: `const MAESTRO_API_KEY: &str = "YOUR_ACTUAL_API_KEY";`
    - Save the file
    - _Requirements: 7.3_

  - [ ] 3.5 Verify API key configuration
    - Check the file was saved correctly
    - Ensure no extra spaces or quotes
    - Verify the key is not empty
    - _Requirements: 7.3_

---

## Phase 3: Vault Canister Configuration and Deployment

- [x] 4. Configure vault for testnet
  - [x] 4.1 Verify Bitcoin network configuration
    - Open file: `canisters/vault/src/bitcoin.rs`
    - Find: `const BITCOIN_NETWORK`
    - Verify it's set to: `BitcoinNetwork::Testnet`
    - If not, update it
    - _Requirements: 8.1_

  - [x] 4.2 Verify ckBTC ledger configuration
    - Open file: `canisters/vault/src/ckbtc.rs`
    - Find: `const CKBTC_LEDGER_CANISTER_ID`
    - Verify it's set to: `"mc6ru-gyaaa-aaaar-qaaaq-cai"` (testnet)
    - If not, update it
    - _Requirements: 8.2_

  - [x] 4.3 Verify Maestro API configuration
    - Open file: `canisters/vault/src/ordinals.rs`
    - Verify `MAESTRO_API_KEY` is set (from step 3.4)
    - Verify `MAESTRO_API_BASE_URL` is: `"https://api.gomaestro.org/v1"`
    - _Requirements: 8.3_

- [ ] 5. Build vault canister
  - [x] 5.1 Clean previous builds
    - Run: `dfx build --clean`
    - This ensures fresh build
    - _Requirements: 3.1_

  - [x] 5.2 Build vault canister for IC network
    - Run: `dfx build vault --network ic`
    - Wait for compilation to complete (may take 2-5 minutes)
    - Check for any compilation errors
    - If errors occur, fix them and rebuild
    - _Requirements: 3.1_

  - [x] 5.3 Verify Candid interface generation
    - Check file exists: `canisters/vault/vault.did`
    - Open and verify it contains all expected methods
    - Verify types are correctly defined
    - _Requirements: 3.1_

- [ ] 6. Deploy vault canister to testnet
  - [x] 6.1 Deploy vault to IC network
    - Run: `dfx deploy vault --network ic`
    - Wait for deployment (may take 1-3 minutes)
    - Watch for any errors
    - _Requirements: 3.1, 3.2_

  - [ ] 6.2 Record vault canister ID
    - Copy the canister ID from deployment output
    - Format: `xxxxx-xxxxx-xxxxx-xxxxx-cai`
    - Save it in deployment notes
    - You'll need this for frontend configuration
    - _Requirements: 3.2_

  - [ ] 6.3 Verify vault deployment
    - Check canister status: `dfx canister status vault --network ic`
    - Should show "Status: Running"
    - Check cycles balance is positive
    - _Requirements: 3.3, 12.1_

  - [ ] 6.4 Test vault canister is accessible
    - Try a simple query: `dfx canister call vault get_vault_stats --network ic`
    - Should return statistics (even if empty)
    - If error, check deployment logs
    - _Requirements: 3.3, 12.3_

---

## Phase 4: Bitcoin Testnet Setup

- [x] 7. Set up Bitcoin testnet wallet
  - [ ] 7.1 Choose wallet method
    - Option A: Electrum (desktop, recommended for development)
    - Option B: Online wallet (browser-based, easier)
    - Choose based on your preference
    - _Requirements: 4.1_

  - [ ] 7.2 Create Bitcoin testnet wallet (Electrum method)
    - Download Electrum from: https://electrum.org
    - Install and open Electrum
    - Go to File → New/Restore
    - Choose "Standard wallet" → "Create new seed"
    - IMPORTANT: Select "Testnet" mode in settings
    - Write down seed phrase securely
    - _Requirements: 4.1, 4.5_

  - [ ] 7.3 Create Bitcoin testnet wallet (Online method)
    - Go to: https://testnet.demo.btcpayserver.org
    - Create account or use guest mode
    - Generate new testnet wallet
    - Save backup/seed phrase
    - _Requirements: 4.1, 4.5_

  - [ ] 7.4 Get receiving address
    - In wallet, click "Receive" or "Generate Address"
    - Copy the testnet address
    - Should start with 'tb1' (bech32) or 'm'/'n' (legacy)
    - Record this address for next steps
    - _Requirements: 4.4_

- [-] 8. Acquire Bitcoin testnet UTXOs
  - [ ] 8.1 Request Bitcoin from Coinfaucet
    - Go to: https://coinfaucet.eu/en/btc-testnet/
    - Paste your testnet address from step 7.4
    - Complete any CAPTCHA
    - Click "Get Bitcoins"
    - Wait for confirmation (usually 10-30 minutes)
    - _Requirements: 5.1_

  - [ ] 8.2 Request Bitcoin from Mempool faucet (if needed)
    - Go to: https://testnet-faucet.mempool.co
    - Paste your testnet address
    - Request testnet Bitcoin
    - Wait for confirmation
    - _Requirements: 5.1_

  - [x] 8.3 Verify Bitcoin received in wallet
    - Check wallet balance
    - Should show incoming transaction
    - Wait for at least 1 confirmation
    - _Requirements: 5.2_

  - [ ] 8.4 Find UTXO details on block explorer
    - Go to: https://blockstream.info/testnet/
    - Search for your testnet address
    - Click on the transaction that sent you Bitcoin
    - Find your output (the one with your address)
    - _Requirements: 5.3_

  - [ ] 8.5 Extract and record UTXO information
    - Record TXID (64 hex characters)
    - Record VOUT (output index, usually 0 or 1)
    - Record Amount (in satoshis, e.g., 100000 = 0.001 BTC)
    - Record Address (your testnet address)
    - Verify UTXO is unspent (should show as "Unspent")
    - _Requirements: 5.4, 5.5_

---

## Phase 5: ckBTC Testnet Setup

- [ ] 9. Acquire ckBTC testnet tokens
  - [ ] 9.1 Access ckBTC faucet
    - Go to: https://faucet.dfinity.org
    - This is the same faucet as cycles
    - _Requirements: 6.1_

  - [ ] 9.2 Request ckBTC testnet tokens
    - Log in with Internet Identity (same as step 2.2)
    - Look for "ckBTC Testnet" option
    - Enter your principal ID (from step 1.3)
    - Request tokens (usually 0.1 - 1.0 ckBTC)
    - Wait for confirmation
    - _Requirements: 6.1, 6.2_

  - [ ] 9.3 Verify ckBTC balance
    - Run command to check balance:
    ```bash
    dfx canister call mc6ru-gyaaa-aaaar-qaaaq-cai icrc1_balance_of \
      '(record { owner = principal "YOUR_PRINCIPAL_FROM_STEP_1.3"; subaccount = null })' \
      --network ic
    ```
    - Should return a positive balance
    - Record the balance amount
    - _Requirements: 6.3, 6.4_

  - [ ] 9.4 Test ckBTC transfer (optional)
    - Try transferring small amount to vault canister
    - Use vault canister ID from step 6.2
    - Verify transfer succeeds
    - _Requirements: 6.3_

---

## Phase 6: Frontend Configuration and Deployment

- [x] 10. Configure frontend for testnet
  - [x] 10.1 Update frontend environment variables
    - Create or edit: `frontend/.env.production`
    - Add: `VITE_VAULT_CANISTER_ID=<vault_canister_id_from_step_6.2>`
    - Add: `VITE_DFX_NETWORK=ic`
    - Save the file
    - _Requirements: 10.4_

  - [x] 10.2 Update canister IDs in frontend
    - Edit: `frontend/src/services/icpAgent.ts`
    - Update vault canister ID if hardcoded
    - Ensure it uses environment variable
    - _Requirements: 10.4_

  - [x] 10.3 Build frontend
    - Navigate to frontend directory: `cd frontend`
    - Install dependencies: `npm install`
    - Build for production: `npm run build`
    - Verify `dist` folder is created
    - Return to root: `cd ..`
    - _Requirements: 10.1_

- [ ] 11. Deploy frontend canister
  - [ ] 11.1 Deploy frontend to IC network
    - Run: `dfx deploy frontend --network ic`
    - Wait for asset upload (may take 2-5 minutes)
    - Watch for completion message
    - _Requirements: 10.2_

  - [ ] 11.2 Record frontend canister ID and URL
    - Copy frontend canister ID from output
    - Frontend URL format: `https://<canister-id>.ic0.app`
    - Save both in deployment notes
    - _Requirements: 10.2_

  - [ ] 11.3 Access frontend in browser
    - Open the frontend URL in browser
    - Verify page loads without errors
    - Check browser console for any errors
    - _Requirements: 10.3_

  - [ ] 11.4 Test Internet Identity login
    - Click login button
    - Complete Internet Identity authentication
    - Verify you're logged in
    - Check principal is displayed
    - _Requirements: 10.4_

---

## Phase 7: End-to-End Testing

- [ ] 12. Test deposit flow with real Bitcoin testnet UTXO
  - [ ] 12.1 Prepare UTXO data
    - Get UTXO details from step 8.5
    - Have TXID, VOUT, Amount, Address ready
    - _Requirements: 9.1_

  - [ ] 12.2 Test deposit via dfx command line
    - Run deposit command:
    ```bash
    dfx canister call vault deposit_utxo \
      '(record { 
        txid = "YOUR_TXID"; 
        vout = YOUR_VOUT; 
        amount = YOUR_AMOUNT; 
        address = "YOUR_ADDRESS" 
      })' \
      --network ic
    ```
    - Should return success with UTXO ID
    - If error, check UTXO is still unspent
    - _Requirements: 9.1_

  - [ ] 12.3 Test deposit via frontend
    - Go to "Scan Ordinal" or "Deposit" page
    - Enter UTXO details
    - Submit form
    - Verify success message
    - Check UTXO appears in dashboard
    - _Requirements: 9.1_

  - [ ] 12.4 Verify UTXO stored in vault
    - Query collateral: `dfx canister call vault get_collateral --network ic`
    - Should show your deposited UTXO
    - Verify all details match
    - _Requirements: 9.1_

- [ ] 13. Test borrow flow with real ckBTC
  - [ ] 13.1 Calculate max borrowable amount
    - Check UTXO amount from step 12
    - Calculate: (amount × 7000) / 10000 = max borrowable (70% LTV)
    - Example: 100000 sats × 0.7 = 70000 sats max
    - _Requirements: 9.2_

  - [ ] 13.2 Test borrow via dfx command line
    - Get UTXO ID from step 12.2 or 12.4
    - Run borrow command:
    ```bash
    dfx canister call vault borrow \
      '(record { 
        utxo_id = YOUR_UTXO_ID; 
        amount = YOUR_BORROW_AMOUNT 
      })' \
      --network ic
    ```
    - Should return success with loan ID
    - _Requirements: 9.2_

  - [ ] 13.3 Verify ckBTC received
    - Check your ckBTC balance (step 9.3 command)
    - Balance should increase by borrowed amount
    - _Requirements: 9.2_

  - [ ] 13.4 Test borrow via frontend
    - Go to "Loan Offer" page
    - Select your UTXO
    - Enter borrow amount
    - Click "Borrow"
    - Verify success and loan appears
    - _Requirements: 9.2_

- [ ] 14. Test repay flow
  - [ ] 14.1 Transfer ckBTC to vault canister
    - Get vault canister ID from step 6.2
    - Get loan amount from step 13
    - Transfer ckBTC to vault:
    ```bash
    dfx canister call mc6ru-gyaaa-aaaar-qaaaq-cai icrc1_transfer \
      '(record { 
        to = record { owner = principal "VAULT_CANISTER_ID"; subaccount = null }; 
        amount = LOAN_AMOUNT; 
        fee = null; 
        memo = null; 
        created_at_time = null 
      })' \
      --network ic
    ```
    - Record the block index returned
    - _Requirements: 9.3_

  - [ ] 14.2 Test repay via dfx command line
    - Get loan ID from step 13.2
    - Run repay command:
    ```bash
    dfx canister call vault repay \
      '(record { 
        loan_id = YOUR_LOAN_ID; 
        amount = REPAY_AMOUNT 
      })' \
      --network ic
    ```
    - Should return success
    - _Requirements: 9.3_

  - [ ] 14.3 Verify loan status updated
    - Query loan: `dfx canister call vault get_loan '(YOUR_LOAN_ID)' --network ic`
    - Should show status as "Repaid"
    - UTXO should be unlocked
    - _Requirements: 9.3_

  - [ ] 14.4 Test repay via frontend
    - Go to "Repay" page
    - Select your loan
    - Enter repayment amount
    - Click "Repay"
    - Verify success message
    - _Requirements: 9.3_

- [ ] 15. Test withdraw flow
  - [ ] 15.1 Test withdraw via dfx command line
    - Get UTXO ID from step 12
    - Ensure loan is repaid (step 14)
    - Run withdraw command:
    ```bash
    dfx canister call vault withdraw_collateral '(YOUR_UTXO_ID)' --network ic
    ```
    - Should return success
    - _Requirements: 9.4_

  - [ ] 15.2 Verify UTXO marked as withdrawn
    - Query UTXO: `dfx canister call vault get_utxo '(YOUR_UTXO_ID)' --network ic`
    - Status should be "Withdrawn"
    - _Requirements: 9.4_

  - [ ] 15.3 Test withdraw via frontend
    - Go to "Withdraw" page
    - Select your UTXO
    - Click "Withdraw"
    - Verify success message
    - _Requirements: 9.4_

- [ ] 16. Test Ordinals inscription flow (if available)
  - [ ] 16.1 Find a testnet UTXO with inscription
    - Search for testnet inscriptions on Maestro
    - Or use a known testnet inscription UTXO
    - Record TXID, VOUT, Amount, Address
    - _Requirements: 9.5_

  - [ ] 16.2 Deposit UTXO with inscription
    - Use deposit flow from step 12
    - Vault should query Maestro API
    - Should store inscription metadata
    - _Requirements: 9.5_

  - [ ] 16.3 Verify inscription metadata stored
    - Query UTXO details
    - Check ordinal_info field is populated
    - Verify inscription_id, content_type present
    - _Requirements: 9.5_

---

## Phase 8: Documentation and Verification

- [ ] 17. Document deployment results
  - [ ] 17.1 Create deployment summary document
    - Create file: `TESTNET_DEPLOYMENT.md`
    - Record all canister IDs
    - Record frontend URL
    - Record principal ID
    - _Requirements: 11.3_

  - [ ] 17.2 Document test results
    - Record successful test scenarios
    - Document any issues encountered
    - Note any workarounds used
    - _Requirements: 11.4_

  - [ ] 17.3 Record resource information
    - Bitcoin testnet address
    - ckBTC balance
    - Cycles remaining
    - Maestro API usage
    - _Requirements: 11.3_

- [ ] 18. Verify canister health and monitoring
  - [ ] 18.1 Check all canister statuses
    - Vault: `dfx canister status vault --network ic`
    - Frontend: `dfx canister status frontend --network ic`
    - All should show "Running"
    - _Requirements: 12.1_

  - [ ] 18.2 Check cycles balances
    - Vault cycles: Should be > 1T
    - Frontend cycles: Should be > 500B
    - If low, top up from cycles wallet
    - _Requirements: 12.2_

  - [ ] 18.3 Test canister methods
    - Test get_vault_stats
    - Test get_user_loans
    - Test get_collateral
    - All should respond without errors
    - _Requirements: 12.3_

  - [ ] 18.4 Check canister logs
    - View vault logs: `dfx canister logs vault --network ic`
    - Look for any errors or warnings
    - Verify successful operations logged
    - _Requirements: 12.4, 12.5_

---

## Phase 9: Final Verification and Handoff

- [ ] 19. Final system verification
  - [ ] 19.1 Verify all integrations working
    - Bitcoin API: Deposit test passed
    - ckBTC Ledger: Borrow/repay tests passed
    - Maestro API: Ordinals test passed (if applicable)
    - Frontend: All pages accessible
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 19.2 Verify documentation complete
    - Deployment summary created
    - All IDs and URLs recorded
    - Test results documented
    - Troubleshooting notes added
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ] 19.3 Create quick reference guide
    - List all important commands
    - List all canister IDs and URLs
    - List all API keys and resources
    - Save as `QUICK_REFERENCE.md`
    - _Requirements: 11.5_

- [ ] 20. Prepare for mainnet (future)
  - [ ] 20.1 Document mainnet differences
    - Bitcoin mainnet vs testnet
    - ckBTC mainnet canister ID
    - Maestro mainnet API
    - Cycles requirements (higher)
    - _Requirements: 11.3_

  - [ ] 20.2 Create mainnet deployment checklist
    - Copy this tasks file
    - Update for mainnet parameters
    - Add additional security checks
    - Add backup procedures
    - _Requirements: 11.1_

  - [ ] 20.3 Document rollback procedures
    - How to revert to previous version
    - How to backup state
    - How to restore from backup
    - Emergency contacts
    - _Requirements: 11.2_

---

## 🎯 Success Criteria

Deployment is considered successful when:
- ✅ All canisters deployed and running on IC testnet
- ✅ Vault canister verified with real Bitcoin testnet UTXO
- ✅ Borrow flow completed with real ckBTC testnet tokens
- ✅ Repay flow completed successfully
- ✅ Withdraw flow completed successfully
- ✅ Frontend accessible and functional
- ✅ All integrations (Bitcoin, ckBTC, Maestro) working
- ✅ Documentation complete with all IDs and URLs
- ✅ Canister health verified (running, positive cycles)

---

## 📞 Support Resources

If you encounter issues:
- **ICP Discord**: https://discord.gg/jnjVVQaE2C
- **ICP Forum**: https://forum.dfinity.org
- **Bitcoin Testnet Faucets**: https://en.bitcoin.it/wiki/Testnet#Faucets
- **dfx Documentation**: https://internetcomputer.org/docs/current/developer-docs/
- **ckBTC Documentation**: https://internetcomputer.org/docs/current/developer-docs/integrations/bitcoin/ckbtc

---

## ⚠️ Important Notes

1. **Testnet Only**: This deployment is for TESTNET only. Do not use mainnet parameters.
2. **API Keys**: Never commit API keys to version control. Use environment variables or secure storage.
3. **Cycles**: Monitor cycles balance regularly. Canisters freeze when cycles run out.
4. **Backups**: Always backup identity PEM files and seed phrases.
5. **Rate Limits**: Respect faucet rate limits (usually 24 hours between requests).
6. **Confirmations**: Wait for Bitcoin confirmations before testing (1-3 confirmations recommended).
7. **Testing**: Test thoroughly on testnet before considering mainnet deployment.

---

## 🚀 Ready to Start!

You can now begin executing tasks one by one. Start with Phase 1, Task 1.1 and work through sequentially. Each task has clear instructions and verification steps.

**Good luck with your deployment! 🎉**
