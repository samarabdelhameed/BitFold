use ic_cdk::*;
use ic_cdk_macros::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::cell::RefCell;

thread_local! {
    static VAULTS: RefCell<HashMap<String, Loan>> = RefCell::new(HashMap::new());
}

#[derive(Clone, Debug, Serialize, Deserialize, candid::CandidType)]
pub struct Loan {
    pub loan_id: String,
    pub borrower: String,
    pub ordinal_utxo: String,
    pub borrowed_ckbtc: u64,
    pub ltv_percent: u8,
    pub status: String,
}

#[update]
fn deposit_utxo(utxo: String, borrower: String) -> String {
    let loan = Loan {
        loan_id: ic_cdk::api::id().to_string(),
        borrower,
        ordinal_utxo: utxo.clone(),
        borrowed_ckbtc: 0,
        ltv_percent: 50,
        status: "LOCKED".to_string(),
    };
    VAULTS.with(|v| v.borrow_mut().insert(utxo.clone(), loan));
    format!("✅ UTXO {} locked successfully!", utxo)
}

#[update]
fn borrow_ckbtc(utxo: String, amount: u64) -> String {
    VAULTS.with(|v| {
        let mut vaults = v.borrow_mut();
        if let Some(loan) = vaults.get_mut(&utxo) {
            loan.borrowed_ckbtc += amount;
            loan.status = "ACTIVE".to_string();
            return format!("💸 Borrowed {} ckBTC against {}", amount, utxo);
        }
    });
    "❌ UTXO not found".to_string()
}

#[update]
fn repay_ckbtc(utxo: String, amount: u64) -> String {
    VAULTS.with(|v| {
        let mut vaults = v.borrow_mut();
        if let Some(loan) = vaults.get_mut(&utxo) {
            if amount >= loan.borrowed_ckbtc {
                loan.borrowed_ckbtc = 0;
                loan.status = "REPAID".to_string();
                return format!("✅ Loan repaid! UTXO {} ready for unlock.", utxo);
            } else {
                loan.borrowed_ckbtc -= amount;
                return format!("✅ Partial repayment: {} ckBTC", amount);
            }
        }
    });
    "❌ UTXO not found".to_string()
}

#[query]
fn get_loan(utxo: String) -> Option<Loan> {
    VAULTS.with(|v| v.borrow().get(&utxo).cloned())
}

#[query]
fn list_loans() -> Vec<Loan> {
    VAULTS.with(|v| v.borrow().values().cloned().collect())
}

candid::export_candid!();
