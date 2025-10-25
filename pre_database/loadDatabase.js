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

export function isInThreatDatabase(url) {
  const domain = extractDomain(url);
  return threatDatabase.has(domain) || threatDatabase.has(url);
}