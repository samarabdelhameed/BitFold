// Runes Support - Bitcoin Runes Protocol Integration
// Runes are fungible tokens on Bitcoin, similar to BRC-20 but more efficient

use crate::types::OrdinalInfo;
use candid::{CandidType, Deserialize};
use serde::{Deserialize as SerdeDeserialize, Serialize};
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod,
};

/// Runes information structure
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct RuneInfo {
    pub rune_id: String,              // Rune identifier
    pub name: String,                  // Rune name (e.g., "UNCOMMON•GOODS")
    pub symbol: Option<String>,        // Rune symbol
    pub divisibility: u8,              // Decimal places
    pub supply: u64,                   // Total supply
    pub premine: u64,                  // Premined amount
    pub terms: Option<RuneTerms>,      // Minting terms
    pub etching_txid: String,         // Transaction that created the rune
    pub etching_block: u64,            // Block where rune was created
}

/// Rune minting terms
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct RuneTerms {
    pub amount: Option<u64>,           // Amount per mint
    pub cap: Option<u64>,              // Maximum supply cap
    pub offset: Option<u64>,          // Start block offset
    pub height: Option<u64>,           // Start block height
    pub end: Option<u64>,              // End block
}

/// Rune balance for an address
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct RuneBalance {
    pub rune_id: String,
    pub rune_name: String,
    pub balance: u64,
    pub divisibility: u8,
}

/// Maestro API Rune response structure
#[derive(SerdeDeserialize, Debug)]
struct MaestroRuneResponse {
    rune_id: String,
    name: String,
    symbol: Option<String>,
    divisibility: u8,
    supply: String,
    premine: String,
    terms: Option<MaestroRuneTerms>,
    etching_txid: String,
    etching_block: u64,
}

#[derive(SerdeDeserialize, Debug)]
struct MaestroRuneTerms {
    amount: Option<String>,
    cap: Option<String>,
    offset: Option<u64>,
    height: Option<u64>,
    end: Option<u64>,
}

/// Maestro API configuration
const MAESTRO_API_BASE_URL: &str = "https://api.gomaestro.org/v1";
const MAESTRO_API_KEY: &str = ""; // To be configured

/// Verifies if a UTXO contains Runes
/// Returns RuneInfo if runes are found, None otherwise
pub async fn verify_runes(txid: &str, vout: u32) -> Result<Option<Vec<RuneInfo>>, String> {
    // Check if we're in local development mode
    let network = std::env::var("DFX_NETWORK").unwrap_or_else(|_| "local".to_string());
    let skip_verification = network == "local" || network == "playground";
    
    if skip_verification {
        ic_cdk::println!("⚠️  Skipping Runes verification ({} mode)", network);
        return Ok(None);
    }
    
    ic_cdk::println!("🔍 Checking for Runes in UTXO: {}:{}", txid, vout);
    
    // Query Maestro API for Runes
    match get_runes_for_utxo(txid, vout).await {
        Ok(runes) => {
            if runes.is_empty() {
                ic_cdk::println!("ℹ️  No Runes found in UTXO {}:{}", txid, vout);
                Ok(None)
            } else {
                ic_cdk::println!("✅ Found {} Rune(s) in UTXO", runes.len());
                Ok(Some(runes))
            }
        }
        Err(e) => {
            ic_cdk::println!("⚠️  Error checking for Runes: {}", e);
            // Don't fail if Runes check fails - treat as regular UTXO
            Ok(None)
        }
    }
}

/// Gets Runes information for a specific UTXO
async fn get_runes_for_utxo(txid: &str, vout: u32) -> Result<Vec<RuneInfo>, String> {
    let url = format!("{}/runes/utxo/{}:{}", MAESTRO_API_BASE_URL, txid, vout);
    
    let mut headers = vec![
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
    ];
    
    if !MAESTRO_API_KEY.is_empty() {
        headers.push(HttpHeader {
            name: "X-API-Key".to_string(),
            value: MAESTRO_API_KEY.to_string(),
        });
    }
    
    let request = CanisterHttpRequestArgument {
        url: url.clone(),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: Some(50_000), // 50KB for Runes data
        transform: None,
        headers,
    };
    
    let (response,) = http_request(request, 25_000_000_000) // 25B cycles
        .await
        .map_err(|(code, msg)| {
            format!("HTTP request failed with code {:?}: {}", code, msg)
        })?;
    
    if response.status != 200u64 && response.status != 200u32 as u64 {
        return Err(format!(
            "Maestro API returned status {}: {}",
            response.status,
            String::from_utf8_lossy(&response.body)
        ));
    }
    
    let response_body = String::from_utf8(response.body)
        .map_err(|e| format!("Failed to parse response as UTF-8: {}", e))?;
    
    // Parse JSON response
    let runes_data: Vec<MaestroRuneResponse> = serde_json::from_str(&response_body)
        .map_err(|e| format!("Failed to parse JSON response: {}", e))?;
    
    // Convert to RuneInfo
    let runes: Vec<RuneInfo> = runes_data
        .into_iter()
        .map(|r| RuneInfo {
            rune_id: r.rune_id,
            name: r.name,
            symbol: r.symbol,
            divisibility: r.divisibility,
            supply: r.supply.parse().unwrap_or(0),
            premine: r.premine.parse().unwrap_or(0),
            terms: r.terms.map(|t| RuneTerms {
                amount: t.amount.and_then(|a| a.parse().ok()),
                cap: t.cap.and_then(|c| c.parse().ok()),
                offset: t.offset,
                height: t.height,
                end: t.end,
            }),
            etching_txid: r.etching_txid,
            etching_block: r.etching_block,
        })
        .collect();
    
    Ok(runes)
}

/// Gets Rune balances for a Bitcoin address
pub async fn get_rune_balances(address: &str) -> Result<Vec<RuneBalance>, String> {
    let network = std::env::var("DFX_NETWORK").unwrap_or_else(|_| "local".to_string());
    let skip_verification = network == "local" || network == "playground";
    
    if skip_verification {
        ic_cdk::println!("⚠️  Skipping Rune balances check ({} mode)", network);
        return Ok(vec![]);
    }
    
    let url = format!("{}/addresses/{}/runes", MAESTRO_API_BASE_URL, address);
    
    let mut headers = vec![
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
    ];
    
    if !MAESTRO_API_KEY.is_empty() {
        headers.push(HttpHeader {
            name: "X-API-Key".to_string(),
            value: MAESTRO_API_KEY.to_string(),
        });
    }
    
    let request = CanisterHttpRequestArgument {
        url: url.clone(),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: Some(100_000), // 100KB for balances
        transform: None,
        headers,
    };
    
    let (response,) = http_request(request, 25_000_000_000)
        .await
        .map_err(|(code, msg)| {
            format!("HTTP request failed with code {:?}: {}", code, msg)
        })?;
    
    if response.status != 200u64 && response.status != 200u32 as u64 {
        return Err(format!(
            "Maestro API returned status {}: {}",
            response.status,
            String::from_utf8_lossy(&response.body)
        ));
    }
    
    let response_body = String::from_utf8(response.body)
        .map_err(|e| format!("Failed to parse response as UTF-8: {}", e))?;
    
    // Parse and convert to RuneBalance
    // This is a simplified version - adjust based on actual API response format
    let balances: Vec<RuneBalance> = vec![]; // Placeholder
    
    Ok(balances)
}

/// Converts RuneInfo to OrdinalInfo for compatibility
/// This allows Runes to be used as collateral similar to Ordinals
pub fn rune_to_ordinal_info(rune: &RuneInfo) -> OrdinalInfo {
    OrdinalInfo {
        inscription_id: format!("rune:{}", rune.rune_id),
        content_type: "application/rune".to_string(),
        content_preview: Some(format!("Rune: {} ({})", rune.name, rune.supply)),
        metadata: Some(format!(
            r#"{{"rune_id":"{}","name":"{}","supply":{},"divisibility":{}}}"#,
            rune.rune_id, rune.name, rune.supply, rune.divisibility
        )),
    }
}

