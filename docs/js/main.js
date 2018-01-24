"use strict";


    
    

function main() {
    $.ajax({
        url: "./data/tree_of_life.newick",
        dataType: "text",
        success: function (data, status, xhr) {
            let treeJson = parseNewick(data);
            let containerElement = document.getElementById("tree-container");
            initTree(treeJson, containerElement);
        }
    });
}



function initTree(treeJson, containerElement) {
    function updateTree() {        
        function getConfiguration() {
            var formElem = document.getElementsByTagName("form")[0];
            var setting = FormInspector.inspect(formElem);
            var layoutType = setting["layout-type"];
            var layoutConfig = (function(){
                var c = Object.assign({}, setting);
                delete c["layout-type"];
                delete c["enable-label"];
                delete c["enable-node-button"];
                delete c["enable-extend-branch"];
                delete c["enable-dragging"];
                function selectLeaf(leaf)
                {
                    selectedLeafSet.add(leaf);
                    leaf.setFill("red");
                    leaf.setStroke("red");
                }
                function unselectLeaf(leaf)
                {
                    selectedLeafSet.delete(leaf);
                    leaf.setFill("white");
                    leaf.setStroke("black");
                }
                c["leaf_button::onclick"] = function (leaf) {
                    alert("You clicked a leaf!");
                    // if (! selectedLeafSet.has(leaf))
                    // {
                    //     selectLeaf(leaf);
                    // }
                    // else
                    // {
                    //     unselectLeaf(leaf);
                    // }
                }
                c["node_button::onclick"] = function (node) {
                    alert("You clicked a node!");
                    // var descendants = node.getDescendants();
                    // for (var d of descendants)
                    // {
                    //     selectLeaf(d);
                    // }
                }
                return c;
            })();
            var addons = [];
            if (setting["enable-label"]) {
                addons.push(WebPhyloTree.Addons.LeafButton);
            }
            if (setting["enable-node-button"]) {
                addons.push(WebPhyloTree.Addons.NodeButton);
            }
            if (setting["enable-extend-branch"]) {
                addons.push(WebPhyloTree.Addons.ExtendBranch);
            }
            if (setting["enable-dragging"]) {
                addons.push(WebPhyloTree.Addons.Dragging);
            }
            if (setting["enable-zooming"]) {
                addons.push(WebPhyloTree.Addons.Zooming);
            }
            displayLayoutParameter(layoutConfig);
            return {
                layoutType: layoutType,
                layoutConfig: layoutConfig,
                addons: addons
            };
        }
        function makeTree(configuration) {
            var layoutType = configuration.layoutType;
            var layoutConfig = configuration.layoutConfig;
            var addons = configuration.addons;
            var tree = WebPhyloTree.load(layoutType, treeJson, layoutConfig, addons);
            
            return tree;
        }
        
        tree = makeTree(getConfiguration());
        containerElement.innerHTML = "";
        containerElement.appendChild(tree.element);
    }
    function addEventListeners() {
        document.getElementById("update-display-button").addEventListener("click", function(e){
            e.preventDefault();
            updateTree();                 
        });
        
        document.getElementById("download-svg-button").addEventListener("click", function (e) {
            function svgToString(svgElement) {
                var serilizer = new XMLSerializer();
                return serilizer.serializeToString(svgElement);
            }
            function proposeDownload(svgString) {
                var blob = new Blob([svgString], {
                    type: "image/svg+xml"
                });
                var url = URL.createObjectURL(blob);
                
                window.open(url, "_blank");
            }
            
            var treeSvgString = svgToString(tree.element);
            
            proposeDownload(treeSvgString);
        });
        
        
        document.getElementById("make-subtree-button").addEventListener("click", function (e) {
            console.log("selectedLeafSet", selectedLeafSet);
            var descr = WebPhyloTree.Utility.getSubTreeDescriptionByLeaves(Array.from(selectedLeafSet));
            selectedLeafSet = new Set();
            treeJson = descr;
            console.log(treeJson);
            updateTree();
        })
    }
    
    var tree = null;
    var selectedLeafSet = new Set();
    
    updateTree();
    addEventListeners();
}




function displayLayoutParameter(config) {
    var elem = document.getElementById("layout-parameter-display");
    elem.innerHTML = JSON.stringify(config, null, "\t");
}


main();
