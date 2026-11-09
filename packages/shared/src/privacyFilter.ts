export interface PrivacyScanResult {
  hasPII: boolean;
  detectedTypes: string[];
  cleanText: string;
  originalText: string;
}

// Spelled-out numbers map
const WORD_TO_DIGIT: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  oh: '0',
};

export const CONTACT_REDACTION_NOTICE = '[CONTACT DETAIL REDACTED]';
export const PHONE_REDACTION_NOTICE = '[PHONE NUMBER REDACTED]';

/**
 * Normalizes text:
 * 1. NFKC normalization
 * 2. Strips zero-width and invisible characters
 */
export function normalizeText(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFKC')
    // Remove zero-width spaces, joiners, non-joiners, directional marks, byte order marks
    .replace(/[\u200B-\u200F\uFEFF\u2028-\u202F\u00A0\u2060]/g, '');
}

/**
 * Translates spelled out word numbers into digits for scanning
 */
export function translateWordNumbers(input: string): string {
  let prepared = input.replace(/\+?(\d+)([a-zA-Z])/g, '$1 $2');
  const wordsRegex = /\b(zero|one|two|three|four|five|six|seven|eight|nine|oh)\b/gi;
  return prepared.replace(wordsRegex, (matched) => WORD_TO_DIGIT[matched.toLowerCase()] || matched);
}

/**
 * Privacy Shield V2 Core Scanner
 */
export function scanPrivacyShieldV2(rawInput: string): PrivacyScanResult {
  if (!rawInput) {
    return { hasPII: false, detectedTypes: [], cleanText: '', originalText: '' };
  }

  const normalized = normalizeText(rawInput);
  const detectedTypes = new Set<string>();
  let cleanText = normalized;

  // 1. Standard Email Regex
  const standardEmailRegex =
    /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/gi;

  if (standardEmailRegex.test(cleanText)) {
    detectedTypes.add('EMAIL');
    cleanText = cleanText.replace(standardEmailRegex, CONTACT_REDACTION_NOTICE);
  }

  // 2. Obfuscated Emails: "name at domain dot com", "name[at]domain[dot]com", "name(at)domain(dot)com"
  // Handles multi-level subdomains: alex.mentor[at]alum[dot]mit[dot]edu, student.test[at]iit[dot]ac[dot]in
  const obfuscatedEmailRegex =
    /\b[a-zA-Z0-9._%+-]+\s*(?:\[at\]|\(at\)|@|\bat\b)\s*[a-zA-Z0-9.-]+(?:\s*(?:\[dot\]|\(dot\)|\.|\bdot\b)\s*[a-zA-Z0-9.-]+)*\s*(?:\[dot\]|\(dot\)|\.|\bdot\b)\s*(?:com|org|net|edu|gov|io|ai|co|in|me|info|biz|ac)\b/gi;

  if (obfuscatedEmailRegex.test(cleanText)) {
    detectedTypes.add('EMAIL');
    detectedTypes.add('OBFUSCATED_EMAIL');
    cleanText = cleanText.replace(obfuscatedEmailRegex, CONTACT_REDACTION_NOTICE);
  }

  // 3. Indian & Global UPI Handles
  const upiRegex =
    /\b[a-zA-Z0-9.\-_]{2,256}@(oksbi|okhdfcbank|okicici|okaxis|paytm|ybl|ibl|upi|apl|axl|federal|sbi|hdfc|icici|axis)\b/gi;

  if (upiRegex.test(cleanText)) {
    detectedTypes.add('UPI_HANDLE');
    cleanText = cleanText.replace(upiRegex, CONTACT_REDACTION_NOTICE);
  }

  // 4. Social Media Links & Chat Handles
  const socialLinksRegex =
    /\b(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in|t\.me|telegram\.me|telegram\.dog|wa\.me|chat\.whatsapp\.com|instagram\.com|instagr\.am|twitter\.com|x\.com|discord\.gg|discord\.com\/invite|github\.com)\/[a-zA-Z0-9_\-./]+/gi;

  if (socialLinksRegex.test(cleanText)) {
    detectedTypes.add('SOCIAL_LINK');
    cleanText = cleanText.replace(socialLinksRegex, CONTACT_REDACTION_NOTICE);
  }

  // 5. Direct Social Handle Mentions (e.g. "@telegram: my_user", "tg: @user", "insta: user")
  const socialHandleMentionRegex =
    /(?:telegram|tg|insta|instagram|ig|snap|snapchat|twitter|discord|wa|whatsapp)\s*[:=-]?\s*@?[a-zA-Z0-9_.]{3,30}\b/gi;

  if (socialHandleMentionRegex.test(cleanText)) {
    detectedTypes.add('SOCIAL_HANDLE');
    cleanText = cleanText.replace(socialHandleMentionRegex, CONTACT_REDACTION_NOTICE);
  }

  // 6. Phone Numbers (Standard, +91, Spaced Digits, Parenthesized, and Word Numbers)
  // First, check spelled-out word phones
  const spelledOutPhoneRegex =
    /(?:\+?91[\s-]*)?(?:(?:zero|one|two|three|four|five|six|seven|eight|nine|oh)[\s.-]*){7,15}/gi;

  if (spelledOutPhoneRegex.test(cleanText)) {
    detectedTypes.add('PHONE');
    detectedTypes.add('PHONE_NUMBER');
    cleanText = cleanText.replace(spelledOutPhoneRegex, PHONE_REDACTION_NOTICE);
  }

  // Standard, international and grouped phone formats
  const phonePatterns = [
    /(?:\+?\d{1,3}[\s.-]*)?(?:\(?\d{2,5}\)?[\s.-]*)+\d{3,5}\b/g,
    /(?:\d[\s.-]*){10,14}\b/g,
  ];

  for (const pattern of phonePatterns) {
    const matches = cleanText.match(pattern);
    if (matches) {
      for (const m of matches) {
        const digitCount = m.replace(/\D/g, '').length;
        if (digitCount >= 7 && digitCount <= 15) {
          detectedTypes.add('PHONE');
          detectedTypes.add('PHONE_NUMBER');
          cleanText = cleanText.replace(m, PHONE_REDACTION_NOTICE);
        }
      }
    }
  }

  // Fallback: translate any word numbers and check again
  const translated = translateWordNumbers(cleanText);
  if (translated !== cleanText) {
    for (const pattern of phonePatterns) {
      const matches = translated.match(pattern);
      if (matches) {
        for (const m of matches) {
          const digitCount = m.replace(/\D/g, '').length;
          if (digitCount >= 7 && digitCount <= 15) {
            detectedTypes.add('PHONE');
            detectedTypes.add('PHONE_NUMBER');
            cleanText = PHONE_REDACTION_NOTICE;
          }
        }
      }
    }
  }

  return {
    hasPII: detectedTypes.size > 0,
    detectedTypes: Array.from(detectedTypes),
    cleanText: cleanText.trim(),
    originalText: rawInput,
  };
}
