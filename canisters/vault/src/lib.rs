// BitFold Vault Canister - Main Entry Point
// This canister manages Bitcoin UTXO collateral and ckBTC loans

mod api;
pub mod bitcoin;
pub mod ckbtc;
pub mod helpers;
pub mod ordinals;
pub mod runes;
pub mod schnorr;
pub mod solana;
mod state;
pub mod types;
pub mod vetkeys;

// Re-export API functions
pub use api::*;
