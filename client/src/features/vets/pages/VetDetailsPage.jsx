import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SiteLayout from '../../../components/SiteLayout';
import { getUser } from '../../auth/utils/auth';
import ClinicReviewsPanel from '../../reviews/components/ClinicReviewsPanel';
import { deleteVet, getVetById } from '../services/vetApi';

function StatBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-base font-semibold text-[#002045]">{value}</div>
    </div>
  );
}

function VetDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vet, setVet] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = getUser();

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

  const handleDelete = async () => {
    if (!window.confirm('Delete this clinic?')) return;

    try {
      await deleteVet(id);
      alert('Vet clinic deleted successfully');
      navigate('/vets');
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to delete vet clinic');
      console.error(error);
    }
  };

  const handleReviewStatsChange = useCallback(({ rating, totalReviews }) => {
    setVet((prev) => {
      if (!prev) return prev;

      if (prev.rating === rating && prev.totalReviews === totalReviews) {
        return prev;
      }

      return { ...prev, rating, totalReviews };
    });
  }, []);

  const mapUrl = useMemo(() => {
    if (!vet?.latitude || !vet?.longitude) return '';
    return `https://maps.google.com/maps?q=${vet.latitude},${vet.longitude}&z=15&output=embed`;
  }, [vet?.latitude, vet?.longitude]);

  if (loading) {
    return (
      <SiteLayout
        compact
        backTo="/vets"
        backLabel="Back to clinics"
        title="Clinic details"
        subtitle="Loading clinic information..."
      >
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
          Loading clinic details...
        </div>
      </SiteLayout>
    );
  }

  if (!vet) {
    return (
      <SiteLayout
        compact
        backTo="/vets"
        backLabel="Back to clinics"
        title="Clinic not found"
        subtitle="The selected clinic could not be loaded."
      >
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
          Vet clinic not found.
        </div>
      </SiteLayout>
    );
  }

  const isOwner = currentUser?._id === vet?.owner?._id;
  const isAdmin = currentUser?.role === 'admin';
  const canManage = isOwner || isAdmin;
  const canBook = currentUser && ['petOwner', 'admin'].includes(currentUser.role);
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${vet.latitude},${vet.longitude}`
  )}`;

  return (
    <SiteLayout
      compact
      backTo="/vets"
      backLabel="Back to clinics"
      eyebrow="Clinic details"
      title={vet.clinicName}
      subtitle="Review clinic information, map location, services, and verified owner reviews in one place."
      actions={
        <>
          <a
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#002045] transition hover:border-slate-400 hover:bg-slate-50"
            href={googleMapsLink}
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps
          </a>
          {canBook && (
            <Link
              className="rounded-xl bg-[#002045] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1A365D]"
              to={`/vets/${vet._id}/book`}
            >
              Book appointment
            </Link>
          )}
          {canManage && (
            <Link
              className="rounded-xl border border-teal-300 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
              to={`/vets/${vet._id}/edit`}
            >
              Edit clinic
            </Link>
          )}
          {canManage && (
            <button
              type="button"
              className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
        </>
      }
    >
      <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <StatBox label="Status" value={vet.isOpenNow ? 'Open now' : 'Closed now'} />
              <StatBox label="Consultation fee" value={`৳ ${vet.consultationFee}`} />
              <StatBox label="Contact" value={vet.contactNumber} />
              <StatBox
                label="Rating"
                value={`${vet.rating ?? 'N/A'} / 5 ${
                  vet.totalReviews ? `(${vet.totalReviews} reviews)` : ''
                }`}
              />
              <StatBox
                label="Working hours"
                value={`${vet.workingHours?.openTime} - ${vet.workingHours?.closeTime}`}
              />
              <StatBox label="Coordinates" value={`${vet.latitude}, ${vet.longitude}`} />
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <h2 className="font-display text-3xl font-bold text-[#002045]">Clinic overview</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">{vet.address}</p>
            <div className="mt-6 border-t border-slate-200 pt-6">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Services offered
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {vet.servicesOffered?.length ? (
                  vet.servicesOffered.map((service, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {service}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No services specified</span>
                )}
              </div>
            </div>
          </section>

          <ClinicReviewsPanel clinicId={vet._id} onReviewStatsChange={handleReviewStatsChange} />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          {vet.owner && (
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Clinic owner
              </div>
              <div className="mt-4 font-display text-3xl font-bold text-[#002045]">
                {vet.owner.name}
              </div>
              <p className="mt-2 text-sm text-slate-600">{vet.owner.email}</p>
            </div>
          )}

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            {mapUrl ? (
              <iframe
                title="vet-map"
                src={mapUrl}
                className="h-[420px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center bg-slate-100 text-slate-500">
                Map preview is not available for this clinic.
              </div>
            )}
          </div>
        </aside>
      </div>
    </SiteLayout>
  );
}

export default VetDetailsPage;