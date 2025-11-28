use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

pub type LoanId = u64;
pub type UtxoId = u64;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Loan {
    pub id: LoanId,
    pub user_id: Principal,
    pub collateral_utxo_id: UtxoId,
    pub borrowed_amount: u64, // in satoshis
    pub repaid_amount: u64,   // in satoshis
    pub interest_rate: u64,   // basis points (e.g., 500 = 5%)
    pub created_at: u64,      // timestamp in nanoseconds
    pub status: LoanStatus,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum LoanStatus {
    Active,
    Repaid,
    Liquidated,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UTXO {
    pub id: UtxoId,
    pub txid: String,
    pub vout: u32,
    pub amount: u64, // in satoshis
    pub address: String,
    pub ordinal_info: Option<OrdinalInfo>,
    pub status: UtxoStatus,
    pub deposited_at: u64, // timestamp
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum UtxoStatus {
    Deposited,
    Locked, // Used as collateral
    Withdrawn,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct OrdinalInfo {
    pub inscription_id: String,
    pub content_type: String,
    pub content_preview: Option<String>,
    pub metadata: Option<String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct DepositUtxoRequest {
    pub txid: String,
    pub vout: u32,
    pub amount: u64,
    pub address: String,
    pub ordinal_info: Option<OrdinalInfo>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct BorrowRequest {
    pub utxo_id: UtxoId,
    pub amount: u64, // in satoshis
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct RepayRequest {
    pub loan_id: LoanId,
    pub amount: u64, // in satoshis
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct LoanOffer {
    pub id: u64,
    pub user_id: Principal,
    pub utxo_id: UtxoId,
    pub max_borrowable: u64, // in satoshis
    pub ltv_percent: u64,    // LTV percentage (e.g., 50 = 50%)
    pub status: LoanOfferStatus,
    pub created_at: u64, // timestamp in nanoseconds
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum LoanOfferStatus {
    Active,
    Accepted, // When loan is created from this offer
    Expired,
    Cancelled,
}

// ============================================================================
// Additional Types for Vault Management (Task 10)
// ============================================================================

/// Loan health information
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct LoanHealth {
    pub loan_id: LoanId,
    pub current_ltv: u64,           // Current LTV in basis points
    pub liquidation_threshold: u64, // Liquidation threshold in basis points
    pub health_factor: u64,         // Health factor (100 = 1.0)
    pub can_be_liquidated: bool,    // Whether loan can be liquidated
    pub collateral_value: u64,      // Collateral value in satoshis
    pub loan_value: u64,            // Current loan value in satoshis
}

/// User statistics
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UserStats {
    pub total_collateral_value: u64, // Total collateral in satoshis
    pub total_borrowed: u64,         // Total borrowed amount
    pub total_debt: u64,             // Total debt (borrowed + interest - repaid)
    pub active_loans_count: u64,     // Number of active loans
    pub total_utxos_count: u64,      // Number of UTXOs
    pub average_ltv: u64,            // Average LTV in basis points
}

/// Vault statistics
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VaultStats {
    pub total_value_locked: u64,      // Total value locked in satoshis
    pub total_loans_outstanding: u64, // Total loans outstanding
    pub active_loans_count: u64,      // Number of active loans
    pub total_users: u64,             // Number of unique users
    pub total_utxos: u64,             // Total number of UTXOs
    pub utilization_rate: u64,        // Utilization rate in basis points
}

/// Paginated loans response
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct LoansPage {
    pub loans: Vec<Loan>,
    pub total: u64,
    pub offset: u64,
    pub limit: u64,
}

// ============================================================================
// Advanced Features: Multi-sig, Time-locks, Runes
// ============================================================================

/// Multi-signature configuration
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct MultiSigConfig {
    pub required_signatures: u32,          // Number of signatures required
    pub total_signers: u32,                // Total number of signers
    pub signer_principals: Vec<Principal>, // Principals who can sign
    pub taproot_address: Option<String>,   // Taproot address for multi-sig
}

/// Time-lock configuration
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TimeLockConfig {
    pub unlock_timestamp: u64,          // Unix timestamp when funds unlock
    pub auto_withdraw: bool,            // Automatically withdraw when unlocked
    pub beneficiary: Option<Principal>, // Optional beneficiary if user doesn't withdraw
}

/// Runes information (re-exported from runes module)
pub use crate::runes::RuneInfo;

/// Enhanced UTXO with Runes and advanced features
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct EnhancedUTXO {
    pub utxo: UTXO,
    pub runes: Option<Vec<RuneInfo>>,      // Runes in this UTXO
    pub multi_sig: Option<MultiSigConfig>, // Multi-sig configuration
    pub time_lock: Option<TimeLockConfig>, // Time-lock configuration
    pub taproot_address: Option<String>,   // Taproot address if applicable
}

/// Dead man switch configuration
/// Automatically transfers funds if user stops logging in
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct DeadManSwitch {
    pub user_id: Principal,
    pub last_activity: u64,        // Last activity timestamp
    pub inactivity_threshold: u64, // Seconds of inactivity before trigger
    pub beneficiary: Principal,    // Who receives funds if triggered
    pub enabled: bool,             // Whether dead man switch is enabled
}
