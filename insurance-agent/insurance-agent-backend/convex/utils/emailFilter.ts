interface EmailInput {
  sender?: string;
  subject?: string;
  snippet?: string;
  attachments?: string[];
}

interface ClassificationResult {
  is_spam: boolean;
  is_insurance_related: boolean;
  category: string;
  confidence: number;
  classified_by: "deterministic" | "groq_fallback";
  deterministic_score?: number; // For logging/debugging
}

interface DeterministicResult {
  score: number;
  isBorderline: boolean; // true if score 3-5
  category: "renewal" | "claim" | "payment" | "new_policy" | "general";
  reason: string;
}

const SPAM_SENDER_TOKENS = ["noreply", "no-reply", "promo", "marketing"];
const SPAM_SUBJECT_KEYWORDS = [
  "free",
  "win",
  "offer",
  "limited time",
  "discount",
  "sale",
  "cashback",
];

// Keywords to STRICTLY EXCLUDE (Stock Market / Trading)
const EXCLUDED_KEYWORDS = [
  "nse",
  "bse",
  "nsdl",
  "cdsl",
  "demat",
  "contract note",
  "trade confirmation",
  "buy order",
  "sell order",
  "equity",
  "derivative",
  "f&o",
  "mutual fund statement", // Unless it's explicitly insurance
  "folio",
  "nav",
];

// Deterministic classification scoring rules
const POLICY_NUMBER_REGEX = /\b[A-Z]{2,}\d{6,}\b/; // Policy number format
const CLAIM_LIFECYCLE_TERMS = [
  "claim",
  "settlement",
  "approval",
  "denied",
  "approved",
  "processing",
  "status",
];
const INSURANCE_KEYWORDS = [
  "policy",
  "premium",
  "renewal",
  "claim",
  "coverage",
  "sum assured",
  "endorsement",
  "policy number",
  "insured",
  "beneficiary",
];
const REGULATORY_PHRASES = [
  "irda",
  "irdai",
  "terms and conditions",
  "policy document",
  "statutory",
  "compliance",
  "regulation",
];

const INSURANCE_PROVIDERS = [
  "lic",
  "hdfc life",
  "icici lombard",
  "bajaj allianz",
  "tata aig",
  "max life",
];

const INSURANCE_ATTACHMENT_KEYWORDS = ["policy", "endorsement", "schedule"];

// Category assignment rules based on keywords
const CATEGORY_RULES: Record<string, string[]> = {
  renewal: ["renew", "expiry", "due", "reminder", "upcoming"],
  claim: ["claim", "settlement", "approval", "denied", "processing"],
  new_policy: ["issued", "welcome", "policy document", "congratulations"],
  payment: ["premium received", "receipt", "payment confirmed", "transaction"],
  loan_repayment: ["emi", "loan statement", "repayment", "outstanding", "principal", "tenure", "installment"],
};

// Keywords for loan REPAYMENT (not loan offers)
const LOAN_REPAYMENT_KEYWORDS = [
  "emi due",
  "loan statement",
  "repayment schedule",
  "outstanding balance",
  "principal outstanding",
  "emi paid",
  "loan account",
  "home loan statement",
  "personal loan statement",
  "car loan statement",
  "auto-debit",
  "installment",
];

const GROQ_API_KEY = process.env.GROQ_API_KEY;

function normalize(text?: string): string {
  return (text || "").toLowerCase();
}

function containsKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

/**
 * Rule-based spam detection (deterministic, no AI)
 */
export function isSpamEmail(email: EmailInput): boolean {
  const sender = normalize(email.sender);
  const subject = normalize(email.subject);
  const snippet = normalize(email.snippet);

  if (SPAM_SENDER_TOKENS.some((token) => sender.includes(token))) return true;
  if (SPAM_SUBJECT_KEYWORDS.some((kw) => subject.includes(kw))) return true;

  // Strict Exclusion for Stock Market / Trading emails
  if (EXCLUDED_KEYWORDS.some((kw) => subject.includes(kw) || snippet.includes(kw))) {
    console.log(`[EmailFilter] Excluded as financial/trading (found: ${subject})`);
    return true; // Treated as spam/excluded for insurance purposes
  }

  // Promotional language heuristic: many exclamation marks or all caps words
  const promoScore = [subject, snippet].filter(Boolean).join(" ");
  const exclamations = (promoScore.match(/!/g) || []).length;
  if (exclamations >= 3) return true;

  const uppercaseWords = promoScore.split(/\s+/).filter((w) => w.length > 4 && w === w.toUpperCase());
  if (uppercaseWords.length >= 3) return true;

  // Non-human sender domains (common promo patterns)
  const senderDomain = sender.split("@")[1] || "";
  if (/(info|promo|offers|marketing)\./.test(senderDomain)) return true;

  return false;
}

/**
 * STAGE 1: Deterministic Insurance Classification
 * 
 * Scoring rules:
 * - Policy number regex match → +5
 * - Insurance keywords in subject → +2
 * - Claim lifecycle terms → +3
 * - Currency + duration coupling (e.g., "$500/year") → +2
 * - Regulatory/legal phrases → +1
 * 
 * Decision thresholds:
 * - score ≥ 6 → insurance=true, source="deterministic"
 * - score ≤ 2 → insurance=false
 * - score 3–5 → borderline=true (triggers Gemini fallback)
 * 
 * This is ALWAYS run first. Gemini is only a fallback validator.
 */
function deterministicInsuranceCheck(email: EmailInput): DeterministicResult {
  const sender = normalize(email.sender);
  const subject = normalize(email.subject);
  const snippet = normalize(email.snippet);
  const combined = `${subject} ${snippet}`;

  let score = 0;
  let reasons: string[] = [];

  // Policy number regex match → +5
  if (POLICY_NUMBER_REGEX.test(combined)) {
    score += 5;
    reasons.push("policy_number_detected");
  }

  // Insurance keywords in subject → +2
  if (containsKeyword(subject, INSURANCE_KEYWORDS)) {
    score += 2;
    reasons.push("insurance_keywords_in_subject");
  }

  // Claim lifecycle terms → +3
  if (containsKeyword(combined, CLAIM_LIFECYCLE_TERMS)) {
    score += 3;
    reasons.push("claim_lifecycle_terms");
  }

  // Currency + duration coupling (e.g., "$500/year") → +2
  if (/\$\d+\/\w+|₹\d+\/\w+|currency\s*\d+\s*\w+/i.test(combined)) {
    score += 2;
    reasons.push("currency_duration_coupling");
  }

  // Regulatory/legal phrases → +1
  if (containsKeyword(combined, REGULATORY_PHRASES)) {
    score += 1;
    reasons.push("regulatory_phrases");
  }

  // Insurance provider names → +2 (additional signal)
  if (INSURANCE_PROVIDERS.some((p) => sender.includes(p) || combined.includes(p))) {
    score += 2;
    reasons.push("insurance_provider_match");
  }

  // Loan/EMI Keywords → +5 (High confidence for Loan Optimizer)
  const LOAN_STRONG_KEYWORDS = ["loan statement", "repayment schedule", "emi alert", "loan account"];
  const LOAN_WEAK_KEYWORDS = ["loan", "emi", "principal", "interest", "installment", "borrower"];

  if (containsKeyword(subject, LOAN_STRONG_KEYWORDS)) {
    score += 5;
    reasons.push("strong_loan_signal");
  } else if (containsKeyword(combined, LOAN_WEAK_KEYWORDS) && containsKeyword(combined, ["statement", "due", "paid"])) {
    score += 3;
    reasons.push("loan_context_detected");
  }

  // Determine category based on keywords
  let category: "renewal" | "claim" | "payment" | "new_policy" | "general" = "general";
  for (const [cat, keywords] of Object.entries(CATEGORY_RULES)) {
    if (containsKeyword(combined, keywords)) {
      category = cat as "renewal" | "claim" | "payment" | "new_policy" | "general";
      break;
    }
  }

  const isBorderline = score >= 3 && score <= 5;

  return {
    score,
    isBorderline,
    category,
    reason: reasons.join(",") || "no_insurance_signals",
  };
}

/**
 * STAGE 2: Groq Fallback Validation
 * 
 * Called ONLY if deterministic score is borderline (3-5).
 * Never used as primary classifier.
 * 
 * Acceptance criteria:
 * - is_insurance === true
 * - confidence >= 0.7
 * 
 * If accepted: source="groq_fallback"
 * If rejected or error: drop email (insurance=false)
 * 
 * NOTE: Groq reasoning is NOT stored in DB (only acceptance/rejection)
 */
async function groqInsuranceFallback(email: EmailInput): Promise<{ isInsurance: boolean; confidence: number }> {
  if (!GROQ_API_KEY) {
    console.log(`[EmailFilter] Groq API key not set, defaulting to deterministic only`);
    return { isInsurance: false, confidence: 0 };
  }

  // Strict validation prompt - Groq validates, doesn't classify
  const prompt = `You are validating whether an email is a legitimate insurance-related communication.

Rules:
- Answer ONLY with valid JSON
- Do NOT guess
- If unsure, return false

Given:
Subject: ${email.subject || ""}
Sender: ${email.sender || ""}
Snippet: ${email.snippet || ""}

Respond with:
{
  "is_insurance": true | false,
  "confidence": number (0-1)
}`;

  try {
    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are an AI email validator. Output strictly valid JSON." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[EmailFilter] Groq validation call failed: ${errText}`);
      return { isInsurance: false, confidence: 0 };
    }

    const data = (await res.json()) as any;
    const text = data.choices[0].message.content || "{}";
    const parsed = JSON.parse(text) as {
      is_insurance?: boolean;
      confidence?: number;
    };

    const isInsurance = Boolean(parsed.is_insurance);
    const confidence = Math.min(Math.max(parsed.confidence || 0, 0), 1);

    // Only accept if is_insurance=true AND confidence >= 0.7
    return { isInsurance, confidence };
  } catch (err) {
    console.warn(`[EmailFilter] Groq fallback error: ${String(err)}, treating as non-insurance`);
    return { isInsurance: false, confidence: 0 };
  }
}

/**
 * Deterministic categorization based on keywords only
 */
function categorizeDeterministic(email: EmailInput): "insurance" | "spam" | "other" {
  const combined = `${normalize(email.subject)} ${normalize(email.snippet)}`;

  for (const keywords of Object.values(CATEGORY_RULES)) {
    if (containsKeyword(combined, keywords)) {
      return "insurance";
    }
  }

  return "insurance"; // All insurance emails get "insurance" category
}

/**
 * MAIN CLASSIFICATION PIPELINE (Two-Stage: Deterministic → Gemini Fallback)
 * 
 * Stage 1: ALWAYS run deterministic rules first
 *   - If score ≥ 6: Return insurance=true (high confidence, deterministic)
 *   - If score ≤ 2: Return insurance=false (low confidence)
 *   - If score 3-5: Mark as borderline, proceed to Stage 2
 * 
 * Stage 2: ONLY for borderline cases
 *   - Call Gemini API as validator (NOT primary classifier)
 *   - Accept ONLY if is_insurance=true AND confidence >= 0.7
 *   - Otherwise treat as non-insurance
 * 
 * This is deterministic-first, AI-assisted, explainable, and production-safe.
 */
export async function classifyEmail(email: EmailInput): Promise<ClassificationResult> {
  // Stage 1: Spam check (deterministic)
  if (isSpamEmail(email)) {
    return {
      is_spam: true,
      is_insurance_related: false,
      category: "spam",
      confidence: 0.95,
      classified_by: "deterministic",
      deterministic_score: -1, // Spam is explicitly marked
    };
  }

  // Stage 1: Deterministic insurance classification
  const deterministicResult = deterministicInsuranceCheck(email);
  const { score, isBorderline, category } = deterministicResult;

  console.log(
    `[EmailFilter] Deterministic score: ${score}, borderline: ${isBorderline}, reason: ${deterministicResult.reason}`
  );

  // High confidence from deterministic rules → finalize immediately
  // score ≥ 6 → insurance=true, return with deterministic source
  if (score >= 6) {
    return {
      is_spam: false,
      is_insurance_related: true,
      category: categorizeDeterministic(email),
      confidence: Math.min(0.8 + (score - 6) * 0.05, 0.95),
      classified_by: "deterministic",
      deterministic_score: score,
    };
  }

  // Very low score → insurance=false, return immediately
  // score ≤ 2 → insurance=false
  if (score <= 2) {
    return {
      is_spam: false,
      is_insurance_related: false,
      category: "other",
      confidence: Math.max(0.2 - score * 0.05, 0),
      classified_by: "deterministic",
      deterministic_score: score,
    };
  }

  // Borderline case (score 3-5): Call Groq API as validator fallback
  // Groq is ONLY used here, never as primary classifier
  console.log(`[EmailFilter] Borderline score (${score}), calling Groq validator...`);
  const groqResult = await groqInsuranceFallback(email);

  // Accept Groq result ONLY if is_insurance=true AND confidence >= 0.7
  if (groqResult.isInsurance && groqResult.confidence >= 0.7) {
    console.log(
      `[EmailFilter] Groq accepted (is_insurance=true, confidence=${groqResult.confidence})`
    );
    return {
      is_spam: false,
      is_insurance_related: true,
      category: categorizeDeterministic(email),
      confidence: groqResult.confidence,
      classified_by: "groq_fallback", // Source tracks that Groq was used
      deterministic_score: score,
    };
  }

  // Groq rejected or low confidence → treat as non-insurance
  console.log(
    `[EmailFilter] Groq rejected or low confidence (is_insurance=${groqResult.isInsurance}, confidence=${groqResult.confidence})`
  );
  return {
    is_spam: false,
    is_insurance_related: false,
    category: "other",
    confidence: Math.min(score * 0.1, 0.3),
    classified_by: "deterministic", // Fell back to deterministic rejection
    deterministic_score: score,
  };
}
