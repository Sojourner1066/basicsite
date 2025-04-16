import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// export function drawMiniHorizontalBarChart(data, selector) {
//   const container = d3.select(selector);
//   container.selectAll("*").remove();

//   const margin = { top: 10, right: 10, bottom: 20, left: 100 };
//   const width = 300 - margin.left - margin.right;
//   const height = 200 - margin.top - margin.bottom;

//   const svg = container.append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//     .style("background-color", "white")
//     .style("border-radius", "8px")
//     .append("g")
//     .attr("transform", `translate(${margin.left},${margin.top})`);

//   const x = d3.scaleLinear()
//     .domain([0, d3.max(data, d => d.value)])
//     .range([0, width]);

//   const y = d3.scaleBand()
//     .domain(data.map(d => d.category))
//     .range([0, height])
//     .padding(0.1);

//   svg.append("g")
//     .call(d3.axisLeft(y));

//   svg.append("g")
//     .attr("transform", `translate(0,${height})`)
//     .call(d3.axisBottom(x).ticks(3).tickFormat(d3.format(".2s")));

//   svg.selectAll("rect")
//     .data(data)
//     .enter()
//     .append("rect")
//     .attr("y", d => y(d.category))
//     .attr("height", y.bandwidth())
//     .attr("x", 0)
//     .attr("width", d => x(d.value))
//     .attr("fill", "#4682b4");
// }

export function drawMiniHorizontalBarChart(data, selector) {
  const container = d3.select(selector);
  container.selectAll("*").remove();

  // Create or select tooltip div
  let tooltip = d3.select("#tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body").append("div")
      .attr("id", "tooltip")
      .style("position", "absolute")
      .style("padding", "6px 10px")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("display", "none")
      .style("z-index", "3000");
  }

  const margin = { top: 10, right: 10, bottom: 20, left: 100 };
  const width = 300 - margin.left - margin.right;
  const height = 200 - margin.top - margin.bottom;

  const svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background-color", "white")
    .style("border-radius", "8px")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.category))
    .range([0, height])
    .padding(0.1);

  svg.append("g").call(d3.axisLeft(y));
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(3).tickFormat(d3.format(".2s")));

  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("y", d => y(d.category))
    .attr("height", y.bandwidth())
    .attr("x", 0)
    .attr("width", d => x(d.value))
    .attr("fill", "#4682b4")
    .on("mouseover", (event, d) => {
      tooltip
        .style("display", "block")
        .html(`<strong>${d.fullName}</strong><br>Population: ${d.value.toLocaleString()}`);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("top", (event.pageY - 28) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("display", "none");
    });
}


export function drawCircularBarChart(data, selector) {
  const container = d3.select(selector);
  container.selectAll("*").remove();

  const width = 600;
  const height = 600;
  const innerRadius = 100;
  const outerRadius = Math.min(width, height) / 2 - 40;

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("max-width", `${width}px`)
    .style("height", "auto")
    .style("background-color", "white")
    .style("display", "block")
    .style("margin", "0 auto")
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  const x = d3.scaleBand()
    .domain(data.map(d => d.category))
    .range([0, 2 * Math.PI]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([innerRadius, outerRadius]);

    const color = d3.scaleOrdinal()
    .domain(data.map(d => d.category))
    .range(d3.schemeSet2);  // use any d3 color scheme you like
  
  svg.append("g")
    .selectAll("path")
    .data(data)
    .join("path")
      .attr("fill", d => color(d.category))
      .attr("d", d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(d => y(d.value))
        .startAngle(d => x(d.category))
        .endAngle(d => x(d.category) + x.bandwidth())
        .padAngle(0.01)
        .padRadius(innerRadius)
      );

  // Add labels
  svg.append("g")
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("text-anchor", d => {
      const angle = x(d.category) + x.bandwidth() / 2;
      return (angle > Math.PI && angle < 2 * Math.PI) ? "end" : "start";
    })
    // .attr("transform", d => {
    //   const angle = x(d.category) + x.bandwidth() / 2 - Math.PI / 2;
    //   const r = outerRadius + 10;
    //   return `rotate(${(angle * 180 / Math.PI)})translate(${r},0)`;
    // })
    .attr("transform", d => {
      const angle = x(d.category) + x.bandwidth() / 2 - Math.PI / 2;
      const radius = y(d.value) + 10; // move label just beyond the bar
      return `rotate(${(angle * 180 / Math.PI)})translate(${radius},0)`;
    })
    .append("text")
    .text(d => d.category)
    .attr("transform", d => {
      const angle = x(d.category) + x.bandwidth() / 2;
      return (angle > Math.PI && angle < 2 * Math.PI) ? "rotate(180)" : null;
    })
    .style("font-size", "16px")
    .attr("alignment-baseline", "middle");

    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("y", -outerRadius - 10) // position above the top of the chart
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text("International Organization Types");
}