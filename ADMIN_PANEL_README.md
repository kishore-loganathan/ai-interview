# Admin Panel Documentation

## Overview
Complete admin panel implementation with real API integration for managing the AI Interview platform.

## Features Implemented

### 1. Dashboard (`/admin/dashboard`)
- **Real-time Stats**
  - Total users count
  - Sessions today
  - Average score across all interviews
  - Completion rate
- **Charts**
  - Interview sessions per day (last 7 days)
  - Score distribution
  - Technology breakdown
- **System Status**
  - AI Question Engine status
  - Voice Interview API status
  - Resume Parser status
  - Score Pipeline status

### 2. User Management (`/admin/users`)
- **User List** with search functionality
- **User Details**
  - Profile information
  - Interview count
  - Average score
  - Activity streak
  - Account status (Active/Inactive/Suspended)
- **Actions**
  - Change user status
  - Delete user account
  - View user details

### 3. Interview Sessions (`/admin/interviews`)
- **Session List** with search
- **Session Details**
  - Session ID
  - Candidate name
  - Technology & difficulty
  - Score & duration
  - Status
- **Actions**
  - View session details
  - Download session report

### 4. AI Evaluations (`/admin/evaluations`)
- **Evaluation List**
- **Detailed View**
  - Overall score
  - Score breakdown (Technical, Communication, Depth)
  - Strengths identified
  - Missing concepts
  - Question-by-question review with feedback

### 5. Analytics (`/admin/analytics`)
- **Topic Proficiency** - Radar chart showing average scores by technology
- **Score Brackets** - Distribution of scores across ranges
- **Difficulty Distribution** - Breakdown by Easy/Medium/Hard
- **Interview Types** - Distribution by interview type
- **Top Technologies** - Most popular technologies

## API Endpoints

### Backend Routes (`/api/admin/*`)
All routes require authentication via JWT token.

```javascript
GET  /api/admin/dashboard/stats    // Dashboard statistics
GET  /api/admin/users               // All users with stats
PATCH /api/admin/users/:userId/status  // Update user status
DELETE /api/admin/users/:userId     // Delete user
GET  /api/admin/interviews          // All interview sessions
GET  /api/admin/evaluations         // AI evaluation reports
GET  /api/admin/analytics           // Analytics data
```

## How to Access

1. **Start Backend Server**
   ```bash
   cd backend
   node index.js
   ```

2. **Start Frontend**
   ```bash
   cd mock
   npm run dev
   ```

3. **Navigate to Admin Panel**
   - Login to the application
   - Go to `/admin/dashboard` or `/admin`
   - Use the sidebar to navigate between sections

## Navigation

The admin panel has its own layout separate from the main app:
- **Dashboard** - Overview and metrics
- **Users** - User management (badge shows new users)
- **Interviews** - Session management (badge shows active sessions)
- **AI Evaluations** - Review AI-generated feedback
- **Analytics** - Deep-dive into performance data
- **Settings** - System configuration (placeholder)

## Data Flow

1. **Frontend** makes API calls via `adminAPI` service
2. **Backend** admin controller processes requests
3. **MongoDB** queries aggregate data from User and Interview collections
4. **Response** formatted and sent back to frontend
5. **UI** renders data with charts and tables

## Security Notes

- All admin routes require authentication
- In production, add role-based access control (admin role check)
- Sensitive operations (delete user) require confirmation
- API keys and secrets are not exposed in responses

## Future Enhancements

- [ ] Add admin role field to User model
- [ ] Implement role-based middleware
- [ ] Add export functionality (CSV/PDF)
- [ ] Real-time updates with WebSockets
- [ ] Advanced filtering and sorting
- [ ] Bulk operations
- [ ] Activity logs and audit trail
- [ ] Email notifications for admin actions
