-- Same mapping as TRANSACTION_TYPES in src/lib/enable-banking.ts
UPDATE "transactions" SET "type" = CASE "bank_data"->'bank_transaction_code'->>'code'
  WHEN 'REV_PAYMENT' THEN 'card_payment'
  WHEN 'CARD_REFUND' THEN 'refund'
  WHEN 'REV_PAYMENT_REFUND' THEN 'refund'
  WHEN 'ATM' THEN 'atm'
  WHEN 'FEE' THEN 'fee'
  WHEN 'CHARGE' THEN 'fee'
  WHEN 'REWARD' THEN 'reward'
  WHEN 'CASHBACK' THEN 'reward'
END
WHERE "type" = 'other' AND "bank_data"->'bank_transaction_code'->>'code' IN ('REV_PAYMENT', 'CARD_REFUND', 'REV_PAYMENT_REFUND', 'ATM', 'FEE', 'CHARGE', 'REWARD', 'CASHBACK');
