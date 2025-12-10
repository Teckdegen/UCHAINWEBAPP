require("@nomicfoundation/hardhat-toolbox");

// ============================================
// HARDCODED CONFIGURATION
// ============================================
// Private key for deployment (replace with your actual private key)
// WARNING: Never commit private keys to version control!
const PRIVATE_KEY = "01f759c843146d57b72cab41f43cee8cc2de9b1f43d297cff8ad8a3b87f36a63"; // Add your private key here: "0x..."

// PEPU Chain RPC URL
const PEPU_RPC_URL = "https://rpc-pepu-v2-mainnet-0.t.conduit.xyz";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    // PEPU Chain (Pepe Unchained V2)
    pepu: {
      url: PEPU_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 97741,
    },
  },
  etherscan: {
    apiKey: {
      pepu: "NO_API_KEY_NEEDED", // PEPU block explorer may not require API key
    },
    customChains: [
      {
        network: "pepu",
        chainId: 97741,
        urls: {
          apiURL: "https://api.pepuscan.com/api", // PEPU block explorer API
          browserURL: "https://pepuscan.com", // PEPU block explorer
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

