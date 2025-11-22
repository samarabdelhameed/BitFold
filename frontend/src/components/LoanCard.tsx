import { formatSatoshis, formatDate, formatLoanStatus } from '../utils/format'

interface Loan {
  id: number
  borrowed_amount: bigint
  repaid_amount: bigint
  interest_rate: number
  created_at: bigint
  status: string
}

interface LoanCardProps {
  loan: Loan
}

function LoanCard({ loan }: LoanCardProps) {
  const remaining = Number(loan.borrowed_amount) - Number(loan.repaid_amount)
  const progress = Number(loan.repaid_amount) / Number(loan.borrowed_amount) * 100

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">Loan #{loan.id}</h3>
          <p className="text-sm text-gray-500">{formatDate(loan.created_at)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          loan.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {formatLoanStatus(loan.status)}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Borrowed:</span>
          <span className="font-semibold">{formatSatoshis(Number(loan.borrowed_amount))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Repaid:</span>
          <span className="font-semibold">{formatSatoshis(Number(loan.repaid_amount))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Remaining:</span>
          <span className="font-semibold text-red-600">{formatSatoshis(remaining)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Interest Rate:</span>
          <span className="font-semibold">{(loan.interest_rate / 100).toFixed(2)}%</span>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {progress.toFixed(1)}% repaid
        </p>
      </div>
    </div>
  )
}

export default LoanCard

