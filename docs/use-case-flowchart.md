# BitFold Use Case Flowcharts

This document provides detailed flowcharts for all user interactions and use cases in the BitFold platform.

## Primary Use Cases

### 1. Deposit UTXO as Collateral

```mermaid
flowchart TD
    Start([User Wants to Deposit UTXO]) --> Input[User Provides UTXO Details<br/>txid, vout, amount, address]
    Input --> CheckOrdinal{Is Ordinal?}
    
    CheckOrdinal -->|Yes| VerifyOrdinal[Query Ordinals Indexer<br/>Verify Inscription]
    CheckOrdinal -->|No| VerifyBitcoin[Verify UTXO via Bitcoin API]
    
    VerifyOrdinal --> ValidateOrdinal{Valid Ordinal?}
    ValidateOrdinal -->|No| Error1[Error: Invalid Ordinal]
    ValidateOrdinal -->|Yes| StoreOrdinal[Store Ordinal Metadata]
    
    VerifyBitcoin --> ValidateUTXO{Valid UTXO?}
    ValidateUTXO -->|No| Error2[Error: Invalid UTXO]
    ValidateUTXO -->|Yes| StoreUTXO[Store UTXO in Vault]
    
    StoreOrdinal --> GetLTV[Get LTV Ratio from Governance]
    StoreUTXO --> GetLTV
    
    GetLTV --> CalculateValue[Calculate Collateral Value]
    CalculateValue --> LockCollateral[Lock Collateral in Vault]
    LockCollateral --> Success[Return UTXO ID]
    Success --> End([Deposit Complete])
    
    Error1 --> End
    Error2 --> End
    
    style Start fill:#E8F5E9
    style End fill:#C8E6C9
    style Error1 fill:#FFCDD2
    style Error2 fill:#FFCDD2
    style Success fill:#4CAF50
```

### 2. Borrow ckBTC Against Collateral

```mermaid
flowchart TD
    Start([User Wants to Borrow]) --> SelectCollateral[Select Collateral UTXO]
    SelectCollateral --> CheckCollateral{Collateral<br/>Available?}
    
    CheckCollateral -->|No| Error1[Error: No Collateral]
    CheckCollateral -->|Yes| InputAmount[User Inputs Borrow Amount]
    
    InputAmount --> ValidateAmount{Amount Valid?}
    ValidateAmount -->|No| Error2[Error: Invalid Amount]
    ValidateAmount -->|Yes| GetLTV[Get Current LTV Ratio]
    
    GetLTV --> CalculateMax[Calculate Max Borrowable<br/>Based on LTV]
    CalculateMax --> CheckLimit{Amount <= Max<br/>Borrowable?}
    
    CheckLimit -->|No| Error3[Error: Exceeds LTV Limit]
    CheckLimit -->|Yes| CheckMin{Amount >= Min<br/>Borrow?}
    
    CheckMin -->|No| Error4[Error: Below Minimum]
    CheckMin -->|Yes| CreateLoan[Create Loan Record]
    
    CreateLoan --> MintckBTC[Mint ckBTC from Ledger]
    MintckBTC --> CheckMint{Mint<br/>Successful?}
    
    CheckMint -->|No| Error5[Error: Mint Failed]
    CheckMint -->|Yes| TransferckBTC[Transfer ckBTC to User]
    TransferckBTC --> UpdateLoan[Update Loan Status]
    UpdateLoan --> Success[Return Loan ID]
    Success --> End([Borrow Complete])
    
    Error1 --> End
    Error2 --> End
    Error3 --> End
    Error4 --> End
    Error5 --> End
    
    style Start fill:#E8F5E9
    style End fill:#C8E6C9
    style Error1 fill:#FFCDD2
    style Error2 fill:#FFCDD2
    style Error3 fill:#FFCDD2
    style Error4 fill:#FFCDD2
    style Error5 fill:#FFCDD2
    style Success fill:#4CAF50
```

### 3. Repay Loan

```mermaid
flowchart TD
    Start([User Wants to Repay]) --> SelectLoan[Select Loan to Repay]
    SelectLoan --> CheckLoan{Loan<br/>Exists?}
    
    CheckLoan -->|No| Error1[Error: Loan Not Found]
    CheckLoan -->|Yes| InputAmount[User Inputs Repay Amount]
    
    InputAmount --> ValidateAmount{Amount Valid?}
    ValidateAmount -->|No| Error2[Error: Invalid Amount]
    ValidateAmount -->|Yes| CheckBalance{User Has<br/>Enough ckBTC?}
    
    CheckBalance -->|No| Error3[Error: Insufficient Balance]
    CheckBalance -->|Yes| TransferToVault[User Transfers ckBTC<br/>to Vault]
    
    TransferToVault --> VerifyTransfer{Transfer<br/>Verified?}
    VerifyTransfer -->|No| Error4[Error: Transfer Failed]
    VerifyTransfer -->|Yes| BurnckBTC[Burn ckBTC in Ledger]
    
    BurnckBTC --> CheckBurn{Burn<br/>Successful?}
    CheckBurn -->|No| Error5[Error: Burn Failed]
    CheckBurn -->|Yes| UpdateLoan[Update Loan Balance]
    
    UpdateLoan --> CheckFull{Full<br/>Repayment?}
    CheckFull -->|Yes| UnlockCollateral[Unlock Collateral]
    CheckFull -->|No| UpdatePartial[Update Partial Repayment]
    
    UnlockCollateral --> Success1[Loan Fully Repaid]
    UpdatePartial --> Success2[Loan Partially Repaid]
    
    Success1 --> End([Repay Complete])
    Success2 --> End
    
    Error1 --> End
    Error2 --> End
    Error3 --> End
    Error4 --> End
    Error5 --> End
    
    style Start fill:#E8F5E9
    style End fill:#C8E6C9
    style Error1 fill:#FFCDD2
    style Error2 fill:#FFCDD2
    style Error3 fill:#FFCDD2
    style Error4 fill:#FFCDD2
    style Error5 fill:#FFCDD2
    style Success1 fill:#4CAF50
    style Success2 fill:#4CAF50
```

### 4. Withdraw Collateral

```mermaid
flowchart TD
    Start([User Wants to Withdraw]) --> SelectUTXO[Select UTXO to Withdraw]
    SelectUTXO --> CheckUTXO{UTXO<br/>Exists?}
    
    CheckUTXO -->|No| Error1[Error: UTXO Not Found]
    CheckUTXO -->|Yes| CheckStatus{UTXO<br/>Locked?}
    
    CheckStatus -->|No| Error2[Error: UTXO Not Locked]
    CheckStatus -->|Yes| CheckLoan{Associated<br/>Loan Exists?}
    
    CheckLoan -->|Yes| CheckRepaid{Loan Fully<br/>Repaid?}
    CheckLoan -->|No| ReleaseUTXO[Release UTXO]
    
    CheckRepaid -->|No| Error3[Error: Loan Not Repaid]
    CheckRepaid -->|Yes| ReleaseUTXO
    
    ReleaseUTXO --> UpdateStatus[Update UTXO Status]
    UpdateStatus --> ReturnUTXO[Return UTXO to User]
    ReturnUTXO --> Success[Withdrawal Complete]
    Success --> End([Withdraw Complete])
    
    Error1 --> End
    Error2 --> End
    Error3 --> End
    
    style Start fill:#E8F5E9
    style End fill:#C8E6C9
    style Error1 fill:#FFCDD2
    style Error2 fill:#FFCDD2
    style Error3 fill:#FFCDD2
    style Success fill:#4CAF50
```

## Complete User Journey

```mermaid
stateDiagram-v2
    [*] --> NotRegistered: User Arrives
    NotRegistered --> Connected: Connect Wallet
    
    Connected --> Browsing: View Platform
    Browsing --> Depositing: Deposit UTXO
    Browsing --> ViewingLoans: View Existing Loans
    
    Depositing --> Deposited: UTXO Confirmed
    Deposited --> Borrowing: Borrow ckBTC
    Deposited --> Withdrawing: Withdraw (if no loan)
    
    Borrowing --> Borrowed: Loan Created
    Borrowed --> Repaying: Repay Loan
    Borrowed --> ViewingLoans: Check Status
    
    Repaying --> Repaid: Partial/Full Repayment
    Repaid --> Borrowing: Borrow More
    Repaid --> Withdrawing: Withdraw Collateral
    
    Withdrawing --> Browsing: Collateral Released
    ViewingLoans --> Repaying: Repay from Dashboard
    ViewingLoans --> Borrowing: Borrow More
    ViewingLoans --> Browsing: Back to Home
    
    note right of Depositing
        Verify UTXO
        Check Ordinals
        Lock Collateral
    end note
    
    note right of Borrowing
        Check LTV
        Mint ckBTC
        Create Loan
    end note
    
    note right of Repaying
        Transfer ckBTC
        Burn ckBTC
        Update Loan
    end note
```

## Error Handling Flow

```mermaid
flowchart TD
    Operation[Any Operation] --> Try[Execute Operation]
    Try --> Success{Success?}
    
    Success -->|Yes| ReturnSuccess[Return Success Result]
    Success -->|No| CategorizeError{Categorize Error}
    
    CategorizeError --> ValidationError[Validation Error<br/>Invalid Input]
    CategorizeError --> NetworkError[Network Error<br/>External Service]
    CategorizeError --> StateError[State Error<br/>Invalid State]
    CategorizeError --> PermissionError[Permission Error<br/>Access Denied]
    
    ValidationError --> LogError[Log Error]
    NetworkError --> LogError
    StateError --> LogError
    PermissionError --> LogError
    
    LogError --> ReturnError[Return Error Message]
    ReturnError --> UserNotification[Notify User]
    
    ReturnSuccess --> End([Complete])
    UserNotification --> End
    
    style Success fill:#4CAF50
    style ValidationError fill:#FF9800
    style NetworkError fill:#F44336
    style StateError fill:#9C27B0
    style PermissionError fill:#E91E63
```

## Ordinals-Specific Use Case

```mermaid
flowchart TD
    Start([User Deposits Ordinal NFT]) --> ProvideDetails[Provide UTXO Details<br/>txid, vout]
    ProvideDetails --> QueryIndexer[Query Ordinals Indexer]
    
    QueryIndexer --> CheckInscription{Inscription<br/>Found?}
    CheckInscription -->|No| Error1[Error: Not an Ordinal]
    CheckInscription -->|Yes| GetMetadata[Get Ordinal Metadata<br/>ID, Content Type, Preview]
    
    GetMetadata --> ValidateContent{Content<br/>Valid?}
    ValidateContent -->|No| Error2[Error: Invalid Content]
    ValidateContent -->|Yes| CheckDuplicate{Already<br/>Deposited?}
    
    CheckDuplicate -->|Yes| Error3[Error: Already Used]
    CheckDuplicate -->|No| GetValuation[Get Ordinal Valuation<br/>from Governance/Market]
    
    GetValuation --> StoreOrdinal[Store Ordinal Info<br/>with UTXO]
    StoreOrdinal --> CalculateLTV[Calculate LTV<br/>Based on Valuation]
    CalculateLTV --> LockOrdinal[Lock Ordinal as Collateral]
    LockOrdinal --> Success[Ordinal Deposited]
    Success --> End([Complete])
    
    Error1 --> End
    Error2 --> End
    Error3 --> End
    
    style Start fill:#E8F5E9
    style End fill:#C8E6C9
    style Error1 fill:#FFCDD2
    style Error2 fill:#FFCDD2
    style Error3 fill:#FFCDD2
    style Success fill:#4CAF50
    style GetMetadata fill:#E1F5FE
    style GetValuation fill:#E1F5FE
```

