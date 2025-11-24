import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { DollarSign, CheckCircle, ArrowLeft } from 'lucide-react';
import { repay } from '../services/vaultService';

export function Repay() {
  const navigate = useNavigate();
  const { loanId } = useParams();
  const { loans, updateLoan } = useApp();
  const [amount, setAmount] = useState('');
  const [isRepaying, setIsRepaying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const loan = loans.find(l => l.id === loanId);

  if (!loan) {
    navigate('/dashboard');
    return null;
  }

  const handleRepay = async () => {
    const repayAmount = parseFloat(amount);
    if (isNaN(repayAmount) || repayAmount <= 0) return;

    setIsRepaying(true);

    try {
      // Convert BTC to satoshis
      const amountInSats = BigInt(Math.floor(repayAmount * 100000000));
      const loanIdBigInt = BigInt(loan.id);
      
      // Call backend to repay
      await repay(loanIdBigInt, amountInSats);

      // Refresh loan data from canister to get accurate remaining amount
      // The canister will calculate the new remaining amount including interest
      setIsRepaying(false);
      setShowSuccess(true);

      // Navigate to dashboard which will refresh the data
      setTimeout(() => {
        navigate('/dashboard');
        // Force a page reload to ensure fresh data
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error('Repay failed:', err);
      alert(err.message || 'Failed to repay. Please try again.');
      setIsRepaying(false);
    }
  };

  const isValidAmount = () => {
    const repayAmount = parseFloat(amount);
    return !isNaN(repayAmount) && repayAmount > 0 && repayAmount <= loan.remainingAmount;
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-[#00D4FF] transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <DollarSign className="w-16 h-16 text-[#FFC700] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-3">Repay Loan</h1>
          <p className="text-gray-400">Repay your loan to unlock your Ordinal</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 mb-6"
        >
          <div className="flex gap-6 mb-8">
            <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
              <img
                src={loan.ordinal.imageUrl}
                alt="Ordinal"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-400">Total Borrowed</span>
                <span className="text-white font-bold">{loan.borrowedAmount.toFixed(4)} ckBTC</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-400">Remaining</span>
                <span className="text-[#FFC700] font-bold text-lg">{loan.remainingAmount.toFixed(4)} ckBTC</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-400">Interest</span>
                <span className="text-[#00FF85] font-bold">
                  {(loan.interestAmount || 0).toFixed(4)} ckBTC
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-gray-300 text-sm font-medium">
                Repayment Amount (ckBTC)
              </label>
              <span className="text-gray-400 text-xs">
                Available: {loan.remainingAmount.toFixed(4)} ckBTC
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0000"
                step="0.0001"
                max={loan.remainingAmount}
                className="w-full bg-gray-900/50 border-2 border-gray-600 rounded-xl px-6 py-4 text-white text-2xl font-bold placeholder-gray-600 focus:outline-none focus:border-[#FFC700] transition-all"
              />
              <button
                onClick={() => setAmount(loan.remainingAmount.toString())}
                className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-1 bg-[#FFC700] text-[#0B0E11] rounded-lg text-sm font-bold hover:bg-[#FFC700]/80 transition-colors"
              >
                FULL
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{
                  width: `${((loan.borrowedAmount - loan.remainingAmount) / loan.borrowedAmount) * 100}%`
                }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-[#00D4FF] to-[#00FF85]"
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>Repaid: {((loan.borrowedAmount - loan.remainingAmount) / loan.borrowedAmount * 100).toFixed(1)}%</span>
              <span>Remaining: {(loan.remainingAmount / loan.borrowedAmount * 100).toFixed(1)}%</span>
            </div>
          </div>

          {isRepaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-[#00D4FF]/10 rounded-xl border border-[#00D4FF]/20"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-[#00D4FF] border-t-transparent rounded-full"
                />
                <span className="text-[#00D4FF]">Processing repayment...</span>
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: isValidAmount() ? 1.02 : 1 }}
            whileTap={{ scale: isValidAmount() ? 0.98 : 1 }}
            onClick={handleRepay}
            disabled={!isValidAmount() || isRepaying}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              isValidAmount() && !isRepaying
                ? 'bg-gradient-to-r from-[#FFC700] to-[#00FF85] text-[#0B0E11] hover:shadow-lg hover:shadow-[#FFC700]/50'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isRepaying ? 'Processing...' : 'Confirm Repayment'}
          </motion.button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle className="w-20 h-20 text-[#00FF85] mx-auto mb-4" />
              </motion.div>
              <h3 className="text-3xl font-bold text-white mb-2">
                Repayment Successful!
              </h3>
              <p className="text-gray-300">
                {loan.remainingAmount - parseFloat(amount || '0') <= 0
                  ? 'Your loan is fully repaid. You can now withdraw your Ordinal!'
                  : 'Your payment has been processed successfully.'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
