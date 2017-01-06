var createImportExportGraphs = function () {
    //Reference, especially for G2 - https://bl.ocks.org/RandomEtc/cff3610e7dd47bef2d01
    //Here are specified 2 graphs, G1 and G2.
    var svg1 = d3.select("svg.importExport1"),
        margin = {top: 50, right: 10, bottom: 30, left: 100},   //height and margins are the same for both.
        height = svg1.attr("height") - margin.top - margin.bottom,
        g1 = svg1.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var svg2 = d3.select("svg.importExport2"),
        g2 = svg2.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Radio Button Listener
    d3.selectAll('input[name="industry"]').on("click", onRBClick);

    //Scales for both graphs
    var mData;
    var xG1, yG1;
    var xG2, yG2;

    //Data loading
    d3.csv("data/DeficitAcrossIndustry.csv", function(error, data) {

        data.forEach(function(d) {
            d.industry = d.Industry;
            d.percntDff = +d.Percentage_Diff;   //E.g.: Imports were larger than eports by 5.32%
            d.imp = +d.Imports;
            d.exp = +d.Exports;
        });
        mData = data;

        setUpG1();
        drawG1("Goods and Services", 0);
        //drawG1("Food, Brevages and Tobacco", 800);
        //drawG1("Fish", 1000);

        setUpG2();
        drawG2(data);
    });

    function setUpG1(){
        //Scales
        var width = svg1.attr("width") - 160 - margin.left - margin.right;
        xG1 = d3.scaleBand().rangeRound([0, width], .1)
                .paddingInner(0.1);
        yG1 = d3.scaleLinear()
                .range([height, 0]);

        //Add axes
        g1.append("g")
          .attr("class", "g1Axis x")
          .attr("transform", "translate(0," + height + ")");
        //
        g1.append("g")
          .attr("class", "g1Axis y")
        /*.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .style("text-anchor", "end")
          .text("Value in Millions of £");*///Doesn't work dont know why
        g1.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", -60)
          .attr("x", -160)
          .text("Value in Millions of £");

        //Add Bars, will be filled with data on draw.
        g1.append("rect")
          .attr("class", "ImportBar")
          .attr("fill", "crimson")
          .attr("width", xG1.bandwidth())
          .attr("x", function() { return xG1("Imports"); })
          .attr("height", function() { return height; });

        g1.append("rect")
          .attr("class", "ExportBar")
          .attr("fill", "limegreen")
          .attr("width", xG1.bandwidth())
          .attr("x", function() { return xG1("Imports"); })
          .attr("height", function() { return height; });
    }

    //Takes in the selected industry as a string. Must be the same string as in the csv file.
    function drawG1(selectedIndustry, animationTime){
        //Prepare data
        var selectedData; 
        for (var i = 0; i < mData.length; i++){
            if (mData[i].industry === selectedIndustry){
                selectedData = mData[i];
                break;
            }
        };
        if (!selectedData){
            console.log("Selected data was: "+selectedData);
            return; 
        }

        //Refresh the axes, making them change if necessary.
        xG1.domain(["Imports", "Exports"]).padding(0.3);
        var yMax = Math.max(selectedData.imp, selectedData.exp);
        yG1.domain([0, yMax*1.1]);//Aesthetic, want import bar to remain static when data changes.
        //Axes
        var xAxis = d3.axisBottom().scale(xG1);
        var yAxis = d3.axisLeft().scale(yG1);
        g1.select(".g1Axis.x").transition().duration(animationTime).call(xAxis);
        g1.select(".g1Axis.y").transition().duration(animationTime).call(yAxis);

        //Get data into IMPORT Bar
        g1.select(".ImportBar")
        .transition()
        .duration(animationTime)
          .attr("x", function() { return xG1("Imports"); })
          .attr("width", xG1.bandwidth())
          .attr("y", function() { return yG1(selectedData.imp); })
          .attr("height", function() { return height - yG1(selectedData.imp); });
        //Get data into EXPORT Bar
        g1.select(".ExportBar")
        .transition()
        .duration(animationTime)
          .attr("x", function() { return xG1("Exports"); })
          .attr("width", xG1.bandwidth())
          .attr("y", function() { return yG1(selectedData.exp); })
          .attr("height", function() { return height - yG1(selectedData.exp); });
    }

    function onRBClick(){
        //This will redraw the G1 bar chart depending on the selected industry.
        var selection = d3.select('input[name = "industry"]:checked').node().value;
        drawG1(selection, 800);
    }

    //-----------------Graph 2---------------------------
    function setUpG2(){
        var width = svg2.attr("width") - 190 - margin.left - margin.right;
        //Scales
        xG2 = d3.scaleBand().rangeRound([0, width], .1);
        yG2 = d3.scaleLinear().range([height, 0]);

        //Adding Axes
        g2.append("g")
            .attr("class", "g2Axis x")
            .attr("transform", "translate(0," + height + ")");

        g2.append("g")
            .attr("class", "g2Axis y");

        //Add title
        g2.append("text") 
            .attr("x", 100)
            .attr("y", -20)
            .attr("dy", ".71em")
            .text("The value of imports is X% larger than that of exports");
    }

    function drawG2(){
        //Slice the data into increasingly big subsets.
        var slices = [];
        for (var i = 0; i < mData.length; i++) {
            slices.push(mData.slice(0, i+1));
        }
        //Draw each of the slices with a time delay.
        slices.forEach(function(slice, index){
            setTimeout(function(){
            drawG2Section(slice);
            }, index * 600);
        });
    }

    function drawG2Section(data) {
        //Scales
        xG2.domain(data.map(function(d) { return d.industry; })).padding(0.3);
        yG2.domain([0, d3.max(data, function(d) { return d.percntDff; })]).nice();

        //Axes
        var xAxis = d3.axisBottom().scale(xG2);
        var yAxis = d3.axisLeft().scale(yG2)
            .tickFormat(function(d) { return d + "%"; });
        g2.select(".g2Axis.x").transition().duration(300).call(xAxis);
        g2.select(".g2Axis.y").transition().duration(300).call(yAxis)

        console.log(data);
        //This is the actual work. (data) is an array/iterable thing, second argument is an ID generator function
        var bars = g2.selectAll(".bar").data(data, function(d) { return d.industry; })     

        /*bars.exit()
           .transition()
           .duration(300)
            .attr("y", yG2(0))
            .attr("height", height - yG2(0))
            .style('fill-opacity', 1e-6)
            .remove();*/
        //Enter is the set of data which is going in from "data" but doesn't have a correspoing dom element
        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return xG2(d.industry); })
            .attr("width", xG2.bandwidth())
            .attr("y", yG2(0))
            .attr("height", height - yG2(0));

        //"To be updated" set:
        bars = g2.selectAll(".bar").data(data, function(d) { return d.industry; })
        bars.transition()
            .duration(300)
            .attr("x", function(d) { return xG2(d.industry); })
            .attr("width", xG2.bandwidth())
            .attr("y", function(d) { return yG2(d.percntDff); })
            .attr("height", function(d) { 
                console.log(yG2(d.percntDff));
                return height - yG2(d.percntDff); });
    }
};