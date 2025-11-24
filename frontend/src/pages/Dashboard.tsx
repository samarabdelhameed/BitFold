import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Wallet, TrendingUp, Lock, Home, ArrowLeft } from 'lucide-react';
import { LoanChart } from '../components/LoanChart';
import { getUserLoans, getCollateral, getVaultStats, getUserStats } from '../services/vaultService';

export function Dashboard() {
  const navigate = useNavigate();
  const { loans, setLoans, isIcpAuthenticated } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch loans from backend on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!isIcpAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [backendLoans, collateral] = await Promise.all([
          getUserLoans(),
          getCollateral()
        ]);

        console.log(`📊 Dashboard: Fetched ${backendLoans.length} loan(s) from canister`);
        console.log('📋 Raw loans data:', backendLoans);

        // Convert backend loans to frontend format
        // Calculate remaining debt including interest (same as canister's calculate_loan_value)
        // Remove duplicates by loan ID to prevent showing the same loan twice
        const seenLoanIds = new Set<string>();
        const formattedLoans = backendLoans
          .filter(loan => {
            const loanId = loan.id.toString();
            if (seenLoanIds.has(loanId)) {
              console.warn(`⚠️ Duplicate loan detected: ${loanId}, skipping...`);
              return false;
            }
            seenLoanIds.add(loanId);
            return true;
          })
          .map(loan => {
            // Calculate interest: (borrowed_amount * interest_rate) / 10000
            const interest = (Number(loan.borrowed_amount) * Number(loan.interest_rate)) / 10000;
            // Total debt = borrowed + interest
            const totalDebt = Number(loan.borrowed_amount) + interest;
            // Remaining debt = total - repaid
            const remainingDebt = Math.max(0, totalDebt - Number(loan.repaid_amount));
            
            return {
              id: loan.id.toString(),
              utxo: `${loan.collateral_utxo_id}`,
              ordinal: {
                utxo: `${loan.collateral_utxo_id}`,
                inscriptionId: `${loan.collateral_utxo_id}...i0`,
                imageUrl: 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=400',
                satoshiValue: 100000000
              },
              borrowedAmount: Number(loan.borrowed_amount) / 100000000, // Convert sats to ckBTC
              remainingAmount: remainingDebt / 100000000, // Convert sats to ckBTC (includes interest)
              interestAmount: interest / 100000000, // Interest in ckBTC
              status: 'Active' in loan.status ? 'ACTIVE' : 'Repaid' in loan.status ? 'REPAID' : 'LIQUIDATED',
              ltv: 70, // Placeholder
              createdAt: new Date(Number(loan.created_at) / 1000000).toISOString()
            };
          });

        console.log(`✅ Loaded ${formattedLoans.length} unique loan(s) from canister:`, formattedLoans);
        setLoans(formattedLoans);
        setError('');
      } catch (err: any) {
        console.error('Failed to fetch loans:', err);
        setError(err.message || 'Failed to load loans');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isIcpAuthenticated, setLoans]);

  // Calculate totals from real loan data
  const totalBorrowed = loans.reduce((sum, loan) => sum + loan.borrowedAmount, 0);
  const totalRemaining = loans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
  const totalCollateral = loans.length;
  const activeLoans = loans.filter(l => l.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-[#0B0E11] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-[#00D4FF] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <Home className="w-6 h-6 text-[#00D4FF]" />
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          </motion.div>

          <div className="w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <Wallet className="w-8 h-8 text-[#FFC700]" />
              <div className="w-12 h-12 bg-[#FFC700]/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#FFC700]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {totalBorrowed.toFixed(4)}
            </div>
            <div className="text-sm text-gray-400">Total Borrowed (ckBTC)</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <Lock className="w-8 h-8 text-[#00D4FF]" />
              <div className="w-12 h-12 bg-[#00D4FF]/20 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-[#00D4FF]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {totalCollateral}
            </div>
            <div className="text-sm text-gray-400">Ordinals Locked</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">📊</span>
              <div className="w-12 h-12 bg-[#00FF85]/20 rounded-full flex items-center justify-center">
                <span className="text-[#00FF85] font-bold">{activeLoans}</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {activeLoans}
            </div>
            <div className="text-sm text-gray-400">Active Loans</div>
          </motion.div>
        </div>

        {loans.length > 0 && (
          <div className="mb-8">
            <LoanChart
              borrowedAmount={totalBorrowed}
              remainingAmount={totalRemaining}
            />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Your Loans</h2>

          {loading ? (
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-12 border border-gray-700/50 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-[#00D4FF] border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-gray-400">Loading your loans...</p>
            </div>
          ) : error ? (
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-12 border border-red-500/50 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-[#00D4FF] hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : loans.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-12 border border-gray-700/50 text-center">
              <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-6">No active loans yet</p>
              <button
                onClick={() => navigate('/scan')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00D4FF] to-[#00FF85] text-[#0B0E11] px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all"
              >
                Create Your First Loan
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {loans.map((loan, index) => (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                      <img
                        src={loan.ordinal.imageUrl}
                        alt="Ordinal"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-gray-400 text-sm mb-1">UTXO</div>
                        <div className="text-white font-mono text-sm">
                          {loan.utxo.substring(0, 8)}...
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm mb-1">Borrowed</div>
                        <div className="text-[#FFC700] font-bold">
                          {loan.borrowedAmount.toFixed(4)} ckBTC
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm mb-1">Remaining</div>
                        <div className="text-[#00FF85] font-bold">
                          {loan.remainingAmount.toFixed(4)} ckBTC
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm mb-1">Status</div>
                        <div className={`font-bold flex items-center gap-2 ${
                          loan.status === 'ACTIVE' ? 'text-[#00FF85]' :
                          loan.status === 'REPAID' ? 'text-[#00D4FF]' :
                          'text-red-400'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            loan.status === 'ACTIVE' ? 'bg-[#00FF85] animate-pulse' :
                            loan.status === 'REPAID' ? 'bg-[#00D4FF]' :
                            'bg-red-400'
                          }`} />
                          {loan.status}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {loan.status === 'ACTIVE' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(`/repay/${loan.id}`)}
                          className="px-6 py-2 bg-[#FFC700] text-[#0B0E11] rounded-lg font-bold hover:bg-[#FFC700]/80 transition-colors"
                        >
                          Repay
                        </motion.button>
                      )}
                      {loan.status === 'REPAID' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(`/withdraw/${loan.id}`)}
                          className="px-6 py-2 bg-[#00FF85] text-[#0B0E11] rounded-lg font-bold hover:bg-[#00FF85]/80 transition-colors"
                        >
                          Withdraw
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
