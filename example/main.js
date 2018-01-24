"use strict";


var description = {
  name: "N1", length: 10,
  subnodes: [
    { name: "N2", length: 30,
      subnodes: [
        { name: "A", length: 10 },
        { name: "B", length: 20 }
      ]
    },
    { name: "C", length: 20 }
  ]
};


/* Beginner */
// var tree = WebTree.load("rectangular", description);


/* Configuration */
// var tree = WebTree.load("rectangular", description, {
//         "branch_length_unit": 10,
//         "leaf_span": 50,
//     }
// );


/* Using addons */
var tree = WebPhyloTree.load("rectangular", description, {
        "branch_length_unit": 10,
        "leaf_span": 50,
    },
    [ WebPhyloTree.Addons.LeafButton, WebPhyloTree.Addons.ExtendBranch ]
);


document.getElementsByTagName("body")[0].appendChild(tree.element);
