import { HttpAgent, Actor } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';

// Canister IDs - Use environment variable or fallback to local
const VAULT_CANISTER_ID = import.meta.env.VITE_VAULT_CANISTER_ID || 'bkyz2-fmaaa-aaaaa-qaaaq-cai';

// Determine host based on environment
const HOST = import.meta.env.VITE_DFX_NETWORK === 'ic' 
  ? 'https://ic0.app' 
  : 'http://127.0.0.1:4943';

let agent: HttpAgent | null = null;
let authClient: AuthClient | null = null;
let identity: any = null;

/**
 * Initialize the ICP agent
 */
export async function initAgent(requireAuth: boolean = false): Promise<HttpAgent> {
  const isLocal = import.meta.env.VITE_DFX_NETWORK !== 'ic';
  
  // Always create/refresh auth client to get latest identity
  if (!authClient) {
    authClient = await AuthClient.create();
  }
  
  // Get current identity (may be anonymous if not authenticated)
  identity = authClient.getIdentity();
  
  // Check if authenticated
  const authenticated = await authClient.isAuthenticated();
  
  if (!authenticated) {
    if (isLocal && !requireAuth) {
      // For local development, use anonymous identity for queries
      console.log('ℹ️ Using anonymous identity for local development (queries only)');
      const { AnonymousIdentity } = await import('@dfinity/agent');
      identity = new AnonymousIdentity();
    } else {
      // For production or when auth is required, throw error
      console.warn('⚠️ Not authenticated. Please connect Internet Identity first.');
      throw new Error('Not authenticated. Please connect Internet Identity first.');
    }
  }
  
  // If agent exists and authenticated, return it (unless identity changed)
  if (agent && authenticated) {
    return agent;
  }

  // Create new agent with current identity
  agent = new HttpAgent({
    host: HOST,
    identity,
    verifyQuerySignatures: false, // Disable query signature verification for local dev
  });
  
  // For local development, disable all signature verification
  if (isLocal) {
    (agent as any)._verifyQuerySignatures = false;
    // Disable certificate verification for local replica
    (agent as any).rootKey = null;
  }

  // Fetch root key for local development
  if (isLocal) {
    try {
      await agent.fetchRootKey();
      console.log('✅ Root key fetched successfully');
    } catch (err) {
      console.warn('⚠️ Unable to fetch root key. Check if the local replica is running');
      console.warn('💡 Run: dfx start --background');
      console.error(err);
    }
  }

  return agent;
}

/**
 * Get the current agent
 */
export function getAgent(): HttpAgent {
  if (!agent) {
    throw new Error('Agent not initialized. Call initAgent() first.');
  }
  return agent;
}

/**
 * Get the current identity
 */
export function getIdentity() {
  return identity;
}

/**
 * Get the current principal
 */
export function getPrincipal(): Principal | null {
  if (!identity) return null;
  return identity.getPrincipal();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  if (!authClient) {
    authClient = await AuthClient.create();
  }
  return await authClient.isAuthenticated();
}

/**
 * Login with Internet Identity
 */
export async function login(): Promise<void> {
  // IMPORTANT: Clear old auth client to remove stale mainnet II credentials
  if (authClient) {
    await authClient.logout();
    authClient = null;
  }
  
  // Create fresh auth client
  authClient = await AuthClient.create();

  return new Promise((resolve, reject) => {
    let identityProvider: string;
    
    if (import.meta.env.VITE_DFX_NETWORK === 'ic') {
      // Production: use mainnet Internet Identity
      identityProvider = 'https://identity.ic0.app';
    } else {
      // Local development: MUST use local Internet Identity
      // Using mainnet II with local replica causes signature verification failures
      const localCanisterId = import.meta.env.VITE_INTERNET_IDENTITY_CANISTER_ID || 'bw4dl-smaaa-aaaaa-qaacq-cai';
      
      identityProvider = `http://${localCanisterId}.localhost:4943`;
      console.log(`ℹ️ Using local Internet Identity: ${identityProvider}`);
      console.log('💡 If this fails, make sure Internet Identity is deployed locally:');
      console.log('   dfx deploy internet_identity');
    }
    
    authClient!.login({
      identityProvider,
      onSuccess: async () => {
        try {
          identity = authClient!.getIdentity();
          // Reset agent to force reinitialization with new identity
          agent = null;
          // Reinitialize agent with new identity
          await initAgent();
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      onError: (error: any) => {
        // Handle user cancellation gracefully
        const errorName = error?.name || error?.toString() || '';
        const errorMessage = error?.message || error?.toString() || '';
        
        if (
          errorName === 'UserInterrupt' || 
          errorName === 'UserCancelled' ||
          errorMessage.includes('UserInterrupt') || 
          errorMessage.includes('User cancelled') ||
          errorMessage.includes('UserCancelled')
        ) {
          const cancelError = new Error('User cancelled Internet Identity connection');
          cancelError.name = 'UserCancelled';
          console.log('ℹ️ User cancelled Internet Identity connection');
          reject(cancelError);
        } else {
          console.error('Internet Identity login error:', error);
          reject(error);
        }
      },
    });
  });
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  if (!authClient) return;
  await authClient.logout();
  identity = null;
  agent = null;
}

/**
 * Clear all stored authentication data
 * Use this to fix authentication issues with stale credentials
 */
export async function clearAuth(): Promise<void> {
  console.log('🧹 Clearing all authentication data...');
  
  // Logout if auth client exists
  if (authClient) {
    await authClient.logout();
  }
  
  // Clear all state
  authClient = null;
  identity = null;
  agent = null;
  
  // Clear IndexedDB storage used by auth-client
  try {
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name?.includes('ic-') || db.name?.includes('auth')) {
        console.log(`🗑️ Deleting database: ${db.name}`);
        indexedDB.deleteDatabase(db.name);
      }
    }
  } catch (err) {
    console.warn('Could not clear IndexedDB:', err);
  }
  
  // Clear localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.includes('ic-') || key.includes('identity') || key.includes('delegation')) {
      console.log(`🗑️ Removing localStorage key: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  console.log('✅ Authentication data cleared. Please refresh and reconnect.');
}

/**
 * Create an actor for a canister
 */
export function createActor<T>(canisterId: string, idlFactory: any): T {
  const currentAgent = getAgent();
  return Actor.createActor<T>(idlFactory, {
    agent: currentAgent,
    canisterId,
  });
}

/**
 * Get vault canister ID
 */
export function getVaultCanisterId(): string {
  // Try to get from environment or use local canister ID
  const canisterId = import.meta.env.VITE_VAULT_CANISTER_ID || 
                     import.meta.env.CANISTER_ID_VAULT ||
                     VAULT_CANISTER_ID;
  
  if (!canisterId) {
    console.warn('⚠️ Vault canister ID not found. Make sure the canister is deployed.');
    throw new Error('Vault canister ID not configured. Please deploy the canister first.');
  }
  
  return canisterId;
}
