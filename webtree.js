var WebTree = (function(){

    
    var SvgHelper = (function(){        
        function apply(func, arr) {
            return func.apply(null, arr);
        }
        var SH = {
            xmlns: "http://www.w3.org/2000/svg",
            error: function (msg) {
                throw "SvgHelper: " + msg;
            },
            createTransform: function () {
                return SH.create("svg").createSVGTransform();
            },
            createMatrix: function () {
                return SH.create("svg").createSVGMatrix()
            },
            getRTM: function(sour, term) {
                var path = [];
                while (term != sour && term != null) {
                    path.unshift(term);
                    term = term.parentElement;
                }
                if (term == null) {
                    SH.error("Terminal is not a decendance of source");
                } else {
                    var m = SH.createMatrix();
                    for (var elem of path) {
                        var n = SH.createMatrix();
                        for (var trans of Array.from(elem.transform.baseVal)) {
                            n = n.multiply(trans.matrix);
                        }
                        m = m.multiply(n);
                    }
                    return m
                }
            },
            translate: function (elem, x, y) {
                var trans = SH.createTransform();
                if (isNaN(x)) debugger;
                     trans.setTranslate(x, y);
                elem.transform.baseVal.appendItem(trans);
            },
            create: function (tagName) {
                return document.createElementNS(SH.xmlns, tagName);
            },
            createSvg: function () {
                var xml = document.implementation.createDocument(
                    "http://www.w3.org/2000/svg",
                    "svg"
                );
                return xml.firstElementChild;
            },
            setAttribute(elem, attr, value) {
                elem.setAttributeNS(null, attr, value);
            },
            text: function (txt) {
                var elem = SH.create("text");
                elem.appendChild(document.createTextNode(txt));
                return elem;
            },
            title: function (elem, txt) {
                // remove existing title
                for (var snode of elem.childNodes) {
                    if (snode.tagName == "title") {
                        elem.removeChild(snode);
                    }
                }
                var telem = SH.create("title");
                SH.append(telem, document.createTextNode(txt));
                elem.appendChild(telem);
                return elem;
            }
        };
        return SH;
    })()
    
    
    
    
    function WebTreeError(procedure, message, ... irritants) {
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
            if isEscaped {
                if ch == "%" {
                    isEscaped = false
                    targetString += "%";
                    break;
                } else {
                    throw WebTreeError("format", "Invalid pattern string: character '\\' must be followed by '%'.", patternString);
                }
            } else {
                if ch == '\\' {
                    isEscaped = true;
                } else if ch == '%' {
                    if (i > upperBound) {
                        throw WebTreeError("format", "Too many '%' in pattern string.", patternString, items);
                    } else {
                        targetString += items[i];
                        i += 1;
                    }
                } else {
                    targetString += ch;
                }
            }
        }
        if (i != upperBound) {
            throw WebTreeError("format", "Too many '%' in pattern string.", patternString, items);
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
        if isNode(n1) {
            n1.subnodes.push(n2);
            n2.parent = n1;
        } else {
            throw WebTreeError("appendNode", "Parent node is not a node.", n1, n2);
        }
            
    }
    
    
    
    
    // Node constructor & Leaf constructor
    
    function GeneralNode(name, length, data, share) {
        this.name = name;
        this.length = length;
        this.parent = null;
        this.data = data;
        this.share = share;
    }
    
    
    function Node(name, length, data, share) {
        GeneralNode.apply(this, [name, length, data, share]);
        this.subnodes = [];
        this.type = "node";
    }
    
    
    function Leaf(name, length, data, share) {
        GeneralNode.apply(this, [name, length, data, share]);
        this.type = "leaf";
    }
    
    
    
    
    // Add SVG elements to nodes or leaves.
    
    var Elements = (function(){
        function createCapsule(node) {
            var elem = SvgHelper.create("g");
            node.elem = elem;
            node.elements["capsule"] = elem;
        }
        function addBodyElement(node) {
            var body = SvgHelper.create("g");
            node.elem.appendChild(body);
            node.elements["body"] = body;
        }
        function addBranchLineElement(node) {
            var brch = SvgHelper.create("path");
            brch.style.fill = "none";
            node.elem.appendChild(brch);
            node.elements["branch"] = brch;
        }
        function addVBranchLineElement(node) {
            var vbrch = SvgHelper.create("path");
            vbrch.style.fill = "none";
            node.elem.appendChild(vbrch);
            node.elements["vbranch"] = vbrch;
        }
        function addHookElement(node) {
            var hook = SvgHelper.create("g");
            node.elements["hook"] = hook;
            node.elem.appendChild(hook);
        }
        function addStandardElements(node) {
            node.elements = {};
            createCapsule(node);
            addBodyElement(node);
            addBranchLineElement(node);
            addVBranchLineElement(node);
            addHookElement(node);
        }
        
        return {
            standard: addStandardElements,
        };
    })();
    
    
    
    
    // @layout
    var Layout = (function(){
        
        function setUpLayout(root) {
            dfs(root, function (n) { n.layout = {}; });
        }
        
        
        function calculateBranchLength(root) {
            dfs(root, function(node) {
                var unit = node.config["branch_length_unit"];
                var length = node.length;
                node.layout["branch_length"] = unit * length;
            });
        }
        
        
        function calculateNodeWeight(root) {
            dfs(root, function(node) {
                if (isLeaf(node)) {
                    node.layout["weight"] = 1;
                } else {
                    var weight = 0;
                    for (var snode of node.subnodes) {
                        weight += snode.layout["weight"];
                    }
                    node.layout["weight"] = weight;
                }
            });
        }
        
        
        function makerCalcRotate(unitDegree) {
            return function (node) {
                if (isNode(node)) {
                    var sum = 0;
                    for (var snode of node.subnodes) {
                        snode.layout["rotate"] = sum * unitDegree;
                        sum += snode.layout["weight"];
                    }
                }
            }
        }
        
        
        function calcSpan(node, unitDegree) {
            node.layout["span"] = node.layout["weight"] * unitDegree;
        }
        
        
        function insertToParent(node) {
            if (node.parent) {
                node.parent.elements["body"].appendChild(node.elem);
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
            
            function adjust(node) {
                if (isNode(node)) {
                    reloadSubnodes(node);
                    var path = [];
                    while (! node.parent == null) { // not the root node
                        path.push(node);
                        node = node.parent;
                    }
                    for (var node of path) {
                        calculateBodyLayout(node);
                        calculateVBranchLayout(node);
                        updateDisplay(node);
                        for (var snode of node.subnodes) {
                            updatePosition(snode);
                        }
                    }
                } else {
                    throw WebTreeError("Rectangular.adjust", "Expecting a node, given:", node);
                }
            }
            
            
            function init(root) {
                setUpLayout(root);
                calculateLayoutParameters(root);
                dfs(root, updatePosition);
                dfs(root, updateDisplay);
                /* This is a trick to accelerate loading.
                 * A browser only renders svg elements when they are inserted into DOM tree.
                 * So WebTree does not insert elements of nodes until the end. Also, the 
                 * insertion is performed in bottom-up fashion.
                 */
                dfs(root, insertToParent);
            }
            
            
            function calculateLayoutParameters(root) {
                dfs(root, calculateBodyLayout);
                dfs(root, calculateVBranchLayout);
                calculateBranchLength(root);
                root.layout["top"] = 0;
            }
            
            
            function calculateBodyLayout(node) {
                if (isLeaf(node)) {
                    node.layout["size"] = node.config["leaf_size"];
                } else if (node.subnodes.length == 0) {
                    // have no child
                    node.layout["size"] = node.config["empty_node_size"];
                } else {
                    var size = 0;
                    for (var snode of node.subnodes) {
                        snode.layout["top"] = size;
                        size += snode.layout["size"];
                    }
                    node.layout["size"] = size;
                }
            }
            
            
            function calculateVBranchLayout(node) {
                if (isLeaf(node) || node.subnodes.length == 0) {
                    node.layout["branch_top"] = 0;
                    node.layout["branch_bot"] = 0;
                    node.layout["joint"] = node.layout["size"] / 2;
                } else {
                    var first = node.subnodes[0];
                    var last = node.subnodes[node.subnodes.length-1];
                    var dist_top = first.layout["joint"];
                    var dist_bot = last.layout["size"] - last.layout["joint"];
                    var branch_top = dist_top;
                    var branch_bot = node.layout["size"] - dist_bot;
                    node.layout["branch_top"] = branch_top;
                    node.layout["branch_bot"] = branch_bot;
                    node.layout["joint"] = (branch_top + branch_bot) / 2;
                }
            }
            
            
            function updatePosition(node) {
                var transform = format("translate(0,%)", 
                                       node.layout["top"]);
                SvgHelper.setAttribute(node.elem, "transform", transform);
            }
            
            
            function updateDisplay (node) {
                branch: {
                    let elem = node.elements["branch"];
                    let d = format("M 0,%  H %", 
                                   node.layout["joint"], 
                                   node.layout["branch_length"]);
                    SvgHelper.setAttribute(elem, "d", d1);
                }
                vertical_branch: {
                    let elem = node.elements["vbranch"];
                    let d = format("M %,%  V %", 
                                   node.layout["branch_length"], 
                                   node.layout["branch_top"], 
                                   node.layout["branch_bot"]);
                    SvgHelper.setAttribute(elem, "d", d2);
                }
                hook: {
                    let elem = node.elements["hook"];
                    let transform = format("translate(%, %)", 
                                           node.layout["branch_length"], 
                                           node.layout["joint"]);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                body: {
                    let elem = node.elements["body"];
                    let transform = format("translate(%,0)", 
                                           node.layout["branch_length"]);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
            }
            
            
            return {
                init: init
            };
        })();
        
        
        
        
        // @layout @@Circular
        var Circular = (function(){            
            
            function init(root) {
                setUpLayout(root);
                calculateLayoutParameters(root);
                updateDisplay(root);
                shiftTree(root);
                dfs(root, insertToParent);
            }
            
            
            function calculateLayoutParameters(root) {
                
                function calculateRotation(root, unitDegree) {
                    root.layout["rotate"] = 0;
                    bfs([root], makerCalcRotate(unitDegree));
                }
                
                function calculateJointAndVBranchLayout(root, unitDegree) {
                    dfs(root, function (node) {
                        if (isLeaf(node) || node.subnodes.length == 0) {
                            node.layout["vbranch_from"] = 0;
                            node.layout["vbranch_to"] = 0;
                            node.layout["joint"] = unitDegree / 2;
                        } else {
                            var first = node.subnodes[0];
                            var last = node.subnodes[node.subnodes.length-1];
                            node.layout["vbranch_from"] = first.layout["joint"];
                            node.layout["vbranch_to"] = last.layout["rotate"] + last.layout["joint"];
                            node.layout["joint"] = (node.layout["vbranch_from"] + node.layout["vbranch_to"]) / 2;
                        }
                    });
                }
                
                function calculateRadius(root) {
                    root.layout["radius"] = root.layout["branch_length"];
                    bfs(root.subnodes, function (node) {
                        var parent_radius = node.parent.layout["radius"];
                        var branch_length = node.layout["branch_length"]
                        node.layout["radius"] = parent_radius + branch_length;
                    });
                }
                
                calculateBranchLength(root);
                calculateRadius(root);
                calculateNodeWeight(root);
                var unitDegree = 360 / root.layout["weight"];
                calculateRotation(root, unitDegree);
                calculateJointAndVBranchLayout(root, unitDegree);
            }
            
            
            function updateDisplay(root) {                
                
                function refreshCapsule(node) {
                    var rotate = format("rotate(%)", node.layout["rotate"]);
                    SvgHelper.setAttribute(node.elem, "rotate", rotate);
                }
                
                function refreshBranchLine(node) {
                    var elem = node.elements["branch"];
                    var d = format("M %,0 h -%",
                                   node.layout["radius"],
                                   node.layout["branch_length"]);
                    var transform = format("rotate(%)", node.layout["joint"]);
                    SvgHelper.setAttribute(elem, "d", d);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                function refreshVBranchLine(node) {
                    var elem = node.elements["vbranch"];
                    var delta = node.layout["vbranch_to"] - node.layout["vbranch_from"];
                    var radius = node.layout["radius"];
                    var d = format("M %,0  A %,% 0 %,1 %,%",
                                   radius,
                                   radius, radius,
                                   (delta > 180) ? 1 : 0,
                                   radius * Math.cos(delta * Math.PI / 180),
                                   radius * Math.sin(delta * Math.PI / 180));
                    var transform = format("rotate(%)", node.layout["vbranch_from"]);
                    SvgHelper.setAttribute(elem, "d", d);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                function refreshHook(node) {
                    var elem = node.elements["hook"];
                    var transform = format("rotate(%)  translate(%,0)",
                                           node.layout["joint"],
                                           node.layout["radius"]);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                dfs(root, function (node) {
                    refreshCapsule(node);
                    refreshBranchLine(node);
                    refreshVBranchLine(node);
                    refreshHook(node);
                });
            }
            
            
            function shiftTree(root) {
                function R(node) {
                    if (isNode(node)) {
                        return Math.math.apply(null, node.subnodes.map(R));
                    } else {
                        return node.layout["radius"];
                    }
                }
                var radius = R(root);
                var elem = root.elem;
                var transform = format("translate(%, %)", radius, radius);
                SvgHelper.setAttribute(elem, "transform", transform);
            }
            
            
            return {
                init: init
            };
        })();
        
        
        // @layout @@Unrooted
        var Unrooted = (function(){
            
            function init(root) {
                setUpLayout(root);
                calculateLayoutParameters(root);
                updateDisplay(root);
                dfs(root, insertToParent);
                shiftTree(root);
            }
            
            
            function calculateLayoutParameters(root) {
                calculateNodeWeight(root);
                setUnitDegree(root);
                root.layout["rotate"] = 0;
                root.length = 0;
                bfs([root], calcRotate);
                dfs(root, calcSpan);
                calculateBranchLength(root);
            }
            
            
            function updateDisplay(root) {
                
                function refreshCapsule(node) {
                    var elem = node.elem;
                    var transform = format("rotate(%)", node.layout["rotate"]);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                function refreshBranchLine(node) {
                    var elem = node.elements["branch"];
                    var d = format("M 0,0  H %", node.layout["branch_length"]);
                    var transform = format("rotate(%)", node.layout["span"]/2);
                    SvgHelper.setAttribute(elem, "d", d);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                function refreshHook(node) {
                    var elem = node.elements["hook"];
                    var transform = format("rotate(%) translate(%,0)",
                                           node.layout["span"] / 2,
                                           node.layout["branch_length"]);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                function refreshBody(node) {
                    var elem = node.elements["body"];
                    var transform = format("rotate(%) translate(%,0) rotate(%)",
                                        node.layout["span"] / 2,
                                        node.layout["branch_length"],
                                        - node.layout["span"] / 2);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                dfs(root, function (node) {
                    refreshCapsule(node);
                    refreshBranchLine(node);
                    refreshBody(node);
                    refreshHook(node);
                });
            }
            
            
            function shiftTree (root) {
                function S(node) {
                    if (isNode(node)) {
                        for (var snode of node.subnodes) {
                            S(snode);
                        }
                    } else {
                        var m = SvgHelper.getRTM(root.elem, node.elements["hook"]);
                        var x = m.e;
                        var y = m.f;
                        lef = (lef == null || x < lef) ? x : lef;
                        top = (top == null || y < top) ? y : top;
                    }
                }
                var lef = null;
                var top = null;
                S(root);
                SvgHelper.setAttribute(root.elem, "transform", 
                                       format("translate(%,%)", -lef, -top));
            }
            
            
            return {
                init: init
            };
        })();
        
        return {
            Rectangular: Rectangular,
            Circular: Circular,
            Unrooted: Unrooted
        };
    })();
    
    
    
    
    // @recipe
    
    var Recipes = {
        "rectangular": {
            "layout": "Rectangular",
            "branch_length_unit": 4,
            "leaf_size": 32,
            "empty_node_size": 32
        },
        "circular": {
            "layout": "Circular",
            "branch_length_unit": 3,
        },
        "unrooted": {
            "layout": "Unrooted",
            "branch_length_unit": 5,
        }
    };
    
    
    
    
    // @generate
    
    function generateTree(parentElement, descr, config) {
        function modifiersToOperation(modifiers) {
            return function (obj) {
                for (var proc of modifiers) {
                    if (typeof proc != "function") debugger;
               proc(obj);
                }
            };
        }
        function createTree(descr) {
            var name = descr["name"] || "";
            var data = descr["data"] || {};
            var length = descr["length"] || data["branch_length"] || 0;
            if (descr["subnodes"] == undefined || descr["subnodes"].length == 0) {
                return new Leaf(name, length, data, share);
            } else {
                var node = new Node(name, length, data, share);
                for (var sub of descr["subnodes"]) {
                    appendNode(node, createTree(sub));
                }
                return node;
            }
        }
        var share = {};
        var root = createTree(descr);
        dfs(root, function(node) {
            Elements.standard(node);
            node.config = config;
            node.root = root;
        })
        parentElement.appendChild(root.elem);
        Layout[config["layout"]].init(root);
        var processNode = modifiersToOperation(config["node_modifiers"]);
        var processLeaf = modifiersToOperation(config["leaf_modifiers"]);
        var processTree = modifiersToOperation(config["tree_modifiers"]);
        dfs(root, function(node){
            if (isNode(node)) {
                processNode(node);
            } else {
                processLeaf(node);
            }
        });
        processTree(root);
        return root;
    }
    
    function deepcopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    return (function(){
        function rectangular(descr, conf) {
            var config = Object.assign({}, Recipes["rectangular"], conf);
            return load(descr, config);
        }
        function circular(descr, conf) {
            var config = Object.assign({}, Recipes["circular"], conf);
            return load(descr, config);
        }
        function unrooted(descr, conf) {
            var config = Object.assign({}, Recipes["unrooted"], conf);
            return load(descr, config);
        }
        function load(descr, conf) {
            // raw_recipe ==> recipe
            var baseConf = Recipes[conf["layout"]];
            var config = Object.assign({}, baseConf, conf);
            var extensions = conf.extensions || [];
            config["node_modifiers"] = [];
            config["leaf_modifiers"] = [];
            config["tree_modifiers"] = [];
            for (var e of extensions) {
                var l = e["leaf_modifier"];
                var n = e["node_modifier"];
                var t = e["tree_modifier"];
                if (l != null) {
                    config["leaf_modifiers"].push(l);
                }
                if (n != null) {
                    config["node_modifiers"].push(n);
                }
                if (t != null) {
                    config["tree_modifiers"].push(t);
                }
            }
            // container
            console.log("Generating tree with config: ", config);
            var svg = SvgHelper.createSvg();
            svg.style.stroke = "black";
            var root = generateTree(svg, descr, config);
            return {
                "element": svg,
            "root": root
            };
        }
        
        return {
            Recipes: Recipes,
            rectangular: rectangular,
            circular: circular,
            unrooted: unrooted,
            load: load
        };
    })();
})();
