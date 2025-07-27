import express, { Request, Response } from 'express';
import { UserProfile as PrismaUserProfile, RiskLevel } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth';
import { validate, sanitize, validateRateLimit } from '../middleware/validation';
import { validationSchemas } from '../schemas/validationSchemas';
import prisma from '../services/databaseService';

const router = express.Router();

// Rate limiting for profile endpoints
const profileRateLimit = validateRateLimit(15 * 60 * 1000, 20, 'Too many profile requests');

// This DTO defines the shape of the profile data sent to the client.
interface UserProfileResponse {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null; // ISO string format YYYY-MM-DD
  address?: any;
  preferences?: any;
  riskTolerance?: RiskLevel | null;
  goals?: string | null;
  updatedAt: string;
}

/**
 * Maps a Prisma UserProfile model to a public-facing API response object.
 * @param profile The UserProfile object from Prisma.
 * @returns
// GET /api/profile - get current user's profile
router.get('/', 
  profileRateLimit,
  requireAuth, 
  validate(validationSchemas.profile.getUserProfile),
  (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'User authentication required'
        });
      }

      // Get user profile from database
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId }
      });
      
      // Transform database model to API response format
      const profileData = userProfile ? {
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        phone: userProfile.phone,
        dateOfBirth: userProfile.dateOfBirth,
        address: userProfile.address as UserProfile['address'],
        preferences: userProfile.preferences as UserProfile['preferences'],
        riskTolerance: userProfile.riskTolerance,
        goals: userProfile.goals,
        updatedAt: userProfile.updatedAt.toISOString()
      } : {};
      
      // Add metadata
      const profileWithMetadata = {
        ...profileData,
        profileComplete: Object.keys(profileData).length > 0,
        lastUpdated: profileData.updatedAt || null
      };

      res.json({
        success: true,
        profile: profileWithMetadata
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Profile retrieval failed',
        message: 'An error occurred while retrieving your profile'
      });
    }
  }
);

// PUT /api/profile - update current user's profile
/**
 * Updates the current user's profile with comprehensive validation.
 * Extracts user ID from the request object, validates all input data,
 * sanitizes inputs, and updates the profile store.
 * 
 * @param {Request} req - The Express request object, containing user ID and profile data in the body.
 * @param {Response} res - The Express response object, used to send back the success status or error.
 */
router.put('/', 
  profileRateLimit,
  requireAuth, 
  validate(validationSchemas.profile.updateProfile),
  (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'User authentication required'
        });
      }

      const {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        address,
        preferences,
        // Legacy fields for backward compatibility
        name,
        riskTolerance,
        goals
      } = req.body;

      // Sanitize text inputs
      const sanitizedData: UserProfile = {};
      
      if (firstName) sanitizedData.firstName = sanitize.html(firstName);
      if (lastName) sanitizedData.lastName = sanitize.html(lastName);
      if (phone) sanitizedData.phone = sanitize.phone(phone);
      if (dateOfBirth) sanitizedData.dateOfBirth = dateOfBirth;
      
      // Handle address with sanitization
      if (address) {
        sanitizedData.address = {
          street: address.street ? sanitize.html(address.street) : undefined,
          city: address.city ? sanitize.html(address.city) : undefined,
          state: address.state ? sanitize.html(address.state) : undefined,
          zipCode: address.zipCode,
          country: address.country ? address.country.toUpperCase() : undefined
        };
      }
      
      // Handle preferences
      if (preferences) {
        sanitizedData.preferences = {
          emailNotifications: preferences.emailNotifications ?? true,
          smsNotifications: preferences.smsNotifications ?? false,
          marketingEmails: preferences.marketingEmails ?? false,
          theme: preferences.theme || 'auto',
          language: preferences.language || 'en'
        };
      }
      
      // Legacy field handling
      if (name) {
        const nameParts = sanitize.html(name).split(' ');
        if (!sanitizedData.firstName) sanitizedData.firstName = nameParts[0];
        if (!sanitizedData.lastName && nameParts.length > 1) {
          sanitizedData.lastName = nameParts.slice(1).join(' ');
        }
      }
      if (riskTolerance) sanitizedData.riskTolerance = riskTolerance;
      if (goals) sanitizedData.goals = sanitize.html(goals);
      
      // Add timestamp
      sanitizedData.updatedAt = new Date().toISOString();
      
      // Update or create user profile in database
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId }
      });
      
      let updatedProfile;
      if (existingProfile) {
        // Update existing profile
        updatedProfile = await prisma.userProfile.update({
          where: { userId },
          data: {
            firstName: sanitizedData.firstName,
            lastName: sanitizedData.lastName,
            phone: sanitizedData.phone,
            dateOfBirth: sanitizedData.dateOfBirth,
            address: sanitizedData.address as any,
            preferences: sanitizedData.preferences as any,
            riskTolerance: sanitizedData.riskTolerance,
            goals: sanitizedData.goals,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new profile
        updatedProfile = await prisma.userProfile.create({
          data: {
            userId,
            firstName: sanitizedData.firstName,
            lastName: sanitizedData.lastName,
            phone: sanitizedData.phone,
            dateOfBirth: sanitizedData.dateOfBirth,
            address: sanitizedData.address as any,
            preferences: sanitizedData.preferences as any,
            riskTolerance: sanitizedData.riskTolerance,
            goals: sanitizedData.goals,
            updatedAt: new Date()
          }
        });
      }
      
      // Transform database model to API response format
      const profileData = {
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        phone: updatedProfile.phone,
        dateOfBirth: updatedProfile.dateOfBirth,
        address: updatedProfile.address as UserProfile['address'],
        preferences: updatedProfile.preferences as UserProfile['preferences'],
        riskTolerance: updatedProfile.riskTolerance,
        goals: updatedProfile.goals,
        updatedAt: updatedProfile.updatedAt.toISOString()
      };
      
      console.log(`Profile updated for user: ${userId} at ${profileData.updatedAt}`);
      
      res.json({ 
        success: true,
        message: 'Profile updated successfully',
        profile: profileData,
        updatedFields: Object.keys(sanitizedData).filter(key => key !== 'updatedAt')
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Profile update failed',
        message: 'An error occurred while updating your profile'
      });
    }
  }
);

// DELETE /api/profile - delete current user's profile
router.delete('/', 
  profileRateLimit,
  requireAuth,
  (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'User authentication required'
        });
      }

      // Check if profile exists
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId }
      });
      
      if (!existingProfile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'No profile data found to delete'
        });
      }

      // Delete profile from database
      await prisma.userProfile.delete({
        where: { userId }
      });
      
      console.log(`Profile deleted for user: ${userId} at ${new Date().toISOString()}`);
      
      res.json({
        success: true,
        message: 'Profile deleted successfully'
      });
    } catch (error) {
      console.error('Delete profile error:', error);
      res.status(500).json({
        error: 'Profile deletion failed',
        message: 'An error occurred while deleting your profile'
      });
    }
  }
);

export default router;
