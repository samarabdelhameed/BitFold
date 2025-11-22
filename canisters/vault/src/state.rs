use crate::types::{Loan, LoanId, UTXO, UtxoId};
use candid::Principal;
use std::cell::RefCell;
use std::collections::HashMap;

thread_local! {
    static STATE: RefCell<State> = RefCell::default();
}

#[derive(Default)]
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

    pub fn persist() {
        // In a real implementation, this would persist to stable memory
        // For now, state is kept in thread-local storage
    }
}

