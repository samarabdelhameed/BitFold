/**
 * Formats satoshis to BTC
 */
export function formatBTC(satoshis: number): string {
  return (satoshis / 100_000_000).toFixed(8)
}

/**
 * Formats satoshis to readable format
 */
export function formatSatoshis(satoshis: number): string {
  if (satoshis >= 100_000_000) {
    return `${formatBTC(satoshis)} BTC`
  }
  return `${satoshis.toLocaleString()} sats`
}

/**
 * Formats timestamp to readable date
 */
export function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1_000_000) // Convert nanoseconds to milliseconds
  return date.toLocaleString()
}

/**
 * Truncates address for display
 */
export function truncateAddress(address: string, start: number = 6, end: number = 4): string {
  if (address.length <= start + end) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

/**
 * Formats loan status
 */
export function formatLoanStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

