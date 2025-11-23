import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CoinRain } from '../components/CoinRain';
import { CheckCircle, ArrowRight } from 'lucide-react';

export function BorrowSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0E11] relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 8] }}>
          <CoinRain />
        </Canvas>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-center max-w-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className="w-24 h-24 text-[#00FF85] mx-auto mb-6" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-6xl font-bold text-white mb-4"
          >
            Success!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl text-gray-300 mb-8"
          >
            You just borrowed <span className="text-[#FFC700] font-bold">0.001 ckBTC</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 mb-8"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
                <span className="text-gray-400">Transaction ID</span>
                <span className="text-white font-mono text-sm">0x7a8f...9d2c</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
                <span className="text-gray-400">Amount Borrowed</span>
                <span className="text-[#FFC700] font-bold text-lg">0.001 ckBTC</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
                <span className="text-gray-400">Collateral Locked</span>
                <span className="text-[#00D4FF] font-bold">1 Ordinal</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
                <span className="text-gray-400">Status</span>
                <span className="text-[#00FF85] font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#00FF85] rounded-full animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="space-y-4"
          >
            <p className="text-gray-400 text-sm mb-6">
              Your ckBTC has been sent to your wallet. You can now use it anywhere
              in the Internet Computer ecosystem.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00D4FF] to-[#00FF85] text-[#0B0E11] px-8 py-4 rounded-full text-lg font-bold hover:shadow-lg hover:shadow-[#00D4FF]/50 transition-all"
            >
              View Dashboard
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
