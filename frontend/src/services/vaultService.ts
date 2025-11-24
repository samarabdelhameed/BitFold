import { initAgent, createActor, getVaultCanisterId } from './icpAgent';
import { idlFactory } from '../declarations/vault/vault.did.js';
import type { _SERVICE, DepositUtxoRequest, BorrowRequest, RepayRequest, UTXO, Loan } from '../declarations/vault/vault.did';

let vaultActor: _SERVICE | null = null;

/**
 * Initialize vault actor
 */
async function getVaultActor(): Promise<_SERVICE> {
  // For update calls, require authentication
  // Always reinitialize to ensure we have the latest identity
  // This is important after login/logout
  await initAgent(true); // requireAuth = true for update calls
  
  // Create new actor with fresh agent (in case identity changed)
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
  try {
    const actor = await getVaultActor();
    
    if (!actor) {
      throw new Error('Vault actor not initialized. Please connect Internet Identity first.');
    }
    
    const borrowRequest: BorrowRequest = {
      utxo_id: utxoId,
      amount,
    };

    console.log('📤 [vaultService] Calling borrow with request:', {
      utxo_id: borrowRequest.utxo_id.toString(),
      amount: borrowRequest.amount.toString(),
      amount_ckbtc: (Number(borrowRequest.amount) / 100000000).toFixed(8)
    });

    const result = await actor.borrow(borrowRequest);
    
    if ('Err' in result) {
      console.error('❌ [vaultService] Borrow error:', result.Err);
      throw new Error(result.Err);
    }
    
    console.log('✅ [vaultService] Borrow successful! Loan ID:', result.Ok.toString());
    return result.Ok;
  } catch (error: any) {
    console.error('❌ [vaultService] Borrow exception:', error);
    throw error;
  }
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

/**
 * Lock a deposited UTXO as collateral and create a loan offer
 */
export async function lockCollateral(utxoId: bigint): Promise<{
  id: bigint;
  user_id: string;
  utxo_id: bigint;
  max_borrowable: bigint;
  ltv_percent: number;
  status: { Active?: {}; Accepted?: {}; Expired?: {}; Cancelled?: {} };
  created_at: bigint;
}> {
  try {
    const actor = await getVaultActor();
    
    if (!actor) {
      throw new Error('Vault actor not initialized. Please connect Internet Identity first.');
    }
    
    console.log('📤 Calling lock_collateral with UTXO ID:', utxoId);
    
    // Call with proper Candid format (just the number)
    const result = await actor.lock_collateral(utxoId);
    
    if ('Err' in result) {
      throw new Error(result.Err);
    }
    
    console.log('✅ lock_collateral successful! Loan Offer:', result.Ok);
    return result.Ok;
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ lockCollateral error:', error);
    
    if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
      throw new Error('Authentication failed. Please connect Internet Identity and try again.');
    } else if (err.message?.includes('404') || err.message?.includes('Not Found')) {
      throw new Error('Vault canister not found. Please make sure the canister is deployed.');
    } else if (err.message?.includes('certificate') || err.message?.includes('signature')) {
      throw new Error('Certificate verification failed. Please check your Internet Identity connection.');
    }
    
    throw error;
  }
}

/**
 * Get loan offer for a specific UTXO
 */
export async function getLoanOfferByUtxo(utxoId: bigint): Promise<{
  id: bigint;
  user_id: string;
  utxo_id: bigint;
  max_borrowable: bigint;
  ltv_percent: number;
  status: { Active?: {}; Accepted?: {}; Expired?: {}; Cancelled?: {} };
  created_at: bigint;
} | null> {
  try {
    const actor = await getVaultActor();
    if (!actor) {
      throw new Error('Vault actor not initialized. Please connect Internet Identity first.');
    }
    
    // Check if the method exists (it might not be in the current declarations)
    if ('get_loan_offer_by_utxo' in actor) {
      const result = await (actor as any).get_loan_offer_by_utxo(utxoId);
      return result.length > 0 ? result[0] : null;
    }
    
    // Fallback: get all user loan offers and find the one for this UTXO
    if ('get_user_loan_offers' in actor) {
      const offers = await (actor as any).get_user_loan_offers();
      return offers.find((offer: any) => offer.utxo_id === utxoId && offer.status?.Active !== undefined) || null;
    }
    
    return null;
  } catch (error: any) {
    console.error('Error getting loan offer:', error);
    return null;
  }
}

/**
 * Get all loan offers for the current user
 */
export async function getUserLoanOffers(): Promise<Array<{
  id: bigint;
  user_id: string;
  utxo_id: bigint;
  max_borrowable: bigint;
  ltv_percent: number;
  status: { Active?: {}; Accepted?: {}; Expired?: {}; Cancelled?: {} };
  created_at: bigint;
}>> {
  try {
    const actor = await getVaultActor();
    if (!actor) {
      throw new Error('Vault actor not initialized. Please connect Internet Identity first.');
    }
    
    // Check if the method exists
    if ('get_user_loan_offers' in actor) {
      return await (actor as any).get_user_loan_offers();
    }
    
    return [];
  } catch (error: any) {
    console.error('Error getting user loan offers:', error);
    return [];
  }
}

/**
 * Get vault statistics
 */
export async function getVaultStats(): Promise<{
  total_value_locked: bigint;
  total_loans_outstanding: bigint;
  active_loans_count: bigint;
  total_users: bigint;
  total_utxos: bigint;
  utilization_rate: bigint;
}> {
  try {
    const actor = await getVaultActor();
    if (!actor) {
      throw new Error('Vault actor not initialized. Please connect Internet Identity first.');
    }
    
    // Check if the method exists
    if ('get_vault_stats' in actor) {
      return await (actor as any).get_vault_stats();
    }
    
    // Return default stats if method doesn't exist
    return {
      total_value_locked: BigInt(0),
      total_loans_outstanding: BigInt(0),
      active_loans_count: BigInt(0),
      total_users: BigInt(0),
      total_utxos: BigInt(0),
      utilization_rate: BigInt(0),
    };
  } catch (error: any) {
    console.error('Error getting vault stats:', error);
    throw error;
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<{
  total_collateral_value: bigint;
  total_borrowed: bigint;
  total_debt: bigint;
  active_loans_count: bigint;
  total_utxos_count: bigint;
  average_ltv: bigint;
}> {
  try {
    const actor = await getVaultActor();
    if (!actor) {
      throw new Error('Vault actor not initialized. Please connect Internet Identity first.');
    }
    
    // Check if the method exists
    if ('get_user_stats' in actor) {
      return await (actor as any).get_user_stats();
    }
    
    // Return default stats if method doesn't exist
    return {
      total_collateral_value: BigInt(0),
      total_borrowed: BigInt(0),
      total_debt: BigInt(0),
      active_loans_count: BigInt(0),
      total_utxos_count: BigInt(0),
      average_ltv: BigInt(0),
    };
  } catch (error: any) {
    console.error('Error getting user stats:', error);
    throw error;
  }
}
