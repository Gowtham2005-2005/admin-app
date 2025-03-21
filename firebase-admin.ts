import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "sist-mun",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY ? 
    process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT
};

// Initialize Firebase if not already initialized
let adminDb: admin.firestore.Firestore | null = null;
let adminAuth: admin.auth.Auth | null = null;

try {
  if (!admin.apps.length) {
    console.log("Initializing Firebase Admin SDK...");
    
    // Check if required environment variables are set
    const missingVars = [];
    if (!process.env.FIREBASE_PROJECT_ID) missingVars.push('FIREBASE_PROJECT_ID');
    if (!process.env.FIREBASE_PRIVATE_KEY) missingVars.push('FIREBASE_PRIVATE_KEY');
    if (!process.env.FIREBASE_CLIENT_EMAIL) missingVars.push('FIREBASE_CLIENT_EMAIL');
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
    }
    
    // Log sanitized service account for debugging (without sensitive data)
    const debugServiceAccount = {
      type: serviceAccount.type,
      project_id: serviceAccount.project_id,
      private_key_id: serviceAccount.private_key_id ? '***' : undefined,
      private_key: serviceAccount.private_key ? '***' : undefined,
      client_email: serviceAccount.client_email ? '***' : undefined,
      client_id: serviceAccount.client_id ? '***' : undefined,
    };
    console.log("Service account config:", JSON.stringify(debugServiceAccount));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully");
  } else {
    console.log("Firebase Admin SDK already initialized");
  }
  
  adminDb = admin.firestore();
  if (adminDb) {
    console.log("Firestore initialized successfully");
  } else {
    console.error("Failed to initialize Firestore");
  }
  
  adminAuth = admin.auth();
  if (adminAuth) {
    console.log("Auth initialized successfully");
  } else {
    console.error("Failed to initialize Auth");
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK:", error);
  
  // Provide more detailed error diagnostics
  if (error instanceof Error) {
    console.error(`Error name: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
    
    // Check for common Firebase initialization issues
    if (error.message.includes('private_key')) {
      console.error("HINT: Check that your FIREBASE_PRIVATE_KEY environment variable is properly formatted with escaped newlines");
    } else if (error.message.includes('credential')) {
      console.error("HINT: Check that your service account credentials are correctly formatted");
    }
  }
  
  // We don't throw here to allow the app to start, but services using Firebase will need to check
  // if adminDb/adminAuth are null before using them
}

// Export Firebase Admin services
export { adminDb, adminAuth };
