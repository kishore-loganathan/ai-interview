# Admin Access Control - Complete Guide

## Overview
Role-based access control (RBAC) system for the admin panel with three user roles:
- **user** (default) - Regular users
- **admin** - Can access admin panel
- **superadmin** - Full admin access (future use)

---

## Implementation Summary

### ✅ Backend Changes

#### 1. User Model Updated
**File:** `/backend/src/models/User.js`

Added `role` field:
```javascript
role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
}
```

#### 2. Auth Middleware Enhanced
**File:** `/backend/src/middleware/auth.middleware.js`

Added two new middleware functions:
- `adminOnly` - Requires admin or superadmin role
- `superAdminOnly` - Requires superadmin role only

```javascript
const adminOnly = async (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        next();
    } else {
        res.status(403).json({ 
            success: false, 
            error: 'Access denied. Admin privileges required.' 
        });
    }
};
```

#### 3. Admin Routes Protected
**File:** `/backend/src/routes/admin.routes.js`

All admin routes now use both `protect` and `adminOnly` middleware:
```javascript
router.get('/dashboard/stats', protect, adminOnly, getDashboardStats);
router.get('/users', protect, adminOnly, getAllUsers);
// ... etc
```

#### 4. Auth Controller Updated
**File:** `/backend/src/controllers/auth.controller.js`

- Login and signup now return user `role`
- Added `getCurrentUser` endpoint (`GET /api/auth/me`)

#### 5. Auth Routes Updated
**File:** `/backend/src/routes/auth.routes.js`

Added new route:
```javascript
router.get('/me', protect, getCurrentUser);
```

---

### ✅ Frontend Changes

#### 1. AdminRoute Component Created
**File:** `/mock/src/components/AdminRoute.tsx`

Protected route wrapper that:
- Checks if user is logged in
- Fetches current user role via `/api/auth/me`
- Shows "Access Denied" if not admin
- Redirects to dashboard with button

#### 2. App.tsx Updated
**File:** `/mock/src/App.tsx`

All admin routes wrapped with `AdminRoute`:
```tsx
<Route path="/admin/dashboard" element={
  <ProtectedRoute>
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  </ProtectedRoute>
} />
```

#### 3. API Service
**File:** `/mock/src/services/api.ts`

Already has `getMe()` method:
```typescript
getMe: async () => {
  const response = await api.get('/auth/me');
  return response.data;
}
```

---

## How to Make a User Admin

### Method 1: Using the Script (Recommended)

**File:** `/backend/scripts/makeAdmin.js`

```bash
# Navigate to backend directory
cd backend

# Run the script with user's email
node scripts/makeAdmin.js user@example.com
```

**Output:**
```
✓ Connected to MongoDB
✓ Successfully made John Doe (user@example.com) an admin
  User ID: 507f1f77bcf86cd799439011
  Role: admin
```

### Method 2: Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to `users` collection
4. Find the user by email
5. Edit the document
6. Change `role` field from `"user"` to `"admin"`
7. Save

### Method 3: Using MongoDB Shell

```bash
# Connect to MongoDB
mongosh "your-connection-string"

# Switch to your database
use your-database-name

# Update user role
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

### Method 4: Direct Database Query

```javascript
// In Node.js REPL or script
const User = require('./src/models/User');
await User.findOneAndUpdate(
  { email: 'user@example.com' },
  { role: 'admin' }
);
```

---

## Testing Admin Access

### 1. Create a Test Admin User

```bash
cd backend
node scripts/makeAdmin.js test@admin.com
```

### 2. Login as Admin

1. Go to `http://localhost:5173/signin`
2. Login with admin credentials
3. Navigate to `http://localhost:5173/admin/dashboard`
4. You should see the admin panel

### 3. Test Non-Admin Access

1. Login as regular user
2. Try to access `http://localhost:5173/admin/dashboard`
3. You should see "Access Denied" message

---

## API Response Examples

### Success - Admin User
```json
GET /api/auth/me

{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "admin@example.com",
    "role": "admin",
    "phone": "+1234567890",
    "location": "New York",
    "profilePicture": "/uploads/profile-pictures/profile-123.jpg",
    "primarySkill": "React",
    "difficulty": "Medium",
    "notifications": {
      "dailyReminder": true,
      "weeklyReport": true,
      "newFeatures": false
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error - Non-Admin Accessing Admin Route
```json
GET /api/admin/dashboard/stats

{
  "success": false,
  "error": "Access denied. Admin privileges required."
}
```

### Error - Not Authenticated
```json
GET /api/admin/dashboard/stats

{
  "success": false,
  "error": "Not authorized, no token"
}
```

---

## Security Features

### 1. Double Protection
- **Authentication** (`protect` middleware) - Verifies JWT token
- **Authorization** (`adminOnly` middleware) - Checks user role

### 2. Frontend Guard
- `AdminRoute` component checks role before rendering
- Shows user-friendly "Access Denied" page
- Prevents unauthorized UI access

### 3. Backend Validation
- All admin endpoints validate role on every request
- Returns 403 Forbidden for non-admin users
- JWT token includes user ID, role fetched from database

### 4. Role Hierarchy
```
superadmin > admin > user
```
- Superadmin can do everything admin can
- Admin can access admin panel
- User has no admin access

---

## Troubleshooting

### Issue: "Access Denied" even though user is admin

**Solution:**
1. Check user role in database:
   ```bash
   node scripts/makeAdmin.js user@example.com
   ```

2. Clear browser localStorage and login again:
   ```javascript
   localStorage.clear();
   ```

3. Verify JWT token includes correct user ID:
   ```javascript
   // In browser console
   const token = localStorage.getItem('accessToken');
   console.log(JSON.parse(atob(token.split('.')[1])));
   ```

### Issue: Script fails with "User not found"

**Solution:**
- Verify email is correct
- Check if user exists in database
- Ensure MongoDB connection string is correct in `.env`

### Issue: 403 error on admin routes

**Solution:**
1. Check if backend server restarted after changes
2. Verify middleware order in routes:
   ```javascript
   router.get('/route', protect, adminOnly, controller);
   // NOT: router.get('/route', adminOnly, protect, controller);
   ```

3. Check user role in database matches 'admin' or 'superadmin'

---

## Future Enhancements

### 1. Admin Management UI
Create admin panel page to:
- Promote users to admin
- Demote admins to user
- View all admins
- Audit log of admin actions

### 2. Granular Permissions
```javascript
permissions: {
  canViewUsers: true,
  canDeleteUsers: false,
  canViewInterviews: true,
  canExportData: true
}
```

### 3. Activity Logging
```javascript
AdminLog.create({
  admin: req.user._id,
  action: 'DELETE_USER',
  target: userId,
  timestamp: new Date()
});
```

### 4. Two-Factor Authentication
- Require 2FA for admin accounts
- SMS or authenticator app codes
- Backup codes for recovery

---

## Quick Reference

### Make User Admin
```bash
cd backend
node scripts/makeAdmin.js user@example.com
```

### Check User Role
```bash
# MongoDB Shell
db.users.findOne({ email: "user@example.com" }, { role: 1 })
```

### Test Admin Access
```bash
# Login as admin, then:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/admin/dashboard/stats
```

### Remove Admin Access
```bash
# MongoDB Shell
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "user" } }
)
```

---

## Files Modified

### Backend
- ✅ `/backend/src/models/User.js`
- ✅ `/backend/src/middleware/auth.middleware.js`
- ✅ `/backend/src/routes/admin.routes.js`
- ✅ `/backend/src/controllers/auth.controller.js`
- ✅ `/backend/src/routes/auth.routes.js`
- ✅ `/backend/scripts/makeAdmin.js` (new)

### Frontend
- ✅ `/mock/src/components/AdminRoute.tsx` (new)
- ✅ `/mock/src/App.tsx`
- ✅ `/mock/src/services/api.ts` (already had getMe)

---

## Summary

The admin panel is now fully protected with role-based access control:

1. ✅ **Backend** validates admin role on every request
2. ✅ **Frontend** checks role before showing admin UI
3. ✅ **Script** provided to easily promote users to admin
4. ✅ **Security** double-layered (auth + role check)
5. ✅ **User Experience** clear "Access Denied" message

**To grant admin access:** Run `node scripts/makeAdmin.js user@example.com`
