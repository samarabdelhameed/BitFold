import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Search, CheckCircle, AlertCircle } from 'lucide-react';

export function ScanOrdinal() {
  const navigate = useNavigate();
  const { setCurrentOrdinal } = useApp();
  const [utxo, setUtxo] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [found, setFound] = useState(false);

  const handleScan = async () => {
    if (!utxo.trim()) {
      setError('Please enter a UTXO');
      return;
    }

    setIsScanning(true);
    setError('');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockOrdinal = {
      utxo,
      inscriptionId: `${utxo.substring(0, 8)}...i0`,
      imageUrl: 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=400',
      satoshiValue: 100000000
    };

    setCurrentOrdinal(mockOrdinal);
    setFound(true);
    setIsScanning(false);

    setTimeout(() => {
      navigate('/preview');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Search className="w-16 h-16 text-[#00D4FF] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-3">Scan Your Ordinal</h1>
          <p className="text-gray-400">Enter the UTXO containing your Ordinal inscription</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 relative overflow-hidden"
        >
          {isScanning && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="absolute top-0 left-0 h-1 w-1/3 bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent"
            />
          )}

          <div className="relative">
            <input
              type="text"
              value={utxo}
              onChange={(e) => {
                setUtxo(e.target.value);
                setError('');
                setFound(false);
              }}
              placeholder="Enter UTXO (e.g., abc123def456...)"
              className={`w-full bg-gray-900/50 border-2 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none transition-all ${
                found
                  ? 'border-[#00FF85] shadow-lg shadow-[#00FF85]/20'
                  : error
                  ? 'border-red-500'
                  : 'border-gray-600 focus:border-[#00D4FF]'
              }`}
              disabled={isScanning || found}
            />

            <AnimatePresence>
              {found && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <CheckCircle className="w-6 h-6 text-[#00FF85]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 text-red-400"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleScan}
            disabled={isScanning || found}
            className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all ${
              isScanning
                ? 'bg-gray-700 text-gray-400 cursor-wait'
                : found
                ? 'bg-[#00FF85] text-[#0B0E11]'
                : 'bg-gradient-to-r from-[#00D4FF] to-[#00FF85] text-[#0B0E11] hover:shadow-lg hover:shadow-[#00D4FF]/50'
            }`}
          >
            {isScanning ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"
                />
                Scanning...
              </span>
            ) : found ? (
              'Ordinal Found!'
            ) : (
              'Scan UTXO'
            )}
          </motion.button>

          <div className="mt-6 p-4 bg-[#00D4FF]/10 rounded-xl border border-[#00D4FF]/20">
            <p className="text-sm text-gray-300 mb-3">
              We'll verify your Ordinal inscription and check its eligibility for collateral.
              This process is secure and only reads public blockchain data.
            </p>
            <div className="mt-4 pt-4 border-t border-[#00D4FF]/20">
              <p className="text-xs font-semibold text-[#00D4FF] mb-2">What is a UTXO?</p>
              <p className="text-xs text-gray-400 mb-2">
                UTXO (Unspent Transaction Output) is the identifier for your Bitcoin Ordinal. You can find it in:
              </p>
              <ul className="text-xs text-gray-400 list-disc list-inside space-y-1 ml-2">
                <li>Your Bitcoin wallet that holds the Ordinal</li>
                <li>Blockchain explorers (e.g., mempool.space, ord.io)</li>
                <li>Ordinal indexers or marketplaces</li>
              </ul>
              <p className="text-xs text-gray-400 mt-3 italic">
                Format: Transaction ID (64 characters hex) or txid:vout
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Example: abc123def4567890abcdef1234567890abcdef1234567890abcdef1234567890
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
