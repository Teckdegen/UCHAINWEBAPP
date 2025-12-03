"use client"

import { useEffect } from "react"
import { getWallets } from "@/lib/wallet"
import { getUnchainedProvider } from "@/lib/provider"
import { useRouter } from "next/navigation"

export default function TestWalletConnectPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if wallet exists
    const wallets = getWallets()
    if (wallets.length === 0) {
      router.push("/setup")
      return
    }

    // Initialize provider to ensure window.ethereum.isUnchained is set
    getUnchainedProvider()
  }, [router])

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px',
      color: '#fff'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '2.5em' }}>🔗 Unchained Wallet Connect Test</h1>
        <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '30px' }}>Test all wallet connection methods - PEPU Chain Only</p>
        
        <div style={{
          background: 'rgba(59, 130, 246, 0.2)',
          border: '1px solid rgba(59, 130, 246, 0.5)',
          padding: '15px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <strong style={{ color: '#93c5fd' }}>✅ Running in Wallet App Context</strong><br/>
          The Unchained provider is initialized and ready to use!
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '15px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontFamily: '"Courier New", monospace'
        }}>
          <div style={{ margin: '8px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.7 }}>Network Name:</span>
            <span style={{ fontWeight: 'bold' }}>Pepe Unchained V2</span>
          </div>
          <div style={{ margin: '8px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.7 }}>Chain ID:</span>
            <span style={{ fontWeight: 'bold' }}>97741</span>
          </div>
          <div style={{ margin: '8px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.7 }}>RPC URL:</span>
            <span style={{ fontWeight: 'bold', fontSize: '0.9em' }}>https://rpc-pepu-v2-mainnet-0.t.conduit.xyz</span>
          </div>
          <div style={{ margin: '8px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.7 }}>Currency Symbol:</span>
            <span style={{ fontWeight: 'bold' }}>PEPU</span>
          </div>
          <div style={{ margin: '8px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.7 }}>Block Explorer:</span>
            <span style={{ fontWeight: 'bold' }}>https://pepuscan.com/</span>
          </div>
        </div>

        <div id="test-container"></div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          // PEPU Chain Configuration
          const PEPU_CHAIN_ID = 97741;
          const PEPU_RPC_URL = 'https://rpc-pepu-v2-mainnet-0.t.conduit.xyz';
          const PEPU_CHAIN_NAME = 'Pepe Unchained V2';
          const PEPU_EXPLORER = 'https://pepuscan.com';

          let currentAccount = null;
          let currentChainId = null;

          // Logging utility
          function log(message, type = 'info') {
            const logDiv = document.getElementById('log');
            if (!logDiv) return;
            const entry = document.createElement('div');
            entry.style.cssText = 'margin: 5px 0; padding: 5px; border-left: 3px solid #667eea; padding-left: 10px; ' +
              (type === 'error' ? 'border-left-color: #ef4444; color: #fca5a5;' : '') +
              (type === 'success' ? 'border-left-color: #10b981; color: #86efac;' : '');
            entry.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
            logDiv.appendChild(entry);
            logDiv.scrollTop = logDiv.scrollHeight;
            console.log(message);
          }

          function clearLog() {
            const logDiv = document.getElementById('log');
            if (logDiv) logDiv.innerHTML = '';
          }

          // Check wallet
          function checkWallet() {
            if (typeof window.ethereum === 'undefined') {
              log('No wallet detected', 'error');
              return false;
            }

            const ethereum = window.ethereum;
            let walletType = 'Unknown';
            
            if (ethereum.isUnchained === true) {
              walletType = 'Unchained Wallet ✅';
            } else if (ethereum.isMetaMask) {
              walletType = 'MetaMask';
            } else if (ethereum.isCoinbaseWallet) {
              walletType = 'Coinbase Wallet';
            } else {
              walletType = 'Injected Wallet';
            }

            log('Wallet detected: ' + walletType, 'success');
            return true;
          }

          // Update status
          function updateStatus() {
            const statusEl = document.getElementById('connectionStatus');
            const addressEl = document.getElementById('address');
            const chainIdEl = document.getElementById('chainId');

            if (currentAccount && statusEl) {
              statusEl.textContent = 'Connected';
              statusEl.style.color = '#4ade80';
              if (addressEl) {
                addressEl.textContent = currentAccount.substring(0, 6) + '...' + currentAccount.substring(38);
              }
            } else if (statusEl) {
              statusEl.textContent = 'Not Connected';
              statusEl.style.color = '#f87171';
              if (addressEl) addressEl.textContent = '-';
            }

            if (currentChainId && chainIdEl) {
              chainIdEl.textContent = currentChainId.toString();
            } else if (chainIdEl) {
              chainIdEl.textContent = '-';
            }
          }

          // Connect function
          async function connectDirect() {
            log('Attempting connection...');
            try {
              if (!checkWallet()) {
                throw new Error('No wallet detected');
              }

              log('Requesting accounts - you will be redirected to approve...', 'info');
              const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
              });

              if (accounts && accounts.length > 0) {
                currentAccount = accounts[0];
                const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
                currentChainId = parseInt(chainIdHex, 16);
                updateStatus();
                log('Connected: ' + currentAccount, 'success');
                log('Chain ID: ' + currentChainId, 'success');
              } else {
                throw new Error('No accounts returned');
              }
            } catch (error) {
              const errorMsg = error.message || 'Unknown error';
              if (errorMsg.includes('Redirecting') || errorMsg.includes('redirect')) {
                log('Redirecting to approval page...', 'info');
                // The redirect will happen automatically
              } else {
                log('Connection failed: ' + errorMsg, 'error');
              }
            }
          }

          // Switch to PEPU
          async function switchToPEPU() {
            log('Switching to PEPU chain...');
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x' + PEPU_CHAIN_ID.toString(16) }],
              });
              log('Switched to PEPU chain', 'success');
              currentChainId = PEPU_CHAIN_ID;
              updateStatus();
            } catch (switchError) {
              if (switchError.code === 4902) {
                try {
                  await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                      chainId: '0x' + PEPU_CHAIN_ID.toString(16),
                      chainName: PEPU_CHAIN_NAME,
                      nativeCurrency: {
                        name: 'PEPU',
                        symbol: 'PEPU',
                        decimals: 18
                      },
                      rpcUrls: [PEPU_RPC_URL],
                      blockExplorerUrls: [PEPU_EXPLORER]
                    }],
                  });
                  log('PEPU chain added and switched', 'success');
                  currentChainId = PEPU_CHAIN_ID;
                  updateStatus();
                } catch (addError) {
                  log('Failed to add PEPU chain: ' + addError.message, 'error');
                }
              } else {
                log('Failed to switch chain: ' + switchError.message, 'error');
              }
            }
          }

          // Get balance
          async function getBalance() {
            log('Fetching balance...');
            try {
              if (!currentAccount) {
                throw new Error('Not connected');
              }
              const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [currentAccount, 'latest']
              });
              const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
              log('Balance: ' + balanceInEth.toFixed(6) + ' PEPU', 'success');
            } catch (error) {
              log('Failed to get balance: ' + error.message, 'error');
            }
          }

          // Render UI
          function renderUI() {
            const container = document.getElementById('test-container');
            if (!container) return;

            container.innerHTML = \`
              <div style="margin: 30px 0; padding: 20px; background: rgba(0, 0, 0, 0.1); border-radius: 10px;">
                <div style="font-size: 1.3em; margin-bottom: 15px; border-bottom: 2px solid rgba(255, 255, 255, 0.2); padding-bottom: 10px;">Connection Status</div>
                <div style="background: rgba(0, 0, 0, 0.2); padding: 15px; border-radius: 10px; margin-bottom: 20px; font-family: 'Courier New', monospace;">
                  <div style="margin: 8px 0; display: flex; justify-content: space-between;">
                    <span style="opacity: 0.7;">Connection Status:</span>
                    <span id="connectionStatus" style="font-weight: bold; color: #f87171;">Not Connected</span>
                  </div>
                  <div style="margin: 8px 0; display: flex; justify-content: space-between;">
                    <span style="opacity: 0.7;">Address:</span>
                    <span id="address" style="font-weight: bold;">-</span>
                  </div>
                  <div style="margin: 8px 0; display: flex; justify-content: space-between;">
                    <span style="opacity: 0.7;">Chain ID:</span>
                    <span id="chainId" style="font-weight: bold;">-</span>
                  </div>
                </div>
              </div>

              <div style="margin: 30px 0; padding: 20px; background: rgba(0, 0, 0, 0.1); border-radius: 10px;">
                <div style="font-size: 1.3em; margin-bottom: 15px; border-bottom: 2px solid rgba(255, 255, 255, 0.2); padding-bottom: 10px;">Connection Methods</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                  <button onclick="window.connectDirect()" style="padding: 15px 20px; border: none; border-radius: 10px; font-size: 1em; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff;">Connect Wallet</button>
                  <button onclick="window.switchToPEPU()" style="padding: 15px 20px; border: none; border-radius: 10px; font-size: 1em; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff;">Switch to PEPU</button>
                  <button onclick="window.getBalance()" style="padding: 15px 20px; border: none; border-radius: 10px; font-size: 1em; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff;">Get Balance</button>
                </div>
              </div>

              <div style="margin: 30px 0; padding: 20px; background: rgba(0, 0, 0, 0.1); border-radius: 10px;">
                <div style="font-size: 1.3em; margin-bottom: 15px; border-bottom: 2px solid rgba(255, 255, 255, 0.2); padding-bottom: 10px;">Event Log</div>
                <div id="log" style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; max-height: 300px; overflow-y: auto; font-family: 'Courier New', monospace; font-size: 0.9em;"></div>
                <button onclick="window.clearLog()" style="margin-top: 10px; padding: 10px 20px; border: none; border-radius: 10px; background: rgba(255, 255, 255, 0.2); color: #fff; cursor: pointer;">Clear Log</button>
              </div>
            \`;

            // Make functions available globally
            (window as any).connectDirect = connectDirect;
            (window as any).switchToPEPU = switchToPEPU;
            (window as any).getBalance = getBalance;
            (window as any).clearLog = clearLog;

            // Initial check
            checkWallet();
          }

          // Initialize when DOM is ready
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderUI);
          } else {
            renderUI();
          }
        })();
      ` }} />
    </div>
  )
}

