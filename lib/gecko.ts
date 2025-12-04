const GECKO_TERMINAL_API_BASE = "https://api.geckoterminal.com/api/v2/networks"

export interface GeckoTokenData {
  price_usd: string | null
  fdv_usd: string | null
  market_cap_usd: string | null
  volume_usd: {
    h24: string | null
  } | null
  image_url: string | null
  name?: string | null
  symbol?: string | null
  decimals?: number | null
}

export interface GeckoTokenFullData {
  address: string
  symbol: string
  name: string
  decimals: number
  price_usd: number | null
  fdv_usd: string | null
  market_cap_usd: string | null
  volume_usd: {
    h24: string | null
  } | null
  image_url: string | null
}

export async function fetchGeckoTerminalData(
  tokenAddress: string,
  network: "pepe-unchained" | "ethereum" = "pepe-unchained",
): Promise<GeckoTokenData | null> {
  try {
    const response = await fetch(`${GECKO_TERMINAL_API_BASE}/${network}/tokens/${tokenAddress}`)
    const data = await response.json()

    if (data.data && data.data.attributes) {
      return data.data.attributes
    }
    return null
  } catch (error) {
    console.error(`Could not fetch GeckoTerminal data for ${network}:`, error)
    return null
  }
}

// Fetch full token details from GeckoTerminal (for ETH tokens)
export async function fetchGeckoTerminalTokenDetails(
  tokenAddress: string,
  network: "ethereum" = "ethereum",
): Promise<GeckoTokenFullData | null> {
  try {
    const response = await fetch(`${GECKO_TERMINAL_API_BASE}/${network}/tokens/${tokenAddress}`)
    const data = await response.json()

    if (data.data && data.data.attributes) {
      const attrs = data.data.attributes
      return {
        address: tokenAddress.toLowerCase(),
        symbol: attrs.symbol || attrs.name?.split(" ")[0] || "???",
        name: attrs.name || "Unknown Token",
        decimals: attrs.decimals || 18,
        price_usd: attrs.price_usd ? parseFloat(attrs.price_usd) : null,
        fdv_usd: attrs.fdv_usd,
        market_cap_usd: attrs.market_cap_usd,
        volume_usd: attrs.volume_usd,
        image_url: attrs.image_url,
      }
    }
    return null
  } catch (error) {
    console.error(`Could not fetch GeckoTerminal token details for ${network}:`, error)
    return null
  }
}

