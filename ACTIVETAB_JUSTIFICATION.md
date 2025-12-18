# Chrome Web Store activeTab Permission Justification

## Why This Extension Uses activeTab Permission

**Extension Type:** Cryptocurrency Wallet Extension

**Permission Requested:** `activeTab` permission

### Justification:

1. **User-Initiated Access Only:**
   - The `activeTab` permission is used to access the active tab ONLY when the user explicitly interacts with the extension
   - This includes clicking the extension icon, using keyboard shortcuts, or other explicit user gestures
   - No background access to tabs without user interaction

2. **Security Best Practice:**
   - `activeTab` provides temporary, one-time access to the active tab
   - Access is automatically revoked when the tab is closed or navigated away
   - This minimizes the extension's access footprint and follows the principle of least privilege

3. **Use Cases:**
   - **Opening Wallet Popup:** When user clicks the extension icon, we need to access the current tab's URL to identify which dApp is requesting wallet access
   - **Transaction Signing:** When processing transaction requests, we need to verify the origin of the requesting dApp
   - **Connection Requests:** When a dApp requests to connect, we need to display the correct origin information to the user

4. **Privacy Protection:**
   - The extension does NOT access tabs in the background
   - Access is only granted in response to explicit user actions
   - No data is collected or stored about tabs the user hasn't explicitly interacted with
   - All tab access is temporary and context-specific

5. **Compliance with Chrome Policies:**
   - `activeTab` is the recommended permission for extensions that need tab access only on user interaction
   - This aligns with Chrome's security model and user privacy expectations
   - Reduces the need for broad host permissions where possible

### Technical Implementation:

- The extension uses `activeTab` to read the current tab's URL when the user clicks the extension icon
- This URL is used to identify the requesting dApp and display it in the wallet approval UI
- No persistent access is maintained - access is granted per interaction
- The extension does not use `activeTab` to modify page content, only to read origin information

### Comparison to Broad Host Permissions:

- **Without activeTab:** Would require `host_permissions: ["<all_urls>"]` to access tab information
- **With activeTab:** Only needs temporary access when user interacts, no broad permissions required
- **Result:** Better security posture, faster review process, improved user trust

### User Experience:

- Users see a clear connection between their action (clicking extension) and the permission being used
- No unexpected background access to their browsing data
- Transparent permission model that users can understand and trust

### Conclusion:

The `activeTab` permission is essential for this wallet extension to function securely while maintaining user privacy. It allows the extension to identify requesting dApps and provide a secure connection flow without requiring broad host permissions. This approach follows Chrome's security best practices and provides the best balance between functionality and user privacy.

