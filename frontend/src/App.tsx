import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import DepositUTXO from './pages/DepositUTXO'
import LoanDashboard from './pages/LoanDashboard'
import Borrow from './pages/Borrow'
import Repay from './pages/Repay'
import Withdraw from './pages/Withdraw'

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/deposit" element={<DepositUTXO />} />
            <Route path="/dashboard" element={<LoanDashboard />} />
            <Route path="/borrow" element={<Borrow />} />
            <Route path="/repay" element={<Repay />} />
            <Route path="/withdraw" element={<Withdraw />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App

