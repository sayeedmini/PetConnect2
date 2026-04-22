import { Navigate, useLocation } from 'react-router-dom';
import { getUser, isLoggedIn } from '../utils/auth';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const loggedIn = isLoggedIn();
  const user = getUser();
  const location = useLocation();
  const from = `${location.pathname}${location.search}${location.hash}`;

  if (!loggedIn) {
    return <Navigate to="/login" replace state={{ from }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
