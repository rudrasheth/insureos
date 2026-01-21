-- Run this in your Supabase SQL Editor to create the missing table

CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
    loan_type TEXT, 
    lender_name TEXT,
    principal_amount NUMERIC,
    interest_rate NUMERIC,
    emi_amount NUMERIC,
    tenure_months INTEGER,
    remaining_tenure_months INTEGER,
    outstanding_balance NUMERIC,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
