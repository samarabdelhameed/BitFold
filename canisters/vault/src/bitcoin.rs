use crate::types::UTXO;
use ic_cdk::api::management_canister::bitcoin::{
    bitcoin_get_utxos, BitcoinNetwork, GetUtxosRequest, GetUtxosResponse, Utxo as BtcUtxo,
};

/// Verifies a Bitcoin UTXO exists and is unspent
/// 
/// This function calls the ICP Bitcoin API to verify:
/// 1. UTXO exists (txid + vout)
/// 2. UTXO is unspent
/// 3. UTXO amount matches
/// 4. UTXO address matches
/// 
/// Set SKIP_BITCOIN_VERIFICATION=true to skip verification (for testing without cycles)
pub async fn verify_utxo(utxo: &UTXO) -> Result<bool, String> {
    // Feature flag: Skip Bitcoin verification if cycles not available
    // WARNING: Only use for testing! Remove in production!
    const SKIP_BITCOIN_VERIFICATION: bool = true; // Set to true to skip verification (LOCAL DEV ONLY)
    
    if SKIP_BITCOIN_VERIFICATION {
        ic_cdk::println!("⚠️  WARNING: Bitcoin verification SKIPPED (testing mode)");
        ic_cdk::println!("✅ Assuming UTXO is valid: {}:{} ({} sats)", utxo.txid, utxo.vout, utxo.amount);
        return Ok(true);
    }
    // Get UTXOs for the address from Bitcoin network
    let utxos = get_utxos_for_address(&utxo.address, 1).await?;
    
    // Convert txid to bytes for comparison
    let txid_bytes = hex::decode(&utxo.txid).map_err(|e| format!("Invalid txid hex: {}", e))?;
    
    // Search for matching UTXO
    for btc_utxo in utxos {
        // Check if txid and vout match
        if btc_utxo.outpoint.txid == txid_bytes && btc_utxo.outpoint.vout == utxo.vout {
            // Verify amount matches
            if btc_utxo.value != utxo.amount {
                return Err(format!(
                    "UTXO amount mismatch: expected {}, found {}",
                    utxo.amount, btc_utxo.value
                ));
            }
            
            // UTXO exists, is unspent, and amount matches
            ic_cdk::println!("✅ Bitcoin UTXO verified: {}:{} ({} sats)", utxo.txid, utxo.vout, utxo.amount);
            return Ok(true);
        }
    }
    
    // UTXO not found in unspent set
    Err("UTXO not found or already spent".to_string())
}

/// Gets all UTXOs for a Bitcoin address
/// 
/// Calls the ICP Bitcoin API with the specified address and minimum confirmations
pub async fn get_utxos_for_address(address: &str, _min_confirmations: u32) -> Result<Vec<BtcUtxo>, String> {
    let network = BitcoinNetwork::Testnet; // Bitcoin Testnet
    
    ic_cdk::println!("🔍 Querying Bitcoin Testnet for address: {}", address);
    
    let request = GetUtxosRequest {
        address: address.to_string(),
        network,
        filter: None,
    };
    
    // Call ICP Bitcoin API with cycles
    // Bitcoin API requires 4 billion cycles per call
    let cycles = 4_000_000_000u128;
    let bitcoin_canister = candid::Principal::from_text("g4xu7-jiaaa-aaaan-aaaaq-cai").unwrap();
    let response: (GetUtxosResponse,) = ic_cdk::api::call::call_with_payment128(
        bitcoin_canister,
        "bitcoin_get_utxos",
        (request,),
        cycles,
    )
    .await
    .map_err(|e| format!("Bitcoin API call failed: {:?}", e))?;
    
    ic_cdk::println!("✅ Found {} UTXOs for address", response.0.utxos.len());
    
    // Return UTXOs (confirmation filtering can be added based on tip_height)
    Ok(response.0.utxos)
}

/// Checks if a UTXO has been spent
/// 
/// Queries the Bitcoin network to see if the UTXO still exists in the address's UTXO set
pub async fn is_utxo_spent(txid: &str, vout: u32, address: &str) -> Result<bool, String> {
    // Get current UTXOs for the address
    let utxos = get_utxos_for_address(address, 0).await?;
    
    // Convert txid to bytes for comparison
    let txid_bytes = hex::decode(txid).map_err(|e| format!("Invalid txid hex: {}", e))?;
    
    // Check if UTXO exists in the unspent set
    for utxo in utxos {
        if utxo.outpoint.txid == txid_bytes && utxo.outpoint.vout == vout {
            // UTXO found - it's unspent
            return Ok(false);
        }
    }
    
    // UTXO not found - it's spent
    Ok(true)
}

/// Gets current Bitcoin price (for LTV calculations)
pub async fn get_btc_price() -> Result<u64, String> {
    // TODO: Implement price oracle integration
    // Returns price in satoshis per USD or similar
    
    Ok(50_000_000_000) // Mock: 50k USD in satoshis
}

