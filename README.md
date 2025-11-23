# BitFold — BTC Ordinals Smart Vault  

**Built for ICP Bitcoin DeFi Hackathon 2025**

Borrow `ckBTC` instantly by locking your Ordinal NFTs as collateral — no bridges, no custodians, 100 % on-chain.

## 🚀 Live Demo

[Watch 3-min video](https://youtu.be/XXXX)  

[Live App](https://XXXX.ic0.app)

## 🧪 Install & Run Local

```bash
git clone https://github.com/samarabdelhameed/BitFold
cd BitFold
dfx start --background --clean
dfx deploy
npm --prefix frontend install
npm --prefix frontend run build
```

Open http://localhost:4943?canisterId=<frontend-id>

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
