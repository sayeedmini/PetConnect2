import { useCallback, useEffect, useState } from 'react';
import ClinicLocationPicker from './ClinicLocationPicker';
import { createVet, updateVet } from '../services/vetApi';

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const emptyForm = {
  clinicName: '',
  address: '',
  contactNumber: '',
  servicesOffered: '',
  openTime: '',
  closeTime: '',
  consultationFee: '',
  latitude: '',
  longitude: '',
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  appointmentsEnabled: true,
};

const containerPaddingStyle = {
  paddingLeft: '2.5rem',
  paddingRight: '2.5rem',
  paddingTop: '2rem',
  paddingBottom: '2rem',
};

const smallContainerPaddingStyle = {
  paddingLeft: '1.5rem',
  paddingRight: '1.5rem',
  paddingTop: '1.25rem',
  paddingBottom: '1.25rem',
};

const primaryButtonClassName =
  'inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-[#002045] bg-[#DDEAFE] px-5 py-3 text-sm font-bold text-[#002045] shadow-md transition hover:-translate-y-0.5 hover:bg-[#CFE0FF] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60';

const secondaryButtonClassName =
  'inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60';

const dayButtonBaseClassName =
  'inline-flex min-h-[44px] items-center justify-center rounded-xl border-2 px-5 py-2.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md';

function VetForm({ initialData = null, isEdit = false, onSuccess }) {
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

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
        latitude: initialData.latitude || '',
        longitude: initialData.longitude || '',
        workingDays:
          Array.isArray(initialData.workingDays) && initialData.workingDays.length
            ? initialData.workingDays
            : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        appointmentsEnabled: initialData.appointmentsEnabled !== false,
      });
    } else {
      setFormData(emptyForm);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleWorkingDayToggle = (day) => {
    setFormData((prev) => {
      const nextWorkingDays = prev.workingDays.includes(day)
        ? prev.workingDays.filter((item) => item !== day)
        : [...prev.workingDays, day];

      return {
        ...prev,
        workingDays: nextWorkingDays,
      };
    });
  };

  const handleMapLocationSelect = useCallback((position) => {
    setFormData((prev) => ({
      ...prev,
      latitude: position.lat.toFixed(6),
      longitude: position.lng.toFixed(6),
    }));
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported in this browser');
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleMapLocationSelect({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (error) => {
        alert(error.message || 'Failed to fetch current location');
        setLocationLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.latitude === '' || formData.longitude === '') {
      alert('Please pick the clinic location from the map before saving');
      return;
    }

    if (!formData.workingDays.length) {
      alert('Please select at least one working day');
      return;
    }

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
      workingDays: formData.workingDays,
      appointmentsEnabled: formData.appointmentsEnabled,
      consultationFee: Number(formData.consultationFee),
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
    };

    setSubmitting(true);

    try {
      const response =
        isEdit && initialData?._id
          ? await updateVet(initialData._id, payload)
          : await createVet(payload);

      alert(isEdit ? 'Vet clinic updated successfully' : 'Vet clinic added successfully');

      if (onSuccess) {
        onSuccess(response.data);
      }

      if (!isEdit) {
        setFormData(emptyForm);
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to save vet clinic');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_340px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
        style={containerPaddingStyle}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Clinic name</span>
            <input
              name="clinicName"
              placeholder="Happy Paws Veterinary Center"
              value={formData.clinicName}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Address</span>
            <input
              name="address"
              placeholder="Full clinic address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Contact number</span>
            <input
              name="contactNumber"
              placeholder="01XXXXXXXXX"
              value={formData.contactNumber}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Consultation fee</span>
            <input
              name="consultationFee"
              type="number"
              placeholder="500"
              value={formData.consultationFee}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Services offered</span>
            <input
              name="servicesOffered"
              placeholder="Vaccination, Surgery, Emergency Care"
              value={formData.servicesOffered}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Opening time</span>
            <input
              name="openTime"
              type="time"
              value={formData.openTime}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Closing time</span>
            <input
              name="closeTime"
              type="time"
              value={formData.closeTime}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
            />
          </label>

          <div className="block md:col-span-2">
            <span className="mb-3 block text-sm font-semibold text-slate-700">Working days</span>

            <div className="flex flex-wrap gap-3">
              {WEEK_DAYS.map((day) => {
                const isSelected = formData.workingDays.includes(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleWorkingDayToggle(day)}
                    className={[
                      dayButtonBaseClassName,
                      isSelected
                        ? 'border-teal-300 bg-teal-50 text-teal-800'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50',
                    ].join(' ')}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 text-sm text-slate-500">
              Choose the days when this clinic should accept appointments.
            </div>
          </div>

          <label className="block md:col-span-2">
            <span className="mb-3 block text-sm font-semibold text-slate-700">Appointments</span>

            <div
              className="flex items-center justify-between rounded-[24px] border border-slate-300 bg-slate-50"
              style={smallContainerPaddingStyle}
            >
              <div>
                <div className="font-semibold text-[#002045]">Accept new appointments</div>
                <div className="mt-1 text-sm text-slate-600">
                  Turn this off when you do not want pet owners to book this clinic.
                </div>
              </div>

              <input
                name="appointmentsEnabled"
                type="checkbox"
                checked={formData.appointmentsEnabled}
                onChange={handleChange}
                className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
            </div>
          </label>

          <div
            className="md:col-span-2 rounded-[24px] bg-slate-50"
            style={containerPaddingStyle}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[#002045]">Clinic location</div>
                <div className="mt-1 text-sm text-slate-600">
                  Click directly on the map to save the clinic location.
                </div>
              </div>

              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={handleUseCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? 'Getting current location...' : 'Use current location'}
              </button>
            </div>

            <div className="mt-5">
              <ClinicLocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationSelect={handleMapLocationSelect}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className={`${primaryButtonClassName} w-full`}
              disabled={submitting}
            >
              {submitting
                ? isEdit
                  ? 'Updating clinic...'
                  : 'Saving clinic...'
                : isEdit
                  ? 'Update clinic'
                  : 'Create clinic'}
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <div
          className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
          style={containerPaddingStyle}
        >
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Location status
          </div>

          <div className="mt-4 font-display text-3xl font-bold text-[#002045]">
            {formData.latitude && formData.longitude ? 'Location selected' : 'Waiting for selection'}
          </div>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            The clinic marker will stay synced with the selected map location.
          </p>
        </div>

        <div
          className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50"
          style={containerPaddingStyle}
        >
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Good practice
          </div>

          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <li>Use the exact clinic entrance location so users can navigate correctly.</li>
            <li>Keep working days and opening hours aligned with your real appointment schedule.</li>
            <li>Turn off appointments anytime if you need to pause new bookings.</li>
            <li>Ratings are now generated from real reviews, not typed manually.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default VetForm;