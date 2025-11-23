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
  const actor = await getVaultActor();
  
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

  const result = await actor.deposit_utxo(depositRequest);
  
  if ('Err' in result) {
    throw new Error(result.Err);
  }
  
  return result.Ok;
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
  const actor = await getVaultActor();
  return await actor.get_collateral();
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
