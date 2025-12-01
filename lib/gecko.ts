const GECKO_TERMINAL_API_BASE = "https://api.geckoterminal.com/api/v2/networks"

export interface GeckoTokenData {
  price_usd: string | null
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

