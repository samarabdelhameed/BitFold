import { HttpAgent, Actor } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';

// Canister IDs
const VAULT_CANISTER_ID = 'bkyz2-fmaaa-aaaaa-qaaaq-cai';

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

  // Create agent
  agent = new HttpAgent({
    host: HOST,
    identity,
  });

  // Fetch root key for local development
  if (import.meta.env.VITE_DFX_NETWORK !== 'ic') {
    await agent.fetchRootKey().catch(err => {
      console.warn('Unable to fetch root key. Check if the local replica is running');
      console.error(err);
    });
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
    authClient!.login({
      identityProvider: import.meta.env.VITE_DFX_NETWORK === 'ic'
        ? 'https://identity.ic0.app'
        : `http://127.0.0.1:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`,
      onSuccess: async () => {
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
      },
      onError: reject,
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
  return VAULT_CANISTER_ID;
}
