"use strict";


var tolJson = null;


function main() {
    $.ajax({
        url: "./data/tree_of_life.newick",
        dataType: "text",
        success: function (data, status, xhr) {
            tolJson = parseNewick(data);
            displayTree();
            var elem = document.getElementById("update-display");
            elem.addEventListener("click", function(e){
                e.preventDefault();
                var c = document.getElementById("tree-container");
                c.innerHTML = "";
                displayTree();
            })
        }
    });
}


function displayTree() {
    var configuration = retrieveConfiguration();
    console.log(configuration);
    var layoutType = configuration.layoutType;
    var layoutConfig = configuration.layoutConfig;
    var addons = configuration.addons;
    var tree = WebTree.load(layoutType, tolJson, layoutConfig, addons);
    document.getElementById("tree-container").appendChild(tree.element);
}


function retrieveConfiguration() {
    var formElem = document.getElementsByTagName("form")[0];
    var setting = FormInspector.inspect(formElem);
    console.log(setting);
    var layoutType = setting["layout-type"];
    var layoutConfig = {
        "branch_length_unit": setting["branch-unit"],
        "leaf_button:width": setting["leaf_button$width"],
        "leaf_button:font_size": setting["leaf_button$font_size"],
        "leaf_button:show_border": setting["leaf_button$show_border"],
        "leaf_button:onclick": function (node) {
            var elem = node.elements["leaf_button_button"];
            if (elem.getAttributeNS(null, "fill") == "lightgrey") {
                elem.setAttributeNS(null, "fill", "rgba(0,0,0,0)");
            } else {
                elem.setAttributeNS(null, "fill", "lightgrey");
            }
        },
        "node_button:fill": setting["node_button$fill"],
        "node_button:stroke": setting["node_button$stroke"]
    }
    var addons = [];
    if (setting["enable-label"]) {
        addons.push(WebTree.Addons.LeafButton);
    }
    if (setting["enable-node-button"]) {
        addons.push(WebTree.Addons.NodeButton);
    }
    if (setting["enable-extend-branch"]) {
        addons.push(WebTree.Addons.ExtendBranch);
    }
    return {
        layoutType: layoutType,
        layoutConfig: layoutConfig,
        addons: addons
    };
}



main();
