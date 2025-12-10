let threatDatabase = new Set(); 

export async function loadThreatDatabase() {
  try {
    console.log('📥 Starting to load threat database...');
    const response = await fetch(chrome.runtime.getURL('pre_database/threat-database.json'));
    console.log('📡 Threat database file fetched, parsing JSON...');
    
    const threats = await response.json();
    console.log(`📄 Parsed ${threats.length} threat entries from JSON`);
    
    // Use Set for O(1) lookup
    threatDatabase = new Set(threats.map(t => t.domain || t.url));
    console.log(`📚 Loaded ${threatDatabase.size} known threats into Set`);
    console.log('🔍 Sample threats:', Array.from(threatDatabase).slice(0, 5));
    
  } catch (error) {
    console.error('❌ Failed to load threat database:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    threatDatabase = new Set();
  }
}

function extractDomain(url) {
  console.log('🔧 Extracting domain from URL:', url);
  
  const u = new URL(url.includes("://") ? url : "https://" + url);
  console.log('📋 Parsed URL object:', {
    hostname: u.hostname,
    pathname: u.pathname,
    search: u.search
  });

  const netloc = u.hostname;
  const path = u.pathname;
  const query = u.search.replace(/^\?/, "");

  const parts = netloc.split(".");
  console.log('🔍 Hostname parts:', parts);
  
  const suffix = parts.pop() || "";
  const domain = parts.pop() || "";
  const subdomain = parts.join(".");

  console.log('🎯 Extracted components:', {
    subdomain: subdomain || '(none)',
    domain: domain,
    suffix: suffix,
    fullDomain: domain ? `${domain}.${suffix}` : suffix
  });

  return domain;  // this is what your code treats as "domain"
}

export function isInThreatDatabase(url) {
  console.log('🔍 Checking if URL is in threat database:', url);
  
  const domain = extractDomain(url);
  console.log('🎯 Extracted domain for lookup:', domain);
  
  const domainMatch = threatDatabase.has(domain);
  const urlMatch = threatDatabase.has(url);
  
  console.log('🔎 Threat database lookup results:', {
    domainChecked: domain,
    urlChecked: url,
    domainInDatabase: domainMatch,
    fullUrlInDatabase: urlMatch,
    finalResult: domainMatch || urlMatch
  });
  
  if (domainMatch) {
    console.log('🚨 MATCH FOUND: Domain exists in threat database');
  } else if (urlMatch) {
    console.log('🚨 MATCH FOUND: Full URL exists in threat database');
  } else {
    console.log('✅ No match found - URL not in threat database');
  }
  
  return domainMatch || urlMatch;
}