'use strict';

function initRealTimeChart() {

  // used to store the width and height of the total chart space in pixels
  const svgWidth = 600;
  const svgHeight = 400;

  // the total time displayed on the chart (default = 300)
  const maxSeconds = 60;

  // the width in pixels representing 1 second (default = 10)
  const pixelsPerSecond = 50;

  // the color of the bars displayed in the chart (category 10, color 3 === blue)
  const barColor = d3.scale.category10()(3);

      // individual data point appended to the data array
  let datum,

      // the array of data displayed on the chart
      data,

      margin = { top: 10, bottom: 10, left: 30, right: 30, topNav: 10, bottomNav: 40 },
      dimension = { xAxis: 20, yAxis: 20, navChart: 100 },

      debug = false,
      halted = false,

      x, y,
      xNav, yNav,
      width, height,
      widthNav, heightNav,

      xAxisG, yAxisG,
      xAxis, yAxis,
      svg;

  // create the chart
  let chart = function() {

    // compute dimension of main and nav charts, and offsets
    height = svgHeight - margin.top - margin.bottom - dimension.xAxis - dimension.navChart + 25;
    heightNav = dimension.navChart - margin.topNav - margin.bottomNav;
    let marginTopNav = svgHeight - margin.bottom - heightNav - margin.topNav;
    width = svgWidth - margin.left - margin.right;
    widthNav = width;

    // append the svg
    svg = d3.select("#viewDiv")
        .append("div")
        .attr("id", "chartDiv")
            .append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight);

    // create main group and translate
    let main = svg.append("g")
        .attr("transform", "translate (" + margin.left + "," + margin.top + ")");

    // define clip-path
    main.append("defs").append("clipPath")
        .attr("id", "myClip")
      .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

    // create chart background
    main.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .style("fill", "#f5f5f5");

    // note that two groups are created here, the latter assigned to barG;
    // the former will contain a clip path to constrain objects to the chart area; 
    // no equivalent clip path is created for the nav chart as the data itself
    // is clipped to the full time domain
    let barG = main.append("g")
        .attr("class", "barGroup")
        .attr("transform", "translate(0, 0)")
        .attr("clip-path", "url(#myClip)")
      .append("g");

    // add group for x axis
    xAxisG = main.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")");

    // add group for y axis
    yAxisG = main.append("g")
        .attr("class", "y axis");

    // define main chart scales
    x = d3.time.scale().range([0, width]);
    y = d3.scale.linear().domain([0, 100]).range([height, 0]);

    // define main chart axis
    xAxis = d3.svg.axis().orient("bottom");
    yAxis = d3.svg.axis().orient("left");

    // add nav chart
    let nav = svg.append("g")
        .attr("transform", "translate (" + margin.left + "," + marginTopNav + ")");

    // add nav background
    nav.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", heightNav)
        .style("fill", "#F5F5F5")
        .style("shape-rendering", "crispEdges")
        .attr("transform", "translate(0, 0)");

    // add group to data items
    let navG = nav.append("g")
        .attr("class", "nav");

    // add group to hold nav x axis
    // please note that a clip path has yet to be added here (tbd)
    let xAxisGNav = nav.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + heightNav + ")");

    // define nav chart scales
    xNav = d3.time.scale().range([0, widthNav]);
    yNav = d3.scale.linear().domain([0, 100]).range([heightNav, 0]);

    // define nav axis
    let xAxisNav = d3.svg.axis().orient("bottom");

    // compute initial time domains...
    let ts = new Date().getTime();

    // first, the full time domain
    let endTime = new Date(ts);
    let startTime = new Date(endTime.getTime() - maxSeconds * 1000);
    // let interval = endTime.getTime() - startTime.getTime();

    // then the viewport time domain (what's visible in the main chart and the viewport in the nav chart)
    let endTimeViewport = new Date(ts);
    let startTimeViewport = new Date(endTime.getTime() - width / pixelsPerSecond * 1000);
    let intervalViewport = endTimeViewport.getTime() - startTimeViewport.getTime();
    let offsetViewport = startTimeViewport.getTime() - startTime.getTime();

    // set the scale domains for main and nav charts
    x.domain([startTimeViewport, endTimeViewport]);
    xNav.domain([startTime, endTime]); 

    // update axis with modified scale
    xAxis.scale(x)(xAxisG);
    yAxis.scale(y)(yAxisG);
    xAxisNav.scale(xNav)(xAxisGNav);

    // create brush (moveable, changable rectangle that determines the time domain of main chart)
    let viewport = d3.svg.brush()
        .x(xNav)
        .extent([startTimeViewport, endTimeViewport])
        .on("brush", function () {
          // get the current time extent of viewport
          let extent = viewport.extent();
          startTimeViewport = extent[0];
          endTimeViewport = extent[1];

          // compute viewport extent in milliseconds
          intervalViewport = endTimeViewport.getTime() - startTimeViewport.getTime();
          offsetViewport = startTimeViewport.getTime() - startTime.getTime();

          // handle invisible viewport
          if (intervalViewport === 0) {
            intervalViewport = maxSeconds * 1000;
            offsetViewport = 0;
          }

          // update the x domain of the main chart
          x.domain(viewport.empty() ? xNav.domain() : extent);

          // update the x axis of the main chart
          xAxis.scale(x)(xAxisG);

          // update display
          refresh();
        });

    // create group and assign to brush

    nav.append("g")
       .attr("class", "viewport")
       .call(viewport)
       .selectAll("rect")
       .attr("height", heightNav);

    // initial invocation; update display
    data = [];
    refresh();

    // function to refresh the viz upon changes of the time domain 
    // (which happens constantly), or after arrival of new data, or at init
    function refresh() {

      // process data to remove too late data items 
      data = data.filter(function(_) {
        if (_.timestamp.getTime() > startTime.getTime()) return true;
      });

      // here we bind the new data to the main chart
      // note: no key function is used here; therefore the data binding is
      // by index, which effectivly means that available DOM elements
      // are associated with each item in the available data array, from 
      // first to last index; if the new data array contains fewer elements
      // than the existing DOM elements, the LAST DOM elements are removed;
      // basically, for each step, the data items "walks" leftward (each data 
      // item occupying the next DOM element to the left);
      // This data binding is very different from one that is done with a key 
      // function; in such a case, a data item stays "resident" in the DOM
      // element, and such DOM element (with data) would be moved left, until
      // the x position is to the left of the chart, where the item would be 
      // exited
      let updateSel = barG.selectAll(".bar").data(data);

      // remove items
      updateSel.exit().remove();

      // add items
      updateSel.enter()
          .append(function() {
            return (document.createElementNS("http://www.w3.org/2000/svg", "rect"));
          })
          .attr("class", "bar");

      // update items; added items are now part of the update selection
      updateSel
          .attr("x", function(_) { return Math.round(x(_.timestamp)); })
          .attr("y", function(_) { return Math.round(y(_.sensorReading)); })
          .attr("width", function() { return pixelsPerSecond; }) // d.sensorReading
          .attr("height", function(_) { return (svgHeight - _.sensorReading); })
          .style("fill", barColor)
          .style("stroke", "orange")
          .style("stroke-width", "1px")
          .style("stroke-opacity", 0.5)
          .style("fill-opacity", 1.0);

      // create update selection for the nav chart, by applying data
      let updateSelNav = navG.selectAll(".bar").data(data);

      // remove items
      updateSelNav.exit().remove();

      // add items
      updateSelNav.enter()
          .append(function() {
            return (document.createElementNS("http://www.w3.org/2000/svg", "rect"));
          })
          .attr("class", "bar");

      // added items now part of update selection; set coordinates of points
      updateSelNav
          //.attr("cx", function(_) { return Math.round(xNav(_.time)); })
          //.attr("cy", function(_) { return Math.round(yNav(_.sensorReading)); })

          .attr("x", function(_) { return Math.round(xNav(_.timestamp)); })
          .attr("y", function(_) { return Math.round(yNav(_.sensorReading)); })
          .attr("width", function() { return 5; }) // d.sensorReading
          .attr("height", function(_) { return (_.sensorReading); })
          .style("fill", barColor)
          .style("stroke", "orange")
          .style("stroke-width", "1px")
          .style("stroke-opacity", 0.5)
          .style("fill-opacity", 1.0);

    } // end refreshChart function

    // function to keep the chart "moving" through time (right to left) 
    setInterval(function() {

      if (halted) return;

      // get current viewport extent
      let extent = viewport.empty() ? xNav.domain() : viewport.extent();
      let interval = extent[1].getTime() - extent[0].getTime();
      let offset = extent[0].getTime() - xNav.domain()[0].getTime();

      // compute new nav extents
      endTime = new Date();
      startTime = new Date(endTime.getTime() - maxSeconds * 1000);

      // compute new viewport extents 
      startTimeViewport = new Date(startTime.getTime() + offset);
      endTimeViewport = new Date(startTimeViewport.getTime() + interval);
      viewport.extent([startTimeViewport, endTimeViewport]);

      // update scales
      x.domain([startTimeViewport, endTimeViewport]);
      xNav.domain([startTime, endTime]);

      // update axis
      xAxis.scale(x)(xAxisG);
      xAxisNav.scale(xNav)(xAxisGNav);

      // refresh svg
      refresh();

    }, 0); // default 200

    return chart;

  }; // end chart function

  // --------------------------------------------------------------------------
  // setters
  // --------------------------------------------------------------------------

  // new data item (this most recent item will appear 
  // on the right side of the chart, and begin moving left)
  chart.datum = function(_) {
    if (arguments.length === 0) return datum;
    datum = _;
    data.push(datum);
    return chart;
  };

  // debug
  chart.debug = function(_) {
    if (arguments.length === 0) return debug;
    debug = _;
    return chart;       
  };

  // halt
  chart.halt = function(_) {
    if (arguments.length === 0) return halted;
    halted = _;
    return chart;       
  };

  return chart;
}