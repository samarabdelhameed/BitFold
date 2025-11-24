# BitFold Vault - Complete Demo Script from Start

## 🎬 Demo Flow Overview

**Total Time:** 5-7 minutes  
**Target Audience:** Investors, Developers, Technical Users  
**Goal:** Complete Bitcoin Ordinals lending flow demonstration from project startup

---

## 📋 Prerequisites

Before starting, ensure you have installed:

- **dfx** (Internet Computer SDK)
- **cargo** (Rust package manager)
- **npm** (Node.js package manager)
- **git** (for cloning the code)

---

## 🚀 Part 1: Project Setup & Startup

### Step 1: Prerequisites Check

**[Terminal Command]**

```bash
# Check dfx installation
dfx --version

# Check cargo installation
cargo --version

# Check npm installation
npm --version
```

**[Script Narration]**

> "Welcome to BitFold Vault - the first decentralized lending protocol for Bitcoin Ordinals on the Internet Computer.
>
> Before we begin, let me verify that all required tools are installed on the system. We need dfx SDK for Internet Computer, cargo for building Rust canisters, and npm for building the frontend.
>
> ✅ All prerequisites are ready. Now we'll start running the project."

---

### Step 2: Navigate to Project Directory

**[Terminal Command]**

```bash
cd /Users/s/BitFold
pwd
ls -la
```

**[Script Narration]**

> "We're now in the BitFold project directory. This project is built on Internet Computer Protocol and uses Rust canisters for the backend and React for the frontend.
>
> Let me check the project structure. We have:
>
> - `canisters/` directory containing Rust canisters
> - `frontend/` directory containing React application
> - `dfx.json` file that defines the canister configuration"

---

### Step 3: Stop Previous Processes

**[Terminal Command]**

```bash
# Stop any previous dfx processes
dfx stop 2>/dev/null || true

# Stop any vite processes
pkill -f "dfx start" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Stop any process on port 4943
lsof -ti:4943 | xargs kill -9 2>/dev/null || true

sleep 3
echo "✅ All previous processes stopped"
```

**[Script Narration]**

> "First, I'll stop any previous processes that might be running. This is important to ensure we start from a clean state.
>
> We're stopping:
>
> - Any previous dfx replica
> - Any frontend development servers
> - Any processes using port 4943 which dfx uses"

---

### Step 4: Start DFX Replica

**[Terminal Command]**

```bash
# Start dfx replica in background with clean state
dfx start --background --clean

# Wait for dfx to be ready
sleep 5

# Verify dfx is running
dfx ping
```

**[Script Narration]**

> "Now I'll start the DFX replica. DFX is the development environment for Internet Computer.
>
> The local replica simulates the Internet Computer environment on your machine. We use `--background` to run it in the background and `--clean` to start from a clean state.
>
> ✅ DFX replica is now running. The replica listens on port 4943 and provides a local environment for testing canisters."

---

### Step 5: Build & Deploy Vault Canister

**[Terminal Command]**

```bash
# Build vault canister
echo "📦 Building vault canister..."
dfx deploy vault

# Get Vault Canister ID
VAULT_CANISTER_ID=$(dfx canister id vault)
echo "Vault Canister ID: ${VAULT_CANISTER_ID}"
```

**[Script Narration]**

> "Now I'll build and deploy the Vault Canister. This is the core smart contract of the project.
>
> Vault Canister is written in Rust and contains:
>
> - **State Management**: Managing loan and collateral state
> - **Bitcoin Integration**: Verifying UTXOs on Bitcoin blockchain
> - **Ordinals Verification**: Verifying Bitcoin Ordinals via indexer
> - **ckBTC Integration**: Handling ckBTC minting and burning
>
> DFX performs:
>
> 1. Compile Rust code to WebAssembly (WASM)
> 2. Create canister on the replica
> 3. Install WASM in the canister
>
> ✅ Vault Canister deployed successfully. Canister ID is: [display ID]"

---

### Step 6: Build & Deploy Indexer Stub Canister

**[Terminal Command]**

```bash
# Build indexer_stub canister
echo "📦 Building indexer_stub canister..."
dfx deploy indexer_stub

# Get Indexer Canister ID
INDEXER_CANISTER_ID=$(dfx canister id indexer_stub)
echo "Indexer Canister ID: ${INDEXER_CANISTER_ID}"
```

**[Script Narration]**

> "Now I'll build the Indexer Stub Canister. This canister mocks the Ordinals indexer for local testing.
>
> In production, we'll use a real indexer like Maestro API to verify Bitcoin Ordinals. But for development, we use a stub for testing.
>
> Indexer Stub provides:
>
> - Mock responses for Ordinals queries
> - Test data for inscriptions
> - Simulation of Bitcoin Ordinals verification
>
> ✅ Indexer Stub Canister deployed successfully."

---

### Step 7: Test Vault Canister

**[Terminal Command]**

```bash
# Test get_stats query
echo "🔍 Testing get_stats..."
dfx canister call vault get_stats --query

# Test get_all_vaults query
echo "🔍 Testing get_all_vaults..."
dfx canister call vault get_all_vaults --query

# Test get_supported_ordinal_types query
echo "🔍 Testing get_supported_ordinal_types..."
dfx canister call vault get_supported_ordinal_types --query
```

**[Script Narration]**

> "Let me test that the Vault Canister is working correctly. I'll perform some query calls to verify the state.
>
> Query calls are read-only operations that don't change the state. We're testing:
>
> - `get_stats`: Get general statistics about the vault
> - `get_all_vaults`: Get list of all vaults
> - `get_supported_ordinal_types`: Get supported Ordinal types
>
> ✅ All queries work successfully. The canister is ready for use."

---

### Step 8: Build Frontend

**[Terminal Command]**

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies if not installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Build frontend
echo "🏗️  Building Frontend..."
npm run build

# Return to root directory
cd ..
```

**[Script Narration]**

> "Now I'll build the Frontend Application. The frontend is written in React + TypeScript + Vite.
>
> Frontend uses:
>
> - **React** for UI components
> - **TypeScript** for type safety
> - **Vite** as build tool
> - **@dfinity/agent** for connecting to ICP canisters
> - **Tailwind CSS** for styling
>
> The build process:
>
> 1. Compile TypeScript to JavaScript
> 2. Bundle all assets
> 3. Optimize for production
> 4. Place files in `frontend/dist`
>
> ✅ Frontend built successfully."

---

### Step 9: Deploy Frontend Canister

**[Terminal Command]**

```bash
# Deploy frontend canister
echo "🌐 Deploying Frontend..."
dfx deploy frontend

# Get Frontend Canister ID
FRONTEND_CANISTER_ID=$(dfx canister id frontend)
echo "Frontend Canister ID: ${FRONTEND_CANISTER_ID}"

# Display access links
echo ""
echo "🎉 Project started successfully!"
echo "📱 Frontend URL:"
echo "   http://127.0.0.1:4943/?canisterId=${FRONTEND_CANISTER_ID}"
echo ""
echo "🔧 Vault Canister Candid UI:"
CANDID_UI_ID=$(dfx canister id __Candid_UI 2>/dev/null || echo "bd3sg-teaaa-aaaaa-qaaba-cai")
echo "   http://127.0.0.1:4943/?canisterId=${CANDID_UI_ID}&id=${VAULT_CANISTER_ID}"
```

**[Script Narration]**

> "Now I'll deploy the Frontend Canister. Frontend Canister is an asset canister that serves static files.
>
> Internet Computer allows us to store static assets in a canister. This means the frontend is hosted on ICP without needing traditional web hosting.
>
> ✅ Frontend Canister deployed successfully. Now we can access the application via browser.
>
> Access URL: [display URL]
>
> We can also access Candid UI to test canisters directly."

---

## 🎯 Part 2: Demo Flow - Using the Application

### Step 10: Open Application in Browser

**[Action: Open Browser]**

```
http://127.0.0.1:4943/?canisterId=<FRONTEND_CANISTER_ID>
```

**[Script Narration]**

> "Now let me open the application in the browser. The application runs on the local replica.
>
> As you can see, this is BitFold Vault - the lending platform for Bitcoin Ordinals. The interface is designed to be simple and user-friendly.
>
> The application is connected to the Vault Canister we just deployed. All operations happen on-chain via ICP."

---

### Step 11: Connect Wallet

**[Screen: Homepage / Connect Wallet Page]**

**[Action: Click "Connect Wallet"]**

**[Script Narration]**

> "The first step is to connect the wallet. BitFold uses Internet Identity for authentication.
>
> Internet Identity is a decentralized authentication system on ICP. We don't need private keys or seed phrases - just device authentication.
>
> [After connection] ✅ Wallet connected successfully. Now we can interact with the Vault Canister."

---

### Step 12: Scan Ordinal - Enter UTXO

**[Screen: Scan Ordinal Page]**

**[Action: Enter UTXO]**

```
Example UTXO: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2:0
```

**[Action: Click "Scan UTXO"]**

**[Script Narration]**

> "Now I'll deposit a Bitcoin Ordinal as collateral.
>
> UTXO (Unspent Transaction Output) is the unique identifier for a Bitcoin Ordinal on the blockchain. The format is `txid:vout` where:
>
> - **txid**: Transaction ID on Bitcoin blockchain
> - **vout**: Output index in the transaction
>
> When I click "Scan UTXO", the application:
>
> 1. Sends UTXO to Vault Canister
> 2. Canister calls Bitcoin API to verify UTXO
> 3. Canister calls Ordinals Indexer to verify inscription exists
> 4. If valid, creates a vault entry
>
> [After scanning] ✅ Ordinal verified successfully! The UTXO exists on Bitcoin blockchain and contains an Ordinal inscription."

---

### Step 13: Preview & Deposit

**[Screen: Ordinal Preview Page]**

**[Script Narration]**

> "Here I can see my Ordinal details:
>
> - **Inscription ID**: Unique identifier for the inscription
> - **Value**: UTXO value in BTC
> - **Metadata**: Additional information about the Ordinal
> - **Content Type**: Content type (image, text, etc.)
>
> This Ordinal is worth 1 BTC. I can use it as collateral for a loan."

**[Action: Click "Use as Collateral"]**

**[Script Narration]**

> "When I click "Use as Collateral", the following is executed:
>
> 1. **Update Call** to Vault Canister: `deposit_utxo()`
> 2. Canister verifies:
>    - UTXO exists and is valid
>    - Ordinal exists
>    - User is the owner of the UTXO
> 3. Canister creates Vault entry in state
> 4. UTXO is locked in the vault
>
> [After deposit] ✅ Ordinal deposited successfully! It's now locked in Vault Canister as collateral."

---

### Step 14: Borrow ckBTC

**[Screen: Loan Offer Page]**

**[Script Narration]**

> "Now I can borrow against the collateral. BitFold shows me:
>
> - **Maximum LTV (Loan-to-Value)**: 70% - means I can borrow up to 0.7 ckBTC against my 1 BTC Ordinal
> - **Current Collateral Value**: 1 BTC
> - **Available to Borrow**: 0.7 ckBTC
> - **Interest Rate**: 0% (in this demo)
>
> LTV is the loan-to-collateral value ratio. The lower the ratio, the safer the loan from liquidation."

**[Action: Enter amount: 0.5 ckBTC]**

**[Action: Click "Borrow ckBTC"]**

**[Script Narration]**

> "I'll borrow 0.5 ckBTC - that's 50% LTV, giving me a good safety margin from liquidation.
>
> When I click "Borrow ckBTC", the following is executed:
>
> 1. **Update Call** to Vault Canister: `borrow()`
> 2. Canister verifies:
>    - User has an active vault
>    - Requested amount doesn't exceed maximum LTV
>    - Health factor will be safe after borrowing
> 3. Canister creates Loan entry in state
> 4. Canister calls ckBTC Ledger Canister to **mint** ckBTC
> 5. ckBTC is transferred to user's wallet
>
> [After borrowing] ✅ Loan approved! 0.5 ckBTC transferred to my wallet instantly.
>
> Everything is on-chain and transparent. You can verify the transaction on ICP blockchain."

---

### Step 15: Dashboard

**[Screen: Dashboard]**

**[Script Narration]**

> "In the Dashboard, I can see all loan information:
>
> - **Total Borrowed**: 0.5 ckBTC - currently borrowed amount
> - **Collateral Value**: 1 BTC - collateral value
> - **Loan Health**: 71% - loan health (higher is better)
> - **Active Loans**: 1 - number of active loans
> - **LTV Ratio**: 50% - loan-to-value ratio
>
> **Loan Health** is calculated as:
>
> ```
> Health = (Collateral Value / (Borrowed Amount / LTV Threshold)) * 100
> ```
>
> Everything is transparent and on-chain. I can see:
>
> - Vault ID
> - Loan ID
> - Timestamps
> - Transaction hashes
>
> All this data is stored in Vault Canister state and can be verified."

---

### Step 16: Repay Loan

**[Screen: Repay Page]**

**[Script Narration]**

> "When I'm ready, I can repay the loan. BitFold supports:
>
> - **Partial Repayment**: Partial payment
> - **Full Repayment**: Full payment
>
> I can repay the loan at any time - there's no lock period."

**[Action: Click "FULL" button]**

**[Action: Enter 0.5 ckBTC]**

**[Action: Click "Confirm Repayment"]**

**[Script Narration]**

> "I'll make a full repayment. The process works as follows:
>
> 1. User sends ckBTC to Vault Canister address
> 2. **Update Call** to Vault Canister: `repay()`
> 3. Canister verifies:
>    - Transfer was successful (calls ckBTC Ledger)
>    - Amount is sufficient to repay the loan
> 4. Canister updates Loan state:
>    - Reduces borrowed amount
>    - Updates repayment timestamp
> 5. If repayment is full, Loan is marked as repaid
> 6. Canister calls ckBTC Ledger to **burn** the received ckBTC
>
> [After repayment] ✅ Repayment confirmed! Loan fully repaid.
>
> ckBTC has been burned - this means it's been returned to the Bitcoin network. Everything is on-chain."

---

### Step 17: Withdraw Ordinal

**[Screen: Withdraw Page]**

**[Script Narration]**

> "Now after repaying the loan, I can withdraw my Ordinal.
>
> Vault Canister verifies:
>
> - All loans are repaid
> - No outstanding debts
> - User is the owner of the vault"

**[Action: Click "Confirm Withdrawal"]**

**[Animation: Vault door opens]**

**[Script Narration]**

> "When I click "Confirm Withdrawal":
>
> 1. **Update Call** to Vault Canister: `withdraw_collateral()`
> 2. Canister verifies:
>    - All loans are repaid
>    - Health factor is safe
> 3. Canister updates Vault state:
>    - Removes UTXO from locked state
>    - Updates withdrawal timestamp
> 4. UTXO is now free to use
>
> [After withdrawal] ✅ Success! Ordinal unlocked and ready to withdraw to Bitcoin wallet.
>
> The Ordinal never left the Bitcoin blockchain - it was only locked in the smart contract. This is non-custodial lending."

---

## 🎬 Part 3: Conclusion

### Step 18: Show Technical Features

**[Screen: Success/Congrats Page]**

**[Script Narration]**

> "And that's BitFold Vault!
>
> We've seen how the system works from the beginning:
>
> ✅ **Project Setup**:
>
> - Starting DFX replica
> - Building and deploying Rust canisters
> - Building React frontend
>
> ✅ **Deposit Bitcoin Ordinals**:
>
> - Verifying UTXO on Bitcoin blockchain
> - Verifying Ordinals via indexer
> - Locking in Vault Canister
>
> ✅ **Borrow ckBTC**:
>
> - Instant loans without interest
> - ckBTC minting from Ledger Canister
> - On-chain transparency
>
> ✅ **Repay Flexibly**:
>
> - Partial or full repayment
> - ckBTC burning
> - State updates
>
> ✅ **Withdraw NFTs**:
>
> - Non-custodial - Ordinals never left Bitcoin
> - Secure smart contract logic
>
> **Technical Features:**
>
> - **Native Bitcoin Integration**: Using ICP Bitcoin API for direct blockchain verification
> - **Ordinals Support**: Full support for Bitcoin Ordinals via indexer integration
> - **ckBTC Integration**: Using ckBTC Ledger Canister for minting and burning
> - **Smart Contract Security**: All operations on-chain and verifiable
> - **Zero Custody Risk**: Ordinals remain on Bitcoin blockchain
> - **Real-time Verification**: Instant verification of UTXOs and Ordinals
>
> **Architecture:**
>
> - **Backend**: Rust canisters on Internet Computer
> - **Frontend**: React + TypeScript + Vite
> - **State Management**: Persistent canister state
> - **Integration**: Bitcoin API, Ordinals Indexer, ckBTC Ledger
>
> Try BitFold Vault today at bitfold.io"

---

## 📊 Test Data for Demo

### Bitcoin Testnet UTXO

```
TXID: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
VOUT: 0
Amount: 100000000 sats (1 BTC)
Address: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
```

### ckBTC Testnet

- Ensure wallet has ckBTC for repayment
- Testnet Ledger: `mc6ru-gyaaa-aaaar-qaaaq-cai`

### Ordinal Inscription (Optional)

- Inscription ID: `a1b2c3d4...i0`
- Content Type: `image/png`
- Preview: Sample Bitcoin NFT image

---

## 🔧 Useful Commands During Demo

### View Canister Logs

```bash
dfx canister logs vault
dfx canister logs indexer_stub
```

### Test Canister Calls

```bash
# Query calls (read-only)
dfx canister call vault get_stats --query
dfx canister call vault get_all_vaults --query

# Update calls (state-changing)
dfx canister call vault deposit_utxo '(...)'
dfx canister call vault borrow '(...)'
```

### Rebuild Canister

```bash
dfx build vault
dfx deploy vault
```

### Stop Project

```bash
dfx stop
```

---

## 📝 Recording Notes

### Camera Angles

1. **Full screen** - Show entire interface
2. **Zoom in** - Focus on important details
3. **Smooth transitions** - Between pages

### Pacing

- Speak clearly and confidently
- Pause after each action
- Let animations complete
- Keep energy high

### Visual Effects

- Highlight cursor movements
- Add text overlays for key points
- Use checkmarks ✅ for completed steps
- Show loading states

### Technical Terminology

- Use technical terms accurately:
  - **Canister**: Smart contract on ICP
  - **UTXO**: Unspent Transaction Output
  - **LTV**: Loan-to-Value ratio
  - **Mint/Burn**: Creating/destroying ckBTC
  - **Update Call/Query Call**: Types of canister calls
  - **State**: Stored canister state
  - **On-chain**: On blockchain

---

## 🎯 Key Technical Points to Emphasize

1. **Internet Computer Native**: Everything runs on ICP without bridges
2. **Bitcoin Integration**: Direct verification from Bitcoin blockchain
3. **Ordinals Support**: Full support for Bitcoin NFTs
4. **Smart Contract Security**: Logic protected in canisters
5. **Non-Custodial**: Ordinals never leave Bitcoin blockchain
6. **Real-time**: Instant verification of transactions
7. **Transparent**: Everything on-chain and verifiable

---

**Demo Script Version:** 2.0  
**Last Updated:** January 2025  
**Status:** Ready for Recording 🎬  
**Language:** English (Technical Terminology Maintained)
