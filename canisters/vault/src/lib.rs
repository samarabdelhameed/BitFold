// BitFold Vault Canister - Main Entry Point
// This canister manages Bitcoin UTXO collateral and ckBTC loans

mod api;
pub mod bitcoin;
pub mod ckbtc;
pub mod helpers;
pub mod ordinals;
mod state;
pub mod types;

// Re-export API functions
pub use api::*;
