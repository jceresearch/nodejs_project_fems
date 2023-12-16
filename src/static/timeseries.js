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

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc(
    d3.extent(series, (d) => d.date),
    [marginLeft, width - marginRight],
  );

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear(
    [0, d3.max(series, (d) => d.close)],
    [height - marginBottom, marginTop],
  );

  // Create the SVG container.
  const svg = d3.create("svg").attr("width", width).attr("height", height);

  // Add the x-axis.
  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x));

  // Add the y-axis.
  svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y));

  // Declare the area generator.
  const area = d3
    .area()
    .x((d) => x(d.date))
    .y0(y(0))
    .y1((d) => y(d.close));
  // Append a path for the area (under the axes).

  svg.append("path").attr("fill", "steelblue").attr("d", area(series));

  svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke-opacity", 0.1),
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", -marginLeft)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("Daily close ($)"),
    );

  // Append the SVG element.
  const container = d3.select("#timeseries_chart").node();
  container.appendChild(svg.node());
}

d3.json("/api").then(function (data) {
  update(data);
});
