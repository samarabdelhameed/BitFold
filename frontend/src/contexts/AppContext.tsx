import { createContext, useContext, useState, ReactNode } from 'react';

interface Ordinal {
  utxo: string;
  inscriptionId: string;
  imageUrl: string;
  satoshiValue: number;
}

interface Loan {
  id: string;
  utxo: string;
  ordinal: Ordinal;
  borrowedAmount: number;
  remainingAmount: number;
  status: 'ACTIVE' | 'REPAID' | 'LIQUIDATED';
  ltv: number;
  createdAt: string;
}

interface AppContextType {
  principal: string | null;
  setPrincipal: (principal: string) => void;
  btcAddress: string | null;
  setBtcAddress: (address: string) => void;
  currentOrdinal: Ordinal | null;
  setCurrentOrdinal: (ordinal: Ordinal | null) => void;
  loans: Loan[];
  setLoans: (loans: Loan[]) => void;
  addLoan: (loan: Loan) => void;
  updateLoan: (id: string, updates: Partial<Loan>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [principal, setPrincipal] = useState<string | null>(null);
  const [btcAddress, setBtcAddress] = useState<string | null>(null);
  const [currentOrdinal, setCurrentOrdinal] = useState<Ordinal | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);

  const addLoan = (loan: Loan) => {
    setLoans(prev => [...prev, loan]);
  };

  const updateLoan = (id: string, updates: Partial<Loan>) => {
    setLoans(prev => prev.map(loan =>
      loan.id === id ? { ...loan, ...updates } : loan
    ));
  };

  return (
    <AppContext.Provider value={{
      principal,
      setPrincipal,
      btcAddress,
      setBtcAddress,
      currentOrdinal,
      setCurrentOrdinal,
      loans,
      setLoans,
      addLoan,
      updateLoan
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
