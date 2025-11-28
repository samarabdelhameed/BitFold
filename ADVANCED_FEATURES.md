# 🚀 Advanced Features - BitFold Hackathon Submission

## Overview

BitFold now includes all advanced features required for winning the first place in the ICP Bitcoin DeFi Hackathon:

1. ✅ **Threshold Schnorr Signatures** - For Taproot transactions (Ordinals/Runes)
2. ✅ **Runes Support** - Full Runes protocol integration
3. ✅ **Solana Integration** - Cross-chain BTC-SOL swaps
4. ✅ **vetKeys** - Secure encryption and threshold decryption
5. ✅ **Advanced Features** - Multi-sig, time-locks, dead man switch

---

## 1. Threshold Schnorr Signatures 🔐

### Implementation
- **File**: `canisters/vault/src/schnorr.rs`
- **Purpose**: Enable Taproot transactions for Ordinals/Runes using Threshold Schnorr signatures

### Features
- Create Taproot addresses using Threshold Schnorr
- Sign Taproot transactions
- Multi-sig Taproot support
- Verify Schnorr signatures

### API Functions
```rust
// Create Taproot address
create_taproot_address() -> Result<String, String>

// Sign Taproot transaction
sign_taproot_transaction(message: Vec<u8>, derivation_path: Vec<Vec<u8>>) 
    -> Result<SchnorrSignResponse, String>

// Create multi-sig Taproot address
create_multisig_taproot(required_signatures: u32, total_signers: u32) 
    -> Result<String, String>
```

### Usage Example
```rust
// Create a Taproot address for Ordinals/Runes
let address = create_taproot_address().await?;

// Sign a Taproot transaction
let signature = sign_taproot_transaction(
    transaction_bytes,
    derivation_path
).await?;
```

---

## 2. Runes Support 🪙

### Implementation
- **File**: `canisters/vault/src/runes.rs`
- **Purpose**: Support Bitcoin Runes protocol alongside Ordinals

### Features
- Verify Runes in UTXOs
- Get Rune balances for addresses
- Convert Runes to OrdinalInfo for compatibility
- Full Runes metadata support

### API Functions
```rust
// Deposit UTXO with Runes support
deposit_utxo_with_runes(request: DepositUtxoRequest) -> Result<UtxoId, String>

// Get Rune balances
get_rune_balances(address: String) -> Result<Vec<RuneBalance>, String>
```

### RuneInfo Structure
```rust
pub struct RuneInfo {
    pub rune_id: String,
    pub name: String,
    pub symbol: Option<String>,
    pub divisibility: u8,
    pub supply: u64,
    pub premine: u64,
    pub terms: Option<RuneTerms>,
    pub etching_txid: String,
    pub etching_block: u64,
}
```

---

## 3. Solana Integration 🔄

### Implementation
- **File**: `canisters/vault/src/solana.rs`
- **Purpose**: Enable cross-chain functionality with Solana

### Features
- Query Solana account balances
- Create BTC-SOL swaps
- Verify Solana transactions
- Get Solana token balances (SPL tokens)

### API Functions
```rust
// Get Solana balance
get_solana_balance(address: String, network: SolanaNetwork) -> Result<u64, String>

// Create BTC-SOL swap
create_btc_sol_swap(sol_address: String, sol_amount: u64, network: SolanaNetwork) 
    -> Result<SolanaTransactionResponse, String>
```

### Supported Networks
- Mainnet
- Testnet
- Devnet

---

## 4. vetKeys Integration 🔒

### Implementation
- **File**: `canisters/vault/src/vetkeys.rs`
- **Purpose**: Secure encryption, threshold decryption, and privacy-preserving features

### Features
- Encrypt user data with vetKeys
- Threshold decryption
- Encrypted notes application
- Password manager support

### API Functions
```rust
// Encrypt user data
encrypt_user_data(data: Vec<u8>) -> Result<EncryptResponse, String>

// Decrypt user data
decrypt_user_data(ciphertext: Vec<u8>) -> Result<DecryptResponse, String>

// Create encrypted note
create_encrypted_note(note_content: String) -> Result<EncryptResponse, String>

// Get encrypted note
get_encrypted_note(ciphertext: Vec<u8>) -> Result<String, String>
```

### Use Cases
- Password managers
- Secure note applications
- Private key storage
- Encrypted user data

---

## 5. Advanced Features ⚡

### Multi-Signature Support
- Create multi-sig Taproot addresses
- Configure required signatures
- Support for multiple signers

### Time-Locks
- Lock funds until a specific timestamp
- Auto-withdraw when unlocked
- Beneficiary configuration

### Dead Man Switch
- Automatically transfer funds if user stops logging in
- Configurable inactivity threshold
- Beneficiary assignment

### API Functions
```rust
// Setup dead man switch
setup_dead_man_switch(
    inactivity_threshold_seconds: u64,
    beneficiary: Principal
) -> Result<(), String>

// Update activity (keep dead man switch from triggering)
update_activity() -> Result<(), String>
```

---

## Integration with Existing Features

All advanced features integrate seamlessly with existing BitFold functionality:

1. **Runes + Ordinals**: Both can be used as collateral
2. **Schnorr + Bitcoin**: Taproot addresses work with standard Bitcoin UTXOs
3. **Solana + ckBTC**: Cross-chain swaps between BTC and SOL
4. **vetKeys + Security**: Encrypted storage for sensitive data
5. **Multi-sig + Loans**: Multi-signature collateral support

---

## Testing

### Local Development
```bash
# Build the canister
cd canisters/vault
cargo build --target wasm32-unknown-unknown --release

# Deploy
dfx deploy vault
```

### Test Functions
```bash
# Create Taproot address
dfx canister call vault create_taproot_address

# Deposit UTXO with Runes
dfx canister call vault deposit_utxo_with_runes '(record {...})'

# Get Solana balance
dfx canister call vault get_solana_balance '("address", variant {Mainnet})'

# Encrypt data
dfx canister call vault encrypt_user_data '(vec {0; 1; 2})'
```

---

## Documentation

- **Threshold Schnorr**: See `canisters/vault/src/schnorr.rs`
- **Runes**: See `canisters/vault/src/runes.rs`
- **Solana**: See `canisters/vault/src/solana.rs`
- **vetKeys**: See `canisters/vault/src/vetkeys.rs`
- **API**: See `canisters/vault/src/api.rs` (lines 750+)

---

## Hackathon Compliance ✅

All required features for winning first place:

- ✅ **ckBTC Integration** - Already implemented
- ✅ **Direct Bitcoin Access** - Already implemented
- ✅ **Threshold Schnorr Signatures** - ✅ NEW
- ✅ **Ordinals Support** - Already implemented
- ✅ **Runes Support** - ✅ NEW
- ✅ **Solana RPC Integration** - ✅ NEW
- ✅ **vetKeys** - ✅ NEW
- ✅ **Advanced Features** - ✅ NEW (multi-sig, time-locks, dead man switch)

---

## Next Steps

1. **Production Deployment**: Deploy to ICP testnet/mainnet
2. **Testing**: Comprehensive testing with real Bitcoin/Solana networks
3. **Security Audit**: Review all new features
4. **Documentation**: Complete API documentation
5. **Demo Video**: Showcase all features in action

---

**Status**: ✅ All advanced features implemented and ready for hackathon submission!

