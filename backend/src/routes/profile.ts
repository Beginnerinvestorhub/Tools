import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { validate, sanitize, validateRateLimit } from '../middleware/validation';
import { validationSchemas } from '../schemas/validationSchemas';

const router = express.Router();

// Rate limiting for profile endpoints
const profileRateLimit = validateRateLimit(15 * 60 * 1000, 20, 'Too many profile requests');

// In-memory profile store (replace with DB in production)
interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  preferences?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    marketingEmails?: boolean;
    theme?: string;
    language?: string;
  };
  riskTolerance?: string;
  goals?: string;
  updatedAt?: string;
}

const profiles: Record<string, UserProfile> = {};

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

      const userProfile = profiles[userId] || {};
      
      // Add metadata
      const profileWithMetadata = {
        ...userProfile,
        profileComplete: Object.keys(userProfile).length > 0,
        lastUpdated: userProfile.updatedAt || null
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
      
      // Merge with existing profile
      profiles[userId] = {
        ...profiles[userId],
        ...sanitizedData
      };
      
      console.log(`Profile updated for user: ${userId} at ${sanitizedData.updatedAt}`);
      
      res.json({ 
        success: true,
        message: 'Profile updated successfully',
        profile: profiles[userId],
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
      if (!profiles[userId]) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'No profile data found to delete'
        });
      }

      // Delete profile
      delete profiles[userId];
      
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
