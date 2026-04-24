import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SiteLayout from '../../../components/SiteLayout';
import { formatFriendlyDate, addDaysToDateInputValue, formatDateInputValue } from '../../../utils/date';
import { getVetById } from '../../vets/services/vetApi';
import AppointmentSlotPicker from '../components/AppointmentSlotPicker';
import { bookAppointment, getAvailableSlots } from '../services/appointmentApi';

const MAX_SLOT_LOOKAHEAD_DAYS = 14;
const reasonOptions = ['General Checkup', 'Vaccination', 'Illness / Injury', 'Dental'];

function BookAppointmentPage() {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const prefetchedSlotsRef = useRef(null);
  const [clinic, setClinic] = useState(null);
  const [loadingClinic, setLoadingClinic] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [initializingDate, setInitializingDate] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotNotice, setSlotNotice] = useState('');
  const [formData, setFormData] = useState({
    appointmentDate: formatDateInputValue(),
    petName: '',
    petType: 'Dog',
    reason: 'General Checkup',
    notes: '',
  });
  const [slots, setSlots] = useState([]);
  const [saving, setSaving] = useState(false);

  const appointmentsEnabled = clinic?.appointmentsEnabled !== false;
  const workingDaysLabel = Array.isArray(clinic?.workingDays) && clinic.workingDays.length
    ? clinic.workingDays.join(', ')
    : 'Working days not provided';

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const response = await getVetById(clinicId);
        setClinic(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingClinic(false);
      }
    };

    fetchClinic();
  }, [clinicId]);

  const loadSlots = useCallback(
    async (dateValue) => {
      if (!dateValue) return;

      setLoadingSlots(true);
      setSelectedSlot(null);

      try {
        const response = await getAvailableSlots(clinicId, dateValue);
        const nextSlots = response.slots || [];
        setSlots(nextSlots);

        if (response.clinic?.appointmentsEnabled === false) {
          setSlotNotice('This clinic is not accepting appointments right now.');
        } else if (nextSlots.length === 0) {
          setSlotNotice(`No appointment slots are available on ${formatFriendlyDate(dateValue)}.`);
        } else {
          setSlotNotice('');
        }
      } catch (error) {
        alert(error?.response?.data?.message || 'Failed to load available slots');
        console.error(error);
        setSlots([]);
        setSlotNotice('');
      } finally {
        setLoadingSlots(false);
      }
    },
    [clinicId]
  );

  const findNextAvailableDate = useCallback(async () => {
    const startDate = formatDateInputValue();

    if (clinic?.appointmentsEnabled === false) {
      return {
        date: startDate,
        slots: [],
        dayOffset: null,
      };
    }

    for (let dayOffset = 0; dayOffset < MAX_SLOT_LOOKAHEAD_DAYS; dayOffset += 1) {
      const candidateDate = addDaysToDateInputValue(startDate, dayOffset);
      const response = await getAvailableSlots(clinicId, candidateDate);
      const candidateSlots = response.slots || [];

      if (candidateSlots.length > 0) {
        return {
          date: candidateDate,
          slots: candidateSlots,
          dayOffset,
        };
      }
    }

    return {
      date: startDate,
      slots: [],
      dayOffset: null,
    };
  }, [clinic?.appointmentsEnabled, clinicId]);

  useEffect(() => {
    if (loadingClinic || !clinicId) {
      return undefined;
    }

    let isMounted = true;

    const initializeBookingDate = async () => {
      setInitializingDate(true);
      setLoadingSlots(true);
      setSelectedSlot(null);

      try {
        const nextAvailable = await findNextAvailableDate();

        if (!isMounted) return;

        prefetchedSlotsRef.current = nextAvailable.slots;
        setSlots(nextAvailable.slots);
        setFormData((prev) => ({
          ...prev,
          appointmentDate: nextAvailable.date,
        }));

        if (clinic?.appointmentsEnabled === false) {
          setSlotNotice('This clinic is not accepting appointments right now.');
        } else if (nextAvailable.slots.length === 0) {
          setSlotNotice('No appointment slots were found for this clinic in the next 14 days.');
        } else if (nextAvailable.dayOffset > 0) {
          setSlotNotice(`Showing the next available date: ${formatFriendlyDate(nextAvailable.date)}.`);
        } else {
          setSlotNotice('');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error(error);
        setSlots([]);
        setSlotNotice('');
      } finally {
        if (!isMounted) return;
        setLoadingSlots(false);
        setInitializingDate(false);
      }
    };

    initializeBookingDate();

    return () => {
      isMounted = false;
    };
  }, [clinic?.appointmentsEnabled, clinicId, findNextAvailableDate, loadingClinic]);

  useEffect(() => {
    if (!formData.appointmentDate || loadingClinic || initializingDate) {
      return;
    }

    if (prefetchedSlotsRef.current) {
      prefetchedSlotsRef.current = null;
      return;
    }

    loadSlots(formData.appointmentDate);
  }, [formData.appointmentDate, initializingDate, loadSlots, loadingClinic]);

  const mapUrl = useMemo(() => {
    if (!clinic?.latitude || !clinic?.longitude) return '';
    return `https://maps.google.com/maps?q=${clinic.latitude},${clinic.longitude}&z=15&output=embed`;
  }, [clinic]);

  const totalEstimate = useMemo(() => {
    const fee = Number(clinic?.consultationFee || 0);
    return {
      fee,
      total: Number(fee.toFixed(2)),
    };
  }, [clinic?.consultationFee]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'appointmentDate') {
      setSelectedSlot(null);
      setSlotNotice('');
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSlot) {
      alert('Please select an available slot first');
      return;
    }

    if (!appointmentsEnabled) {
      alert('This clinic is not accepting appointments right now');
      return;
    }

    setSaving(true);

    try {
      const response = await bookAppointment({
        clinicId,
        appointmentDate: formData.appointmentDate,
        startTime: selectedSlot.startTime,
        petName: formData.petName,
        petType: formData.petType,
        reason: formData.reason,
        notes: formData.notes,
      });

      alert('Appointment booked successfully');
      navigate('/appointments', { state: { newAppointment: response.data } });
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to book appointment');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loadingClinic) {
    return (
      <SiteLayout compact backTo={`/vets/${clinicId}`} backLabel="Back to clinic" title="Book appointment" subtitle="Loading clinic information...">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">Loading clinic...</div>
      </SiteLayout>
    );
  }

  if (!clinic) {
    return (
      <SiteLayout compact backTo="/vets" backLabel="Back to clinics" title="Clinic not found" subtitle="The selected clinic could not be loaded.">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">Clinic not found.</div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout
      compact
      backTo={`/vets/${clinicId}`}
      backLabel="Back to clinic details"
      eyebrow="Appointments"
      title="Book an Appointment"
      subtitle="Schedule a visit for your pet. Select a date, time, and provide the details your clinic needs before you arrive."
    >
      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:p-7">
            <h2 className="font-display text-3xl font-bold text-[#002045]">Patient Details</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Pet Name</span>
                <input
                  name="petName"
                  placeholder="e.g., Bella"
                  value={formData.petName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Species</span>
                <select
                  name="petType"
                  value={formData.petType}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
                >
                  <option>Dog</option>
                  <option>Cat</option>
                  <option>Bird</option>
                  <option>Rabbit</option>
                  <option>Other</option>
                </select>
              </label>
            </div>

            <div className="mt-6">
              <div className="mb-3 text-sm font-semibold text-slate-700">Reason for Visit</div>
              <div className="flex flex-wrap gap-3">
                {reasonOptions.map((reason) => {
                  const isActive = formData.reason === reason;
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, reason }))}
                      className={[
                        'rounded-full px-5 py-2.5 text-sm font-medium transition',
                        isActive
                          ? 'bg-teal-100 text-teal-800 ring-1 ring-teal-200'
                          : 'border border-slate-300 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50',
                      ].join(' ')}
                    >
                      {reason}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-display text-3xl font-bold text-[#002045]">Date & Time</h2>
                <p className="mt-2 text-sm text-slate-600">Choose the appointment date first, then select any available slot.</p>
              </div>
              <label className="block max-w-xs">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Appointment date</span>
                <input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  min={formatDateInputValue()}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
                />
              </label>
            </div>

            <div className="mt-6 rounded-[24px] bg-slate-50 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-semibold text-[#002045]">Available slots for {formatFriendlyDate(formData.appointmentDate)}</div>
                {slotNotice ? <div className="text-sm text-slate-500">{slotNotice}</div> : null}
              </div>
              {!appointmentsEnabled ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  This clinic has turned off new appointments for now.
                </div>
              ) : null}
              <div className="mt-4">
                <AppointmentSlotPicker
                  slots={slots}
                  selectedSlotId={selectedSlot?.id}
                  onSelect={setSelectedSlot}
                  loading={loadingSlots}
                />
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:p-7">
            <h2 className="font-display text-3xl font-bold text-[#002045]">Symptoms & Notes</h2>
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Additional notes for the vet</span>
              <textarea
                name="notes"
                rows="6"
                placeholder="Please provide any details that might help the vet..."
                value={formData.notes}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
              />
            </label>
          </section>
        </form>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DDEAFE] text-2xl font-bold text-[#002045]">
                  V
                </div>
                <div>
                  <h3 className="font-display text-3xl font-bold text-[#002045]">{clinic.clinicName}</h3>
                  <p className="mt-1 text-slate-600">{clinic.owner?.name || 'Veterinary team'}</p>
                  <p className="mt-2 text-sm text-slate-500">{clinic.address}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">🗓</div>
                  <div>
                    <div className="font-semibold text-[#002045]">{formatFriendlyDate(formData.appointmentDate)}</div>
                    <div className="text-sm text-slate-600">{selectedSlot ? `${selectedSlot.label} (${clinic.workingHours?.openTime || 'daytime clinic'})` : 'Choose a time slot'}</div>
                    <div className="mt-1 text-xs text-slate-500">{workingDaysLabel}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DDEAFE] text-[#002045]">🐾</div>
                  <div>
                    <div className="font-semibold text-[#002045]">{formData.reason}</div>
                    <div className="text-sm text-slate-600">{formData.petName ? `For ${formData.petName} (${formData.petType})` : `Species: ${formData.petType}`}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 p-6">
              <div className="flex items-center justify-between py-2 text-slate-600">
                <span>Consultation Fee</span>
                <span className="font-semibold text-[#002045]">৳ {totalEstimate.fee.toFixed(2)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-2xl font-bold text-[#002045]">Total Estimate</span>
                <span className="text-4xl font-extrabold text-[#002045]">৳ {totalEstimate.total.toFixed(2)}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Payment is collected at the clinic after your visit.</p>
              <button
                type="submit"
                form="booking-form"
                disabled={saving || loadingSlots || !appointmentsEnabled}
                className="mt-6 w-full rounded-2xl bg-[#002045] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#1A365D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {!appointmentsEnabled
                  ? 'Appointments Unavailable'
                  : saving
                    ? 'Confirming appointment...'
                    : 'Confirm Appointment'}
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            {mapUrl ? (
              <iframe
                title="book-appointment-clinic-map"
                src={mapUrl}
                className="h-72 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-72 items-center justify-center bg-slate-100 text-slate-500">Location preview is not available for this clinic.</div>
            )}
          </section>
        </aside>
      </div>
    </SiteLayout>
  );
}

export default BookAppointmentPage;
