-- Stripe subscription linkage. Additive only.
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users (stripe_customer_id);
