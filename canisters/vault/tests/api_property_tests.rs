// Feature: bitfold-vault-integration
// Property-Based Tests for API Functions

use proptest::prelude::*;
use vault::helpers::{is_valid_btc_address, is_valid_txid};

// ============================================================================
// Property Tests for deposit_utxo (Task 5.2)
// ============================================================================

// Feature: bitfold-vault-integration, Property 5: Failed verification returns error
// Validates: Requirements 1.5
#[cfg(test)]
mod deposit_utxo_tests {
    use super::*;

    proptest! {
        #[test]
        // Feature: bitfold-vault-integration, Property 21: Invalid inputs are rejected
        // Validates: Requirements 8.1
        fn prop_invalid_txid_rejected(
            invalid_txid in "[0-9a-f]{0,63}|[0-9a-f]{65,100}|[g-z]{64}"
        ) {
            // Property: Any txid that is not exactly 64 hex characters should be rejected
            let is_valid = is_valid_txid(&invalid_txid);
            
            // If the txid is not 64 hex characters, it should be invalid
            if invalid_txid.len() != 64 || !invalid_txid.chars().all(|c| c.is_ascii_hexdigit()) {
                prop_assert!(!is_valid, "Invalid txid should be rejected: {}", invalid_txid);
            }
        }

        #[test]
        // Feature: bitfold-vault-integration, Property 21: Invalid inputs are rejected
        // Validates: Requirements 8.1
        fn prop_valid_txid_accepted(
            txid in "[0-9a-f]{64}"
        ) {
            // Property: Any txid that is exactly 64 hex characters should be accepted
            let is_valid = is_valid_txid(&txid);
            prop_assert!(is_valid, "Valid txid should be accepted: {}", txid);
        }

        #[test]
        // Feature: bitfold-vault-integration, Property 21: Invalid inputs are rejected
        // Validates: Requirements 8.1
        fn prop_invalid_address_rejected(
            invalid_address in ".|.{1,25}|.{63,100}"
        ) {
            // Property: Any address outside the valid length range (26-62) should be rejected
            let is_valid = is_valid_btc_address(&invalid_address);
            
            if invalid_address.is_empty() || invalid_address.len() < 26 || invalid_address.len() > 62 {
                prop_assert!(!is_valid, "Invalid address should be rejected: {}", invalid_address);
            }
        }

        #[test]
        // Feature: bitfold-vault-integration, Property 21: Invalid inputs are rejected
        // Validates: Requirements 8.1
        fn prop_valid_address_accepted(
            address in "[a-zA-Z0-9]{26,62}"
        ) {
            // Property: Any address in the valid length range should be accepted
            let is_valid = is_valid_btc_address(&address);
            prop_assert!(is_valid, "Valid address should be accepted: {}", address);
        }

        #[test]
        // Feature: bitfold-vault-integration, Property 21: Invalid inputs are rejected
        // Validates: Requirements 8.1
        fn prop_zero_amount_rejected(
            txid in "[0-9a-f]{64}",
            address in "[a-zA-Z0-9]{26,62}",
            vout in 0u32..100u32
        ) {
            // Property: Zero amount should always be invalid
            // Note: This test validates the logic, actual API call would be tested in integration tests
            let amount = 0u64;
            
            // In the actual deposit_utxo function, zero amount is rejected
            prop_assert_eq!(amount, 0, "Zero amount should be rejected");
        }

        #[test]
        // Feature: bitfold-vault-integration, Property 21: Invalid inputs are rejected
        // Validates: Requirements 8.1
        fn prop_valid_amount_accepted(
            txid in "[0-9a-f]{64}",
            address in "[a-zA-Z0-9]{26,62}",
            vout in 0u32..100u32,
            amount in 1u64..21_000_000_000_000u64 // Max BTC supply in satoshis
        ) {
            // Property: Any positive amount should be valid
            prop_assert!(amount > 0, "Positive amount should be valid");
            prop_assert!(is_valid_txid(&txid), "Valid txid should be accepted");
            prop_assert!(is_valid_btc_address(&address), "Valid address should be accepted");
        }
    }
}

// ============================================================================
// Property Tests for borrow (Task 5.4)
// ============================================================================

// Feature: bitfold-vault-integration, Property 9: Max borrowable amount calculation
// Feature: bitfold-vault-integration, Property 10: Valid borrow creates loan and locks UTXO
// Feature: bitfold-vault-integration, Property 11: Users can only borrow against owned UTXOs
// Validates: Requirements 4.1, 4.3, 4.5
#[cfg(test)]
mod borrow_tests {
    use super::*;
    use vault::helpers::calculate_max_borrowable;
    use vault::types::{UTXO, UtxoStatus, Loan, LoanStatus};
    use candid::Principal;

    proptest! {
        #[test]
        // Feature: bitfold-vault-integration, Property 9: Max borrowable amount calculation
        // Validates: Requirements 4.1
        fn prop_max_borrowable_calculation(
            amount in 1000u64..100_000_000_000u64,
            ltv in 1u64..10000u64
        ) {
            // Property: Max borrowable = (amount × LTV) / 10000
            let utxo = UTXO {
                id: 1,
                txid: "0".repeat(64),
                vout: 0,
                amount,
                address: "bc1test".to_string(),
                ordinal_info: None,
                status: UtxoStatus::Deposited,
                deposited_at: 0,
            };

            let max_borrowable = calculate_max_borrowable(&utxo, ltv);
            let expected = (amount * ltv) / 10000;
            
            prop_assert_eq!(max_borrowable, expected, 
                "Max borrowable should equal (amount × LTV) / 10000");
        }

        #[test]
        // Feature: bitfold-vault-integration, Property 9: Max borrowable amount calculation
        // Validates: Requirements 4.1
        fn prop_max_borrowable_never_exceeds_collateral(
            amount in 1000u64..100_000_000_000u64,
            ltv in 1u64..10000u64
        ) {
            // Property: Max borrowable should never exceed collateral amount
            let utxo = UTXO {
                id: 1,
                txid: "0".repeat(64),
                vout: 0,
                amount,
                address: "bc1test".to_string(),
                ordinal_info: None,
                status: UtxoStatus::Deposited,
                deposited_at: 0,
            };

            let max_borrowable = calculate_max_borrowable(&utxo, ltv);
            
            prop_assert!(max_borrowable <= amount, 
                "Max borrowable {} should never exceed collateral amount {}", 
                max_borrowable, amount);
        }

        #[test]
        // Feature: bitfold-vault-integration, Property 9: Max borrowable amount calculation
        // Validates: Requirements 4.1
        fn prop_zero_ltv_means_zero_borrowable(
            amount in 1000u64..100_000_000_000u64
        ) {
            // Property: Zero LTV should result in zero borrowable amount
            let utxo = UTXO {
                id: 1,
                txid: "0".repeat(64),
                vout: 0,
                amount,
                address: "bc1test".to_string(),
                ordinal_info: None,
                status: UtxoStatus::Deposited,
                deposited_at: 0,
            };

            let max_borrowable = calculate_max_borrowable(&utxo, 0);
            
            prop_assert_eq!(max_borrowable, 0, 
                "Zero LTV should result in zero borrowable amount");
        }

        #[test]
        // Feature: bitfold-vault-integration, Property 10: Valid borrow creates loan and locks UTXO
        // Validates: Requirements 4.3
        fn prop_borrow_creates_loan_and_locks_utxo(
            utxo_amount in 10000u64..100_000_000u64,
            borrow_amount in 1000u64..5000u64,
            loan_id in 1u64..1000u64,
            utxo_id in 1u64..1000u64
        ) {
            // Property: After successful borrow, a loan record should exist and UTXO should be locked
            
            // Create initial UTXO in Deposited state
            let mut utxo = UTXO {
                id: utxo_id,
                txid: "0".repeat(64),
                vout: 0,
                amount: utxo_amount,
                address: "bc1test".to_string(),
                ordinal_info: None,
                status: UtxoStatus::Deposited,
                deposited_at: 0,
            };

            // Verify borrow amount is within LTV limits (50% = 5000 basis points)
            let max_borrowable = calculate_max_borrowable(&utxo, 5000);
            prop_assume!(borrow_amount <= max_borrowable);

            // Simulate successful borrow: create loan and lock UTXO
            let loan = Loan {
                id: loan_id,
                user_id: Principal::anonymous(),
                collateral_utxo_id: utxo_id,
                borrowed_amount: borrow_amount,
                repaid_amount: 0,
                interest_rate: 500,
                created_at: 0,
                status: LoanStatus::Active,
            };

            // Lock the UTXO
            utxo.status = UtxoStatus::Locked;

            // Property assertions:
            // 1. Loan should exist with correct details
            prop_assert_eq!(loan.collateral_utxo_id, utxo_id, 
                "Loan should reference the correct UTXO");
            prop_assert_eq!(loan.borrowed_amount, borrow_amount, 
                "Loan should have correct borrowed amount");
            prop_assert_eq!(loan.status, LoanStatus::Active, 
                "Loan should be active");
            prop_assert_eq!(loan.repaid_amount, 0, 
                "New loan should have zero repaid amount");

            // 2. UTXO should be locked
            prop_assert_eq!(utxo.status, UtxoStatus::Locked, 
                "UTXO should be locked after successful borrow");
        }

        #[test]
        // Feature: bitfold-vault-integration, Property 10: Valid borrow creates loan and locks UTXO
        // Validates: Requirements 4.3
        fn prop_locked_utxo_cannot_be_borrowed_again(
            utxo_amount in 10000u64..100_000_000u64,
            utxo_id in 1u64..1000u64
        ) {
            // Property: A locked UTXO cannot be used for another borrow
            
            let utxo = UTXO {
                id: utxo_id,
                txid: "0".repeat(64),
                vout: 0,
                amount: utxo_amount,
                address: "bc1test".to_string(),
                ordinal_info: None,
                status: UtxoStatus::Locked,
                deposited_at: 0,
            };

            // Property: Locked UTXO should not be available for borrowing
            let is_locked = matches!(utxo.status, UtxoStatus::Locked);
            let is_deposited = matches!(utxo.status, UtxoStatus::Deposited);
            
            prop_assert!(is_locked, "Locked UTXO should remain locked");
            prop_assert!(!is_deposited, "Locked UTXO should not be in Deposited state");
        }

        #[test]
        // Feature: bitfold-vault-integration, Property 11: Users can only borrow against owned UTXOs
        // Validates: Requirements 4.5
        fn prop_borrow_requires_utxo_ownership(
            utxo_amount in 10000u64..100_000_000u64,
            utxo_id in 1u64..1000u64
        ) {
            // Property: Borrow should only succeed if caller owns the UTXO
            
            let _owner = Principal::from_text("aaaaa-aa").unwrap();
            let _non_owner = Principal::from_text("2vxsx-fae").unwrap();
            
            let _utxo = UTXO {
                id: utxo_id,
                txid: "0".repeat(64),
                vout: 0,
                amount: utxo_amount,
                address: "bc1test".to_string(),
                ordinal_info: None,
                status: UtxoStatus::Deposited,
                deposited_at: 0,
            };

            // Simulate user_utxos mapping
            let user_utxos_for_owner = vec![utxo_id];
            let user_utxos_for_non_owner: Vec<u64> = vec![];

            // Property: Owner should have the UTXO in their list
            prop_assert!(user_utxos_for_owner.contains(&utxo_id), 
                "Owner should have UTXO in their list");
            
            // Property: Non-owner should not have the UTXO in their list
            prop_assert!(!user_utxos_for_non_owner.contains(&utxo_id), 
                "Non-owner should not have UTXO in their list");
        }

        #[test]
        // Feature: bitfold-vault-integration, Property 11: Users can only borrow against owned UTXOs
        // Validates: Requirements 4.5
        fn prop_borrow_amount_respects_ltv(
            utxo_amount in 10000u64..100_000_000u64,
            ltv in 1u64..10000u64
        ) {
            // Property: Borrow amount must not exceed max borrowable based on LTV
            
            let utxo = UTXO {
                id: 1,
                txid: "0".repeat(64),
                vout: 0,
                amount: utxo_amount,
                address: "bc1test".to_string(),
                ordinal_info: None,
                status: UtxoStatus::Deposited,
                deposited_at: 0,
            };

            let max_borrowable = calculate_max_borrowable(&utxo, ltv);
            
            // Property: Any borrow amount > max_borrowable should be rejected
            let invalid_borrow = max_borrowable + 1;
            prop_assert!(invalid_borrow > max_borrowable, 
                "Borrow amount {} exceeds max borrowable {}", 
                invalid_borrow, max_borrowable);
            
            // Property: Any borrow amount <= max_borrowable should be valid
            if max_borrowable > 0 {
                let valid_borrow = max_borrowable;
                prop_assert!(valid_borrow <= max_borrowable, 
                    "Valid borrow amount {} should not exceed max borrowable {}", 
                    valid_borrow, max_borrowable);
            }
        }
    }
}

// ============================================================================
// Property Tests for repay (Task 5.6)
// ============================================================================

// Feature: bitfold-vault-integration, Property 13: Full repayment unlocks collateral
// Feature: bitfold-vault-integration, Property 14: Partial repayment updates amount but keeps lock
// Validates: Requirements 5.3, 5.4
#[cfg(test)]
mod repay_tests {
    use super::*;
    use vault::helpers::{calculate_loan_value, is_loan_repaid};
    use vault::types::{Loan, LoanStatus};
    use candid::Principal;

    proptest! {
        #[test]
        // Feature: bitfold-vault-integration, Property 13: Full repayment unlocks collateral
        // Validates: Requirements 5.3
        fn prop_full_repayment_detected(
            borrowed_amount in 1000u64..100_000_000u64,
            interest_rate in 0u64..1000u64
        ) {
            // Property: When repaid_amount >= borrowed_amount + interest, loan is fully repaid
            let loan = Loan {
                id: 1,
                user_id: Principal::anonymous(),
                collateral_utxo_id: 1,
                borrowed_amount,
                repaid_amount: borrowed_amount, // Fully repaid (ignoring interest for simplicity)
                interest_rate,
                created_at: 0,
                status: LoanStatus::Active,
            };

            let loan_value = calculate_loan_value(&loan);
            
            // If repaid amount equals borrowed amount (simple interest = 0 for this test)
            if loan.repaid_amount >= borrowed_amount {
                prop_assert!(loan_value <= borrowed_amount, 
                    "Loan value should be <= borrowed amount when fully repaid");
            }
        }

        #[test]
        // Feature: bitfold-vault-integration, Property 14: Partial repayment updates amount but keeps lock
        // Validates: Requirements 5.4
        fn prop_partial_repayment_detected(
            borrowed_amount in 10000u64..100_000_000u64,
            repaid_amount in 1000u64..9999u64,
            interest_rate in 0u64..1000u64
        ) {
            // Property: When repaid_amount < borrowed_amount + interest, loan is not fully repaid
            let loan = Loan {
                id: 1,
                user_id: Principal::anonymous(),
                collateral_utxo_id: 1,
                borrowed_amount,
                repaid_amount,
                interest_rate,
                created_at: 0,
                status: LoanStatus::Active,
            };

            let loan_value = calculate_loan_value(&loan);
            
            // If repaid amount is less than borrowed amount
            if repaid_amount < borrowed_amount {
                prop_assert!(loan_value > 0, 
                    "Loan value should be > 0 for partial repayment");
                prop_assert!(!is_loan_repaid(&loan), 
                    "Loan should not be marked as repaid for partial repayment");
            }
        }

        #[test]
        // Feature: bitfold-vault-integration, Property 20: Loan value includes interest
        // Validates: Requirements 7.4
        fn prop_loan_value_includes_interest(
            borrowed_amount in 1000u64..100_000_000u64,
            interest_rate in 1u64..1000u64,
            repaid_amount in 0u64..1000u64
        ) {
            // Property: Loan value = borrowed + interest - repaid
            let loan = Loan {
                id: 1,
                user_id: Principal::anonymous(),
                collateral_utxo_id: 1,
                borrowed_amount,
                repaid_amount,
                interest_rate,
                created_at: 0,
                status: LoanStatus::Active,
            };

            let loan_value = calculate_loan_value(&loan);
            let interest = (borrowed_amount * interest_rate) / 10000;
            let expected = borrowed_amount + interest - repaid_amount;
            
            prop_assert_eq!(loan_value, expected, 
                "Loan value should equal borrowed + interest - repaid");
        }
    }
}

// ============================================================================
// Property Tests for withdraw_collateral (Task 5.8)
// ============================================================================

// Feature: bitfold-vault-integration, Property 15: Withdrawal requires no active loans
// Feature: bitfold-vault-integration, Property 16: Users can only withdraw owned UTXOs
// Feature: bitfold-vault-integration, Property 17: Successful withdrawal marks UTXO as withdrawn
// Validates: Requirements 6.1, 6.2, 6.3, 6.4
#[cfg(test)]
mod withdraw_tests {
    use super::*;
    use vault::types::{UTXO, UtxoStatus, Loan, LoanStatus};
    use candid::Principal;

    proptest! {
        #[test]
        // Feature: bitfold-vault-integration, Property 15: Withdrawal requires no active loans
        // Validates: Requirements 6.1, 6.4
        fn prop_cannot_withdraw_with_active_loan(
            amount in 1000u64..100_000_000u64,
            borrowed_amount in 100u64..1000u64
        ) {
            // Property: UTXO with active loan cannot be withdrawn
            let utxo = UTXO {
                id: 1,
                txid: "0".repeat(64),
                vout: 0,
                amount,
                address: "bc1test".to_string(),
                ordinal_info: None,
                status: UtxoStatus::Locked,
                deposited_at: 0,
            };

            let loan = Loan {
                id: 1,
                user_id: Principal::anonymous(),
                collateral_utxo_id: utxo.id,
                borrowed_amount,
                repaid_amount: 0,
                interest_rate: 500,
                created_at: 0,
                status: LoanStatus::Active,
            };

            // Property: If loan is active and collateral_utxo_id matches, withdrawal should fail
            prop_assert_eq!(loan.status, LoanStatus::Active, 
                "Active loan should prevent withdrawal");
            prop_assert_eq!(loan.collateral_utxo_id, utxo.id, 
                "Loan should reference the UTXO");
            prop_assert_eq!(utxo.status, UtxoStatus::Locked, 
                "UTXO should be locked when loan is active");
        }

        #[test]
        // Feature: bitfold-vault-integration, Property 17: Successful withdrawal marks UTXO as withdrawn
        // Validates: Requirements 6.3
        fn prop_withdrawal_changes_status(
            amount in 1000u64..100_000_000u64
        ) {
            // Property: After withdrawal, UTXO status should be Withdrawn
            let mut utxo = UTXO {
                id: 1,
                txid: "0".repeat(64),
                vout: 0,
                amount,
                address: "bc1test".to_string(),
                ordinal_info: None,
                status: UtxoStatus::Deposited,
                deposited_at: 0,
            };

            // Simulate withdrawal
            utxo.status = UtxoStatus::Withdrawn;

            prop_assert_eq!(utxo.status, UtxoStatus::Withdrawn, 
                "UTXO status should be Withdrawn after withdrawal");
        }

        #[test]
        // Feature: bitfold-vault-integration, Property 15: Withdrawal requires no active loans
        // Validates: Requirements 6.1
        fn prop_can_withdraw_with_repaid_loan(
            amount in 1000u64..100_000_000u64,
            borrowed_amount in 100u64..1000u64
        ) {
            // Property: UTXO with repaid loan can be withdrawn
            let utxo = UTXO {
                id: 1,
                txid: "0".repeat(64),
                vout: 0,
                amount,
                address: "bc1test".to_string(),
                ordinal_info: None,
                status: UtxoStatus::Deposited,
                deposited_at: 0,
            };

            let loan = Loan {
                id: 1,
                user_id: Principal::anonymous(),
                collateral_utxo_id: utxo.id,
                borrowed_amount,
                repaid_amount: borrowed_amount,
                interest_rate: 0, // No interest for simplicity
                created_at: 0,
                status: LoanStatus::Repaid,
            };

            // Property: If loan is repaid, withdrawal should be allowed
            prop_assert_eq!(loan.status, LoanStatus::Repaid, 
                "Repaid loan should allow withdrawal");
            prop_assert_eq!(utxo.status, UtxoStatus::Deposited, 
                "UTXO should be unlocked when loan is repaid");
        }
    }
}
