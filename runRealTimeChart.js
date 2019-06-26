'use strict';

// ----------------------------------------------------------------------------
// configure the real time chart
// ----------------------------------------------------------------------------

// create the real time chart
const chart = initRealTimeChart();

// invoke the real time chart
d3.select("#viewDiv").append("div").attr("id", "chartDiv").call(chart);

// ----------------------------------------------------------------------------
// configure the data generator
// ----------------------------------------------------------------------------

// in a normal use case, real time data would arrive through the network or some other mechanism
// the timeout units is milliseconds (1000 ms = 1 sec), one new data point is sent to the real
// time chart after every timeout
const timeout = 100;

// define data generator
function dataGenerator() {

    setTimeout(function() {

        // control flags for debugging and testing, toggled with checkboxes
        const debug = $("#debug").is(":checked");
        const halted = $("#halt").is(":checked");

        // if the real time data chart is paused, stop generating data until it's un-paused
        if (!halted) {

            // generate simulated data
            let obj = {
                sensorReading: Math.ceil(50 + (15 * Math.random())),
                index: 0
            };

            if (debug) console.log("simulated sensor reading: ", obj);

            chart.insertData(obj);
        }

        // do forever
        dataGenerator();

    }, timeout);
}

// start the data generator
dataGenerator();