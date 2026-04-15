import { Navigate } from 'react-router-dom';
import { getUser, isLoggedIn } from '../utils/auth';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const loggedIn = isLoggedIn();
  const user = getUser();

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;