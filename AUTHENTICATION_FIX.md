# Authentication Error Fix

## Problem
The application was failing with 403 Forbidden and certificate verification errors when trying to deposit UTXOs:

```
POST http://127.0.0.1:4943/api/v2/canister/bkyz2-fmaaa-aaaaa-qaaaq-cai/call 403 (Forbidden)
Failed to authenticate request due to: Invalid delegation: Invalid canister signature
```

## Root Cause
The frontend was using **mainnet Internet Identity** (`https://identity.ic0.app`) to authenticate with the **local replica** (`http://127.0.0.1:4943`). This caused signature verification failures because:

1. The delegation from mainnet II has a different root key than the local replica
2. The certificate verification fails because the signatures don't match between mainnet and local environments

## Solution
Deploy and use a **local Internet Identity canister** instead of mainnet II for local development.

### Changes Made

1. **Added Internet Identity to dfx.json**
   ```json
   "internet_identity": {
     "type": "custom",
     "candid": "https://github.com/dfinity/internet-identity/releases/latest/download/internet_identity.did",
     "wasm": "https://github.com/dfinity/internet-identity/releases/latest/download/internet_identity_dev.wasm.gz",
     "remote": {
       "id": {
         "ic": "rdmx6-jaaaa-aaaaa-aaadq-cai"
       }
     }
   }
   ```

2. **Deployed Local Internet Identity**
   ```bash
   dfx deploy internet_identity
   ```
   - Canister ID: `bw4dl-smaaa-aaaaa-qaacq-cai`

3. **Updated frontend/src/services/icpAgent.ts**
   - Changed the login function to use local II for local development
   - Updated the default canister ID to `bw4dl-smaaa-aaaaa-qaacq-cai`
   - Identity provider URL: `http://bw4dl-smaaa-aaaaa-qaacq-cai.localhost:4943`

4. **Rebuilt and Redeployed Frontend**
   ```bash
   cd frontend && npm run build
   dfx deploy frontend
   ```

## How to Use

### Option 1: Use the Clear Auth Button (Easiest)

1. **Visit the application**
   - Go to: http://127.0.0.1:4943/?canisterId=br5f7-7uaaa-aaaaa-qaaca-cai

2. **Click the "Clear Auth Data" button**
   - On the Connect Wallet page, scroll down to the Internet Identity section
   - Click the yellow button: "🧹 Clear Auth Data (Fix Connection Issues)"
   - Confirm when prompted
   - The page will refresh automatically

3. **Connect with Internet Identity**
   - Click "Connect Internet Identity"
   - You'll be redirected to the local Internet Identity at `http://bw4dl-smaaa-aaaaa-qaacq-cai.localhost:4943`
   - Create a new anchor (first time) or use existing one
   - Authenticate and return to the app

4. **Try depositing again**
   - The authentication should now work correctly
   - No more 403 Forbidden errors

### Option 2: Manual Browser Cache Clear

1. **Clear your browser cache and local storage**
   - Open DevTools (F12) → Application → Storage → Clear site data
   - Or use incognito/private browsing mode

2. **Refresh the application**
   - Visit: http://127.0.0.1:4943/?canisterId=br5f7-7uaaa-aaaaa-qaaca-cai

3. **Connect with Internet Identity**
   - Follow steps 3-4 from Option 1 above

## Important Notes

- **Local vs Production**: 
  - Local development uses local II (`bw4dl-smaaa-aaaaa-qaacq-cai.localhost:4943`)
  - Production uses mainnet II (`https://identity.ic0.app`)
  
- **Clear Browser Data**: Always clear browser cache/storage when switching between mainnet and local II

- **Canister IDs**:
  - Internet Identity: `bw4dl-smaaa-aaaaa-qaacq-cai`
  - Vault: `bkyz2-fmaaa-aaaaa-qaaaq-cai`
  - Frontend: `br5f7-7uaaa-aaaaa-qaaca-cai`

## Testing

After these changes, you should be able to:
1. ✅ Connect with Internet Identity (local)
2. ✅ Deposit UTXOs without 403 errors
3. ✅ Lock collateral and create loan offers
4. ✅ All authenticated operations work correctly

## Additional Fix: Bitcoin API Verification

### Second Issue Fixed
After fixing authentication, you may encounter:
```
Bitcoin API call failed: (DestinationInvalid, "Canister g4xu7-jiaaa-aaaan-aaaaq-cai not found")
```

**Cause**: Bitcoin API canister only exists on IC mainnet/testnet, not on local replica.

**Solution**: Enabled `SKIP_BITCOIN_VERIFICATION = true` in `canisters/vault/src/bitcoin.rs` for local development.

```rust
// In bitcoin.rs
const SKIP_BITCOIN_VERIFICATION: bool = true; // LOCAL DEV ONLY
```

⚠️ **Important**: This is for local development only! When deploying to testnet/mainnet, change it back to `false`.

The vault canister has been redeployed with this change.

## Troubleshooting

If you still see errors:

1. **Clear browser data completely**
2. **Restart dfx**: `dfx stop && dfx start --clean --background`
3. **Redeploy all canisters**: `dfx deploy`
4. **Check II is running**: Visit `http://bw4dl-smaaa-aaaaa-qaacq-cai.localhost:4943`

## For Testnet Deployment

When deploying to testnet, remember to:

1. **Re-enable Bitcoin verification**:
   ```rust
   const SKIP_BITCOIN_VERIFICATION: bool = false;
   ```

2. **Add cycles to vault canister** (Bitcoin API requires 4B cycles per call)

3. **Use mainnet Internet Identity** (automatic when `VITE_DFX_NETWORK=ic`)
