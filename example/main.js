"use strict";

var description = {
    name: "E", length: 10,
    subnodes: [ {name: "D", length: 30,
		 subnodes: [ {name: "C", length: 20},
			     {name: "B", length: 20} ]},
		{name: "A", length: 20} ]
};


var svgElement = document.rootElement;

/* Beginner 
var root = WebTree.rectangular(svgElement, description);
*/

/* Advanced 
var root = WebTree.rectangular(svgElement, description, {
    "branch_unit": 20,
    "leaf_size": 40,
});
*/

/* Expert */
var root = WebTree.load(svgElement, description, {
    layout: "rectangular",
    node_modifiers: [WebTree.Appendage.button],
    leaf_modifiers: [WebTree.Appendage.label],
    config: {
	"branch_unit": 10,
	"leaf_size": 32,
    },
});

