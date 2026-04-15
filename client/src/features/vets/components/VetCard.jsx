import { Link } from 'react-router-dom';

function VetCard({ vet }) {
  const mapUrl = `https://maps.google.com/maps?q=${vet.latitude},${vet.longitude}&z=15&output=embed`;

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <div>
          <h3 style={styles.title}>{vet.clinicName}</h3>
          <p style={styles.badge(vet.isOpenNow)}>
            {vet.isOpenNow ? 'Open now' : 'Closed now'}
          </p>
        </div>

        <div style={styles.metaBox}>
          <strong>⭐ {vet.rating || 0}</strong>
          <span>৳{vet.consultationFee}</span>
        </div>
      </div>

      <p><strong>Address:</strong> {vet.address}</p>
      <p><strong>Contact:</strong> {vet.contactNumber}</p>
      <p><strong>Working Hours:</strong> {vet.workingHours?.openTime} - {vet.workingHours?.closeTime}</p>
      <p><strong>Services:</strong> {vet.servicesOffered?.join(', ') || 'Not specified'}</p>

      {vet.distanceKm !== null && vet.distanceKm !== undefined && (
        <p><strong>Distance:</strong> {vet.distanceKm} km away</p>
      )}

      <iframe
        title={`map-${vet._id}`}
        src={mapUrl}
        style={styles.map}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <div style={styles.actions}>
        <Link to={`/vets/${vet._id}`}>Details</Link>
        <Link to={`/vets/${vet._id}/edit`}>Edit</Link>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    padding: '20px',
    borderRadius: '14px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    marginBottom: '18px',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
  },
  title: {
    marginBottom: '6px',
  },
  badge: (isOpenNow) => ({
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    background: isOpenNow ? '#dcfce7' : '#fee2e2',
    color: isOpenNow ? '#166534' : '#991b1b',
    fontSize: '13px',
    fontWeight: 600,
    marginTop: 0,
  }),
  metaBox: {
    display: 'grid',
    gap: '6px',
    textAlign: 'right',
  },
  map: {
    width: '100%',
    height: '200px',
    border: 0,
    borderRadius: '10px',
    marginTop: '12px',
  },
  actions: {
    display: 'flex',
    gap: '14px',
    marginTop: '14px',
    fontWeight: 600,
  },
};

export default VetCard;