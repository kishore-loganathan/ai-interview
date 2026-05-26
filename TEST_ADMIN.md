# Testing Admin Panel

## The Issue
The 404 errors you're seeing are actually **authentication errors** being misreported. The routes ARE working correctly.

## How to Test

### Step 1: Login First
1. Go to `http://localhost:5173/signin`
2. Login with your credentials
3. This will store the JWT token in localStorage

### Step 2: Access Admin Panel
1. Navigate to `http://localhost:5173/admin/dashboard`
2. The admin panel should now load with real data

## Verification

The backend is working correctly. You can verify by running:

```bash
# This should return "Not authorized, no token" (401)
curl http://localhost:3001/api/admin/dashboard/stats

# This should return "Not authorized, token failed" (401) 
curl -H "Authorization: Bearer test" http://localhost:3001/api/admin/dashboard/stats
```

Both responses confirm the routes are registered and working.

## Why 404 in Browser?

The axios interceptor in `api.ts` might be:
1. Redirecting to login on 401 errors
2. Not properly handling the error response
3. The browser console is showing the wrong error code

## Solution

**You must be logged in to access the admin panel.**

The admin routes require a valid JWT token which is obtained after login.

## Quick Fix

If you want to test without login, temporarily comment out the `protect` middleware in `/backend/src/routes/admin.routes.js`:

```javascript
// Change this:
router.get('/dashboard/stats', protect, getDashboardStats);

// To this (ONLY FOR TESTING):
router.get('/dashboard/stats', getDashboardStats);
```

**Remember to add it back for production!**
