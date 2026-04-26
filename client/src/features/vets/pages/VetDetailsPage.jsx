import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SiteLayout from '../../../components/SiteLayout';
import { getUser } from '../../auth/utils/auth';
import ClinicReviewsPanel from '../../reviews/components/ClinicReviewsPanel';
import { deleteVet, getVetById } from '../services/vetApi';

const DEFAULT_CLINIC_IMAGE = '/clinic-default.svg';

const containerPaddingStyle = {
  paddingLeft: '2.5rem',
  paddingRight: '2.5rem',
  paddingTop: '2rem',
  paddingBottom: '2rem',
};

const headerPaddingStyle = {
  paddingLeft: '2.5rem',
  paddingRight: '2.5rem',
  paddingTop: '0.75rem',
  paddingBottom: '0.75rem',
};

function StatBox({ label, value }) {
  return (
    <div className="clinic-stat-box" style={containerPaddingStyle}>
      <div className="clinic-stat-label">{label}</div>
      <div className="clinic-stat-value">{value}</div>
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
        backLabel={
          <span className="inline-block" style={headerPaddingStyle}>
            Back to clinics
          </span>
        }
        title={
          <span className="block" style={headerPaddingStyle}>
            Clinic details
          </span>
        }
        subtitle={
          <span className="block" style={headerPaddingStyle}>
            Loading clinic information...
          </span>
        }
      >
        <div
          className="rounded-[28px] border border-slate-200 bg-white text-slate-600 shadow-sm"
          style={containerPaddingStyle}
        >
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
        backLabel={
          <span className="inline-block" style={headerPaddingStyle}>
            Back to clinics
          </span>
        }
        title={
          <span className="block" style={headerPaddingStyle}>
            Clinic not found
          </span>
        }
        subtitle={
          <span className="block" style={headerPaddingStyle}>
            The selected clinic could not be loaded.
          </span>
        }
      >
        <div
          className="rounded-[28px] border border-slate-200 bg-white text-slate-600 shadow-sm"
          style={containerPaddingStyle}
        >
          Vet clinic not found.
        </div>
      </SiteLayout>
    );
  }

  const isOwner = currentUser?._id === vet?.owner?._id;
  const isAdmin = currentUser?.role === 'admin';
  const canManage = isOwner || isAdmin;
  const canBook = currentUser && ['petOwner', 'admin'].includes(currentUser.role);
  const appointmentsEnabled = vet.appointmentsEnabled !== false;

  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${vet.latitude},${vet.longitude}`
  )}`;

  const ratingValue = vet.rating ? `${vet.rating} / 5` : 'Not rated yet';
  const totalReviewsLabel = vet.totalReviews ? `${vet.totalReviews} reviews` : 'No reviews yet';

  const workingHoursLabel =
    vet.workingHours?.openTime && vet.workingHours?.closeTime
      ? `${vet.workingHours.openTime} - ${vet.workingHours.closeTime}`
      : 'Hours not provided';

  const workingDaysLabel =
    Array.isArray(vet.workingDays) && vet.workingDays.length
      ? vet.workingDays.join(', ')
      : 'Working days not provided';

  const consultationFeeLabel =
    vet.consultationFee === null || vet.consultationFee === undefined
      ? 'BDT N/A'
      : `BDT ${vet.consultationFee}`;

  return (
    <SiteLayout
      compact
      backTo="/vets"
      backLabel={
        <span className="inline-block" style={headerPaddingStyle}>
          Back to clinics
        </span>
      }
      eyebrow={
        <span className="inline-block" style={headerPaddingStyle}>
          Clinic details
        </span>
      }
      title={
        <span className="block" style={headerPaddingStyle}>
          {vet.clinicName}
        </span>
      }
      subtitle={
        <span className="block max-w-4xl" style={headerPaddingStyle}>
          Review clinic information, services, location, and verified owner reviews in one place.
        </span>
      }
      actions={
        <>
          <a
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-sm font-bold text-[#002045] shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-lg"
            href={googleMapsLink}
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps
          </a>

          {canBook &&
            (appointmentsEnabled ? (
              <Link
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-[#002045] bg-[#002045] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#1A365D] hover:shadow-xl"
                to={`/vets/${vet._id}/book`}
              >
                Book appointment
              </Link>
            ) : (
              <span className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-slate-300 bg-slate-100 px-5 py-3 text-sm font-bold text-slate-500">
                Appointments off
              </span>
            ))}

          {canManage && (
            <Link
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-teal-300 bg-teal-50 px-5 py-3 text-sm font-bold text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-100 hover:shadow-lg"
              to={`/vets/${vet._id}/edit`}
            >
              Edit clinic
            </Link>
          )}

          {canManage && (
            <button
              type="button"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-rose-300 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-800 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-400 hover:bg-rose-100 hover:shadow-lg"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
        </>
      }
    >
      <div className="clinic-page-shell">
        <section className="clinic-hero-card" style={containerPaddingStyle}>
          <div className="clinic-hero-media">
            <img
              src={vet.clinicImage || DEFAULT_CLINIC_IMAGE}
              alt={vet.clinicName}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="clinic-hero-copy" style={containerPaddingStyle}>
            <div className="clinic-kicker-row">
              <span className="clinic-visit-pill">{vet.isOpenNow ? 'Open now' : 'Closed now'}</span>
              <span className="clinic-verified-pill">Verified Clinic</span>
            </div>

            <h2>{vet.clinicName}</h2>
            <p>{vet.address}</p>
          </div>

          <div className="clinic-hero-side" style={containerPaddingStyle}>
            <div className="clinic-owner-label">Contact</div>
            <div className="clinic-owner-name">{vet.contactNumber}</div>
            <div className="clinic-owner-meta">
              {workingHoursLabel}
              <br />
              {workingDaysLabel}
            </div>
          </div>
        </section>

        <section className="clinic-page-card" style={containerPaddingStyle}>
          <div className="clinic-section-head">
            <div>
              <div className="clinic-section-kicker">Overview</div>
              <h3>Clinic snapshot</h3>
            </div>
          </div>

          <div className="clinic-stat-grid">
            <StatBox label="Status" value={vet.isOpenNow ? 'Open now' : 'Closed now'} />
            <StatBox label="Consultation fee" value={consultationFeeLabel} />
            <StatBox label="Contact" value={vet.contactNumber} />
            <StatBox label="Rating" value={`${ratingValue} (${totalReviewsLabel})`} />
            <StatBox label="Working hours" value={workingHoursLabel} />
            <StatBox label="Working days" value={workingDaysLabel} />
          </div>
        </section>

        <section className="clinic-page-card" style={containerPaddingStyle}>
          <div className="clinic-section-head">
            <div>
              <div className="clinic-section-kicker">Services</div>
              <h3>Care and treatments offered</h3>
            </div>
          </div>

          <div className="clinic-service-tags">
            {vet.servicesOffered?.length ? (
              vet.servicesOffered.map((service, index) => (
                <span key={index} className="clinic-service-tag">
                  {service}
                </span>
              ))
            ) : (
              <span className="clinic-muted-copy">No services specified</span>
            )}
          </div>
        </section>

        <section className="clinic-page-split">
          {vet.owner && (
            <div className="clinic-page-card" style={containerPaddingStyle}>
              <div className="clinic-section-head">
                <div>
                  <div className="clinic-section-kicker">Owner</div>
                  <h3>Clinic owner</h3>
                </div>
              </div>

              <div className="clinic-owner-card-copy">
                <div className="clinic-owner-name">{vet.owner.name}</div>
                <p>{vet.owner.email}</p>
              </div>
            </div>
          )}

          <div className="clinic-page-card clinic-map-card" style={containerPaddingStyle}>
            <div className="clinic-section-head">
              <div>
                <div className="clinic-section-kicker">Location</div>
                <h3>Map preview</h3>
              </div>
            </div>

            <div className="clinic-map-shell">
              {mapUrl ? (
                <iframe
                  title="vet-map"
                  src={mapUrl}
                  className="clinic-map-frame"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="clinic-map-empty" style={containerPaddingStyle}>
                  Map preview is not available for this clinic.
                </div>
              )}
            </div>
          </div>
        </section>

        <div style={containerPaddingStyle}>
          <ClinicReviewsPanel
            clinicId={vet._id}
            clinicName={vet.clinicName}
            onReviewStatsChange={handleReviewStatsChange}
          />
        </div>
      </div>
    </SiteLayout>
  );
}

export default VetDetailsPage;