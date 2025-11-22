use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

pub type LoanId = u64;
pub type UtxoId = u64;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Loan {
    pub id: LoanId,
    pub user_id: Principal,
    pub collateral_utxo_id: UtxoId,
    pub borrowed_amount: u64,  // in satoshis
    pub repaid_amount: u64,   // in satoshis
    pub interest_rate: u64,    // basis points (e.g., 500 = 5%)
    pub created_at: u64,       // timestamp in nanoseconds
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
    pub amount: u64,           // in satoshis
    pub address: String,
    pub ordinal_info: Option<OrdinalInfo>,
    pub status: UtxoStatus,
    pub deposited_at: u64,      // timestamp
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum UtxoStatus {
    Deposited,
    Locked,      // Used as collateral
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
    pub amount: u64,  // in satoshis
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct RepayRequest {
    pub loan_id: LoanId,
    pub amount: u64,  // in satoshis
}

