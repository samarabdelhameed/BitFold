import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface BorrowRequest { 'utxo_id' : UtxoId, 'amount' : bigint }
export interface DepositUtxoRequest {
  'ordinal_info' : [] | [OrdinalInfo],
  'txid' : string,
  'vout' : number,
  'address' : string,
  'amount' : bigint,
}
export interface Loan {
  'id' : LoanId,
  'status' : LoanStatus,
  'collateral_utxo_id' : UtxoId,
  'repaid_amount' : bigint,
  'created_at' : bigint,
  'user_id' : Principal,
  'interest_rate' : bigint,
  'borrowed_amount' : bigint,
}
export type LoanId = bigint;
export type LoanStatus = { 'Repaid' : null } |
  { 'Active' : null } |
  { 'Liquidated' : null };
export interface OrdinalInfo {
  'metadata' : [] | [string],
  'content_preview' : [] | [string],
  'content_type' : string,
  'inscription_id' : string,
}
export interface RepayRequest { 'loan_id' : LoanId, 'amount' : bigint }
export type Result = { 'Ok' : null } |
  { 'Err' : string };
export type Result_LoanId = { 'Ok' : LoanId } |
  { 'Err' : string };
export type Result_UtxoId = { 'Ok' : UtxoId } |
  { 'Err' : string };
export interface UTXO {
  'id' : UtxoId,
  'ordinal_info' : [] | [OrdinalInfo],
  'status' : UtxoStatus,
  'txid' : string,
  'vout' : number,
  'address' : string,
  'deposited_at' : bigint,
  'amount' : bigint,
}
export type UtxoId = bigint;
export type UtxoStatus = { 'Withdrawn' : null } |
  { 'Locked' : null } |
  { 'Deposited' : null };
export interface _SERVICE {
  'borrow' : ActorMethod<[BorrowRequest], Result_LoanId>,
  'deposit_utxo' : ActorMethod<[DepositUtxoRequest], Result_UtxoId>,
  'get_collateral' : ActorMethod<[], Array<UTXO>>,
  'get_loan' : ActorMethod<[LoanId], [] | [Loan]>,
  'get_user_loans' : ActorMethod<[], Array<Loan>>,
  'get_utxo' : ActorMethod<[UtxoId], [] | [UTXO]>,
  'repay' : ActorMethod<[RepayRequest], Result>,
  'withdraw_collateral' : ActorMethod<[UtxoId], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
