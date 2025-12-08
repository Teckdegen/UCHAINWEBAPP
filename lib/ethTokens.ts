import { ethers } from "ethers"
import { getProvider } from "./rpc"
import { getEtherscanTokenBalance } from "./etherscan"
import { fetchGeckoTerminalData } from "./gecko"
import { PEPU_TOKEN_ADDRESS_ETH } from "./config"

// ERC20 ABI for token operations
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
]

// Popular tokens to check via RPC (matching bot code)
const KNOWN_TOKENS = [
  // Stablecoins
  { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", name: "Tether USD" },
  { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin" },
  { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", name: "Dai Stablecoin" },
  { address: "0x4Fabb145d64652a948d72533023f6E7A623C7C53", symbol: "BUSD", name: "Binance USD" },
  { address: "0x8E870D67F660D95d5be530380D0eC0bd388289E1", symbol: "USDP", name: "Pax Dollar" },
  { address: "0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd", symbol: "GUSD", name: "Gemini Dollar" },
  { address: "0x853d955aCEf822Db058eb8505911ED77F175b99e", symbol: "FRAX", name: "Frax" },
  { address: "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0", symbol: "LUSD", name: "Liquity USD" },

  // DeFi Tokens
  { address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", symbol: "UNI", name: "Uniswap" },
  { address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", symbol: "LINK", name: "ChainLink Token" },
  { address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", symbol: "AAVE", name: "Aave Token" },
  { address: "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F", symbol: "SNX", name: "Synthetix Network Token" },
  { address: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2", symbol: "MKR", name: "Maker" },
  { address: "0xc00e94Cb662C3520282E6f5717214004A7f26888", symbol: "COMP", name: "Compound" },
  { address: "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2", symbol: "SUSHI", name: "SushiToken" },
  { address: "0xba100000625a3754423978a60c9317c58a424e3D", symbol: "BAL", name: "Balancer" },
  { address: "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e", symbol: "YFI", name: "yearn.finance" },
  { address: "0xD533a949740bb3306d119CC777fa900bA034cd52", symbol: "CRV", name: "Curve DAO Token" },

  // Wrapped Tokens
  { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", symbol: "WBTC", name: "Wrapped BTC" },
  { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", symbol: "WETH", name: "Wrapped Ether" },

  // Meme Coins
  { address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", symbol: "SHIB", name: "SHIBA INU" },
  { address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", symbol: "PEPE", name: "Pepe" },
  { address: "0x4d224452801ACEd8B2F0aebE155379bb5D594381", symbol: "APE", name: "ApeCoin" },
  { address: "0x3845badAde8e6dFF049820680d1F14bD3903a5d0", symbol: "SAND", name: "The Sandbox" },
  { address: "0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c", symbol: "ENJ", name: "Enjin Coin" },

  // Exchange Tokens
  { address: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52", symbol: "BNB", name: "BNB" },
  { address: "0x75231F58b43240C9718Dd58B4967c5114342a86c", symbol: "OKB", name: "OKB" },
  { address: "0x4a220E6096B25EADb88358cb44068A3248254675", symbol: "QNT", name: "Quant" },

  // Layer 2 Tokens
  { address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", symbol: "MATIC", name: "Matic Token" },
  { address: "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942", symbol: "MANA", name: "Decentraland" },
  { address: "0xE41d2489571d322189246DaFA5ebDe1F4699F498", symbol: "ZRX", name: "0x Protocol Token" },
  { address: "0x408e41876cCCDC0F92210600ef50372656052a38", symbol: "REN", name: "Republic Token" },

  // Other Popular Tokens
  { address: "0x1494CA1F11D487c2bBe4543E90080AeBa4BA3C2b", symbol: "DPI", name: "DefiPulse Index" },
  { address: "0xc944E90C64B2c07662A292be6244BDf05Cda44a7", symbol: "GRT", name: "Graph Token" },
  { address: "0x0D8775F648430679A709E98d2b0Cb6250d2887EF", symbol: "BAT", name: "Basic Attention Token" },
  { address: "0xF57e7e7C23978C3cAEC3C3548E3D615c346e79fF", symbol: "IMX", name: "Immutable X" },
  { address: "0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85", symbol: "FET", name: "Fetch.ai" },
  { address: "0x6f40d4A6237C257fff2dB00FA0510DeEECd303eb", symbol: "INST", name: "Instadapp" },
  { address: "0x111111111117dC0aa78b770fA6A738034120C302", symbol: "1INCH", name: "1inch" },
  { address: "0x0f2D719407FdBeFF09D87557AbB7232601FD9F29", symbol: "SYN", name: "Synapse" },
  { address: PEPU_TOKEN_ADDRESS_ETH, symbol: "PEPU", name: "Pepe Unchained" },
  { address: "0xEA1ea0972fa092dd463f2968F9bB51Cc4c981D71", symbol: "MOG", name: "Mog Coin" },
  { address: "0x0C10bF8FcB7Bf5412187A595ab97a3609160b5c6", symbol: "USDD", name: "Decentralized USD" },
  { address: "0xD31a59c85aE9D8edEFeC411D448f90841571b89c", symbol: "SOL", name: "Wrapped SOL" },
  { address: "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0", symbol: "FXS", name: "Frax Share" },
  { address: "0x6810e776880C02933D47DB1b9fc05908e5386b96", symbol: "GNO", name: "Gnosis" },
  { address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", symbol: "stETH", name: "Lido Staked Ether" },
  { address: "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32", symbol: "LDO", name: "Lido DAO Token" },
]

const ETHERSCAN_API_KEY = "SMNBBJKFQHAI9BR1V19RF82ZEA7HZVB8CT"

export interface TokenBalance {
  address: string
  symbol: string
  name: string
  decimals: number
  balance: bigint
  balanceFormatted: string
  priceUsd?: number
  usdValue?: string
}

/**
 * Format token amount with decimals
 */
function formatTokenAmount(amount: bigint, decimals: number): string {
  const num = Number(ethers.formatUnits(amount, decimals))
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 })
}

/**
 * Get all token balances using dual-method approach:
 * 1. Scan known tokens via RPC (fast and reliable)
 * 2. Check Etherscan for additional tokens (supplementary)
 */
export async function getAllEthTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
  const tokens: TokenBalance[] = []
  const provider = getProvider(1) // Ethereum mainnet

  try {
    console.log("[ETH Tokens] Fetching token balances via RPC...")

    // Method 1: Check known tokens via RPC (FAST and RELIABLE)
    for (const knownToken of KNOWN_TOKENS) {
      try {
        const tokenContract = new ethers.Contract(knownToken.address, ERC20_ABI, provider)

        // Get balance only (faster)
        const balance = await tokenContract.balanceOf(walletAddress)

        // Only fetch details if balance > 0
        if (balance > 0n) {
          const [decimals, symbol, name] = await Promise.all([
            tokenContract.decimals(),
            tokenContract.symbol(),
            tokenContract.name(),
          ])

          const balanceFormatted = formatTokenAmount(balance, Number(decimals))

          tokens.push({
            address: knownToken.address.toLowerCase(),
            symbol: symbol,
            name: name,
            decimals: Number(decimals),
            balance: balance,
            balanceFormatted: balanceFormatted,
          })

          console.log(`[ETH Tokens] Found ${symbol}: ${balanceFormatted}`)
        }
      } catch (error) {
        // Skip tokens that error out
        continue
      }
    }

    console.log(`[ETH Tokens] Found ${tokens.length} tokens via RPC scanning`)

    // Method 2: Try Etherscan API as supplementary (might find tokens not in our list)
    try {
      const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${walletAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`

      const response = await fetch(url, { timeout: 10000 } as any)

      if (response.ok) {
        const data = await response.json()

        if (data.status === "1" && data.result) {
          const tokenAddresses = [...new Set(data.result.map((tx: any) => tx.contractAddress))]

          console.log(`[ETH Tokens] Etherscan found ${tokenAddresses.length} token contracts`)

          // Check tokens from Etherscan that we haven't already found
          for (const tokenAddress of tokenAddresses) {
            // Skip if we already have this token
            if (tokens.find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase())) {
              continue
            }

            try {
              const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

              const balance = await tokenContract.balanceOf(walletAddress)

              if (balance > 0n) {
                const [decimals, symbol, name] = await Promise.all([
                  tokenContract.decimals(),
                  tokenContract.symbol(),
                  tokenContract.name(),
                ])

                const balanceFormatted = formatTokenAmount(balance, Number(decimals))

                tokens.push({
                  address: tokenAddress.toLowerCase(),
                  symbol: symbol,
                  name: name,
                  decimals: Number(decimals),
                  balance: balance,
                  balanceFormatted: balanceFormatted,
                })

                console.log(`[ETH Tokens] Found additional token ${symbol}: ${balanceFormatted}`)
              }
            } catch (error) {
              continue
            }
          }
        }
      }
    } catch (etherscanError: any) {
      console.log(
        "[ETH Tokens] Etherscan API supplementary check failed (non-critical):",
        etherscanError.message,
      )
    }

    // Fetch prices for tokens (especially PEPU from GeckoTerminal)
    for (const token of tokens) {
      try {
        // If it's PEPU, use GeckoTerminal
        if (token.address.toLowerCase() === PEPU_TOKEN_ADDRESS_ETH.toLowerCase()) {
          const geckoData = await fetchGeckoTerminalData(PEPU_TOKEN_ADDRESS_ETH, "ethereum")
          if (geckoData?.price_usd) {
            token.priceUsd = parseFloat(geckoData.price_usd)
            const balanceNum = Number(ethers.formatUnits(token.balance, token.decimals))
            token.usdValue = (balanceNum * token.priceUsd).toFixed(2)
          }
        } else {
          // For other tokens, try GeckoTerminal as well
          const geckoData = await fetchGeckoTerminalData(token.address, "ethereum")
          if (geckoData?.price_usd) {
            token.priceUsd = parseFloat(geckoData.price_usd)
            const balanceNum = Number(ethers.formatUnits(token.balance, token.decimals))
            token.usdValue = (balanceNum * token.priceUsd).toFixed(2)
          }
        }
      } catch (error) {
        // Price fetching is optional, continue without it
        console.warn(`[ETH Tokens] Could not fetch price for ${token.symbol}:`, error)
      }
    }

    // Sort by balance value (USD if available, otherwise by token amount)
    tokens.sort((a, b) => {
      if (a.usdValue && b.usdValue) {
        return parseFloat(b.usdValue) - parseFloat(a.usdValue)
      }
      const aNum = Number(ethers.formatUnits(a.balance, a.decimals))
      const bNum = Number(ethers.formatUnits(b.balance, b.decimals))
      return bNum - aNum
    })

    return tokens
  } catch (error) {
    console.error("[ETH Tokens] Error getting token balances:", error)
    return tokens // Return whatever we found
  }
}

/**
 * Get token info for a specific token address
 */
export async function getEthTokenInfo(
  walletAddress: string,
  tokenAddress: string,
): Promise<TokenBalance | null> {
  try {
    const provider = getProvider(1)
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

    const [balance, decimals, symbol, name] = await Promise.all([
      tokenContract.balanceOf(walletAddress),
      tokenContract.decimals(),
      tokenContract.symbol(),
      tokenContract.name(),
    ])

    const balanceFormatted = formatTokenAmount(balance, Number(decimals))

    const tokenInfo: TokenBalance = {
      address: tokenAddress.toLowerCase(),
      symbol: symbol,
      name: name,
      decimals: Number(decimals),
      balance: balance,
      balanceFormatted: balanceFormatted,
    }

    // Try to fetch price
    try {
      const geckoData = await fetchGeckoTerminalData(tokenAddress, "ethereum")
      if (geckoData?.price_usd) {
        tokenInfo.priceUsd = parseFloat(geckoData.price_usd)
        const balanceNum = Number(ethers.formatUnits(balance, Number(decimals)))
        tokenInfo.usdValue = (balanceNum * tokenInfo.priceUsd).toFixed(2)
      }
    } catch (error) {
      // Price fetching is optional
    }

    return tokenInfo
  } catch (error) {
    console.error(`[ETH Tokens] Error getting token info for ${tokenAddress}:`, error)
    return null
  }
}

