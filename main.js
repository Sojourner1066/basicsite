const { DeckGL, GeoJsonLayer, ArcLayer } = deck;
// import { getRandomISO3Codes } from './js/getRandomISO3Codes.js';
// import { wdGetAllMembershipsbyISO } from './js/wdGetAllMembershipsbyISO.js';

import { wdCategoryCounts } from './js/wdCategoryCount.js';
import { createSpectralDonutChart } from './js/d3_drawCharts.js';
// import { drawDonutChart } from './js/d3_drawCharts.js';
import { drawMiniHorizontalBarChart } from './js/d3_drawCharts.js';
import { wdGetAllStatsByISO } from './js/wdGetAllStatsByISO.js';
import { getSmallTreatyMembersGrouped, getUniqueMemberCountries } from './js/wdTreatyMembership.js';


let selectedCountryISO = "NGA"; // default to Nigeria
let currentGeoData; // to cache GeoJSON between slider changes
const presets = [5, 10, 30, 50, 70, 100, 150, Infinity];
let maxParticipants = presets[2]; // start at 30

// this loads all data needed for creating charts 
let CountryStats = await wdGetAllStatsByISO();

// this filters the ContryStats data to only include the countries with the iso codes in the isoCodes array
function filterByIsoCodes(data, isoCodes) {
  const isoSet = new Set(isoCodes);
  return data.results.bindings.filter(entry => isoSet.has(entry.isoCode.value));
}

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
  mapStyle: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
// Voyager (no labels)
// mapStyle: 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json',
  initialViewState: {
    longitude: -2.6753,
    latitude: 18.0820,
    zoom: 3,
    maxZoom: 6,
    pitch: 30,
    bearing: 30
  },
  controller: true,
  layers: [],
  getTooltip: ({ object }) => object?.properties?.name
});

const slider = document.getElementById("participant-slider");
const valueLabel = document.getElementById("participant-value");

slider.addEventListener("input", () => {
  const selected = presets[parseInt(slider.value)];
  maxParticipants = selected;
  valueLabel.textContent = selected === Infinity ? "All" : selected;

  if (currentGeoData) {
    renderLayers(currentGeoData, null);
  }
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

  const treatyCountryGroups = await getSmallTreatyMembersGrouped(selectedCountryISO, maxParticipants);
  // console.log(treatyCountryGroups);

  // Convert to array and sort by number of members (descending)
  const sortedTreaties = Object.entries(treatyCountryGroups)
    .map(([treaty, countries]) => ({
      treaty,
      count: countries.length
    }))
    .sort((a, b) => b.count - a.count);


  const container = document.getElementById("treaty-list");
  container.innerHTML = `
  <h4 class="treaty-title">Treaties and Number of Members</h4>
  ${sortedTreaties.map(t => `<div><strong>${t.treaty}</strong>: ${t.count}</div>`).join('')}
  `;

  // container.innerHTML = sortedTreaties.map(t => `<div><strong>${t.treaty}</strong>: ${t.count} members</div>`).join('');


  const targetIsoCodes = getUniqueMemberCountries(treatyCountryGroups, selectedCountryISO);

  // console.log("tcg", treatyCountryGroups);
  // const CategoryCounts = await wdCategoryCounts(selectedCountryISO, treatyCountryGroups);
  // drawCircularBarChart(
  //   Object.entries(CategoryCounts).map(([category, value]) => ({ category, value })),
  //   "#chart-container"
  // );


  const CategoryCounts = await wdCategoryCounts(selectedCountryISO, treatyCountryGroups);
  const donutData = Object.entries(CategoryCounts).map(([name, value]) => ({
    name,
    value
  }));
  
  const donutContainer = document.querySelector("#chart-container");
  donutContainer.innerHTML = ""; // clear any previous chart
  const chart = createSpectralDonutChart(donutData, 420); // or any width you want
  donutContainer.appendChild(chart);


  // const CategoryCounts = await wdCategoryCounts(selectedCountryISO, treatyCountryGroups);
  // const donutData = Object.entries(CategoryCounts).map(([category, value]) => ({
  //   category,
  //   value
  // }));
  // drawDonutChart(donutData, "#chart-container", "Treaty Membership Types");
  
  const selectedData = filterByIsoCodes(CountryStats, targetIsoCodes);;

  const MAX_LABEL_LENGTH = 15;

  const populationData = selectedData
    .map(d => ({
      fullName: d.countryLabel.value,
      category: d.countryLabel.value.length > MAX_LABEL_LENGTH
        ? d.countryLabel.value.slice(0, MAX_LABEL_LENGTH) + "…"
        : d.countryLabel.value,
      value: d.population?.value ? +d.population.value : 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  drawMiniHorizontalBarChart(populationData, "#pop-chart-container", "Population by Country (Top 10)");

  const gdpData = selectedData
  .filter(d => d.gdp && !isNaN(+d.gdp.value)) // ensure GDP exists and is numeric
  .map(d => ({
    fullName: d.countryLabel.value,
    category: d.countryLabel.value.length > MAX_LABEL_LENGTH
      ? d.countryLabel.value.slice(0, MAX_LABEL_LENGTH) + "…"
      : d.countryLabel.value,
    value: +d.gdp.value
  }))
  .sort((a, b) => b.value - a.value)
  .slice(0, 10);

  drawMiniHorizontalBarChart(gdpData, "#gdp-chart-container", "GDP by Country (USD) (Top 10)");
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
      ? [158, 154, 200, 160]
      : [203, 201, 226, 120];
  },
  updateTriggers: {
    getFillColor: [selectedCountryISO] 
  },
  getLineColor: () => [158, 154, 200, 255],
  lineWidthMinPixels: 1,
  onClick: info => renderLayers(data, info.object)
});
  deckgl.setProps({ layers: [countyLayer, arcLayer] });
}
fetch('data/WorldPoly_with_centroids.geojson')
  .then(res => res.json())
  .then(data => {
    currentGeoData = data;
    renderLayers(data);

    // Modal dismiss logic moved here to ensure DOM is ready
    const dismissBtn = document.getElementById('dismiss-btn');
    const modal = document.getElementById('info-modal');

    if (dismissBtn && modal) {
      dismissBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    } else {
      console.warn("Modal or dismiss button not found.");
    }
  });