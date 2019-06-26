'use strict';

function initRealTimeChart() {

    // ------------------------------------------------------------------------
    // create and initialize all required variables and objects
    // ------------------------------------------------------------------------

    // time in milliseconds for the chart to check for updates and redraw the chart
    const chartUpdateRate = 100;

    // used to store the width and height of the total chart space in pixels
    const svgWidth = 600;
    const svgHeight = 400;

    // the total number of bars displayed on the x axis
    const maxBarsDisplayed = 100;

    // constants defining graphic sizes in pixels
    const pixelsPerRightBar = 70;
    const pixelsPerBar = (svgWidth - pixelsPerRightBar) / maxBarsDisplayed;
    const capHeight = svgHeight / 30;
    const dangerLineWidth = pixelsPerRightBar / 20;
    const rightLineWidth = pixelsPerRightBar / 20;
    const rightCircleRadius = rightLineWidth * 1.2;

    // the color of the bars displayed in the chart
    const capColor = d3.rgb(0, 0, 255);
    const barColor = d3.rgb(176, 204, 225);
    const rightBarColor = d3.rgb(90, 150, 200);

    // append the svg (scalable vector graphics)
    const svg = d3.select("#viewDiv")
        .append("div")
            .attr("id", "chartDiv")
        .append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight);

    // create main group and subgroups to attach to the svg
    const mainGroup = svg.append("g");
    const barGroup = mainGroup.append("g");
    const capGroup = mainGroup.append("g");
    const rightBar = mainGroup.append("g");

    // define main chart scales
    const xScale = d3.scale.linear().domain([maxBarsDisplayed, 0]).range([0, svgWidth - pixelsPerRightBar]);
    const yScale = d3.scale.linear().domain([0, 100]).range([svgHeight, 0]);

    // the array of data objects displayed on the chart
    let dataBars = [];
    let rightDataBar = [];
    let dangerValue = 80;

    // control flags for debugging and testing, toggled with checkboxes
    let debug = $("#debug").is(":checked");
    let halted = $("#halt").is(":checked");

    // event handler for debug checkbox
    d3.select("#debug").on("change", function() {
        debug = d3.select(this).property("checked");
    });

    // event handler for halt checkbox
    d3.select("#halt").on("change", function() {
        halted = d3.select(this).property("checked");
    });

    // ------------------------------------------------------------------------
    // create and initialize the real time chart with above parameters
    // ------------------------------------------------------------------------

    let chart = function () {

        // these svg elements are added to the chart before the looping function because
        // they only need to be set once
        mainGroup
            .append("svg:line")
                .attr("x1", svgWidth - pixelsPerRightBar)
                .attr("x2", svgWidth - pixelsPerRightBar)
                .attr("y1", 0)
                .attr("y2", svgHeight)
                .style("stroke", "rgb(0, 0, 0)")
                .style("stroke-width", rightLineWidth);
        mainGroup
            .append("svg:line")
            .attr("id", "dangerLine")
            .attr("x1", 0)
            .attr("x2", svgWidth)
            .attr("y1", dangerValue)
            .attr("y2", dangerValue)
            .style("stroke", "rgb(220, 20, 60)")
            .style("stroke-dasharray", "5")
            .style("stroke-width", dangerLineWidth);
        mainGroup
            .append("svg:circle")
                .attr("cx", svgWidth - pixelsPerRightBar)
                .attr("cy", rightCircleRadius)
                .attr("r", rightCircleRadius)
                .style("fill", "rgb(0, 0, 0)");

        // function to keep the chart "moving" through time (right to left)
        // here we bind the new data to the main chart; note: no key function is used here; therefore the data
        // binding is by index, which effectively means that available DOM elements are associated with each item
        // in the available data array, from first to last index; if the new data array contains fewer elements
        // than the existing DOM elements, the LAST DOM elements are removed; basically, for each step, the data
        // items "walks" leftward (each data item occupying the next DOM element to the left); This data binding
        // is very different from one that is done with a key function; in such a case, a data item stays
        // "resident" in the DOM element, and such DOM element (with data) would be moved left, until the x
        // position is to the left of the chart, where the item would be exited
        setInterval(function () {

            if (halted) return;

            // process data to remove data items that have moved off the left side of the chart
            dataBars = dataBars.filter(function (_) { return (_.index < maxBarsDisplayed); });
            rightDataBar = dataBars.filter(function (_, i) { return (i === (dataBars.length - 1)); });

            if (debug) console.log("data array size = ", dataBars.length);

            // select items
            let updateBarGroup = barGroup.selectAll(".bar").data(dataBars);
            let updateCapGroup = capGroup.selectAll(".bar").data(dataBars);
            let updateRightBar = rightBar.selectAll(".bar").data(rightDataBar);

            // remove items
            updateBarGroup.exit().remove();
            updateCapGroup.exit().remove();
            updateRightBar.exit().remove();

            // add items
            updateBarGroup.enter().append("svg:rect").attr("class", "bar");
            updateCapGroup.enter().append("svg:rect").attr("class", "bar");
            updateRightBar.enter().append("svg:rect").attr("class", "bar");

            // update items; added items are now part of the update selection
            updateBarGroup
                .attr("x", function (_) { return xScale(_["index"]); })
                .attr("y", function (_) { return yScale(_["sensorReading"]); })
                .attr("width", pixelsPerBar)
                .attr("height", svgHeight)
                .style("fill", barColor);
            updateCapGroup
                .attr("x", function (_) { return xScale(_["index"]); })
                .attr("y", function (_) { return yScale(_["sensorReading"]); })
                .attr("width", pixelsPerBar)
                .attr("height", capHeight)
                .style("fill", capColor);
            updateRightBar
                .attr("x", svgWidth - pixelsPerRightBar)
                .attr("y", function (_) { return yScale(_["sensorReading"]); })
                .attr("width", pixelsPerRightBar)
                .attr("height", svgHeight)
                .style("fill", rightBarColor);

            // change the position of the danger value line if it was updated
            document.getElementById("dangerLine").setAttribute("y1", dangerValue.toString());
            document.getElementById("dangerLine").setAttribute("y2", dangerValue.toString());

        }, chartUpdateRate);
    };

    // this function appends a new data item (sensor reading) to the chart to be displayed;
    // all of the display indexes in the array are incremented, such that data items will
    // be moving from right to left, with the rightmost array element having index = 0
    chart.insertData = function (_) {

        // update array indices
        dataBars.forEach(function (_) { _.index += 1; });

        // insert new data item with index = 0
        dataBars.push(_);

        // update html label displaying the most recent sensor value
        document.getElementById("remLabel").innerText = _.sensorReading;
    };

    chart.updateDangerValue = function (_) {
        dangerValue = _;
    };

    return chart;
}