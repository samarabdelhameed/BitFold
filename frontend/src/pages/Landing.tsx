import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4">BitFold</h1>
          <p className="text-2xl text-gray-300 mb-8">
            Lend Bitcoin, Borrow ckBTC
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
            Use your Bitcoin UTXOs and Ordinals NFTs as collateral to borrow ckBTC 
            on the Internet Computer. Secure, decentralized, and transparent.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              to="/deposit" 
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg text-lg font-semibold transition"
            >
              Get Started
            </Link>
            <Link 
              to="/dashboard" 
              className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-lg text-lg font-semibold transition"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-2xl font-bold mb-4">Deposit</h3>
            <p className="text-gray-300">
              Deposit your Bitcoin UTXOs or Ordinals NFTs as collateral
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-2xl font-bold mb-4">Borrow</h3>
            <p className="text-gray-300">
              Borrow ckBTC against your collateral with competitive rates
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-2xl font-bold mb-4">Repay & Withdraw</h3>
            <p className="text-gray-300">
              Repay your loan and withdraw your collateral anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing

