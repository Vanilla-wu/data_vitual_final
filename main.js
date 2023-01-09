const parseNA=string=>(string ===''?undefined:string);
const parseDate=string=> d3.timeParse('%Y-%m-%d')(string);
var time;
var region;

// 資料讀取
d3.csv('data/full_grouped.csv', type).then(
    res=>{
        ready(res);
        //console.log(res);
    }
)

function type(d){
    const Date = parseDate(d.Date);
    const Month = Date.getMonth()+1;
    return {
        Country:parseNA(d["Country/Region"]),
        Month:Month,
        New_cases:+d["New cases"],
        Region:parseNA(d["WHO Region"])
    }
}

//合併資料
function merge(data){
    //console.log(data);
    const data_map = d3.rollup(
        data,
        v => d3.sum(v, leaf => leaf.New_cases),
        d => d.Country
    );
    //console.log(data_map)
    const data_array = Array.from(data_map, d=>({Country:d[0], New_cases:d[1]}))
    return data_array;
}

//篩選資料
function ready(datas){
    time = "year";
    region = "world";
    const output_data = merge(chooseData(time, region, datas)).sort(
        (a, b) => {
            return d3.descending(a.New_cases,b.New_cases);
        }
    ).filter((d, i) => i < 15);
    console.log(output_data);
    drawSVG(time, region, output_data);
    setupCanvas(datas);
}

//buttom互動
function setupCanvas(datas){
    //選擇月份
    function clickTime(){
        time = this.dataset.name;
        // console.log(time);
        const output_data = merge(chooseData(time, region, datas)).sort(
            (a, b) => {
                return d3.descending(a.New_cases,b.New_cases);
            }
        ).filter((d, i) => i < 15);
        console.log(output_data);
        deleteSVG();
        drawSVG(time, region, output_data);
    }

    //選擇地區
    function clickRegion(){
        region = this.dataset.name;
        // console.log(region);
        const output_data = merge(chooseData(time, region, datas)).sort(
            (a, b) => {
                return d3.descending(a.New_cases,b.New_cases);
            }
        ).filter((d, i) => i < 15);
        console.log(output_data);
        deleteSVG();
        drawSVG(time, region, output_data);
    }

    //觸發點擊
    d3.select(".time_controls").selectAll('.btn').on('click',clickTime);
    d3.select(".region_controls").selectAll('.btn').on('click',clickRegion);

}

//繪製SVG
function drawSVG(time, region, datas){
    const svg_width = 700;
    const svg_height = 500;
    const barchart_margin = { top: 80, right: 40, bottom: 40, left: 100 };
    const barchart_width = svg_width - (barchart_margin.left + barchart_margin.right);
    const barchart_height = svg_height - (barchart_margin.top + barchart_margin.bottom);

    const this_svg = d3.select('.bar_chart_container').append('svg')
        .attr("class","graph")
        .attr('width', svg_width)
        .attr('height', svg_height).append('g')
        .attr('transform', `translate(${barchart_margin.left}, ${barchart_margin.top})`)
        .style('transition', "0,5s");
    //scale
    // d3.extent -> find min & max
    const xExtent = d3.extent(datas, d => d.New_cases);
    //console.log(xExtent)       

    //scale
    // d3.extent -> find min & max  
    //v3 short writing for v2
    let xMax = d3.max(datas, d => d.New_cases);
    let xScale_v3 = d3.scaleLinear([0, xMax], [0, barchart_width]);
    let color = d3.scaleLinear([0, xMax / 4, xMax / 2, xMax * 3 / 4, xMax], ["#67873e", "#3e8744", '#3e8771', '#3e7287','#3e4b87']);
    let opacity = d3.scaleLinear([0,xMax],[0.5,1])
    //y
    let yScale = d3.scaleBand().domain(datas.map(d => d.Country))
        .rangeRound([0, barchart_height])
        .paddingInner(0.1);
    
    //Draw bars 
    const bars = this_svg.selectAll('.bar').data(datas).enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0).attr('y', d => yScale(d.Country))
        .transition().duration(800).delay(-200)
        .attr('width', d => xScale_v3(d.New_cases))
        .attr('height', yScale.bandwidth())
        .style('transition-duration',"0,5s")
        .style('fill', d => color(d.New_cases))
        .style('fill-opacity', d => opacity(d.New_cases));
    //const bars = this_svg.append('g').attr('class', 'bars')


    //Draw Header
    let header = this_svg.append('g').attr('class', 'bar-header')
        .attr('transform', 'translate(0,${-barchart_margin.top / 2})')
        .style('transition','0.5s')
        .append('text');
    // header.append('tspan').text('Total revenue by genre in $US');
    header.append('tspan').text("Top 15 Confirmed-cases country of " + getRegion(region) + " in " + getTime(time))
          .style('background-color','#fff');
    //Draw X axis & Y axis
    let xAxis = d3.axisTop(xScale_v3)
        .tickSizeInner(-barchart_height)
        .tickSizeOuter(0);
    // const xAxisDraw = this_svg.append('g').attr('class','x axis').call(xAxis);
    let xAxisDraw = this_svg.append('g').attr('class', 'x axis');

    //tickSize : set tickSizeInner & tickSizeOuter at the same time with the same value
    let yAxis = d3.axisLeft(yScale).tickSize(0);
    const yAxisDraw = this_svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
    yAxisDraw.selectAll('text').attr('dx', '-0.6em')
    d3.selectAll('.bar')
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);
}
//清除SVG
function deleteSVG(){
    d3.selectAll(".graph").remove();
}

//interactive
const tip = d3.select('.tooltip');
//e -> event
function mouseover(e) {
    const thisBarData = d3.select(this).data()[0];
    tip.style('left', (e.clientX + 25) + 'px')
        .style('top', e.clientY +10+ 'px')
        .transition()
        .style('opacity', 0.98)
        .text(thisBarData.Country+"   Cases:"+thisBarData.New_cases);
}

function mousemove(e) {
    tip.style('left', (e.clientX + 15) + 'px')
        .style('top', e.clientY + 'px');
}

function mouseout(e) {
    tip.transition()
        .style('opacity', 0);
}



//最終選擇
function chooseData(time, region, datas){
    return chooseRegion(region, chooseTime(time, datas))
}

//選擇月份
function chooseTime(time, datas){
    if (time == "year"){
        const thisData = year_data(datas);
        return thisData;
    }
    if (time == "jan"){
        const thisData = jan_data(datas);
        return thisData;
    }
    if (time == "feb"){
        const thisData = feb_data(datas)
        return thisData;
    }
    if (time == "mar"){
        const thisData = mar_data(datas);
        return thisData;
    }
    if (time == "apr"){
        const thisData = apr_data(datas);
        return thisData;
    }
    if (time == "may"){
        const thisData = may_data(datas);
        return thisData;
    }
    if (time == "jun"){
        const thisData = jun_data(datas);
        return thisData;
    }
    if (time == "jul"){
        const thisData = jul_data(datas);
        return thisData;
    }
}

//選擇地區
function chooseRegion(region, datas){
    if (region == "world"){
        const this_data = world_data(datas);
        return this_data;
    }
    if (region == "africa"){
        const this_data = africa_data(datas);
        return this_data;
    }
    if (region == "americas"){
        const this_data = americas_data(datas);
        return this_data;
    }
    if (region == "mediterranean"){
        const this_data = mediterranean_data(datas);
        return this_data;
    }
    if (region == "europe"){
        const this_data = europe_data(datas);
        return this_data;
    }
    if (region == "asia"){
        const this_data = asia_data(datas);
        return this_data;
    }
    if (region == "pacific"){
        const this_data = pacific_data(datas);
        return this_data;
    }
}

//取得月份
function getTime(time){
    if(time == "year"){
        return "Year"
    }
    if(time == "jan"){
        return "January"
    }
    if(time == "feb"){
        return "February"
    }
    if(time == "mar"){
        return "March"
    }
    if(time == "apr"){
        return "April"
    }
    if(time == "may"){
        return "May"
    }
    if(time == "jun"){
        return "June"
    }
    if(time == "jul"){
        return "July"
    }
}

//取得地區
function getRegion(region){
    if(region == "world"){
        return "World"
    }
    if(region == "africa"){
        return "Africa"
    }
    if(region == "americas"){
        return "Americas"
    }
    if(region == "mediterranean"){
        return "Eastern Mediterranean"
    }
    if(region == "europe"){
        return "Europe"
    }
    if(region == "asia"){
        return "South-East Asia"
    }
    if(region == "pacific"){
        return "Western Pacific"
    }
}

//篩選月份
function year_data(data){
    return data.filter(
        d => {
            return(
                d.Month >= 1 && d.Month<= 12
            );
        }
    )
}
function jan_data(data){
    return data.filter(
        d => {
            return(
                d.Month == 1
            );
        }
    )
}
function feb_data(data){
    return data.filter(
        d => {
            return(
                d.Month == 2
            );
        }
    )
}
function mar_data(data){
    return data.filter(
        d => {
            return(
                d.Month == 3
            );
        }
    )
}
function apr_data(data){
    return data.filter(
        d => {
            return(
                d.Month == 4
            );
        }
    )
}
function may_data(data){
    return data.filter(
        d => {
            return(
                d.Month == 5
            );
        }
    )
}
function jun_data(data){
    return data.filter(
        d => {
            return(
                d.Month == 6
            );
        }
    )
}
function jul_data(data){
    return data.filter(
        d => {
            return(
                d.Month == 7
            );
        }
    )
}


//篩選地區
function world_data(data){
    return data.filter(
        d => {
            return(
                d.Region != ""
            );
        }
    )
}
function africa_data(data){
    return data.filter(
        d => {
            return(
                d.Region == "Africa"
            );
        }
    )
}
function americas_data(data){
    return data.filter(
        d => {
            return(
                d.Region == "Americas"
            );
        }
    )
}
function mediterranean_data(data){
    return data.filter(
        d => {
            return(
                d.Region == "Eastern Mediterranean"
            );
        }
    )
}
function europe_data(data){
    return data.filter(
        d => {
            return(
                d.Region == "Europe"
            );
        }
    )
}
function asia_data(data){
    return data.filter(
        d => {
            return(
                d.Region == "South-East Asia"
            );
        }
    )
}
function pacific_data(data){
    return data.filter(
        d => {
            return(
                d.Region == "Western Pacific"
            );
        }
    )
}
$(".asa_btn").click(function () {
    $(".st1")
    .css("stroke-width", " 3")
    .css("stroke","#496cbf")
    .css("transform"," translate(-10px ,-10px)")
    $(".st2")
    .css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");
    $(".st3").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st4").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st5").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st6").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
});
$(".med_btn").click(function () {
    $(".st1").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st2")
    .css("stroke-width", " 3")
    .css("stroke","#496cbf")
    .css("transform"," translate(-10px ,-10px)")
    $(".st3").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st4").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st5").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st6").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
});
$(".afr_btn").click(function () {
    $(".st1").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st2").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st3")
    .css("stroke-width", " 3")
    .css("stroke","#496cbf")
    .css("transform"," translate(-10px ,-10px)")
    $(".st4").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st5").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st6").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
});
$(".pcf_btn").click(function () {
    $(".st1").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st2").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st3").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st4").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st5").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st6")
    .css("stroke-width", " 3")
    .css("stroke","#496cbf")
    .css("transform"," translate(-10px ,-10px)")
});
$(".ame_btn").click(function () {
    $(".st1").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st2").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st3").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st4").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st5")
    .css("stroke-width", " 3")
    .css("stroke","#496cbf")
    .css("transform"," translate(-10px ,-10px)")
    $(".st6").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
});
$(".eur_btn").click(function () {
    $(".st1").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st2").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st3").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st4")
    .css("stroke-width", " 3")
    .css("stroke","#496cbf")
    .css("transform"," translate(-10px ,-10px)")
    $(".st5").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
    $(".st6").css("stroke-width", " 0.2")
    .css("transform", " translate(0 ,0)");;
});
$(".wrd_btn").click(function () {
    $(".st1").css("stroke-width", " 0.2")
        .css("transform", " translate(0 ,0)");;
    $(".st2").css("stroke-width", " 0.2")
        .css("transform", " translate(0 ,0)");;
    $(".st3").css("stroke-width", " 0.2")
        .css("transform", " translate(0 ,0)");;
    $(".st4").css("stroke-width", " 0.2")
        .css("transform", " translate(0 ,0)");;
    $(".st5").css("stroke-width", " 0.2")
        .css("transform", " translate(0 ,0)");;
    $(".st6").css("stroke-width", " 0.2")
        .css("transform", " translate(0 ,0)");;
});