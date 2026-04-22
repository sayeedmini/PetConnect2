import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '../../../components/SiteLayout';
import { getUser } from '../../auth/utils/auth';
import VetCard from '../components/VetCard';
import { getAllVets } from '../services/vetApi';

const defaultFilters = {
  search: '',
  service: '',
  minRating: '',
  lat: '',
  lng: '',
  radiusKm: '',
};

function VetListPage() {
  const [vets, setVets] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const currentUser = getUser();

  const fetchVets = async (activeFilters = {}) => {
    try {
      setLoading(true);
      const cleanFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
      );
      const data = await getAllVets(cleanFilters);
      setVets(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVets();
  }, []);

  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported in this browser');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFilters((prev) => ({
          ...prev,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
          radiusKm: prev.radiusKm || '10',
        }));
        setLocationLoading(false);
      },
      (error) => {
        alert(error.message || 'Failed to fetch your location');
        setLocationLoading(false);
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchVets(filters);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    fetchVets(defaultFilters);
  };

  const featuredClinic = useMemo(() => vets[0] || null, [vets]);
  const featuredMapUrl = useMemo(() => {
    if (!featuredClinic?.latitude || !featuredClinic?.longitude) return '';
    return `https://maps.google.com/maps?q=${featuredClinic.latitude},${featuredClinic.longitude}&z=14&output=embed`;
  }, [featuredClinic]);

  return (
    <SiteLayout
      eyebrow="Clinic directory"
      title="Find Veterinary Clinics"
      subtitle="Search top-rated clinics by name, service, rating, and your current location radius."
      actions={
        <>
          {['vet', 'admin'].includes(currentUser?.role) && (
            <Link className="rounded-xl bg-[#002045] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1A365D]" to="/vets/add">
              Add clinic
            </Link>
          )}
          {currentUser && (
            <Link className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#002045] transition hover:border-slate-400 hover:bg-slate-50" to="/appointments">
              My appointments
            </Link>
          )}
        </>
      }
    >
      <form onSubmit={handleSubmit} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:p-8">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Location or clinic</span>
            <input
              name="search"
              placeholder="Enter clinic name or address"
              value={filters.search}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Service type</span>
            <input
              name="service"
              placeholder="Vaccination, surgery..."
              value={filters.service}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Minimum rating</span>
              <input
                name="minRating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                placeholder="0 - 5"
                value={filters.minRating}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Radius (km)</span>
              <input
                name="radiusKm"
                type="number"
                step="any"
                placeholder="10"
                value={filters.radiusKm}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
              />
            </label>
          </div>

          <div className="flex flex-col justify-end gap-3">
            <button className="rounded-2xl bg-[#002045] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1A365D]" type="submit">
              Search clinics
            </button>
            <button
              type="button"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 ring-1 ring-teal-200 transition hover:bg-teal-100"
            onClick={handleUseCurrentLocation}
            disabled={locationLoading}
          >
            {locationLoading ? 'Getting your location...' : 'Use my location'}
          </button>
          <span className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">Open now</span>
          <span className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">Emergency services</span>
          <span className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">Accepts new patients</span>
        </div>
      </form>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-4xl font-bold text-[#002045]">{loading ? 'Loading clinics...' : `${vets.length} Clinics Found`}</h2>
              <p className="mt-2 text-sm text-slate-600">Browse real listings from your PetConnect backend.</p>
            </div>
            <div className="text-sm text-slate-500">Sort by <span className="font-semibold text-[#002045]">Recommended</span></div>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-[420px] animate-pulse rounded-[28px] bg-slate-100" />
              ))}
            </div>
          ) : vets.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600 shadow-sm">
              No vet clinics matched your current filters.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {vets.map((vet, index) => (
                <VetCard key={vet._id} vet={vet} index={index} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            {featuredMapUrl ? (
              <iframe
                title="featured-clinic-map"
                src={featuredMapUrl}
                className="h-80 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-80 items-center justify-center bg-slate-100 text-slate-500">Clinic map preview</div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            {featuredClinic ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-3xl font-bold text-[#002045]">{featuredClinic.clinicName}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{featuredClinic.address}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                    {(featuredClinic.rating ?? 4.8).toFixed(1)} rating
                  </span>
                </div>
                <div className="mt-6 border-t border-slate-200 pt-6">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Available services</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(featuredClinic.servicesOffered || []).slice(0, 6).map((service, index) => (
                      <span key={`${featuredClinic._id}-${index}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Consultation fee</div>
                    <div className="mt-2 text-2xl font-extrabold text-[#002045]">৳ {featuredClinic.consultationFee ?? 'N/A'}</div>
                  </div>
                  <Link
                    to={`/vets/${featuredClinic._id}`}
                    className="rounded-2xl bg-[#002045] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#1A365D]"
                  >
                    View featured clinic
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-600">Featured clinic details will appear here after clinics are loaded.</div>
            )}
          </div>
        </aside>
      </div>
    </SiteLayout>
  );
}

export default VetListPage;
