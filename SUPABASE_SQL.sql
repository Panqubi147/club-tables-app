CREATE TABLE IF NOT EXISTS game_sessions (
    id BIGSERIAL PRIMARY KEY,
    table_number INT NOT NULL,
    table_type TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INT,
    hourly_rate NUMERIC(10,2),
    base_price NUMERIC(10,2),
    member_discount_applied BOOLEAN DEFAULT FALSE,
    discount_name TEXT,
    discount_percent INT DEFAULT 0,
    final_price NUMERIC(10,2),
    day_type TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS table_type TEXT;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2);
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS member_discount_applied BOOLEAN DEFAULT FALSE;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Allow public insert game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Allow public update game sessions" ON game_sessions;

CREATE POLICY "Allow public read game sessions"
ON game_sessions
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert game sessions"
ON game_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update game sessions"
ON game_sessions
FOR UPDATE
USING (true)
WITH CHECK (true);
