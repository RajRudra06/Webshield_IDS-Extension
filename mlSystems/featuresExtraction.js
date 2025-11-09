import { shannon_entropy, longest_repeated_char, vowel_consonant_ratio,
    get_tld_category, count_ngrams, safe_max_len_list,
    safe_max_match_length, has_character_substitution,
    check_advanced_typosquatting } from "./featureExtractionHelper.js";
import { LEGITIMATE_BRAND_DOMAINS, BRAND_KEYWORDS } from "./constants/legimateBrandDomains.js";

export function extract_features_enhanced(url) {
const features = {};
try {
if (typeof url !== "string" || url.trim().length === 0)
 throw new Error("Invalid or empty URL string");

url = Array.from(url).filter(c => 32 <= c.charCodeAt(0) && c.charCodeAt(0) <= 126).join("");

const u = new URL(url.includes("://") ? url : "https://" + url);
const netloc = u.hostname;
const path = u.pathname;
const query = u.search.replace(/^\?/, "");
const parts = netloc.split(".");
const suffix = parts.pop() || "";
const domain = parts.pop() || "";
const subdomain = parts.join(".");

const lowerUrl = url.toLowerCase();

features["url_length"] = url.length;
features["num_dots"] = (url.match(/\./g) || []).length;
features["num_hyphens"] = (url.match(/-/g) || []).length;
features["num_underscores"] = (url.match(/_/g) || []).length;
features["num_digits"] = (url.match(/\d/g) || []).length;
features["num_letters"] = (url.match(/[a-zA-Z]/g) || []).length;
features["num_special_chars"] = (url.match(/[@?=%&!+$]/g) || []).length;
features["has_ip"] = /^\d+\.\d+\.\d+\.\d+$/.test(netloc) ? 1 : 0;
features["num_subdomains"] = subdomain ? subdomain.split(".").length : 0;
features["has_multiple_subdomains"] = features["num_subdomains"] >= 3 ? 1 : 0;

features["domain_length"] = domain.length;
features["host_entropy"] = shannon_entropy(domain);
features["domain_entropy"] = shannon_entropy(domain);
features["domain_has_digits"] = /\d/.test(domain) ? 1 : 0;
features["domain_digit_ratio"] = domain.length ? (domain.match(/\d/g) || []).length / domain.length : 0;
features["domain_vowel_ratio"] = vowel_consonant_ratio(domain);
features["domain_bigram_diversity"] = domain.length >= 2 ? count_ngrams(domain, 2) / domain.length : 0;
features["domain_trigram_diversity"] = domain.length >= 3 ? count_ngrams(domain, 3) / domain.length : 0;
features["suspicious_prefix_suffix"] = domain.startsWith("www-") || domain.startsWith("m-") || domain.includes("-") ? 1 : 0;
features["num_suspicious_symbols"] = (domain.match(/[@!*]/g) || []).length;
features["subdomain_length"] = subdomain.length;
features["domain_is_dictionary_word"] = BRAND_KEYWORDS.includes(domain.toLowerCase()) ? 1 : 0;

features["tld_length"] = suffix.length;
features["tld_trust_category"] = get_tld_category(suffix.toLowerCase());
features["is_suspicious_tld"] = ["tk","ml","ga","cf","gq","pw","cc","top","xyz","club","work","info","biz","buzz","loan"].includes(suffix.toLowerCase()) ? 1 : 0;
features["is_high_trust_tld"] = ["com","org","net","edu","gov","mil","in","co.in","ac.in","gov.in"].includes(suffix.toLowerCase()) ? 1 : 0;
features["is_country_tld"] = suffix.length === 2 && /^[a-z]+$/.test(suffix) ? 1 : 0;

features["path_length"] = path.length;
features["num_path_segments"] = path.split("/").filter(Boolean).length;
features["num_query_params"] = query ? query.split("&").length : 0;
features["query_length"] = query.length;
features["num_encoded_chars"] = (url.match(/%/g) || []).length;
features["num_fragments"] = (url.match(/#/g) || []).length;
features["path_entropy"] = shannon_entropy(path);
features["path_has_suspicious_ext"] = /\.(exe|zip|apk|scr|bat|cmd)$/i.test(path) ? 1 : 0;
features["query_has_redirect"] = /(redirect|url=|next=|continue=|return=)/i.test(query) ? 1 : 0;
features["path_url_ratio"] = url.length ? path.length / url.length : 0;

const suspiciousWords = ['login','secure','update','account','verify','confirm','click','bank','paypal','signin','password','urgent','suspended','locked','expire','reward','prize','winner','claim','free','wallet','kyc','blocked','reactivate'];
features["suspicious_word"] = suspiciousWords.some(w => lowerUrl.includes(w)) ? 1 : 0;
features["num_suspicious_words"] = suspiciousWords.filter(w => lowerUrl.includes(w)).length;
features["sensitive_word"] = /(bank|paypal|account|password|credit|card|wallet|upi)/i.test(url) ? 1 : 0;
features["action_word"] = /(click|verify|confirm|update|download|install)/i.test(url) ? 1 : 0;
features["has_brand_name"] = BRAND_KEYWORDS.some(b => lowerUrl.includes(b)) ? 1 : 0;

const brandInDomain = BRAND_KEYWORDS.some(b => domain.toLowerCase().includes(b));
const brandInUrl = BRAND_KEYWORDS.some(b => lowerUrl.includes(b));
features["brand_not_in_domain"] = brandInUrl && !brandInDomain ? 1 : 0;

features["is_shortening_service"] = /(bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly|is\.gd|buff\.ly)/.test(url) ? 1 : 0;
features["is_mixed_case"] = /[A-Z]/.test(url) && /[a-z]/.test(url) ? 1 : 0;

features["num_repeated_chars"] = longest_repeated_char(url);
features["longest_token_length"] = safe_max_len_list(url.split(/[./?=&_-]/).map(t => t.length));
features["digit_letter_ratio"] = features["num_letters"] > 0 ? features["num_digits"] / features["num_letters"] : 0;
features["special_char_ratio"] = url.length ? features["num_special_chars"] / url.length : 0;
features["uppercase_ratio"] = url.length ? (url.match(/[A-Z]/g) || []).length / url.length : 0;
features["consecutive_consonants"] = safe_max_match_length("[bcdfghjklmnpqrstvwxyz]+", lowerUrl);

features["url_entropy"] = shannon_entropy(url);
features["has_port"] = /:/.test(netloc) && !netloc.startsWith("[") ? 1 : 0;
features["uses_https"] = u.protocol === "https:" ? 1 : 0;
features["punycode_domain"] = domain.includes("xn--") ? 1 : 0;
features["subdomain_count_dot"] = subdomain ? (subdomain.match(/\./g) || []).length : 0;

features["domain_url_ratio"] = url.length ? domain.length / url.length : 0;
features["query_url_ratio"] = url.length ? query.length / url.length : 0;

const fullDomain = suffix ? `${domain}.${suffix}`.toLowerCase() : domain.toLowerCase();
const isLegitimate = LEGITIMATE_BRAND_DOMAINS.has(fullDomain);
const brandInDomainCheck = brandInDomain;

features["brand_impersonation"] = brandInDomainCheck && !isLegitimate ? 1 : 0;
const hasHyphen = domain.includes("-");
features["brand_with_hyphen"] = brandInDomainCheck && hasHyphen && !isLegitimate ? 1 : 0;

const [isTypo, similarity, matchedBrand] = check_advanced_typosquatting(domain, BRAND_KEYWORDS);
features["is_typosquatting"] = isTypo ? 1 : 0;
features["typosquatting_similarity"] = similarity;
features["has_character_substitution"] = has_character_substitution(domain) ? 1 : 0;

const suspiciousTLDs = ['tk','ml','ga','cf','gq','pw','top','xyz','club','buzz','loan','work','click'];
features["suspicious_tld_brand_combo"] = suspiciousTLDs.includes(suffix.toLowerCase()) && brandInDomainCheck && !isLegitimate ? 1 : 0;

const brandCount = BRAND_KEYWORDS.filter(b => domain.toLowerCase().includes(b)).length;
features["multiple_brands_in_domain"] = brandCount >= 2 ? 1 : 0;
features["brand_not_in_main_domain"] = brandInUrl && !brandInDomainCheck ? 1 : 0;
} catch (e) {
console.error(`⚠️ Error processing URL ${url}:`, e);
// Fallback zeroed features (optional)
}
return features;
}
