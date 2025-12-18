-- Create visitors table for tracking app visits
CREATE TABLE IF NOT EXISTS visitors (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR,
  session_id VARCHAR,
  page TEXT,
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON visitors(created_at);
CREATE INDEX IF NOT EXISTS idx_visitors_user_id ON visitors(user_id);
CREATE INDEX IF NOT EXISTS idx_visitors_page ON visitors(page);
CREATE INDEX IF NOT EXISTS idx_visitors_date ON visitors(DATE(created_at));
