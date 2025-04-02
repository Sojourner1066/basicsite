const { DeckGL, GeoJsonLayer, ArcLayer } = deck;
import { getRandomISO3Codes } from './js/getRandomISO3Codes.js';

const deckgl = new DeckGL({
// Positron (light)
// mapStyle: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
// Positron (no labels)
// mapStyle: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
// Dark Matter (dark)
// mapStyle: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
// Dark Matter (no labels)
// mapStyle: 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json',
// Voyager (more detail)
// mapStyle: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
// Voyager (no labels)
mapStyle: 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json',
  initialViewState: {
    longitude: 0,
    latitude: 0,
    zoom: 3,
    maxZoom: 15,
    pitch: 30,
    bearing: 30
  },
  controller: true,
  layers: [],
  // getTooltip: ({ object }) => object && object.properties.name
  getTooltip: ({ object }) => object?.properties?.name
});

function getArcLayer(data, selectedFeature, targetIsoCodes) {
    const { centroid } = selectedFeature.properties;
  
    // Lookup by adm0_a3
    const featureByIso = Object.fromEntries(
      data.features.map(f => [f.properties.adm0_iso, f])
    );
  
    // Build arcs to each target country
    const arcs = targetIsoCodes
      .map(iso => {
        const targetFeature = featureByIso[iso];
        if (!targetFeature || !targetFeature.properties.centroid) return null;
  
        return {
          source: centroid,
          target: targetFeature.properties.centroid
        };
      })
      .filter(d => d); // remove nulls
  
    return new ArcLayer({
      id: 'arc',
      data: arcs,
      getSourcePosition: d => d.source,
      getTargetPosition: d => d.target,
      getSourceColor: [0, 128, 200],
      getTargetColor: [200, 0, 80],
      strokeWidth: 4,
      pickable: true
    });
  }

function renderLayers(data, selectedFeature) {
  selectedFeature = selectedFeature || data.features.find(f => f.properties.name === 'Nigeria'); 
  const targetIsoCodes = getRandomISO3Codes(8);
  const arcLayer = getArcLayer(data, selectedFeature,targetIsoCodes);

  const countyLayer = new GeoJsonLayer({
    id: 'geojson',
    data,
    stroked: true,
    filled: true,
    autoHighlight: true,
    pickable: true,
    highlightColor: [158, 154, 200, 255],
    // getFillColor: () => [0, 0, 0, 0],
    getFillColor: () => [203, 201, 226, 255],
    getLineColor: () => [158, 154, 200, 255],
    lineWidthMinPixels: 1,
    onClick: info => renderLayers(data, info.object)
  });
  deckgl.setProps({ layers: [countyLayer, arcLayer] });
}
fetch('data/WorldPoly_with_centroids.geojson')
  .then(res => res.json())
  .then(data => renderLayers(data));