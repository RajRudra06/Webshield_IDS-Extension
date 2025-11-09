import { isInThreatDatabase } from "../pre_database/loadDatabase.js";

export function checkLocalDatabase(url) {
    if (isInThreatDatabase(url)) {
      return {
        blocked: true,
        score: 1.0,
        reason: 'Known malicious URL in database',
        layer: 'database'
      };
    }
    return { blocked: false, score: 0 };
  }
  