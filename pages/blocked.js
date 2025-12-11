// Get URL parameters from storage
chrome.storage.local.get(['currentThreat'], (result) => {
  if (result.currentThreat) {
    const { url, reasons } = result.currentThreat;
    
    // Display blocked URL
    document.getElementById('blocked-url').textContent = url;
    
    // Display threat reasons
    const threatList = document.getElementById('threat-list');
    threatList.innerHTML = '';
    
    reasons.forEach(reason => {
      const li = document.createElement('li');
      li.textContent = reason;
      threatList.appendChild(li);
    });
    
    // Store URL for "proceed anyway" button
    window.blockedUrl = url;
  } else {
    document.getElementById('blocked-url').textContent = 'Unknown URL';
    document.getElementById('threat-list').innerHTML = '<li>Threat information unavailable</li>';
  }
});

// Go back button
document.getElementById('go-back-btn').addEventListener('click', () => {
  window.history.back();
});

// Show warning notice
document.getElementById('show-warning-btn').addEventListener('click', () => {
  const warningNotice = document.getElementById('warning-notice');
  warningNotice.classList.add('show');
});

// Helper function to extract domain
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

// Proceed anyway button (dangerous!)
document.getElementById('proceed-anyway-btn').addEventListener('click', async () => {
  if (window.blockedUrl) {
    // Extract domain from URL
    const domain = extractDomain(window.blockedUrl);
    
    // Add DOMAIN to SESSION whitelist (clears on browser close)
    const { domainWhitelist = [] } = await chrome.storage.session.get('domainWhitelist');
    if (!domainWhitelist.includes(domain)) {
      domainWhitelist.push(domain);
      await chrome.storage.session.set({ domainWhitelist });
    }
    
    console.log('✅ Added domain to session whitelist:', domain);
    
    // Clear the threat from storage
    await chrome.storage.local.remove('currentThreat');
    
    // Clear badge
    chrome.action.setBadgeText({ text: '' });
    
    // Navigate to the blocked URL
    window.location.href = window.blockedUrl;
  }
});