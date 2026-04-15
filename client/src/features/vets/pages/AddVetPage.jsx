import { Link, useNavigate } from 'react-router-dom';
import VetForm from '../components/VetForm';

function AddVetPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '30px' }}>
      <Link to="/vets">← Back to Vet Clinics</Link>
      <h1 style={{ marginTop: '14px' }}>Add Vet Clinic</h1>
      <VetForm onSuccess={(newVet) => navigate(`/vets/${newVet._id}`)} />
    </div>
  );
}

export default AddVetPage;