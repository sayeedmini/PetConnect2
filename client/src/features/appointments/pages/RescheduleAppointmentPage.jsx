import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAppointmentById, getAvailableSlots, rescheduleAppointment } from '../services/appointmentApi';
import AppointmentSlotPicker from '../components/AppointmentSlotPicker';
import SiteLayout from '../../../components/SiteLayout';
import { formatDateInputValue, formatFriendlyDate } from '../../../utils/date';

function RescheduleAppointmentPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingAppointment, setLoadingAppointment] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await getAppointmentById(appointmentId);
        setAppointment(response.data);
        setSelectedDate(response.data.appointmentDate);
      } catch (error) {
        alert(error?.response?.data?.message || 'Failed to load appointment');
        console.error(error);
      } finally {
        setLoadingAppointment(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!appointment?.clinic?._id || !selectedDate) return;
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const response = await getAvailableSlots(appointment.clinic._id, selectedDate, {
          excludeAppointmentId: appointmentId,
        });
        setSlots(response.slots || []);
      } catch (error) {
        alert(error?.response?.data?.message || 'Failed to load slots');
        console.error(error);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [appointment, appointmentId, selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      alert('Please select a new slot');
      return;
    }

    setSaving(true);
    try {
      await rescheduleAppointment(appointmentId, {
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
      });
      alert('Appointment rescheduled successfully');
      navigate('/appointments');
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to reschedule appointment');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loadingAppointment) {
    return (
      <SiteLayout compact backTo="/appointments" backLabel="Back to appointments" title="Reschedule appointment" subtitle="Loading appointment information...">
        <div className="card"><div className="card-body helper-text">Loading appointment...</div></div>
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
      eyebrow="Reschedule booking"
      title="Choose a better date and time"
      subtitle={`Update your appointment with ${appointment.clinic?.clinicName || 'the clinic'} using the repaired slot picker.`}
    >
      <section className="booking-layout">
        <form onSubmit={handleSubmit} className="form-card">
          <div className="form-grid">
            <div className="form-group form-full">
              <label>New date</label>
              <input
                type="date"
                value={selectedDate}
                min={formatDateInputValue()}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>

            <div className="form-full slot-panel card">
              <h3 className="section-title">Select a new slot</h3>
              <p className="helper-text">Choose one of the currently available time slots for the selected date.</p>
              <AppointmentSlotPicker
                slots={slots}
                selectedSlotId={selectedSlot?.id}
                onSelect={setSelectedSlot}
                loading={loadingSlots}
              />
              {selectedSlot && (
                <p className="slot-selection-note">
                  Selected slot: <strong>{selectedSlot.label}</strong>
                </p>
              )}
            </div>

            <div className="form-full toolbar">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Updating appointment...' : 'Confirm reschedule'}
              </button>
            </div>
          </div>
        </form>

        <div className="side-stack">
          <div className="card summary-card">
            <strong>Current clinic</strong>
            <span>{appointment.clinic?.clinicName}</span>
          </div>
          <div className="card summary-card">
            <strong>Current slot</strong>
            <span>{formatFriendlyDate(appointment.appointmentDate)} · {appointment.slotLabel}</span>
          </div>
          <div className="card summary-card">
            <strong>Pet</strong>
            <span>{appointment.petName} · {appointment.petType || 'Not specified'}</span>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

export default RescheduleAppointmentPage;
