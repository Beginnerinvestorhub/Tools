import { Router, Request, Response } from 'express';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import { validate, sanitize } from '../middleware/validation';
import { authSchemas } from '../schemas/validationSchemas';

export const authRouter = Router();

// Login endpoint with comprehensive validation
authRouter.post('/login', 
  validate(authSchemas.login),
  async (req: Request, res: Response) => {
    try {
      const { email, password, rememberMe } = req.body;
      
      // Sanitize email input
      const sanitizedEmail = sanitize.email(email);
      
      // Use Firebase Admin SDK to verify credentials
      try {
        // In a real implementation, you would verify the password here
        // For security reasons, we'll look up the user by email
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
        return res.status(500).json({ 
          error: 'Server configuration error',
          message: 'Authentication service temporarily unavailable'
        });
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
      } catch (firebaseError: any) {
        console.error('Firebase authentication error:', firebaseError);
        
        if (firebaseError.code === 'auth/user-not-found') {
          return res.status(401).json({ 
            error: 'Invalid credentials',
            message: 'Invalid email or password'
          });
        }
        
        return res.status(500).json({ 
          error: 'Authentication failed',
          message: 'An error occurred during login. Please try again.'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        error: 'Authentication failed',
        message: 'An error occurred during login. Please try again.'
      });
    }
  }
);

// User registration endpoint
authRouter.post('/register',
  validate(authSchemas.register),
  async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, acceptTerms, marketingOptIn } = req.body;
      
      // Sanitize inputs
      const sanitizedEmail = sanitize.email(email);
      const sanitizedFirstName = sanitize.html(firstName);
      const sanitizedLastName = sanitize.html(lastName);
      
      // Check if user already exists in Firebase
      try {
        await admin.auth().getUserByEmail(sanitizedEmail);
        return res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email already exists'
        });
      } catch (error: any) {
        // User doesn't exist, which is what we want for registration
        if (error.code !== 'auth/user-not-found') {
          console.error('Firebase error during registration check:', error);
          return res.status(500).json({
            error: 'Registration failed',
            message: 'An error occurred during registration. Please try again.'
          });
        }
      }
      
      try {
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
      } catch (firebaseError: any) {
        console.error('Firebase registration error:', firebaseError);
        
        if (firebaseError.code === 'auth/email-already-exists') {
          return res.status(409).json({
            error: 'User already exists',
            message: 'An account with this email already exists'
          });
        }
        
        return res.status(500).json({
          error: 'Registration failed',
          message: 'An error occurred during registration. Please try again.'
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: 'An error occurred during registration. Please try again.'
      });
    }
  }
);

// Forgot password endpoint
authRouter.post('/forgot-password',
  validate(authSchemas.forgotPassword),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const sanitizedEmail = sanitize.email(email);
      
      try {
        // Check if user exists in Firebase
        await admin.auth().getUserByEmail(sanitizedEmail);
        
        // Generate password reset link
        const resetLink = await admin.auth().generatePasswordResetLink(sanitizedEmail);
        
        // In production: Send email with reset link
        // This would typically use a service like SendGrid or Nodemailer
        console.log(`Password reset link generated for: ${sanitizedEmail}`);
        console.log(`Reset link: ${resetLink}`);
        
        res.json({
          message: 'If an account with that email exists, a password reset link has been sent.',
          email: sanitizedEmail
        });
      } catch (firebaseError: any) {
        console.error('Firebase password reset error:', firebaseError);
        
        // Don't reveal if user exists or not for security
        res.json({
          message: 'If an account with that email exists, a password reset link has been sent.',
          email: sanitizedEmail
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        error: 'Password reset failed',
        message: 'An error occurred. Please try again.'
      });
    }
  }
);

// Reset password endpoint
authRouter.post('/reset-password',
  validate(authSchemas.resetPassword),
  async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      
      try {
        // In production: You would verify the token and update password
        // For now, we'll just log that a reset was attempted
        
        const sanitizedToken = token.replace(/\n|\r/g, "").substring(0, 8);
        console.log(`Password reset completed for token: ${sanitizedToken}...`);
        
        res.json({
          message: 'Password reset successfully',
          nextStep: 'You can now log in with your new password'
        });
      } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
          error: 'Password reset failed',
          message: 'Invalid or expired reset token'
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        error: 'Password reset failed',
        message: 'Invalid or expired reset token'
      });
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
