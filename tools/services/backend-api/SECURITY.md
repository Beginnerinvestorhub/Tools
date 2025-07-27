# Backend API Security Documentation

## Overview

This document outlines the security measures implemented in the Beginner Investor Hub Backend API, including authentication, input sanitization, environment variable validation, and secure handling of sensitive data.

## Authentication

The backend uses Firebase Authentication for user authentication. Users authenticate with Firebase on the frontend and send their ID tokens to the backend for verification.

### Token Verification

All authenticated routes use the `authenticateToken` middleware which:

1. Verifies the Firebase ID token using the Firebase Admin SDK
2. Checks token issuance time and not-before time
3. Handles various Firebase token errors (expired, invalid, revoked, user disabled)
4. Attaches user information to the request object

## Input Sanitization

To prevent XSS attacks, all user inputs are sanitized using the `sanitizeInput` middleware which:

1. Sanitizes request body, query parameters, and route parameters
2. Uses DOMPurify with jsdom to remove all HTML tags and attributes
3. Recursively sanitizes nested objects and arrays

## Environment Variable Validation

The `validateEnvironment` middleware ensures that all required environment variables are present and correctly formatted at startup:

1. Validates NODE_ENV, PORT, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, STRIPE_SECRET_KEY, FRONTEND_URL, and RISK_CALC_ENGINE_URL
2. Exits the process in production if critical variables are missing
3. Logs clear error messages for missing or invalid variables

## Sensitive Data Handling

### Secret Management

Sensitive data such as API keys and service credentials are stored in environment variables and never hardcoded in the source code.

### Nudge Engine API Key

The Nudge Engine API key is stored as `NUDGE_ENGINE_API_KEY` in the backend environment variables. The frontend uses a proxy endpoint (`/api/nudge-engine-proxy`) to communicate with the backend, which then forwards requests to the Nudge Engine API with the API key.

This approach ensures that:
1. The API key is never exposed to the frontend
2. All requests to the Nudge Engine are authenticated through the backend
3. Rate limiting and other security measures can be applied to the proxy endpoint

## Rate Limiting

Global rate limiting is applied to all API endpoints (100 requests per 15 minutes per IP). More restrictive rate limiting is applied to authentication endpoints (5 requests per 15 minutes per IP for failed attempts).

## CORS Configuration

CORS is configured to only allow requests from the frontend domain in production, preventing unauthorized cross-origin requests.

## Security Headers

Helmet.js is used to set various security headers including:

1. Content Security Policy (CSP) to prevent XSS attacks
2. HTTP Strict Transport Security (HSTS)
3. Frameguard to prevent clickjacking
4. Hide powered-by to remove server information
5. No-sniff to prevent MIME type sniffing
6. Referrer policy to control referrer information
7. XSS filter to prevent XSS attacks
8. DNS prefetch control to prevent DNS prefetching

## Docker Security

The backend Dockerfile implements several security best practices:

1. Multi-stage builds to minimize the final image size
2. Non-root user to run the application
3. HEALTHCHECK instruction to monitor application health
4. Pinned base image version for reproducibility

## Error Handling

Error messages are carefully crafted to avoid exposing sensitive information:

1. Stack traces are only shown in development mode
2. Generic error messages are returned to users in production
3. Detailed error information is logged server-side only

## Future Improvements

### Secret Management Service

For production deployment, it's recommended to implement a secret management service such as:

1. AWS Secrets Manager
2. Azure Key Vault
3. Google Secret Manager
4. HashiCorp Vault

This would provide additional security benefits such as:
1. Automatic rotation of secrets
2. Fine-grained access control
3. Audit logging of secret access
4. Encryption at rest and in transit

### Docker Image Scanning

Integrate Docker image scanning in the CI/CD pipeline using tools such as:

1. Trivy
2. Clair
3. Snyk
4. Docker Scout

This would help identify vulnerabilities in the Docker images before deployment.
