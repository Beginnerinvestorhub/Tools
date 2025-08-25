-- Seed data for Personalized Learning Path with AI Behavioral Nudge System
-- Initial data for Phase 1: Backend & Database Foundation

-- Insert Risk Profiles
INSERT INTO risk_profiles (name, description, min_score, max_score) VALUES
('conservative', 'Low risk tolerance, prefers stable investments with minimal volatility', 0, 30),
('moderate', 'Balanced approach, comfortable with some risk for potential growth', 31, 70),
('aggressive', 'High risk tolerance, seeks maximum growth potential despite volatility', 71, 100)
ON CONFLICT (name) DO NOTHING;

-- Insert Learning Paths
INSERT INTO learning_paths (name, description, difficulty_level, estimated_duration_hours, target_risk_profile) VALUES
('Investing Fundamentals', 'Complete beginner guide to investing basics, market concepts, and terminology', 'beginner', 8, NULL),
('Conservative Investor Path', 'Focus on bonds, dividend stocks, and low-risk investment strategies', 'beginner', 12, 'conservative'),
('Balanced Portfolio Builder', 'Learn to create diversified portfolios with mixed asset allocation', 'intermediate', 15, 'moderate'),
('Growth Investment Strategies', 'Advanced techniques for growth investing and higher-risk opportunities', 'intermediate', 18, 'aggressive'),
('Risk Management Mastery', 'Advanced risk assessment and portfolio protection strategies', 'advanced', 20, NULL)
ON CONFLICT DO NOTHING;

-- Insert Learning Content for Investing Fundamentals Path
INSERT INTO learning_content (title, content_type, content_body, difficulty_level, estimated_duration_minutes, points_value, tags) VALUES
('What is Investing?', 'lesson', 'Introduction to the concept of investing, why people invest, and basic terminology.', 'beginner', 15, 50, '["basics", "terminology", "introduction"]'),
('Types of Investments', 'lesson', 'Overview of stocks, bonds, mutual funds, ETFs, and other investment vehicles.', 'beginner', 20, 75, '["stocks", "bonds", "etfs", "mutual_funds"]'),
('Risk vs Return', 'lesson', 'Understanding the relationship between risk and potential returns in investing.', 'beginner', 18, 60, '["risk", "return", "fundamentals"]'),
('Market Basics Quiz', 'quiz', 'Test your knowledge of basic market concepts and investment types.', 'beginner', 10, 100, '["quiz", "assessment", "basics"]'),
('Your First Investment Account', 'lesson', 'Step-by-step guide to opening and funding your first investment account.', 'beginner', 25, 80, '["practical", "account_setup", "getting_started"]'),
('Dollar-Cost Averaging', 'lesson', 'Learn about systematic investing and how to reduce timing risk.', 'beginner', 22, 70, '["strategy", "dollar_cost_averaging", "systematic_investing"]'),
('Diversification Basics', 'lesson', 'Why putting all eggs in one basket is risky and how to spread investments.', 'beginner', 20, 65, '["diversification", "risk_management", "portfolio"]'),
('Investment Fees and Costs', 'lesson', 'Understanding expense ratios, trading fees, and how costs impact returns.', 'beginner', 18, 55, '["fees", "costs", "expense_ratios"]'),
('Fundamentals Challenge', 'challenge', 'Apply your knowledge by building a sample beginner portfolio.', 'beginner', 30, 150, '["challenge", "portfolio_building", "practical"]')
ON CONFLICT DO NOTHING;

-- Insert Learning Content for Conservative Investor Path
INSERT INTO learning_content (title, content_type, content_body, difficulty_level, estimated_duration_minutes, points_value, tags) VALUES
('Bond Investing Basics', 'lesson', 'Understanding government and corporate bonds, yields, and bond risks.', 'beginner', 25, 80, '["bonds", "fixed_income", "conservative"]'),
('Dividend Investing Strategy', 'lesson', 'How to identify and invest in dividend-paying stocks for income.', 'beginner', 30, 90, '["dividends", "income_investing", "stocks"]'),
('Treasury Securities', 'lesson', 'T-bills, T-notes, and T-bonds as safe investment options.', 'beginner', 20, 70, '["treasury", "government_bonds", "safe_investments"]'),
('CD and Savings Strategies', 'lesson', 'Certificates of deposit and high-yield savings as conservative options.', 'beginner', 15, 50, '["cds", "savings", "conservative", "fdic_insured"]'),
('Conservative Portfolio Quiz', 'quiz', 'Test your knowledge of conservative investment strategies.', 'beginner', 12, 100, '["quiz", "conservative", "assessment"]'),
('REIT Investing', 'lesson', 'Real Estate Investment Trusts for conservative real estate exposure.', 'intermediate', 28, 85, '["reits", "real_estate", "income"]'),
('Conservative Challenge', 'challenge', 'Build a conservative portfolio focused on income and capital preservation.', 'beginner', 35, 175, '["challenge", "conservative_portfolio", "practical"]')
ON CONFLICT DO NOTHING;

-- Insert Learning Content for Balanced Portfolio Builder Path
INSERT INTO learning_content (title, content_type, content_body, difficulty_level, estimated_duration_minutes, points_value, tags) VALUES
('Asset Allocation Principles', 'lesson', 'How to divide investments across different asset classes.', 'intermediate', 30, 100, '["asset_allocation", "portfolio", "diversification"]'),
('Modern Portfolio Theory', 'lesson', 'Understanding efficient frontiers and optimal portfolio construction.', 'intermediate', 35, 120, '["mpt", "portfolio_theory", "optimization"]'),
('Rebalancing Strategies', 'lesson', 'When and how to rebalance your portfolio to maintain target allocation.', 'intermediate', 25, 90, '["rebalancing", "maintenance", "strategy"]'),
('International Diversification', 'lesson', 'Adding international stocks and bonds to reduce portfolio risk.', 'intermediate', 28, 95, '["international", "global_investing", "diversification"]'),
('Target-Date Funds', 'lesson', 'Understanding lifecycle funds and their role in balanced investing.', 'intermediate', 22, 80, '["target_date_funds", "lifecycle", "automated_investing"]'),
('Balanced Portfolio Quiz', 'quiz', 'Test your understanding of balanced portfolio construction.', 'intermediate', 15, 120, '["quiz", "balanced", "portfolio", "assessment"]'),
('Portfolio Builder Challenge', 'challenge', 'Create a balanced portfolio using modern portfolio theory principles.', 'intermediate', 40, 200, '["challenge", "balanced_portfolio", "mpt", "practical"]')
ON CONFLICT DO NOTHING;

-- Link Learning Content to Learning Paths
INSERT INTO learning_path_content (learning_path_id, learning_content_id, sequence_order, is_required) VALUES
-- Investing Fundamentals Path (ID 1)
(1, 1, 1, true),   -- What is Investing?
(1, 2, 2, true),   -- Types of Investments
(1, 3, 3, true),   -- Risk vs Return
(1, 4, 4, true),   -- Market Basics Quiz
(1, 5, 5, true),   -- Your First Investment Account
(1, 6, 6, true),   -- Dollar-Cost Averaging
(1, 7, 7, true),   -- Diversification Basics
(1, 8, 8, true),   -- Investment Fees and Costs
(1, 9, 9, true),   -- Fundamentals Challenge

-- Conservative Investor Path (ID 2)
(2, 10, 1, true),  -- Bond Investing Basics
(2, 11, 2, true),  -- Dividend Investing Strategy
(2, 12, 3, true),  -- Treasury Securities
(2, 13, 4, true),  -- CD and Savings Strategies
(2, 14, 5, true),  -- Conservative Portfolio Quiz
(2, 15, 6, false), -- REIT Investing (optional)
(2, 16, 7, true),  -- Conservative Challenge

-- Balanced Portfolio Builder Path (ID 3)
(3, 17, 1, true),  -- Asset Allocation Principles
(3, 18, 2, true),  -- Modern Portfolio Theory
(3, 19, 3, true),  -- Rebalancing Strategies
(3, 20, 4, true),  -- International Diversification
(3, 21, 5, false), -- Target-Date Funds (optional)
(3, 22, 6, true),  -- Balanced Portfolio Quiz
(3, 23, 7, true)   -- Portfolio Builder Challenge
ON CONFLICT DO NOTHING;
