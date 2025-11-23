import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { borrow } from '../services/vaultService';

export function LoanOffer() {
  const navigate = useNavigate();
  const { currentOrdinal, addLoan } = useApp();
  const [amount, setAmount] = useState('');
  const [displayedLtv, setDisplayedLtv] = useState(0);
  const [displayedMax, setDisplayedMax] = useState(0);
  const [isBorrowing, setIsBorrowing] = useState(false);

  const maxLtv = 50;
  const maxAmount = 0.001;

  useEffect(() => {
    const ltvInterval = setInterval(() => {
      setDisplayedLtv(prev => (prev < maxLtv ? prev + 1 : prev));
    }, 20);

    const amountInterval = setInterval(() => {
      setDisplayedMax(prev => (prev < maxAmount ? prev + 0.00001 : maxAmount));
    }, 20);

    return () => {
      clearInterval(ltvInterval);
      clearInterval(amountInterval);
    };
  }, []);

  if (!currentOrdinal) {
    navigate('/scan');
    return null;
  }

  const handleBorrow = async () => {
    const borrowAmount = parseFloat(amount);
    if (isNaN(borrowAmount) || borrowAmount <= 0 || borrowAmount > maxAmount) {
      return;
    }

    setIsBorrowing(true);

    try {
      // Convert BTC to satoshis
      const amountInSats = BigInt(Math.floor(borrowAmount * 100000000));
      
      // Get UTXO ID from current ordinal (assuming it's stored in utxo field)
      // In production, you'd parse this properly
      const utxoId = BigInt(1); // Placeholder - should come from deposit response
      
      // Call backend to borrow
      const loanId = await borrow(utxoId, amountInSats);

      const newLoan = {
        id: loanId.toString(),
        utxo: currentOrdinal.utxo,
        ordinal: currentOrdinal,
        borrowedAmount: borrowAmount,
        remainingAmount: borrowAmount,
        status: 'ACTIVE' as const,
        ltv: maxLtv,
        createdAt: new Date().toISOString()
      };

      addLoan(newLoan);
      navigate('/borrow-success');
    } catch (err: any) {
      console.error('Borrow failed:', err);
      alert(err.message || 'Failed to borrow. Please try again.');
      setIsBorrowing(false);
    }
  };

  const isValidAmount = () => {
    const borrowAmount = parseFloat(amount);
    return !isNaN(borrowAmount) && borrowAmount > 0 && borrowAmount <= maxAmount;
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <TrendingUp className="w-16 h-16 text-[#00D4FF] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-3">Loan Offer</h1>
          <p className="text-gray-400">Choose how much ckBTC you want to borrow</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50"
        >
          <div className="grid grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="p-6 bg-gradient-to-br from-[#00D4FF]/20 to-[#00D4FF]/5 rounded-xl border border-[#00D4FF]/30"
            >
              <div className="text-gray-400 text-sm mb-2">Loan-to-Value Ratio</div>
              <motion.div className="text-5xl font-bold text-[#00D4FF]">
                {displayedLtv}%
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="p-6 bg-gradient-to-br from-[#FFC700]/20 to-[#FFC700]/5 rounded-xl border border-[#FFC700]/30"
            >
              <div className="text-gray-400 text-sm mb-2">Maximum Available</div>
              <motion.div className="text-5xl font-bold text-[#FFC700]">
                {displayedMax.toFixed(4)}
              </motion.div>
              <div className="text-gray-500 text-xs mt-1">ckBTC</div>
            </motion.div>
          </div>

          <div className="mb-6">
            <label className="text-gray-300 text-sm font-medium mb-3 block">
              Borrow Amount (ckBTC)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0000"
                step="0.0001"
                max={maxAmount}
                className="w-full bg-gray-900/50 border-2 border-gray-600 rounded-xl px-6 py-4 text-white text-2xl font-bold placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] transition-all"
              />
              <button
                onClick={() => setAmount(maxAmount.toString())}
                className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-1 bg-[#00D4FF] text-[#0B0E11] rounded-lg text-sm font-bold hover:bg-[#00D4FF]/80 transition-colors"
              >
                MAX
              </button>
            </div>

            <div className="mt-2 flex justify-between text-sm">
              <span className="text-gray-500">Minimum: 0.0001 ckBTC</span>
              <span className="text-gray-500">Maximum: {maxAmount} ckBTC</span>
            </div>
          </div>

          <div className="p-4 bg-[#FFC700]/10 rounded-xl border border-[#FFC700]/20 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FFC700] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <strong className="text-[#FFC700]">Important:</strong> You must repay
              the full amount to unlock your Ordinal. If the collateral value drops
              below the liquidation threshold, your position may be liquidated.
            </div>
          </div>

          <div className="space-y-3 mb-6 p-4 bg-gray-800/30 rounded-xl">
            <div className="flex justify-between">
              <span className="text-gray-400">Interest Rate</span>
              <span className="text-[#00FF85] font-bold">0% APR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Repayment Period</span>
              <span className="text-white">Flexible</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">You Will Receive</span>
              <span className="text-[#FFC700] font-bold text-lg">
                {amount || '0'} ckBTC
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: isValidAmount() ? 1.02 : 1 }}
            whileTap={{ scale: isValidAmount() ? 0.98 : 1 }}
            onClick={handleBorrow}
            disabled={!isValidAmount() || isBorrowing}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              isValidAmount() && !isBorrowing
                ? 'bg-gradient-to-r from-[#00D4FF] to-[#00FF85] text-[#0B0E11] hover:shadow-lg hover:shadow-[#00D4FF]/50'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isBorrowing ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"
                />
                Processing...
              </span>
            ) : (
              'Borrow ckBTC'
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
