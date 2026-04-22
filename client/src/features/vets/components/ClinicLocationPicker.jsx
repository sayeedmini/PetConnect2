import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_MAP_CENTER, GOOGLE_MAPS_MAP_ID, loadGoogleMaps } from '../../../lib/loadGoogleMaps';

function ClinicLocationPicker({ latitude, longitude, onLocationSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedPosition = useMemo(() => {
    if (latitude === '' || longitude === '' || latitude === null || longitude === null) {
      return null;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    return { lat, lng };
  }, [latitude, longitude]);

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        setLoading(true);
        const google = await loadGoogleMaps();

        if (!isMounted || !containerRef.current) {
          return;
        }

        const initialCenter = selectedPosition || DEFAULT_MAP_CENTER;
        const map = new google.maps.Map(containerRef.current, {
          center: initialCenter,
          zoom: selectedPosition ? 15 : 12,
          mapId: GOOGLE_MAPS_MAP_ID,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });

        mapRef.current = map;

        if (selectedPosition) {
          markerRef.current = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: selectedPosition,
            title: 'Selected clinic location',
          });
        }

        map.addListener('click', (event) => {
          if (!event.latLng) {
            return;
          }

          const nextPosition = {
            lat: Number(event.latLng.lat().toFixed(6)),
            lng: Number(event.latLng.lng().toFixed(6)),
          };

          if (!markerRef.current) {
            markerRef.current = new google.maps.marker.AdvancedMarkerElement({
              map,
              position: nextPosition,
              title: 'Selected clinic location',
            });
          } else {
            markerRef.current.position = nextPosition;
            markerRef.current.map = map;
          }

          map.panTo(nextPosition);
          onLocationSelect(nextPosition);
        });
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Failed to load Google Maps');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (markerRef.current) {
        markerRef.current.map = null;
      }
    };
  }, [onLocationSelect]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps || !selectedPosition) {
      return;
    }

    const google = window.google;

    if (!markerRef.current) {
      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: selectedPosition,
        title: 'Selected clinic location',
      });
    } else {
      markerRef.current.position = selectedPosition;
      markerRef.current.map = mapRef.current;
    }

    mapRef.current.setCenter(selectedPosition);
  }, [selectedPosition]);

  if (error) {
    return <div className="map-picker-error">{error}</div>;
  }

  return (
    <div className="map-picker-shell">
      <div className="map-picker-toolbar">
        <span className="helper-text">Click anywhere on the map to set the clinic location.</span>
        {selectedPosition && (
          <span className="map-picker-coordinates">
            {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
          </span>
        )}
      </div>

      <div ref={containerRef} className="map-picker-canvas" />

      {loading && <div className="map-picker-overlay">Loading Google Map…</div>}
    </div>
  );
}

export default ClinicLocationPicker;
