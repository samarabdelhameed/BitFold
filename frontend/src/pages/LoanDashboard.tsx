import { useEffect, useState } from 'react'
import LoanCard from '../components/LoanCard'
import { formatSatoshis } from '../utils/format'

interface Loan {
  id: number
  borrowed_amount: bigint
  repaid_amount: bigint
  interest_rate: number
  created_at: bigint
  status: string
}

interface UTXO {
  id: number
  txid: string
  amount: bigint
  status: string
  ordinal_info?: any
}

function LoanDashboard() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [collateral, setCollateral] = useState<UTXO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch actual data from canister
    // Mock data for now
    setLoans([])
    setCollateral([])
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Loan Dashboard</h1>
      
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Total Collateral</h2>
          <p className="text-3xl font-bold text-blue-600">
            {formatSatoshis(
              collateral.reduce((sum, utxo) => sum + Number(utxo.amount), 0)
            )}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Active Loans</h2>
          <p className="text-3xl font-bold text-green-600">{loans.length}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">My Loans</h2>
        {loans.length === 0 ? (
          <p className="text-gray-500">No loans yet. Start by depositing a UTXO and borrowing.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">My Collateral</h2>
        {collateral.length === 0 ? (
          <p className="text-gray-500">No collateral deposited yet.</p>
        ) : (
          <div className="space-y-4">
            {collateral.map((utxo) => (
              <div key={utxo.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-mono text-sm">{utxo.txid.slice(0, 16)}...</p>
                    <p className="text-gray-500">{formatSatoshis(Number(utxo.amount))}</p>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                    {utxo.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LoanDashboard

