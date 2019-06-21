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
// the timeout units is milliseconds (1000 ms = 1 sec)
let timeout = 1000;

// define data generator
function dataGenerator() {
    setTimeout(function() {
        // if the real time data chart is paused, stop generating data until it's unpaused
        if (!halted) {
            // create a new data item, with attributes changing dynamically with each iteration
            // we are simulating sensor readings in range from [10, 100)
            let timestamp = new Date();
            let sensorReading = Math.ceil(10 + (90 * Math.random()));
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