import { useEffect, useState } from 'react';
import { createVet, updateVet } from '../services/vetApi';

function VetForm({ initialData = null, isEdit = false, onSuccess }) {
  const [formData, setFormData] = useState({
    clinicName: '',
    address: '',
    contactNumber: '',
    servicesOffered: '',
    openTime: '',
    closeTime: '',
    consultationFee: '',
    rating: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        clinicName: initialData.clinicName || '',
        address: initialData.address || '',
        contactNumber: initialData.contactNumber || '',
        servicesOffered: Array.isArray(initialData.servicesOffered)
          ? initialData.servicesOffered.join(', ')
          : '',
        openTime: initialData.workingHours?.openTime || '',
        closeTime: initialData.workingHours?.closeTime || '',
        consultationFee: initialData.consultationFee || '',
        rating: initialData.rating || '',
        latitude: initialData.latitude || '',
        longitude: initialData.longitude || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      clinicName: formData.clinicName,
      address: formData.address,
      contactNumber: formData.contactNumber,
      servicesOffered: formData.servicesOffered
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      openTime: formData.openTime,
      closeTime: formData.closeTime,
      consultationFee: Number(formData.consultationFee),
      rating: Number(formData.rating || 0),
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
    };

    try {
      let response;

      if (isEdit && initialData?._id) {
        response = await updateVet(initialData._id, payload);
        alert('Vet clinic updated successfully');
      } else {
        response = await createVet(payload);
        alert('Vet clinic added successfully');
      }

      if (onSuccess) {
        onSuccess(response.data);
      }

      if (!isEdit) {
        setFormData({
          clinicName: '',
          address: '',
          contactNumber: '',
          servicesOffered: '',
          openTime: '',
          closeTime: '',
          consultationFee: '',
          rating: '',
          latitude: '',
          longitude: '',
        });
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to save vet clinic');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        name="clinicName"
        placeholder="Clinic Name"
        value={formData.clinicName}
        onChange={handleChange}
        required
      />

      <input
        name="address"
        placeholder="Address"
        value={formData.address}
        onChange={handleChange}
        required
      />

      <input
        name="contactNumber"
        placeholder="Contact Number"
        value={formData.contactNumber}
        onChange={handleChange}
        required
      />

      <input
        name="servicesOffered"
        placeholder="Services (comma separated)"
        value={formData.servicesOffered}
        onChange={handleChange}
      />

      <input
        name="openTime"
        type="time"
        value={formData.openTime}
        onChange={handleChange}
        required
      />

      <input
        name="closeTime"
        type="time"
        value={formData.closeTime}
        onChange={handleChange}
        required
      />

      <input
        name="consultationFee"
        type="number"
        placeholder="Consultation Fee"
        value={formData.consultationFee}
        onChange={handleChange}
        required
      />

      <input
        name="rating"
        type="number"
        step="0.1"
        min="0"
        max="5"
        placeholder="Rating"
        value={formData.rating}
        onChange={handleChange}
      />

      <input
        name="latitude"
        type="number"
        step="any"
        placeholder="Latitude"
        value={formData.latitude}
        onChange={handleChange}
        required
      />

      <input
        name="longitude"
        type="number"
        step="any"
        placeholder="Longitude"
        value={formData.longitude}
        onChange={handleChange}
        required
      />

      <button type="submit">
        {isEdit ? 'Update Vet Clinic' : 'Add Vet Clinic'}
      </button>
    </form>
  );
}

const styles = {
  form: {
    display: 'grid',
    gap: '12px',
    maxWidth: '500px',
    marginTop: '20px',
  },
};

export default VetForm;