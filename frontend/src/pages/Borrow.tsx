import { useState, useEffect } from 'react'
import { formatSatoshis } from '../utils/format'

interface UTXO {
  id: number
  txid: string
  amount: bigint
  status: string
}

function Borrow() {
  const [utxos, setUtxos] = useState<UTXO[]>([])
  const [selectedUtxo, setSelectedUtxo] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // TODO: Fetch actual UTXOs from canister
    setUtxos([])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUtxo) return
    
    setLoading(true)
    
    // TODO: Implement actual borrow call
    console.log('Borrowing:', { utxo_id: selectedUtxo, amount })
    
    setTimeout(() => {
      setLoading(false)
      alert('Loan created successfully!')
    }, 2000)
  }

  const availableUtxos = utxos.filter(utxo => utxo.status === 'Deposited')
  const maxBorrowable = selectedUtxo 
    ? Number(utxos.find(u => u.id === selectedUtxo)?.amount || 0) * 0.5
    : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Borrow ckBTC</h1>
      
      {availableUtxos.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No available collateral. Please deposit a UTXO first.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Collateral</label>
            <select
              value={selectedUtxo || ''}
              onChange={(e) => setSelectedUtxo(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg"
              required
            >
              <option value="">Select a UTXO</option>
              {availableUtxos.map((utxo) => (
                <option key={utxo.id} value={utxo.id}>
                  {utxo.txid.slice(0, 16)}... - {formatSatoshis(Number(utxo.amount))}
                </option>
              ))}
            </select>
          </div>

          {selectedUtxo && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Maximum borrowable (50% LTV):</p>
              <p className="text-lg font-bold text-blue-600">
                {formatSatoshis(maxBorrowable)}
              </p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Amount to Borrow (satoshis)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="0"
              max={maxBorrowable}
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
            disabled={loading || !selectedUtxo}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Borrow ckBTC'}
          </button>
        </form>
      )}
    </div>
  )
}

export default Borrow

