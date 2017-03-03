"use strict";



function main() {
    $.ajax({
        url: "./data/tree_of_life.newick",
        dataType: "text",
        success: function (data, status, xhr) {
            displayTree(data);
        }
    });
}


function displayTree(tolText) {
    var tolJson = parseNewick(tolText);
    var layoutType = "circular";
    var layoutConfig = {
        "branch_length_unit": 200,
        "leaf_button:width": 250,
        "leaf_button:font_size": 10,
        "leaf_button:show_border": false,
        "leaf_button:onclick": function (node) {
            var elem = node.elements["leaf_button_button"];
            elem.setAttributeNS(null, "fill", "lightgrey");
        }
    };
    var addons = [ WebTree.Addons.ExtendBranch, WebTree.Addons.LeafButton ];
    var tree = WebTree.load(layoutType, tolJson, layoutConfig, addons);
    document.getElementsByTagName("body")[0].appendChild(tree.element);
}



main();
