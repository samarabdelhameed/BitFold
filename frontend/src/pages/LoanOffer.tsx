import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { borrow, getLoanOfferByUtxo, getUtxo } from '../services/vaultService';

export function LoanOffer() {
  const navigate = useNavigate();
  const { currentOrdinal, addLoan } = useApp();
  const [amount, setAmount] = useState('');
  const [displayedLtv, setDisplayedLtv] = useState(0);
  const [displayedMax, setDisplayedMax] = useState(0);
  const [maxAmount, setMaxAmount] = useState(0.001); // Default fallback
  const [maxLtv, setMaxLtv] = useState(50); // Default fallback
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load real data from canister
  useEffect(() => {
    const loadLoanOfferData = async () => {
      console.log('🔍 LoanOffer: Checking currentOrdinal:', currentOrdinal);
      console.log('🔍 LoanOffer: UTXO ID:', currentOrdinal?.utxoId);
      
      // Try to get UTXO ID from currentOrdinal or localStorage
      let utxoId = currentOrdinal?.utxoId;
      if (!utxoId) {
        const savedUtxoId = localStorage.getItem('lastUtxoId');
        if (savedUtxoId) {
          utxoId = BigInt(savedUtxoId);
          console.log('📥 Loaded UTXO ID from localStorage:', utxoId);
        }
      }
      
      // Validate UTXO ID (must be > 0)
      if (!utxoId || utxoId === BigInt(0)) {
        console.warn('⚠️ LoanOffer: No valid UTXO ID found. Redirecting to scan...');
        alert('Please scan your Ordinal first to get started.');
        navigate('/scan');
        return;
      }
      
      if (!utxoId) {
        console.warn('⚠️ LoanOffer: No UTXO ID found');
        setIsLoading(false);
        return;
      }

      try {
        console.log('📥 Loading loan offer data for UTXO:', utxoId);
        
        // Try to get loan offer first
        const loanOffer = await getLoanOfferByUtxo(utxoId);
        
        if (loanOffer) {
          // Convert satoshis to ckBTC (1 ckBTC = 100,000,000 satoshis)
          const maxBorrowableCkBTC = Number(loanOffer.max_borrowable) / 100000000;
          const ltvPercent = Number(loanOffer.ltv_percent);
          
          console.log('✅ Loan offer found:', {
            max_borrowable_sats: loanOffer.max_borrowable.toString(),
            max_borrowable_ckbtc: maxBorrowableCkBTC,
            ltv_percent: ltvPercent
          });
          
          setMaxAmount(maxBorrowableCkBTC);
          setMaxLtv(ltvPercent);
          
          // Animate to real values
          const ltvInterval = setInterval(() => {
            setDisplayedLtv(prev => (prev < ltvPercent ? prev + 1 : ltvPercent));
          }, 20);

          const amountInterval = setInterval(() => {
            setDisplayedMax(prev => {
              const next = prev + 0.00001;
              return next < maxBorrowableCkBTC ? next : maxBorrowableCkBTC;
            });
          }, 20);

          // Set initial amount to half of max
          setAmount((maxBorrowableCkBTC / 2).toFixed(4));

          setTimeout(() => {
            clearInterval(ltvInterval);
            clearInterval(amountInterval);
          }, 2000);
        } else {
          // Fallback: get UTXO and calculate max borrowable (50% LTV)
          console.log('⚠️ No loan offer found, calculating from UTXO...');
          const utxo = await getUtxo(utxoId);
          
          if (utxo) {
            const maxBorrowableSats = (Number(utxo.amount) * 5000) / 10000; // 50% LTV
            const maxBorrowableCkBTC = maxBorrowableSats / 100000000;
            
            setMaxAmount(maxBorrowableCkBTC);
            setMaxLtv(50);
            
            // Animate to calculated values
            const ltvInterval = setInterval(() => {
              setDisplayedLtv(prev => (prev < 50 ? prev + 1 : 50));
            }, 20);

            const amountInterval = setInterval(() => {
              setDisplayedMax(prev => {
                const next = prev + 0.00001;
                return next < maxBorrowableCkBTC ? next : maxBorrowableCkBTC;
              });
            }, 20);

            setAmount((maxBorrowableCkBTC / 2).toFixed(4));

            setTimeout(() => {
              clearInterval(ltvInterval);
              clearInterval(amountInterval);
            }, 2000);
          }
        }
      } catch (error) {
        console.error('❌ Error loading loan offer data:', error);
        // Keep default values
      } finally {
        setIsLoading(false);
      }
    };

    loadLoanOfferData();
  }, [currentOrdinal?.utxoId]);

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
      // Try to get UTXO ID from currentOrdinal or localStorage
      let utxoId = currentOrdinal?.utxoId;
      if (!utxoId) {
        const savedUtxoId = localStorage.getItem('lastUtxoId');
        if (savedUtxoId) {
          utxoId = BigInt(savedUtxoId);
          console.log('📥 Using UTXO ID from localStorage:', utxoId);
        }
      }
      
      // Validate UTXO ID (must be > 0)
      if (!utxoId || utxoId === BigInt(0)) {
        alert('Please scan your Ordinal first to get started.');
        navigate('/scan');
        throw new Error('UTXO ID not found. Please scan your Ordinal again.');
      }
      
      // Convert ckBTC to satoshis (1 ckBTC = 100,000,000 satoshis)
      const amountInSats = BigInt(Math.floor(borrowAmount * 100000000));
      
      console.log('📤 ========================================');
      console.log('📤 Starting Borrow Process');
      console.log('📤 ========================================');
      console.log('📤 UTXO ID:', utxoId.toString());
      console.log('📤 Borrow Amount (ckBTC):', borrowAmount);
      console.log('📤 Borrow Amount (satoshis):', amountInSats.toString());
      console.log('📤 Max Available (ckBTC):', maxAmount);
      console.log('📤 Max Available (satoshis):', (maxAmount * 100000000).toString());
      console.log('📤 LTV:', maxLtv + '%');
      console.log('📤 Calling borrow function...');
      
      // Call backend to borrow (this will lock the collateral automatically)
      const loanId = await borrow(utxoId, amountInSats);
      
      console.log('✅ ========================================');
      console.log('✅ Borrow Successful!');
      console.log('✅ ========================================');
      console.log('✅ Loan ID:', loanId.toString());
      console.log('✅ Borrowed Amount:', amountInSats.toString(), 'satoshis');
      console.log('✅ Borrowed Amount:', borrowAmount, 'ckBTC');
      console.log('✅ Next: Check ckBTC balance in wallet');

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
      console.error('❌ ========================================');
      console.error('❌ Borrow Failed!');
      console.error('❌ ========================================');
      console.error('❌ Error:', err);
      console.error('❌ Error Message:', err.message);
      console.error('❌ Full Error:', JSON.stringify(err, null, 2));
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
