/*
  # Ordinal Lending Platform Database Schema

  ## Overview
  This migration sets up the complete database schema for the Ordinal Lending Platform,
  enabling users to track their Bitcoin Ordinal collateral loans and repayment history.

  ## 1. New Tables

  ### `users`
  Stores user authentication and wallet information
  - `id` (uuid, primary key) - Unique user identifier
  - `principal_id` (text, unique) - Internet Computer Principal ID
  - `btc_address` (text) - Bitcoin wallet address
  - `created_at` (timestamptz) - Account creation timestamp
  - `last_login` (timestamptz) - Last login timestamp

  ### `ordinals`
  Stores information about Bitcoin Ordinals used as collateral
  - `id` (uuid, primary key) - Unique ordinal record identifier
  - `utxo` (text, unique) - Bitcoin UTXO identifier
  - `inscription_id` (text, unique) - Ordinal inscription identifier
  - `image_url` (text) - URL to ordinal image/content
  - `satoshi_value` (bigint) - Value in satoshis
  - `estimated_btc_value` (numeric) - Estimated value in BTC
  - `user_id` (uuid, foreign key) - Owner user reference
  - `created_at` (timestamptz) - Record creation timestamp

  ### `loans`
  Tracks all loan positions and their current status
  - `id` (uuid, primary key) - Unique loan identifier
  - `user_id` (uuid, foreign key) - Borrower user reference
  - `ordinal_id` (uuid, foreign key) - Collateral ordinal reference
  - `borrowed_amount` (numeric) - Amount borrowed in ckBTC
  - `remaining_amount` (numeric) - Amount still owed in ckBTC
  - `ltv_ratio` (numeric) - Loan-to-value ratio (percentage)
  - `status` (text) - Loan status: ACTIVE, REPAID, or LIQUIDATED
  - `created_at` (timestamptz) - Loan creation timestamp
  - `repaid_at` (timestamptz, nullable) - Full repayment timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `repayments`
  Records all repayment transactions for audit trail
  - `id` (uuid, primary key) - Unique repayment identifier
  - `loan_id` (uuid, foreign key) - Associated loan reference
  - `amount` (numeric) - Repayment amount in ckBTC
  - `transaction_id` (text) - Blockchain transaction identifier
  - `created_at` (timestamptz) - Repayment timestamp

  ## 2. Security (Row Level Security)
  
  All tables have RLS enabled with restrictive policies:
  - Users can only access their own data
  - All operations require authentication via Internet Identity
  - No public access to any sensitive information

  ### RLS Policies Created:
  
  #### users table
  - SELECT: Users can view their own profile only
  - INSERT: Authenticated users can create their own profile
  - UPDATE: Users can update their own profile only
  
  #### ordinals table
  - SELECT: Users can view only their own ordinals
  - INSERT: Authenticated users can add their own ordinals
  - UPDATE: Users can update only their own ordinals
  
  #### loans table
  - SELECT: Users can view only their own loans
  - INSERT: Authenticated users can create loans with their ordinals
  - UPDATE: Users can update only their own loans
  
  #### repayments table
  - SELECT: Users can view repayments for their own loans
  - INSERT: Authenticated users can record repayments for their loans

  ## 3. Indexes
  
  Performance indexes created for common query patterns:
  - `idx_users_principal` on users(principal_id)
  - `idx_ordinals_utxo` on ordinals(utxo)
  - `idx_ordinals_user` on ordinals(user_id)
  - `idx_loans_user` on loans(user_id)
  - `idx_loans_status` on loans(status)
  - `idx_repayments_loan` on repayments(loan_id)

  ## 4. Important Notes
  
  - All monetary values use NUMERIC type for precision
  - Timestamps use timestamptz for timezone awareness
  - Foreign key constraints ensure referential integrity
  - Default values prevent null issues
  - RLS policies are restrictive by default for security
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_id text UNIQUE NOT NULL,
  btc_address text,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz DEFAULT now()
);

-- Create ordinals table
CREATE TABLE IF NOT EXISTS ordinals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utxo text UNIQUE NOT NULL,
  inscription_id text UNIQUE NOT NULL,
  image_url text NOT NULL,
  satoshi_value bigint NOT NULL DEFAULT 0,
  estimated_btc_value numeric(16, 8) NOT NULL DEFAULT 0,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ordinal_id uuid NOT NULL REFERENCES ordinals(id) ON DELETE CASCADE,
  borrowed_amount numeric(16, 8) NOT NULL DEFAULT 0,
  remaining_amount numeric(16, 8) NOT NULL DEFAULT 0,
  ltv_ratio numeric(5, 2) NOT NULL DEFAULT 50.00,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REPAID', 'LIQUIDATED')),
  created_at timestamptz DEFAULT now(),
  repaid_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Create repayments table
CREATE TABLE IF NOT EXISTS repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount numeric(16, 8) NOT NULL DEFAULT 0,
  transaction_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_principal ON users(principal_id);
CREATE INDEX IF NOT EXISTS idx_ordinals_utxo ON ordinals(utxo);
CREATE INDEX IF NOT EXISTS idx_ordinals_user ON ordinals(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_repayments_loan ON repayments(loan_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordinals ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (principal_id = current_setting('app.current_principal_id', true));

CREATE POLICY "Users can create own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (principal_id = current_setting('app.current_principal_id', true));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (principal_id = current_setting('app.current_principal_id', true))
  WITH CHECK (principal_id = current_setting('app.current_principal_id', true));

-- RLS Policies for ordinals table
CREATE POLICY "Users can view own ordinals"
  ON ordinals FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users
      WHERE principal_id = current_setting('app.current_principal_id', true)
    )
  );

CREATE POLICY "Users can add own ordinals"
  ON ordinals FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM users
      WHERE principal_id = current_setting('app.current_principal_id', true)
    )
  );

CREATE POLICY "Users can update own ordinals"
  ON ordinals FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users
      WHERE principal_id = current_setting('app.current_principal_id', true)
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM users
      WHERE principal_id = current_setting('app.current_principal_id', true)
    )
  );

-- RLS Policies for loans table
CREATE POLICY "Users can view own loans"
  ON loans FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users
      WHERE principal_id = current_setting('app.current_principal_id', true)
    )
  );

CREATE POLICY "Users can create own loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM users
      WHERE principal_id = current_setting('app.current_principal_id', true)
    )
  );

CREATE POLICY "Users can update own loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users
      WHERE principal_id = current_setting('app.current_principal_id', true)
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM users
      WHERE principal_id = current_setting('app.current_principal_id', true)
    )
  );

-- RLS Policies for repayments table
CREATE POLICY "Users can view own repayments"
  ON repayments FOR SELECT
  TO authenticated
  USING (
    loan_id IN (
      SELECT l.id FROM loans l
      INNER JOIN users u ON l.user_id = u.id
      WHERE u.principal_id = current_setting('app.current_principal_id', true)
    )
  );

CREATE POLICY "Users can create own repayments"
  ON repayments FOR INSERT
  TO authenticated
  WITH CHECK (
    loan_id IN (
      SELECT l.id FROM loans l
      INNER JOIN users u ON l.user_id = u.id
      WHERE u.principal_id = current_setting('app.current_principal_id', true)
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to loans table
DROP TRIGGER IF EXISTS update_loans_updated_at ON loans;
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
