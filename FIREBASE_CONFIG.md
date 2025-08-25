# Firebase Configuration for the Beginner Investor Hub

This document outlines the necessary steps to set up Firebase for both the frontend (Vercel) and backend (Render / Node.js) of the Beginner Investor Hub.

---

### 1. Frontend Setup (for Vercel)

The frontend uses the Firebase Client SDK to handle user authentication, including sign-up, sign-in, and managing user sessions.

#### Step 1: Create a Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click "Add project" and follow the steps to create a new project.
3.  Give it a descriptive name (e.g., `beginner-investor-hub`).

#### Step 2: Enable Authentication

1.  In your new Firebase project, navigate to the **Authentication** section from the left-hand menu.
2.  Click "Get started" and then go to the "Sign-in method" tab.
3.  Enable the "Email/Password" provider. You can also enable other providers like "Google" if you plan to support them.

#### Step 3: Add a Web App

1.  Go back to the "Project settings" by clicking the gear icon next to "Project Overview."
2.  In the "Your apps" section, click the web icon (`</>`) to add a new web app.
3.  Give your app a nickname (e.g., `investor-hub-frontend`).
4.  Copy the Firebase configuration object that is provided. It will look like this:

    ```javascript
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };
    ```

5.  Store these values as environment variables in your Vercel project or in your `.env` file for local development.

    For example, in a `.env.local` file:
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    # ... and so on
    ```

---

### 2. Backend Setup (for Render)

The backend uses the Firebase Admin SDK to verify the authentication tokens (JWTs) sent from the frontend. This is a crucial security step.

#### Step 1: Generate a Service Account Key

1.  In your Firebase project, go to "Project settings" > "Service accounts."
2.  Under the "Firebase Admin SDK" tab, click "Generate new private key."
3.  A JSON file will be downloaded to your computer. **Keep this file secure! Do not commit it to your repository.**

#### Step 2: Set up a Secret Environment Variable in Render

To use the service account key securely without hardcoding it, we will store the JSON content in a single environment variable on Render.

1.  Open the downloaded JSON file. Copy all the content, including the curly braces `{}`.
2.  In your Render dashboard, go to your Node.js service (`backend-api`).
3.  Navigate to the "Environment" tab and add a new environment variable.
4.  Set the `key` to `FIREBASE_ADMIN_CREDENTIALS`.
5.  Set the `value` to the entire JSON content you copied in the previous step.

#### Step 3: Implement the Admin SDK in Your Backend Code

Your backend code will read this environment variable and initialize the Firebase Admin SDK.

```javascript
// Example in your backend service (e.g., Node.js)
const admin = require('firebase-admin');

// Ensure the variable is set before trying to parse
if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
  try {
    // Parse the JSON string from the environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);

    // Initialize the Firebase Admin SDK with the credentials
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Error parsing Firebase Admin credentials:', error);
  }
} else {
  console.error('FIREBASE_ADMIN_CREDENTIALS environment variable is not set.');
}

