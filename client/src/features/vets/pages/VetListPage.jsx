import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllVets } from '../services/vetApi';
import VetCard from '../components/VetCard';

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVets();
  }, []);

  const handleChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchVets(filters);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    fetchVets(defaultFilters);
  };

  return (
    <div style={{ padding: '30px' }}>
      <div style={styles.header}>
        <div>
          <h1>Vet Clinics</h1>
          <p>Search by clinic name, address, service, rating, and distance.</p>
        </div>
        <Link to="/vets/add">+ Add Vet Clinic</Link>
      </div>

      <form onSubmit={handleSubmit} style={styles.filters}>
        <input
          name="search"
          placeholder="Search clinic or address"
          value={filters.search}
          onChange={handleChange}
        />

        <input
          name="service"
          placeholder="Service (e.g. surgery)"
          value={filters.service}
          onChange={handleChange}
        />

        <input
          name="minRating"
          type="number"
          min="0"
          max="5"
          step="0.1"
          placeholder="Min rating"
          value={filters.minRating}
          onChange={handleChange}
        />

        <input
          name="lat"
          type="number"
          step="any"
          placeholder="Your latitude"
          value={filters.lat}
          onChange={handleChange}
        />

        <input
          name="lng"
          type="number"
          step="any"
          placeholder="Your longitude"
          value={filters.lng}
          onChange={handleChange}
        />

        <input
          name="radiusKm"
          type="number"
          step="any"
          placeholder="Radius (km)"
          value={filters.radiusKm}
          onChange={handleChange}
        />

        <div style={styles.actions}>
          <button type="submit">Apply Filters</button>
          <button type="button" onClick={handleReset}>Reset</button>
        </div>
      </form>

      {loading ? (
        <p>Loading vet clinics...</p>
      ) : vets.length === 0 ? (
        <p>No vet clinics found.</p>
      ) : (
        vets.map((vet) => <VetCard key={vet._id} vet={vet} />)
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  filters: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: '12px',
    background: '#fff',
    padding: '18px',
    borderRadius: '14px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
    marginBottom: '20px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
};

export default VetListPage;