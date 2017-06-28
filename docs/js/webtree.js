var WebTree = (function(){
    
    
    var SvgHelper = (function(){
        var xmlns = "http://www.w3.org/2000/svg";
        
        function error(msg) {
            throw "SvgHelper: " + msg;
        }
        
        function createMatrix() {
            return create("svg").createSVGMatrix();
        }
        
        function getRTM(sour, term) {
            var path = [];
            while (term != sour && term != null) {
                path.unshift(term);
                term = term.parentElement;
            }
            if (term == null) {
                console.log(path);
                error("Terminal is not a decendance of source");
            } else {
                var m = createMatrix();
                for (var elem of path) {
                    var n = createMatrix();
                    for (var trans of Array.from(elem.transform.baseVal)) {
                        n = n.multiply(trans.matrix);
                    }
                    m = m.multiply(n);
                }
                return m
            }
        }
        
        function create(tagName) {
            return document.createElementNS(xmlns, tagName);
        }
        
        function createSvg() {
            var xml = document.implementation.createDocument(
                "http://www.w3.org/2000/svg",
                "svg"
            );
            return xml.firstElementChild;
        }
        
        function setAttribute(elem, attr, value) {
            elem.setAttributeNS(null, attr, value);
        }
        
        return {
            getRTM: getRTM,
            create: create,
            createSvg: createSvg,
            setAttribute: setAttribute
        };
    })()
    
    
    
    
    function WebTreeError(procedure, message, ... irritants) {
        console.error(procedure);
        console.error(message);
        for (var irr of irritants) {
            console.log(irr);
        }
        this.procedure = procedure;
        this.message = message;
        this.irritants = irritants;
    }
    
    
    
    
    // format string
    
    function format(patternString, ... items) {
        var targetString = "";
        var i = 0;
        var upperBound = items.length - 1;
        var isEscaped = false;
        for (var ch of patternString) {
            if (isEscaped) {
                if (ch == "%") {
                    isEscaped = false
                    targetString += "%";
                    break;
                } else {
                    throw new WebTreeError("format", "Invalid pattern string: character '\\' must be followed by '%'.", patternString);
                }
            } else {
                if (ch == '%') {
                    if (i > upperBound) {
                        throw new WebTreeError("format", "Too many '%' in pattern string.", patternString, items);
                    } else {
                        targetString += items[i];
                        i += 1;
                    }
                } else if (ch == '\\') {
                    isEscaped = true;
                } else {
                    targetString += ch;
                }
            }
        }
        if (i != (upperBound + 1)) {
            throw new WebTreeError("format", "Too few '%' in pattern string.", patternString, items);
        } else {
            return targetString;
        }
    }
    
    
    
    
    // depth-first search
    
    function dfs(node, proc) {
        function D(node) {
            if (isNode(node)) {
                for (var snode of node.subnodes) {
                    D(snode);
                }
            }
            proc(node);
        }
        D(node)
    }
    
    
    // broadness-first search
    
    function bfs(queue, proc) {
        // copy queue
        queue = queue.slice(0);
        while (queue.length > 0) {
            var node = queue.shift();
            proc(node);
            if (isNode(node)) {
                for (var snode of node.subnodes) {
                    queue.push(snode);
                }
            }
        }
    }
    
    
    
    
    
    function isNode(node) {
        return node.type == "node";
    }
    
    
    function isLeaf(node) {
        return node.type == "leaf";
    }
    
    
    
    
    function appendNode(n1, n2) {
        if (isNode(n1)) {
            n1.subnodes.push(n2);
            n2.parent = n1;
        } else {
            throw new WebTreeError("appendNode", "Parent node is not a node.", n1, n2);
        }
        
    }
    
    
    
    
    // Node constructor & Leaf constructor
    
    function GeneralNode(name, length, share) {
        this.name = name;
        this.length = length;
        this.share = share;
        this.parent = null;
    }
    
    
    function Node(name, length, share) {
        GeneralNode.apply(this, [name, length, share]);
        this.subnodes = [];
        this.type = "node";
    }
    
    
    function Leaf(name, length, share) {
        GeneralNode.apply(this, [name, length, share]);
        this.type = "leaf";
    }
    
    
    
    
    // Add SVG elements to nodes or leaves.
    
    var Elements = (function(){
        
        function createCapsule(node) {
            var elem = SvgHelper.create("g");
            node.elements["main"] = elem;
        }
        
        
        function addBodyElement(node) {
            var body = SvgHelper.create("g");
            node.elements["main"].appendChild(body);
            node.elements["body"] = body;
        }
        
        
        function addBranchLineElement(node) {
            var brch = SvgHelper.create("path");
            SvgHelper.setAttribute(brch, "stroke-linecap", "round");
            brch.style.fill = "none";
            node.elements["main"].appendChild(brch);
            node.elements["branch"] = brch;
        }
        
        
        function addVBranchLineElement(node) {
            var vbrch = SvgHelper.create("path");
            vbrch.style.fill = "none";
            node.elements["main"].appendChild(vbrch);
            node.elements["vbranch"] = vbrch;
        }
        
        
        function addHookElement(node) {
            var hook = SvgHelper.create("g");
            node.elements["main"].appendChild(hook);
            node.elements["hook"] = hook;
        }
        
        
        function addStandardElements(root) {
            dfs(root, function(node) {
                node.elements = {};
                createCapsule(node);
                addBranchLineElement(node);
                addVBranchLineElement(node);
                addBodyElement(node);
                addHookElement(node);
            });
        }
        
        
        return {
            addStandardElements: addStandardElements,
        };
    })();
    
    
    
    
    // @layout
    var Layout = (function(){
        
        function setUpLayout(root) {
            dfs(root, function (n) { n.layout = {}; });
        }
        
        
        function calculateBranchLength(root) {
            var unit = root.share.config["branch_length_unit"];
            dfs(root, function(node) {
                var length = node.length;
                node.layout["branch_length"] = unit * length;
            });
        }
        
        
        function calculateShift(root) {
            dfs(root, function(node) {
                var branch_length = node.layout["branch_length"];
                node.layout["vbranch_shift"] = branch_length;
                node.layout["hook_shift"] = branch_length;
                node.layout["body_shift"] = branch_length;
            });
        }
        
        
        function calculateBodyWidth(root) {
            dfs(root, function(node){
                node.layout["body_width"] = 0;
            });
        }
        
        
        function calculateNodeWeight(root) {
            var leafNodeWeight = 1;
            var emptyNodeWeight = root.share.config["empty_node_weight"];
            dfs(root, function(node) {
                if (isLeaf(node)) {
                    node.layout["weight"] = leafNodeWeight;
                } else if (node.subnodes.length == 0) {
                    node.layout["weight"] = emptyNodeWeight;
                } else {
                    var weight = 0;
                    for (var snode of node.subnodes) {
                        weight += snode.layout["weight"];
                    }
                    node.layout["weight"] = weight;
                }
            });
        }
        
                
        function calculateRotation(root, unitDegree) {
            function C(node) {
                if (isNode(node)) {
                    var sum = 0;
                    for (var snode of node.subnodes) {
                        snode.layout["rotation"] = sum * unitDegree;
                        sum += snode.layout["weight"];
                    }
                    node.subnodes.map(C);
                } else {
                    // do nothing
                }
            }
            root.layout["rotation"] = 0;
            C(root);
        }
        
        
        function insertToParent(node) {
            if (node.parent) {
                node.parent.elements["body"].appendChild(node.elements["main"]);
            }
        }
        
        
        function reloadSubnodes(node) {
            if (isNode(node)) {
                // remove child elements from body
                var body = node.elements["body"];
                for (var child of body.childNodes) {
                    body.removeChild(child);
                }
                // insert back
                node.subnodes.map(insertToParent);
            }
        }
        
        
        // @layout @@Rectangular
        var Rectangular = (function () {
            
            var configuration = null;
            
            function init(root) {
                setUpLayout(root);
                calculateLayoutParameters(root);
                dfs(root, updatePosition);
                dfs(root, updateDisplay);
                dfs(root, insertToParent);
                updateTreePosition(root);
            }
            
            
            function calculateLayoutParameters(root) {
                
                var leafHeight = root.share.config["leaf_height"];
                var emptyNodeHeight = root.share.config["empty_node_height"];
                
                function calculateHeightAndTop(root) {
                    function C(node) {
                        if (isLeaf(node)) {
                            node.layout["height"] = leafHeight;
                        } else if (node.subnodes.length == 0) {
                            node.layout["height"] = emptyNodeHeight;
                        } else {
                            var height = 0;
                            for (var snode of node.subnodes) {
                                snode.layout["top"] = height;
                                C(snode);
                                height += snode.layout["height"];
                            }
                            node.layout["height"] = height;
                        }
                    }
                    C(root);
                    root.layout["top"] = 0;
                }
                
                function calculateVBranchAndJoint(root) {
                    function C(node) {
                        if (isLeaf(node) || node.subnodes.length == 0) {
                            node.layout["vbranch_top"] = 0;
                            node.layout["vbranch_bot"] = 0;
                            node.layout["joint"] = node.layout["height"] / 2;
                        } else {
                            node.subnodes.map(C);
                            var first = node.subnodes[0];
                            var last = node.subnodes[node.subnodes.length-1];
                            var dist_top = first.layout["joint"];
                            var dist_bot = last.layout["height"] - last.layout["joint"];
                            var vbranch_top = dist_top;
                            var vbranch_bot = node.layout["height"] - dist_bot;
                            node.layout["vbranch_top"] = vbranch_top;
                            node.layout["vbranch_bot"] = vbranch_bot;
                            node.layout["joint"] = (vbranch_top + vbranch_bot) / 2;
                        }
                    }
                    C(root);
                }
                
                calculateHeightAndTop(root);
                calculateVBranchAndJoint(root);
                calculateBranchLength(root);
                calculateShift(root);
                calculateBodyWidth(root);
            }
            
            
            function updatePosition(node) {
                var transform = format("translate(0,%)", 
                                    node.layout["top"]);
                SvgHelper.setAttribute(node.elements["main"], "transform", transform);
            }
            
            
            function updateDisplay (node) {
                branch: {
                    let elem = node.elements["branch"];
                    let d = format("M 0,%  H %", 
                                node.layout["joint"], 
                                node.layout["branch_length"]);
                    SvgHelper.setAttribute(elem, "d", d);
                }
                vertical_branch: {
                    let elem = node.elements["vbranch"];
                    let d = format("M %,%  V %", 
                                node.layout["vbranch_shift"], 
                                node.layout["vbranch_top"], 
                                node.layout["vbranch_bot"]);
                    SvgHelper.setAttribute(elem, "d", d);
                }
                hook: {
                    let elem = node.elements["hook"];
                    let transform = format("translate(%, %)", 
                                        node.layout["hook_shift"], 
                                        node.layout["joint"]);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                body: {
                    let elem = node.elements["body"];
                    let transform = format("translate(%,0)", 
                                        node.layout["body_shift"]);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
            }            
            
            
            function updateTreePosition(root) {
                var elem = root.elements["main"];
                // to display full vbranch of root, in case of root.length === 0
                SvgHelper.setAttribute(elem, "transform", "translate(1,0)");
            }
            
            
            function calculateTreeSize(root) {
                function D(node) {
                    if (node.type == "node") {
                        return node.layout["body_shift"] + Math.max.apply(null, node.subnodes.map(D));
                    } else {
                        return node.layout["hook_shift"] + node.layout["body_width"];
                    }
                }
                
                var width = D(root);
                var height = root.layout["height"];
                return {
                    width: width,
                    height: height
                };
            }
            
            
            return {
                init: init,
                updateDisplay: updateDisplay,
                updateTreePosition: updateTreePosition,
                calculateTreeSize: calculateTreeSize
            };
        })();
        
        
        
        
        // @layout @@Circular
        var Circular = (function(){            
            
            function init(root) {
                setUpLayout(root);
                calculateLayoutParameters(root);
                updateDisplay(root);
                updateTreePosition(root);
                dfs(root, insertToParent);
            }
            
            
            function calculateLayoutParameters(root) {
                
                function calculateJointAndVBranchLayout(root, unitDegree) {
                    function C(node) {
                        if (isLeaf(node) || node.subnodes.length == 0) {
                            var joint = node.layout["weight"] * unitDegree / 2
                            node.layout["vbranch_from"] = joint;
                            node.layout["vbranch_to"] = joint;
                            node.layout["joint"] = joint;
                        } else {
                            node.subnodes.map(C);
                            var first = node.subnodes[0];
                            var last = node.subnodes[node.subnodes.length-1];
                            node.layout["vbranch_from"] = first.layout["joint"];
                            node.layout["vbranch_to"] = last.layout["rotation"] + last.layout["joint"];
                            node.layout["joint"] = (node.layout["vbranch_from"] + node.layout["vbranch_to"]) / 2;
                        }
                    }
                    C(root);
                }
                
                function calculateInnerRadius(root) {
                    root.layout["inner_radius"] = 0;
                    bfs(root.subnodes, function (node) {
                        var parentLayout = node.parent.layout;
                        node.layout["inner_radius"] = parentLayout["inner_radius"] + parentLayout["body_shift"];
                    });
                }
                
                calculateNodeWeight(root);
                var unitDegree = 360 / root.layout["weight"];
                calculateRotation(root, unitDegree);
                calculateJointAndVBranchLayout(root, unitDegree);
                calculateBranchLength(root);
                calculateShift(root);
                calculateInnerRadius(root);
                calculateBodyWidth(root);
            }
            
            
            function updateDisplay(root) {                
                
                function refreshCapsule(node) {
                    var elem = node.elements["main"];
                    var transform = format("rotate(%)", node.layout["rotation"]);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                function refreshBranchLine(node) {
                    var elem = node.elements["branch"];
                    var d = format("M %,0 h %",
                                node.layout["inner_radius"],
                                node.layout["branch_length"]);
                    var transform = format("rotate(%)", node.layout["joint"]);
                    SvgHelper.setAttribute(elem, "d", d);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                function refreshVBranchLine(node) {
                    var elem = node.elements["vbranch"];
                    var delta = node.layout["vbranch_to"] - node.layout["vbranch_from"];
                    var outer_radius = node.layout["inner_radius"] + node.layout["vbranch_shift"];
                    var d = format("M %,0  A %,% 0 %,1 %,%",
                                outer_radius,
                                outer_radius, outer_radius,
                                (delta > 180) ? 1 : 0,
                                outer_radius * Math.cos(delta * Math.PI / 180),
                                outer_radius * Math.sin(delta * Math.PI / 180));
                    var transform = format("rotate(%)", node.layout["vbranch_from"]);
                    SvgHelper.setAttribute(elem, "d", d);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                function refreshHook(node) {
                    var elem = node.elements["hook"];
                    var transform = format("rotate(%)  translate(%,0)",
                                        node.layout["joint"],
                                        node.layout["inner_radius"] + node.layout["hook_shift"]);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                dfs(root, function (node) {
                    refreshCapsule(node);
                    refreshBranchLine(node);
                    refreshVBranchLine(node);
                    refreshHook(node);
                });
            }
            
            
            function updateTreePosition(root) {
                function R(node) {
                    if (isNode(node)) {
                        return Math.max.apply(null, node.subnodes.map(R));
                    } else {
                        return node.layout["inner_radius"] + node.layout["hook_shift"] + node.layout["body_width"];
                    }
                }
                var radius = R(root) + 1;
                var elem = root.elements["main"];
                var transform = format("translate(%, %)", radius, radius);
                SvgHelper.setAttribute(elem, "transform", transform);
            }
            
            
            function calculateTreeSize(root) {
                function R(node) {
                    if (isNode(node)) {
                        return Math.max.apply(null, node.subnodes.map(R));
                    } else {
                        return node.layout["inner_radius"] + node.layout["hook_shift"] + node.layout["body_width"];
                    }
                }
                var radius = R(root) + 1;
                var diameter = 2 * radius;
                return {
                    width: diameter,
                    height: diameter
                };
            }
            
            
            return {
                init: init,
                updateDisplay: updateDisplay,
                updateTreePosition: updateTreePosition,
                calculateTreeSize: calculateTreeSize
            };
        })();
        
        
        
        
        // @layout @@Unrooted
        var Unrooted = (function(){
            
            function init(root) {
                setUpLayout(root);
                calculateLayoutParameters(root);
                updateDisplay(root);
                dfs(root, insertToParent);
                updateTreePosition(root);
            }
            
            
            function calculateLayoutParameters(root) {
                
                function calculateJoint(root, unitDegree) {
                    dfs(root, function (node) {
                        node.layout["joint"] = node.layout["weight"] * unitDegree / 2;
                    });
                }
        
                calculateNodeWeight(root);
                var unitDegree = 360 / root.layout["weight"];
                calculateRotation(root, unitDegree);
                calculateJoint(root, unitDegree);
                // idiosyncrasy of unrooted trees.
                root.length = 0;
                calculateBranchLength(root);
                calculateShift(root);
                calculateBodyWidth(root);
            }
            
            
            function updateDisplay(root) {
                
                function refreshCapsule(node) {
                    var elem = node.elements["main"];
                    var transform = format("rotate(%)", node.layout["rotation"]);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                function refreshBranchLine(node) {
                    var elem = node.elements["branch"];
                    var d = format("M 0,0  H %", node.layout["branch_length"]);
                    var transform = format("rotate(%)", node.layout["joint"]);
                    SvgHelper.setAttribute(elem, "d", d);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                function refreshHook(node) {
                    var elem = node.elements["hook"];
                    var transform = format("rotate(%) translate(%,0)",
                                        node.layout["joint"],
                                        node.layout["hook_shift"]);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                function refreshBody(node) {
                    var elem = node.elements["body"];
                    var transform = format("rotate(%) translate(%,0) rotate(%)",
                                        node.layout["joint"],
                                        node.layout["body_shift"],
                                        - node.layout["joint"]);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                dfs(root, function (node) {
                    refreshCapsule(node);
                    refreshBranchLine(node);
                    refreshBody(node);
                    refreshHook(node);
                });
            }
            
            
            function updateTreePosition (root) {
                function S(node) {
                    if (isNode(node)) {
                        for (var snode of node.subnodes) {
                            S(snode);
                        }
                    } else {
                        var m = SvgHelper.getRTM(root.elements["main"], node.elements["hook"]);
                        var x = m.e - node.layout["body_width"];
                        var y = m.f - node.layout["body_width"];
                        lef = (lef == null || x < lef) ? x : lef;
                        top = (top == null || y < top) ? y : top;
                    }
                }
                var lef = null;
                var top = null;
                S(root);
                SvgHelper.setAttribute(root.elements["main"], "transform", 
                                    format("translate(%,%)", -lef, -top));
            }
            
            
            function calculateTreeSize(root) {
                function S(node) {
                    if (isNode(node)) {
                        for (var snode of node.subnodes) {
                            S(snode);
                        }
                    } else {
                        var m = SvgHelper.getRTM(root.elements["body"], node.elements["hook"]);
                        var x1 = m.e - node.layout["body_width"];
                        var y1 = m.f - node.layout["body_width"];
                        var x2 = m.e + node.layout["body_width"];
                        var y2 = m.f + node.layout["body_width"];
                        lef = (lef == null || x1 < lef) ? x1 : lef;
                        rig = (rig == null || x2 > rig) ? x2 : rig;
                        top = (top == null || y1 < top) ? y1 : top;
                        bot = (bot == null || y2 > bot) ? y2 : bot;
                    }
                }
                var lef = null;
                var rig = null;
                var top = null;
                var bot = null;
                S(root)
                var width = rig - lef;
                var height = bot - top;
                return {
                    width: width,
                    height: height
                };
            }
            
            
            return {
                init: init,
                updateDisplay: updateDisplay,
                updateTreePosition: updateTreePosition,
                calculateTreeSize: calculateTreeSize
            };
        })();
        
        return {
            "rectangular": Rectangular,
            "circular": Circular,
            "unrooted": Unrooted
        };
    })();
    



    function makeAddonSpecifiConfig(addonName, config) {
        var newConfig = {};
        for (var key in config) {
            var value = config[key];
            var newKey = addonName + "::" + key;
            newConfig[newKey] = value;
        }
        return newConfig;
    }




    function extractAddonSpecifiConfig(config, addonName) {
        var prefix = addonName + "::";
        var newConfig = {};
        for (var key in config) {
            if (key.startsWith(prefix)) {
                var newKey = key.substr(prefix.length);
                newConfig[newKey] = config[key];
            }
        }
        return newConfig;
    }
    
    
    
    // @recipe
    
    var Recipes = (function(){
        
        function makeConfig(base) {
            return Object.assign({}, base, addons);
        }
        
        var rectangular = {
            "branch_length_unit": 4,
            "leaf_height": 32,
            "empty_node_height": 32
        };
        var circular = {
            "branch_length_unit": 3,
            "empty_node_weight": 1
        };
        var unrooted = {
            "branch_length_unit": 5,
            "empty_node_weight": 1,
        };
        var addons = Object.assign({},
            makeAddonSpecifiConfig("leaf_button", {
                "fill": "#ffffff",
                "stroke": "#000000",
                "hovered_fill": "#ffffff",
                "hovered_stroke": "#0000ff",
                "shift": 4,
                "width": 100,
                "font_size": 20,
                "vertical_padding": 5,
                "auto_flip": false,
                "get_label_by_name": null,
                "onclick": null
            }),
            makeAddonSpecifiConfig("node_button", {
                "fill": "#ffffff",
                "stroke": "#000000",
                "hovered_fill": "#ffffff",
                "hovered_stroke": "#0000ff",
                "radius": 4,
                "onclick": null
            })
        );
        
        return {
            "rectangular": makeConfig(rectangular),
            "circular": makeConfig(circular),
            "unrooted": makeConfig(unrooted)
        };
    })();

    
    
    // @addons
    
    var Addons = {
        LeafButton: {
            doAfterTree: function (root) {
                
                function autoFlip(root) {
                    function R(node, absRotation) {
                        absRotation += node.layout["rotation"];
                        if (node.type == "node") {
                            for (var snode of node.subnodes) {
                                R(snode, absRotation);
                            }
                        } else {
                            var degree = absRotation + node.layout["joint"];
                            if (degree > 90 && degree < 270) {
                                var elem = node.elements["leaf_button"];
                                SvgHelper.setAttribute(elem, "text-anchor", "end");
                                SvgHelper.setAttribute(elem, "transform", "rotate(180)");
                                SvgHelper.setAttribute(elem, "x", - shift);
                            }
                        }
                    }
                    R(root, 0);
                }
                
                var config = root.share.config;
                var addonConfig = extractAddonSpecifiConfig(config, "leaf_button");
                var fill = addonConfig["fill"];
                var stroke = addonConfig["stroke"];
                var hoveredFill = addonConfig["hovered_fill"];
                var hoveredStroke = addonConfig["hovered_stroke"];
                var shift = addonConfig["shift"];
                var width = addonConfig["width"];
                var fontSize = addonConfig["font_size"];
                var getLabelByName = addonConfig["get_label_by_name"] || function(x) { return x; };
                var buttonHeight = fontSize + 2 * addonConfig["vertical_padding"];
                var buttonWidth = addonConfig["width"] - 2;      // leave space for border
                var onclickHandler = addonConfig["onclick"];    // could be null!
                
                function P(node) {
                    
                    function addLabel(node) {
                    
                        function makeLabel(name) {
                            var elem = SvgHelper.create("text");
                            var labelText = getLabelByName
                            SvgHelper.setAttribute(elem, "dominant-baseline", "central");
                            SvgHelper.setAttribute(elem, "font-size", fontSize);
                            SvgHelper.setAttribute(elem, "x", shift);
                            SvgHelper.setAttribute(elem, "style", "".concat([
                                "pointer-events: none;",
                                "cursor: default;",
                                // disable selection
                                " -webkit-touch-callout: none; -webkit-user-select: none;",
                                "-khtml-user-select: none;",
                                "-moz-user-select: none;",
                                "-ms-user-select: none;",
                                "user-select: none;"
                            ]));
                            elem.appendChild(document.createTextNode(name));
                            return elem;
                        }
                        
                        var name = node.name;
                        var elem = makeLabel(name);
                        node.elements["hook"].appendChild(elem);
                        node.elements["leaf_button"] = elem;
                    }
                    
                    function addButton(node) {
                        var elem = SvgHelper.create("rect");
                        SvgHelper.setAttribute(elem, "x", 0);
                        SvgHelper.setAttribute(elem, "y", - buttonHeight/2);
                        SvgHelper.setAttribute(elem, "width", buttonWidth);
                        SvgHelper.setAttribute(elem, "height", buttonHeight);
                        SvgHelper.setAttribute(elem, "fill", "rgba(0,0,0,0)");
                        SvgHelper.setAttribute(elem, "style", "cursor: default;");
                        
                        // handle clicking
                        if (onclickHandler != null) {
                            elem.addEventListener("click", function (... args) {
                                onclickHandler(node);
                            });
                        }
                        
                        // setup strok and fill
                        elem.style.fill = fill;
                        elem.style.stroke = stroke;
                        elem.addEventListener("mouseover", function (_) {
                            elem.style.fill = hoveredFill;
                            elem.style.stroke = hoveredStroke;
                        })
                        elem.addEventListener("mouseleave", function (_) {
                            elem.style.fill = fill;
                            elem.style.stroke = stroke;
                        })
                        
                        node.elements["hook"].appendChild(elem);
                        node.elements["leaf_button_button"] = elem;
                    }
                    
                    if (node.type == "node") {
                        for (var snode of node.subnodes) {
                            P(snode);
                        }
                    } else {
                        addButton(node);
                        addLabel(node);
                        // so that the tree is positioned properly
                        node.layout["body_width"] += width;
                    }
                }
                
                P(root);

                if (((root.share.layoutEngine == Layout["circular"]) || (root.share.layoutEngine == Layout["unrooted"]))
                    && addonConfig["auto_flip"]) {
                    autoFlip(root);
                }
                root.share.layoutEngine.updateTreePosition(root);
            }
        },
        NodeButton: {
            doAfterTree: function (root) {
                var config = root.share.config;
                var addonConfig = extractAddonSpecifiConfig(config, "node_button");
                var fill = addonConfig["fill"];
                var stroke = addonConfig["stroke"];
                var hoveredFill = addonConfig["hovered_fill"];
                var hoveredStroke = addonConfig["hovered_stroke"];
                var radius = addonConfig["radius"];
                var onclickHandler = addonConfig["onclick"];
                
                
                function P(node) {
                    function makeButton() {
                        var elem = SvgHelper.create("circle");
                        SvgHelper.setAttribute(elem, "cx", 0);
                        SvgHelper.setAttribute(elem, "cy", 0);
                        SvgHelper.setAttribute(elem, "r", radius);
                        SvgHelper.setAttribute(elem, "style", "cursor: initial;");
                        elem.style.fill = fill;
                        elem.style.stroke = stroke;
                        if (onclickHandler != null) {
                            elem.addEventListener("click", function (... args) { 
                                onclickHandler(node); 
                            });
                        }
                        // when hovered, change color
                        elem.addEventListener("mouseenter", function (_) {
                            elem.style.fill = hoveredFill;
                            elem.style.stroke = hoveredStroke;
                        })
                        elem.addEventListener("mouseleave", function (_) {
                            elem.style.fill = fill;
                            elem.style.stroke = stroke;
                        })
                        return elem;
                    }
                    
                    if (isNode(node)) {
                        var elem = makeButton();
                        node.elements["hook"].appendChild(elem);
                        node.subnodes.map(P);
                    }
                }
                P(root);
            }
        },
        ExtendBranch: {
            doAfterTree: function (root) {
                
                function D(node) {
                    if (node.type == "node") {
                        return node.layout["body_shift"] + Math.max.apply(null, node.subnodes.map(D));
                    } else {
                        return node.layout["hook_shift"];
                    }
                }
                
                function E(node, depth) {
                    depth = depth - node.layout["hook_shift"];
                    if (node.type == "node") {
                        for (var snode of node.subnodes) {
                            E(snode, depth);
                        }
                    } else {
                        // draw extend branch
                        var elem = SvgHelper.create("path");
                        SvgHelper.setAttribute(elem, "d", format("M 0,0 H %", - depth));
                        elem.style.strokeDasharray = "1 1";
                        node.elements["hook"].appendChild(elem);
                        node.elements["ebranch"] = elem;
                        // move hook and body
                        node.layout["hook_shift"] += depth;
                        node.layout["body_shift"] += depth;
                        node.share.layoutEngine.updateDisplay(node);
                    }
                }
                
                var depth = D(root);
                E(root, depth);
                root.share.layoutEngine.updateTreePosition(root);
            }
        },
        Dragging: {
            doAfterSvg: function (svgElem) {
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
        }
    }
    
    
    
    
    // @generate
    
    return (function () {
        
        function rectangular(descr, config, addons) {
            return load("rectangular", descr, config, addons);
        }
        
        function circular(descr, config, addons) {
            return load("circular", descr, config, addons);
        }
        
        function unrooted(descr, config, addons) {
            return load("unrooted", descr, config, addons);
        }
        
        function load(layoutType, descr, rawConfig = {}, addons = []) {
            
            function makeConfig(layoutType, rawConfig) {
                var baseConfig = Recipes[layoutType];
                // merge config
                return Object.assign({}, baseConfig, rawConfig);
            }
            
            function makeTree(descr) {
                
                var share = {}
                
                function M(descr) {
                    var name = descr["name"];
                    var length = descr["length"];
                    if (descr.hasOwnProperty("subnodes")) {
                        // is a node
                        var node = new Node(name, length, share);
                        for (var d of descr["subnodes"]) {
                            appendNode(node, M(d));
                        }
                        return node;
                    } else {
                        return new Leaf(name, length, share);
                    }
                }
                
                return M(descr);
            }
            
            function initializeElements(root) {
                Elements.addStandardElements(root);
            }
            
            function initializeLayout(root, layoutType, config) {
                root.share.config = config;
                
                var LayoutEngine = Layout[layoutType];
                root.share.layoutEngine = LayoutEngine;
                LayoutEngine.init(root);
            }
            
            function makeSvg() {
                
                function makeSvgCanvas(width, height) {
                    var svg = SvgHelper.createSvg();
                    SvgHelper.setAttribute(svg, "stroke", "black")
                    SvgHelper.setAttribute(svg, "width", format("%px", width));
                    SvgHelper.setAttribute(svg, "height", format("%px", height))
                    SvgHelper.setAttribute(svg, "viewBox", format("0 0 % %", width, height));
                    return svg;
                }
                
                var size = root.share.layoutEngine.calculateTreeSize(root);
                var svg = makeSvgCanvas(size.width, size.height);
                svg.appendChild(root.elements["main"]);
                return svg;
            }
            
            var config = makeConfig(layoutType, rawConfig);
            var root = makeTree(descr);
            initializeElements(root);
            initializeLayout(root, layoutType, config);
            // trigger addons
            for (var addon of addons) {
                if (addon.doAfterTree) {
                    addon.doAfterTree(root);
                }
            }
            var svg = makeSvg(root);
            for (var addon of addons) {
                if (addon.doAfterSvg) {
                    addon.doAfterSvg(svg);
                }
            }
            return {
                root: root,
                element: svg
            };
        }
        
        
        return {
            Addons: Addons,
            rectangular: rectangular,
            circular: circular,
            unrooted: unrooted,
            load: load
        };
    })();
})();
