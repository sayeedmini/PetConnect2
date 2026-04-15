import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import VetListPage from './features/vets/pages/VetListPage';
import AddVetPage from './features/vets/pages/AddVetPage';
import VetDetailsPage from './features/vets/pages/VetDetailsPage';
import EditVetPage from './features/vets/pages/EditVetPage';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import { getUser, isLoggedIn, logout } from './features/auth/utils/auth';

function Home() {
  const user = getUser();
  const loggedIn = isLoggedIn();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '30px' }}>
      <h1>PetConnect</h1>
      <p>Vet Directory with JWT Authentication</p>

      <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
        <Link to="/vets">View Vet Clinics</Link>
        <Link to="/vets/add">Add Vet Clinic</Link>
        {!loggedIn && <Link to="/login">Login</Link>}
        {!loggedIn && <Link to="/register">Register</Link>}
        {loggedIn && <button onClick={handleLogout}>Logout</button>}
      </div>

      {loggedIn && (
        <p style={{ marginTop: '16px' }}>
          Logged in as <strong>{user?.name}</strong> ({user?.role})
        </p>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vets" element={<VetListPage />} />
        <Route path="/vets/:id" element={<VetDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/vets/add"
          element={
            <ProtectedRoute allowedRoles={['vet', 'admin']}>
              <AddVetPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vets/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['vet', 'admin']}>
              <EditVetPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;