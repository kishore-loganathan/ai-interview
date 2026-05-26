# Deployment Guide

## Render Deployment

### 1. Build & Start Commands
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### 2. Environment Variables
Set these environment variables in your Render dashboard:

```
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key_here
MongoDB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
PORT=10000
```

### 3. Node.js Version
- Ensure Node.js version is set to 18 or higher in Render settings

### 4. Repository Setup
- Connect your GitHub repository
- Set the root directory to `/` (not `/backend`)
- The deployment will automatically use the root `package.json` which redirects to the backend

### 5. Frontend Deployment (Separate Service)
For the frontend (mock folder), create a separate Render static site:
- **Build Command**: `cd mock && npm install && npm run build`
- **Publish Directory**: `mock/dist`
- **Environment Variables**: 
  ```
  VITE_API_URL=https://your-backend-url.onrender.com/api
  ```

## Local Development

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd mock
npm install
npm run dev
```

## Environment Variables Reference

See `backend/.env.example` for all required environment variables.

**Important**: Never commit `.env` files to version control. Use the example file as a template.