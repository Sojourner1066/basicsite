let countryCentroids = null;

async function loadCountryCentroids() {
  const data = await fetchWikidataGeoJSON();
  console.log("Loaded country centroids:", data);
  countryCentroids = data;
}

const { DeckGL, GeoJsonLayer, ArcLayer } = deck;

const inFlowColors = [
  [255, 255, 204],
  [199, 233, 180],
  [127, 205, 187],
  [65, 182, 196],
  [29, 145, 192],
  [34, 94, 168],
  [12, 44, 132]
];

const outFlowColors = [
  [255, 255, 178],
  [254, 217, 118],
  [254, 178, 76],
  [253, 141, 60],
  [252, 78, 42],
  [227, 26, 28],
  [177, 0, 38]
];

const deckgl = new DeckGL({
  mapStyle: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
  initialViewState: {
    longitude: -100,
    latitude: 40.7,
    zoom: 3,
    maxZoom: 15,
    pitch: 30,
    bearing: 30
  },
  controller: true,
  layers: [],
  getTooltip: ({ object }) => object && object.properties.name
});

function getArcLayer(data, selectedFeature) {
  const { flows, centroid } = selectedFeature.properties;
  const arcs = Object.keys(flows).map(toId => {
    const f = data.features[toId];
    return {
      source: centroid,
      target: f.properties.centroid,
      value: flows[toId]
    };
  });

  const scale = d3.scaleQuantile()
    .domain(arcs.map(a => Math.abs(a.value)))
    .range(inFlowColors.map((c, i) => i));

  arcs.forEach(a => {
    a.gain = Math.sign(a.value);
    a.quantile = scale(Math.abs(a.value));
  });

  return new ArcLayer({
    id: 'arc',
    data: arcs,
    getSourcePosition: d => d.source,
    getTargetPosition: d => d.target,
    getSourceColor: d => (d.gain > 0 ? inFlowColors : outFlowColors)[d.quantile],
    getTargetColor: d => (d.gain > 0 ? outFlowColors : inFlowColors)[d.quantile],
    strokeWidth: 4
  });
}

function renderLayers(data, selectedFeature) {
  selectedFeature = selectedFeature || data.features.find(f => f.properties.name === 'United States of America'); //'Los Angeles, CA');

//   const arcLayer = getArcLayer(data, selectedFeature);

  const countyLayer = new GeoJsonLayer({
    id: 'geojson',
    data,
    stroked: false,
    filled: true,
    autoHighlight: true,
    pickable: true,
    highlightColor: [158, 154, 200, 255],
    // getFillColor: () => [0, 0, 0, 0],
    getFillColor: () => [203, 201, 226, 255],
    getLineColor: () => [158, 154, 200, 255],
    onClick: info => renderLayers(data, info.object)
  });

//   const defaultStyle = {
//     fillColor: "#cbc9e2", 
//     color: "#9e9ac8",       // Border color
//     weight: 1,
//     fillOpacity: 0.6
// };

// const hoverStyle = {
//     fillColor: "#9e9ac8",
//     color: "#9e9ac8",
//     weight: 1,
//     fillOpacity: 0.8
// };

// const selectedStyle = {
//     fillColor: "#54278f", 
//     weight: 1
// };


//   deckgl.setProps({ layers: [countyLayer, arcLayer] });
  deckgl.setProps({ layers: [countyLayer] });
}
fetch('data/WorldPoly_with_centroids.geojson')
  .then(res => res.json())
  .then(data => renderLayers(data));
// fetch('https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/arc/counties.json')
//   .then(res => res.json())
//   .then(data => renderLayers(data));