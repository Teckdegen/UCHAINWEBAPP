// CoinGecko API for PEPU price
const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price"

// PEPU contract address on Ethereum mainnet
const PEPU_ETH_CONTRACT = "0x93aA0ccD1e5628d3A841C4DbdF602D9eb04085d6"

// Get price by contract address (most reliable method)
export async function getPepuPriceByContract(): Promise<number> {
  try {
    // Use the token_price endpoint for Ethereum tokens
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${PEPU_ETH_CONTRACT}&vs_currencies=usd`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status} - ${response.statusText}`)
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    const contractKey = PEPU_ETH_CONTRACT.toLowerCase()

    if (data[contractKey] && data[contractKey].usd) {
      console.log(`[CoinGecko] PEPU price fetched: $${data[contractKey].usd}`)
      return data[contractKey].usd
    }

    // If not found by contract, try by ID as fallback
    console.warn(`[CoinGecko] PEPU not found by contract address, trying by ID...`)
    return await getPepuPriceById()
  } catch (error) {
    console.error("Error fetching PEPU price by contract:", error)
    // Try fallback by ID
    try {
      return await getPepuPriceById()
    } catch (fallbackError) {
      console.error("Error fetching PEPU price by ID (fallback):", fallbackError)
      return 0
    }
  }
}

// Get price by token ID (fallback method)
export async function getPepuPriceById(): Promise<number> {
  try {
    // Try common PEPU token IDs
    const possibleIds = ["pepe-unchained", "pepeunchained", "pepu"]
    
    for (const id of possibleIds) {
      try {
        const response = await fetch(
          `${COINGECKO_API}?ids=${id}&vs_currencies=usd`,
          {
            headers: {
              Accept: "application/json",
            },
          },
        )

        if (!response.ok) continue

        const data = await response.json()
        if (data[id] && data[id].usd) {
          return data[id].usd
        }
      } catch {
        continue
      }
    }

    return 0
  } catch (error) {
    console.error("Error fetching PEPU price by ID:", error)
    return 0
  }
}

// Main function to get PEPU price (tries both methods)
export async function fetchPepuPrice(): Promise<number> {
  // Try by contract first (more reliable)
  const priceByContract = await getPepuPriceByContract()
  if (priceByContract > 0) {
    return priceByContract
  }

  // Fallback to ID-based lookup
  const priceById = await getPepuPriceById()
  if (priceById > 0) {
    return priceById
  }

  // If both fail, return 0 (will show as $0.00 in portfolio)
  console.warn("Could not fetch PEPU price from CoinGecko")
  return 0
}

// Get ETH price from CoinGecko
export async function fetchEthPrice(): Promise<number> {
  try {
    const response = await fetch(
      `${COINGECKO_API}?ids=ethereum&vs_currencies=usd`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.ethereum && data.ethereum.usd) {
      return data.ethereum.usd
    }

    return 0
  } catch (error) {
    console.error("Error fetching ETH price from CoinGecko:", error)
    return 0
  }
}

