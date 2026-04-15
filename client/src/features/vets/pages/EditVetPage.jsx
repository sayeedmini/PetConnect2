import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import VetForm from '../components/VetForm';
import { getVetById } from '../services/vetApi';

function EditVetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vet, setVet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVet = async () => {
      try {
        const response = await getVetById(id);
        setVet(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchVet();
  }, [id]);

  if (loading) return <div style={{ padding: '30px' }}><p>Loading clinic...</p></div>;
  if (!vet) return <div style={{ padding: '30px' }}><p>Vet clinic not found.</p></div>;

  return (
    <div style={{ padding: '30px' }}>
      <Link to={`/vets/${id}`}>← Back to Details</Link>
      <h1 style={{ marginTop: '14px' }}>Edit Vet Clinic</h1>
      <VetForm
        initialData={vet}
        isEdit
        onSuccess={(updatedVet) => navigate(`/vets/${updatedVet._id}`)}
      />
    </div>
  );
}

export default EditVetPage;