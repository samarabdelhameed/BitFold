mod api;
mod bitcoin;
mod ckbtc;
mod helpers;
mod ordinals;
mod state;
mod types;

use ic_cdk_macros::init;

#[init]
fn init() {
    // Initialize canister state
    ic_cdk::println!("Vault canister initialized");
}

// Re-export main API functions
pub use api::*;

