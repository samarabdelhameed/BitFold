import { useState, useEffect } from 'react'
import { formatSatoshis } from '../utils/format'

interface UTXO {
  id: number
  txid: string
  amount: bigint
  status: string
}

function Withdraw() {
  const [utxos, setUtxos] = useState<UTXO[]>([])
  const [selectedUtxo, setSelectedUtxo] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // TODO: Fetch actual UTXOs from canister
    setUtxos([])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUtxo) return
    
    setLoading(true)
    
    // TODO: Implement actual withdraw call
    console.log('Withdrawing UTXO:', selectedUtxo)
    
    setTimeout(() => {
      setLoading(false)
      alert('Collateral withdrawn successfully!')
    }, 2000)
  }

  const withdrawableUtxos = utxos.filter(utxo => 
    utxo.status === 'Deposited' // Not locked in a loan
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Withdraw Collateral</h1>
      
      {withdrawableUtxos.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No withdrawable collateral. Make sure your loans are fully repaid.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select UTXO to Withdraw</label>
            <select
              value={selectedUtxo || ''}
              onChange={(e) => setSelectedUtxo(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg"
              required
            >
              <option value="">Select a UTXO</option>
              {withdrawableUtxos.map((utxo) => (
                <option key={utxo.id} value={utxo.id}>
                  {utxo.txid.slice(0, 16)}... - {formatSatoshis(Number(utxo.amount))}
                </option>
              ))}
            </select>
          </div>

          {selectedUtxo && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">You are about to withdraw:</p>
              <p className="text-lg font-bold text-blue-600">
                {formatSatoshis(Number(utxos.find(u => u.id === selectedUtxo)?.amount || 0))}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Make sure all loans using this collateral are fully repaid.
              </p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || !selectedUtxo}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Withdraw Collateral'}
          </button>
        </form>
      )}
    </div>
  )
}

export default Withdraw

