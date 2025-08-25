-- Gamification seed data - badges and achievements
-- Insert all badge definitions into the database

-- Insert badges
INSERT INTO badges (id, name, description, icon, category, points, rarity) VALUES
-- Education Badges
('first_steps', 'First Steps', 'Complete your first risk assessment', '🎯', 'education', 100, 'common'),
('knowledge_seeker', 'Knowledge Seeker', 'Use 5 different investment tools', '📚', 'education', 250, 'rare'),
('investment_guru', 'Investment Guru', 'Master all investment tools', '🧠', 'education', 500, 'epic'),

-- Investment Badges
('portfolio_builder', 'Portfolio Builder', 'Create your first portfolio', '💼', 'investment', 150, 'common'),
('diversification_master', 'Diversification Master', 'Create a well-diversified portfolio', '📊', 'investment', 300, 'rare'),
('esg_champion', 'ESG Champion', 'Use ESG screening for sustainable investing', '🌱', 'investment', 200, 'rare'),
('fractional_pioneer', 'Fractional Pioneer', 'Calculate fractional shares for affordable investing', '🔢', 'investment', 150, 'common'),

-- Engagement Badges
('daily_visitor', 'Daily Visitor', 'Log in for 7 consecutive days', '📅', 'engagement', 200, 'rare'),
('weekly_warrior', 'Weekly Warrior', 'Maintain a 30-day login streak', '🔥', 'engagement', 400, 'epic'),
('learning_streak', 'Learning Streak', 'Complete learning activities for 14 days', '⚡', 'engagement', 350, 'epic'),

-- Milestone Badges
('century_club', 'Century Club', 'Earn 1,000 total points', '💯', 'milestone', 100, 'rare'),
('platinum_investor', 'Platinum Investor', 'Reach Level 10', '💎', 'milestone', 1000, 'legendary'),
('early_adopter', 'Early Adopter', 'One of the first 100 users', '🚀', 'milestone', 500, 'legendary'),

-- Social Badges
('community_helper', 'Community Helper', 'Share your achievements', '🤝', 'social', 150, 'common'),
('referral_champion', 'Referral Champion', 'Invite 5 friends to join', '👥', 'social', 300, 'rare')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category,
    points = EXCLUDED.points,
    rarity = EXCLUDED.rarity;

-- Insert achievements
INSERT INTO achievements (id, name, description, type, target, reward_points, reward_badge_id) VALUES
('first_risk_assessment', 'Risk Assessment Complete', 'Complete your first risk assessment', 'first_risk_assessment', 1, 100, 'first_steps'),
('tools_explorer', 'Tools Explorer', 'Try 5 different investment tools', 'tools_mastery', 5, 250, 'knowledge_seeker'),
('portfolio_creator', 'Portfolio Creator', 'Create your first portfolio', 'portfolio_created', 1, 150, 'portfolio_builder'),
('login_streak_7', '7-Day Streak', 'Log in for 7 consecutive days', 'login_streak', 7, 200, 'daily_visitor'),
('login_streak_30', '30-Day Streak', 'Log in for 30 consecutive days', 'login_streak', 30, 400, 'weekly_warrior'),
('learning_streak_14', '14-Day Learning Streak', 'Complete learning activities for 14 days', 'learning_streak', 14, 350, 'learning_streak'),
('esg_user', 'ESG Screening', 'Use ESG screening tool', 'esg_screening', 1, 200, 'esg_champion'),
('fractional_calculator', 'Fractional Shares', 'Use fractional share calculator', 'fractional_shares', 1, 150, 'fractional_pioneer'),
('diversified_portfolio', 'Diversified Portfolio', 'Create a well-diversified portfolio', 'diversification', 1, 300, 'diversification_master'),
('points_milestone_1000', '1000 Points Milestone', 'Earn 1,000 total points', 'points_milestone', 1000, 100, 'century_club'),
('level_milestone_10', 'Level 10 Milestone', 'Reach Level 10', 'level_milestone', 10, 1000, 'platinum_investor')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    target = EXCLUDED.target,
    reward_points = EXCLUDED.reward_points,
    reward_badge_id = EXCLUDED.reward_badge_id;
