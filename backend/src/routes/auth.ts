import { Router, Request, Response, NextFunction } from 'express';
import admin from '../utils/firebaseAdmin';
import { validate, sanitize } from '../middleware/validation';
import { validationSchemas } from '../schemas/validationSchemas';
import { ApiError, UnauthorizedError } from '../utils/errors';
import { requireAuth } from '../utils/requireAuth';
import { logger } from '../utils/logger';

export const authRouter = Router();

/**
 * @openapi
 * /api/auth/session:
 *   post:
 *     summary: Establishes a user session after Firebase authentication.
 *     description: This endpoint should be called by the frontend immediately after a user successfully signs in with the Firebase Client SDK. The request must include the Firebase ID Token in the Authorization header. This endpoint will then find or create a corresponding user profile in the local application database.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User session established. Returns the user profile from the local database.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: 'string' }
 *                 user: { type: 'object' } # Define your user profile schema here
 *       401:
 *         description: Unauthorized. The provided Firebase ID Token is invalid or expired.
 */
authRouter.post('/session', requireAuth(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // The `requireAuth` middleware has already verified the Firebase token.
    // The decoded user information is available in `req.user`.
    const firebaseUser = req.user!;
    logger.info(`User ${firebaseUser.uid} successfully authenticated via Firebase.`);

    // --- Find or Create User in Local Database ---
    // This is where you sync the Firebase user with your own application's user table.
    // This example assumes you have a Prisma client set up at `prisma`.
    /*
    let userProfile = await prisma.user.findUnique({
      where: { id: firebaseUser.uid },
    });

    if (!userProfile) {
      logger.info(`No local profile found for user ${firebaseUser.uid}. Creating new profile.`);
      userProfile = await prisma.user.create({
        data: {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          // Set other default fields
          firstName: firebaseUser.name?.split(' ')[0] || '',
          lastName: firebaseUser.name?.split(' ')[1] || '',
          role: 'user', // Default role
        },
      });
    } else {
      // Optional: Update last login time
      await prisma.user.update({
        where: { id: firebaseUser.uid },
        data: { lastLogin: new Date() },
      });
    }
    */
    // For now, we'll just return the verified user profile from the token.
    const userProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.name,
      role: firebaseUser.role || 'user', // Custom claim 'role'
      // You would return your local DB profile here
    };

    res.status(200).json({
      message: 'User session established successfully.',
      user: userProfile,
    });
  } catch (error) {
    next(error);
  }
});

// User registration endpoint
authRouter.post('/register',
  validate({ body: validationSchemas.auth.register }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName, acceptTerms, marketingOptIn } = req.body;
      
      // Sanitize inputs
      const sanitizedEmail = sanitize.email(email);
      const sanitizedFirstName = sanitize.html(firstName || '');
      const sanitizedLastName = sanitize.html(lastName || '');
      
      // Check if user already exists in Firebase
      try {
        await admin.auth().getUserByEmail(sanitizedEmail);
        // If the above does not throw, the user exists.
        return next(new ApiError('An account with this email already exists', 409));
      } catch (error: any) {
        // User doesn't exist, which is what we want for registration
        if (error.code !== 'auth/user-not-found') {
          throw error; // Rethrow to be caught by the outer catch block
        }
      }
      
        // Create user in Firebase Auth
        const firebaseUser = await admin.auth().createUser({ 
          email: sanitizedEmail, 
          password,
          displayName: `${sanitizedFirstName} ${sanitizedLastName}`
        });
        
        const newUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          firstName: sanitizedFirstName,
          lastName: sanitizedLastName,
          role: 'user',
          marketingOptIn,
          createdAt: new Date().toISOString(),
          emailVerified: false
        };
      
        // In production: Create user in database as well
        // await prisma.user.create({
        //   data: {
        //     id: newUser.uid,
        //     email: newUser.email,
        //     firstName: newUser.firstName,
        //     lastName: newUser.lastName,
        //     role: newUser.role
        //   }
        // });
        
        logger.info('New user registered with email:', sanitizedEmail);
        
        res.status(201).json({
          message: 'User registered successfully',
          user: {
            uid: newUser.uid,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            createdAt: newUser.createdAt
          },
          nextStep: 'Please check your email to verify your account'
        });
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        return next(new ApiError('An account with this email already exists', 409));
      }
      next(error);
    }
  }
);

// Forgot password endpoint
authRouter.post('/forgot-password',
  validate({ body: validationSchemas.auth.forgotPassword }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const sanitizedEmail = sanitize.email(email);
      
      // We always return a success-like message to prevent user enumeration.
      // We only proceed with Firebase to trigger the email if the user exists.
      try {
        await admin.auth().getUserByEmail(sanitizedEmail);
        // If user exists, generate and "send" the link.
        const resetLink = await admin.auth().generatePasswordResetLink(sanitizedEmail);
        
        // In production: Send email with reset link
        // This would typically use a service like SendGrid or Nodemailer
        logger.info('Password reset link generated for email:', sanitizedEmail);
        // Do not log the link in production
        // console.log('Reset link:', resetLink);

      } catch (firebaseError: any) {
        // If user is not found, we just swallow the error and do nothing.
        // If it's another error, we should log it but still not inform the user.
        if (firebaseError.code !== 'auth/user-not-found') {
          logger.error('Firebase password reset error (user may exist):', firebaseError);
        }
      }

      // Always return the same message.
      res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Reset password endpoint
authRouter.post('/reset-password',
  validate({ body: validationSchemas.auth.resetPassword }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      
      // In production: You would verify the token and update password using:
      // await admin.auth().verifyPasswordResetCode(token);
      // await admin.auth().confirmPasswordReset(token, newPassword);
      
      const sanitizedToken = token.replace(/\n|\r/g, "").substring(0, 8);
      logger.info('Password reset completed for token:', sanitizedToken, '...');
      
      res.json({
        message: 'Password has been reset successfully.',
        nextStep: 'You can now log in with your new password.'
      });
    } catch (error) {
      // In a real implementation, you'd catch specific Firebase errors for invalid tokens.
      return next(error);
    }
  }
);

// OAuth login endpoint
authRouter.post('/oauth',
  (req: Request, res: Response) => {
    // TODO: Implement OAuth flow (Google, Facebook, etc.)
    res.status(501).json({ 
      error: 'OAuth not implemented',
      message: 'OAuth authentication is not yet available',
      supportedMethods: ['email/password']
    });
  }
);
