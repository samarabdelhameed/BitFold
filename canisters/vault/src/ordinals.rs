use crate::types::OrdinalInfo;
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod,
};
use serde::{Deserialize, Serialize};

/// Indexer Canister ID (to be configured)
const INDEXER_CANISTER_ID: &str = "ryjl3-tyaaa-aaaaa-aaaba-cai"; // Example ID

/// Maestro API configuration
const MAESTRO_API_BASE_URL: &str = "https://api.gomaestro.org/v1";
const MAESTRO_API_KEY: &str = ""; // To be configured via environment or init args

/// Response structure from Maestro API for inscription metadata
#[derive(Serialize, Deserialize, Debug)]
struct MaestroInscriptionResponse {
    inscription_id: String,
    content_type: Option<String>,
    content: Option<String>,
    metadata: Option<serde_json::Value>,
}

/// Verifies an Ordinal inscription exists
pub async fn verify_ordinal(txid: &str, vout: u32) -> Result<Option<OrdinalInfo>, String> {
    // Construct inscription ID from txid and vout
    let inscription_id = format!("{}i{}", txid, vout);
    
    ic_cdk::println!("🔍 Checking for Ordinal inscription: {}", inscription_id);
    
    // Try to get inscription metadata from Maestro API
    match get_inscription_metadata(&inscription_id).await {
        Ok(ordinal_info) => {
            ic_cdk::println!("✅ Found Ordinal inscription: {} ({})", inscription_id, ordinal_info.content_type);
            Ok(Some(ordinal_info))
        }
        Err(e) => {
            // If inscription not found or API error, treat as regular UTXO
            // Only return error if it's a critical API failure
            if e.contains("HTTP request failed") {
                return Err(format!("Ordinals indexer unavailable: {}", e));
            }
            
            // 404 or inscription not found - this is OK, just means no inscription
            ic_cdk::println!("ℹ️  No inscription found for {}:{}, treating as regular UTXO", txid, vout);
            Ok(None)
        }
    }
}

/// Gets detailed inscription metadata from Maestro API
pub async fn get_inscription_metadata(inscription_id: &str) -> Result<OrdinalInfo, String> {
    // Construct the API URL
    let url = format!("{}/inscriptions/{}", MAESTRO_API_BASE_URL, inscription_id);
    
    // Prepare headers
    let mut headers = vec![
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
    ];
    
    // Add API key if configured
    if !MAESTRO_API_KEY.is_empty() {
        headers.push(HttpHeader {
            name: "X-API-Key".to_string(),
            value: MAESTRO_API_KEY.to_string(),
        });
    }
    
    // Create HTTP request
    let request = CanisterHttpRequestArgument {
        url: url.clone(),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: Some(10_000), // 10KB should be enough for metadata
        transform: None,
        headers,
    };
    
    // Make the HTTP outcall
    let (response,) = http_request(request, 25_000_000_000) // 25B cycles
        .await
        .map_err(|(code, msg)| {
            format!("HTTP request failed with code {:?}: {}", code, msg)
        })?;
    
    // Check response status
    if response.status != 200u64 && response.status != 200u32 as u64 {
        return Err(format!(
            "Maestro API returned status {}: {}",
            response.status,
            String::from_utf8_lossy(&response.body)
        ));
    }
    
    // Parse JSON response
    let response_body = String::from_utf8(response.body)
        .map_err(|e| format!("Failed to parse response as UTF-8: {}", e))?;
    
    let maestro_response: MaestroInscriptionResponse = serde_json::from_str(&response_body)
        .map_err(|e| format!("Failed to parse JSON response: {}", e))?;
    
    // Convert to OrdinalInfo
    Ok(OrdinalInfo {
        inscription_id: maestro_response.inscription_id,
        content_type: maestro_response.content_type.unwrap_or_else(|| "unknown".to_string()),
        content_preview: maestro_response.content,
        metadata: maestro_response.metadata.map(|m| m.to_string()),
    })
}

