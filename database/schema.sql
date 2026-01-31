-- AI Market Analysis Platform
-- Supabase Database Schema

-- =====================================================
-- USERS & AUTH
-- =====================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'FREE' CHECK (role IN ('FREE', 'PRO', 'ENTERPRISE')),
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    price_alerts BOOLEAN DEFAULT true,
    signal_alerts BOOLEAN DEFAULT true,
    news_digest BOOLEAN DEFAULT false,
    dark_mode BOOLEAN DEFAULT true,
    default_timeframe TEXT DEFAULT '1h',
    show_volume BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================
-- WATCHLISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    asset_symbol TEXT NOT NULL,
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(watchlist_id, asset_symbol)
);

-- =====================================================
-- ALERTS
-- =====================================================

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    asset_symbol TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('PRICE_ABOVE', 'PRICE_BELOW', 'PERCENT_CHANGE', 'AI_SIGNAL')),
    target_value DECIMAL,
    is_active BOOLEAN DEFAULT true,
    is_triggered BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert history
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    asset_symbol TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    triggered_value DECIMAL,
    message TEXT,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AI SIGNALS & PREDICTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_symbol TEXT NOT NULL,
    signal TEXT NOT NULL CHECK (signal IN ('BUY', 'SELL', 'HOLD')),
    confidence DECIMAL NOT NULL,
    trend TEXT CHECK (trend IN ('UP', 'DOWN', 'SIDEWAYS')),
    risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    predicted_price DECIMAL,
    predicted_low DECIMAL,
    predicted_high DECIMAL,
    sentiment_score DECIMAL,
    feature_importance JSONB,
    reasoning TEXT,
    model_used TEXT DEFAULT 'TFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for signal lookups
CREATE INDEX IF NOT EXISTS idx_ai_signals_asset_time 
ON ai_signals(asset_symbol, created_at DESC);

-- =====================================================
-- NEWS & SENTIMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    source TEXT NOT NULL,
    url TEXT UNIQUE,
    published_at TIMESTAMP WITH TIME ZONE,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    sentiment_score DECIMAL,
    sentiment_scores JSONB,
    relevant_assets TEXT[],
    ai_summary TEXT,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for news lookups
CREATE INDEX IF NOT EXISTS idx_news_published 
ON news_articles(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_sentiment 
ON news_articles(sentiment);

-- =====================================================
-- MARKET DATA CACHE
-- =====================================================

CREATE TABLE IF NOT EXISTS asset_metadata (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('crypto', 'stock', 'commodity', 'forex')),
    logo_url TEXT,
    description TEXT,
    market_cap DECIMAL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open DECIMAL NOT NULL,
    high DECIMAL NOT NULL,
    low DECIMAL NOT NULL,
    close DECIMAL NOT NULL,
    volume DECIMAL,
    UNIQUE(asset_symbol, timeframe, timestamp)
);

-- Index for efficient price history queries
CREATE INDEX IF NOT EXISTS idx_price_history_asset_time 
ON price_history(asset_symbol, timeframe, timestamp DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read/update their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- User preferences: Users can only access their own preferences
CREATE POLICY "Users can manage own preferences" 
ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Watchlists: Users can only access their own watchlists
CREATE POLICY "Users can manage own watchlists" 
ON watchlists FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own watchlist items" 
ON watchlist_items FOR ALL USING (auth.uid() = user_id);

-- Alerts: Users can only access their own alerts
CREATE POLICY "Users can manage own alerts" 
ON alerts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own alert history" 
ON alert_history FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
    );
    
    INSERT INTO watchlists (user_id, name)
    VALUES (NEW.id, 'Default');
    
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
