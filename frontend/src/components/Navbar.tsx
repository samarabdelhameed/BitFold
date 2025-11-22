import { Link } from 'react-router-dom'
import { getPrincipal } from '../utils/agent'

function Navbar() {
  const principal = getPrincipal()
  
  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          BitFold
        </Link>
        <div className="flex gap-4">
          <Link to="/" className="hover:text-gray-300">Home</Link>
          <Link to="/deposit" className="hover:text-gray-300">Deposit</Link>
          <Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link>
          <Link to="/borrow" className="hover:text-gray-300">Borrow</Link>
          {principal ? (
            <span className="text-gray-400">
              {principal.toString().slice(0, 8)}...
            </span>
          ) : (
            <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

