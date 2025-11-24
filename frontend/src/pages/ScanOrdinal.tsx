import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Search, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { depositUtxo, getUtxo } from '../services/vaultService';
import { getTestUtxos, isTestAddress, createTestUtxo } from '../services/testUtxoService';

export function ScanOrdinal() {
  const navigate = useNavigate();
  const { setCurrentOrdinal, btcAddress, isIcpAuthenticated } = useApp();
  const [utxo, setUtxo] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [found, setFound] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [ordinalData, setOrdinalData] = useState<any>(null);
  const [isValidFormat, setIsValidFormat] = useState<boolean | null>(null);

  // Validate format as user types
  const validateFormat = (input: string): boolean => {
    if (!input.trim()) {
      setIsValidFormat(null);
      return false;
    }
    
    const parts = input.split(':');
    const txid = parts[0].trim();
    const voutStr = parts.length > 1 ? parts[1].trim() : '';
    
    // Check txid format (64 hex characters)
    const isValidTxid = /^[a-fA-F0-9]{64}$/.test(txid);
    
    // Check vout if provided (must be a number)
    const isValidVout = !voutStr || /^\d+$/.test(voutStr);
    
    const isValid = isValidTxid && isValidVout;
    setIsValidFormat(isValid);
    return isValid;
  };

  const handleScan = async () => {
    if (!utxo.trim()) {
      setError('Please enter a UTXO');
      return;
    }

    // Validate format first
    if (!validateFormat(utxo)) {
      setError('❌ Invalid UTXO format. Please use: txid:vout (e.g., abc123...def456:0)');
      return;
    }

    setIsScanning(true);
    setError('');
    setScanStatus('🔍 Validating format...');

    try {
      // Parse UTXO input (format: txid:vout or just txid)
      const parts = utxo.trim().split(':');
      const txid = parts[0].trim();
      const vout = parts.length > 1 ? parseInt(parts[1].trim()) : 0;

      // Step 1: Format validation (already done, but double check)
      setScanStatus('✅ Format valid. Scanning Bitcoin network...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX

      // Step 2: Check if using test mode
      // Use test mode if: test address OR no Internet Identity connected OR no btcAddress
      const isTest = (btcAddress && isTestAddress(btcAddress)) || !isIcpAuthenticated || !btcAddress;
      
      if (isTest) {
        // Test Mode: Use simulated UTXO (no backend call needed)
        console.log('🧪 Test Mode: Using simulated UTXO');
        setScanStatus('🧪 Test Mode: Checking simulated UTXO...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        
        const testUtxos = getTestUtxos(btcAddress);
        let testUtxo = testUtxos.find(u => u.txid === txid && u.vout === vout);
        
        if (!testUtxo) {
          // Create a new test UTXO if not found
          testUtxo = createTestUtxo(btcAddress, BigInt(100000000), {
            inscription_id: `${txid}i0`,
            content_type: 'image/png',
            content_preview: 'Test Ordinal Preview',
            metadata: '{"name": "Test Ordinal"}'
          });
          console.log('✅ Created new test UTXO:', testUtxo);
        } else {
          console.log('✅ Found test UTXO:', testUtxo);
        }
        
        // Simulate success without backend call
        setScanStatus('✅ Ordinal found! Loading details...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Create ordinal object with test data
        // Use a real image URL for test mode
        const defaultImageUrl = 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=800';
        const imageUrl = testUtxo.ordinalInfo?.content_preview && testUtxo.ordinalInfo.content_preview.startsWith('http')
          ? testUtxo.ordinalInfo.content_preview
          : defaultImageUrl;
        
        // In test mode, we don't have a real UTXO ID, so we'll use undefined
        // In production, this comes from deposit_utxo response
        const ordinal = {
          utxo: `${txid}:${vout}`,
          utxoId: undefined, // Test mode - no real UTXO ID
          inscriptionId: testUtxo.ordinalInfo?.inscription_id || `${txid.substring(0, 8)}...i0`,
          imageUrl: imageUrl,
          satoshiValue: Number(testUtxo.amount),
          txid: testUtxo.txid,
          vout: testUtxo.vout,
          amount: Number(testUtxo.amount) / 100000000, // Convert to BTC
          ordinalInfo: testUtxo.ordinalInfo
        };

        setOrdinalData({
          txid: testUtxo.txid,
          vout: testUtxo.vout,
          value: Number(testUtxo.amount) / 100000000,
          inscriptionId: testUtxo.ordinalInfo?.inscription_id,
          contentType: testUtxo.ordinalInfo?.content_type
        });

        setCurrentOrdinal(ordinal);
        setFound(true);
        setScanStatus('✅ Ordinal found! View details below');
        
        // Auto-navigate after showing success
        setTimeout(() => {
          navigate('/preview');
        }, 2000);
      } else {
        // Production mode: use real Bitcoin address and backend
        // First check if Internet Identity is connected
        if (!isIcpAuthenticated) {
          throw new Error('Please connect Internet Identity first to use production mode.');
        }
        
        setScanStatus('🔍 Verifying UTXO on Bitcoin testnet...');
        
        const utxoData = {
        txid,
        vout,
          amount: BigInt(100000000), // Will be updated by backend verification
          address: btcAddress || 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          // ordinalInfo will be fetched by backend from indexer
        };

        // Step 3: Call backend to verify and deposit UTXO
        setScanStatus('🔍 Checking for Ordinal inscription...');
        console.log('📤 Calling deposit_utxo with real data:', utxoData);
        const utxoId = await depositUtxo(utxoData);
        console.log('✅ deposit_utxo successful! UTXO ID:', utxoId);

        // Step 4: Get UTXO details from backend to show real data
        setScanStatus('✅ Ordinal found! Loading details...');
        
        // Get UTXO details from backend
        const utxoDetails = await getUtxo(utxoId);
        console.log('📥 UTXO details from backend:', utxoDetails);
        
        if (utxoDetails) {
          // Create ordinal object with real data from backend
          const ordinal = {
            utxo: `${txid}:${vout}`,
            utxoId: utxoId, // Store UTXO ID for later use
            inscriptionId: utxoDetails.ordinal_info?.[0]?.inscription_id || `${txid.substring(0, 8)}...i0`,
            imageUrl: utxoDetails.ordinal_info?.[0]?.content_preview?.[0] || 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=400',
            satoshiValue: Number(utxoDetails.amount),
            txid: utxoDetails.txid,
            vout: utxoDetails.vout,
            amount: Number(utxoDetails.amount) / 100000000, // Convert to BTC
            ordinalInfo: utxoDetails.ordinal_info?.[0]
          };

          setOrdinalData({
            txid: utxoDetails.txid,
            vout: utxoDetails.vout,
            value: Number(utxoDetails.amount) / 100000000,
            inscriptionId: utxoDetails.ordinal_info?.[0]?.inscription_id,
            contentType: utxoDetails.ordinal_info?.[0]?.content_type
          });

          setCurrentOrdinal(ordinal);
      setFound(true);
          setScanStatus('✅ Ordinal found! View details below');

          // Auto-navigate after showing success
      setTimeout(() => {
        navigate('/preview');
          }, 2000);
        } else {
          throw new Error('Failed to retrieve UTXO details');
        }
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      
      // Parse error message for better UX
      let errorMessage = 'Failed to verify UTXO. Please check the transaction ID and try again.';
      
      if (err.message?.includes('Invalid transaction ID') || err.message?.includes('Invalid UTXO format')) {
        errorMessage = '❌ Invalid UTXO format. Please use: txid:vout (64 hex characters)';
      } else if (err.message?.includes('UTXO not found') || err.message?.includes('verification failed')) {
        errorMessage = '❌ UTXO not found on Bitcoin testnet. Please verify the transaction ID.';
      } else if (err.message?.includes('No Ordinal') || err.message?.includes('No inscription')) {
        errorMessage = '❌ No Ordinal inscription detected in this UTXO.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      setScanStatus(null);
    } finally {
      setIsScanning(false);
    }
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
                const value = e.target.value;
                setUtxo(value);
                setError('');
                setFound(false);
                setScanStatus(null);
                validateFormat(value);
              }}
              placeholder="Enter UTXO (e.g., a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456:0)"
              className={`w-full bg-gray-900/50 border-2 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none transition-all ${
                found
                  ? 'border-[#00FF85] shadow-lg shadow-[#00FF85]/20'
                  : error || isValidFormat === false
                  ? 'border-red-500'
                  : isValidFormat === true
                  ? 'border-[#00FF85] shadow-lg shadow-[#00FF85]/10'
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

          <AnimatePresence>
            {scanStatus && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 flex items-center gap-2 text-blue-400 text-sm"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{scanStatus}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </motion.div>
          )}

          {ordinalData && found && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-[#00FF85]/10 rounded-xl border border-[#00FF85]/30"
            >
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-[#00FF85]" />
                <h3 className="text-lg font-bold text-white">✅ Ordinal found! View details below</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">TXID:</span>
                  <span className="text-white font-mono text-xs">{ordinalData.txid.substring(0, 16)}...{ordinalData.txid.substring(48)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">VOUT:</span>
                  <span className="text-white">{ordinalData.vout}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Value:</span>
                  <span className="text-white font-semibold">{ordinalData.value} BTC</span>
                </div>
                {ordinalData.inscriptionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Inscription ID:</span>
                    <span className="text-white font-mono text-xs">{ordinalData.inscriptionId.substring(0, 16)}...</span>
                  </div>
                )}
              </div>
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
                <Loader2 className="w-5 h-5 animate-spin" />
                Scanning...
              </span>
            ) : found ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                View Your Ordinal
              </span>
            ) : (
              'Scan UTXO'
            )}
          </motion.button>

          <div className="mt-6 p-4 bg-[#00D4FF]/10 rounded-xl border border-[#00D4FF]/20">
            <p className="text-sm text-gray-300 mb-3">
              We'll verify your Ordinal inscription and check its eligibility for collateral.
              This process is secure and only reads public blockchain data.
            </p>
            
            {/* Quick Test Examples */}
            <div className="mt-4 pt-4 border-t border-[#00D4FF]/20">
              <p className="text-xs font-semibold text-[#00FF85] mb-2">🧪 Quick Test (Click to use):</p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setUtxo('a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456:0');
                    setError('');
                    setFound(false);
                    validateFormat('a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456:0');
                  }}
                  className="w-full text-left px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded text-xs text-gray-300 font-mono transition-all"
                >
                  ✅ With Ordinal: a1b2c3d4...123456:0
                </button>
                <button
                  onClick={() => {
                    setUtxo('c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890:0');
                    setError('');
                    setFound(false);
                    validateFormat('c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890:0');
                  }}
                  className="w-full text-left px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded text-xs text-gray-300 font-mono transition-all"
                >
                  ⚪ Without Ordinal: c3d4e5f6...7890:0
                </button>
              </div>
            </div>
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
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-[#00FF85] mb-2">📝 Test Examples (Test Mode):</p>
                <div className="space-y-1 text-xs text-gray-400 font-mono bg-gray-800/50 p-2 rounded">
                  <div>With Ordinal:</div>
                  <div className="text-[#00D4FF] break-all">
                    a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456:0
                  </div>
                  <div className="mt-2">Without Ordinal:</div>
                  <div className="text-[#00D4FF] break-all">
                    c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890:0
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">
                  💡 Format: txid:vout (64 hex characters for txid, number for vout)
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
