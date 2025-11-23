use crate::types::{Loan, LoanId, UTXO, UtxoId};
use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;
use std::cell::RefCell;
use std::collections::HashMap;

thread_local! {
    static STATE: RefCell<State> = RefCell::default();
}

#[derive(Default, CandidType, Serialize, Deserialize, Clone)]
pub struct State {
    pub loans: HashMap<LoanId, Loan>,
    pub utxos: HashMap<UtxoId, UTXO>,
    pub user_loans: HashMap<Principal, Vec<LoanId>>,
    pub user_utxos: HashMap<Principal, Vec<UtxoId>>,
    pub next_loan_id: LoanId,
    pub next_utxo_id: UtxoId,
}

impl State {
    pub fn with<F, R>(f: F) -> R
    where
        F: FnOnce(&mut State) -> R,
    {
        STATE.with(|s| f(&mut s.borrow_mut()))
    }

    pub fn with_read<F, R>(f: F) -> R
    where
        F: FnOnce(&State) -> R,
    {
        STATE.with(|s| f(&s.borrow()))
    }

    /// Replaces the entire state (used during post_upgrade)
    pub fn replace(new_state: State) {
        STATE.with(|s| {
            *s.borrow_mut() = new_state;
        });
    }

    /// Gets a clone of the entire state (used during pre_upgrade)
    pub fn get_clone() -> State {
        STATE.with(|s| s.borrow().clone())
    }
}

/// Pre-upgrade hook: saves state to stable memory before canister upgrade
#[ic_cdk::pre_upgrade]
fn pre_upgrade() {
    let state = State::get_clone();
    
    ic_cdk::println!("Pre-upgrade: Saving state...");
    ic_cdk::println!("  - Loans: {}", state.loans.len());
    ic_cdk::println!("  - UTXOs: {}", state.utxos.len());
    ic_cdk::println!("  - Next Loan ID: {}", state.next_loan_id);
    ic_cdk::println!("  - Next UTXO ID: {}", state.next_utxo_id);
    
    ic_cdk::storage::stable_save((state,))
        .expect("Failed to save state to stable memory");
    
    ic_cdk::println!("Pre-upgrade: State saved successfully");
}

/// Post-upgrade hook: restores state from stable memory after canister upgrade
#[ic_cdk::post_upgrade]
fn post_upgrade() {
    let (state,): (State,) = ic_cdk::storage::stable_restore()
        .expect("Failed to restore state from stable memory");
    
    ic_cdk::println!("Post-upgrade: State restored successfully");
    ic_cdk::println!("  - Loans: {}", state.loans.len());
    ic_cdk::println!("  - UTXOs: {}", state.utxos.len());
    ic_cdk::println!("  - Next Loan ID: {}", state.next_loan_id);
    ic_cdk::println!("  - Next UTXO ID: {}", state.next_utxo_id);
    
    State::replace(state);
}

