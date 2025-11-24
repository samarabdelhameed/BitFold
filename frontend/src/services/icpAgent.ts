import { HttpAgent, Actor } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';

// Canister IDs - Use environment variable or fallback to local
const VAULT_CANISTER_ID = import.meta.env.VITE_VAULT_CANISTER_ID || 'br5f7-7uaaa-aaaaa-qaaca-cai';

// Determine host based on environment
const HOST = import.meta.env.VITE_DFX_NETWORK === 'ic' 
  ? 'https://ic0.app' 
  : import.meta.env.VITE_DFX_NETWORK === 'playground'
  ? 'https://icp0.io'
  : 'http://127.0.0.1:4943';

let agent: HttpAgent | null = null;
let authClient: AuthClient | null = null;
let identity: any = null;

/**
 * Initialize the ICP agent
 */
export async function initAgent(requireAuth: boolean = false): Promise<HttpAgent> {
  const network = import.meta.env.VITE_DFX_NETWORK;
  const isLocal = network !== 'ic' && network !== 'playground';
  
  // Always create/refresh auth client to get latest identity
  if (!authClient) {
    authClient = await AuthClient.create();
  }
  
  // Get fresh identity from auth client (important for expired delegations)
  identity = authClient.getIdentity();
  
  // Check if authenticated
  const authenticated = await authClient.isAuthenticated();
  
  if (!authenticated) {
    if (isLocal && !requireAuth) {
      // For local development, use anonymous identity for queries
      console.log('ℹ️ Using anonymous identity for local development (queries only)');
      const { AnonymousIdentity } = await import('@dfinity/agent');
      identity = new AnonymousIdentity();
    } else if (!requireAuth) {
      // For playground/production queries without auth, use anonymous identity
      console.log('ℹ️ Using anonymous identity for queries');
      const { AnonymousIdentity } = await import('@dfinity/agent');
      identity = new AnonymousIdentity();
    } else {
      // For production or when auth is required, throw error
      console.warn('⚠️ Not authenticated. Please connect Internet Identity first.');
      throw new Error('Not authenticated. Please connect Internet Identity first.');
    }
  }
  
  // Always recreate agent when requireAuth is true to ensure fresh identity/delegation
  // This fixes stale delegation issues
  if (requireAuth && authenticated) {
    agent = null; // Force recreation
  }
  
  // Always recreate agent for local development to ensure fresh root key
  if (isLocal) {
    agent = null;
  }
  
  // If agent exists and we don't need to recreate it, return it
  if (agent && !requireAuth && !isLocal) {
    return agent;
  }

  // Create new agent with current identity
  agent = new HttpAgent({
    host: HOST,
    identity,
  });
  
  // Fetch root key for local development BEFORE any other operations
  // This is CRITICAL for local development to avoid certificate verification errors
  // MUST be called before any canister calls
  if (isLocal) {
    try {
      await agent.fetchRootKey();
      console.log('✅ Root key fetched successfully for local development');
      
      // Small delay to ensure root key is properly set
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      console.warn('⚠️ Unable to fetch root key. Check if the local replica is running');
      console.warn('💡 Run: dfx start --background');
      console.error(err);
      throw new Error('Failed to fetch root key. Please ensure dfx is running.');
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
    const network = import.meta.env.VITE_DFX_NETWORK;
    
    if (network === 'ic' || network === 'playground') {
      // Production/Playground: use mainnet Internet Identity
      identityProvider = 'https://identity.ic0.app';
      console.log(`ℹ️ Using mainnet Internet Identity for ${network} network`);
    } else if (network === 'local') {
      // Local development: MUST use local Internet Identity
      // Using mainnet II with local replica causes signature verification failures
      
      // Try to get canister ID from environment variable first
      // Vite only exposes variables prefixed with VITE_ to the client
      let localCanisterId = import.meta.env.VITE_INTERNET_IDENTITY_CANISTER_ID || 
                            import.meta.env.CANISTER_ID_INTERNET_IDENTITY;
      
      // If not in env, try to get from localStorage or use fallback
      if (!localCanisterId) {
        // Try to get from localStorage (if set by initialization script)
        try {
          const storedId = localStorage.getItem('internet_identity_canister_id');
          if (storedId) {
            localCanisterId = storedId;
            console.log('📋 Found Internet Identity Canister ID in localStorage');
          }
        } catch (e) {
          // Ignore localStorage errors
        }
        
        // If still not found, use the current deployed canister ID
        // This should match what dfx deploy internet_identity creates
        if (!localCanisterId) {
          // Use the actual canister ID from dfx (this should be set in .env with VITE_ prefix)
          localCanisterId = 'be2us-64aaa-aaaaa-qaabq-cai'; // Default local II canister ID
          console.warn('⚠️ Internet Identity Canister ID not found in environment variables.');
          console.warn('💡 Using fallback ID. To fix, add to .env file:');
          console.warn('   VITE_INTERNET_IDENTITY_CANISTER_ID=be2us-64aaa-aaaaa-qaabq-cai');
          console.warn('   Then restart the dev server.');
        }
      }
      
      // For local development, use the deployed local Internet Identity
      const localIICanisterId = localCanisterId || 'br5f7-7uaaa-aaaaa-qaaca-cai';
      identityProvider = `http://${localIICanisterId}.localhost:4943`;
      console.log(`ℹ️ Using local Internet Identity: ${identityProvider}`);
      console.log(`📋 Canister ID: ${localIICanisterId}`);
    }
    
    authClient!.login({
      identityProvider,
      onSuccess: async () => {
        try {
          // Get fresh identity after login
          identity = authClient!.getIdentity();
          // Reset agent to force reinitialization with new identity
          agent = null;
          // Reinitialize agent with new identity (requireAuth = true to get fresh delegation)
          await initAgent(true);
          console.log('✅ Authentication successful, agent reinitialized');
          resolve();
        } catch (error) {
          console.error('❌ Error reinitializing agent after login:', error);
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
