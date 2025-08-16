import express, { Request, Response, NextFunction } from 'express';
import { UserProfile as PrismaUserProfile, RiskLevel } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth';
import { validate, sanitize, validateRateLimit } from '../middleware/validation';
import { validationSchemas } from '../schemas/validationSchemas';
import prisma from '../services/databaseService';
import { NotFoundError, UnauthorizedError } from '../utils/errors';

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
 */
function mapProfileToResponse(profile: PrismaUserProfile): UserProfileResponse {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    dateOfBirth: profile.dateOfBirth?.toISOString().split('T')[0], // Format as YYYY-MM-DD
    address: profile.address, // Assuming address is a JSON object
    preferences: profile.preferences, // Assuming preferences is a JSON object
    riskTolerance: profile.riskTolerance,
    goals: profile.goals,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

// GET /api/profile - get current user's profile
router.get('/', 
  profileRateLimit,
  requireAuth, 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        // This should theoretically not be reached if requireAuth is working
        return next(new UnauthorizedError('User authentication required'));
      }

      // Get user profile from database
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId }
      });

      if (!userProfile) {
        // It's not an error if a profile doesn't exist yet.
        // Send a response indicating no profile is found.
        return res.json({ success: true, profile: null, message: 'No profile created yet.' });
      }

      res.json({
        success: true,
        profile: mapProfileToResponse(userProfile)
      });
    } catch (error) {
      next(error);
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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        // This should theoretically not be reached if requireAuth is working
        return next(new UnauthorizedError('User authentication required'));
      }

      const {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        address,
        preferences,        
        riskTolerance,
        goals
      } = req.body;

      // Sanitize text inputs
      const dataToUpdate: Partial<PrismaUserProfile> = {};
      
      if (firstName !== undefined) dataToUpdate.firstName = sanitize.html(firstName);
      if (lastName !== undefined) dataToUpdate.lastName = sanitize.html(lastName);
      if (phone !== undefined) dataToUpdate.phone = sanitize.phone(phone);
      if (dateOfBirth !== undefined) dataToUpdate.dateOfBirth = new Date(dateOfBirth);
      
      // Address and preferences are expected to be JSON objects
      if (address !== undefined) dataToUpdate.address = address;
      if (preferences !== undefined) dataToUpdate.preferences = preferences;
      
      if (riskTolerance !== undefined) dataToUpdate.riskTolerance = riskTolerance;
      if (goals !== undefined) dataToUpdate.goals = sanitize.html(goals);
      
      // Update or create user profile in database
      const updatedProfile = await prisma.userProfile.upsert({
        where: { userId },
        update: dataToUpdate,
        create: {
          userId,
          ...dataToUpdate,
        },
      });
      
      res.json({ 
        success: true,
        message: 'Profile updated successfully',
        profile: mapProfileToResponse(updatedProfile),
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/profile - delete current user's profile
router.delete('/', 
  profileRateLimit,
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        // This should theoretically not be reached if requireAuth is working
        return next(new UnauthorizedError('User authentication required'));
      }

      // Check if profile exists
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId }
      });
      
      if (!existingProfile) {
        return next(new NotFoundError('No profile data found to delete'));
      }

      // Delete profile from database
      await prisma.userProfile.delete({
        where: { userId }
      });
      
      res.json({
        success: true,
        message: 'Profile deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
