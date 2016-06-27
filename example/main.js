"use strict";

var description = {
    name: "E", length: 10,
    subnodes: [ {name: "D", length: 30,
		 subnodes: [ {name: "C", length: 20},
			     {name: "B", length: 20} ]},
		{name: "A", length: 20} ]
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
// var root = WebTree.rectangular(container, description);
// var root = WebTree.circular(container, description);
// var root = WebTree.unrooted(container, description);


/* Advanced */
// var root = WebTree.rectangular(container, description, {
//     "branch_unit": 5,
//     "leaf_size": 40,
// });


/* Expert */
var root = WebTree.load(container, description, {
    layout: "circular",
    node_modifiers: [WebTree.Appendage.button],
    leaf_modifiers: [WebTree.Appendage.label],
    config: {
      "branch_unit": 5,
      "leaf_size": 32,
    },
});
