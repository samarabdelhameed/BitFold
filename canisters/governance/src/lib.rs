use candid::{CandidType, Deserialize};
use serde::Serialize;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct LTVConfig {
    pub standard_btc: u64,      // LTV for standard Bitcoin (basis points)
    pub ordinals: u64,           // LTV for Ordinals (basis points)
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct InterestRateConfig {
    pub base_rate: u64,          // Base interest rate (basis points)
    pub max_rate: u64,           // Maximum interest rate (basis points)
}

thread_local! {
    static LTV_CONFIG: std::cell::RefCell<LTVConfig> = std::cell::RefCell::new(LTVConfig {
        standard_btc: 5000,  // 50%
        ordinals: 3000,      // 30%
    });
    
    static INTEREST_CONFIG: std::cell::RefCell<InterestRateConfig> = std::cell::RefCell::new(InterestRateConfig {
        base_rate: 500,     // 5%
        max_rate: 2000,     // 20%
    });
}

/// Gets current LTV configuration
#[ic_cdk::query]
pub fn get_ltv_config() -> LTVConfig {
    LTV_CONFIG.with(|config| config.borrow().clone())
}

/// Sets LTV configuration (admin only)
#[ic_cdk::update]
pub fn set_ltv_config(config: LTVConfig) -> Result<(), String> {
    // TODO: Add admin check
    LTV_CONFIG.with(|c| {
        *c.borrow_mut() = config;
    });
    Ok(())
}

/// Gets current interest rate configuration
#[ic_cdk::query]
pub fn get_interest_config() -> InterestRateConfig {
    INTEREST_CONFIG.with(|config| config.borrow().clone())
}

/// Sets interest rate configuration (admin only)
#[ic_cdk::update]
pub fn set_interest_config(config: InterestRateConfig) -> Result<(), String> {
    // TODO: Add admin check
    INTEREST_CONFIG.with(|c| {
        *c.borrow_mut() = config;
    });
    Ok(())
}

#[ic_cdk::init]
fn init() {
    ic_cdk::println!("Governance canister initialized");
}

