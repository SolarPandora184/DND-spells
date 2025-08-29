# Firebase Integration Guide

This D&D Companion application is prepared for Firebase integration. Follow these steps to enable Firebase authentication and migrate from the current system.

## Current System vs Firebase

### Current Authentication System
- Custom login with character names
- PostgreSQL user storage
- Session-based authentication
- Role-based access (Player/DM)

### Firebase Integration Benefits
- Google OAuth authentication
- Secure user management
- Real-time database options
- Scalable cloud infrastructure

## Integration Steps

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new Firebase project
3. Enable Authentication in the Firebase console
4. Enable Google sign-in method
5. Add your Replit domain to authorized domains:
   - Development: `your-repl-name.replit.dev`
   - Production: `your-app-name.replit.app`

### 2. Get Firebase Configuration

From your Firebase project settings, copy these values:
- Project ID
- API Key
- App ID

### 3. Add Environment Variables

In Replit Secrets, add:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Install Firebase SDK

Run in the terminal:
```bash
npm install firebase
```

### 5. Update Authentication System

#### A. Update the Firebase config file
Uncomment all code in `client/src/lib/firebase-config.ts`

#### B. Modify the login component
Replace `AuthLogin` component to use Firebase:

```typescript
// In auth-login.tsx
import { loginWithGoogle } from "@/lib/firebase-config";

// Replace the current login form with:
<Button onClick={loginWithGoogle}>
  Sign in with Google
</Button>
```

#### C. Update App.tsx authentication flow
```typescript
// In App.tsx
import { handleAuthRedirect } from "@/lib/firebase-config";

// Add useEffect to handle auth redirects
useEffect(() => {
  handleAuthRedirect().then((result) => {
    if (result) {
      // Map Firebase user to your user schema
      const userData = {
        characterName: result.user.displayName || "Unknown",
        role: "player", // Default role, can be changed later
        email: result.user.email,
        profileImageUrl: result.user.photoURL,
      };
      
      // Create or update user in your database
      handleLoginSuccess(userData);
    }
  });
}, []);
```

### 6. Database Schema Updates

Update your user schema to include Firebase user IDs:

```typescript
// In shared/schema.ts
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firebaseUid: varchar("firebase_uid").unique(), // Add Firebase UID
  email: varchar("email").unique(),
  characterName: text("character_name").notNull(),
  role: text("role").notNull().default("player"),
  profileImageUrl: varchar("profile_image_url"),
  // ... rest of schema
});
```

### 7. Update Backend Authentication

Modify server authentication to verify Firebase tokens:

```typescript
// Install Firebase Admin SDK
npm install firebase-admin

// In server/firebase-admin.ts
import admin from 'firebase-admin';

export async function verifyFirebaseToken(token: string) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid Firebase token');
  }
}
```

### 8. Migration Strategy

1. **Phase 1**: Deploy current system as-is
2. **Phase 2**: Add Firebase as alternative login option
3. **Phase 3**: Migrate existing users to Firebase
4. **Phase 4**: Remove legacy authentication system

### 9. Testing Checklist

- [ ] Firebase project configured
- [ ] Environment variables set
- [ ] Firebase SDK installed
- [ ] Google sign-in working
- [ ] User data properly mapped
- [ ] Database schema updated
- [ ] Backend token verification working
- [ ] User roles preserved
- [ ] Real-time features still functional

## Notes

- The current WebSocket and real-time features will continue to work unchanged
- User roles (Player/DM) will be preserved during migration
- The comprehensive D&D 5e spell database remains intact
- All combat and initiative tracking features continue working
- Character data and game sessions are preserved

## Rollback Plan

If Firebase integration fails, the current authentication system can be easily restored by:
1. Reverting changes to App.tsx
2. Removing Firebase imports
3. Using the original AuthLogin component

The database and core features remain unaffected by the authentication system changes.