import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Support both old 'token' and new 'accessToken' for backward compatibility
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  
  if (!token) {
    // Redirect to sign in if not authenticated
    return <Navigate to="/signin" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
