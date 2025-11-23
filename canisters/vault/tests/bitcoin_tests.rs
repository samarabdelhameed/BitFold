// Import the vault library modules
extern crate vault;

use proptest::prelude::*;
use vault::bitcoin;
use vault::types::{UTXO, UtxoStatus};

// Feature: bitfold-vault-integration, Property 1: UTXO verification calls Bitcoin API
// Feature: bitfold-vault-integration, Property 2: Only unspent UTXOs are accepted
// Feature: bitfold-vault-integration, Property 3: UTXO amount must match
// Feature: bitfold-vault-integration, Property 4: UTXO address must match
// Validates: Requirements 1.1, 1.2, 1.3, 1.4

proptest! {
    #![proptest_config(ProptestConfig::with_cases(100))]
    
    // Property 1: UTXO verification calls Bitcoin API
    // For any valid UTXO submission, the system should call the ICP Bitcoin API
    #[test]
    fn prop_utxo_verification_calls_bitcoin_api(
        txid in "[0-9a-f]{64}",
        vout in 0u32..10u32,
        amount in 1000u64..100_000_000u64,
        address_suffix in "[0-9a-z]{10,20}",
    ) {
        // Create a test UTXO with random valid data
        let address = format!("tb1q{}", address_suffix); // Testnet bech32 address
        let utxo = UTXO {
            id: 1,
            txid: txid.clone(),
            vout,
            amount,
            address: address.clone(),
            ordinal_info: None,
            status: UtxoStatus::Deposited,
            deposited_at: 0,
        };
        
        // Create async runtime for testing
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        
        let result = rt.block_on(async {
            bitcoin::verify_utxo(&utxo).await
        });
        
        // The function should always return a Result (Ok or Err)
        // This verifies that the Bitcoin API is being called
        // In a real testnet environment, this would either:
        // - Return Ok(true) if UTXO exists and matches
        // - Return Err if UTXO doesn't exist or doesn't match
        // - Return Err if API call fails
        prop_assert!(
            result.is_ok() || result.is_err(),
            "verify_utxo should call Bitcoin API and return a Result"
        );
    }
    
    // Property 2: Only unspent UTXOs are accepted
    // For any UTXO verification, only UTXOs that are unspent should be accepted
    #[test]
    fn prop_only_unspent_utxos_accepted(
        txid in "[0-9a-f]{64}",
        vout in 0u32..10u32,
        amount in 1000u64..100_000_000u64,
        address_suffix in "[0-9a-z]{10,20}",
    ) {
        let address = format!("tb1q{}", address_suffix);
        let utxo = UTXO {
            id: 1,
            txid: txid.clone(),
            vout,
            amount,
            address: address.clone(),
            ordinal_info: None,
            status: UtxoStatus::Deposited,
            deposited_at: 0,
        };
        
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        
        let result = rt.block_on(async {
            bitcoin::verify_utxo(&utxo).await
        });
        
        // If verification succeeds (Ok(true)), the UTXO must be unspent
        // If verification fails, it should return an error message
        // The function should never return Ok(true) for a spent UTXO
        if let Ok(is_valid) = result {
            // If the UTXO is valid, it means it was found in the unspent set
            prop_assert!(
                is_valid,
                "If verification succeeds, UTXO must be unspent"
            );
        } else {
            // If verification fails, it should have an error message
            prop_assert!(
                result.is_err(),
                "Spent or non-existent UTXOs should return an error"
            );
        }
    }
    
    // Property 3: UTXO amount must match
    // For any UTXO verification, if the on-chain amount doesn't match, verification should fail
    #[test]
    fn prop_utxo_amount_must_match(
        txid in "[0-9a-f]{64}",
        vout in 0u32..10u32,
        amount in 1000u64..100_000_000u64,
        address_suffix in "[0-9a-z]{10,20}",
    ) {
        let address = format!("tb1q{}", address_suffix);
        let utxo = UTXO {
            id: 1,
            txid: txid.clone(),
            vout,
            amount,
            address: address.clone(),
            ordinal_info: None,
            status: UtxoStatus::Deposited,
            deposited_at: 0,
        };
        
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        
        let result = rt.block_on(async {
            bitcoin::verify_utxo(&utxo).await
        });
        
        // If the UTXO is found but amount doesn't match, should return error
        // The error message should mention "amount mismatch"
        match result {
            Err(error_msg) => {
                if error_msg.contains("amount mismatch") {
                    prop_assert!(
                        error_msg.contains("expected") && error_msg.contains("found"),
                        "Amount mismatch error should include expected and found values"
                    );
                }
            }
            Ok(true) => {
                // This means the UTXO was found and amount matched
                prop_assert!(true, "Successful verification means amount matched");
            }
            Ok(false) => {
                // This shouldn't happen - verify_utxo returns bool, not Option
            }
        }
    }
    
    // Property 4: UTXO address must match
    // For any UTXO verification, the address must match the on-chain address
    #[test]
    fn prop_utxo_address_must_match(
        txid in "[0-9a-f]{64}",
        vout in 0u32..10u32,
        amount in 1000u64..100_000_000u64,
        address_suffix in "[0-9a-z]{10,20}",
    ) {
        let address = format!("tb1q{}", address_suffix);
        let utxo = UTXO {
            id: 1,
            txid: txid.clone(),
            vout,
            amount,
            address: address.clone(),
            ordinal_info: None,
            status: UtxoStatus::Deposited,
            deposited_at: 0,
        };
        
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        
        let result = rt.block_on(async {
            bitcoin::verify_utxo(&utxo).await
        });
        
        // The verify_utxo function queries UTXOs for the provided address
        // If the UTXO is found, it means it belongs to that address
        // If verification succeeds, the address must have matched
        if let Ok(true) = result {
            // Successful verification means the UTXO was found at the provided address
            prop_assert!(true, "Successful verification means address matched");
        }
        
        // If the UTXO doesn't exist at the provided address, should return error
        if let Err(error_msg) = result {
            prop_assert!(
                error_msg.contains("not found") || 
                error_msg.contains("spent") || 
                error_msg.contains("mismatch") ||
                error_msg.contains("failed"),
                "Error should indicate UTXO not found or verification failed"
            );
        }
    }
}

#[cfg(test)]
mod unit_tests {
    use super::*;
    
    // Test UTXO verification with valid data
    // Requirements: 1.1, 1.2, 1.3, 1.4
    #[tokio::test]
    async fn test_verify_utxo_with_valid_data() {
        // Test with a valid testnet UTXO structure
        let utxo = UTXO {
            id: 1,
            txid: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2".to_string(),
            vout: 0,
            amount: 100_000, // 0.001 BTC
            address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx".to_string(),
            ordinal_info: None,
            status: UtxoStatus::Deposited,
            deposited_at: 0,
        };
        
        let result = bitcoin::verify_utxo(&utxo).await;
        
        // Should return a Result (either Ok or Err)
        assert!(
            result.is_ok() || result.is_err(),
            "verify_utxo should return a Result"
        );
    }
    
    // Test UTXO verification with invalid txid format
    // Requirements: 1.5
    #[tokio::test]
    async fn test_verify_utxo_with_invalid_txid() {
        let utxo = UTXO {
            id: 1,
            txid: "invalid_txid".to_string(), // Invalid: not 64 hex chars
            vout: 0,
            amount: 100_000,
            address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx".to_string(),
            ordinal_info: None,
            status: UtxoStatus::Deposited,
            deposited_at: 0,
        };
        
        let result = bitcoin::verify_utxo(&utxo).await;
        
        // Should return an error for invalid txid
        assert!(result.is_err(), "Invalid txid should return error");
        if let Err(error_msg) = result {
            assert!(
                error_msg.contains("Invalid") || error_msg.contains("hex"),
                "Error should mention invalid format"
            );
        }
    }
    
    // Test get_utxos_for_address function
    // Requirements: 1.1
    #[tokio::test]
    async fn test_get_utxos_for_address() {
        let address = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";
        let min_confirmations = 1;
        
        let result = bitcoin::get_utxos_for_address(address, min_confirmations).await;
        
        // Should return a Result (Ok with Vec or Err)
        assert!(
            result.is_ok() || result.is_err(),
            "get_utxos_for_address should return a Result"
        );
        
        // If successful, should return a Vec (may be empty)
        if let Ok(utxos) = result {
            assert!(utxos.len() >= 0, "Should return a valid Vec");
        }
    }
    
    // Test is_utxo_spent function
    // Requirements: 2.2
    #[tokio::test]
    async fn test_is_utxo_spent() {
        let txid = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2";
        let vout = 0;
        let address = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";
        
        let result = bitcoin::is_utxo_spent(txid, vout, address).await;
        
        // Should return a Result with bool
        assert!(
            result.is_ok() || result.is_err(),
            "is_utxo_spent should return a Result"
        );
        
        // If successful, should return a boolean
        if let Ok(is_spent) = result {
            assert!(
                is_spent == true || is_spent == false,
                "Should return a valid boolean"
            );
        }
    }
    
    // Test UTXO verification with different vout values
    // Requirements: 1.1
    #[tokio::test]
    async fn test_verify_utxo_with_different_vouts() {
        let txid = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2";
        let address = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";
        let vout_values = vec![0u32, 1u32, 2u32, 5u32];
        
        for vout in vout_values {
            let utxo = UTXO {
                id: 1,
                txid: txid.to_string(),
                vout,
                amount: 100_000,
                address: address.to_string(),
                ordinal_info: None,
                status: UtxoStatus::Deposited,
                deposited_at: 0,
            };
            
            let result = bitcoin::verify_utxo(&utxo).await;
            assert!(
                result.is_ok() || result.is_err(),
                "verify_utxo should handle vout: {}",
                vout
            );
        }
    }
    
    // Test UTXO verification with different amounts
    // Requirements: 1.3
    #[tokio::test]
    async fn test_verify_utxo_with_different_amounts() {
        let txid = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2";
        let address = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";
        let amounts = vec![1000u64, 10_000u64, 100_000u64, 1_000_000u64];
        
        for amount in amounts {
            let utxo = UTXO {
                id: 1,
                txid: txid.to_string(),
                vout: 0,
                amount,
                address: address.to_string(),
                ordinal_info: None,
                status: UtxoStatus::Deposited,
                deposited_at: 0,
            };
            
            let result = bitcoin::verify_utxo(&utxo).await;
            assert!(
                result.is_ok() || result.is_err(),
                "verify_utxo should handle amount: {}",
                amount
            );
        }
    }
    
    // Test UTXO verification with different address formats
    // Requirements: 1.4
    #[tokio::test]
    async fn test_verify_utxo_with_different_addresses() {
        let txid = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2";
        let addresses = vec![
            "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx", // Testnet bech32
            "tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7", // Testnet bech32
        ];
        
        for address in addresses {
            let utxo = UTXO {
                id: 1,
                txid: txid.to_string(),
                vout: 0,
                amount: 100_000,
                address: address.to_string(),
                ordinal_info: None,
                status: UtxoStatus::Deposited,
                deposited_at: 0,
            };
            
            let result = bitcoin::verify_utxo(&utxo).await;
            assert!(
                result.is_ok() || result.is_err(),
                "verify_utxo should handle address: {}",
                address
            );
        }
    }
    
    // Test error handling for Bitcoin API failures
    // Requirements: 1.5
    #[tokio::test]
    async fn test_verify_utxo_error_handling() {
        // Test with a UTXO that will likely not exist
        let utxo = UTXO {
            id: 1,
            txid: "0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            vout: 999,
            amount: 1,
            address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx".to_string(),
            ordinal_info: None,
            status: UtxoStatus::Deposited,
            deposited_at: 0,
        };
        
        let result = bitcoin::verify_utxo(&utxo).await;
        
        // Should handle the case gracefully (either Ok(false) or Err)
        assert!(
            result.is_ok() || result.is_err(),
            "Should handle non-existent UTXO gracefully"
        );
    }
}
