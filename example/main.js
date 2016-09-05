"use strict";

var description = {
  name: "E", length: 10,
  subnodes: [
    { name: "D", length: 30,
      subnodes: [
        { name: "C", length: 20 },
        { name: "B", length: 20 }
      ]
    },
    { name: "A", length: 20 }
  ]
};

var container;
switch (document.documentElement.tagName) {
  case "HTML":
    container = document.getElementsByTagName("body")[0];
    break;
  case "svg":
    container = document.documentElement;
    break;
  default:
    throw "Unknown document type: " + document.documentElement.tagName;
}

/* Beginner */
// var tree = WebTree.rectangular(description);
// var tree = WebTree.circular(description);
// var tree = WebTree.unrooted(description);


/* Advanced */
// var tree = WebTree.rectangular(description, {
//     "branch_unit": 5,
//     "leaf_size": 40,
// });


// /* Expert */
 var tree = WebTree.load(description, {
     layout: "unrooted",
     node_modifiers: [WebTree.Appendage.button],
     leaf_modifiers: [WebTree.Appendage.label],
     config: {
       "branch_unit": 5,
       "leaf_size": 32,
     },
 });


var root = tree["root"];
var elem = tree["element"];
container.appendChild(elem);
