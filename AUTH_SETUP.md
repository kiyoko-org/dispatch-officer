# Authentication Setup

This app uses the dispatch-lib for authentication with Supabase. Here's how to set it up:

## Environment Configuration

1. Create a `.env` file in the root directory with the following variables:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Get these values from your Supabase project dashboard:
   - Go to your Supabase project
   - Navigate to Settings > API
   - Copy the Project URL and anon/public key

3. The configuration is automatically loaded via `expo-constants` from the app.config.js file:
   ```javascript
   extra: {
     supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
     supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
   }
   ```

4. Create a `.env` file in your project root:
   ```bash
   # Copy this template and fill in your actual values
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

5. After setting up the environment variables, restart your development server:
   ```bash
   expo start --clear
   ```

## Troubleshooting

If you see the error "supabaseUrl is required", make sure:

1. Your `.env` file is in the project root directory
2. The environment variables are prefixed with `EXPO_PUBLIC_`
3. You've restarted the development server after adding the variables
4. Check the console logs for configuration validation messages

## Authentication Flow

The app uses the `OfficerAuthProvider` from dispatch-lib which provides:

- **Officer Login**: Uses badge number and password
- **Role Validation**: Ensures the user has the "officer" role
- **Session Management**: Automatically handles token refresh and persistence
- **Auth State**: Provides loading states, user data, and error handling

## Key Components

### AuthProvider (`contexts/auth-context.tsx`)
- Initializes the dispatch client
- Wraps the OfficerAuthProvider
- Provides access to the dispatch client throughout the app

### AuthGuard (`components/auth-guard.tsx`)
- Protects routes that require authentication
- Shows loading state while checking auth
- Redirects to login if not authenticated or not an officer

### Login Screen (`app/login.tsx`)
- Uses the `officerLogin` function from dispatch-lib
- Handles badge number and password authentication
- Shows appropriate error messages

## Usage

```typescript
import { useOfficerAuth } from '@/contexts/auth-context';

function MyComponent() {
  const { user, isLoading, signIn, signOut, isOfficer } = useOfficerAuth();
  
  // Access user data
  const badgeNumber = user?.user_metadata?.badge_number;
  const firstName = user?.user_metadata?.first_name;
  
  // Sign out
  const handleLogout = async () => {
    await signOut();
  };
}
```

## Database Requirements

The authentication system expects:

1. A `get_officer_email_by_badge` RPC function in Supabase that takes a badge number and returns the officer's email
2. User metadata with the following structure:
   ```json
   {
     "role": "officer",
     "badge_number": "12345",
     "first_name": "John",
     "last_name": "Doe",
     "rank": "Sergeant"
   }
   ```

## Security Notes

- The OfficerAuthProvider automatically signs out users who don't have the "officer" role
- Session tokens are automatically refreshed
- All authentication state is managed securely through Supabase
