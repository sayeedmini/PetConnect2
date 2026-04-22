import { useNavigate } from 'react-router-dom';
import VetForm from '../components/VetForm';
import SiteLayout from '../../../components/SiteLayout';

function AddVetPage() {
  const navigate = useNavigate();

  return (
    <SiteLayout
      compact
      backTo="/vets"
      backLabel="Back to vet clinics"
      eyebrow="Clinic management"
      title="Add a new veterinary clinic"
      subtitle="Create a professional clinic listing with clear location, schedule, and service details."
    >
      <VetForm onSuccess={(newVet) => navigate(`/vets/${newVet._id}`)} />
    </SiteLayout>
  );
}

export default AddVetPage;
