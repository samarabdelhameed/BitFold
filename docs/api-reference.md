# API Reference

## Vault Canister API

### Update Methods

#### `deposit_utxo`
Deposits a Bitcoin UTXO as collateral.

**Parameters**:
- `utxo`: UTXO details (txid, vout, amount, address)
- `ordinal_info`: Optional Ordinals information

**Returns**: `Result<UtxoId, String>`

#### `borrow`
Borrows ckBTC against deposited collateral.

**Parameters**:
- `utxo_id`: ID of collateral UTXO
- `amount`: Amount of ckBTC to borrow (in satoshis)

**Returns**: `Result<LoanId, String>`

#### `repay`
Repays a portion or full amount of a loan.

**Parameters**:
- `loan_id`: ID of the loan
- `amount`: Amount of ckBTC to repay (in satoshis)

**Returns**: `Result<(), String>`

#### `withdraw_collateral`
Withdraws collateral after full loan repayment.

**Parameters**:
- `utxo_id`: ID of the UTXO to withdraw

**Returns**: `Result<(), String>`

### Query Methods

#### `get_user_loans`
Gets all loans for a user.

**Parameters**:
- `user_id`: Principal ID of the user

**Returns**: `Vec<Loan>`

#### `get_collateral`
Gets all collateral for a user.

**Parameters**:
- `user_id`: Principal ID of the user

**Returns**: `Vec<UTXO>`

#### `get_loan`
Gets details of a specific loan.

**Parameters**:
- `loan_id`: ID of the loan

**Returns**: `Option<Loan>`

#### `get_utxo`
Gets details of a specific UTXO.

**Parameters**:
- `utxo_id`: ID of the UTXO

**Returns**: `Option<UTXO>`

## Data Types

### Loan
```rust
pub struct Loan {
    pub id: LoanId,
    pub user_id: Principal,
    pub collateral_utxo_id: UtxoId,
    pub borrowed_amount: u64,  // in satoshis
    pub repaid_amount: u64,     // in satoshis
    pub interest_rate: u64,     // basis points
    pub created_at: u64,        // timestamp
    pub status: LoanStatus,
}
```

### UTXO
```rust
pub struct UTXO {
    pub id: UtxoId,
    pub txid: String,
    pub vout: u32,
    pub amount: u64,            // in satoshis
    pub address: String,
    pub ordinal_info: Option<OrdinalInfo>,
    pub status: UtxoStatus,
}
```

