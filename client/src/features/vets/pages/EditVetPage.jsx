import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VetForm from '../components/VetForm';
import { getVetById } from '../services/vetApi';
import SiteLayout from '../../../components/SiteLayout';

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

  if (loading) {
    return (
      <SiteLayout compact backTo={`/vets/${id}`} backLabel="Back to details" title="Edit clinic" subtitle="Loading clinic information...">
        <div className="card"><div className="card-body helper-text">Loading clinic...</div></div>
      </SiteLayout>
    );
  }

  if (!vet) {
    return (
      <SiteLayout compact backTo="/vets" backLabel="Back to clinics" title="Clinic not found" subtitle="The requested clinic could not be loaded.">
        <div className="card"><div className="card-body empty-state">Vet clinic not found.</div></div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout
      compact
      backTo={`/vets/${id}`}
      backLabel="Back to clinic details"
      eyebrow="Clinic management"
      title={`Edit ${vet.clinicName}`}
      subtitle="Update clinic information with a cleaner editing workflow."
    >
      <VetForm initialData={vet} isEdit onSuccess={(updatedVet) => navigate(`/vets/${updatedVet._id}`)} />
    </SiteLayout>
  );
}

export default EditVetPage;
