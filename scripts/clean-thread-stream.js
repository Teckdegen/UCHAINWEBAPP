/**
 * Postinstall script to remove problematic test files from thread-stream
 * that cause Turbopack build errors.
 * 
 * This is a workaround for WalletConnect dependencies that include
 * test files and non-code assets that Turbopack tries to parse.
 */

const fs = require('fs')
const path = require('path')

function findThreadStreamDir() {
  // Try to find thread-stream in node_modules
  const possiblePaths = [
    path.join(process.cwd(), 'node_modules', 'thread-stream'),
    path.join(process.cwd(), 'node_modules', '.pnpm', 'thread-stream@3.1.0', 'node_modules', 'thread-stream'),
  ]

  for (const dir of possiblePaths) {
    if (fs.existsSync(dir)) {
      return dir
    }
  }

  // Try to find it by searching in .pnpm
  const pnpmDir = path.join(process.cwd(), 'node_modules', '.pnpm')
  if (fs.existsSync(pnpmDir)) {
    const entries = fs.readdirSync(pnpmDir)
    for (const entry of entries) {
      if (entry.startsWith('thread-stream@')) {
        const threadStreamPath = path.join(pnpmDir, entry, 'node_modules', 'thread-stream')
        if (fs.existsSync(threadStreamPath)) {
          return threadStreamPath
        }
      }
    }
  }

  return null
}

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
    console.log(`[postinstall] Removed: ${dirPath}`)
  }
}

function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    console.log(`[postinstall] Removed: ${filePath}`)
  }
}

function cleanThreadStream() {
  const threadStreamDir = findThreadStreamDir()
  
  if (!threadStreamDir) {
    console.log('[postinstall] thread-stream not found, skipping cleanup')
    return
  }

  console.log(`[postinstall] Cleaning thread-stream at: ${threadStreamDir}`)

  // Remove test directory
  removeDir(path.join(threadStreamDir, 'test'))
  
  // Remove bench directory
  removeDir(path.join(threadStreamDir, 'bench'))
  
  // Remove problematic files
  removeFile(path.join(threadStreamDir, 'README.md'))
  removeFile(path.join(threadStreamDir, 'LICENSE'))
  removeFile(path.join(threadStreamDir, 'bench.js'))

  console.log('[postinstall] thread-stream cleanup complete')
}

try {
  cleanThreadStream()
} catch (error) {
  console.warn('[postinstall] Error cleaning thread-stream:', error.message)
  // Don't fail the install if cleanup fails
}

