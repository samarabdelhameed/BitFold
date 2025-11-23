use crate::types::{Loan, UTXO};

/// Calculates the maximum borrowable amount based on LTV ratio
/// 
/// # Arguments
/// * `utxo` - The UTXO to use as collateral
/// * `ltv_ratio` - Loan-to-Value ratio in basis points (e.g., 5000 = 50%)
/// 
/// # Returns
/// Maximum borrowable amount in satoshis
/// 
/// # Formula
/// Maximum borrowable = (UTXO amount × LTV) / 10000
/// 
/// # Bounds
/// - LTV ratio must be between 0 and 10000 (0% to 100%)
/// - Result will never exceed UTXO amount
pub fn calculate_max_borrowable(utxo: &UTXO, ltv_ratio: u64) -> u64 {
    // Bounds checking: LTV ratio should not exceed 10000 (100%)
    let safe_ltv = if ltv_ratio > 10000 { 10000 } else { ltv_ratio };
    
    // Calculate max borrowable: (amount × LTV) / 10000
    let max_borrowable = (utxo.amount * safe_ltv) / 10000;
    
    // Additional safety: ensure result doesn't exceed collateral amount
    if max_borrowable > utxo.amount {
        utxo.amount
    } else {
        max_borrowable
    }
}

/// Calculates current loan value (borrowed + interest - repaid)
/// 
/// # Arguments
/// * `loan` - The loan to calculate value for
/// 
/// # Returns
/// Current loan value in satoshis (amount still owed)
/// 
/// # Formula
/// Loan value = borrowed_amount + interest - repaid_amount
/// Interest = (borrowed_amount × interest_rate) / 10000
/// 
/// # Notes
/// - Interest rate is in basis points (e.g., 500 = 5%)
/// - Uses simple interest calculation
/// - Returns 0 if fully repaid
pub fn calculate_loan_value(loan: &Loan) -> u64 {
    // Calculate simple interest: (borrowed × rate) / 10000
    let interest = (loan.borrowed_amount * loan.interest_rate) / 10000;
    
    // Total debt = borrowed + interest
    let total_debt = loan.borrowed_amount.saturating_add(interest);
    
    // Remaining debt = total - repaid (saturating_sub prevents underflow)
    total_debt.saturating_sub(loan.repaid_amount)
}

/// Checks if a loan is fully repaid
pub fn is_loan_repaid(loan: &Loan) -> bool {
    calculate_loan_value(loan) == 0
}

/// Validates Bitcoin address format
/// 
/// # Arguments
/// * `address` - Bitcoin address string to validate
/// 
/// # Returns
/// `true` if address format is valid, `false` otherwise
/// 
/// # Validation Rules
/// - Length must be between 26 and 62 characters
/// - Must not be empty
/// - Must contain only alphanumeric characters
/// 
/// # Supported Formats
/// - Legacy (P2PKH): starts with '1'
/// - Script (P2SH): starts with '3'
/// - SegWit (Bech32): starts with 'bc1' or 'tb1'
/// - Testnet: starts with 'm' or 'n'
/// - Generic: any alphanumeric string (for testing/flexibility)
/// 
/// # Note
/// This is a basic format validation. For production, consider using
/// a full Bitcoin address validation library with checksum verification.
pub fn is_valid_btc_address(address: &str) -> bool {
    // Check if empty
    if address.is_empty() {
        return false;
    }
    
    // Check length bounds (26-62 characters)
    let len = address.len();
    if len < 26 || len > 62 {
        return false;
    }
    
    // Check that all characters are alphanumeric
    // This allows for flexibility in testing while still providing basic validation
    address.chars().all(|c| c.is_ascii_alphanumeric())
}

/// Validates transaction ID format
pub fn is_valid_txid(txid: &str) -> bool {
    // Bitcoin txid is 64 hex characters
    txid.len() == 64 && txid.chars().all(|c| c.is_ascii_hexdigit())
}

/// Gets current timestamp in nanoseconds
pub fn get_timestamp() -> u64 {
    ic_cdk::api::time()
}

