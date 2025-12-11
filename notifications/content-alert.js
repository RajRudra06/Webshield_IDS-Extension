// Show custom alert overlay on page
export function showBlockedAlert(data) {
    console.log("🚨 Showing blocked alert:", data);
    
    // Remove existing alert if any
    const existing = document.getElementById('webshield-alert');
    if (existing) existing.remove();
    
    const alert = document.createElement('div');
    alert.id = 'webshield-alert';
    alert.innerHTML = `
      <div style="
        position: fixed;
        top: 70px;
        right: 20px;
        z-index: 2147483647;
        background: linear-gradient(135deg, #ff4444, #cc0000);
        color: white;
        padding: 20px 25px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(255, 0, 0, 0.4);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        max-width: 380px;
        animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      ">
        <div style="display: flex; align-items: start; gap: 12px;">
          <div style="font-size: 32px;">🛡️</div>
          <div style="flex: 1;">
            <div style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">
              ⚠️ Threat Blocked!
            </div>
            <div style="font-size: 13px; opacity: 0.95; margin-bottom: 6px; word-break: break-all;">
              <strong>URL:</strong> ${escapeHtml(data.url)}
            </div>
            <div style="font-size: 13px; opacity: 0.9;">
              <strong>Reason:</strong> ${escapeHtml(data.reasons)}
            </div>
          </div>
          <button id="webshield-close" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0px 8px;
            border-radius: 4px;
            line-height: 1;
            transition: background 0.2s;
          ">×</button>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from {
            transform: translateX(450px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        #webshield-close:hover {
          background: rgba(255,255,255,0.3) !important;
        }
      </style>
    `;
    
    document.body.appendChild(alert);
    
    // Close button
    document.getElementById('webshield-close').addEventListener('click', () => {
      alert.style.animation = 'slideIn 0.3s ease-in reverse';
      setTimeout(() => alert.remove(), 300);
    });
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (alert.parentNode) {
        alert.style.animation = 'slideIn 0.3s ease-in reverse';
        setTimeout(() => alert.remove(), 300);
      }
    }, 10000);
  }
  
  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("📩 Content script received message:", message);
    
    if (message.type === 'SHOW_BLOCKED_ALERT') {
      showBlockedAlert(message.data);
      sendResponse({ success: true });
    }
    
    return true; // Keep message channel open
  });
  
  console.log("✅ WebShield content-alert.js loaded");