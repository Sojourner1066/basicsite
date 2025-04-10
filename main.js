const { DeckGL, GeoJsonLayer, ArcLayer } = deck;
import { getRandomISO3Codes } from './js/getRandomISO3Codes.js';
import { wdGetAllMembershipsbyISO } from './js/wdGetAllMembershipsbyISO.js';
import { wdCategoryCounts } from './js/wdCategoryCount.js';
import { drawBarChart } from './js/d3_drawBarChart.js';
import { drawCircularBarChart } from './js/d3_drawBarChart.js';

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

let selectedCountryISO = "NGA"; // default to Nigeria


// const CategoryCounts = await wdCategoryCounts("NGA");
// drawBarChart(Object.entries(CategoryCounts).map(([category, value]) => ({ category, value })), "#chart-container");

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

async function renderLayers(data, selectedFeature) {
  if (selectedFeature) {
    selectedCountryISO = selectedFeature.properties.adm0_iso;
  } else {
    selectedFeature = data.features.find(f => f.properties.adm0_iso === selectedCountryISO);
  }
  // selectedFeature = data.features.find(f => f.properties.adm0_iso === selectedCountryISO);
  // console.log(selectedFeature.properties.adm0_iso);
  const membershipJSON = await wdGetAllMembershipsbyISO(selectedFeature.properties.adm0_iso);
  const targetIsoCodes = membershipJSON.results.bindings.map(d => d.targetCode.value);
  //getRandomISO3Codes(8);
  const arcLayer = getArcLayer(data, selectedFeature,targetIsoCodes);

const countyLayer = new GeoJsonLayer({
  id: 'geojson',
  data,
  stroked: true,
  filled: true,
  autoHighlight: true,
  pickable: true,
  highlightColor: [158, 154, 200, 255],
  getFillColor: f => {
    return f.properties.adm0_iso === selectedCountryISO
      ? [158, 154, 200, 255]
      : [203, 201, 226, 255];
  },
  updateTriggers: {
    getFillColor: [selectedCountryISO]  // 👈 this line is critical
  },
  getLineColor: () => [158, 154, 200, 255],
  lineWidthMinPixels: 1,
  onClick: info => renderLayers(data, info.object)
});
  deckgl.setProps({ layers: [countyLayer, arcLayer] });
  const CategoryCounts = await wdCategoryCounts(selectedFeature.properties.adm0_iso);
  // drawBarChart(Object.entries(CategoryCounts).map(([category, value]) => ({ category, value })), "#chart-container");
  drawCircularBarChart(Object.entries(CategoryCounts).map(([category, value]) => ({ category, value })), "#chart-container");
}
fetch('data/WorldPoly_with_centroids.geojson')
  .then(res => res.json())
  .then(data => renderLayers(data));