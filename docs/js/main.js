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
                c["leaf_button::onclick"] = function (leaf) {
                    alert(leaf.name);
                }
                return c;
            })();
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
            if (setting["enable-dragging"]) {
                addons.push(WebTree.Addons.Dragging);
            }
            displayLayoutParameter(layoutConfig);
            return {
                layoutType: layoutType,
                layoutConfig: layoutConfig,
                addons: addons
            };
        }
        function makeTree(configuration) {
            function enableDraging(svgElem) {
                svgElem.style.cursor = "grab";
                var viewBox = svgElem.viewBox;
                var lastPosition = null;
                svgElem.addEventListener("mousedown", function(e) {
                    svgElem.style.cursor = "grabbing";
                    var x = e.layerX;
                    var y = e.layerY;
                    lastPosition = {
                        x: x,
                        y: y
                    };
                });
                
                function resetDragging() {
                    svgElem.style.cursor = "grab";
                    lastPosition = null;
                }
                
                svgElem.addEventListener("mouseup", function(e) {
                    if (lastPosition !== null) {
                        var x1 = e.layerX;
                        var y1 = e.layerY;
                        var x0 = lastPosition.x;
                        var y0 = lastPosition.y;
                        var svgWidth =  svgElem.width.baseVal.value;
                        var svgHeight =  svgElem.height.baseVal.value;
                        var dx = (x1-x0) * viewBox.baseVal.width / svgWidth;
                        var dy = (y1-y0) * viewBox.baseVal.height / svgHeight;
                        svgElem.viewBox.baseVal.x += - dx;
                        svgElem.viewBox.baseVal.y += - dy;
                        resetDragging();
                    }
                });
                svgElem.addEventListener("mouseleave", function (e) {
                    if (lastPosition !== null) {
                        resetDragging();
                    }
                });
            }
            function enableZooming(svgElem) {
            
            function calculateScale(delta) {
                return Math.exp(- delta/100);
                var factor = Math.exp(-Math.abs(delta)/100);
                return Math.pow(factor, Math.sign(delta));
            }
            
            svgElem.addEventListener("wheel", function(e) {
                e.preventDefault();            
                var scale = calculateScale(e.deltaY);
                
                var x0 = svgElem.viewBox.baseVal.x;
                var y0 = svgElem.viewBox.baseVal.y;
                var w0 = svgElem.viewBox.baseVal.width;
                var h0 = svgElem.viewBox.baseVal.height;
                
                /* svg width/height */
                var sw = svgElem.width.baseVal.value;
                var sh = svgElem.height.baseVal.value;
                /* mouse x/y */
                var mx = e.layerX;
                var my = e.layerY;
                
                var w1 = w0 * scale;
                var h1 = h0 * scale;
                var x1 = (mx * w0 / sw) + x0 - (mx * w1 / sw);
                var y1 = (my * h0 / sh) + y0 - (my * h1 / sh);
                
                svgElem.viewBox.baseVal.x = x1;
                svgElem.viewBox.baseVal.y = y1;
                svgElem.viewBox.baseVal.width = w1;
                svgElem.viewBox.baseVal.height = h1;
            }, {
                capture: true
            });
        }
            
            var layoutType = configuration.layoutType;
            var layoutConfig = configuration.layoutConfig;
            var addons = configuration.addons;
            var tree = WebTree.load(layoutType, treeJson, layoutConfig, addons);
            
            enableDraging(tree.element);
            enableZooming(tree.element);
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
    }
    
    var tree = null;
    
    updateTree();
    addEventListeners();
}



function main_() {
    $.ajax({
        url: "./data/tree_of_life.newick",
        dataType: "text",
        success: function (data, status, xhr) {
            var tolJson = parseNewick(data);
            
            function updateTree() {
                var c = document.getElementById("tree-container");
                c.innerHTML = "";
                displayTree(tolJson, retrieveConfiguration());
            }
            updateTree();
            
            
        }
    });
}


function displayTree(tolJson, configuration) {
    
    function enableDraging(svgElem) {
        svgElem.style.cursor = "grab";
        var viewBox = svgElem.viewBox;
        var lastPosition = null;
        svgElem.addEventListener("mousedown", function(e) {
            svgElem.style.cursor = "grabbing";
            var x = e.layerX;
            var y = e.layerY;
            lastPosition = {
                x: x,
                y: y
            };
        });
        
        function resetDragging() {
            svgElem.style.cursor = "grab";
            lastPosition = null;
        }
        
        svgElem.addEventListener("mouseup", function(e) {
            if (lastPosition !== null) {
                var x1 = e.layerX;
                var y1 = e.layerY;
                var x0 = lastPosition.x;
                var y0 = lastPosition.y;
                var svgWidth =  svgElem.width.baseVal.value;
                var svgHeight =  svgElem.height.baseVal.value;
                var dx = (x1-x0) * viewBox.baseVal.width / svgWidth;
                var dy = (y1-y0) * viewBox.baseVal.height / svgHeight;
                svgElem.viewBox.baseVal.x += - dx;
                svgElem.viewBox.baseVal.y += - dy;
                resetDragging();
            }
        });
        svgElem.addEventListener("mouseleave", function (e) {
            if (lastPosition !== null) {
                resetDragging();
            }
        });
    }
    
    function enableZooming(svgElem) {
        
        function calculateScale(delta) {
            return Math.exp(- delta/100);
            var factor = Math.exp(-Math.abs(delta)/100);
            return Math.pow(factor, Math.sign(delta));
        }
        
        svgElem.addEventListener("wheel", function(e) {
            e.preventDefault();            
            var scale = calculateScale(e.deltaY);
            
            var x0 = svgElem.viewBox.baseVal.x;
            var y0 = svgElem.viewBox.baseVal.y;
            var w0 = svgElem.viewBox.baseVal.width;
            var h0 = svgElem.viewBox.baseVal.height;
            
            /* svg width/height */
            var sw = svgElem.width.baseVal.value;
            var sh = svgElem.height.baseVal.value;
            /* mouse x/y */
            var mx = e.layerX;
            var my = e.layerY;
            
            var w1 = w0 * scale;
            var h1 = h0 * scale;
            var x1 = (mx * w0 / sw) + x0 - (mx * w1 / sw);
            var y1 = (my * h0 / sh) + y0 - (my * h1 / sh);
            
            svgElem.viewBox.baseVal.x = x1;
            svgElem.viewBox.baseVal.y = y1;
            svgElem.viewBox.baseVal.width = w1;
            svgElem.viewBox.baseVal.height = h1;
        }, {
            capture: true
        });
    }
    
    var layoutType = configuration.layoutType;
    var layoutConfig = configuration.layoutConfig;
    var addons = configuration.addons;
    var tree = WebTree.load(layoutType, tolJson, layoutConfig, addons);
    var root = tree.root;
    var elem = tree.element;
    // enableDraging(elem);
    enableZooming(elem);
    document.getElementById("tree-container").appendChild(elem);
}


function displayLayoutParameter(config) {
    var elem = document.getElementById("layout-parameter-display");
    elem.innerHTML = JSON.stringify(config, null, "\t");
}


function retrieveConfiguration() {
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
        c["leaf_button::onclick"] = function (leaf) {
            alert(leaf.name);
        }
        return c;
    })();
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
    if (setting["enable-dragging"]) {
        addons.push(WebTree.Addons.Dragging);
    }
    displayLayoutParameter(layoutConfig);
    return {
        layoutType: layoutType,
        layoutConfig: layoutConfig,
        addons: addons
    };
}



main();
