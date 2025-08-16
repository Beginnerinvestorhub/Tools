import { riskAssessmentRequestSchema, riskAssessmentAnswerSchema } from '../../../validation/riskAssessmentValidation';

describe('Risk Assessment Validation', () => {
  describe('riskAssessmentAnswerSchema', () => {
    it('should validate a valid string answer', () => {
      const validAnswer = {
        questionId: 'q1',
        value: 'some text'
      };
      
      const result = riskAssessmentAnswerSchema.safeParse(validAnswer);
      expect(result.success).toBe(true);
    });

    it('should validate a valid number answer', () => {
      const validAnswer = {
        questionId: 'q1',
        value: 42
      };
      
      const result = riskAssessmentAnswerSchema.safeParse(validAnswer);
      expect(result.success).toBe(true);
    });

    it('should validate a valid boolean answer', () => {
      const validAnswer = {
        questionId: 'q1',
        value: true
      };
      
      const result = riskAssessmentAnswerSchema.safeParse(validAnswer);
      expect(result.success).toBe(true);
    });

    it('should validate a valid string array answer', () => {
      const validAnswer = {
        questionId: 'q1',
        value: ['option1', 'option2']
      };
      
      const result = riskAssessmentAnswerSchema.safeParse(validAnswer);
      expect(result.success).toBe(true);
    });

    it('should validate a valid number array answer', () => {
      const validAnswer = {
        questionId: 'q1',
        value: [1, 2, 3]
      };
      
      const result = riskAssessmentAnswerSchema.safeParse(validAnswer);
      expect(result.success).toBe(true);
    });

    it('should validate a valid boolean array answer', () => {
      const validAnswer = {
        questionId: 'q1',
        value: [true, false]
      };
      
      const result = riskAssessmentAnswerSchema.safeParse(validAnswer);
      expect(result.success).toBe(true);
    });

    it('should reject an answer with empty questionId', () => {
      const invalidAnswer = {
        questionId: '',
        value: 'some text'
      };
      
      const result = riskAssessmentAnswerSchema.safeParse(invalidAnswer);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('questionId');
        expect(result.error.issues[0].message).toContain('String must contain at least 1 character(s)');
      }
    });

    it('should reject an answer without questionId', () => {
      const invalidAnswer = {
        value: 'some text'
      };
      
      const result = riskAssessmentAnswerSchema.safeParse(invalidAnswer);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('questionId');
      }
    });
  });

  describe('riskAssessmentRequestSchema', () => {
    it('should validate a valid risk assessment request', () => {
      const validRequest = {
        answers: [
          {
            questionId: 'q1',
            value: 'some text'
          },
          {
            questionId: 'q2',
            value: 42
          }
        ]
      };
      
      const result = riskAssessmentRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject a request with no answers', () => {
      const invalidRequest = {
        answers: []
      };
      
      const result = riskAssessmentRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('answers');
        expect(result.error.issues[0].message).toContain('Array must contain at least 1 element(s)');
      }
    });

    it('should reject a request without answers', () => {
      const invalidRequest = {};
      
      const result = riskAssessmentRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('answers');
      }
    });

    it('should reject a request with invalid answer format', () => {
      const invalidRequest = {
        answers: [
          {
            questionId: '',
            value: 'some text'
          }
        ]
      };
      
      const result = riskAssessmentRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('answers');
        expect(result.error.issues[0].path).toContain('0');
        expect(result.error.issues[0].path).toContain('questionId');
      }
    });
  });
});
