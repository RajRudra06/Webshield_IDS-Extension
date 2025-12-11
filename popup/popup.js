// Load stats and settings
chrome.storage.local.get(['stats', 'settings', 'currentThreat'], (result) => {
  // Update stats
  if (result.stats) {
    document.getElementById('scanned-count').textContent = result.stats.scanned || 0;
    document.getElementById('blocked-count').textContent = result.stats.blocked || 0;
  }

  // Update toggle
  const toggleSwitch = document.getElementById('toggle-switch');
  const statusText = document.getElementById('status-text');
  
  if (result.settings?.enabled !== false) {
    toggleSwitch.classList.add('active');
    statusText.textContent = 'Enabled';
  } else {
    toggleSwitch.classList.remove('active');
    statusText.textContent = 'Disabled';
  }

  // Show threat alert if exists
  if (result.currentThreat) {
    const alert = document.getElementById('threat-alert');
    alert.classList.add('show');
    
    document.getElementById('threat-url-text').textContent = result.currentThreat.url;
    document.getElementById('threat-reasons-text').textContent = result.currentThreat.reasons.join(', ');
  }
});

// Show whitelisted domains count
chrome.storage.session.get(['domainWhitelist'], (result) => {
const count = result.domainWhitelist?.length || 0;
if (count > 0) {
  console.log(`⚪ ${count} domain(s) whitelisted this session:`, result.domainWhitelist);
}
});

// Toggle protection
document.getElementById('toggle-switch').addEventListener('click', async () => {
const toggleSwitch = document.getElementById('toggle-switch');
const statusText = document.getElementById('status-text');
const isActive = toggleSwitch.classList.contains('active');

toggleSwitch.classList.toggle('active');
statusText.textContent = isActive ? 'Disabled' : 'Enabled';

await chrome.storage.local.set({
  settings: { enabled: !isActive }
});
});

// Dismiss threat alert
document.getElementById('dismiss-btn').addEventListener('click', async () => {
const alert = document.getElementById('threat-alert');
alert.style.animation = 'slideDown 0.3s ease-in reverse';

setTimeout(async () => {
  alert.classList.remove('show');
  
  // Clear threat from storage
  await chrome.storage.local.remove('currentThreat');
  
  // Clear badge
  chrome.action.setBadgeText({ text: '' });
}, 300);
});

// Clear whitelist button (if you have this button in your HTML)
const clearWhitelistBtn = document.getElementById('clear-whitelist-btn');
if (clearWhitelistBtn) {
clearWhitelistBtn.addEventListener('click', async () => {
  const { domainWhitelist = [] } = await chrome.storage.session.get('domainWhitelist');
  const count = domainWhitelist.length;
  
  await chrome.storage.session.set({ domainWhitelist: [] });
  
  if (count > 0) {
    alert(`✅ ${count} whitelisted domain(s) cleared! All sites will be scanned again.`);
  } else {
    alert('⚪ No domains were whitelisted.');
  }
});
}