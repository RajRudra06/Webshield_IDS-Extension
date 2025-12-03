let threatDatabase = new Set(); 

export async function loadThreatDatabase() {
  try {
    const response = await fetch(chrome.runtime.getURL('pre_database/threat-database.json'));
    const threats = await response.json();
    
    // Use Set for O(1) lookup
    threatDatabase = new Set(threats.map(t => t.domain || t.url));
    console.log(`📚 Loaded ${threatDatabase.size} known threats`);
    
  } catch (error) {
    console.error('❌ Failed to load threat database:', error);
    threatDatabase = new Set();
  }
}

function extractDomain(url) {
  const u = new URL(url.includes("://") ? url : "https://" + url);

  const netloc = u.hostname;
  const path = u.pathname;
  const query = u.search.replace(/^\?/, "");

  const parts = netloc.split(".");
  const suffix = parts.pop() || "";
  const domain = parts.pop() || "";
  const subdomain = parts.join(".");

  return domain;  // this is what your code treats as "domain"
}

export function isInThreatDatabase(url) {
  const domain = extractDomain(url);
  return threatDatabase.has(domain) || threatDatabase.has(url);
}