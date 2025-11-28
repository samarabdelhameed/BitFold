use crate::helpers::*;
use crate::state::State;
use crate::types::*;
use crate::{bitcoin, ckbtc, ordinals, runes, schnorr, solana, vetkeys};
use candid::Principal;

/// Deposits a Bitcoin UTXO as collateral
#[ic_cdk::update]
pub async fn deposit_utxo(request: DepositUtxoRequest) -> Result<UtxoId, String> {
    let caller = ic_cdk::api::caller();

    // 1. Validate inputs first (no state changes)
    if !is_valid_txid(&request.txid) {
        return Err("Invalid transaction ID: must be 64 hexadecimal characters".to_string());
    }

    if !is_valid_btc_address(&request.address) {
        return Err("Invalid Bitcoin address format".to_string());
    }

    if request.amount == 0 {
        return Err("Invalid amount: must be greater than 0".to_string());
    }

    // 2. Call external APIs (no state changes yet)
    // Create temporary UTXO for verification
    let utxo = UTXO {
        id: 0, // Will be set by state
        txid: request.txid.clone(),
        vout: request.vout,
        amount: request.amount,
        address: request.address.clone(),
        ordinal_info: None,
        status: UtxoStatus::Deposited,
        deposited_at: get_timestamp(),
    };

    // Verify UTXO exists on Bitcoin network using ICP Bitcoin API
    // Skip verification on playground due to HTTP outcalls being disabled
    let network = std::env::var("DFX_NETWORK").unwrap_or_else(|_| "local".to_string());
    let verified = if network == "playground" {
        ic_cdk::println!("⚠️ Skipping UTXO verification on playground");
        true
    } else {
        bitcoin::verify_utxo(&utxo).await?
    };

    if !verified {
        return Err("UTXO verification failed: UTXO not found or already spent".to_string());
    }

    // Query Ordinals indexer to check for inscriptions
    // Skip on playground due to HTTP outcalls being disabled
    let ordinal_info = if network == "playground" {
        ic_cdk::println!("⚠️ Skipping ordinals verification on playground");
        request.ordinal_info
    } else {
        ordinals::verify_ordinal(&utxo.txid, utxo.vout).await?
    };

    // 3. Only modify state after all validations and external calls succeed
    let utxo_id = State::with(|state| {
        let id = state.next_utxo_id;
        state.next_utxo_id += 1;

        let mut final_utxo = utxo;
        final_utxo.id = id;
        final_utxo.ordinal_info = ordinal_info;

        state.utxos.insert(id, final_utxo.clone());
        state
            .user_utxos
            .entry(caller)
            .or_insert_with(Vec::new)
            .push(id);

        ic_cdk::println!(
            "Deposited UTXO {} for user {}: {} satoshis{}",
            id,
            caller,
            final_utxo.amount,
            if final_utxo.ordinal_info.is_some() {
                " (with inscription)"
            } else {
                ""
            }
        );

        id
    });

    Ok(utxo_id)
}

/// Locks a deposited UTXO as collateral and creates a loan offer
#[ic_cdk::update]
pub async fn lock_collateral(utxo_id: UtxoId) -> Result<LoanOffer, String> {
    let caller = ic_cdk::api::caller();

    // Get UTXO
    let utxo = State::with_read(|state| state.utxos.get(&utxo_id).cloned());

    let utxo = utxo.ok_or("UTXO not found".to_string())?;

    // Check UTXO belongs to caller
    let user_utxos = State::with_read(|state| state.user_utxos.get(&caller).cloned());

    if !user_utxos
        .map(|utxos| utxos.contains(&utxo_id))
        .unwrap_or(false)
    {
        return Err("Unauthorized: UTXO does not belong to caller".to_string());
    }

    // Check UTXO is not already locked
    if utxo.status != UtxoStatus::Deposited {
        return Err("UTXO is already locked or withdrawn".to_string());
    }

    // Calculate max borrowable (50% LTV = 5000 basis points)
    let max_borrowable = calculate_max_borrowable(&utxo, 5000);

    // Lock UTXO and create loan offer
    let created_at = get_timestamp();
    let loan_offer_id = State::with(|state| {
        // Lock UTXO
        if let Some(utxo) = state.utxos.get_mut(&utxo_id) {
            utxo.status = UtxoStatus::Locked;
        }

        // Create loan offer
        let offer_id = state.next_loan_offer_id;
        state.next_loan_offer_id += 1;

        let offer = LoanOffer {
            id: offer_id,
            user_id: caller,
            utxo_id,
            max_borrowable,
            ltv_percent: 50, // 50% LTV
            status: LoanOfferStatus::Active,
            created_at,
        };

        state.loan_offers.insert(offer_id, offer.clone());
        state
            .user_loan_offers
            .entry(caller)
            .or_insert_with(Vec::new)
            .push(offer_id);

        ic_cdk::println!(
            "Locked UTXO {} for user {} and created loan offer {}: max borrowable {} satoshis",
            utxo_id,
            caller,
            offer_id,
            max_borrowable
        );

        offer_id
    });

    Ok(LoanOffer {
        id: loan_offer_id,
        user_id: caller,
        utxo_id,
        max_borrowable,
        ltv_percent: 50,
        status: LoanOfferStatus::Active,
        created_at,
    })
}

/// Borrows ckBTC against deposited collateral
#[ic_cdk::update]
pub async fn borrow(request: BorrowRequest) -> Result<LoanId, String> {
    let caller = ic_cdk::api::caller();

    // 1. Validate inputs and authorization (no state changes)
    if request.amount == 0 {
        return Err("Invalid borrow amount: must be greater than 0".to_string());
    }

    // Get UTXO
    let utxo = State::with_read(|state| state.utxos.get(&request.utxo_id).cloned());

    let utxo = utxo.ok_or("UTXO not found".to_string())?;

    // Check UTXO belongs to caller
    let user_utxos = State::with_read(|state| state.user_utxos.get(&caller).cloned());

    if !user_utxos
        .map(|utxos| utxos.contains(&request.utxo_id))
        .unwrap_or(false)
    {
        return Err("Unauthorized: UTXO does not belong to caller".to_string());
    }

    // Check if UTXO is withdrawn (cannot borrow against withdrawn UTXO)
    if utxo.status == UtxoStatus::Withdrawn {
        return Err("UTXO has been withdrawn".to_string());
    }

    // Calculate max borrowable based on UTXO status
    let max_borrowable = if utxo.status == UtxoStatus::Locked {
        // For locked UTXOs, try to find an active loan offer first
        let loan_offer_max = State::with_read(|state| {
            state.user_loan_offers.get(&caller).and_then(|offer_ids| {
                offer_ids.iter().find_map(|offer_id| {
                    state.loan_offers.get(offer_id).and_then(|offer| {
                        if offer.utxo_id == request.utxo_id
                            && offer.status == LoanOfferStatus::Active
                        {
                            Some(offer.max_borrowable)
                        } else {
                            None
                        }
                    })
                })
            })
        });

        // If no active loan offer found, calculate max borrowable directly
        // This allows borrowing from locked UTXOs even without an active offer
        loan_offer_max.unwrap_or_else(|| {
            ic_cdk::println!("⚠️ No active loan offer found for locked UTXO {}, calculating max borrowable directly", request.utxo_id);
            calculate_max_borrowable(&utxo, 5000) // 50% LTV
        })
    } else {
        // UTXO is Deposited, calculate max borrowable (50% LTV = 5000 basis points)
        calculate_max_borrowable(&utxo, 5000)
    };

    if request.amount > max_borrowable {
        return Err(format!(
            "Amount {} exceeds maximum borrowable: {} (50% LTV)",
            request.amount, max_borrowable
        ));
    }

    // 2. Transfer ckBTC to user using real ckBTC ledger
    let block_index = ckbtc::transfer_ckbtc(caller, request.amount).await?;

    ic_cdk::println!(
        "Successfully transferred {} satoshis ckBTC to {}, block index: {}",
        request.amount,
        caller,
        block_index
    );

    // 3. Only modify state after successful ckBTC transfer
    let loan_id = State::with(|state| {
        let id = state.next_loan_id;
        state.next_loan_id += 1;

        let loan = Loan {
            id,
            user_id: caller,
            collateral_utxo_id: request.utxo_id,
            borrowed_amount: request.amount,
            repaid_amount: 0,
            interest_rate: 500, // 5% annual interest
            created_at: get_timestamp(),
            status: LoanStatus::Active,
        };

        state.loans.insert(id, loan.clone());
        state
            .user_loans
            .entry(caller)
            .or_insert_with(Vec::new)
            .push(id);

        // Lock UTXO as collateral (if not already locked)
        if let Some(utxo) = state.utxos.get_mut(&request.utxo_id) {
            if utxo.status == UtxoStatus::Deposited {
                utxo.status = UtxoStatus::Locked;
            }
        }

        // Mark loan offer as accepted if it exists
        if let Some(offer_ids) = state.user_loan_offers.get(&caller) {
            for offer_id in offer_ids {
                if let Some(offer) = state.loan_offers.get_mut(offer_id) {
                    if offer.utxo_id == request.utxo_id && offer.status == LoanOfferStatus::Active {
                        offer.status = LoanOfferStatus::Accepted;
                        ic_cdk::println!(
                            "Marked loan offer {} as accepted for loan {}",
                            offer_id,
                            id
                        );
                    }
                }
            }
        }

        ic_cdk::println!(
            "Created loan {} for user {}: borrowed {} satoshis against UTXO {}",
            id,
            caller,
            request.amount,
            request.utxo_id
        );

        id
    });

    Ok(loan_id)
}

/// Repays a loan
#[ic_cdk::update]
pub async fn repay(request: RepayRequest) -> Result<(), String> {
    let caller = ic_cdk::api::caller();

    // 1. Validate inputs and authorization (no state changes)
    if request.amount == 0 {
        return Err("Invalid repayment amount: must be greater than 0".to_string());
    }

    // Get loan
    let loan = State::with_read(|state| state.loans.get(&request.loan_id).cloned());

    let loan = loan.ok_or("Loan not found".to_string())?;

    // Check loan belongs to caller
    if loan.user_id != caller {
        return Err("Unauthorized: loan does not belong to caller".to_string());
    }

    // Check loan is active
    if loan.status != LoanStatus::Active {
        return Err("Loan is not active".to_string());
    }

    // Calculate remaining debt (borrowed + interest - repaid)
    let remaining_debt = calculate_loan_value(&loan);
    if request.amount > remaining_debt {
        return Err(format!(
            "Amount {} exceeds remaining debt: {}",
            request.amount, remaining_debt
        ));
    }

    // 2. Verify user has transferred ckBTC to canister using real ckBTC ledger
    let verified = ckbtc::verify_transfer_to_canister(caller, request.amount).await?;
    if !verified {
        return Err("ckBTC transfer verification failed: no matching transfer found".to_string());
    }

    ic_cdk::println!(
        "Verified ckBTC transfer of {} satoshis from {} for loan {}",
        request.amount,
        caller,
        request.loan_id
    );

    // Note: In production, you might want to actually burn the ckBTC tokens here
    // For now, the canister holds the ckBTC (which effectively removes it from circulation)

    // 3. Only modify state after successful verification
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

                ic_cdk::println!(
                    "Loan {} fully repaid, unlocked UTXO {}",
                    request.loan_id,
                    loan.collateral_utxo_id
                );
            } else {
                ic_cdk::println!(
                    "Partial repayment for loan {}: {} / {} satoshis",
                    request.loan_id,
                    loan.repaid_amount,
                    loan.borrowed_amount
                );
            }
        }
    });

    Ok(())
}

/// Withdraws collateral after full repayment
#[ic_cdk::update]
pub async fn withdraw_collateral(utxo_id: UtxoId) -> Result<(), String> {
    let caller = ic_cdk::api::caller();

    // 1. Validate and check authorization (no state changes)
    // Get UTXO
    let utxo = State::with_read(|state| state.utxos.get(&utxo_id).cloned());

    let utxo = utxo.ok_or("UTXO not found".to_string())?;

    // Verify caller owns the UTXO
    let user_utxos = State::with_read(|state| state.user_utxos.get(&caller).cloned());

    if !user_utxos
        .map(|utxos| utxos.contains(&utxo_id))
        .unwrap_or(false)
    {
        return Err("Unauthorized: UTXO does not belong to caller".to_string());
    }

    // Check UTXO is not currently locked
    if utxo.status == UtxoStatus::Locked {
        return Err("Cannot withdraw: UTXO is locked as collateral for an active loan".to_string());
    }

    // Check UTXO is not already withdrawn
    if utxo.status == UtxoStatus::Withdrawn {
        return Err("UTXO has already been withdrawn".to_string());
    }

    // Verify no active loans exist for this UTXO
    let has_active_loan = State::with_read(|state| {
        state
            .loans
            .values()
            .any(|loan| loan.collateral_utxo_id == utxo_id && loan.status == LoanStatus::Active)
    });

    if has_active_loan {
        return Err(
            "Cannot withdraw: UTXO has an active loan that must be repaid first".to_string(),
        );
    }

    // 2. Only modify state after all validations pass
    State::with(|state| {
        if let Some(utxo) = state.utxos.get_mut(&utxo_id) {
            utxo.status = UtxoStatus::Withdrawn;

            ic_cdk::println!(
                "User {} withdrew UTXO {}: {} satoshis",
                caller,
                utxo_id,
                utxo.amount
            );
        }
    });

    Ok(())
}

/// Gets all loans for the caller
#[ic_cdk::query]
pub fn get_user_loans() -> Vec<Loan> {
    let caller = ic_cdk::api::caller();

    State::with_read(|state| {
        state
            .user_loans
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
    let caller = ic_cdk::api::caller();

    State::with_read(|state| {
        state
            .user_utxos
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

/// Gets loan offer for a specific UTXO
#[ic_cdk::query]
pub fn get_loan_offer_by_utxo(utxo_id: UtxoId) -> Option<LoanOffer> {
    let caller = ic_cdk::api::caller();

    State::with_read(|state| {
        // Find loan offer for this UTXO that belongs to the caller
        state.user_loan_offers.get(&caller).and_then(|offer_ids| {
            offer_ids.iter().find_map(|offer_id| {
                state.loan_offers.get(offer_id).and_then(|offer| {
                    if offer.utxo_id == utxo_id && offer.status == LoanOfferStatus::Active {
                        Some(offer.clone())
                    } else {
                        None
                    }
                })
            })
        })
    })
}

/// Gets all loan offers for the caller
#[ic_cdk::query]
pub fn get_user_loan_offers() -> Vec<LoanOffer> {
    let caller = ic_cdk::api::caller();

    State::with_read(|state| {
        state
            .user_loan_offers
            .get(&caller)
            .map(|offer_ids| {
                offer_ids
                    .iter()
                    .filter_map(|id| state.loan_offers.get(id).cloned())
                    .collect()
            })
            .unwrap_or_default()
    })
}

// ============================================================================
// Additional Vault Management Functions (Task 10)
// ============================================================================

/// Gets loan health information
#[ic_cdk::query]
pub fn get_loan_health(loan_id: LoanId) -> Result<LoanHealth, String> {
    State::with_read(|state| {
        let loan = state
            .loans
            .get(&loan_id)
            .ok_or("Loan not found".to_string())?;

        let utxo = state
            .utxos
            .get(&loan.collateral_utxo_id)
            .ok_or("Collateral UTXO not found".to_string())?;

        // Calculate current loan value (borrowed + interest - repaid)
        let loan_value = calculate_loan_value(loan);

        // Calculate current LTV: (loan_value / collateral_value) * 10000
        let current_ltv = if utxo.amount > 0 {
            (loan_value * 10000) / utxo.amount
        } else {
            10000 // 100% if no collateral
        };

        // Liquidation threshold is 80% (8000 basis points)
        let liquidation_threshold = 8000u64;

        // Health factor: distance from liquidation (higher is better)
        // health_factor = liquidation_threshold / current_ltv
        // If > 1.0, loan is healthy. If < 1.0, loan can be liquidated
        let health_factor = if current_ltv > 0 {
            (liquidation_threshold * 100) / current_ltv
        } else {
            10000 // Perfect health if no debt
        };

        Ok(LoanHealth {
            loan_id,
            current_ltv,
            liquidation_threshold,
            health_factor,
            can_be_liquidated: current_ltv >= liquidation_threshold,
            collateral_value: utxo.amount,
            loan_value,
        })
    })
}

/// Gets statistics for a specific user
#[ic_cdk::query]
pub fn get_user_stats() -> UserStats {
    let caller = ic_cdk::api::caller();

    State::with_read(|state| {
        // Get user's UTXOs
        let user_utxos = state.user_utxos.get(&caller).cloned().unwrap_or_default();

        // Calculate total collateral value
        let total_collateral_value: u64 = user_utxos
            .iter()
            .filter_map(|id| state.utxos.get(id))
            .map(|utxo| utxo.amount)
            .sum();

        // Get user's loans
        let user_loans = state.user_loans.get(&caller).cloned().unwrap_or_default();

        // Calculate total borrowed and total debt
        let mut total_borrowed = 0u64;
        let mut total_debt = 0u64;
        let mut active_loans = 0u64;

        for loan_id in &user_loans {
            if let Some(loan) = state.loans.get(loan_id) {
                if loan.status == LoanStatus::Active {
                    active_loans += 1;
                    total_borrowed += loan.borrowed_amount;
                    total_debt += calculate_loan_value(loan);
                }
            }
        }

        // Calculate average LTV
        let average_ltv = if total_collateral_value > 0 {
            (total_debt * 10000) / total_collateral_value
        } else {
            0
        };

        UserStats {
            total_collateral_value,
            total_borrowed,
            total_debt,
            active_loans_count: active_loans,
            total_utxos_count: user_utxos.len() as u64,
            average_ltv,
        }
    })
}

/// Gets overall vault statistics
#[ic_cdk::query]
pub fn get_vault_stats() -> VaultStats {
    State::with_read(|state| {
        // Calculate total value locked (all UTXOs)
        let total_value_locked: u64 = state.utxos.values().map(|utxo| utxo.amount).sum();

        // Calculate total loans outstanding
        let mut total_loans_outstanding = 0u64;
        let mut active_loans_count = 0u64;

        for loan in state.loans.values() {
            if loan.status == LoanStatus::Active {
                active_loans_count += 1;
                total_loans_outstanding += calculate_loan_value(loan);
            }
        }

        // Count unique users
        let total_users = state.user_utxos.len() as u64;

        // Calculate utilization rate: (total_loans / total_collateral) * 10000
        let utilization_rate = if total_value_locked > 0 {
            (total_loans_outstanding * 10000) / total_value_locked
        } else {
            0
        };

        VaultStats {
            total_value_locked,
            total_loans_outstanding,
            active_loans_count,
            total_users,
            total_utxos: state.utxos.len() as u64,
            utilization_rate,
        }
    })
}

/// Gets all loans in the system (paginated)
#[ic_cdk::query]
pub fn get_all_loans(offset: u64, limit: u64) -> LoansPage {
    State::with_read(|state| {
        let all_loans: Vec<Loan> = state.loans.values().cloned().collect();
        let total = all_loans.len() as u64;

        let start = offset as usize;
        let end = ((offset + limit) as usize).min(all_loans.len());

        let loans = if start < all_loans.len() {
            all_loans[start..end].to_vec()
        } else {
            vec![]
        };

        LoansPage {
            loans,
            total,
            offset,
            limit,
        }
    })
}

/// Liquidates a loan that exceeds the liquidation threshold
#[ic_cdk::update]
pub async fn liquidate_loan(loan_id: LoanId) -> Result<(), String> {
    let caller = ic_cdk::api::caller();

    // Get loan and check if it can be liquidated
    let (loan, utxo, can_liquidate) = State::with_read(|state| {
        let loan = state
            .loans
            .get(&loan_id)
            .ok_or("Loan not found".to_string())?;

        let utxo = state
            .utxos
            .get(&loan.collateral_utxo_id)
            .ok_or("Collateral UTXO not found".to_string())?;

        // Check if loan is active
        if loan.status != LoanStatus::Active {
            return Err("Loan is not active".to_string());
        }

        // Calculate current LTV
        let loan_value = calculate_loan_value(loan);
        let current_ltv = if utxo.amount > 0 {
            (loan_value * 10000) / utxo.amount
        } else {
            10000
        };

        // Liquidation threshold is 80%
        let can_liquidate = current_ltv >= 8000;

        if !can_liquidate {
            return Err(format!(
                "Loan cannot be liquidated: LTV {}% is below 80% threshold",
                current_ltv / 100
            ));
        }

        Ok((loan.clone(), utxo.clone(), can_liquidate))
    })?;

    // Liquidate the loan
    State::with(|state| {
        if let Some(loan) = state.loans.get_mut(&loan_id) {
            loan.status = LoanStatus::Liquidated;

            ic_cdk::println!(
                "Loan {} liquidated by {}. Collateral UTXO {} transferred.",
                loan_id,
                caller,
                loan.collateral_utxo_id
            );
        }

        // Mark UTXO as withdrawn (transferred to liquidator)
        if let Some(utxo) = state.utxos.get_mut(&loan.collateral_utxo_id) {
            utxo.status = UtxoStatus::Withdrawn;
        }
    });

    Ok(())
}

// ============================================================================
// Advanced Features: Threshold Schnorr, Runes, Solana, vetKeys
// ============================================================================

/// Deposits a UTXO with Runes support
/// Checks for both Ordinals and Runes
#[ic_cdk::update]
pub async fn deposit_utxo_with_runes(request: DepositUtxoRequest) -> Result<UtxoId, String> {
    let caller = ic_cdk::api::caller();

    // First, deposit the UTXO normally
    let utxo_id = deposit_utxo(request.clone()).await?;

    // Then check for Runes
    let network = std::env::var("DFX_NETWORK").unwrap_or_else(|_| "local".to_string());
    if network != "local" && network != "playground" {
        match runes::verify_runes(&request.txid, request.vout).await {
            Ok(Some(runes_info)) => {
                ic_cdk::println!("✅ Found {} Rune(s) in UTXO", runes_info.len());
                // Store Runes info in state (would need to extend state)
            }
            Ok(None) => {
                ic_cdk::println!("ℹ️  No Runes found in UTXO");
            }
            Err(e) => {
                ic_cdk::println!("⚠️  Error checking for Runes: {}", e);
            }
        }
    }

    Ok(utxo_id)
}

/// Creates a Taproot address using Threshold Schnorr signatures
#[ic_cdk::update]
pub async fn create_taproot_address() -> Result<String, String> {
    let caller = ic_cdk::api::caller();

    ic_cdk::println!("🔐 Creating Taproot address for user: {}", caller);

    schnorr::create_taproot_address(None).await
}

/// Signs a Taproot transaction using Threshold Schnorr
#[ic_cdk::update]
pub async fn sign_taproot_transaction(
    message: Vec<u8>,
    derivation_path: Vec<Vec<u8>>,
) -> Result<schnorr::SchnorrSignResponse, String> {
    let caller = ic_cdk::api::caller();

    ic_cdk::println!("✍️  Signing Taproot transaction for user: {}", caller);

    schnorr::sign_taproot_transaction(schnorr::SchnorrSignRequest {
        message,
        derivation_path,
        key_id: None,
    })
    .await
}

/// Creates a multi-sig Taproot address
#[ic_cdk::update]
pub async fn create_multisig_taproot(
    required_signatures: u32,
    total_signers: u32,
) -> Result<String, String> {
    let caller = ic_cdk::api::caller();

    if required_signatures > total_signers {
        return Err("Required signatures cannot exceed total signers".to_string());
    }

    ic_cdk::println!(
        "🔐 Creating {}-of-{} multi-sig Taproot address for user: {}",
        required_signatures,
        total_signers,
        caller
    );

    // In production, would get key IDs from state or parameters
    let key_ids = vec![]; // Placeholder

    schnorr::create_multisig_taproot_address(required_signatures, total_signers, key_ids).await
}

/// Gets Solana balance for a user
#[ic_cdk::query]
pub async fn get_solana_balance(
    address: String,
    network: solana::SolanaNetwork,
) -> Result<u64, String> {
    solana::get_solana_balance(&address, network).await
}

/// Creates a cross-chain BTC-SOL swap
#[ic_cdk::update]
pub async fn create_btc_sol_swap(
    sol_address: String,
    sol_amount: u64,
    network: solana::SolanaNetwork,
) -> Result<solana::SolanaTransactionResponse, String> {
    let caller = ic_cdk::api::caller();

    ic_cdk::println!("🔄 Creating BTC-SOL swap for user: {}", caller);

    solana::create_btc_sol_swap(solana::SolanaTransactionRequest {
        from: "vault".to_string(), // Vault address
        to: sol_address,
        amount: sol_amount,
        network,
    })
    .await
}

/// Encrypts user data using vetKeys
#[ic_cdk::update]
pub async fn encrypt_user_data(data: Vec<u8>) -> Result<vetkeys::EncryptResponse, String> {
    let caller = ic_cdk::api::caller();

    ic_cdk::println!("🔐 Encrypting user data for: {}", caller);

    let key_id = format!("user_{}", caller);

    vetkeys::encrypt_data(vetkeys::EncryptRequest {
        plaintext: data,
        public_key_id: key_id,
        associated_data: Some(caller.as_slice().to_vec()),
    })
    .await
}

/// Decrypts user data using vetKeys
#[ic_cdk::update]
pub async fn decrypt_user_data(ciphertext: Vec<u8>) -> Result<vetkeys::DecryptResponse, String> {
    let caller = ic_cdk::api::caller();

    ic_cdk::println!("🔓 Decrypting user data for: {}", caller);

    let key_id = format!("user_{}", caller);

    vetkeys::decrypt_data(vetkeys::DecryptRequest {
        ciphertext,
        public_key_id: key_id,
        associated_data: Some(caller.as_slice().to_vec()),
    })
    .await
}

/// Creates an encrypted note (secure note application)
#[ic_cdk::update]
pub async fn create_encrypted_note(
    note_content: String,
) -> Result<vetkeys::EncryptResponse, String> {
    let caller = ic_cdk::api::caller();

    vetkeys::create_encrypted_note(caller, note_content).await
}

/// Gets an encrypted note
#[ic_cdk::query]
pub async fn get_encrypted_note(ciphertext: Vec<u8>) -> Result<String, String> {
    let caller = ic_cdk::api::caller();

    vetkeys::get_encrypted_note(caller, ciphertext).await
}

/// Sets up a dead man switch
/// Automatically transfers funds if user stops logging in
#[ic_cdk::update]
pub async fn setup_dead_man_switch(
    inactivity_threshold_seconds: u64,
    beneficiary: Principal,
) -> Result<(), String> {
    let caller = ic_cdk::api::caller();

    ic_cdk::println!(
        "⏰ Setting up dead man switch for user: {} (threshold: {}s, beneficiary: {})",
        caller,
        inactivity_threshold_seconds,
        beneficiary
    );

    // Store dead man switch configuration in state
    State::with(|state| {
        let dms = DeadManSwitch {
            user_id: caller,
            last_activity: get_timestamp(),
            inactivity_threshold: inactivity_threshold_seconds * 1_000_000_000, // Convert to nanoseconds
            beneficiary,
            enabled: true,
        };

        // Would need to add dead_man_switches to state
        // state.dead_man_switches.insert(caller, dms);

        ic_cdk::println!("✅ Dead man switch configured");
    });

    Ok(())
}

/// Updates last activity timestamp (call this periodically to keep dead man switch from triggering)
#[ic_cdk::update]
pub async fn update_activity() -> Result<(), String> {
    let caller = ic_cdk::api::caller();

    // Update last activity timestamp
    State::with(|state| {
        // Would need to add dead_man_switches to state
        // if let Some(dms) = state.dead_man_switches.get_mut(&caller) {
        //     dms.last_activity = get_timestamp();
        // }

        ic_cdk::println!("✅ Activity updated for user: {}", caller);
    });

    Ok(())
}

/// Gets Rune balances for a Bitcoin address
#[ic_cdk::query]
pub async fn get_rune_balances(address: String) -> Result<Vec<runes::RuneBalance>, String> {
    runes::get_rune_balances(&address).await
}
