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
  
  // Proceed anyway button (dangerous!)
document.getElementById('proceed-anyway-btn').addEventListener('click', async () => {
    if (window.blockedUrl) {
      // Add URL to SESSION whitelist (clears on browser close)
      const { whitelist = [] } = await chrome.storage.session.get('whitelist');
      whitelist.push(window.blockedUrl);
      await chrome.storage.session.set({ whitelist });
      
      console.log('✅ Added to session whitelist:', window.blockedUrl);
      
      // Clear the threat from storage
      await chrome.storage.local.remove('currentThreat');
      
      // Clear badge
      chrome.action.setBadgeText({ text: '' });
      
      // Navigate to the blocked URL
      window.location.href = window.blockedUrl;
    }
  });