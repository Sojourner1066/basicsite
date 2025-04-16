const { DeckGL, GeoJsonLayer, ArcLayer } = deck;
import { getRandomISO3Codes } from './js/getRandomISO3Codes.js';
import { wdGetAllMembershipsbyISO } from './js/wdGetAllMembershipsbyISO.js';
import { wdCategoryCounts } from './js/wdCategoryCount.js';
import { drawCircularBarChart } from './js/d3_drawCharts.js';
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

// getSmallTreatyMembersGrouped("USA", 130).then(result => {
//   console.log("Grouped Treaty Members:", result);
// });

// const treatyCountryGroups = await getSmallTreatyMembersGrouped(selectedCountryISO, maxParticipants);
// const relatedCountries = getUniqueMemberCountries(treatyCountryGroups, selectedCountryISO);


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
  
  // this the default number of participants in a treaty
  // const maxParticipants = 40; // max number of participants in a treaty

  const treatyCountryGroups = await getSmallTreatyMembersGrouped(selectedCountryISO, maxParticipants);
  console.log("treatyCountryGroups", treatyCountryGroups);
  console.log("ISO", selectedCountryISO);
  console.log("max", maxParticipants);

  const targetIsoCodes = getUniqueMemberCountries(treatyCountryGroups, selectedCountryISO);


  const CategoryCounts = await wdCategoryCounts(selectedFeature.properties.adm0_iso);
  // drawBarChart(Object.entries(CategoryCounts).map(([category, value]) => ({ category, value })), "#chart-container");
  drawCircularBarChart(Object.entries(CategoryCounts).map(([category, value]) => ({ category, value })), "#chart-container");
  
  // const selectedData = filterByIsoCodes(CountryStats, ["USA", "GBR", "NGA"]);
  const selectedData = filterByIsoCodes(CountryStats, targetIsoCodes);;

  const populationData = selectedData.map(d => ({
    category: d.countryLabel.value,
    value: d.population?.value ? +d.population.value : 0
  }));
  drawMiniHorizontalBarChart(populationData, "#pop-chart-container");


  // selectedFeature = data.features.find(f => f.properties.adm0_iso === selectedCountryISO);
  // console.log(selectedFeature.properties.adm0_iso);
  // const membershipJSON = await wdGetAllMembershipsbyISO(selectedFeature.properties.adm0_iso);
  // console.log(membershipJSON);
  // const targetIsoCodes = membershipJSON.results.bindings.map(d => d.targetCode.value);
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
    getFillColor: [selectedCountryISO] 
  },
  getLineColor: () => [158, 154, 200, 255],
  lineWidthMinPixels: 1,
  onClick: info => renderLayers(data, info.object)
});
  deckgl.setProps({ layers: [countyLayer, arcLayer] });

  // const CategoryCounts = await wdCategoryCounts(selectedFeature.properties.adm0_iso);
  // // drawBarChart(Object.entries(CategoryCounts).map(([category, value]) => ({ category, value })), "#chart-container");
  // drawCircularBarChart(Object.entries(CategoryCounts).map(([category, value]) => ({ category, value })), "#chart-container");
  
  // const selectedData = filterByIsoCodes(CountryStats, ["USA", "GBR", "NGA"]);

  // const populationData = selectedData.map(d => ({
  //   category: d.countryLabel.value,
  //   value: +d.population.value
  // }));
  // drawMiniHorizontalBarChart(populationData, "#pop-chart-container");
}

fetch('data/WorldPoly_with_centroids.geojson')
  .then(res => res.json())
  // .then(data => renderLayers(data));
  .then(data => {
    currentGeoData = data;
    renderLayers(data);
  });