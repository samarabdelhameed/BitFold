use candid::{CandidType, Deserialize};
use serde::Serialize;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct OrdinalInfo {
    pub inscription_id: String,
    pub content_type: String,
    pub content_preview: Option<String>,
    pub metadata: Option<String>,
}

/// Mock endpoint to verify an Ordinal inscription
#[ic_cdk::query]
pub fn get_ordinal(txid: String, vout: u32) -> Option<OrdinalInfo> {
    // Mock implementation - returns fake Ordinal info for testing
    Some(OrdinalInfo {
        inscription_id: format!("{}:{}", txid, vout),
        content_type: "image/png".to_string(),
        content_preview: Some("https://example.com/preview.png".to_string()),
        metadata: Some(r#"{"name": "Test Ordinal", "collection": "Test"}"#.to_string()),
    })
}

/// Mock endpoint to check if a UTXO has an Ordinal
#[ic_cdk::query]
pub fn has_ordinal(_txid: String, _vout: u32) -> bool {
    // Mock implementation - always returns true for testing
    true
}

#[ic_cdk::init]
fn init() {
    ic_cdk::println!("Indexer stub canister initialized");
}

