# BitFold — BTC Ordinals Smart Vault  

**Built for ICP Bitcoin DeFi Hackathon 2025**

Borrow `ckBTC` instantly by locking your Ordinal NFTs as collateral — no bridges, no custodians, 100 % on-chain.

## 🚀 Live Demo

[Watch 3-min Demo Video](https://youtu.be/xcFq9ONV9jc)  

[Live App (Vercel)](https://frontend-1yy7lf8i7-samarabdelhameeds-projects-df99c328.vercel.app/)  

[Live App (ICP)](https://XXXX.ic0.app)

## 🧪 Install & Run Local

### الخطوة 1: تثبيت المشروع

```bash
git clone https://github.com/samarabdelhameed/BitFold
cd BitFold
npm --prefix frontend install
```

### الخطوة 2: تشغيل Local Replica

```bash
dfx start --background --clean
```

انتظر حتى يظهر: `"Replica started"`

### الخطوة 3: Deploy Canisters

```bash
dfx deploy
```

هذا سيقوم بـ:
- Deploy Vault Canister
- Deploy Internet Identity Canister  
- Deploy Frontend Canister

### الخطوة 4: Build Frontend

```bash
npm --prefix frontend run build
```

### الخطوة 5: احصل على Canister IDs

```bash
# Frontend Canister ID (للتطبيق)
dfx canister id frontend

# Vault Canister ID (للتجربة في Candid UI)
dfx canister id vault
```

### الخطوة 6: افتح التطبيق

**افتح المتصفح واذهب إلى:**

```
http://localhost:4943?canisterId=<frontend-canister-id>
```

**أو استخدم الأمر:**

```bash
FRONTEND_ID=$(dfx canister id frontend)
open "http://localhost:4943?canisterId=${FRONTEND_ID}"
```

### 🔧 Candid UI (للتجربة المباشرة مع Canister)

**للتجربة مع Vault Canister مباشرة:**

1. افتح: `http://localhost:4943`
2. أدخل Vault Canister ID في حقل "Provide a canister ID"
3. اضغط "GO"

**أو استخدم الأمر:**

```bash
VAULT_ID=$(dfx canister id vault)
CANDID_UI_ID="bd3sg-teaaa-aaaaa-qaaba-cai"
open "http://localhost:4943/?canisterId=${CANDID_UI_ID}&id=${VAULT_ID}"
```

## 📄 Docs

See `/docs/design.md` for architecture.

## 📬 Contact

Twitter: [@yourhandle](https://twitter.com/yourhandle)


---

## 📝 Implementation Progress

### ✅ Task 1: Fix Vault Canister Structure and Dependencies (Completed)

**Date:** 2025-01-XX

**What was done:**
1. ✅ Updated `lib.rs` to use modular structure
   - Removed old simple implementation
   - Added proper module imports (api, bitcoin, ckbtc, ordinals, state, types, helpers)
   - Cleaned up Candid export

2. ✅ Updated `Cargo.toml` with required dependencies
   - Updated to ic-cdk 0.19 (latest version)
   - Added ic-btc-interface 0.2 for Bitcoin API
   - Added ic-cdk-timers 1.0
   - Added proptest 1.4 for property-based testing
   - Created workspace Cargo.toml in root

3. ✅ Fixed compilation issues
   - Fixed deprecated `caller` function usage
   - Resolved ic-cdk-executor version conflicts
   - Created Candid interface files (.did)

4. ✅ Successfully built and deployed
   - `cargo build` completed successfully
   - `dfx build vault` completed successfully
   - `dfx deploy vault` completed successfully

**Commands used:**
```bash
# Build the canister
cargo build --target wasm32-unknown-unknown --release --manifest-path canisters/vault/Cargo.toml

# Update dependencies
cargo update

# Deploy to local dfx
dfx canister create vault
dfx build vault
dfx deploy vault
```

**Result:**
- ✅ Vault canister deployed successfully
- ✅ Canister ID: `by6od-j4aaa-aaaaa-qaadq-cai`
- ✅ Candid UI: http://127.0.0.1:4943/?canisterId=avqkn-guaaa-aaaaa-qaaea-cai&id=by6od-j4aaa-aaaaa-qaadq-cai
- ✅ All modules properly connected
- ✅ No compilation errors (only warnings for unused functions)

**Next Steps:**
- Task 2: Implement Bitcoin Integration with ICP Bitcoin API
