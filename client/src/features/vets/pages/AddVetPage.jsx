import { useNavigate } from 'react-router-dom';
import VetForm from '../components/VetForm';
import SiteLayout from '../../../components/SiteLayout';

const headerPaddingStyle = {
  paddingLeft: '2.5rem',
  paddingRight: '2.5rem',
  paddingTop: '0.75rem',
  paddingBottom: '0.75rem',
};

function AddVetPage() {
  const navigate = useNavigate();

  return (
    <SiteLayout
      compact
      backTo="/vets"
      backLabel={
        <span className="inline-block" style={headerPaddingStyle}>
          Back to vet clinics
        </span>
      }
      eyebrow={
        <span className="inline-block" style={headerPaddingStyle}>
          Clinic management
        </span>
      }
      title={
        <span className="block" style={headerPaddingStyle}>
          Add a new veterinary clinic
        </span>
      }
      subtitle={
        <span className="block max-w-4xl" style={headerPaddingStyle}>
          Create a professional clinic listing with clear location, schedule, and service details.
        </span>
      }
    >
      <VetForm onSuccess={(newVet) => navigate(`/vets/${newVet._id}`)} />
    </SiteLayout>
  );
}

export default AddVetPage;