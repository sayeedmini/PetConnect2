import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { verifyPrescription } from '../services/prescriptionApi';

function PrescriptionVerificationPage() {
  const { verificationCode } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVerification = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await verifyPrescription(verificationCode);
        setPrescription(response.data);
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || 'Failed to verify prescription');
        console.error(fetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [verificationCode]);

  return (
    <div style={styles.page}>
      <Link to="/" style={styles.backLink}>Back to Home</Link>

      <div style={styles.card}>
        <h1 style={styles.title}>Prescription Verification</h1>

        {loading ? (
          <p>Verifying prescription...</p>
        ) : error ? (
          <div>
            <p style={styles.errorText}>{error}</p>
            <p>Please check the QR code or verification code again.</p>
          </div>
        ) : (
          <div>
            <div style={styles.verifiedBadge}>Verified Authentic Prescription</div>
            <p><strong>Verification Code:</strong> {prescription.verificationCode}</p>
            <p><strong>Clinic:</strong> {prescription.clinic?.clinicName}</p>
            <p><strong>Vet:</strong> {prescription.vet?.name}</p>
            <p><strong>Pet:</strong> {prescription.petName}</p>
            <p><strong>Diagnosis:</strong> {prescription.diagnosis}</p>
            <p><strong>Issued At:</strong> {new Date(prescription.issuedAt || prescription.createdAt).toLocaleString()}</p>
            <p><strong>Medicines Count:</strong> {prescription.medicines?.length || 0}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '30px',
    color: '#0f172a',
  },
  card: {
    marginTop: '18px',
    background: '#ffffff',
    color: '#0f172a',
    borderRadius: '18px',
    padding: '24px',
    boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
    maxWidth: '760px',
  },
  title: {
    color: '#0f172a',
    marginBottom: '16px',
  },
  backLink: {
    color: '#0f172a',
    fontWeight: 600,
    textDecoration: 'none',
  },
  verifiedBadge: {
    display: 'inline-block',
    padding: '10px 14px',
    borderRadius: '999px',
    background: '#dcfce7',
    color: '#166534',
    fontWeight: 700,
    marginBottom: '16px',
  },
  errorText: {
    color: '#b91c1c',
    fontWeight: 700,
  },
};

export default PrescriptionVerificationPage;
