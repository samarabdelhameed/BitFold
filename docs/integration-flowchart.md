# BitFold Integration Flowchart

This document provides a visual representation of how BitFold integrates with external systems and components.

## System Integration Architecture

```mermaid
graph TB
    subgraph "User Layer"
        User[User/Web Browser]
        Frontend[React Frontend]
    end
    
    subgraph "Internet Computer Layer"
        FrontendCanister[Frontend Canister<br/>Static Assets]
        VaultCanister[Vault Canister<br/>Core Logic]
        GovernanceCanister[Governance Canister<br/>LTV & Policies]
        IndexerStub[Indexer Stub<br/>Ordinals Verification]
    end
    
    subgraph "External Services"
        BitcoinAPI[Bitcoin Network API<br/>UTXO Verification]
        OrdinalsIndexer[Ordinals Indexer<br/>NFT Verification]
        ckBTCLedger[ckBTC Ledger Canister<br/>Minting & Burning]
    end
    
    User -->|HTTP/HTTPS| Frontend
    Frontend -->|Agent Calls| FrontendCanister
    Frontend -->|Agent Calls| VaultCanister
    
    VaultCanister -->|Verify UTXO| BitcoinAPI
    VaultCanister -->|Query Inscription| IndexerStub
    IndexerStub -->|Production| OrdinalsIndexer
    VaultCanister -->|Get Policies| GovernanceCanister
    VaultCanister -->|Mint/Burn ckBTC| ckBTCLedger
    
    style VaultCanister fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px
    style ckBTCLedger fill:#F5A623,stroke:#D68910,stroke-width:2px
    style BitcoinAPI fill:#F5A623,stroke:#D68910,stroke-width:2px
    style OrdinalsIndexer fill:#F5A623,stroke:#D68910,stroke-width:2px
```

## Data Flow Integration

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant VC as Vault Canister
    participant BA as Bitcoin API
    participant OI as Ordinals Indexer
    participant CL as ckBTC Ledger
    participant GC as Governance
    
    Note over U,GC: Deposit UTXO Flow
    U->>F: Submit UTXO Details
    F->>VC: deposit_utxo()
    VC->>BA: Verify UTXO Exists
    BA-->>VC: UTXO Confirmed
    VC->>OI: Check for Ordinals
    OI-->>VC: Ordinal Metadata (if exists)
    VC->>GC: Get LTV Ratio
    GC-->>VC: LTV Policy
    VC-->>F: UTXO ID
    F-->>U: Deposit Confirmed
    
    Note over U,GC: Borrow Flow
    U->>F: Request Loan
    F->>VC: borrow(utxo_id, amount)
    VC->>GC: Validate LTV
    GC-->>VC: Approval
    VC->>CL: Mint ckBTC
    CL-->>VC: Transaction ID
    VC-->>F: Loan ID
    F-->>U: ckBTC Received
    
    Note over U,GC: Repay Flow
    U->>F: Initiate Repayment
    F->>VC: repay(loan_id, amount)
    VC->>CL: Burn ckBTC
    CL-->>VC: Confirmation
    VC-->>F: Success
    F-->>U: Loan Updated
```

## Component Communication

```mermaid
graph LR
    subgraph "Core Components"
        V[Vault Canister]
    end
    
    subgraph "Verification Services"
        B[Bitcoin API]
        O[Ordinals Indexer]
    end
    
    subgraph "Financial Services"
        C[ckBTC Ledger]
    end
    
    subgraph "Governance"
        G[Governance Canister]
    end
    
    V -->|1. Verify UTXO| B
    V -->|2. Verify Ordinal| O
    V -->|3. Mint/Burn| C
    V -->|4. Get Policies| G
    
    style V fill:#4A90E2
    style B fill:#F5A623
    style O fill:#F5A623
    style C fill:#50C878
    style G fill:#9B59B6
```

## Technology Stack Integration

```mermaid
mindmap
  root((BitFold))
    Internet Computer
      Rust Canisters
      Motoko (Optional)
      Candid Interfaces
    Frontend
      React
      Vite
      TypeScript
      Agent SDK
    Bitcoin Integration
      Bitcoin Network
      UTXO Verification
      Ordinals Protocol
    ckBTC Integration
      Ledger Canister
      ICRC-1 Standard
      Minting/Burning
    Indexing Services
      Ordinals Indexer
      NFT Metadata
      Content Verification
```

