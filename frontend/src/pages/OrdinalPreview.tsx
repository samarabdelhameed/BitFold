import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Lock, Info, Loader2, CheckCircle } from 'lucide-react';
import { getUtxo, depositUtxo, lockCollateral } from '../services/vaultService';
import { isTestAddress, createTestUtxo } from '../services/testUtxoService';

export function OrdinalPreview() {
  const navigate = useNavigate();
  const { currentOrdinal, isIcpAuthenticated, btcAddress, setCurrentOrdinal } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [utxoId, setUtxoId] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate values
  const btcValue = currentOrdinal ? currentOrdinal.satoshiValue / 100000000 : 0;
  const maxLtv = 50; // 50%
  const ckBtcAvailable = btcValue * (maxLtv / 100);
  
  // Animated values
  const [displayedBtcValue, setDisplayedBtcValue] = useState(0);
  const [displayedCkBtc, setDisplayedCkBtc] = useState(0);
  
  // Load UTXO ID from currentOrdinal if available
  useEffect(() => {
    if (currentOrdinal) {
      if (currentOrdinal.utxoId) {
        setUtxoId(currentOrdinal.utxoId);
        console.log('✅ UTXO ID loaded:', currentOrdinal.utxoId);
      }
      setIsLoading(false);
    }
  }, [currentOrdinal]);

  useEffect(() => {
    if (currentOrdinal) {
      setIsLoading(false);
      
      // Animate BTC value
      const btcInterval = setInterval(() => {
        setDisplayedBtcValue(prev => {
          const increment = btcValue / 50;
          return prev < btcValue ? Math.min(prev + increment, btcValue) : btcValue;
        });
      }, 20);
      
      // Animate ckBTC available
      const ckBtcInterval = setInterval(() => {
        setDisplayedCkBtc(prev => {
          const increment = ckBtcAvailable / 50;
          return prev < ckBtcAvailable ? Math.min(prev + increment, ckBtcAvailable) : ckBtcAvailable;
        });
      }, 20);
      
      return () => {
        clearInterval(btcInterval);
        clearInterval(ckBtcInterval);
      };
    }
  }, [currentOrdinal, btcValue, ckBtcAvailable]);

  if (!currentOrdinal) {
    navigate('/scan');
    return null;
  }

  const handleLock = async () => {
    setIsLocking(true);
    setError(null);
    
    try {
      if (!isIcpAuthenticated) {
        throw new Error('Please connect Internet Identity first.');
      }
      
      if (!currentOrdinal) {
        throw new Error('No ordinal selected.');
      }
      
      // Double-check authentication before making calls
      const { isAuthenticated } = await import('../services/icpAgent');
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        throw new Error('Internet Identity session expired. Please reconnect.');
      }
      
      // If UTXO ID is not available, we need to deposit it first
      let finalUtxoId = utxoId;
      
      if (!finalUtxoId) {
        console.log('⚠️ UTXO ID not found. Depositing UTXO to backend...');
        
        // Check if we're in test mode
        const isTest = btcAddress && isTestAddress(btcAddress);
        
        if (isTest) {
          // In test mode, we still need to call deposit_utxo to get a UTXO ID
          // The backend will handle test mode appropriately
          console.log('🧪 Test Mode: Depositing test UTXO to backend...');
        }
        
        // Prepare UTXO data for deposit
        if (!currentOrdinal.txid || currentOrdinal.vout === undefined) {
          throw new Error('Missing UTXO information (txid or vout).');
        }
        
        const utxoData = {
          txid: currentOrdinal.txid,
          vout: currentOrdinal.vout,
          amount: BigInt(currentOrdinal.satoshiValue),
          address: btcAddress || 'tb1qsmsy4wjhcwts9z9wg6mq3025x2tk4y03dtjslq',
        };
        
        console.log('📤 Depositing UTXO to backend:', utxoData);
        try {
          const newUtxoId = await depositUtxo(utxoData);
          console.log('✅ UTXO deposited successfully! UTXO ID:', newUtxoId);
          
          // Update local state first
          setUtxoId(newUtxoId);
          finalUtxoId = newUtxoId;
          
          // Update currentOrdinal with the new UTXO ID
          const updatedOrdinal = {
            ...currentOrdinal,
            utxoId: newUtxoId
          };
          setCurrentOrdinal(updatedOrdinal);
          
          // Also save to localStorage as backup
          localStorage.setItem('lastUtxoId', newUtxoId.toString());
          console.log('✅ Updated currentOrdinal with UTXO ID:', newUtxoId);
        } catch (depositError: unknown) {
          const depositErr = depositError as { message?: string };
          if (depositErr.message?.includes('Not authenticated') || 
              depositErr.message?.includes('Authentication failed') ||
              depositErr.message?.includes('certificate') ||
              depositErr.message?.includes('signature') ||
              depositErr.message?.includes('403') ||
              depositErr.message?.includes('Forbidden')) {
            throw new Error('Authentication failed. Please reconnect Internet Identity and try again.');
          }
          throw depositError;
        }
      }
      
      // Now lock the collateral
      console.log('🔒 Locking UTXO as collateral:', finalUtxoId);
      try {
        const loanOffer = await lockCollateral(finalUtxoId);
        console.log('✅ Collateral locked successfully! Loan Offer:', loanOffer);
        
        // Navigate to offer page
        navigate('/offer');
      } catch (lockError: unknown) {
        const lockErr = lockError as { message?: string };
        if (lockErr.message?.includes('Not authenticated') || 
            lockErr.message?.includes('Authentication failed') ||
            lockErr.message?.includes('certificate') ||
            lockErr.message?.includes('signature') ||
            lockErr.message?.includes('403') ||
            lockErr.message?.includes('Forbidden')) {
          throw new Error('Authentication failed. Please reconnect Internet Identity and try again.');
        }
        throw lockError;
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('❌ Failed to lock ordinal:', error);
      setError(err.message || 'Failed to lock ordinal. Please try again.');
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-3">Your Ordinal</h1>
          <p className="text-gray-400">Review your inscription before depositing as collateral</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, rotateY: -15 }}
            animate={{ opacity: 1, rotateY: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50"
          >
            <motion.div
              whileHover={{ scale: 1.02, rotateY: 5 }}
              className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 mb-4 border border-gray-700/50"
            >
              {currentOrdinal.imageUrl && currentOrdinal.imageUrl.startsWith('http') ? (
                <img
                  src={currentOrdinal.imageUrl}
                  alt="Ordinal"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8">
                  <div className="text-6xl mb-4">🎨</div>
                  <div className="text-white text-lg font-semibold mb-2">Ordinal Inscription</div>
                  <div className="text-gray-400 text-sm text-center">
                    {currentOrdinal.inscriptionId.substring(0, 20)}...
                  </div>
                </div>
              )}
              <div className="absolute top-4 right-4 bg-[#FFC700] text-[#0B0E11] px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                Verified
              </div>
              <div className="absolute top-4 left-4 bg-[#00D4FF]/20 backdrop-blur-sm text-[#00D4FF] px-3 py-1 rounded-full text-xs font-semibold border border-[#00D4FF]/30">
                Ordinal
              </div>
            </motion.div>

            <div className="space-y-3">
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-400 text-sm font-medium">Inscription ID</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentOrdinal.inscriptionId);
                    }}
                    className="text-[#00D4FF] hover:text-[#00FF85] text-xs font-medium transition-colors px-2 py-1 rounded hover:bg-[#00D4FF]/10"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-gray-900/50 rounded-lg px-3 py-2.5 border border-gray-700/30">
                  <span className="text-white font-mono text-sm select-all">
                    {currentOrdinal.inscriptionId.length > 30
                      ? `${currentOrdinal.inscriptionId.substring(0, 15)}...${currentOrdinal.inscriptionId.substring(currentOrdinal.inscriptionId.length - 15)}`
                      : currentOrdinal.inscriptionId}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium">Satoshi Value</span>
                  <span className="text-[#FFC700] font-bold text-lg">{currentOrdinal.satoshiValue.toLocaleString()} sats</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 mb-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Lock className="w-6 h-6 text-[#00D4FF]" />
                Collateral Details
              </h2>

              <div className="space-y-4 mb-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-[#00D4FF] animate-spin" />
                    <span className="ml-2 text-gray-400">Loading Ordinal details...</span>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Estimated Value</span>
                        <motion.span 
                          className="text-white font-bold text-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {displayedBtcValue.toFixed(6)} BTC
                        </motion.span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ delay: 0.5, duration: 1 }}
                          className="h-full bg-gradient-to-r from-[#00D4FF] to-[#00FF85]"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-[#00D4FF]/10 rounded-xl border border-[#00D4FF]/20">
                      <div className="flex items-start gap-2">
                        <Info className="w-5 h-5 text-[#00D4FF] flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-300">
                          Your Ordinal will be securely locked in a smart contract vault.
                          You can unlock it anytime by repaying your loan.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <motion.div 
                        className="p-4 bg-gray-800/50 rounded-xl text-center border border-gray-700/50"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.div 
                          className="text-2xl font-bold text-[#00D4FF] mb-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          {maxLtv}%
                        </motion.div>
                        <div className="text-xs text-gray-400">Max LTV</div>
                      </motion.div>
                      <motion.div 
                        className="p-4 bg-gray-800/50 rounded-xl text-center border border-gray-700/50"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <motion.div 
                          className="text-2xl font-bold text-[#FFC700] mb-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                        >
                          {displayedCkBtc.toFixed(6)}
                        </motion.div>
                        <div className="text-xs text-gray-400">ckBTC Available</div>
                      </motion.div>
                    </div>
                  </>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowConfirm(true)}
                className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-[#00D4FF] to-[#00FF85] text-[#0B0E11] hover:shadow-lg hover:shadow-[#00D4FF]/50 transition-all"
              >
                Lock This Ordinal
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => !isLocking && setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="flex justify-center mb-4"
              >
                <Lock className="w-12 h-12 text-[#FFC700]" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white text-center mb-2">
                Confirm Deposit
              </h3>
              <p className="text-gray-300 text-center mb-6 text-sm">
                ⚠️ You're about to lock your Ordinal as collateral. This action will transfer
                custody to the vault smart contract. You can unlock it anytime by repaying your loan.
              </p>

              <div className="space-y-3 mb-6">
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">UTXO</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(currentOrdinal.utxo)}
                      className="text-[#00D4FF] hover:text-[#00FF85] text-xs transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <span className="text-white font-mono text-sm break-all">
                    {currentOrdinal.utxo.length > 30
                      ? `${currentOrdinal.utxo.substring(0, 15)}...${currentOrdinal.utxo.substring(currentOrdinal.utxo.length - 15)}`
                      : currentOrdinal.utxo}
                  </span>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Collateral Value</span>
                    <span className="text-white font-semibold">{btcValue.toFixed(6)} BTC</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Lock Duration</span>
                    <span className="text-white">Until repaid</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isLocking}
                  className="py-3 rounded-xl font-bold bg-gray-700 text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleLock}
                  disabled={isLocking}
                  whileHover={!isLocking ? { scale: 1.05 } : {}}
                  whileTap={!isLocking ? { scale: 0.95 } : {}}
                  className="py-3 rounded-xl font-bold bg-gradient-to-r from-[#00D4FF] to-[#00FF85] text-[#0B0E11] hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLocking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Locking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
