
import User from '../models/userModel';
import LeaderboardEntry from '../models/leaderboardEntryModel';
import UserChallenge from '../models/userChallengeModel';
import UserAchievement from '../models/userAchievementModel';
import Challenge from '../models/challengeModel';
import Achievement from '../models/achievementModel';

export const awardPoints = async (userId: string, points: number, reason: string) => {
  // For now, this is a simple service that awards points.
  // A more advanced implementation would handle different event types.
  console.log(`Awarding ${points} points to ${userId} for: ${reason}`);
  
  const leaderboardEntry = await LeaderboardEntry.findOneAndUpdate(
    { user: userId },
    { $inc: { points: points } },
    { upsert: true, new: true }
  );
  return leaderboardEntry;
};

export const trackEvent = async (userId: string, eventType: string, eventData: any) => {
    // In a real system, this would be a complex function that checks for achievements, updates challenges, etc.
    console.log(`Tracking event ${eventType} for user ${userId}`, eventData);

    // Example: Award points for completing a lesson
    if (eventType === 'lesson_completed') {
        await awardPoints(userId, 50, `Completed lesson: ${eventData.lessonId}`);
    }

    // Example: Update a challenge
    if (eventType === 'risk_assessment_completed') {
        const challenge = await Challenge.findOne({ type: 'complete_risk_assessment' });
        if (challenge) {
            await UserChallenge.updateOne(
                { user: userId, challenge: challenge._id }, 
                { $inc: { progress: 1 }, $set: { completed: true } },
                { upsert: true }
            );
            await awardPoints(userId, challenge.reward.points, 'Completed risk assessment');
        }
    }
};
