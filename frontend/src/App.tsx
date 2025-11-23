import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { HomePage } from './pages/HomePage';
import { ConnectWallet } from './pages/ConnectWallet';
import { ScanOrdinal } from './pages/ScanOrdinal';
import { OrdinalPreview } from './pages/OrdinalPreview';
import { LoanOffer } from './pages/LoanOffer';
import { BorrowSuccess } from './pages/BorrowSuccess';
import { Dashboard } from './pages/Dashboard';
import { Repay } from './pages/Repay';
import { Withdraw } from './pages/Withdraw';
import { Congrats } from './pages/Congrats';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/connect" element={<ConnectWallet />} />
          <Route path="/scan" element={<ScanOrdinal />} />
          <Route path="/preview" element={<OrdinalPreview />} />
          <Route path="/offer" element={<LoanOffer />} />
          <Route path="/borrow-success" element={<BorrowSuccess />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/repay/:loanId" element={<Repay />} />
          <Route path="/withdraw/:loanId" element={<Withdraw />} />
          <Route path="/congrats" element={<Congrats />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
