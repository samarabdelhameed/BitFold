import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Wallet, Shield, ArrowRight } from 'lucide-react';

const btcWallets = [
  { id: 'unisat', name: 'Unisat', logo: '🦄' },
  { id: 'xverse', name: 'Xverse', logo: '✨' },
  { id: 'magiceden', name: 'Magic Eden', logo: '🪄' }
];

export function ConnectWallet() {
  const navigate = useNavigate();
  const { setPrincipal, setBtcAddress } = useApp();
  const [selectedBtc, setSelectedBtc] = useState<string | null>(null);
  const [icpConnected, setIcpConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleBtcConnect = (walletId: string) => {
    setIsConnecting(true);
    setTimeout(() => {
      setSelectedBtc(walletId);
      setBtcAddress(`bc1q${Math.random().toString(36).substring(2, 15)}...`);
      setIsConnecting(false);
    }, 1000);
  };

  const handleIcpConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      const principal = `${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 10)}`;
      setPrincipal(principal);
      setIcpConnected(true);
      setIsConnecting(false);
    }, 1000);
  };

  const canContinue = selectedBtc && icpConnected;

  return (
    <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Wallet className="w-16 h-16 text-[#00D4FF] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-3">Connect Wallets</h1>
          <p className="text-gray-400">Connect both your Bitcoin and ICP wallets to continue</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span>₿</span> Bitcoin Wallet
            </h2>

            <div className="space-y-4">
              {btcWallets.map((wallet, index) => (
                <motion.button
                  key={wallet.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: 1.02, rotateY: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleBtcConnect(wallet.id)}
                  disabled={isConnecting}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    selectedBtc === wallet.id
                      ? 'border-[#00D4FF] bg-[#00D4FF]/10'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{wallet.logo}</span>
                    <span className="text-lg font-semibold text-white">{wallet.name}</span>
                    {selectedBtc === wallet.id && (
                      <Shield className="w-5 h-5 text-[#00FF85] ml-auto" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span>∞</span> Internet Identity
            </h2>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleIcpConnect}
              disabled={isConnecting}
              className={`w-full p-6 rounded-xl border-2 transition-all ${
                icpConnected
                  ? 'border-[#00D4FF] bg-[#00D4FF]/10'
                  : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
              }`}
            >
              <div className="text-center">
                <div className="text-5xl mb-4">🔐</div>
                <div className="text-lg font-semibold text-white mb-2">
                  {icpConnected ? 'Connected' : 'Connect Internet Identity'}
                </div>
                {icpConnected && (
                  <div className="flex items-center justify-center gap-2 text-[#00FF85]">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Authenticated</span>
                  </div>
                )}
              </div>
            </motion.button>

            <div className="mt-8 p-4 bg-[#00D4FF]/10 rounded-xl border border-[#00D4FF]/20">
              <p className="text-sm text-gray-300">
                Internet Identity provides secure, privacy-preserving authentication
                without passwords or personal information.
              </p>
            </div>
          </motion.div>
        </div>

        {!canContinue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-4 bg-[#FFC700]/10 rounded-xl border border-[#FFC700]/20 text-center"
          >
            <p className="text-[#FFC700] font-medium">
              {!selectedBtc && !icpConnected
                ? '⚠️ Please connect both wallets to continue'
                : !selectedBtc
                ? '⚠️ Please select a Bitcoin wallet'
                : '⚠️ Please connect your Internet Identity'}
            </p>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: canContinue ? 1.02 : 1 }}
          whileTap={{ scale: canContinue ? 0.98 : 1 }}
          onClick={() => canContinue && navigate('/scan')}
          disabled={!canContinue}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            canContinue
              ? 'bg-gradient-to-r from-[#00D4FF] to-[#00FF85] text-[#0B0E11] hover:shadow-lg hover:shadow-[#00D4FF]/50'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canContinue ? (
            <>
              Continue
              <ArrowRight className="w-5 h-5" />
            </>
          ) : (
            <>
              Connect Both Wallets First
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
