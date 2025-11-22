use crate::helpers::*;
use crate::state::State;
use crate::types::*;
use crate::{bitcoin, ckbtc, ordinals};
use ic_cdk::api::msg_caller;

/// Deposits a Bitcoin UTXO as collateral
#[ic_cdk::update]
pub async fn deposit_utxo(request: DepositUtxoRequest) -> Result<UtxoId, String> {
    let caller = msg_caller();
    
    // Validate input
    if !is_valid_txid(&request.txid) {
        return Err("Invalid transaction ID".to_string());
    }
    
    if !is_valid_btc_address(&request.address) {
        return Err("Invalid Bitcoin address".to_string());
    }
    
    // Verify UTXO exists
    let utxo = UTXO {
        id: 0, // Will be set by state
        txid: request.txid.clone(),
        vout: request.vout,
        amount: request.amount,
        address: request.address,
        ordinal_info: request.ordinal_info.clone(),
        status: UtxoStatus::Deposited,
        deposited_at: get_timestamp(),
    };
    
    // Verify UTXO with Bitcoin API
    let verified = bitcoin::verify_utxo(&utxo).await?;
    if !verified {
        return Err("UTXO verification failed".to_string());
    }
    
    // If Ordinal, verify with indexer
    let mut ordinal_info = request.ordinal_info;
    if ordinal_info.is_none() {
        // Try to fetch ordinal info from indexer
        ordinal_info = ordinals::verify_ordinal(&utxo.txid, utxo.vout).await?;
    }
    
    // Store UTXO
    let utxo_id = State::with(|state| {
        let id = state.next_utxo_id;
        state.next_utxo_id += 1;
        
        let mut utxo = utxo;
        utxo.id = id;
        if ordinal_info.is_some() {
            utxo.ordinal_info = ordinal_info;
        }
        
        state.utxos.insert(id, utxo.clone());
        state.user_utxos
            .entry(caller)
            .or_insert_with(Vec::new)
            .push(id);
        
        id
    });
    
    Ok(utxo_id)
}

/// Borrows ckBTC against deposited collateral
#[ic_cdk::update]
pub async fn borrow(request: BorrowRequest) -> Result<LoanId, String> {
    let caller = msg_caller();
    
    // Get UTXO
    let utxo = State::with_read(|state| {
        state.utxos.get(&request.utxo_id).cloned()
    });
    
    let utxo = utxo.ok_or("UTXO not found".to_string())?;
    
    // Check UTXO belongs to caller
    let user_utxos = State::with_read(|state| {
        state.user_utxos.get(&caller).cloned()
    });
    
    if !user_utxos.map(|utxos| utxos.contains(&request.utxo_id)).unwrap_or(false) {
        return Err("UTXO does not belong to caller".to_string());
    }
    
    // Check UTXO is not already locked
    if utxo.status != UtxoStatus::Deposited {
        return Err("UTXO is already locked".to_string());
    }
    
    // Calculate max borrowable (50% LTV)
    let max_borrowable = calculate_max_borrowable(&utxo, 5000);
    if request.amount > max_borrowable {
        return Err(format!("Amount exceeds maximum borrowable: {}", max_borrowable));
    }
    
    // Mint ckBTC
    ckbtc::mint_ckbtc(caller, request.amount).await?;
    
    // Create loan
    let loan_id = State::with(|state| {
        let id = state.next_loan_id;
        state.next_loan_id += 1;
        
        let loan = Loan {
            id,
            user_id: caller,
            collateral_utxo_id: request.utxo_id,
            borrowed_amount: request.amount,
            repaid_amount: 0,
            interest_rate: 500, // 5% annual
            created_at: get_timestamp(),
            status: LoanStatus::Active,
        };
        
        state.loans.insert(id, loan.clone());
        state.user_loans
            .entry(caller)
            .or_insert_with(Vec::new)
            .push(id);
        
        // Lock UTXO
        if let Some(utxo) = state.utxos.get_mut(&request.utxo_id) {
            utxo.status = UtxoStatus::Locked;
        }
        
        id
    });
    
    Ok(loan_id)
}

/// Repays a loan
#[ic_cdk::update]
pub async fn repay(request: RepayRequest) -> Result<(), String> {
    let caller = msg_caller();
    
    // Get loan
    let loan = State::with_read(|state| {
        state.loans.get(&request.loan_id).cloned()
    });
    
    let mut loan = loan.ok_or("Loan not found".to_string())?;
    
    // Check loan belongs to caller
    if loan.user_id != caller {
        return Err("Loan does not belong to caller".to_string());
    }
    
    // Check loan is active
    if loan.status != LoanStatus::Active {
        return Err("Loan is not active".to_string());
    }
    
    // Calculate remaining debt
    let remaining_debt = calculate_loan_value(&loan);
    if request.amount > remaining_debt {
        return Err(format!("Amount exceeds remaining debt: {}", remaining_debt));
    }
    
    // Burn ckBTC (user should have transferred to canister first)
    // TODO: Implement actual ckBTC transfer verification
    ckbtc::burn_ckbtc(caller, request.amount).await?;
    
    // Update loan
    State::with(|state| {
        if let Some(loan) = state.loans.get_mut(&request.loan_id) {
            loan.repaid_amount += request.amount;
            
            // Check if fully repaid
            if is_loan_repaid(loan) {
                loan.status = LoanStatus::Repaid;
                
                // Unlock UTXO
                if let Some(utxo) = state.utxos.get_mut(&loan.collateral_utxo_id) {
                    utxo.status = UtxoStatus::Deposited;
                }
            }
        }
    });
    
    Ok(())
}

/// Withdraws collateral after full repayment
#[ic_cdk::update]
pub async fn withdraw_collateral(utxo_id: UtxoId) -> Result<(), String> {
    let caller = msg_caller();
    
    // Get UTXO
    let utxo = State::with_read(|state| {
        state.utxos.get(&utxo_id).cloned()
    });
    
    let utxo = utxo.ok_or("UTXO not found".to_string())?;
    
    // Check UTXO belongs to caller
    let user_utxos = State::with_read(|state| {
        state.user_utxos.get(&caller).cloned()
    });
    
    if !user_utxos.map(|utxos| utxos.contains(&utxo_id)).unwrap_or(false) {
        return Err("UTXO does not belong to caller".to_string());
    }
    
    // Check UTXO is not locked
    if utxo.status == UtxoStatus::Locked {
        return Err("UTXO is locked as collateral".to_string());
    }
    
    // Check no active loans for this UTXO
    let has_active_loan = State::with_read(|state| {
        state.loans.values().any(|loan| {
            loan.collateral_utxo_id == utxo_id && loan.status == LoanStatus::Active
        })
    });
    
    if has_active_loan {
        return Err("UTXO has active loan".to_string());
    }
    
    // Mark as withdrawn
    State::with(|state| {
        if let Some(utxo) = state.utxos.get_mut(&utxo_id) {
            utxo.status = UtxoStatus::Withdrawn;
        }
    });
    
    Ok(())
}

/// Gets all loans for the caller
#[ic_cdk::query]
pub fn get_user_loans() -> Vec<Loan> {
    let caller = msg_caller();
    
    State::with_read(|state| {
        state.user_loans
            .get(&caller)
            .map(|loan_ids| {
                loan_ids
                    .iter()
                    .filter_map(|id| state.loans.get(id).cloned())
                    .collect()
            })
            .unwrap_or_default()
    })
}

/// Gets all collateral for the caller
#[ic_cdk::query]
pub fn get_collateral() -> Vec<UTXO> {
    let caller = msg_caller();
    
    State::with_read(|state| {
        state.user_utxos
            .get(&caller)
            .map(|utxo_ids| {
                utxo_ids
                    .iter()
                    .filter_map(|id| state.utxos.get(id).cloned())
                    .collect()
            })
            .unwrap_or_default()
    })
}

/// Gets a specific loan
#[ic_cdk::query]
pub fn get_loan(loan_id: LoanId) -> Option<Loan> {
    State::with_read(|state| state.loans.get(&loan_id).cloned())
}

/// Gets a specific UTXO
#[ic_cdk::query]
pub fn get_utxo(utxo_id: UtxoId) -> Option<UTXO> {
    State::with_read(|state| state.utxos.get(&utxo_id).cloned())
}

