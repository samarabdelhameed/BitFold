// BitFold Vault Canister - Main Entry Point
// This canister manages Bitcoin UTXO collateral and ckBTC loans

mod api;
mod bitcoin;
mod ckbtc;
mod helpers;
mod ordinals;
mod state;
mod types;

// Re-export API functions
pub use api::*;
