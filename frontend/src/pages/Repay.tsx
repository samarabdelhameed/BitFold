import { useState, useEffect } from 'react'
import { formatSatoshis } from '../utils/format'

interface Loan {
  id: number
  borrowed_amount: bigint
  repaid_amount: bigint
  status: string
}

function Repay() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [selectedLoan, setSelectedLoan] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // TODO: Fetch actual loans from canister
    setLoans([])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLoan) return
    
    setLoading(true)
    
    // TODO: Implement actual repay call
    console.log('Repaying:', { loan_id: selectedLoan, amount })
    
    setTimeout(() => {
      setLoading(false)
      alert('Repayment successful!')
    }, 2000)
  }

  const activeLoans = loans.filter(loan => loan.status === 'Active')
  const selectedLoanData = loans.find(l => l.id === selectedLoan)
  const remainingDebt = selectedLoanData
    ? Number(selectedLoanData.borrowed_amount) - Number(selectedLoanData.repaid_amount)
    : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Repay Loan</h1>
      
      {activeLoans.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No active loans to repay.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Loan</label>
            <select
              value={selectedLoan || ''}
              onChange={(e) => setSelectedLoan(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg"
              required
            >
              <option value="">Select a loan</option>
              {activeLoans.map((loan) => (
                <option key={loan.id} value={loan.id}>
                  Loan #{loan.id} - Remaining: {formatSatoshis(
                    Number(loan.borrowed_amount) - Number(loan.repaid_amount)
                  )}
                </option>
              ))}
            </select>
          </div>

          {selectedLoanData && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Borrowed:</span>
                <span className="font-semibold">{formatSatoshis(Number(selectedLoanData.borrowed_amount))}</span>
              </div>
              <div className="flex justify-between">
                <span>Repaid:</span>
                <span className="font-semibold">{formatSatoshis(Number(selectedLoanData.repaid_amount))}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Remaining:</span>
                <span className="font-semibold text-red-600">{formatSatoshis(remainingDebt)}</span>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Repayment Amount (satoshis)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="0"
              max={remainingDebt}
              required
            />
            {amount && (
              <p className="text-sm text-gray-500 mt-1">
                = {formatSatoshis(Number(amount))}
              </p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading || !selectedLoan}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Repay Loan'}
          </button>
        </form>
      )}
    </div>
  )
}

export default Repay

