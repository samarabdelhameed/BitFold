import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { VaultDoor } from '../components/VaultDoor';
import { Unlock, ArrowLeft } from 'lucide-react';

export function Withdraw() {
  const navigate = useNavigate();
  const { loanId } = useParams();
  const { loans } = useApp();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [doorOpening, setDoorOpening] = useState(false);

  const loan = loans.find(l => l.id === loanId);

  if (!loan) {
    navigate('/dashboard');
    return null;
  }

  if (loan.status !== 'REPAID') {
    navigate('/dashboard');
    return null;
  }

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    setDoorOpening(true);

    await new Promise(resolve => setTimeout(resolve, 3000));

    navigate('/congrats');
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-50">
        <Canvas camera={{ position: [0, 0, 6] }}>
          <VaultDoor isOpening={doorOpening} />
        </Canvas>
      </div>

      <div className="relative z-10 min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => !isWithdrawing && navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-[#00D4FF] transition-colors mb-8"
            disabled={isWithdrawing}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Unlock className="w-16 h-16 text-[#00FF85] mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-3">Withdraw Ordinal</h1>
            <p className="text-gray-400">Your Ordinal is ready to be unlocked</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50"
          >
            <div className="flex gap-6 mb-8">
              <motion.div
                whileHover={{ scale: 1.05, rotateY: 10 }}
                className="w-40 h-40 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 shadow-lg"
              >
                <img
                  src={loan.ordinal.imageUrl}
                  alt="Ordinal"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <div className="flex-1 space-y-3">
                <h3 className="text-2xl font-bold text-white mb-4">Loan Summary</h3>

                <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Inscription ID</span>
                  <span className="text-white font-mono text-sm">{loan.ordinal.inscriptionId}</span>
                </div>

                <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Amount Borrowed</span>
                  <span className="text-[#FFC700] font-bold">{loan.borrowedAmount.toFixed(4)} ckBTC</span>
                </div>

                <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Total Repaid</span>
                  <span className="text-[#00FF85] font-bold">{loan.borrowedAmount.toFixed(4)} ckBTC</span>
                </div>

                <div className="flex justify-between p-3 bg-[#00FF85]/10 rounded-lg border border-[#00FF85]/30">
                  <span className="text-gray-300">Status</span>
                  <span className="text-[#00FF85] font-bold flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#00FF85] rounded-full" />
                    REPAID
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#00FF85]/10 rounded-xl border border-[#00FF85]/20 mb-6">
              <p className="text-gray-300 text-center">
                Congratulations! Your loan has been fully repaid. You can now withdraw
                your Ordinal back to your Bitcoin wallet.
              </p>
            </div>

            <AnimatePresence>
              {isWithdrawing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div className="p-4 bg-[#00D4FF]/10 rounded-xl border border-[#00D4FF]/20">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-6 h-6 border-2 border-[#00D4FF] border-t-transparent rounded-full"
                      />
                      <span className="text-[#00D4FF] font-medium">Unlocking vault...</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3 }}
                        className="h-full bg-gradient-to-r from-[#00D4FF] to-[#00FF85]"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: !isWithdrawing ? 1.02 : 1 }}
              whileTap={{ scale: !isWithdrawing ? 0.98 : 1 }}
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                isWithdrawing
                  ? 'bg-gray-700 text-gray-400 cursor-wait'
                  : 'bg-gradient-to-r from-[#00FF85] to-[#00D4FF] text-[#0B0E11] hover:shadow-lg hover:shadow-[#00FF85]/50'
              }`}
            >
              {isWithdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
