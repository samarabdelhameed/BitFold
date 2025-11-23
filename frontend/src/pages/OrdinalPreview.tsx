import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Lock, Info } from 'lucide-react';

export function OrdinalPreview() {
  const navigate = useNavigate();
  const { currentOrdinal } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  if (!currentOrdinal) {
    navigate('/scan');
    return null;
  }

  const handleLock = async () => {
    setIsLocking(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLocking(false);
    navigate('/offer');
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
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-800 mb-4"
            >
              <img
                src={currentOrdinal.imageUrl}
                alt="Ordinal"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-[#FFC700] text-[#0B0E11] px-3 py-1 rounded-full text-sm font-bold">
                Verified
              </div>
            </motion.div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-400">Inscription ID</span>
                <span className="text-white font-mono text-sm">{currentOrdinal.inscriptionId}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-400">Satoshi Value</span>
                <span className="text-[#FFC700] font-bold">{currentOrdinal.satoshiValue.toLocaleString()} sats</span>
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
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Estimated Value</span>
                    <span className="text-white font-bold">0.002 BTC</span>
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
                  <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-[#00D4FF] mb-1">50%</div>
                    <div className="text-xs text-gray-400">Max LTV</div>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-[#FFC700] mb-1">0.001</div>
                    <div className="text-xs text-gray-400">ckBTC Available</div>
                  </div>
                </div>
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
              <Lock className="w-12 h-12 text-[#FFC700] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white text-center mb-4">
                Confirm Deposit
              </h3>
              <p className="text-gray-300 text-center mb-6">
                You're about to lock your Ordinal as collateral. This action will transfer
                custody to the vault smart contract.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">UTXO</span>
                  <span className="text-white font-mono text-sm">{currentOrdinal.utxo.substring(0, 12)}...</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Lock Duration</span>
                  <span className="text-white">Until repaid</span>
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
                <button
                  onClick={handleLock}
                  disabled={isLocking}
                  className="py-3 rounded-xl font-bold bg-gradient-to-r from-[#00D4FF] to-[#00FF85] text-[#0B0E11] hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isLocking ? 'Locking...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
