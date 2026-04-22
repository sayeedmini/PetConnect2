import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAppointmentById } from '../../appointments/services/appointmentApi';
import { getPrescriptionByAppointment, savePrescriptionByAppointment } from '../services/prescriptionApi';
import { downloadPrescriptionPdf } from '../utils/prescriptionPdf';
import { getUser } from '../../auth/utils/auth';
import SiteLayout from '../../../components/SiteLayout';
import { formatFriendlyDate } from '../../../utils/date';

const createMedicineRow = () => ({
  name: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
});

function AppointmentPrescriptionPage() {
  const { appointmentId } = useParams();
  const currentUser = getUser();
  const isPrescriptionEditor = ['vet', 'admin'].includes(currentUser?.role);

  const [appointment, setAppointment] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    diagnosis: '',
    notes: '',
    medicines: [createMedicineRow()],
  });

  const loadPageData = useCallback(async () => {
    setLoading(true);

    try {
      const [appointmentResponse, prescriptionResponse] = await Promise.all([
        getAppointmentById(appointmentId),
        getPrescriptionByAppointment(appointmentId),
      ]);

      const appointmentData = appointmentResponse.data;
      const prescriptionData = prescriptionResponse.data;

      setAppointment(appointmentData);
      setPrescription(prescriptionData);

      if (prescriptionData) {
        setFormData({
          diagnosis: prescriptionData.diagnosis || '',
          notes: prescriptionData.notes || '',
          medicines: prescriptionData.medicines?.length ? prescriptionData.medicines : [createMedicineRow()],
        });
      } else {
        setFormData({
          diagnosis: '',
          notes: '',
          medicines: [createMedicineRow()],
        });
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to load prescription page');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const canEditPrescription = useMemo(() => {
    return isPrescriptionEditor && appointment?.status === 'completed';
  }, [appointment?.status, isPrescriptionEditor]);

  const handleFieldChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [field]: value } : medicine
      ),
    }));
  };

  const addMedicine = () => {
    setFormData((prev) => ({
      ...prev,
      medicines: [...prev.medicines, createMedicineRow()],
    }));
  };

  const removeMedicine = (index) => {
    setFormData((prev) => ({
      ...prev,
      medicines:
        prev.medicines.length === 1
          ? [createMedicineRow()]
          : prev.medicines.filter((_, medicineIndex) => medicineIndex !== index),
    }));
  };

  const handleSavePrescription = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      const response = await savePrescriptionByAppointment(appointmentId, formData);
      setPrescription(response.data);
      alert('Prescription saved successfully');
      await loadPageData();
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to save prescription');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SiteLayout compact backTo="/appointments" backLabel="Back to appointments" title="Prescription workspace" subtitle="Loading prescription information...">
        <div className="card"><div className="card-body helper-text">Loading prescription workspace...</div></div>
      </SiteLayout>
    );
  }

  if (!appointment) {
    return (
      <SiteLayout compact backTo="/appointments" backLabel="Back to appointments" title="Appointment not found" subtitle="The selected appointment could not be loaded.">
        <div className="card"><div className="card-body empty-state">Appointment not found.</div></div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout
      compact
      backTo="/appointments"
      backLabel="Back to appointments"
      eyebrow="Digital prescription"
      title="Prescription workspace"
      subtitle="Create, update, download, and verify prescriptions after a completed appointment."
      actions={
        prescription ? (
          <button type="button" className="btn btn-primary" onClick={() => downloadPrescriptionPdf(prescription)}>
            Download PDF prescription
          </button>
        ) : null
      }
    >
      <section className="detail-layout">
        <div className="side-stack">
          <div className="card detail-panel">
            <h3 className="section-title">Appointment summary</h3>
            <div className="info-grid">
              <div className="info-row-card">
                <span className="info-label">Clinic</span>
                <span className="info-value">{appointment.clinic?.clinicName}</span>
              </div>
              <div className="info-row-card">
                <span className="info-label">Pet</span>
                <span className="info-value">{appointment.petName}</span>
              </div>
              <div className="info-row-card">
                <span className="info-label">Pet type</span>
                <span className="info-value">{appointment.petType || 'Not specified'}</span>
              </div>
              <div className="info-row-card">
                <span className="info-label">Date</span>
                <span className="info-value">{formatFriendlyDate(appointment.appointmentDate)}</span>
              </div>
              <div className="info-row-card">
                <span className="info-label">Time</span>
                <span className="info-value">{appointment.slotLabel}</span>
              </div>
              <div className="info-row-card">
                <span className="info-label">Status</span>
                <span className="info-value">{appointment.status}</span>
              </div>
            </div>
          </div>

          <div className="card detail-panel">
            <h3 className="section-title">Prescription status</h3>
            <p className="card-copy">
              {prescription ? 'A prescription already exists for this appointment.' : 'No prescription has been saved yet.'}
            </p>
            <p className="card-copy"><strong>Verification code:</strong> {prescription?.verificationCode || 'Pending'}</p>
            <p className="card-copy"><strong>Issued at:</strong> {prescription ? new Date(prescription.issuedAt || prescription.createdAt).toLocaleString() : 'Pending'}</p>
            {!canEditPrescription && !prescription && (
              <p className="calendar-note">
                Only the assigned vet or admin can create a prescription after the appointment is completed.
              </p>
            )}
          </div>
        </div>

        <div className="side-stack">
          {canEditPrescription ? (
            <form onSubmit={handleSavePrescription} className="form-card">
              <div className="form-grid">
                <div className="form-group form-full">
                  <label>Diagnosis</label>
                  <textarea
                    name="diagnosis"
                    rows="4"
                    value={formData.diagnosis}
                    onChange={handleFieldChange}
                    placeholder="Primary diagnosis and clinical findings"
                    required
                  />
                </div>

                <div className="form-full card slot-panel">
                  <div className="toolbar" style={{ justifyContent: 'space-between' }}>
                    <h3 className="section-title" style={{ margin: 0 }}>Medicines</h3>
                    <button type="button" className="btn btn-secondary" onClick={addMedicine}>
                      Add medicine
                    </button>
                  </div>

                  <div className="appointment-list" style={{ marginTop: '16px' }}>
                    {formData.medicines.map((medicine, index) => (
                      <div key={`${index}-${medicine.name}`} className="card detail-panel">
                        <div className="toolbar" style={{ justifyContent: 'space-between' }}>
                          <strong>Medicine {index + 1}</strong>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => removeMedicine(index)}>
                            Remove
                          </button>
                        </div>

                        <div className="form-grid" style={{ marginTop: '12px' }}>
                          <div className="form-group">
                            <label>Name</label>
                            <input value={medicine.name} onChange={(e) => handleMedicineChange(index, 'name', e.target.value)} placeholder="Medicine name" required />
                          </div>
                          <div className="form-group">
                            <label>Dosage</label>
                            <input value={medicine.dosage} onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)} placeholder="1 tablet" required />
                          </div>
                          <div className="form-group">
                            <label>Frequency</label>
                            <input value={medicine.frequency} onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)} placeholder="Twice daily" />
                          </div>
                          <div className="form-group">
                            <label>Duration</label>
                            <input value={medicine.duration} onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)} placeholder="5 days" />
                          </div>
                          <div className="form-group form-full">
                            <label>Instructions</label>
                            <textarea value={medicine.instructions} onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)} rows="3" placeholder="After food / before sleep / special instructions" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group form-full">
                  <label>Additional notes</label>
                  <textarea
                    name="notes"
                    rows="5"
                    value={formData.notes}
                    onChange={handleFieldChange}
                    placeholder="Follow-up advice, dietary instructions, warning signs, or revisit notes"
                  />
                </div>

                <div className="form-full toolbar">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving prescription...' : prescription ? 'Update prescription' : 'Save prescription'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="card detail-panel">
              <h3 className="section-title">Saved prescription</h3>
              {prescription ? (
                <>
                  <p className="card-copy"><strong>Diagnosis:</strong> {prescription.diagnosis}</p>
                  <p className="card-copy"><strong>Notes:</strong> {prescription.notes || 'No additional notes.'}</p>
                </>
              ) : (
                <p className="card-copy">A prescription is not available yet.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

export default AppointmentPrescriptionPage;
