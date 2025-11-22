use crate::types::{Loan, UTXO};

/// Calculates the maximum borrowable amount based on LTV ratio
pub fn calculate_max_borrowable(utxo: &UTXO, ltv_ratio: u64) -> u64 {
    // LTV ratio is in basis points (e.g., 5000 = 50%)
    // Maximum borrowable = (UTXO amount * LTV) / 10000
    (utxo.amount * ltv_ratio) / 10000
}

/// Calculates current loan value (borrowed + interest)
pub fn calculate_loan_value(loan: &Loan) -> u64 {
    // Simple interest calculation
    // TODO: Implement compound interest if needed
    let interest = (loan.borrowed_amount * loan.interest_rate) / 10000;
    loan.borrowed_amount + interest - loan.repaid_amount
}

/// Checks if a loan is fully repaid
pub fn is_loan_repaid(loan: &Loan) -> bool {
    calculate_loan_value(loan) == 0
}

/// Validates Bitcoin address format
pub fn is_valid_btc_address(address: &str) -> bool {
    // Basic validation - should be improved with actual address format checking
    !address.is_empty() && address.len() >= 26 && address.len() <= 62
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

