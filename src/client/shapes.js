// https://bl.ocks.org/Thanaporn-sk/c7f74cb5051a0cdf6cf077a9db332dfb

// disable spelling
// cspell:disable
// this is a hack, apparently the correct way is to bundle d3 with webpack or parcel
//const d3 = window.d3

import * as d3 from "https://cdn.skypack.dev/d3@7";
//load data from the server

var data = await d3.json("/api/v1/apps/json");

var saveAs =
  saveAs ||
  (function (view) {
    "use strict";
    // IE <10 is explicitly unsupported
    if (
      typeof navigator !== "undefined" &&
      /MSIE [1-9]\./.test(navigator.userAgent)
    ) {
      return;
    }
    var doc = view.document,
      // only get URL when necessary in case Blob.js hasn't overridden it yet
      get_URL = function () {
        return view.URL || view.webkitURL || view;
      },
      save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"),
      can_use_save_link = "download" in save_link,
      click = function (node) {
        var event = new MouseEvent("click");
        node.dispatchEvent(event);
      },
      is_safari = /Version\/[\d\.]+.*Safari/.test(navigator.userAgent),
      webkit_req_fs = view.webkitRequestFileSystem,
      req_fs =
        view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem,
      throw_outside = function (ex) {
        (view.setImmediate || view.setTimeout)(function () {
          throw ex;
        }, 0);
      },
      force_saveable_type = "application/octet-stream",
      fs_min_size = 0,
      // the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
      arbitrary_revoke_timeout = 1000 * 40, // in ms
      revoke = function (file) {
        var revoker = function () {
          if (typeof file === "string") {
            // file is an object URL
            get_URL().revokeObjectURL(file);
          } else {
            // file is a File
            file.remove();
          }
        };
        /* // Take note W3C:
			var
			  uri = typeof file === "string" ? file : file.toURL()
			, revoker = function(evt) {
				// idealy DownloadFinishedEvent.data would be the URL requested
				if (evt.data === uri) {
					if (typeof file === "string") { // file is an object URL
						get_URL().revokeObjectURL(file);
					} else { // file is a File
						file.remove();
					}
				}
			}
			;
			view.addEventListener("downloadfinished", revoker);
			*/
        setTimeout(revoker, arbitrary_revoke_timeout);
      },
      dispatch = function (filesaver, event_types, event) {
        event_types = [].concat(event_types);
        var i = event_types.length;
        while (i--) {
          var listener = filesaver["on" + event_types[i]];
          if (typeof listener === "function") {
            try {
              listener.call(filesaver, event || filesaver);
            } catch (ex) {
              throw_outside(ex);
            }
          }
        }
      },
      auto_bom = function (blob) {
        // prepend BOM for UTF-8 XML and text/* types (including HTML)
        // note: your browser will automatically convert UTF-16 \uFEFF to EF BB BF
        if (
          /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(
            blob.type,
          )
        ) {
          return new Blob(["\uFEFF", blob], { type: blob.type });
        }
        return blob;
      },
      FileSaver = function (blob, name, no_auto_bom) {
        if (!no_auto_bom) {
          blob = auto_bom(blob);
        }
        // First try a.download, then web filesystem, then object URLs
        var filesaver = this,
          type = blob.type,
          blob_changed = false,
          object_url,
          target_view,
          dispatch_all = function () {
            dispatch(
              filesaver,
              "writestart progress write writeend".split(" "),
            );
          },
          // on any filesys errors revert to saving with object URLs
          fs_error = function () {
            if (target_view && is_safari && typeof FileReader !== "undefined") {
              // Safari doesn't allow downloading of blob urls
              var reader = new FileReader();
              reader.onloadend = function () {
                var base64Data = reader.result;
                target_view.location.href =
                  "data:attachment/file" +
                  base64Data.slice(base64Data.search(/[,;]/));
                filesaver.readyState = filesaver.DONE;
                dispatch_all();
              };
              reader.readAsDataURL(blob);
              filesaver.readyState = filesaver.INIT;
              return;
            }
            // don't create more object URLs than needed
            if (blob_changed || !object_url) {
              object_url = get_URL().createObjectURL(blob);
            }
            if (target_view) {
              target_view.location.href = object_url;
            } else {
              var new_tab = view.open(object_url, "_blank");
              if (new_tab === undefined && is_safari) {
                // Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
                view.location.href = object_url;
              }
            }
            filesaver.readyState = filesaver.DONE;
            dispatch_all();
            revoke(object_url);
          },
          abortable = function (func) {
            return function () {
              if (filesaver.readyState !== filesaver.DONE) {
                return func.apply(this, arguments);
              }
            };
          },
          create_if_not_found = { create: true, exclusive: false },
          slice;
        filesaver.readyState = filesaver.INIT;
        if (!name) {
          name = "download";
        }
        if (can_use_save_link) {
          object_url = get_URL().createObjectURL(blob);
          setTimeout(function () {
            save_link.href = object_url;
            save_link.download = name;
            click(save_link);
            dispatch_all();
            revoke(object_url);
            filesaver.readyState = filesaver.DONE;
          });
          return;
        }
        // Object and web filesystem URLs have a problem saving in Google Chrome when
        // viewed in a tab, so I force save with application/octet-stream
        // http://code.google.com/p/chromium/issues/detail?id=91158
        // Update: Google errantly closed 91158, I submitted it again:
        // https://code.google.com/p/chromium/issues/detail?id=389642
        if (view.chrome && type && type !== force_saveable_type) {
          slice = blob.slice || blob.webkitSlice;
          blob = slice.call(blob, 0, blob.size, force_saveable_type);
          blob_changed = true;
        }
        // Since I can't be sure that the guessed media type will trigger a download
        // in WebKit, I append .download to the filename.
        // https://bugs.webkit.org/show_bug.cgi?id=65440
        if (webkit_req_fs && name !== "download") {
          name += ".download";
        }
        if (type === force_saveable_type || webkit_req_fs) {
          target_view = view;
        }
        if (!req_fs) {
          fs_error();
          return;
        }
        fs_min_size += blob.size;
        req_fs(
          view.TEMPORARY,
          fs_min_size,
          abortable(function (fs) {
            fs.root.getDirectory(
              "saved",
              create_if_not_found,
              abortable(function (dir) {
                var save = function () {
                  dir.getFile(
                    name,
                    create_if_not_found,
                    abortable(function (file) {
                      file.createWriter(
                        abortable(function (writer) {
                          writer.onwriteend = function (event) {
                            target_view.location.href = file.toURL();
                            filesaver.readyState = filesaver.DONE;
                            dispatch(filesaver, "writeend", event);
                            revoke(file);
                          };
                          writer.onerror = function () {
                            var error = writer.error;
                            if (error.code !== error.ABORT_ERR) {
                              fs_error();
                            }
                          };
                          "writestart progress write abort"
                            .split(" ")
                            .forEach(function (event) {
                              writer["on" + event] = filesaver["on" + event];
                            });
                          writer.write(blob);
                          filesaver.abort = function () {
                            writer.abort();
                            filesaver.readyState = filesaver.DONE;
                          };
                          filesaver.readyState = filesaver.WRITING;
                        }),
                        fs_error,
                      );
                    }),
                    fs_error,
                  );
                };
                dir.getFile(
                  name,
                  { create: false },
                  abortable(function (file) {
                    // delete file if it already exists
                    file.remove();
                    save();
                  }),
                  abortable(function (ex) {
                    if (ex.code === ex.NOT_FOUND_ERR) {
                      save();
                    } else {
                      fs_error();
                    }
                  }),
                );
              }),
              fs_error,
            );
          }),
          fs_error,
        );
      },
      FS_proto = FileSaver.prototype,
      saveAs = function (blob, name, no_auto_bom) {
        return new FileSaver(blob, name, no_auto_bom);
      };
    // IE 10+ (native saveAs)
    if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
      return function (blob, name, no_auto_bom) {
        if (!no_auto_bom) {
          blob = auto_bom(blob);
        }
        return navigator.msSaveOrOpenBlob(blob, name || "download");
      };
    }

    FS_proto.abort = function () {
      var filesaver = this;
      filesaver.readyState = filesaver.DONE;
      dispatch(filesaver, "abort");
    };
    FS_proto.readyState = FS_proto.INIT = 0;
    FS_proto.WRITING = 1;
    FS_proto.DONE = 2;

    FS_proto.error =
      FS_proto.onwritestart =
      FS_proto.onprogress =
      FS_proto.onwrite =
      FS_proto.onabort =
      FS_proto.onerror =
      FS_proto.onwriteend =
        null;

    return saveAs;
  })(
    (typeof self !== "undefined" && self) ||
      (typeof window !== "undefined" && window) ||
      this.content,
  );
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if (
  typeof define !== "undefined" &&
  define !== null &&
  define.amd !== null
) {
  define([], function () {
    return saveAs;
  });
}

function saveSvgAsPng(svgElement, filename) {
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  var data = new XMLSerializer().serializeToString(svgElement);
  var svg = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
  var url = URL.createObjectURL(svg);

  var img = new Image();
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    canvas.toBlob(function (blob) {
      saveAs(blob, filename);
    });
  };

  img.src = url;
}

var width = 1200;
var height = 800;
var padding = 15; // separation between same-color nodes
var clusterPadding = 30; //separation between clusters
var minRadius = 20; //minimum radius of a node before the label is hidden
var alpha_decay = 0.02;
var velocity_decay = 0.3;
var strength = 0.005;

var current_cluster_size = 0;
var data_field_names = [
  "app_id",
  "application_name",
  "criticality",
  "department",
  "user_count_max",
  "users_size",
  "criticality_rag",
  "itt_link",
  "its_link",
  "service_type_its",
  "application_owner_lkp",
]; //field list from data
var node_field_names = [
  "app_id",
  "text",
  "criticality",
  "group",
  "users",
  "size",
  "rag",
  "itt_link",
  "its_link",
  "saas",
  "owner",
]; //translation for the nodes should we need to
var node_field_labels = [
  "App ID",
  "Application Name",
  "Criticality",
  "Department",
  "Users",
  "Size",
  "Criticality RAG",
  "ITT Link",
  "ITS Link",
  "SAAS",
  "Owner",
]; //nicer looking labels
var node_field_tooltip = [
  "app_id",
  "text",
  "group",
  "criticality",
  "owner",
  "group",
  "saas",
];
var node_field_tooltip_label = [
  "App ID",
  "Application Name",
  "Department",
  "Criticality",
  "Owner",
  "Department",
  "Application Type",
];

var node_fields_table = [
  "app_id",
  "text",
  "group",
  "criticality",
  "owner",
  "group",
  "saas",
  "users",
];
var node_fields_table_labels = [
  "App ID",
  "Application Name",
  "Department",
  "Criticality",
  "Owner",
  "Department",
  "Application Type",
  "Users",
];

var colour_field = "group"; //Initial colouring field
var clustering_field = "group"; //Initial grouping/clustering field

document
  .querySelector("#changeColourRag")
  .addEventListener("click", function () {
    changeColour("rag");
  });

document
  .querySelector("#changeColourGroup")
  .addEventListener("click", function () {
    changeColour("group");
  });

document
  .querySelector("#changeColourSAAS")
  .addEventListener("click", function () {
    changeColour("saas");
  });
document
  .querySelector("#changeColourOwner")
  .addEventListener("click", function () {
    changeColour("owner");
  });
document
  .querySelector("#changeGroupingRag")
  .addEventListener("click", function () {
    changeGrouping("rag");
  });

document
  .querySelector("#changeGroupingGroup")
  .addEventListener("click", function () {
    changeGrouping("group");
  });
document
  .querySelector("#changeGroupingSAAS")
  .addEventListener("click", function () {
    changeGrouping("saas");
  });

document
  .querySelector("#changeGroupingOwner")
  .addEventListener("click", function () {
    changeGrouping("owner");
  });

document
  .querySelector("#clearSelectionButton")
  .addEventListener("click", clearSelection);

d3.select("#saveButton").on("click", function () {
  var svgElement = document.querySelector("svg");
  saveSvgAsPng(svgElement, "image.png");
});

function clearSelection() {
  gnodes.each(function (d) {
    d.selected_node = false;
    d3.select(this).select("circle").style("stroke-width", 1);
  });
  div_detail_area.html("");
}

function createNodes(data) {
  let nodeArray = [];
  let n = data.length; // count of nodes
  let m = data_field_names.length; //count  of fields to import into the nodes
  console.log("Debug: Creating nodes: " + n + " with fields: " + m);
  for (var i = 0; i < n; i++) {
    var d = [];
    for (var j = 0; j < n; j++) {
      d[node_field_names[j]] = data[i][data_field_names[j]];
    }
    d.r = d.size;
    d.rag = 5 - d.rag;

    d.curr_colour = "";
    d.selected_node = false;
    nodeArray.push(d);
  }
  return nodeArray;
}

// creates the tooltip from the specific fields defined in node_field_tooltip
function generate_html_tooltip(d) {
  let t = "Details:";
  var n = node_field_tooltip.length;
  for (var i = 0; i < n; i++) {
    t =
      t +
      "<br/>" +
      node_field_tooltip_label[i] +
      ": " +
      d[node_field_tooltip[i]];
  }
  return t;
}

// colour scheme will be a collection of objects, with a default one and custom ones
// create the custom ones below, ie for a specific RAG etc, associated to a hard coded
// input field in the data. Otherwise the default color scheme will be used
var colour_scheme = new Object();
colour_scheme["rag"] = d3
  .scaleOrdinal()
  .domain([1, 2, 3, 4])
  .range(["#7ac943", "#FEE350", "#FEB500", "#f21c23"]);

function recalculate_clusters(nodes, clustering_field) {
  let cl = []; //array, internal variable
  let n = nodes.length; // total number of nodes
  let result = nodes.map((a) => a[clustering_field]);
  const unique = (value, index, self) => {
    return self.indexOf(value) === index;
  };
  var clusterunique = result.filter(unique);
  current_cluster_size = clusterunique.length; //we update a global variable so that the colour scheme can workout the ranges
  for (var i = 0; i < n; i++) {
    let cid = clusterunique.indexOf(nodes[i][clustering_field]);
    nodes[i].cluster = cid; //we add the cluster id
    if (!cl[cid] || nodes[i].r > cl[cid].r) {
      cl[cid] = nodes[i];
    }
  }
  if (colour_scheme[clustering_field] == null) {
    if (current_cluster_size > 12) {
      colour_scheme[clustering_field] = function (v) {
        let t = d3
          .hsl((clusterunique.indexOf(v) / current_cluster_size) * 360, 1, 0.5)
          .toString();
        return t;
      };
    } else {
      colour_scheme[clustering_field] = d3
        .scaleOrdinal(d3.schemePaired)
        .domain(d3.range(current_cluster_size));
    }
  }
  return cl;
}

function update_legend() {
  //find the label for the colour field  based on the node_field_name to node_field_labels mapping
  var legend_colour = node_field_labels[node_field_names.indexOf(colour_field)];
  var legend_grouping =
    node_field_labels[node_field_names.indexOf(clustering_field)];
  legend.html(
    "Colouring by: " +
      legend_colour +
      "<br/>" +
      "Grouping by: " +
      legend_grouping,
  );
}

// These are the functions that will be called when the user clicks on the buttons with different dimensions to group/colour by

function changeColour(dimension) {
  console.log("Debug: Changing colour to: " + dimension);
  //if there is no colour_scheme then we do the default
  if (colour_scheme[dimension] == null) {
    colour_scheme[dimension] = d3.scaleOrdinal(d3.schemeCategory10);
  }
  gnodes.selectAll("circle").attr("fill", function (d) {
    d.curr_colour = colour_scheme[dimension](d[dimension]);
    return d.curr_colour;
  });
  colour_field = dimension;
  update_legend();
}

function changeGrouping(dimension) {
  update_legend();
  clusters = recalculate_clusters(nodes, dimension);
  simulation.alpha(0.9).restart();
  simulation.alphaTarget(0);
  clustering_field = dimension;
}

// This is standard activity when the simulation is on
function ticked() {
  gnodes.attr("transform", function (d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
}
// These are implementations of the custom forces.
function clustering(alpha) {
  nodes.forEach(function (d) {
    let cluster = clusters[d.cluster];
    if (cluster === d) return;
    var x = d.x - cluster.x,
      y = d.y - cluster.y,
      l = Math.sqrt(x * x + y * y),
      r = d.r + cluster.r;
    if (l !== r) {
      l = ((l - r) / l) * alpha;
      d.x -= x *= l;
      d.y -= y *= l;
      cluster.x += x;
      cluster.y += y;
    }
  });
}

function collide(alpha) {
  var quadtree = d3
    .quadtree()
    .x((d) => d.x)
    .y((d) => d.y)
    .addAll(nodes);
  nodes.forEach(function (d) {
    var r = d.r + padding;
    var nx1 = d.x - r,
      nx2 = d.x + r,
      ny1 = d.y - r,
      ny2 = d.y + r;
    quadtree.visit(function (quad, x1, y1, x2, y2) {
      if (quad.data && quad.data !== d) {
        var x = d.x - quad.data.x,
          y = d.y - quad.data.y,
          l = Math.sqrt(x * x + y * y),
          r =
            d.r +
            quad.data.r +
            (d.cluster === quad.data.cluster ? padding : clusterPadding);
        if (l < r) {
          l = ((l - r) / l) * alpha * 10;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.data.x += x;
          quad.data.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  });
}

function drag_started(event, d) {
  if (!event.active) simulation.alphaTarget(0.01).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {

  d.fx = event.x;
  d.fy = event.y;
}

function drag_ended(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

// we iterate all the nodes and for those that are d.selected_node=true we update the bottom panel
function update_bottom_panel() {
  var table_content =
    '<table style="border: 1px solid black; border-collapse: collapse; width: 100%;">';

  // create header from the node_field_labels list
  table_content += "<tr>";
  for (var i = 0; i < node_fields_table_labels.length; i++) {
    table_content +=
      '<th style="border: 1px solid black; padding: 10px;">' +
      node_fields_table_labels[i] +
      "</th>";
  }
  table_content += "</tr>";

  gnodes.each(function (d) {
    if (d.selected_node == true) {
      table_content += "<tr>";
      for (var i = 0; i < node_fields_table.length; i++) {
        var row =
          '<td style="border: 1px solid black; padding: 10px;">' +
          d[node_fields_table[i]] +
          "</td>";
        table_content += row;
      }
      table_content += "</tr>";
    }
  });

  table_content += "</table>";
  div_detail_area.html(table_content);
}

function process_click(event, d) {
  
  if (d.selected_node == false) {
    d3.select(this).select("circle").style("stroke-width", 3);
    d.selected_node = true;
  } else {
    d3.select(this).select("circle").style("stroke-width", 1);
    d.selected_node = false;
  }
  // we append to the the details of the node
  update_bottom_panel();

}

function process_dblclick(event, d) {
  // nothing to do here for now
}

function zoom_svg(event, d) {
  svg.attr("transform", event.transform);
  var zoom_scale = event.transform.k;
  gnodes.each(function () {
    var currCircle = d3.select(this).select("circle");
    d3.select(this)
      .select("text")
      .style("visibility", function () {
        if (currCircle.attr("r") * zoom_scale < minRadius) {
          return "hidden";
        } else {
          return "visible";
        }
      });
    if (zoom_scale > 0.8) {
      d3.select(this)
        .select("text")
        .style("font-size", 5 + 10 / zoom_scale);
    } else {
      d3.select(this)
        .select("text")
        .style("font-size", 5 + 10 * zoom_scale);
    }
  });
}

function hide_labels() {
  gnodes.each(function () {
    var currCircle = d3.select(this).select("circle");
    d3.select(this)
      .select("text")
      .style("visibility", function () {
        if (currCircle.attr("r") < minRadius) {
          return "hidden";
        } else {
          return "visible";
        }
      });
  });
}

function tooltip_on(event, d) {
  d3.select(this)
    .select("circle")
    .style("fill", function (d) {
      return d3.rgb(d.curr_colour).darker();
    });
  div_tooltip.transition().duration(200).style("opacity", 0.9);
  div_tooltip
    .html(generate_html_tooltip(d))
    .style("left", event.pageX + 30 + "px")
    .style("top", event.pageY + 30 + "px");
}

function tooltip_off(event, d) {
  d3.select(this).select("circle").style("fill", d.current_colour);
  div_tooltip.transition().duration(500).style("opacity", 0);
}

function drawNodes(nodes) {
  gnodes = svg
    .datum(nodes)
    .selectAll(".g")
    .data((d) => d)
    .enter()
    .append("g")
    .attr("class", "gnode")
    .call(
      d3
        .drag()
        .on("start", drag_started)
        .on("drag", dragged)
        .on("end", drag_ended)
    )
    .on("mouseover", tooltip_on)
    .on("mouseout", tooltip_off)
    .on("click", process_click)
    .on("dblclick", process_dblclick);

    
  circles = gnodes
    .append("circle")
    .attr("r", function (d) {
      return d.r;
    })
    .attr("fill", "white")
    .attr("stroke", "none");
  labels = gnodes
    .append("text")
    .text(function (d) {
      return d.text;
    })
    .attr("font-family", "Arial")
    .attr("dy", ".3em")
    .style("text-anchor", "middle");
  gnodes.each(function () {
    var currCircle = d3.select(this).select("circle");
    d3.select(this)
      .select("text")
      .style("visibility", function () {
        if (currCircle.attr("r") < minRadius) {
          return "hidden";
        } else {
          return "visible";
        }
      });
  });
  gnodes
    .transition()
    .delay((d, i) => Math.random() * 50)
    .duration(30)
    .attrTween("r", (d) => {
      const i = d3.interpolate(0, d.r);
      return (t) => (d.r = i(t));
    });
}

function simulate() {
  return d3
    .forceSimulation(nodes)
    .velocityDecay(velocity_decay)
    .alphaDecay(alpha_decay)
    .force("x", d3.forceX().strength(strength))
    .force("y", d3.forceY().strength(strength))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", collide)
    .force("cluster", clustering)
    .force("gravity", d3.forceManyBody(5))
    .tick(1000)
    .on("tick", ticked);
}

//Main routine
//We create the SVG frame
//TODO: How to make it bigger and pan/zoomable

var gnodes;
var circles;
var labels;
var nodes = createNodes(data);
var clusters = recalculate_clusters(nodes, clustering_field);
var title = d3.select("#title_div").append("h1").text("Application Landscape");

var svgroot = d3
  .select("body")
  .append("svg")
  .attr("height", height)
  .attr("width", width);

function addWhiteBackground(svgElement) {
  var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("width", "100%");
  rect.setAttribute("height", "100%");
  rect.setAttribute("fill", "white");
  svgElement.insertBefore(rect, svgElement.firstChild);
}

// add the legend area
var legend = d3.select("body").append("div").attr("class", "legend");

var svgElement = document.querySelector("svg");
addWhiteBackground(svgElement);

var svg = svgroot
  .call(d3.zoom().on("zoom", zoom_svg).scaleExtent([0, 20]))
  .on("dblclick.zoom", null)
  .append("g");

// Define the div for the tooltip
var div_tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Define the div for the detail area
var div_detail_area = d3
  .select("body")
  .append("div")
  .attr("class", "detail_area");

//We create the "g" nodes bound to the data, we dont bound to circles
//because we want to add labels and potentially other things.
drawNodes(nodes);
changeColour(colour_field);
var simulation = simulate();

// Below are the functions that handle actual exporting:
// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
function getSVGString(svgNode) {
  svgNode.setAttribute("xlink", "http://www.w3.org/1999/xlink");
  var cssStyleText = getCSSStyles(svgNode);
  appendCSS(cssStyleText, svgNode);
  var serializer = new XMLSerializer();
  var svgString = serializer.serializeToString(svgNode);
  svgString = svgString.replace(/(\w+)?:?xlink=/g, "xmlns:xlink="); // Fix root xlink without namespace
  svgString = svgString.replace(/NS\d+:href/g, "xlink:href"); // Safari NS namespace fix
  return svgString;

  function getCSSStyles(parentElement) {
    var selectorTextArr = [];
    // Add Parent element Id and Classes to the list
    selectorTextArr.push("#" + parentElement.id);
    for (var c = 0; c < parentElement.classList.length; c++)
      if (!contains("." + parentElement.classList[c], selectorTextArr))
        selectorTextArr.push("." + parentElement.classList[c]);
    // Add Children element Ids and Classes to the list
    var nodes = parentElement.getElementsByTagName("*");
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i].id;
      if (!contains("#" + id, selectorTextArr)) selectorTextArr.push("#" + id);
      var classes = nodes[i].classList;
      for (var c = 0; c < classes.length; c++)
        if (!contains("." + classes[c], selectorTextArr))
          selectorTextArr.push("." + classes[c]);
    }
    // Extract CSS Rules
    var extractedCSSText = "";
    for (var i = 0; i < document.styleSheets.length; i++) {
      var s = document.styleSheets[i];
      try {
        if (!s.cssRules) continue;
      } catch (e) {
        if (e.name !== "SecurityError") throw e; // for Firefox
        continue;
      }
      var cssRules = s.cssRules;
      for (var r = 0; r < cssRules.length; r++) {
        if (contains(cssRules[r].selectorText, selectorTextArr))
          extractedCSSText += cssRules[r].cssText;
      }
    }
    return extractedCSSText;

    function contains(str, arr) {
      return arr.indexOf(str) === -1 ? false : true;
    }
  }

  function appendCSS(cssText, element) {
    var styleElement = document.createElement("style");
    styleElement.setAttribute("type", "text/css");
    styleElement.innerHTML = cssText;
    var refNode = element.hasChildNodes() ? element.children[0] : null;
    element.insertBefore(styleElement, refNode);
  }
}

function svgString2Image(svgString, width, height, format, callback) {
  var format = format ? format : "png";
  var imgsrc =
    "data:image/svg+xml;base64," + btoa(encodeURIComponent(svgString)); // Convert SVG string to data URL
  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  var image = new Image();
  image.onload = function () {
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    canvas.toBlob(function (blob) {
      var filesize = Math.round(blob.length / 1024) + " KB";
      if (callback) callback(blob, filesize);
    });
  };

  image.src = imgsrc;
}

var simulation = simulate();
