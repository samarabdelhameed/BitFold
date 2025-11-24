import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Wallet, Shield, ArrowRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const btcWallets = [
  { id: 'unisat', name: 'Unisat', logo: '🦄', network: 'mainnet', note: 'Mainnet only' },
  { id: 'xverse', name: 'Xverse', logo: '✨', network: 'both', note: 'Mainnet & Testnet' },
  { id: 'magiceden', name: 'Magic Eden', logo: '🪄', network: 'both', note: 'Mainnet & Testnet' },
  { id: 'testmode', name: 'Test Mode', logo: '🧪', network: 'testnet', note: 'Simulated UTXO' }
];

export function ConnectWallet() {
  const navigate = useNavigate();
  const { setPrincipal, setBtcAddress, icpLogin, isIcpAuthenticated } = useApp();
  const [selectedBtc, setSelectedBtc] = useState<string | null>(null);
  const [isConnectingBtc, setIsConnectingBtc] = useState<string | null>(null);
  const [isConnectingIcp, setIsConnectingIcp] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [btcError, setBtcError] = useState<string | null>(null);
  const [icpError, setIcpError] = useState<string | null>(null);

  // Load saved connections from localStorage
  useEffect(() => {
    const savedBtcWallet = localStorage.getItem('btcWallet');
    const savedBtcAddress = localStorage.getItem('btcAddress');
    
    if (savedBtcWallet && savedBtcAddress) {
      setSelectedBtc(savedBtcWallet);
      setBtcAddress(savedBtcAddress);
      console.log('📂 Loaded saved Bitcoin wallet from localStorage');
    }
  }, [setBtcAddress]);

  // Listen for postMessage from wallets (for testnet)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from trusted sources
      if (event.origin !== window.location.origin) {
        return;
      }

      // Handle wallet connection messages
      if (event.data && event.data.type === 'WALLET_CONNECTED') {
        const { walletId, address, network } = event.data;
        console.log(`📨 PostMessage received: ${walletId} connected`, { address, network });
        
        if (address) {
          setSelectedBtc(walletId);
          setBtcAddress(address);
        }
      }

      // Handle network switch messages
      if (event.data && event.data.type === 'NETWORK_SWITCHED') {
        const { walletId, network } = event.data;
        console.log(`📨 Network switched: ${walletId} → ${network}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setBtcAddress]);

  const handleBtcConnect = async (walletId: string) => {
    setIsConnectingBtc(walletId);
    setBtcError(null);
    setConnectionStatus(`Connecting to ${walletId}...`);
    try {
      let address: string | null = null;
      let network: string | null = null;

      // Real wallet connection based on wallet type
      if (walletId === 'unisat') {
        if (typeof window !== 'undefined' && window.unisat) {
          try {
            // UniSat only supports Mainnet (no testnet)
            const currentNetwork = await window.unisat.getNetwork();
            console.log('Current UniSat network:', currentNetwork);
            console.log('ℹ️ UniSat only supports Mainnet (Bitcoin Mainnet)');
            
            // Request accounts from UniSat
            const accounts = await window.unisat.requestAccounts();
            if (accounts && accounts.length > 0) {
              address = accounts[0];
              network = currentNetwork; // Will be 'livenet' (mainnet)
              
              // Get balance data
              try {
                const balance = await window.unisat.getBalance();
                console.log('💰 UniSat Balance:', balance);
              } catch (err) {
                console.warn('Could not fetch balance:', err);
              }
              
              console.log('✅ UniSat connected (Mainnet):', address);
              console.log('🌐 Network:', network);
            } else {
              throw new Error('No accounts found in UniSat wallet.');
            }
          } catch (error: any) {
            console.error('UniSat connection error:', error);
            throw new Error(error.message || 'Failed to connect to UniSat wallet. Please approve the connection request.');
          }
        } else {
          throw new Error('Unisat wallet not found. Please install Unisat extension from https://unisat.io');
        }
      } else if (walletId === 'xverse') {
        if (typeof window !== 'undefined' && window.XverseProviders) {
          try {
            const provider = window.XverseProviders.BitcoinProvider;
            
            // Request connection
            await provider.request('requestAccounts', {});
            
            // Get accounts
            const response = await provider.request('getAccounts', {});
            if (response && response.length > 0) {
              address = response[0];
              console.log('✅ Xverse connected:', address);
            } else {
              throw new Error('No accounts found in Xverse wallet.');
            }
          } catch (error: any) {
            console.error('Xverse connection error:', error);
            throw new Error(error.message || 'Failed to connect to Xverse wallet. Please approve the connection request.');
          }
        } else {
          throw new Error('Xverse wallet not found. Please install Xverse extension.');
        }
      } else if (walletId === 'magiceden') {
        if (typeof window !== 'undefined' && window.magicEden) {
          try {
            // Magic Eden wallet connection
            const accounts = await window.magicEden.requestAccounts();
            if (accounts && accounts.length > 0) {
              address = accounts[0];
              
              // Try to get network if available
              try {
                network = await window.magicEden.getNetwork();
                console.log('🌐 Magic Eden Network:', network);
              } catch (err) {
                console.warn('Could not get network:', err);
              }
              
              console.log('✅ Magic Eden connected:', address);
            } else {
              throw new Error('No accounts found in Magic Eden wallet.');
            }
          } catch (error: any) {
            console.error('Magic Eden connection error:', error);
            throw new Error(error.message || 'Failed to connect to Magic Eden wallet. Please approve the connection request.');
          }
        } else {
          throw new Error('Magic Eden wallet not found. Please install Magic Eden extension.');
        }
      } else if (walletId === 'testmode') {
        // Test Mode: Simulated UTXO for testing
        // Generate a valid testnet bech32 address (tb1q format, ~42 characters)
        const chars = '023456789acdefghjklmnpqrstuvwxyz';
        let randomPart = '';
        for (let i = 0; i < 38; i++) {
          randomPart += chars[Math.floor(Math.random() * chars.length)];
        }
        address = 'tb1q' + randomPart;
        network = 'testnet';
        console.log('🧪 Test Mode activated - Simulated UTXO');
        console.log('📍 Test Address:', address);
        console.log('💡 This is a simulated address for testing purposes');
      }

      if (!address) {
        throw new Error('Failed to get Bitcoin address from wallet.');
      }

      // Validate Bitcoin address format (mainnet and testnet)
      const isValidMainnet = address.startsWith('bc1') || address.startsWith('1') || address.startsWith('3');
      const isValidTestnet = address.startsWith('tb1') || address.startsWith('bcrt1') || address.startsWith('m') || address.startsWith('n');
      
      if (!isValidMainnet && !isValidTestnet) {
        throw new Error('Invalid Bitcoin address format. Must be a valid mainnet or testnet address.');
      }

      console.log(`✅ ${walletId} wallet connected successfully!`);
      console.log(`📍 Bitcoin Address: ${address}`);
      if (network) {
        console.log(`🌐 Network: ${network}`);
      }
      
      setSelectedBtc(walletId);
      setBtcAddress(address);
      
      // Send postMessage for testnet integration
      try {
        window.postMessage({
          type: 'WALLET_CONNECTED',
          walletId,
          address,
          network: network || (address.startsWith('tb1') ? 'testnet' : 'mainnet'),
          timestamp: Date.now()
        }, window.location.origin);
        console.log('📨 PostMessage sent for testnet integration');
      } catch (err) {
        console.warn('Could not send postMessage:', err);
      }
      
      // Save to localStorage
      localStorage.setItem('btcWallet', walletId);
      localStorage.setItem('btcAddress', address);
      if (network) {
        localStorage.setItem('btcNetwork', network);
      }
      
      console.log('💾 Address saved to AppContext and localStorage');
      setConnectionStatus(`✅ Bitcoin wallet connected successfully!`);
      setTimeout(() => setConnectionStatus(null), 3000);
      
      // Check if both are connected and auto-navigate
      if (isIcpAuthenticated) {
        setTimeout(() => {
          navigate('/scan');
        }, 1000);
      }
    } catch (error: any) {
      console.error(`Failed to connect ${walletId}:`, error);
      setBtcError(error.message || `Failed to connect ${walletId} wallet. Please make sure the extension is installed.`);
      setConnectionStatus(`❌ Failed to connect Bitcoin wallet. Please try again.`);
      setTimeout(() => setConnectionStatus(null), 5000);
    } finally {
      setIsConnectingBtc(null);
    }
  };

  const handleIcpConnect = async () => {
    setIsConnectingIcp(true);
    setIcpError(null);
    setConnectionStatus('Connecting to Internet Identity...');
    try {
      await icpLogin();
      // icpLogin already updates isIcpAuthenticated in AppContext
      
      // Get principal and save to localStorage
      const { getPrincipal } = await import('../services/icpAgent');
      const principal = getPrincipal();
      if (principal) {
        localStorage.setItem('icpPrincipal', principal.toString());
      }
      
      console.log('✅ Internet Identity connected successfully');
      setConnectionStatus('✅ Internet Identity connected successfully!');
      setTimeout(() => setConnectionStatus(null), 3000);
      
      // Check if both are connected and auto-navigate
      if (selectedBtc) {
        setTimeout(() => {
          navigate('/scan');
        }, 1000);
      }
    } catch (error: any) {
      console.error('Failed to connect Internet Identity:', error);
      
      // Handle user cancellation gracefully
      if (error?.name === 'UserCancelled' || error?.message?.includes('UserInterrupt') || error?.message?.includes('User cancelled')) {
        console.log('ℹ️ User cancelled Internet Identity connection');
        setConnectionStatus(null);
        // Don't show error for user cancellation
        return;
      }
      
      // Show error for other failures
      setIcpError('Failed to connect Internet Identity. Please try again.');
      setConnectionStatus('❌ Failed to connect Internet Identity. Please try again.');
      setTimeout(() => setConnectionStatus(null), 5000);
    } finally {
      setIsConnectingIcp(false);
    }
  };

  const canContinue = selectedBtc && isIcpAuthenticated;

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
          
          <AnimatePresence>
            {connectionStatus && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${
                  connectionStatus.startsWith('✅')
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : connectionStatus.startsWith('❌')
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {connectionStatus}
              </motion.div>
            )}
          </AnimatePresence>
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
                  disabled={isConnectingBtc !== null || isConnectingIcp}
                  className={`w-full p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                    selectedBtc === wallet.id
                      ? 'border-[#00FF85] bg-[#00FF85]/10 shadow-lg shadow-[#00FF85]/20'
                      : isConnectingBtc === wallet.id
                      ? 'border-[#00D4FF] bg-[#00D4FF]/10'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  }`}
                >
                  {isConnectingBtc === wallet.id && (
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-50"
                    />
                  )}
                  <div className="flex items-center gap-4 relative z-10">
                    <span className="text-4xl">{wallet.logo}</span>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-white">{wallet.name}</div>
                      {wallet.note && (
                        <div className="text-xs text-gray-400">{wallet.note}</div>
                      )}
                    </div>
                    {isConnectingBtc === wallet.id ? (
                      <Loader2 className="w-5 h-5 text-[#00D4FF] ml-auto animate-spin" />
                    ) : selectedBtc === wallet.id ? (
                      <CheckCircle className="w-5 h-5 text-[#00FF85] ml-auto" />
                    ) : null}
                  </div>
                </motion.button>
              ))}
            </div>
            
            {btcError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{btcError}</span>
              </motion.div>
            )}
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
              whileHover={!isConnectingIcp && !isConnectingBtc ? { scale: 1.02 } : {}}
              whileTap={!isConnectingIcp && !isConnectingBtc ? { scale: 0.98 } : {}}
              onClick={handleIcpConnect}
              disabled={isConnectingIcp || isConnectingBtc !== null}
              className={`w-full p-6 rounded-xl border-2 transition-all relative overflow-hidden ${
                isIcpAuthenticated
                  ? 'border-[#00FF85] bg-[#00FF85]/10 shadow-lg shadow-[#00FF85]/20'
                  : isConnectingIcp
                  ? 'border-[#00D4FF] bg-[#00D4FF]/10'
                  : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
              }`}
            >
              {isConnectingIcp && (
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-50"
                />
              )}
              <div className="text-center relative z-10">
                <div className="text-5xl mb-4">🔐</div>
                <div className="text-lg font-semibold text-white mb-2 flex items-center justify-center gap-2">
                  {isConnectingIcp ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : isIcpAuthenticated ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-[#00FF85]" />
                      Connected
                    </>
                  ) : (
                    'Connect Internet Identity'
                  )}
                </div>
                {isIcpAuthenticated && (
                  <div className="flex items-center justify-center gap-2 text-[#00FF85]">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Authenticated</span>
                  </div>
                )}
              </div>
            </motion.button>
            
            {icpError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{icpError}</span>
              </motion.div>
            )}

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
              {!selectedBtc && !isIcpAuthenticated
                ? '⚠️ Please connect both wallets to continue'
                : !selectedBtc
                ? '⚠️ Please select a Bitcoin wallet'
                : '⚠️ Please connect your Internet Identity'}
            </p>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: canContinue ? 1.05 : 1 }}
          whileTap={{ scale: canContinue ? 0.95 : 1 }}
          onClick={() => canContinue && navigate('/scan')}
          disabled={!canContinue}
          animate={{
            scale: canContinue ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 2,
            repeat: canContinue ? Infinity : 0,
            repeatType: 'reverse',
          }}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            canContinue
              ? 'bg-gradient-to-r from-[#00FF85] to-[#00D4FF] text-[#0B0E11] shadow-lg shadow-[#00FF85]/50 hover:shadow-xl'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canContinue ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Continue to Scan
              <ArrowRight className="w-5 h-5" />
            </>
          ) : (
            <>
              🔓 Please connect both wallets to continue
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
