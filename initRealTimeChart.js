'use strict';

function initRealTimeChart() {

  // used to store the width and height of the total chart space in pixels
  const svgWidth = 600;
  const svgHeight = 400;

  // the total time displayed on the chart (default = 300)
  const maxSeconds = 10;

  // the width in pixels representing 1 second (default = 10)
  const pixelsPerSecond = svgWidth / maxSeconds;

  // the color of the bars displayed in the chart
  const capColor = d3.rgb(0, 0, 255);
  const barColor = d3.rgb(176, 204, 225);

  // individual data point appended to the data array
  let datum;

  // the array of data displayed on the chart
  let data, data2;

  // control flags for debugging and testing, toggled with checkboxes
  let debug = false;
  let halted = false;

  // append the svg
  let svg = d3.select("#viewDiv")
      .append("div")
      .attr("id", "chartDiv")
      .append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight);

  // define main chart scales
  let x = d3.time.scale().range([0, svgWidth]);
  let y = d3.scale.linear().domain([0, 100]).range([svgHeight, 0]);

  // create the chart
  let chart = function() {

    // create main group and translate
    let main = svg.append("g")
        .attr("transform", "translate (0, 0)");

    let barGroup = main.append("g")
        .attr("class", "barGroup")
        .attr("transform", "translate(0, 0)")
        .append("g");

    let barGroup2 = main.append("g")
        .attr("class", "barGroup")
        .attr("transform", "translate(0, 0)")
        .append("g");

    let rightBar = main.append("g")
        .attr("class", "barGroup")
        .attr("transform", "translate(0, 0)")
        .append("g");

    // first, the full time domain
    let endTime = new Date(new Date().getTime());
    let startTime = new Date(endTime.getTime() - maxSeconds * 1000);

    // set the scale domains for main and nav charts
    x.domain([startTime, endTime]);

    // initial invocation; update display
    data = [];
    data2 = [];
    refresh();

    // function to refresh the viz upon changes of the time domain 
    // (which happens constantly), or after arrival of new data, or at init
    function refresh() {

      // process data to remove too late data items
      data = data.filter(function(_) {
        return (_.timestamp.getTime() > (startTime.getTime() - (maxSeconds * 500)));
      });
      data2 = data.filter(function(_, i) {
        return (i === (data.length - 1));
      });

      if (debug) console.log("data array size = ", data.length);

      // here we bind the new data to the main chart
      // note: no key function is used here; therefore the data binding is
      // by index, which effectively means that available DOM elements
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
      let updateSel = barGroup.selectAll(".bar").data(data);
      let updateSel2 = barGroup2.selectAll(".bar").data(data);
      let update3 = rightBar.selectAll(".bar").data(data2);

      // remove items
      updateSel.exit().remove();
      updateSel2.exit().remove();
      update3.exit().remove();

      // add items
      updateSel.enter()
          .append(function() {
            return (document.createElementNS("http://www.w3.org/2000/svg", "rect"));
          })
          .attr("class", "bar");
      updateSel2.enter()
          .append(function() {
            return (document.createElementNS("http://www.w3.org/2000/svg", "rect"));
          })
          .attr("class", "bar");

      update3.enter()
          .append(function() {
            return (document.createElementNS("http://www.w3.org/2000/svg", "rect"));
          })
          .attr("class", "bar");

      // update items; added items are now part of the update selection
      updateSel
          .attr("x", function(_) { return Math.round(x(_.timestamp)); })
          .attr("y", function(_) { return Math.round(y(_.sensorReading)); })
          .attr("width", pixelsPerSecond)
          .attr("height", svgHeight)
          .style("fill", barColor)
          .style("fill-opacity", 1.0);

      updateSel2
          .attr("x", function(_) { return Math.round(x(_.timestamp)); })
          .attr("y", function(_) { return Math.round(y(_.sensorReading)); })
          .attr("width", pixelsPerSecond)
          .attr("height", 15)
          .style("fill", capColor)
          .style("fill-opacity", 1.0);

      update3
          .attr("x", svgWidth - pixelsPerSecond)
          .attr("y", function(_) { return Math.round(y(_.sensorReading)); })
          .attr("width", pixelsPerSecond + 5)
          .attr("height", svgHeight + 5)
          .style("fill", d3.rgb(100, 100, 100))
          .style("fill-opacity", 1.0);
    }

    // function to keep the chart "moving" through time (right to left) 
    setInterval(function() {

      if (halted) return;

      // compute new nav extents
      endTime = new Date(new Date().getTime());
      startTime = new Date(endTime.getTime() - maxSeconds * 1000);

      // update scales
      x.domain([startTime, endTime]);
      refresh();

    }, 10); // default 200

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
    document.getElementById("remLabel").innerText = datum.sensorReading;
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