import { initAgent, createActor, getVaultCanisterId } from './icpAgent';
import { idlFactory } from '../declarations/vault/vault.did.js';
import type { _SERVICE, DepositUtxoRequest, BorrowRequest, RepayRequest, UTXO, Loan } from '../declarations/vault/vault.did';

let vaultActor: _SERVICE | null = null;

/**
 * Initialize vault actor
 */
async function getVaultActor(): Promise<_SERVICE> {
  if (vaultActor) return vaultActor;
  
  await initAgent();
  vaultActor = createActor<_SERVICE>(getVaultCanisterId(), idlFactory);
  return vaultActor;
}

/**
 * Reset actor (useful after login/logout)
 */
export function resetVaultActor(): void {
  vaultActor = null;
}

/**
 * Deposit a Bitcoin UTXO as collateral
 */
export async function depositUtxo(request: {
  txid: string;
  vout: number;
  amount: bigint;
  address: string;
  ordinalInfo?: {
    inscription_id: string;
    content_type: string;
    content_preview?: string;
    metadata?: string;
  };
}): Promise<bigint> {
  try {
    const actor = await getVaultActor();
    
    if (!actor) {
      throw new Error('Vault actor not initialized. Please connect Internet Identity first.');
    }
    
    const depositRequest: DepositUtxoRequest = {
      txid: request.txid,
      vout: request.vout,
      amount: request.amount,
      address: request.address,
      ordinal_info: request.ordinalInfo ? [{
        inscription_id: request.ordinalInfo.inscription_id,
        content_type: request.ordinalInfo.content_type,
        content_preview: request.ordinalInfo.content_preview ? [request.ordinalInfo.content_preview] : [],
        metadata: request.ordinalInfo.metadata ? [request.ordinalInfo.metadata] : [],
      }] : [],
    };

    console.log('📤 Calling deposit_utxo with:', depositRequest);
    const result = await actor.deposit_utxo(depositRequest);
    
    if ('Err' in result) {
      throw new Error(result.Err);
    }
    
    console.log('✅ deposit_utxo successful, UTXO ID:', result.Ok);
    return result.Ok;
  } catch (error: any) {
    console.error('❌ depositUtxo error:', error);
    
    // Better error messages
    if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      throw new Error('Authentication failed. Please connect Internet Identity and try again.');
    } else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
      throw new Error('Vault canister not found. Please make sure the canister is deployed. Run: dfx deploy');
    } else if (error.message?.includes('certificate') || error.message?.includes('signature')) {
      throw new Error('Certificate verification failed. Please check your Internet Identity connection.');
    }
    
    throw error;
  }
}

/**
 * Borrow ckBTC against collateral
 */
export async function borrow(utxoId: bigint, amount: bigint): Promise<bigint> {
  const actor = await getVaultActor();
  
  const borrowRequest: BorrowRequest = {
    utxo_id: utxoId,
    amount,
  };

  const result = await actor.borrow(borrowRequest);
  
  if ('Err' in result) {
    throw new Error(result.Err);
  }
  
  return result.Ok;
}

/**
 * Repay a loan
 */
export async function repay(loanId: bigint, amount: bigint): Promise<void> {
  const actor = await getVaultActor();
  
  const repayRequest: RepayRequest = {
    loan_id: loanId,
    amount,
  };

  const result = await actor.repay(repayRequest);
  
  if ('Err' in result) {
    throw new Error(result.Err);
  }
}

/**
 * Withdraw collateral
 */
export async function withdrawCollateral(utxoId: bigint): Promise<void> {
  const actor = await getVaultActor();
  
  const result = await actor.withdraw_collateral(utxoId);
  
  if ('Err' in result) {
    throw new Error(result.Err);
  }
}

/**
 * Get user's collateral (UTXOs)
 */
export async function getCollateral(): Promise<UTXO[]> {
  try {
    const actor = await getVaultActor();
    return await actor.get_collateral();
  } catch (error: any) {
    console.error('Error getting collateral:', error);
    // Re-throw with more context
    if (error?.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to get collateral. Please check your connection and authentication.');
  }
}

/**
 * Get user's loans
 */
export async function getUserLoans(): Promise<Loan[]> {
  const actor = await getVaultActor();
  return await actor.get_user_loans();
}

/**
 * Get specific UTXO by ID
 */
export async function getUtxo(utxoId: bigint): Promise<UTXO | null> {
  const actor = await getVaultActor();
  const result = await actor.get_utxo(utxoId);
  return result.length > 0 ? result[0] : null;
}

/**
 * Get specific loan by ID
 */
export async function getLoan(loanId: bigint): Promise<Loan | null> {
  const actor = await getVaultActor();
  const result = await actor.get_loan(loanId);
  return result.length > 0 ? result[0] : null;
}
