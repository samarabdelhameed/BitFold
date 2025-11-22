import { useState } from 'react'
import { formatSatoshis } from '../utils/format'

function DepositUTXO() {
  const [txid, setTxid] = useState('')
  const [vout, setVout] = useState('')
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // TODO: Implement actual deposit call
    console.log('Depositing UTXO:', { txid, vout, amount, address })
    
    setTimeout(() => {
      setLoading(false)
      alert('UTXO deposited successfully!')
    }, 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Deposit Bitcoin UTXO</h1>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Transaction ID</label>
          <input
            type="text"
            value={txid}
            onChange={(e) => setTxid(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Enter Bitcoin transaction ID"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Output Index (vout)</label>
          <input
            type="number"
            value={vout}
            onChange={(e) => setVout(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="0"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Amount (satoshis)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="100000000"
            required
          />
          {amount && (
            <p className="text-sm text-gray-500 mt-1">
              = {formatSatoshis(Number(amount))}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Bitcoin Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="bc1..."
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Deposit UTXO'}
        </button>
      </form>
    </div>
  )
}

export default DepositUTXO

