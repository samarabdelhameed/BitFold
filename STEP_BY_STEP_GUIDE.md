# دليل التنفيذ خطوة بخطوة - BitFold

## 🎯 الهدف

تحويل المشروع من بنية جاهزة إلى تطبيق يعمل بالكامل.

---

## 📦 الخطوة 1: إصلاح البنية الأساسية

### 1.1 تحديث `lib.rs`

**المشكلة الحالية**: `lib.rs` يحتوي على كود قديم بسيط بدلاً من استخدام الملفات المنظمة.

**الحل**:

```rust
// canisters/vault/src/lib.rs
pub mod api;
pub mod bitcoin;
pub mod ckbtc;
pub mod helpers;
pub mod ordinals;
pub mod state;
pub mod types;

// Re-export main API functions
pub use api::*;

// Export candid interface
candid::export_candid!();
```

**الإجراءات**:

1. فتح `canisters/vault/src/lib.rs`
2. استبدال المحتوى بالكود أعلاه
3. التأكد من أن جميع الـ modules موجودة

---

### 1.2 تحديث `Cargo.toml`

**إضافة dependencies المطلوبة**:

```toml
[dependencies]
ic-cdk = "0.13"
ic-cdk-macros = "0.13"
serde = { version = "1.0", features = ["derive"] }
candid = "0.10"
# إضافة هذه:
ic-icrc1-ledger = "0.1.0"  # للـ ckBTC
# أو استخدام ic_cdk::api::call مباشرة
```

**ملاحظة**: للـ Bitcoin API، نستخدم `ic_cdk::api::management_canister::bitcoin` المدمج.

---

### 1.3 اختبار البنية

```bash
cd canisters/vault
cargo check
dfx build
```

**إذا نجح**: ✅ جاهز للخطوة التالية  
**إذا فشل**: راجع أخطاء الـ compiler وأصلحها

---

## 🔗 الخطوة 2: تنفيذ Bitcoin Integration

### 2.1 تحديث `bitcoin.rs`

**الكود الكامل**:

```rust
// canisters/vault/src/bitcoin.rs
use crate::types::UTXO;
use ic_cdk::api::management_canister::bitcoin::{
    BitcoinNetwork, GetUtxosRequest, GetUtxosResponse, MillisatoshiPerByte,
    Satoshi,
};
use ic_cdk::api::management_canister::bitcoin::{
    bitcoin_get_utxos, bitcoin_get_current_fee_percentiles,
};

const BITCOIN_NETWORK: BitcoinNetwork = BitcoinNetwork::Testnet; // أو Mainnet

pub async fn verify_utxo(utxo: &UTXO) -> Result<bool, String> {
    // 1. الحصول على UTXOs للعنوان
    let request = GetUtxosRequest {
        address: utxo.address.clone(),
        network: BITCOIN_NETWORK,
        filter: None,
        min_confirmations: Some(1),
    };

    match bitcoin_get_utxos(request).await {
        Ok((response,)) => {
            let GetUtxosResponse { utxos, .. } = response;

            // 2. البحث عن UTXO المطلوب
            let found = utxos.iter().any(|u| {
                u.outpoint.txid.to_string() == utxo.txid
                && u.outpoint.vout == utxo.vout
            });

            if !found {
                return Err("UTXO not found".to_string());
            }

            // 3. التحقق من المبلغ
            let utxo_data = utxos.iter().find(|u| {
                u.outpoint.txid.to_string() == utxo.txid
                && u.outpoint.vout == utxo.vout
            }).unwrap();

            if utxo_data.value < utxo.amount {
                return Err("UTXO amount mismatch".to_string());
            }

            Ok(true)
        }
        Err(e) => Err(format!("Bitcoin API error: {:?}", e)),
    }
}

pub async fn is_utxo_spent(txid: &str, vout: u32) -> Result<bool, String> {
    // التحقق من أن UTXO لم يُستهلك
    // يمكن استخدام get_utxos والتحقق من عدم وجوده
    Ok(false) // TODO: تنفيذ فعلي
}

pub async fn get_btc_price() -> Result<u64, String> {
    // TODO: استخدام price oracle
    Ok(50_000_000_000) // Mock
}
```

**الإجراءات**:

1. استبدال محتوى `bitcoin.rs` بالكود أعلاه
2. `cargo check` للتأكد من عدم وجود أخطاء
3. `dfx build` للبناء

---

### 2.2 اختبار Bitcoin Integration

**ملاحظة**: للاختبار على testnet، تحتاج:

- Bitcoin testnet address
- UTXO على testnet

**اختبار بسيط**:

```rust
// في tests أو update function
let utxo = UTXO {
    id: 0,
    txid: "test_txid".to_string(),
    vout: 0,
    amount: 1000,
    address: "test_address".to_string(),
    ordinal_info: None,
    status: UtxoStatus::Deposited,
    deposited_at: 0,
};

let result = verify_utxo(&utxo).await;
```

---

## 🎨 الخطوة 3: تنفيذ Ordinals Integration

### 3.1 تحديث `ordinals.rs`

**خيار 1: استخدام Mock Indexer (للـ dev)**:

```rust
// canisters/vault/src/ordinals.rs
use crate::types::OrdinalInfo;
use ic_cdk::api::call::CallResult;
use candid::{Principal, CandidType, Deserialize};

const INDEXER_CANISTER_ID: &str = "ryjl3-tyaaa-aaaaa-aaaba-cai"; // Mock canister

#[derive(CandidType, Deserialize)]
struct VerifyOrdinalRequest {
    txid: String,
    vout: u32,
}

#[derive(CandidType, Deserialize)]
struct VerifyOrdinalResponse {
    found: bool,
    ordinal_info: Option<OrdinalInfo>,
}

pub async fn verify_ordinal(txid: &str, vout: u32) -> Result<Option<OrdinalInfo>, String> {
    // استدعاء indexer canister
    let indexer_principal = Principal::from_text(INDEXER_CANISTER_ID)
        .map_err(|e| format!("Invalid principal: {:?}", e))?;

    let request = VerifyOrdinalRequest {
        txid: txid.to_string(),
        vout,
    };

    let result: CallResult<(VerifyOrdinalResponse,)> = ic_cdk::api::call::call(
        indexer_principal,
        "verify_ordinal",
        (&request,),
    )
    .await;

    match result {
        Ok((response,)) => {
            if response.found {
                Ok(response.ordinal_info)
            } else {
                Ok(None)
            }
        }
        Err(e) => {
            // Fallback: mock response للـ dev
            ic_cdk::println!("Indexer call failed: {:?}, using mock", e);
            Ok(Some(OrdinalInfo {
                inscription_id: format!("{}:{}", txid, vout),
                content_type: "image/png".to_string(),
                content_preview: None,
                metadata: None,
            }))
        }
    }
}

pub async fn get_ordinal_metadata(inscription_id: &str) -> Result<OrdinalInfo, String> {
    // TODO: تنفيذ فعلي
    Ok(OrdinalInfo {
        inscription_id: inscription_id.to_string(),
        content_type: "image/png".to_string(),
        content_preview: None,
        metadata: None,
    })
}
```

**خيار 2: استخدام Maestro API (HTTP Outcall)**:

```rust
// يمكن استخدام HTTP outcall للاتصال بـ Maestro API
// لكن هذا يتطلب إعداد أكثر تعقيداً
```

**الإجراءات**:

1. استبدال `ordinals.rs` بالكود أعلاه
2. تحديث `indexer_stub` canister لدعم `verify_ordinal`
3. `cargo check` و `dfx build`

---

### 3.2 تحديث `indexer_stub` Canister

```rust
// canisters/indexer_stub/src/lib.rs
use candid::{CandidType, Deserialize};
use ic_cdk_macros::*;

#[derive(CandidType, Deserialize)]
pub struct VerifyOrdinalRequest {
    pub txid: String,
    pub vout: u32,
}

#[derive(CandidType, Deserialize)]
pub struct VerifyOrdinalResponse {
    pub found: bool,
    pub ordinal_info: Option<OrdinalInfo>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct OrdinalInfo {
    pub inscription_id: String,
    pub content_type: String,
    pub content_preview: Option<String>,
    pub metadata: Option<String>,
}

#[query]
fn verify_ordinal(request: VerifyOrdinalRequest) -> VerifyOrdinalResponse {
    // Mock implementation
    VerifyOrdinalResponse {
        found: true,
        ordinal_info: Some(OrdinalInfo {
            inscription_id: format!("{}:{}", request.txid, request.vout),
            content_type: "image/png".to_string(),
            content_preview: None,
            metadata: None,
        }),
    }
}

candid::export_candid!();
```

---

## 💰 الخطوة 4: تنفيذ ckBTC Integration

### 4.1 تحديث `ckbtc.rs`

```rust
// canisters/vault/src/ckbtc.rs
use candid::Principal;
use ic_cdk::api::call::CallResult;
use candid::{CandidType, Deserialize, Nat};

// ckBTC Ledger Canister ID (testnet)
const CKBTC_LEDGER_CANISTER_ID: &str = "mxzaz-hqaaa-aaaar-qaada-cai"; // Testnet
// Mainnet: "mxzaz-hqaaa-aaaar-qaada-cai"

#[derive(CandidType, Deserialize)]
struct TransferArgs {
    to: Principal,
    amount: Nat,
}

#[derive(CandidType, Deserialize)]
struct TransferResult {
    Ok: Option<Nat>, // Block index
    Err: Option<String>,
}

pub async fn mint_ckbtc(to: Principal, amount: u64) -> Result<u64, String> {
    // ملاحظة: ckBTC minting يتم عبر minter canister
    // لكن للتبسيط، سنستخدم ledger مباشرة

    let ledger_principal = Principal::from_text(CKBTC_LEDGER_CANISTER_ID)
        .map_err(|e| format!("Invalid principal: {:?}", e))?;

    // في الواقع، ckBTC minting يحتاج minter canister
    // لكن للـ demo، يمكن mock هذا

    ic_cdk::println!("Minting {} satoshis of ckBTC to {}", amount, to);

    // TODO: استدعاء minter canister
    // للآن، نعيد success
    Ok(amount)
}

pub async fn burn_ckbtc(from: Principal, amount: u64) -> Result<u64, String> {
    // Burn ckBTC
    ic_cdk::println!("Burning {} satoshis of ckBTC from {}", amount, from);

    // TODO: التحقق من أن from أرسل ckBTC للـ canister
    // ثم استدعاء burn

    Ok(amount)
}

pub async fn transfer_ckbtc(to: Principal, amount: u64) -> Result<u64, String> {
    let ledger_principal = Principal::from_text(CKBTC_LEDGER_CANISTER_ID)
        .map_err(|e| format!("Invalid principal: {:?}", e))?;

    let args = TransferArgs {
        to,
        amount: Nat::from(amount),
    };

    let result: CallResult<(TransferResult,)> = ic_cdk::api::call::call(
        ledger_principal,
        "icrc1_transfer",
        (&args,),
    )
    .await;

    match result {
        Ok((response,)) => {
            if response.Ok.is_some() {
                Ok(amount)
            } else {
                Err(response.Err.unwrap_or("Transfer failed".to_string()))
            }
        }
        Err(e) => Err(format!("Transfer error: {:?}", e)),
    }
}

pub async fn get_ckbtc_balance(principal: Principal) -> Result<u64, String> {
    let ledger_principal = Principal::from_text(CKBTC_LEDGER_CANISTER_ID)
        .map_err(|e| format!("Invalid principal: {:?}", e))?;

    // TODO: استدعاء balance_of
    Ok(0)
}
```

**ملاحظة مهمة**:

- للـ demo، يمكن استخدام mock functions
- للـ production، تحتاج تكامل كامل مع ckBTC minter/ledger

---

## 🔧 الخطوة 5: إكمال API Functions

### 5.1 مراجعة `api.rs`

**تأكد من**:

1. جميع functions تستخدم Bitcoin/ckBTC/Ordinals integrations
2. Error handling شامل
3. Validation للـ inputs

**مثال على function محدثة**:

```rust
// في api.rs - deposit_utxo
pub async fn deposit_utxo(request: DepositUtxoRequest) -> Result<UtxoId, String> {
    let caller = msg_caller();

    // Validation
    if !is_valid_txid(&request.txid) {
        return Err("Invalid transaction ID".to_string());
    }

    if !is_valid_btc_address(&request.address) {
        return Err("Invalid Bitcoin address".to_string());
    }

    // Create UTXO object
    let utxo = UTXO {
        id: 0,
        txid: request.txid.clone(),
        vout: request.vout,
        amount: request.amount,
        address: request.address.clone(),
        ordinal_info: request.ordinal_info.clone(),
        status: UtxoStatus::Deposited,
        deposited_at: get_timestamp(),
    };

    // Verify UTXO with Bitcoin API
    let verified = bitcoin::verify_utxo(&utxo).await?;
    if !verified {
        return Err("UTXO verification failed".to_string());
    }

    // If Ordinal, verify with indexer
    let mut ordinal_info = request.ordinal_info;
    if ordinal_info.is_none() {
        ordinal_info = ordinals::verify_ordinal(&utxo.txid, utxo.vout).await?;
    }

    // Store UTXO
    let utxo_id = State::with(|state| {
        let id = state.next_utxo_id;
        state.next_utxo_id += 1;

        let mut utxo = utxo;
        utxo.id = id;
        if ordinal_info.is_some() {
            utxo.ordinal_info = ordinal_info;
        }

        state.utxos.insert(id, utxo.clone());
        state.user_utxos
            .entry(caller)
            .or_insert_with(Vec::new)
            .push(id);

        id
    });

    Ok(utxo_id)
}
```

---

## 🎨 الخطوة 6: Frontend Integration

### 6.1 إعداد ICP Agent

**تثبيت dependencies**:

```bash
cd frontend
npm install @dfinity/agent @dfinity/auth-client @dfinity/identity
```

**إنشاء service**:

```typescript
// frontend/src/services/vaultService.ts
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../canisters/vault/vault.did";
import { Principal } from "@dfinity/principal";

const VAULT_CANISTER_ID = process.env.VITE_VAULT_CANISTER_ID || "";

export class VaultService {
  private agent: HttpAgent;
  private actor: any;

  async init() {
    this.agent = new HttpAgent({
      host: process.env.VITE_ICP_HOST || "http://localhost:4943",
    });

    // للـ local development
    if (process.env.NODE_ENV === "development") {
      await this.agent.fetchRootKey();
    }

    this.actor = Actor.createActor(idlFactory, {
      agent: this.agent,
      canisterId: Principal.fromText(VAULT_CANISTER_ID),
    });
  }

  async depositUtxo(request: {
    txid: string;
    vout: number;
    amount: bigint;
    address: string;
    ordinal_info?: any;
  }): Promise<bigint> {
    return await this.actor.deposit_utxo(request);
  }

  async borrow(request: { utxo_id: bigint; amount: bigint }): Promise<bigint> {
    return await this.actor.borrow(request);
  }

  async repay(request: { loan_id: bigint; amount: bigint }): Promise<void> {
    return await this.actor.repay(request);
  }

  async withdrawCollateral(utxo_id: bigint): Promise<void> {
    return await this.actor.withdraw_collateral(utxo_id);
  }

  async getUserLoans(): Promise<any[]> {
    return await this.actor.get_user_loans();
  }

  async getLoan(loan_id: bigint): Promise<any> {
    return await this.actor.get_loan(loan_id);
  }
}

export const vaultService = new VaultService();
```

### 6.2 تحديث `AppContext.tsx`

```typescript
// إضافة في AppContext
import { vaultService } from "../services/vaultService";
import { AuthClient } from "@dfinity/auth-client";

// في AppProvider
const [authClient, setAuthClient] = useState<AuthClient | null>(null);

useEffect(() => {
  const init = async () => {
    await vaultService.init();
    const client = await AuthClient.create();
    setAuthClient(client);
  };
  init();
}, []);
```

### 6.3 تحديث الصفحات

**مثال: `ScanOrdinal.tsx`**:

```typescript
const handleScan = async () => {
  if (!utxo.trim()) {
    setError("Please enter a UTXO");
    return;
  }

  setIsScanning(true);
  setError("");

  try {
    // Parse UTXO (format: txid:vout)
    const [txid, voutStr] = utxo.split(":");
    const vout = parseInt(voutStr);

    const result = await vaultService.depositUtxo({
      txid,
      vout,
      amount: BigInt(100000000), // Mock amount
      address: btcAddress || "",
    });

    // Navigate to preview
    navigate("/preview");
  } catch (err: any) {
    setError(err.message || "Failed to deposit UTXO");
  } finally {
    setIsScanning(false);
  }
};
```

---

## ✅ الخطوة 7: Testing

### 7.1 Unit Tests

```rust
// canisters/vault/tests/vault_tests.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_max_borrowable() {
        let utxo = UTXO {
            id: 0,
            amount: 100_000_000, // 1 BTC
            // ... other fields
        };

        let max = calculate_max_borrowable(&utxo, 5000); // 50% LTV
        assert_eq!(max, 50_000_000);
    }
}
```

### 7.2 Integration Tests

```rust
// canisters/vault/tests/integration_tests.rs
#[tokio::test]
async fn test_deposit_borrow_repay_flow() {
    // 1. Deposit UTXO
    // 2. Borrow ckBTC
    // 3. Repay
    // 4. Verify state
}
```

---

## 🚀 الخطوة 8: Deployment

### 8.1 Local Deployment

```bash
dfx start --background --clean
dfx deploy
```

### 8.2 Testnet Deployment

```bash
dfx deploy --network ic
```

---

## 📝 Checklist نهائي

- [ ] `lib.rs` محدث
- [ ] `Cargo.toml` به dependencies
- [ ] `bitcoin.rs` يعمل
- [ ] `ordinals.rs` يعمل
- [ ] `ckbtc.rs` يعمل
- [ ] `api.rs` مكتمل
- [ ] Frontend متصل
- [ ] جميع الصفحات تعمل
- [ ] Tests موجودة
- [ ] Deployed على testnet

---

**ابدأ الآن! 🚀**
