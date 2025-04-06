export function drawBarChart(data, selector) {
  const container = d3.select(selector);

  // 🧹 Clear previous content
  container.selectAll("*").remove();

  // Dimensions
  const width = 800;
  const height = 500;

  // Create an SVG inside the container
  const svg = container.append("svg")
    .attr("viewBox", `0 0 800 500`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("max-width", "800px")
    .style("height", "auto")
    .style("background-color", "white")
    .style("display", "block")
    .style("margin", "0 auto");
  // Set the dimensions of the chart
    const margin = { top: 40, right: 30, bottom: 100, left: 50 };
    const chartWidth = 500 - margin.left - margin.right;
    const chartHeight = 800 - margin.top - margin.bottom;

  const x = d3.scaleBand()
    .domain(data.map(d => d.category))
    .range([0, chartWidth])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .nice()
    .range([chartHeight, 0]);

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  chart.append("g")
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d.category))
    .attr("y", d => y(d.value))
    .attr("height", d => chartHeight - y(d.value))
    .attr("width", x.bandwidth())
    .attr("fill", "#69b3a2");

  chart.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  chart.append("g")
    .call(d3.axisLeft(y));
}