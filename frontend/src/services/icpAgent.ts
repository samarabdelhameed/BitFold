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
export async function initAgent(): Promise<HttpAgent> {
  if (agent) return agent;

  // Create auth client
  authClient = await AuthClient.create();
  identity = authClient.getIdentity();

  // Create agent with proper configuration for local development
  agent = new HttpAgent({
    host: HOST,
    identity,
    verifyQuerySignatures: false, // Disable query signature verification for local dev
  });
  
  // For local development, we need to handle certificate verification differently
  if (import.meta.env.VITE_DFX_NETWORK !== 'ic') {
    // Disable certificate verification for local replica (development only)
    (agent as any)._verifyQuerySignatures = false;
  }

  // Fetch root key for local development
  if (import.meta.env.VITE_DFX_NETWORK !== 'ic') {
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
  if (!authClient) {
    authClient = await AuthClient.create();
  }

  return new Promise((resolve, reject) => {
    // For local development, use mainnet Internet Identity (easier setup)
    // If you have local II canister, set VITE_INTERNET_IDENTITY_CANISTER_ID
    let identityProvider: string;
    
    if (import.meta.env.VITE_DFX_NETWORK === 'ic') {
      // Production: use mainnet Internet Identity
      identityProvider = 'https://identity.ic0.app';
    } else {
      // Local development: use mainnet Internet Identity by default
      // This works because II is public and can authenticate for local canisters
      const localCanisterId = import.meta.env.VITE_INTERNET_IDENTITY_CANISTER_ID;
      
      if (localCanisterId) {
        // If local canister ID is provided, use it
        identityProvider = `http://127.0.0.1:4943/?canisterId=${localCanisterId}`;
        console.log(`ℹ️ Using local Internet Identity: ${localCanisterId}`);
      } else {
        // Default: use mainnet Internet Identity (works for local dev)
        identityProvider = 'https://identity.ic0.app';
        console.log('ℹ️ Using mainnet Internet Identity for local development');
      }
    }
    
    authClient!.login({
      identityProvider,
      onSuccess: async () => {
        try {
          identity = authClient!.getIdentity();
          // Reinitialize agent with new identity
          agent = new HttpAgent({
            host: HOST,
            identity,
          });
          if (import.meta.env.VITE_DFX_NETWORK !== 'ic') {
            await agent.fetchRootKey();
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      onError: (error) => {
        // Handle user cancellation gracefully
        if (error.name === 'UserInterrupt' || error.message?.includes('UserInterrupt')) {
          const cancelError = new Error('User cancelled Internet Identity connection');
          cancelError.name = 'UserCancelled';
          reject(cancelError);
        } else {
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
