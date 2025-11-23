import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initAgent, isAuthenticated, login, logout, getPrincipal } from '../services/icpAgent';
import { resetVaultActor } from '../services/vaultService';

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
  // ICP Integration
  isIcpAuthenticated: boolean;
  icpLogin: () => Promise<void>;
  icpLogout: () => Promise<void>;
  icpPrincipal: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [principal, setPrincipal] = useState<string | null>(null);
  const [btcAddress, setBtcAddress] = useState<string | null>(null);
  const [currentOrdinal, setCurrentOrdinal] = useState<Ordinal | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  
  // ICP state
  const [isIcpAuthenticated, setIsIcpAuthenticated] = useState(false);
  const [icpPrincipal, setIcpPrincipal] = useState<string | null>(null);

  // Initialize ICP agent on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initAgent();
        const authenticated = await isAuthenticated();
        setIsIcpAuthenticated(authenticated);
        
        if (authenticated) {
          const principal = getPrincipal();
          if (principal) {
            setIcpPrincipal(principal.toString());
          }
        }
      } catch (error) {
        console.error('Failed to initialize ICP agent:', error);
      }
    };
    
    init();
  }, []);

  const addLoan = (loan: Loan) => {
    setLoans(prev => [...prev, loan]);
  };

  const updateLoan = (id: string, updates: Partial<Loan>) => {
    setLoans(prev => prev.map(loan =>
      loan.id === id ? { ...loan, ...updates } : loan
    ));
  };

  // ICP authentication functions
  const icpLogin = async () => {
    try {
      await login();
      setIsIcpAuthenticated(true);
      const principal = getPrincipal();
      if (principal) {
        setIcpPrincipal(principal.toString());
      }
      resetVaultActor(); // Reset actor with new identity
    } catch (error) {
      console.error('ICP login failed:', error);
      throw error;
    }
  };

  const icpLogout = async () => {
    try {
      await logout();
      setIsIcpAuthenticated(false);
      setIcpPrincipal(null);
      resetVaultActor(); // Reset actor
    } catch (error) {
      console.error('ICP logout failed:', error);
      throw error;
    }
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
      updateLoan,
      isIcpAuthenticated,
      icpLogin,
      icpLogout,
      icpPrincipal
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
