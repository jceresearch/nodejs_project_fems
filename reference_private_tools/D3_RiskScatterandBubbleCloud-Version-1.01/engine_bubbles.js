

var bubble_size_modes=[[6,6,0],[8,8,0],[4,20,1],[8,30,1]];
var current_bubble_size=0;
var current_label_key="";
var intervalid=[];
var current_canvas_size=0;
var canvas_size_modes=[[450,450],[600,500],[700,600],[800,600],[900,500]];
var y;
var x ;

var svg;
var svglegend;

var canvas_width_default=450;
var canvas_height_default=450;
var canvas_width=canvas_width_default;
var canvas_height=canvas_height_default;
var width;
var height;


//var rag=[];
var padding = 6;
var default_radius= bubble_size_modes[0][0];
var dataset=[];
var dataset_json=[];
var nodes=[];
var nodesoriginal=[];
var levels=[];
var force= d3.layout.force();
var serieslist=[];
var detaillist=[];
var settings=[]; //Chart definition parameters loaded from the json file, for reusability



function canvasresize()
{

   if (current_canvas_size=== canvas_size_modes.length-1)
   {current_canvas_size=0;}
   else
   {current_canvas_size++;
   	};
   
   
   canvas_width= canvas_size_modes[current_canvas_size][0];
   canvas_height=canvas_size_modes[current_canvas_size][1];
   
    d3.selectAll("#svg1").remove();
    d3.selectAll("#svg2").remove();
   drawcanvas();
    plotbackground();
    plotaxis();
      
        plotdata(dataset);
        resetselection();
        colorizebydimension("threat");
        plotlegend("threat");
  
   
};

function drawcanvas()
{
    
    var margin = {top: 10, right: 5, bottom: 20, left: 20};
    width = canvas_width - margin.left - margin.right;
    height = canvas_height-margin.top - margin.bottom;
   svg= d3.select("#chartarea").append("svg")
.attr("id","svg1")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


svglegend = d3.select("#legendarea").append("svg")
.attr("id","svg2")
    .attr("width", 300 )
    .attr("height", height);



    
};







function legendpicker(dimension_key , dimension_value)
{
    
String.prototype.toTitleCase = function() {
    var i, str, lowers, uppers;
    str = this.replace(/([^\W_]+[^\s-]*) */g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });

    // Certain minor words should be left lowercase unless 
    // they are the first or last words in the string
    lowers = ['A', 'An', 'The', 'And', 'But', 'Or', 'For', 'Nor', 'As', 'At', 
    'By', 'For', 'From', 'In', 'Into', 'Near', 'Of', 'On', 'Onto', 'To', 'With'];
    for (i = 0; i < lowers.length; i++)
        str = str.replace(new RegExp('\\s' + lowers[i] + '\\s', 'g'), 
            function(txt) {
                return txt.toLowerCase();
            });

    // Certain words such as initialisms or acronyms should be left uppercase
    uppers = ['Id', 'Tv'];
    for (i = 0; i < uppers.length; i++)
        str = str.replace(new RegExp('\\b' + uppers[i] + '\\b', 'g'), 
            uppers[i].toUpperCase());

    return str;
};

       dimension_value=dimension_value.toLowerCase();
       dimension_key= dimension_key.toLowerCase();
       
        if( typeof settings.legend[dimension_key] === 'undefined')
        {
   
           if (dimension_value.length<=3)
           {
           return dimension_value.toUpperCase();
            }else
            {
           return dimension_value.toTitleCase();     
                
            }
            
       
            
        }
            else
            {
            if (typeof settings.legend[dimension_key][dimension_value]==='undefined')
            {
                 
                
           if (dimension_value.length<=2)
           {
             return dimension_value.toUpperCase();
            }
            else
            {
             return dimension_value.toTitleCase();     
                
            }
            
            
            } 
            else
            {
            
                
               return settings.legend[dimension_key][dimension_value];
    
            }
            
        };
            
    
}





















function colorpicker(dimension_key , dimension_value)
{
    
    function toLower(a) { 
        var a_lower=[];    
        for (var i = 0; i < a.length; i++) {
            a_lower.push(a[i].toString().toLowerCase());
        };
        return a_lower;
    };

       dimension_value=dimension_value.toLowerCase();
       dimension_key= dimension_key.toLowerCase();

        if( typeof settings.colorscheme[settings.fields[dimension_key].fieldname] === 'undefined')
        {
            
           var color = d3.scale.category20();

           color.domain( toLower(serieslist[dimension_key]));
           return color(dimension_value);
            
            
       
            
        }
            else
            {
            if (typeof settings.colorscheme[settings.fields[dimension_key].fieldname][dimension_value]==='undefined')
            {
                 
                return "#000000";
            } 
            else
            {
            
            return settings.colorscheme[settings.fields[dimension_key].fieldname][dimension_value];
    
            }
            
        };
            
    
}

function plotlegend(dimension_key){

// Note that here we use a separate svg object, as we want to be able to position it separately 
// however note that there is a risk of having trouble down the line re exporting it as a bitmap, etc.
// it is fairly easy to change the code to create the legend within the main svg

legendseries= serieslist[dimension_key];    



svglegend.selectAll(".legend").remove();

 
// TOTAL

svglegend.append("text")
        .attr("x", 0)             
        .attr("y", 40)
    .attr("height", 30)
        .attr("width", 80)
      .attr("class", "legend legend_total")   
        .attr("id","total_element")
        .attr("text-anchor", "left")  
        .style("font-size", "16px") 
        .text('Total:'+ countlegenditems("","", 1) + '(Reset)')
        
.on("click", function (d) {                       
          reset_chart();
    })  ;    
          
// TOTAL SELECTED

svglegend.append("text")
        .attr("x", 0)             
        .attr("y", 60)
    .attr("height", 30)
        .attr("width", 80)
      .attr("class", "legend legend_total")   
        .attr("id","total_element_selected")
        .attr("text-anchor", "left")  
        .style("font-size", "16px") 
        .text("Total Selected:"+ countlegenditems("","",2));


// here we create the basic data binding, the object is populated with the actual unique data points
// this is a problem as we might have magnitudes eg heatmap or high number of unique values, 
//pending check if that is the case, if so  generate an abbreviated or presaved legend.

  var legend = svglegend.selectAll(".legend_element")
      .data(legendseries)
      .enter().append("g")
      .attr("class", "legend legend_element")
      .attr("transform", function(d, i) {
           d3.select("#total_element").text("Total:"+ countlegenditems());
           return "translate(0,"+( 100+ i * 22 )+ ")"; });// Here we create the groups one g per each series element, with an offset in the y coordinates


// COLORED RECTANGLES


  legend.append("rect")
      .attr("x", "2")
      .attr("id", function(d){return "r_"+dimension_key+"_"+d;})
       .attr("class", "legend legend_rect")
      .attr("width", 20)
      .attr("height", 20)
      .style("fill", function(d){return colorpicker(dimension_key,d,legendseries);
          }) // we append rectangles using the color scheme based on the array legendseries, case sensitive 
    .on("click", function (d) {
        
        d3.selectAll(".legend_rect").classed("legend_rect_selected",false);
        d3.select(this).classed("legend_rect_selected",true);
        filterbylegenditem( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2] ,3   );
       d3.select("#total_element_selected").text("Total Selected:"+ countlegenditems("","",2));
 d3.selectAll(".legend_plus").classed("legend_plus_selected",false);
 d3.selectAll(".legend_minus").classed("legend_minus_selected",false);
 d3.select("#p_"+dimension_key+"_"+d).classed("legend_plus_selected",true);
  
   d3.selectAll(".legend_count_selected").each(function(d){
       
  var n= countlegenditems( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2], 2  );
  
  d3.select(this).text (n);  });
  d3.selectAll(".legend_count").each(function(d){    
  var n=  countlegenditems( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2], 1  );
  d3.select(this).text (n);  });     
     

updatelegendbuttons();
});


// LEGEND LABEL


  legend.append("text")	
      .attr("x", "24")
       .attr("class", "legend legend_label")
      .attr("y", "10")
      .attr("dy", ".35em") // for explanation https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-svg_text
      .style("text-anchor", "start")
      .text(function(d) { 
                return legendpicker(dimension_key,d);
          });// We append the text label


//LEGEND COUNT SELECTED

  legend.append("text") 
      .attr("x", "100")
       .attr("id", function(d){
        return "s_"+dimension_key+"_"+d;})
       .attr("class", "legend legend_count_selected")
      .attr("y", "10")
      .attr("dy", ".35em") // for explanation https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-svg_text
      .style("text-anchor", "start")
      .text(function(d) { 
          var n= countlegenditems( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2],2    );
   
          return n; 
          
          }
          
          
          );// We append the text label
          
//LEGEND COUNT TOTAL CATEGORY

  legend.append("text") 
      .attr("x", "130")
       .attr("id", function(d){
        return "t_"+dimension_key+"_"+d;})
       .attr("class", "legend legend_count")
      .attr("y", "10")
      .attr("dy", ".35em") // for explanation https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-svg_text
      .style("text-anchor", "start")
      .text(function(d) { 
          var n= countlegenditems( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2],1    );
   
          return "/ "+n; 
          
          }
          
          
          ) ;// We append the text label;
          

  
  //LEGEND PLUS SIGN
  legend.append("text") 
      .attr("x", "170")
       .attr("class", "legend legend_plus")
      .attr("id", function(d){
        return "p_"+dimension_key+"_"+d;})
      .attr("y", "10")
      .attr("dy", ".35em") // for explanation https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-svg_text
      .style("text-anchor", "start")
      .text(function(d) { return "+"; })// We append the text label
      

   
      
.on("click", function (d) {
    
    filterbylegenditem( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2] , 1   );
    d3.select("#total_element_selected").text("Total Selected:"+ countlegenditems("","",2));   
    d3.selectAll(".legend_count_selected").each(function(d){
    var n=  countlegenditems( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2], 2  );
    d3.select(this).text (n);  });
    d3.selectAll(".legend_count").each(function(d){    
  var n=  countlegenditems( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2], 1  );
  d3.select(this).text (n);  });     
     

updatelegendbuttons();
});



//LEGEND MINUS SIGN




  legend.append("text") 
      .attr("x", "190")
       .attr("class", "legend legend_minus")
      .attr("id", function(d){
        return "m_"+dimension_key+"_"+d;})
      .attr("y", "10")
      .attr("dy", ".35em") // for explanation https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-svg_text
      .text(function(d) { return "-"; })// We append the text label
.on("click", function (d) {
    filterbylegenditem( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2] , 2  );
  d3.select("#total_element_selected").text("Total Selected:"+ countlegenditems("","",2));
        d3.selectAll(".legend_count_selected").each(function(d){    
  var n=  countlegenditems( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2], 2  );
  d3.select(this).text (n);  });
        d3.selectAll(".legend_count").each(function(d){    
  var n=  countlegenditems( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2], 1  );
  d3.select(this).text (n);  });     
     
     
     
updatelegendbuttons();
});


// LEGEND X
  legend.append("text")
      .attr("x", "210")
      .attr("id", function(d){return "x_"+dimension_key+"_"+d;})
       .attr("class", "legend legend_x")
   .attr("y", "10")
      .attr("dy", ".35em") // for explanation https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-svg_text
      .style("text-anchor", "start")
      .text(function(d) { return "x"; })// We append the text label
    .on("click", function (d) {
         filterbylegenditem( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2] , 4  );
        var n=  countlegenditems( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2], 2  );
        if (n==0){
           
            filterbylegenditem( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2] , 1  );
            
            
        } ;
         
         
         
         
         
         
         d3.select("#total_element_selected").text("Total Selected:"+ countlegenditems("","",2));
        d3.selectAll(".legend_count").each(function(d){    
              var n=  countlegenditems( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2], 1  );
              d3.select(this).text (n);  });     
         d3.selectAll(".legend_count_selected").each(function(d){     
          var n=  countlegenditems( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2], 2  );
          d3.select(this).text (n);  });
                     
        updatelegendbuttons();
});



updatelegendbuttons();

 
};



function reset_chart()
{

    d3.selectAll(".legend_rect").classed("legend_rect_selected",false);
    d3.selectAll(".legend_plus").classed("legend_plus_selected",false);
    d3.selectAll(".legend_minus").classed("legend_minus_selected",false);
   resetselection();
   updatelegendbuttons();


};

function updatelegendbuttons(){
    
    
d3.selectAll(".legend_plus").classed("legend_plus_selected",false);
d3.selectAll(".legend_minus").classed("legend_minus_selected",false);
d3.selectAll(".legend_x").classed("legend_x_selected",false);

d3.selectAll(".legend_plus").each(function(d){
       
      var legendcount=  countlegenditems( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2], 2  );
      if (legendcount>0){  
          
      d3.select(this).classed("legend_plus_selected" , true);
      
      
         }
          
            });
          

d3.selectAll(".legend_minus").each(function(d){
       
      var legendcount=  countlegenditems( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2], 2  );
      if (legendcount==0){  

      d3.select(this).classed("legend_minus_selected" , true);
      d3.select("#p_"+d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2]).classed("legend_plus_selected",false);
      d3.select("#x_"+d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2]).classed("legend_x_selected",false);
         }
         
         
          
            });
          
      
d3.selectAll(".legend_x").each(function(d){
       
      var oortxcount=  countlegenditems( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2], 3  );
      var legendcount=  countlegenditems( d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2], 2  );
      if (oortxcount>0 && legendcount>0 ){  
          
          
                  
      d3.select(this).classed("legend_x_selected" , true);
      d3.select("#p_"+d3.select(this).attr("id").split("_")[1],d3.select(this).attr("id").split("_")[2]).classed("legend_plus_selected",false);
      
         }
         
         
          
            });          

    
}


function resetselection(){
    svg.selectAll(".dot").classed("unselected",false).classed("selected",true).classed("unselectedx",false).classed("dot_selected",false).classed("dot_unselected",true);
     d3.select("#total_element").text("Total:"+ countlegenditems());
     d3.select("#total_element_selected").text("Total Selected:"+ countlegenditems("","",2));
     
       sendtoOort();
};







function countlegenditems(dimension_key,legend_item, countfilter)
{
 //1 = we count all dots
 //2= we count just selected
 //3= we count oortx ie elements that are excluded, but some of the same categories are in the selection 

var n=0; 
var search_class;
countfilter = countfilter || 1; //default behaviour is taking ALL selected or not
dimension_key = dimension_key || -1;
legend_item = legend_item || "";
if (dimension_key==""){dimension_key=-1;};




if (countfilter==1) 
{
    search_class=".dot";
};




if (countfilter==2) 
{
    
    search_class=".selected";
    
    
}

if (countfilter==3) 
{
    search_class=".unselectedx";
     };
    
    
    
    
if ( dimension_key==-1)
{    
    d3.selectAll(search_class).each(function(d){n++;});

}
else
{

d3.selectAll(search_class).each(function(d){
     if (d[settings.fields[dimension_key].fieldname] == legend_item){      n++;       };
  });
};
return n;
    
}


function filterbylegenditem(dimension_key, legend_item, actioncode){
// actioncode=1 we bring ALL of that category in
// actioncode=2 we remove ALL of that category to oort
// actioncode=3 we bring ALL of that category in, but we send out all the rest
// actioncode=4 we send out all the rest we dont bring the ones that are in the category but out before 

if (typeof actioncode ==='undefined'){
    actioncode=3;};
    
    
if (actioncode===3){        
    svg.selectAll(".dot").filter(function (d){
        return d[settings.fields[dimension_key].fieldname] != legend_item;   
    }).classed("unselected",true).classed("selected",false);
    svg.selectAll(".dot").filter(function (d){
        return d[settings.fields[dimension_key].fieldname] == legend_item;   
    }).classed("unselected",false).classed("selected",true);  
    
    svg.selectAll(".dot").filter(function (d){
        return d[settings.fields[dimension_key].fieldname] == legend_item;   
    }).classed("unselectedx",false);

};
if (actioncode===4){
    
    svg.selectAll(".unselected").filter(function (d){
        return d[settings.fields[dimension_key].fieldname] == legend_item;   
    }).classed("unselectedx",true);
    
    
    svg.selectAll(".selected").filter(function (d){
        return d[settings.fields[dimension_key].fieldname] != legend_item;   
    }).classed("unselected",true).classed("selected",false);
};



    if (actioncode === 1){
        
        
            svg.selectAll(".unselected").filter(function (d){
        return d[settings.fields[dimension_key].fieldname] == legend_item;   
    }).classed("unselectedx",false);
    
    svg.selectAll(".dot").filter(function (d){
        return d[settings.fields[dimension_key].fieldname] == legend_item;   
    }).classed("unselected",false).classed("selected",true);         
        
        
            svg.selectAll(".dot").filter(function (d){
        return d[settings.fields[dimension_key].fieldname] == legend_item;   
    }).classed("unselectedx",false);
        
        
    } ;
    
    
    
    
    if (actioncode===2)
    {
        
 
    d3.selectAll(".dot").filter(function (d){
  
      svg.selectAll(".unselected").filter(function (d){
        return d[settings.fields[dimension_key].fieldname] == legend_item;   
    }).classed("unselectedx",false);
   
   
        return d[settings.fields[dimension_key].fieldname] == legend_item;   
        
    }).classed("unselected",true).classed("selected",false);  
    
  
    
    
};

   sendtoOort();
};

function sendtoOort(){
        
             force.stop();  
             force.gravity(0)
            .charge(-.2)
            .friction(.7)
            .on("tick",tickconverge);
        
            

            var clusterfocusscale = d3.scale.linear().domain([0,nodes.length]).range([1,360]);
            
            svg.selectAll(".unselected").each(function(d,i){

            nodes[d.id]["clusterfocusx"]= width/2 + 2000  * Math.cos(clusterfocusscale(i) * (Math.PI / 180));
            nodes[d.id]["clusterfocusy"]= height/2 + 2000 * Math.sin(clusterfocusscale(i) * (Math.PI / 180));


        });
        
            svg.selectAll(".selected").each(function(d,i){
            nodes[d.id]["clusterfocusx"]= nodes[d.id]["clusterfocusxactive"];
            nodes[d.id]["clusterfocusy"]=  nodes[d.id]["clusterfocusyactive"];


        });     
        
        
        

	force.resume();

};

function displaybubbleinfo(nodedata){
    

   
var commenttext= "Ref:"+ nodedata.ref +"<br>Owner: "+ nodedata.owner + "<br>Title:"+nodedata.title + "<br>Description:"+  nodedata.description +"<br>Impact:"+ nodedata.impact+ "<br>Likelihood:"+ nodedata.likelihood;

document.getElementById('comments').innerHTML = commenttext;

    
};

function clearbubbleinfo(){
    

document.getElementById('comments').innerHTML = "";
 
    
};


function plotbackground(){
    
 var imgs = svg.selectAll("image").data([0]);
                imgs.enter()
                .append("svg:image")
                .attr("xlink:href", "background.png")
                .attr("x", "0")
                .attr("y", "0")
                .attr("preserveAspectRatio", "none")
                .attr("width", width)
                .attr("height", height);
        
};



function plotaxis(){
 
 

x = d3.scale.linear()
    .rangeRound([0, width]);
  x.domain([0,5.5]).nice();



y = d3.scale.linear()
    .rangeRound([height, 0]);
  y.domain([0,5.5]).nice();
  
      


 var xAxis = d3.svg.axis()
    .scale(x)
    .tickValues([0,1,2,3,4,5])
    .tickFormat(d3.format("0f"))
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .tickValues([0,1,2,3,4,5])
    .tickFormat(d3.format("0f"))
    .orient("left");
    
  x = d3.scale.linear()
    .rangeRound([0, width]);
  x.domain([0,5.5]).nice();

 y = d3.scale.linear()
    .rangeRound([height, 0]);
  y.domain([0,5.5]).nice();
  svg.append("g")
      .attr("class", "xaxis axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "axis label")
      .attr("x", width-6)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("Likelihood");

  svg.append("g")
      .attr("class", "yaxis axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("x", -6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Impact");


};

function plotdata(dataset){

nodes=[];
nodesoriginal=[];


dataset.forEach(function(d){
var node = {
y:y(d[settings.dimensiony[0]]),
yori:y(d[settings.dimensiony[0]]),
clusterfocusy:y(d[settings.dimensiony[0]]),
clusterfocusyori:y(d[settings.dimensiony[0]]),
clusterfocusyactive:y(d[settings.dimensiony[0]]),
x:x(d[settings.dimensionx[0]]),
xori:x(d[settings.dimensionx[0]]),
clusterfocusx:x(d[settings.dimensionx[0]]),
clusterfocusxori:x(d[settings.dimensionx[0]]),
clusterfocusxactive:x(d[settings.dimensionx[0]]),
label:d.label,
ref:d.ref,
weight:1,
radius:default_radius,
id:d.id,
description:d.description,

}; 


 for(var key in settings.fields)
    {

        if (settings.fields[key].isMagnitude===false)
        {

             node[settings.fields[key].fieldname]= d[settings.fields[key].fieldname];
  } else
  {
      
       node[settings.fields[key].fieldname]= +d[settings.fields[key].fieldname];
      
  }
             
  };    


nodes.push(node);
nodesoriginal.push(node);
}); 



svg.selectAll(".dot")
                .data(nodes)
                .enter().append("circle")
  .attr("class",function(d){return "dot";}) // we could add here more custom classes based on the data
        .attr("id", function(d) {return d.id;})
      .attr("cy", function(d) { return d.x; })
      .attr("cx", function(d) { return d.y; })    
      .attr("r", function(d) { return d.radius; })
      .call(force.drag);


svg.selectAll("circle").on("click", function (d) {
               
              
                if ( d3.select(this).classed("dot_selected"))
                {
                    
                d3.select(this).classed("dot_unselected",true); 
                d3.select(this).classed("dot_selected",false);
                clearbubbleinfo();
              
                }
                else
                {
                d3.selectAll(".dot").classed("dot_selected",false);                    
                d3.selectAll(".dot").classed("dot_unselected",true);
                d3.select(this).classed("dot_unselected",false); 
                d3.select(this).classed("dot_selected",true); 
                displaybubbleinfo(d);
            }
});
 

        
 force.gravity(0)
            .charge(0.5)
            .friction(.5)
            .nodes(nodes)
            .size([width,height])
            .on("tick",tickfloat);

force.start();
}

function togglelabels(){


if (d3.select(".dotlabel").empty())
{
	plotlabel();


} else

{

d3.selectAll(".dotlabel").remove();


};
};


function plotlabel(field_key){
    
    
var dotlabels=d3.selectAll(".dotlabel");


if (dotlabels.empty())
{
   
   if (typeof field_key ==='undefined'){
        field_key= settings.labelfields[0];
        }
    current_label_key=field_key;
    svg.append("g").selectAll(".dotlabel")
        .data(nodes)
        .enter().append("text")
        .attr("class", "dotlabel")
        .attr("id", function(d) { return d.id;})
        .text(function(d){return d[field_key];});
        force.start();
 }
 else
 {
        
        
  if (typeof field_key ==='undefined'){      
       n= settings.labelfields.indexOf(current_label_key);
       if (n==settings.labelfields.length-1){
           
            field_key= settings.labelfields[0];
        
        }
        else{
            field_key= settings.labelfields[n+1];
        }
        
            
            
    };
  
  current_label_key=field_key;      
  dotlabels.each(function(d){
      
  
      
  d3.select(this).text(legendpicker(field_key,d[field_key]));
      
       
      
      
  });
            
        
        
        
        
    } ;
      
    
};


function colorizebydimension(dimension_key){

if (typeof dimension_key==='undefined')
{
    
svg.selectAll(".dot").style("fill", function(d) { return "#0000FF"; });
svglegend.selectAll(".legend").remove();
    
}
else{
plotlegend(dimension_key);    
svg.selectAll("circle").style("fill", function(d) { return colorpicker(dimension_key,d[settings.fields[dimension_key].fieldname]); });
}

};






function togglesize(set_bubble_size){

var bubblesize; //d3 scale object, it will change depending on the size mode
if (typeof set_bubble_size === 'undefined'){
	
	
if (current_bubble_size >= (bubble_size_modes.length-1)) 
{
	current_bubble_size=0;
}else
{
	current_bubble_size++;
	};

}
else
{
	current_bubble_size= set_bubble_size;
	
};
	

var range_low=bubble_size_modes[current_bubble_size][0];
var range_top=bubble_size_modes[current_bubble_size][1];


if (bubble_size_modes[current_bubble_size][2]==0)
{
//Linear size scale
bubblesize= d3.scale.linear().domain([1,25]).range([range_low,range_top]);

}
else
{
//Power size scale
bubblesize= d3.scale.pow().domain([1,25]).range([range_low,range_top]);

	
};


svg.selectAll(".dot").attr("r", function(d,i) { 
    
    	nodes[d.id]["radius"]=bubblesize(d.impact*d.likelihood);
    	return bubblesize(d.impact*d.likelihood); 
    	});
     
force.resume();
	

};
    
    
    
    


function arrangebigblobbydimension(dimension_key){
  
          
          clearInterval(intervalid);
          force.stop();
          
          colorizebydimension(dimension_key);

var dimension_values= serieslist[dimension_key]; 
           
           
           
        var clusterfocusscale = d3.scale.ordinal().domain(dimension_values).rangeBands([1,360]);
        svg.selectAll("image").attr("visibility","hidden");
        svg.selectAll(".axis").attr("visibility","hidden");
        svg.selectAll(".clusterlabel").remove();
        force.stop();       
        
         dotcount=countlegenditems();
        force.gravity(0)
            .charge(1)
            .friction(0)
            .nodes(nodes)
            .size([width,height])
            .on("tick",tickconverge);
            
            
            
	    var nstartingdistance=3000;
        var ncurrentdistance=3000;    
        intervalid=window.setInterval(bigblobconverge,200 );  
        function bigblobconverge(){
        if (ncurrentdistance> dotcount*.3) 
        {
            ncurrentdistance-=ncurrentdistance*.3;
            
            
            force.gravity(0.02).charge(.5).friction(0.2);            
                    
        svg.selectAll(".selected").each(function(d){
            
            nodes[d.id]["clusterfocusx"]= width/2 + ncurrentdistance  * Math.cos(clusterfocusscale(d[dimension_key]) * (Math.PI / 180)),
            nodes[d.id]["clusterfocusy"]= height/2 + ncurrentdistance * Math.sin(clusterfocusscale(d[dimension_key]) * (Math.PI / 180));
            nodes[d.id]["clusterfocusxactive"]= nodes[d.id]["clusterfocusx"];
            nodes[d.id]["clusterfocusyactive"]= nodes[d.id]["clusterfocusy"];

          });
          
        svg.selectAll(".unselected").each(function(d){
            
            nodes[d.id]["clusterfocusxactive"]= width/2 + ncurrentdistance  * Math.cos(clusterfocusscale(d[dimension_key]) * (Math.PI / 180)),
            nodes[d.id]["clusterfocusyactive"]= height/2 + ncurrentdistance * Math.sin(clusterfocusscale(d[dimension_key]) * (Math.PI / 180));

          });
                    
          
          
            force.resume();
       
            
      };
            
                       

};

};






function arrangeblobsbydimension(dimension_key){
    
 clearInterval(intervalid);
 force.stop();  
          
//colorizebydimension(dimension_key);

var dimension_values= serieslist[dimension_key];

var clusterfocusscale = d3.scale.ordinal().domain(dimension_values).rangeBands([0, width], 1);

var clusterfocusscaleexpanded = d3.scale.ordinal().domain(dimension_values).rangeBands([1,width*12]);

svg.selectAll("image").attr("visibility","hidden");
svg.selectAll(".axis").attr("visibility","hidden");

 svg.selectAll(".clusterlabel").remove();
 
    dotcount=countlegenditems();
  
 var label = svg.selectAll(".clusterlabel")
      .data(dimension_values)
      .enter().append("g");
      
 label.append("text")
    .attr("y", height*.90)
      .attr("x", function(d) { return clusterfocusscale(d) -  .2*( width/dimension_values.length);})
      .attr("class", "clusterlabel")
      .text(function(d) { return legendpicker(dimension_key,d); });
  
     
force.stop();
force.nodes(nodes)
    .size([width,height])
    .on("tick",tickconverge);
    
    
      var nstartingdistance=3000;
        var ncurrentdistance=3000;  

        var intervalid=window.setInterval(converge,200 )   ;       
        
        function converge(){
        if (ncurrentdistance>5) 
        {        
        svg.selectAll(".selected").each(function(d){
                    
             if (ncurrentdistance>500){
      
            nodes[d.id]["clusterfocusx"]= clusterfocusscale(d[dimension_key])+ (clusterfocusscaleexpanded(d[dimension_key])-clusterfocusscale(d[dimension_key]))*ncurrentdistance/nstartingdistance;
            nodes[d.id]["clusterfocusy"]=  height/2;
            nodes[d.id]["clusterfocusxactive"]= nodes[d.id]["clusterfocusx"];
            nodes[d.id]["clusterfocusyactive"]=  nodes[d.id]["clusterfocusy"];
            force.gravity(0)
            .charge(-1)
            .friction(.7);
            force.resume();    
        
        }
        else
        {
            
            nodes[d.id]["clusterfocusx"]= clusterfocusscale(d[dimension_key]);
            nodes[d.id]["clusterfocusy"]=  height/2;
            nodes[d.id]["clusterfocusxactive"]= nodes[d.id]["clusterfocusx"];
            nodes[d.id]["clusterfocusyactive"]=  nodes[d.id]["clusterfocusy"];
            force.gravity(0)
            .charge(.2)
            .friction(.2);
            force.resume();
        };
        });
  
            ncurrentdistance-=ncurrentdistance*.4;          
    
             
        } 
        else 
        {
            clearInterval(intervalid);
        }
                       

        };


// we set also the target focus of the unselected ones in the Oort cloud so if they are activated afterwards by the user 
// they go to the right focus point in the current graph
   svg.selectAll(".unselected").each(function(d){
            
            nodes[d.id]["clusterfocusxactive"]= clusterfocusscale(d[dimension_key]);
            nodes[d.id]["clusterfocusyactive"]=  height/2;

});

};






function arrangeriskmap (){
    
 clearInterval(intervalid);
 force.stop();
          
setCookie("current_view","1");

togglesize(1);


svg.selectAll("image").attr("visibility","visible");
svg.selectAll(".axis").attr("visibility","visible");

svg.selectAll(".clusterlabel").remove();
       force.stop();
        
        force.gravity(0)
            .charge(0)
            .friction(0.7)
            .nodes(nodes)
            .size([width,height])
            .on("tick",tickconverge);
        
                    
        svg.selectAll(".selected").each(function(d){

            
            nodes[d.id]["clusterfocusx"]= x(d.likelihood);
            nodes[d.id]["clusterfocusy"]= y(d.impact);
            nodes[d.id]["clusterfocusxactive"]=  x(d.likelihood);
            nodes[d.id]["clusterfocusyactive"]=  y(d.impact);
           
          });
            
        svg.selectAll(".unselected").each(function(d){

            
            nodes[d.id]["clusterfocusxactive"]= x(d.likelihood);
            nodes[d.id]["clusterfocusyactive"]= y(d.impact);

          });            
            
            
            
            
          force.resume();
            
            
            

};


function tickfloat(e){
//Variant of the tick function that just leaves the nodes floating. It is currently not used
//  but a future feature of the engine could use it

svg.selectAll("circle")
      .each(collide(.5))
      .attr("cx", function(d,i) { return d.x; })
      .attr("cy", function(d,i) { return d.y; });
      
svg.selectAll(".dotlabel")
      .attr("x", function(d,i) { return  d.x; })
      .attr("y", function(d,i) { return d.radius +d.y+10; });
   
};




function tickconverge(e){
// This is the main routine that makes the bubbles converge to multiple foci (plural of focus)
//it also drags with it the labels, but note that the labels are just being moved, no colission
//detection is happening for them.

svg.selectAll(".dot")
      .each(gravity(.2 * e.alpha))
      .each(collide(.2))
      .attr("cx", function(d,i) { return d.x; })
      .attr("cy", function(d,i) { return d.y; });
      
svg.selectAll(".dotlabel")
      .attr("x", function(d,i) { return -d.radius + d.x; })
      .attr("y", function(d,i) { return d.radius +d.y +10; });
   
};


// Move nodes toward cluster focus.
function gravity(alpha) {
  return function(d) {
    d.y += (d.clusterfocusy - d.y) * alpha;
    d.x += (d.clusterfocusx - d.x) * alpha;
  };
};



// Resolve collisions between nodes.
function collide(alpha) {
  var quadtree = d3.geom.quadtree(nodes);
  return function(d) {
    var r = d.radius + padding,
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + quad.point.radius + (d.color !== quad.point.color) * padding;
        if (l < r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2
          || x2 < nx1
          || y1 > ny2
          || y2 < ny1;
    });
  };
}



