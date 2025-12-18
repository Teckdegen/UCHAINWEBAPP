# Chrome Web Store scripting Permission Justification

## Why This Extension Uses the scripting Permission

**Extension Type:** Cryptocurrency Wallet Extension

**Permission Requested:** `scripting` (as optional permission)

### Justification:

1. **Dynamic Content Script Injection:**
   - The extension uses the `scripting` permission to programmatically inject content scripts into web pages
   - This allows the extension to inject the `window.ethereum` provider into pages after user grants permission
   - Injection happens dynamically rather than declaratively, giving users control over when the extension accesses websites

2. **User Consent Model:**
   - The extension requests `scripting` permission as an **optional permission**
   - Users are explicitly prompted to grant this permission
   - Extension only injects content scripts after user explicitly approves
   - This follows Chrome's recommended pattern for user-controlled access

3. **Security Best Practice:**
   - Using optional permissions instead of declarative content scripts provides better security
   - Users can see exactly what permission is being requested
   - Permission can be revoked by users at any time
   - Aligns with Chrome's principle of least privilege

4. **Core Functionality Requirement:**
   - The extension must inject `window.ethereum` provider into web pages for dApp connectivity
   - Programmatic injection via `scripting` API is the recommended approach for dynamic injection
   - Required for the extension to function as a Web3 wallet

5. **Limited Scope:**
   - The `scripting` permission is only used to inject the wallet provider script
   - No page content is read or modified
   - No data is collected or transmitted
   - Injection only occurs after explicit user permission

### Technical Implementation:

- **Permission Request:** Extension requests `scripting` permission on install/startup
- **User Approval:** User must explicitly grant permission via Chrome's permission prompt
- **Script Injection:** After approval, extension injects `contentScript.js` into web pages
- **New Tab Handling:** Extension injects scripts into new tabs as they are created
- **Revocable:** Users can revoke permission at any time via Chrome settings

### Comparison to Alternative Approaches:

**Without scripting permission:**
- Would require declarative `content_scripts` in manifest
- No user control over when scripts are injected
- Scripts run on all pages automatically
- Less secure, less user-friendly

**With optional scripting permission:**
- User controls when extension accesses websites
- Clear permission prompt for user awareness
- Can be revoked by user
- More secure, better user experience
- Follows Chrome's recommended practices

### User Privacy Protection:

- **Explicit Consent:** Users must approve permission before any injection occurs
- **Transparency:** Permission request clearly states what the extension needs
- **Control:** Users can revoke permission at any time
- **Limited Access:** Only injects provider script, doesn't access page content
- **No Background Activity:** Injection only happens when user grants permission

### Compliance with Chrome Policies:

- Uses optional permissions (recommended by Chrome)
- Requests permission with clear user prompt
- Follows principle of least privilege
- Provides user control over extension access
- Aligns with Chrome's security model

### Use Cases:

1. **Initial Setup:** On extension install, requests permission to inject provider
2. **New Tab Injection:** When user opens new tabs, injects provider if permission granted
3. **User-Controlled:** User can grant/revoke permission at any time
4. **dApp Connectivity:** Enables Web3 dApps to detect and connect to wallet

### Security Considerations:

- **No Automatic Injection:** Scripts only inject after user approval
- **User Awareness:** Clear permission prompt explains what extension needs
- **Revocable Access:** Users maintain control over extension permissions
- **Limited Functionality:** Only injects provider, doesn't access page data
- **No Data Collection:** Extension doesn't read or transmit page content

### Conclusion:

The `scripting` permission is essential for this wallet extension to function securely while maintaining user control. It allows the extension to inject the `window.ethereum` provider into web pages after explicit user consent, following Chrome's recommended security practices. This approach provides better security and user experience compared to declarative content scripts, while still enabling the core wallet functionality required for Web3 dApp connectivity.

The permission is requested as optional, giving users full control over when and how the extension accesses websites, which aligns with Chrome's security model and user privacy expectations.

