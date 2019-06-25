'use strict';

// ----------------------------------------------------------------------------
// initialize the real time chart
// ----------------------------------------------------------------------------

// create the real time chart
let chart = initRealTimeChart(),
    debug = false,
    halted = false;

// invoke the chart
d3.select("#viewDiv").append("div").attr("id", "chartDiv").call(chart);

// event handler for debug checkbox
d3.select("#debug").on("change", function() {
    debug = d3.select(this).property("checked");
    chart.debug(debug);
});

// event handler for halt checkbox
d3.select("#halt").on("change", function() {
    halted = d3.select(this).property("checked");
    chart.halt(halted);
});

// ----------------------------------------------------------------------------
// configure the data generator
// ----------------------------------------------------------------------------

// in a normal use case, real time data would arrive through the network or some other mechanism
// the timeout units is milliseconds (1000 ms = 1 sec), one new data point is sent to the real
// time chart after every timeout
let timeout = 900;

// define data generator
function dataGenerator() {
    setTimeout(function() {
        // if the real time data chart is paused, stop generating data until it's un-paused
        if (!halted) {
            // create a new data item, simulating sensor readings
            let timestamp = new Date();
            let sensorReading = Math.ceil(35 + (25 * Math.random()));
            let obj = {timestamp: timestamp, sensorReading: sensorReading};

            if (debug) {
                console.log("obj: ", obj);
            }

            // send the datum to the chart
            chart.datum(obj);
        }

        // do forever
        dataGenerator();

    }, timeout);
}

// start the data generator
dataGenerator();