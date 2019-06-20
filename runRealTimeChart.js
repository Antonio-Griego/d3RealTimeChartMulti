'use strict';

// create the real time chart
let chart = initRealTimeChart()
    .yDomain(["Category1"]) // initial y domain (note array)
    .width(900)
    .height(350);

// invoke the chart
d3.select("#viewDiv").append("div").attr("id", "chartDiv").call(chart);

// event handler for debug checkbox
d3.select("#debug").on("change", function() {
    let state = d3.select(this).property("checked");
    chart.debug(state);
});

// event handler for halt checkbox
d3.select("#halt").on("change", function() {
    let state = d3.select(this).property("checked");
    chart.halt(state);
});

// configure the data generator

// mean and deviation for generation of time intervals
const tX = 5; // time constant, multiple of one second
let meanMs = 1000 * tX, // milliseconds
    dev = 200 * tX; // std dev

// define time scale
let timeScale = d3.scale.linear()
    .domain([300 * tX, 1700 * tX])
    .range([300 * tX, 1700 * tX])
    .clamp(true);

// define function that returns normally distributed random numbers
let normal = d3.random.normal(meanMs, dev);

// define color scale
let color = d3.scale.category10();

// in a normal use case, real time data would arrive through the network or some other mechanism
let timeout = 5000;

// define data generator
function dataGenerator() {

    setTimeout(function() {

        // add categories dynamically
        /*
        d++;
        switch (d) {
            case 5:
                chart.yDomain(["Category1", "Category2"]);
                break;
            case 10:
                chart.yDomain(["Category1", "Category2", "Category3"]);
                break;
            default:
        }
        */

        // output a sample for each category, each interval (five seconds)
        chart.yDomain().forEach(function(cat, i) {

            // create randomized timestamp for this category data item
            let now = new Date(new Date().getTime() + i * (Math.random() - 0.5) * 1000);

            // create new data item
            let obj = {
                // complex data item; four attributes (type, color, opacity and size) are changing dynamically with each iteration (as an example)
                time: now,
                // color: color(d % 10),
                color: color(3),
                opacity: 0.0,
                category: "Category" + (i + 1),
                //type: shapes[Math.round(Math.random() * (shapes.length - 1))], // the module currently doesn't support dynamically changed svg types (need to add key function to data, or method to dynamically replace svg object – tbd)
                type: "rect",
                size: Math.ceil(10 + (90 * Math.random()))
            };

            //console.log(obj.size);

            // send the datum to the chart
            chart.datum(obj);
        });

        // do forever
        dataGenerator();

    }, timeout);
}

// start the data generator
dataGenerator();