import { HttpAgent } from '@dfinity/agent'
import { AuthClient } from '@dfinity/auth-client'
import { Principal } from '@dfinity/principal'

// Canister IDs (to be configured)
const VAULT_CANISTER_ID = 'rrkah-fqaaa-aaaaa-aaaaq-cai' // Example ID
const INDEXER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai' // Example ID

let authClient: AuthClient | null = null
let agent: HttpAgent | null = null

export async function initAuth() {
  authClient = await AuthClient.create()
  const isAuthenticated = await authClient.isAuthenticated()
  
  if (!isAuthenticated) {
    await authClient.login({
      identityProvider: 'https://identity.ic0.app',
      onSuccess: () => {
        console.log('Login successful')
      },
    })
  }
  
  agent = new HttpAgent({
    identity: authClient.getIdentity(),
  })
  
  // For local development - fetch root key if not on mainnet
  // This is safe to call even on mainnet, it just won't do anything
  try {
    await agent.fetchRootKey()
  } catch (e) {
    // Ignore errors - might be on mainnet
    console.log('Could not fetch root key (might be on mainnet)')
  }
  
  return agent
}

export async function getAgent(): Promise<HttpAgent> {
  if (!agent) {
    return await initAuth()
  }
  return agent
}

export function getPrincipal(): Principal | null {
  if (!authClient) return null
  return authClient.getIdentity().getPrincipal()
}

export function getVaultCanisterId(): string {
  return VAULT_CANISTER_ID
}

export function getIndexerCanisterId(): string {
  return INDEXER_CANISTER_ID
}

