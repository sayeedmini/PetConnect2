import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '../../../components/SiteLayout';
import { getUser } from '../../auth/utils/auth';
import { getAllVets } from '../services/vetApi';

const defaultFilters = {
  search: '',
  service: '',
  minRating: '',
  lat: '',
  lng: '',
  radiusKm: '',
};

const DEFAULT_CLINIC_IMAGE = '/clinic-default.svg';

const serviceOptions = [
  { value: '', label: 'All Specialties' },
  { value: 'General Checkup', label: 'General Checkup' },
  { value: 'Vaccination', label: 'Vaccination' },
  { value: 'Surgery', label: 'Surgery' },
  { value: 'Dental', label: 'Dental Care' },
  { value: 'Emergency', label: 'Emergency' },
];

function Icon({ kind, className = 'h-4 w-4' }) {
  const commonProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
    className,
    'aria-hidden': 'true',
  };

  if (kind === 'search') {
    return (
      <svg {...commonProps}>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
    );
  }

  if (kind === 'chevron') {
    return (
      <svg {...commonProps}>
        <path d="M6 9l6 6 6-6" />
      </svg>
    );
  }

  if (kind === 'location') {
    return (
      <svg {...commonProps}>
        <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z" />
        <circle cx="12" cy="11" r="2.5" />
      </svg>
    );
  }

  if (kind === 'services') {
    return (
      <svg {...commonProps}>
        <path d="M8 7h8" />
        <path d="M8 12h8" />
        <path d="M8 17h5" />
        <path d="M4 7h.01" />
        <path d="M4 12h.01" />
        <path d="M4 17h.01" />
      </svg>
    );
  }

  if (kind === 'payment') {
    return (
      <svg {...commonProps}>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 14h3" />
      </svg>
    );
  }

  if (kind === 'clock') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    );
  }

  if (kind === 'star') {
    return (
      <svg {...commonProps} fill="currentColor" stroke="none">
        <path d="M12 3.6l2.52 5.1 5.63.82-4.08 3.98.96 5.6L12 16.4 6.97 19.1l.96-5.6-4.08-3.98 5.63-.82L12 3.6Z" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function FilterSelect({ icon, name, value, onChange, options, className = '' }) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        <Icon kind={icon} className="h-4 w-4" />
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-10 text-center text-sm font-medium leading-tight text-slate-700 outline-none transition [text-align-last:center] focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
      >
        {options.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
        <Icon kind="chevron" className="h-4 w-4" />
      </span>
    </div>
  );
}

function VetListPage() {
  const [vets, setVets] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recommended');
  const currentUser = getUser();

  const fetchVets = async (activeFilters = {}) => {
    try {
      setLoading(true);
      const cleanFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(
          ([, value]) => value !== '' && value !== null && value !== undefined
        )
      );
      const data = await getAllVets(cleanFilters);
      setVets(data.data || []);
    } catch (error) {
      console.error(error);
      setVets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVets();
  }, []);

  const normalizedVets = useMemo(
    () =>
      vets.map((vet, index) => {
        const clinic = vet?.clinic || vet || {};
        const clinicId = vet?._id || clinic?._id || `clinic-${index}`;
        const services = clinic.servicesOffered || [];

        const ratingValue =
          typeof clinic.averageRating === 'number'
            ? clinic.averageRating
            : typeof clinic.rating === 'number'
              ? clinic.rating
              : 0;

        const totalReviews = Number(clinic.totalReviews || 0);
        const hasReviews = totalReviews > 0;
        const isOpen = Boolean(vet?.isCurrentlyOpen || clinic?.isOpenNow || vet?.isOpenNow);

        return {
          clinic,
          clinicId,
          services,
          thumbnailImage: clinic.clinicImage || DEFAULT_CLINIC_IMAGE,
          ratingValue,
          totalReviews,
          hasReviews,
          isOpen,
        };
      }),
    [vets]
  );

  const sortedVets = useMemo(() => {
    const next = [...normalizedVets];

    if (sortBy === 'rating') {
      next.sort((a, b) => b.ratingValue - a.ratingValue);
    } else if (sortBy === 'distance') {
      next.sort((a, b) =>
        String(a.clinic.address || '').localeCompare(String(b.clinic.address || ''))
      );
    } else if (sortBy === 'fee') {
      next.sort(
        (a, b) =>
          Number(a.clinic.consultationFee ?? Number.MAX_SAFE_INTEGER) -
          Number(b.clinic.consultationFee ?? Number.MAX_SAFE_INTEGER)
      );
    }

    return next;
  }, [normalizedVets, sortBy]);

  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchVets(filters);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    fetchVets(defaultFilters);
  };

  const formatFee = (fee) => (fee === null || fee === undefined ? 'BDT N/A' : `BDT ${fee}`);

  return (
    <SiteLayout compact>
      <div className="mx-auto w-full max-w-[1280px] px-1">
        <section className="mb-10">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-bold tracking-tight text-[#002045] sm:text-4xl lg:text-5xl">
                Find a Clinic
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Browse trusted clinics, compare specialties and fees, and open the full profile in
                one step.
              </p>
            </div>

            {currentUser?.role === 'vet' && (
              <Link
                to="/vets/add"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#002045] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173763] sm:w-auto"
              >
                Add Clinic
              </Link>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon kind="search" className="h-5 w-5" />
                </span>

                <input
                  name="search"
                  value={filters.search}
                  onChange={handleChange}
                  placeholder="Search clinics by name or specialty..."
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pr-4 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  style={{ paddingLeft: '4.5rem' }}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:w-auto lg:shrink-0">
                <FilterSelect
                  icon="services"
                  name="service"
                  value={filters.service}
                  onChange={handleChange}
                  options={serviceOptions}
                  className="sm:min-w-[220px]"
                />

                <FilterSelect
                  icon="star"
                  name="minRating"
                  value={filters.minRating}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Rating' },
                    { value: '4.5', label: '4.5+' },
                    { value: '4.0', label: '4.0+' },
                    { value: '3.5', label: '3.5+' },
                  ]}
                  className="sm:min-w-[150px]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                {loading ? 'Loading clinic directory...' : `${sortedVets.length} clinics available`}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center">
                  <span className="whitespace-nowrap font-medium">Sort by</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-12 min-w-[170px] rounded-xl border border-slate-300 bg-white px-3 text-center text-sm font-medium text-slate-700 outline-none transition [text-align-last:center] focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="rating">Rating</option>
                    <option value="distance">Distance</option>
                    <option value="fee">Fee</option>
                  </select>
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-[#002045] bg-[#d6e3ff] px-5 text-sm font-semibold text-[#001b3c] transition hover:border-[#001b3c] hover:bg-[#c5d7fb]"
                  >
                    Search
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? [1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_40px_-10px_rgba(0,32,69,0.15)]"
                >
                  <div className="h-[200px] animate-pulse bg-slate-200" />

                  <div className="space-y-3 p-6">
                    <div className="h-6 w-3/5 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div className="h-10 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))
            : sortedVets.map((item) => {
                const { clinic, clinicId, services, hasReviews, ratingValue, totalReviews, isOpen } =
                  item;

                return (
                  <article
                    key={clinicId}
                    className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_10px_40px_-10px_rgba(0,32,69,0.15)] transition duration-300 hover:shadow-lg"
                  >
                    <div className="relative h-[200px] w-full">
                      <img
                        src={item.thumbnailImage}
                        alt={clinic.clinicName || 'Veterinary clinic'}
                        className="h-full w-full object-cover"
                      />

                      <div
                        className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold shadow-sm ${
                          isOpen
                            ? 'bg-emerald-900 text-emerald-100'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Icon kind={isOpen ? 'clock' : 'chevron'} className="h-3.5 w-3.5" />
                        {isOpen ? 'Open Now' : 'Closed'}
                      </div>
                    </div>

                    <div
                      className="flex flex-1 flex-col py-6"
                      style={{ paddingLeft: '1rem', paddingRight: '1rem' }}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h2
                          className="line-clamp-1 font-display text-2xl font-semibold text-[#002045]"
                          title={clinic.clinicName || 'Unnamed Clinic'}
                        >
                          {clinic.clinicName || 'Unnamed Clinic'}
                        </h2>

                        <div className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-800">
                          <Icon kind="star" className="h-4 w-4" />
                          {hasReviews ? ratingValue.toFixed(1) : 'New'}
                        </div>
                      </div>

                      <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                        <Icon kind="location" className="h-[18px] w-[18px]" />
                        <span className="line-clamp-1">
                          {clinic.address || 'Address not provided'}
                        </span>
                      </div>

                      <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                        <Icon kind="services" className="h-[18px] w-[18px]" />
                        <span className="line-clamp-1">
                          {services.length ? services.join(', ') : 'No services listed'}
                        </span>
                      </div>

                      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                        <Icon kind="payment" className="h-[18px] w-[18px]" />
                        <span>Est. Fee: {formatFee(clinic.consultationFee)}</span>
                      </div>

                      <div className="mt-auto border-t border-slate-200 pt-4">
                        <div className="mb-3 text-xs text-slate-400">
                          {hasReviews
                            ? `${totalReviews} review${totalReviews === 1 ? '' : 's'}`
                            : 'No reviews yet'}
                        </div>

                        <Link
                          to={`/vets/${clinicId}`}
                          className="inline-flex w-full items-center justify-center rounded-xl bg-[#002045] py-3 text-sm font-semibold text-white transition hover:bg-[#173763]"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
        </section>

        {!loading && !sortedVets.length ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-600">
            No vet clinics matched your current filters.
          </div>
        ) : null}
      </div>
    </SiteLayout>
  );
}

export default VetListPage;