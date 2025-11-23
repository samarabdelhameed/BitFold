export const idlFactory = ({ IDL }) => {
  const UtxoId = IDL.Nat64;
  const BorrowRequest = IDL.Record({
    'utxo_id' : UtxoId,
    'amount' : IDL.Nat64,
  });
  const LoanId = IDL.Nat64;
  const Result_LoanId = IDL.Variant({ 'Ok' : LoanId, 'Err' : IDL.Text });
  const OrdinalInfo = IDL.Record({
    'metadata' : IDL.Opt(IDL.Text),
    'content_preview' : IDL.Opt(IDL.Text),
    'content_type' : IDL.Text,
    'inscription_id' : IDL.Text,
  });
  const DepositUtxoRequest = IDL.Record({
    'ordinal_info' : IDL.Opt(OrdinalInfo),
    'txid' : IDL.Text,
    'vout' : IDL.Nat32,
    'address' : IDL.Text,
    'amount' : IDL.Nat64,
  });
  const Result_UtxoId = IDL.Variant({ 'Ok' : UtxoId, 'Err' : IDL.Text });
  const UtxoStatus = IDL.Variant({
    'Withdrawn' : IDL.Null,
    'Locked' : IDL.Null,
    'Deposited' : IDL.Null,
  });
  const UTXO = IDL.Record({
    'id' : UtxoId,
    'ordinal_info' : IDL.Opt(OrdinalInfo),
    'status' : UtxoStatus,
    'txid' : IDL.Text,
    'vout' : IDL.Nat32,
    'address' : IDL.Text,
    'deposited_at' : IDL.Nat64,
    'amount' : IDL.Nat64,
  });
  const LoanStatus = IDL.Variant({
    'Repaid' : IDL.Null,
    'Active' : IDL.Null,
    'Liquidated' : IDL.Null,
  });
  const Loan = IDL.Record({
    'id' : LoanId,
    'status' : LoanStatus,
    'collateral_utxo_id' : UtxoId,
    'repaid_amount' : IDL.Nat64,
    'created_at' : IDL.Nat64,
    'user_id' : IDL.Principal,
    'interest_rate' : IDL.Nat64,
    'borrowed_amount' : IDL.Nat64,
  });
  const RepayRequest = IDL.Record({ 'loan_id' : LoanId, 'amount' : IDL.Nat64 });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  return IDL.Service({
    'borrow' : IDL.Func([BorrowRequest], [Result_LoanId], []),
    'deposit_utxo' : IDL.Func([DepositUtxoRequest], [Result_UtxoId], []),
    'get_collateral' : IDL.Func([], [IDL.Vec(UTXO)], ['query']),
    'get_loan' : IDL.Func([LoanId], [IDL.Opt(Loan)], ['query']),
    'get_user_loans' : IDL.Func([], [IDL.Vec(Loan)], ['query']),
    'get_utxo' : IDL.Func([UtxoId], [IDL.Opt(UTXO)], ['query']),
    'repay' : IDL.Func([RepayRequest], [Result], []),
    'withdraw_collateral' : IDL.Func([UtxoId], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
