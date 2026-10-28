// Exchanges, top-ups and corrections move money between the user's own accounts or fix a balance.
// They have no merchant, and don't count in analytics unless they get a category of their own.
export const TYPES_WITHOUT_MERCHANT = ['exchange', 'topup', 'correction'];

// Card processors that prefix the merchant's name, like "Payu*emag.ro" or "Helopay Iron Bar"
const PROCESSOR_PREFIX = /^(payu|paypal|sumup|sq|zettle|otpmobl)\s*[*_]\s*|^helopay\s+/;

// Legal forms and their dotted spellings split into letters ("S.r.l." -> "s r l"), and the
// Hungarian store number suffix ("Aldi 67.sz.")
const IGNORED_WORDS = new Set(
  'srl s r l sa a kft zrt nyrt bt ltd limited gmbh bv b v spa p inc llc sas ag plc sro sz'.split(
    ' ',
  ),
);

interface TransactionFields {
  type: string;
  counterpartyName: string;
  description: string;
}

/**
 * Returns the name of the transaction's merchant as the bank wrote it, or null if the transaction
 * has no merchant.
 */
export function getMerchantName({ type, counterpartyName, description }: TransactionFields) {
  if (TYPES_WITHOUT_MERCHANT.includes(type)) {
    return null;
  }

  // Refunds name the user as the counterparty and the merchant in the description
  const name =
    type === 'refund'
      ? description.replace(/^refund from /i, '')
      : counterpartyName ||
        // Transfers without a counterparty name the payee last: "N-123 To Nueva Kft."
        (type === 'transfer'
          ? description
              .split(' To ')
              .at(-1)!
              .replace(/^(to|from) /i, '')
          : description);

  return name.trim() || null;
}

/**
 * Returns the normalized merchant name, which groups the transactions of a merchant. The branches
 * of a chain and the spellings of a name share it: "Lidl Hu 339 Budapest" and "Lidl Hu 346
 * Budapest" both become "lidl hu budapest".
 */
export function getMerchantKey(transaction: TransactionFields) {
  const name = getMerchantName(transaction);
  if (!name) {
    return null;
  }

  const normalized = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    // Revolut writes Hungarian accents after the letter: "Gyo'gyszerta'r", "O:nkiszolg"
    .replace(/(?<=\p{L})['’:](?=\p{L})/gu, '')
    .replace(PROCESSOR_PREFIX, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  // Words with digits are store numbers, dates and references
  const key = normalized
    .split(' ')
    .filter((word) => !/\d/.test(word) && !IGNORED_WORDS.has(word))
    .join(' ');

  return key || normalized || null;
}
