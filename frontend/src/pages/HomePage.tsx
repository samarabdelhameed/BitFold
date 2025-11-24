import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { BitcoinScene } from '../components/BitcoinScene';
import { Bitcoin, Github, FileText } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getCollateral } from '../services/vaultService';

export function HomePage() {
  const navigate = useNavigate();
  const { isIcpAuthenticated, btcAddress } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleStartNow = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsReady(false);
    setShouldShake(false);

    try {
      // Step 1: Check Internet Identity
      if (!isIcpAuthenticated) {
        setErrorMessage('🔐 Please connect your Internet Identity first');
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 300);
        setIsLoading(false);
        return;
      }

      // Step 2: Check Bitcoin Wallet
      if (!btcAddress) {
        setErrorMessage('🔗 Please connect your Bitcoin wallet first');
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 300);
        setIsLoading(false);
        return;
      }

      // Step 3: Check if user has UTXO
      try {
        const collateral = await getCollateral();
        if (!collateral || collateral.length === 0) {
          setErrorMessage('💰 No Ordinals found. Get testnet Bitcoin first');
          setShouldShake(true);
          setTimeout(() => setShouldShake(false), 300);
          setIsLoading(false);
          return;
        }
      } catch (error: any) {
        console.error('Error checking UTXO:', error);
        // Check if it's an authentication error
        if (error?.message?.includes('authentication') || error?.message?.includes('identity')) {
          setErrorMessage('🔐 Please connect your Internet Identity first');
        } else if (error?.message?.includes('canister') || error?.message?.includes('network')) {
          setErrorMessage('⚠️ Cannot connect to canister. Please check your connection.');
        } else {
          setErrorMessage('💰 No Ordinals found. Get testnet Bitcoin first');
        }
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 300);
        setIsLoading(false);
        return;
      }

      // Step 4: Everything is ready
      setIsReady(true);
      setIsLoading(false);
      
      // Wait for success animation, then fade out and navigate
      setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          navigate('/scan');
        }, 300);
      }, 200);
    } catch (error) {
      console.error('Error in handleStartNow:', error);
      setErrorMessage('An error occurred. Please try again.');
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 300);
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[#0B0E11] relative overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <BitcoinScene />
        </Canvas>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block mb-6"
          >
            <Bitcoin className="w-20 h-20 text-[#FFC700]" />
          </motion.div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#00D4FF] via-[#FFC700] to-[#00FF85] bg-clip-text text-transparent">
            Unlock Liquidity
          </h1>

          <p className="text-2xl md:text-3xl text-gray-300 mb-4">
            from Your Ordinals
          </p>

          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Deposit your Bitcoin Ordinals as collateral and borrow ckBTC instantly.
            No intermediaries, fully decentralized on the Internet Computer.
          </p>

          <div className="flex flex-col items-center gap-4">
            <motion.button
              whileHover={!isLoading ? { scale: 1.05 } : {}}
              whileTap={!isLoading ? { scale: 0.95 } : {}}
              onClick={handleStartNow}
              disabled={isLoading}
              animate={{
                scale: isReady ? 1.05 : 1,
                x: shouldShake ? [-8, 8] : 0,
              }}
              transition={{
                x: shouldShake ? {
                  duration: 0.1,
                  repeat: 3,
                  repeatType: "reverse",
                  type: 'tween',
                } : {
                  duration: 0.2,
                  type: 'spring',
                  stiffness: 300,
                },
                scale: {
                  duration: 0.2,
                  type: 'spring',
                  stiffness: 300,
                },
              }}
              className={`px-12 py-4 rounded-full text-xl font-bold transition-all ${
                isReady
                  ? 'bg-gradient-to-r from-[#00FF85] to-[#00D4FF] text-[#0B0E11] shadow-lg shadow-[#00FF85]/50'
                  : 'bg-gradient-to-r from-[#00D4FF] to-[#00FF85] text-[#0B0E11] hover:shadow-lg hover:shadow-[#00D4FF]/50'
              } ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
            >
              {isLoading ? 'Checking...' : isReady ? '✅ Ready to unlock liquidity!' : 'Start Now'}
            </motion.button>

            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-3 max-w-md"
                >
                  <p className="text-red-400 text-sm font-medium text-center">
                    {errorMessage}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/connect')}
                    className="px-6 py-2 bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 rounded-full text-sm font-semibold text-[#00D4FF] transition-all"
                  >
                    Connect Now →
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-16 flex flex-col items-center gap-4">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-[#00D4FF] mb-2">50%</div>
                <div className="text-sm text-gray-400">LTV Ratio</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#FFC700] mb-2">0%</div>
                <div className="text-sm text-gray-400">Interest Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#00FF85] mb-2">24/7</div>
                <div className="text-sm text-gray-400">Availability</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 z-10 py-6 px-8 flex justify-center gap-8">
        <motion.a
          whileHover={{ scale: 1.1 }}
          href="#"
          className="flex items-center gap-2 text-gray-400 hover:text-[#00D4FF] transition-colors"
        >
          <Github className="w-5 h-5" />
          <span>GitHub</span>
        </motion.a>
        <motion.a
          whileHover={{ scale: 1.1 }}
          href="#"
          className="flex items-center gap-2 text-gray-400 hover:text-[#00D4FF] transition-colors"
        >
          <FileText className="w-5 h-5" />
          <span>Docs</span>
        </motion.a>
      </footer>
    </motion.div>
  );
}
