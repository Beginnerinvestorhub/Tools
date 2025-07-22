import Joi from 'joi';

// Common validation patterns
const commonPatterns = {
  email: Joi.string().email().lowercase().trim().max(255),
  password: Joi.string().min(8).max(128).pattern(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  ).message('Password must contain at least 8 characters with uppercase, lowercase, number, and special character'),
  name: Joi.string().trim().min(1).max(100).pattern(/^[a-zA-Z\s'-]+$/),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).min(10).max(20),
  url: Joi.string().uri({ scheme: ['http', 'https'] }),
  mongoId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  uuid: Joi.string().uuid(),
  positiveNumber: Joi.number().positive(),
  percentage: Joi.number().min(0).max(100),
  currency: Joi.number().precision(2).positive(),
  date: Joi.date().iso(),
  riskTolerance: Joi.string().valid('conservative', 'moderate', 'aggressive'),
  investmentGoal: Joi.string().valid('retirement', 'education', 'house', 'general', 'emergency'),
};

// Authentication schemas
export const authSchemas = {
  login: {
    body: Joi.object({
      email: commonPatterns.email.required(),
      password: Joi.string().required().min(1).max(128),
      rememberMe: Joi.boolean().default(false)
    })
  },
  
  register: {
    body: Joi.object({
      email: commonPatterns.email.required(),
      password: commonPatterns.password.required(),
      confirmPassword: Joi.string().required().valid(Joi.ref('password')),
      firstName: commonPatterns.name.required(),
      lastName: commonPatterns.name.required(),
      acceptTerms: Joi.boolean().valid(true).required(),
      marketingOptIn: Joi.boolean().default(false)
    })
  },
  
  forgotPassword: {
    body: Joi.object({
      email: commonPatterns.email.required()
    })
  },
  
  resetPassword: {
    body: Joi.object({
      token: Joi.string().required(),
      password: commonPatterns.password.required(),
      confirmPassword: Joi.string().required().valid(Joi.ref('password'))
    })
  },
  
  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: commonPatterns.password.required(),
      confirmPassword: Joi.string().required().valid(Joi.ref('newPassword'))
    })
  }
};

// User profile schemas
export const profileSchemas = {
  updateProfile: {
    body: Joi.object({
      firstName: commonPatterns.name.optional(),
      lastName: commonPatterns.name.optional(),
      phone: commonPatterns.phone.optional(),
      dateOfBirth: commonPatterns.date.optional(),
      address: Joi.object({
        street: Joi.string().max(255),
        city: Joi.string().max(100),
        state: Joi.string().max(50),
        zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/),
        country: Joi.string().length(2).uppercase()
      }).optional(),
      preferences: Joi.object({
        emailNotifications: Joi.boolean().default(true),
        smsNotifications: Joi.boolean().default(false),
        marketingEmails: Joi.boolean().default(false),
        theme: Joi.string().valid('light', 'dark', 'auto').default('auto'),
        language: Joi.string().valid('en', 'es', 'fr').default('en')
      }).optional()
    })
  },
  
  getUserProfile: {
    params: Joi.object({
      userId: commonPatterns.uuid.optional()
    })
  }
};

// Risk assessment schemas
export const riskAssessmentSchemas = {
  submitAssessment: {
    body: Joi.object({
      age: Joi.number().integer().min(18).max(120).required(),
      income: commonPatterns.currency.required(),
      investmentExperience: Joi.string().valid('none', 'beginner', 'intermediate', 'advanced').required(),
      riskTolerance: commonPatterns.riskTolerance.required(),
      investmentGoals: Joi.array().items(commonPatterns.investmentGoal).min(1).max(5).required(),
      investmentHorizon: Joi.number().integer().min(1).max(50).required(), // years
      liquidityNeeds: Joi.string().valid('high', 'medium', 'low').required(),
      financialSituation: Joi.object({
        monthlyIncome: commonPatterns.currency.required(),
        monthlyExpenses: commonPatterns.currency.required(),
        emergencyFund: commonPatterns.currency.required(),
        existingInvestments: commonPatterns.currency.default(0),
        debt: commonPatterns.currency.default(0)
      }).required(),
      questionnaire: Joi.array().items(
        Joi.object({
          questionId: Joi.string().required(),
          answer: Joi.alternatives().try(
            Joi.string(),
            Joi.number(),
            Joi.boolean(),
            Joi.array().items(Joi.string())
          ).required()
        })
      ).min(1).required()
    })
  },
  
  getAssessment: {
    params: Joi.object({
      assessmentId: commonPatterns.uuid.required()
    })
  }
};

// Portfolio schemas
export const portfolioSchemas = {
  createPortfolio: {
    body: Joi.object({
      name: Joi.string().trim().min(1).max(100).required(),
      description: Joi.string().max(500).optional(),
      riskProfile: commonPatterns.riskTolerance.required(),
      initialInvestment: commonPatterns.currency.required(),
      allocations: Joi.array().items(
        Joi.object({
          assetType: Joi.string().valid('stocks', 'bonds', 'etf', 'mutual_fund', 'crypto', 'real_estate').required(),
          symbol: Joi.string().uppercase().max(10).required(),
          allocation: commonPatterns.percentage.required(),
          amount: commonPatterns.currency.required()
        })
      ).min(1).required()
    }).custom((value, helpers) => {
      // Validate that allocations sum to 100%
      const totalAllocation = value.allocations.reduce((sum: number, item: any) => sum + item.allocation, 0);
      if (Math.abs(totalAllocation - 100) > 0.01) {
        return helpers.error('any.custom', { message: 'Portfolio allocations must sum to 100%' });
      }
      return value;
    })
  },
  
  updatePortfolio: {
    params: Joi.object({
      portfolioId: commonPatterns.uuid.required()
    }),
    body: Joi.object({
      name: Joi.string().trim().min(1).max(100).optional(),
      description: Joi.string().max(500).optional(),
      allocations: Joi.array().items(
        Joi.object({
          assetType: Joi.string().valid('stocks', 'bonds', 'etf', 'mutual_fund', 'crypto', 'real_estate').required(),
          symbol: Joi.string().uppercase().max(10).required(),
          allocation: commonPatterns.percentage.required(),
          amount: commonPatterns.currency.required()
        })
      ).min(1).optional()
    })
  },
  
  getPortfolio: {
    params: Joi.object({
      portfolioId: commonPatterns.uuid.required()
    })
  },
  
  deletePortfolio: {
    params: Joi.object({
      portfolioId: commonPatterns.uuid.required()
    })
  }
};

// Investment simulation schemas
export const simulationSchemas = {
  runSimulation: {
    body: Joi.object({
      portfolioId: commonPatterns.uuid.optional(),
      customPortfolio: Joi.object({
        allocations: Joi.array().items(
          Joi.object({
            assetType: Joi.string().required(),
            allocation: commonPatterns.percentage.required()
          })
        ).required()
      }).optional(),
      simulationParameters: Joi.object({
        timeHorizon: Joi.number().integer().min(1).max(50).required(), // years
        initialInvestment: commonPatterns.currency.required(),
        monthlyContribution: commonPatterns.currency.default(0),
        inflationRate: Joi.number().min(0).max(20).default(3), // percentage
        numberOfSimulations: Joi.number().integer().min(100).max(10000).default(1000)
      }).required()
    }).xor('portfolioId', 'customPortfolio') // Either portfolioId OR customPortfolio, not both
  },
  
  getSimulation: {
    params: Joi.object({
      simulationId: commonPatterns.uuid.required()
    })
  }
};

// Newsletter schemas
export const newsletterSchemas = {
  subscribe: {
    body: Joi.object({
      email: commonPatterns.email.required(),
      firstName: commonPatterns.name.optional(),
      interests: Joi.array().items(
        Joi.string().valid('stocks', 'bonds', 'crypto', 'real_estate', 'retirement', 'tax_planning')
      ).max(10).optional(),
      frequency: Joi.string().valid('daily', 'weekly', 'monthly').default('weekly')
    })
  },
  
  unsubscribe: {
    body: Joi.object({
      email: commonPatterns.email.required(),
      token: Joi.string().optional()
    })
  }
};

// Admin schemas
export const adminSchemas = {
  getUserList: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      search: Joi.string().max(100).optional(),
      role: Joi.string().valid('user', 'admin', 'paiduser').optional(),
      sortBy: Joi.string().valid('createdAt', 'email', 'lastName').default('createdAt'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    })
  },
  
  updateUserRole: {
    params: Joi.object({
      userId: commonPatterns.uuid.required()
    }),
    body: Joi.object({
      role: Joi.string().valid('user', 'admin', 'paiduser').required(),
      reason: Joi.string().max(500).optional()
    })
  },
  
  deleteUser: {
    params: Joi.object({
      userId: commonPatterns.uuid.required()
    }),
    body: Joi.object({
      reason: Joi.string().max(500).required(),
      confirmDelete: Joi.boolean().valid(true).required()
    })
  }
};

// Gamification schemas
export const gamificationSchemas = {
  submitChallenge: {
    body: Joi.object({
      challengeId: commonPatterns.uuid.required(),
      answer: Joi.alternatives().try(
        Joi.string().max(1000),
        Joi.number(),
        Joi.boolean(),
        Joi.array().items(Joi.string())
      ).required(),
      timeSpent: Joi.number().integer().min(0).max(7200).optional() // seconds, max 2 hours
    })
  },
  
  getLeaderboard: {
    query: Joi.object({
      period: Joi.string().valid('daily', 'weekly', 'monthly', 'all-time').default('weekly'),
      category: Joi.string().valid('points', 'challenges', 'streak').default('points'),
      limit: Joi.number().integer().min(1).max(100).default(10)
    })
  }
};

// File upload schemas
export const uploadSchemas = {
  uploadAvatar: {
    // File validation will be handled by multer middleware
    body: Joi.object({
      description: Joi.string().max(255).optional()
    })
  }
};

// Search and filtering schemas
export const searchSchemas = {
  searchAssets: {
    query: Joi.object({
      q: Joi.string().min(1).max(100).required(),
      type: Joi.string().valid('stocks', 'etf', 'mutual_fund', 'crypto').optional(),
      limit: Joi.number().integer().min(1).max(50).default(10),
      exchange: Joi.string().max(10).optional()
    })
  }
};

// Export all schemas
export const validationSchemas = {
  auth: authSchemas,
  profile: profileSchemas,
  riskAssessment: riskAssessmentSchemas,
  portfolio: portfolioSchemas,
  simulation: simulationSchemas,
  newsletter: newsletterSchemas,
  admin: adminSchemas,
  gamification: gamificationSchemas,
  upload: uploadSchemas,
  search: searchSchemas
};
