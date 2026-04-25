import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authApi';
import { saveAuth } from '../utils/auth';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/vets';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ccc',
    outline: 'none',
    fontSize: '14px',
    color: '#111827',
    caretColor: '#111827',
    WebkitTextFillColor: '#111827',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#002045',
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(formData);
      saveAuth(data.token, data.user);
      alert('Login successful');
      navigate(redirectTo, { replace: true });
    } catch (error) {
      alert(error?.response?.data?.message || 'Login failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f7fb',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '450px',
          background: '#fff',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        }}
      >
        <h1
          style={{
            marginBottom: '8px',
            textAlign: 'center',
            color: '#002045',
          }}
        >
          Login
        </h1>

        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid #d1d5db',
            background: '#fff',
            color: '#002045',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Back
        </button>

        <p
          style={{
            marginBottom: '24px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px',
          }}
        >
          Sign in to continue with PetConnect
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={labelStyle}>
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="password" style={labelStyle}>
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              borderRadius: '10px',
              background: loading ? '#7a8ca5' : '#002045',
              color: '#fff',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p
          style={{
            marginTop: '18px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#666',
          }}
        >
          No account yet?{' '}
          <Link
            to="/register"
            state={{ from: redirectTo }}
            style={{
              color: '#002045',
              fontWeight: '700',
              textDecoration: 'none',
            }}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
