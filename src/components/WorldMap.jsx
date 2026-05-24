import { useMemo } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import world from 'world-atlas/countries-110m.json';
import { nearestLocation } from '../lib/geo.js';

const MAP_WIDTH = 980;
const MAP_HEIGHT = 480;

export default function WorldMap({ locations, selectedLocation, onSelect }) {
  const countries = useMemo(() => feature(world, world.objects.countries).features, []);
  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .rotate([-10, 0])
        .fitExtent(
          [
            [22, 18],
            [MAP_WIDTH - 22, MAP_HEIGHT - 18],
          ],
          { type: 'Sphere' },
        ),
    [],
  );
  const path = useMemo(() => geoPath(projection), [projection]);

  function selectNearestFromPointer(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const point = [
      ((event.clientX - rect.left) / rect.width) * MAP_WIDTH,
      ((event.clientY - rect.top) / rect.height) * MAP_HEIGHT,
    ];
    const inverted = projection.invert(point);

    if (!inverted) {
      return;
    }

    const [lng, lat] = inverted;
    onSelect(nearestLocation({ lat, lng }, locations));
  }

  return (
    <svg
      className="world-map"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label="World map timezone selector"
      onClick={selectNearestFromPointer}
    >
      <rect className="map-water" width={MAP_WIDTH} height={MAP_HEIGHT} rx="22" />
      <g className="map-land">
        {countries.map((country, index) => (
          <path key={`${country.id ?? 'country'}-${index}`} d={path(country)} />
        ))}
      </g>
      <g className="map-grid" aria-hidden="true">
        {[-120, -60, 0, 60, 120].map((lng) => {
          const line = {
            type: 'LineString',
            coordinates: Array.from({ length: 145 }, (_, index) => [lng, -72 + index]),
          };
          return <path key={`lng-${lng}`} d={path(line)} />;
        })}
        {[-45, 0, 45].map((lat) => {
          const line = {
            type: 'LineString',
            coordinates: Array.from({ length: 361 }, (_, index) => [-180 + index, lat]),
          };
          return <path key={`lat-${lat}`} d={path(line)} />;
        })}
      </g>
      <g>
        {locations.map((location) => {
          const projected = projection([location.lng, location.lat]);
          if (!projected) return null;

          const active = location.id === selectedLocation.id;
          const [x, y] = projected;

          return (
            <g
              key={location.id}
              className={`map-marker ${active ? 'active' : ''}`}
              transform={`translate(${x} ${y})`}
              role="button"
              tabIndex="0"
              aria-label={`${location.city}, ${location.country}`}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(location);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(location);
                }
              }}
            >
              <circle className="marker-halo" r={active ? 13 : 8} />
              <circle className="marker-dot" r={active ? 5.5 : 3.8} />
              {active && (
                <text className="marker-label" x="10" y="-9">
                  {location.city}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
