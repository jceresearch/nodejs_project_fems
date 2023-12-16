function update(data) {
  console.log(data[0].date);

  //This is when using node.js to process, if we are using a browser, we use the script tag in index.html
  //import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"; // when we want to import directly
  //import * as d3 from "d3"; // this is when we installed the d3 library with npm

  // Declare the chart dimensions and margins.
  const width = 640;
  const height = 400;
  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 30;
  const marginLeft = 40;

  const series = data.map((d) => ({ date: new Date(d.date), close: d.close }));

  // Create the SVG container.
  const svg = d3.create("svg").attr("width", width).attr("height", height);
  // Add the title to the chart in font 24 san serif
  svg.append("g")
  .call((g) =>
  g
    .append("text")
    .attr("x", marginLeft)
    .attr("y", marginTop)
    .attr("fill", "currentColor")
    .attr("text-anchor", "start")
    .text("Title")
    .attr("font-size", 24)
    .attr("font-family", "sans-serif")
);




  // Append the SVG element.
  const container = d3.select("#bubbles_chart").node();
  container.appendChild(svg.node());
}

d3.json("/api").then(function (data) {
  update(data);
});
