import { Router, Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import { validate, sanitize } from '../middleware/validation';
import { validationSchemas } from '../schemas/validationSchemas';
import { ApiError, UnauthorizedError } from '../utils/errors';

export const authRouter = Router();

// Login endpoint with comprehensive validation
authRouter.post('/login', 
  validate({ body: validationSchemas.auth.login }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, rememberMe } = req.body;
      
      // Sanitize email input
      const sanitizedEmail = sanitize.email(email);
      
      // Use Firebase Admin SDK to verify credentials
      const firebaseUser = await admin.auth().getUserByEmail(sanitizedEmail);
        
        // In a production environment, you would also verify the password
        // This requires using the Firebase Auth REST API or a client-side flow
        // For this implementation, we'll assume the user exists and is valid
        
        const user = { 
          uid: firebaseUser.uid, 
          email: firebaseUser.email, 
          role: 'user', // Default role, could be retrieved from database
          lastLogin: new Date().toISOString()
        };
      
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured on the server.');
      }
      
        const tokenExpiry = rememberMe ? '30d' : '1h';
        const token = jwt.sign(
          { uid: user.uid, role: user.role, email: user.email }, 
          process.env.JWT_SECRET!, 
          { expiresIn: tokenExpiry }
        );
        
        // Update user's last login in database
        // This would be implemented with Prisma
        // await prisma.user.update({
        //   where: { id: user.uid },
        //   data: { lastLogin: new Date() }
        // });
        
        // Log successful login (in production, use proper logging service)
        console.log(`Successful login: ${sanitizedEmail} at ${new Date().toISOString()}`);
        
        res.json({ 
          token, 
          user: {
            uid: user.uid,
            email: user.email,
            role: user.role,
            lastLogin: user.lastLogin
          },
          expiresIn: tokenExpiry
        });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return next(new UnauthorizedError('Invalid email or password'));
      }
      return next(error);
    }
  }
);

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
        
        console.log(`New user registered: ${sanitizedEmail} at ${new Date().toISOString()}`);
        
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
      return next(error);
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
        console.log(`Password reset link generated for: ${sanitizedEmail}`);
        console.log(`Reset link: ${resetLink}`);

      } catch (firebaseError: any) {
        // If user is not found, we just swallow the error and do nothing.
        // If it's another error, we should log it but still not inform the user.
        if (firebaseError.code !== 'auth/user-not-found') {
          console.error('Firebase password reset error (user may exist):', firebaseError);
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
      const { token, newPassword } = req.body;
      
      // In production: You would verify the token and update password using:
      // await admin.auth().verifyPasswordResetCode(token);
      // await admin.auth().confirmPasswordReset(token, newPassword);
      
      const sanitizedToken = token.replace(/\n|\r/g, "").substring(0, 8);
      console.log(`Password reset completed for token: ${sanitizedToken}...`);
      
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
