import { BRAND_KEYWORDS } from "./constants/legimateBrandDomains";

export function shannon_entropy(s) {
  if (typeof s !== "string" || s.length === 0) return 0;
  s = Array.from(s).filter(c => 32 <= c.charCodeAt(0) && c.charCodeAt(0) <= 126).join("");
  if (s.length === 0) return 0;
  const counts = {};
  for (const c of s) counts[c] = (counts[c] || 0) + 1;
  const len = s.length;
  let entropy = 0;
  for (const c in counts) {
    const p = counts[c] / len;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  return entropy;
}

export function longest_repeated_char(s) {
  if (!s) return 0;
  let maxCount = 1, count = 1;
  for (let i = 1; i < s.length; i++) {
    if (s[i] === s[i - 1]) {
      count++;
      maxCount = Math.max(maxCount, count);
    } else count = 1;
  }
  return maxCount;
}

export function vowel_consonant_ratio(s) {
  const lower = s.toLowerCase();
  const vowels = [...lower].filter(c => "aeiou".includes(c)).length;
  const consonants = [...lower].filter(c => /[a-z]/.test(c) && !"aeiou".includes(c)).length;
  return consonants > 0 ? vowels / consonants : 0;
}

export function get_tld_category(tld) {
  const highTrust = ['com', 'org', 'net', 'edu', 'gov', 'mil', 'in', 'co.in', 'ac.in', 'gov.in'];
  const suspicious = ['tk', 'ml', 'ga', 'cf', 'gq', 'pw', 'cc', 'top', 'xyz', 'club', 'work', 'buzz', 'loan'];
  if (highTrust.includes(tld)) return 2;
  if (suspicious.includes(tld)) return 0;
  return 1;
}

export function count_ngrams(s, n = 2) {
  if (s.length < n) return 0;
  const set = new Set();
  for (let i = 0; i <= s.length - n; i++) set.add(s.slice(i, i + n));
  return set.size;
}

export function safe_max_len_list(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return Math.max(...values);
}

export function safe_max_match_length(pattern, text) {
  try {
    const matches = text.match(new RegExp(pattern, "g")) || [];
    const lengths = matches.map(m => m.length);
    return lengths.length ? Math.max(...lengths) : 0;
  } catch {
    return 0;
  }
}

export function has_character_substitution(text) {
  const subs = {
    o: "0", O: "0",
    i: "1", I: "1", l: "1", L: "1",
    e: "3", E: "3",
    a: "@", A: "@",
    s: "$", S: "$",
    g: "9", G: "9",
    t: "7", T: "7"
  };
  const lower = text.toLowerCase();
  for (const [orig, rep] of Object.entries(subs)) {
    if (text.includes(rep)) {
      for (const brand of BRAND_KEYWORDS) {
        if (brand.includes(orig.toLowerCase())) {
          const pattern = brand.replace(orig.toLowerCase(), rep);
          if (lower.includes(pattern)) return true;
        }
      }
    }
  }
  return false;
}

export function check_advanced_typosquatting(domain, brandList) {
  const clean = domain.toLowerCase().replace(/[-_.]/g, "");
  let maxSim = 0.0, matchedBrand = null, isTypo = false;

  function seqSim(a, b) {
    const m = Array(a.length + 1).fill(0).map(() => Array(b.length + 1).fill(0));
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        m[i][j] = a[i - 1] === b[j - 1] ? m[i - 1][j - 1] + 1 : Math.max(m[i - 1][j], m[i][j - 1]);
    return m[a.length][b.length] / Math.max(a.length, b.length);
  }

  for (const brand of brandList) {
    if (clean === brand) return [false, 1.0, brand];
    if (clean.includes(brand) && clean.length > brand.length) {
      isTypo = true;
      maxSim = 0.85;
      matchedBrand = brand;
      continue;
    }
    const sim = seqSim(clean, brand);
    if (sim > maxSim) {
      maxSim = sim;
      matchedBrand = brand;
    }
    if (sim >= 0.7 && sim < 1.0) isTypo = true;

    if (has_character_substitution(domain)) {
      for (const [o, r] of [["o", "0"], ["i", "1"], ["l", "1"], ["e", "3"]]) {
        const pattern = brand.replace(o, r);
        if (clean.includes(pattern)) {
          isTypo = true;
          maxSim = 0.8;
          matchedBrand = brand;
          break;
        }
      }
    }
  }

  return [isTypo, maxSim, matchedBrand];
}
