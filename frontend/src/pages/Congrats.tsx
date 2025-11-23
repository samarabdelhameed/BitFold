import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Fireworks } from '../components/Fireworks';
import { Trophy, Home } from 'lucide-react';

export function Congrats() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0E11] relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 8] }}>
          <Fireworks />
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
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <Trophy className="w-32 h-32 text-[#FFC700] mx-auto mb-8" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#00D4FF] via-[#FFC700] to-[#00FF85] bg-clip-text text-transparent"
          >
            Congratulations!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-2xl md:text-3xl text-gray-300 mb-6"
          >
            You successfully unlocked your Ordinal!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 mb-8"
          >
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring' }}
                  className="text-4xl font-bold text-[#00FF85] mb-2"
                >
                  ✓
                </motion.div>
                <div className="text-sm text-gray-400">Loan Repaid</div>
              </div>
              <div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9, type: 'spring' }}
                  className="text-4xl font-bold text-[#FFC700] mb-2"
                >
                  ✓
                </motion.div>
                <div className="text-sm text-gray-400">Ordinal Unlocked</div>
              </div>
              <div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.0, type: 'spring' }}
                  className="text-4xl font-bold text-[#00D4FF] mb-2"
                >
                  ✓
                </motion.div>
                <div className="text-sm text-gray-400">Returned to Wallet</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="space-y-4"
          >
            <p className="text-gray-400 mb-8">
              Your Ordinal has been returned to your Bitcoin wallet. Thank you for using
              our decentralized lending platform!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#00D4FF] to-[#00FF85] text-[#0B0E11] px-8 py-4 rounded-full text-lg font-bold hover:shadow-lg hover:shadow-[#00D4FF]/50 transition-all"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center gap-2 bg-gray-800 text-white border border-gray-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-700 transition-all"
              >
                View Dashboard
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
