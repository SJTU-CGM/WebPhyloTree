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
                addBodyElement(node);
                addBranchLineElement(node);
                addVBranchLineElement(node);
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
            dfs(root, function(node) {
                var unit = node.share.config["branch_length_unit"];
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
        
        
        function calculateSize(root) {
            dfs(root, function(node){
                node.layout["size"] = 0;
            });
        }
        
        
        function calculateNodeWeight(root) {
            dfs(root, function(node) {
                if (isLeaf(node)) {
                    node.layout["weight"] = 1;
                } else if (node.subnodes.length == 0) {
                    node.layout["weight"] = node.share.config["empty_node_weight"];
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
            }
            
            
            function calculateLayoutParameters(root) {
                
                function calculateSpanAndTop(root) {
                    function C(node) {
                        if (isLeaf(node)) {
                            node.layout["span"] = node.share.config["leaf_span"];
                        } else if (node.subnodes.length == 0) {
                            node.layout["span"] = node.share.config["empty_node_span"];
                        } else {
                            var span = 0;
                            for (var snode of node.subnodes) {
                                snode.layout["top"] = span;
                                C(snode);
                                span += snode.layout["span"];
                            }
                            node.layout["span"] = span;
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
                            node.layout["joint"] = node.layout["span"] / 2;
                        } else {
                            node.subnodes.map(C);
                            var first = node.subnodes[0];
                            var last = node.subnodes[node.subnodes.length-1];
                            var dist_top = first.layout["joint"];
                            var dist_bot = last.layout["span"] - last.layout["joint"];
                            var vbranch_top = dist_top;
                            var vbranch_bot = node.layout["span"] - dist_bot;
                            node.layout["vbranch_top"] = vbranch_top;
                            node.layout["vbranch_bot"] = vbranch_bot;
                            node.layout["joint"] = (vbranch_top + vbranch_bot) / 2;
                        }
                    }
                    C(root);
                }
                
                calculateSpanAndTop(root);
                calculateVBranchAndJoint(root);
                calculateBranchLength(root);
                calculateShift(root);
                calculateSize(root);
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
            
            return {
                init: init,
                updateDisplay: updateDisplay,
                positionTree: function (... any) { return }
            };
        })();
        
        
        
        
        // @layout @@Circular
        var Circular = (function(){            
            
            function init(root) {
                setUpLayout(root);
                calculateLayoutParameters(root);
                updateDisplay(root);
                positionTree(root);
                dfs(root, insertToParent);
            }
            
            
            function calculateLayoutParameters(root) {
                
                function calculateJointAndVBranchLayout(root, unitDegree) {
                    function C(node) {
                        if (isLeaf(node) || node.subnodes.length == 0) {
                            node.layout["vbranch_from"] = 0;
                            node.layout["vbranch_to"] = 0;
                            node.layout["joint"] = node.layout["weight"] * unitDegree / 2;
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
                calculateSize(root);
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
            
            
            function positionTree(root) {
                function R(node) {
                    if (isNode(node)) {
                        return Math.max.apply(null, node.subnodes.map(R));
                    } else {
                        return node.layout["inner_radius"] + node.layout["hook_shift"] + node.layout["size"];
                    }
                }
                var radius = R(root);
                var elem = root.elements["main"];
                var transform = format("translate(%, %)", radius, radius);
                SvgHelper.setAttribute(elem, "transform", transform);
            }
            
            
            return {
                init: init,
                updateDisplay: updateDisplay,
                positionTree: positionTree
            };
        })();
        
        
        
        
        // @layout @@Unrooted
        var Unrooted = (function(){
            
            function init(root) {
                setUpLayout(root);
                calculateLayoutParameters(root);
                updateDisplay(root);
                dfs(root, insertToParent);
                positionTree(root);
            }
            
            
            function calculateLayoutParameters(root) {
                
                function calculateSpan(root, unitDegree) {
                    dfs(root, function (node) {
                        node.layout["span"] = node.layout["weight"] * unitDegree;
                    });
                }
        
                calculateNodeWeight(root);
                var unitDegree = 360 / root.layout["weight"];
                calculateRotation(root, unitDegree);
                calculateSpan(root, unitDegree);
                // idiosyncrasy of unrooted trees.
                root.length = 0;
                calculateBranchLength(root);
                calculateShift(root);
                calculateSize(root);
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
                    var transform = format("rotate(%)", node.layout["span"]/2);
                    SvgHelper.setAttribute(elem, "d", d);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                function refreshHook(node) {
                    var elem = node.elements["hook"];
                    var transform = format("rotate(%) translate(%,0)",
                                        node.layout["span"] / 2,
                                        node.layout["hook_shift"]);
                    SvgHelper.setAttribute(elem, "transform", transform);
                }
                
                function refreshBody(node) {
                    var elem = node.elements["body"];
                    var transform = format("rotate(%) translate(%,0) rotate(%)",
                                        node.layout["span"] / 2,
                                        node.layout["body_shift"],
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
            
            
            function positionTree (root) {
                function S(node) {
                    if (isNode(node)) {
                        for (var snode of node.subnodes) {
                            S(snode);
                        }
                    } else {
                        var m = SvgHelper.getRTM(root.elements["main"], node.elements["hook"]);
                        var x = m.e - node.layout["size"];
                        var y = m.f - node.layout["size"];
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
            
            
            return {
                init: init,
                updateDisplay: updateDisplay,
                positionTree: positionTree
            };
        })();
        
        return {
            "rectangular": Rectangular,
            "circular": Circular,
            "unrooted": Unrooted
        };
    })();
    
    
    
    
    // @recipe
    
    var Recipes = {
        "rectangular": {
            "branch_length_unit": 4,
            "leaf_span": 32,
            "empty_node_span": 32,
            "leaf_label_size": 32,
            "class_prefix": "webtree-"
        },
        "circular": {
            "branch_length_unit": 3,
            "empty_node_weight": 1,
            "leaf_label_size": 32,
            "class_prefix": "webtree-"
        },
        "unrooted": {
            "branch_length_unit": 5,
            "empty_node_weight": 1,
            "leaf_label_size": 32,
            "class_prefix": "webtree-"
        }
    };
    
    
    
    
    // @addons
    
    var Addons = {
        ElementClass: {
            process: function (root) {
                var prefix = root.share.config["class_prefix"];
                dfs(root, function(node) {
                    for (var elename in node.elements) {
                        var elem = node.elements[elename];
                        SvgHelper.setAttribute(elem, "class", prefix + elename);
                    }
                });
            }
        },
        LeafLabel: {
            process: function (root) {
                
                function autoFlipCircular(root) {
                    function R(node, absRotation) {
                        absRotation += node.layout["rotation"];
                        if (node.type == "node") {
                            for (var snode of node.subnodes) {
                                R(snode, absRotation);
                            }
                        } else {
                            var degree = absRotation + node.layout["joint"];
                            if (degree > 90 && degree < 270) {
                                var elem = node.elements["leaf_label"];
                                SvgHelper.setAttribute(elem, "text-anchor", "end");
                                SvgHelper.setAttribute(elem, "transform", "rotate(180)");
                            }
                        }
                    }
                    R(root, 0);
                }
                
                function autoFlipUnrooted(root) {
                    function R(node, absRotation) {
                        absRotation += node.layout["rotation"];
                        if (node.type == "node") {
                            for (var snode of node.subnodes) {
                                R(snode, absRotation);
                            }
                        } else {
                            var degree = absRotation + (node.layout["span"] / 2);
                            if (degree > 90 && degree < 270) {
                                var elem = node.elements["leaf_label"];
                                SvgHelper.setAttribute(elem, "text-anchor", "end");
                                SvgHelper.setAttribute(elem, "transform", "rotate(180)");
                            }
                        }
                    }
                    R(root, 0);
                }
                
                function P(node, absoluteRotation) {
                    absoluteRotation += node.layout["rotation"];
                    if (node.type == "node") {
                        for (var snode of node.subnodes) {
                            P(snode, absoluteRotation);
                        }
                    } else {
                        var name = node.name;
                        var elem = SvgHelper.create("text");
                        SvgHelper.setAttribute(elem, "dominant-baseline", "central");
                        elem.appendChild(document.createTextNode(name));
                        node.elements["hook"].appendChild(elem);
                        node.elements["leaf_label"] = elem;
                        // so that the tree is position properly
                        node.layout["size"] += node.share.config["leaf_label_size"];
                    }
                }
                
                P(root, 0);
                if (root.share.layoutEngine === Layout["circular"]) {
                    autoFlipCircular(root);
                } else if (root.share.layoutEngine === Layout["unrooted"]) {
                    autoFlipUnrooted(root);
                }
                root.share.layoutEngine.positionTree(root);
            }
        },
        ExtendBranch: {
            process: function (root) {
                
                function D(node) {
                    if (node.type == "node") {
                        return node.layout["hook_shift"] + Math.max.apply(null, node.subnodes.map(D));
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
                root.share.layoutEngine.positionTree(root);
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
        
        function load(layoutType, descr, rawConfig, addons) {
            
            function makeConfig(layoutType, rawConfig) {
                var baseConfig = Recipes[layoutType];
                // merge config
                return Object.assign({}, baseConfig, rawConfig);
            }
            
            function makeSvgCanvas() {
                var svg = SvgHelper.createSvg();
                svg.style.stroke = "black";
                return svg;
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
                var LayoutEngine = Layout[layoutType];
                root.share.config = config;
                root.share.layoutEngine = LayoutEngine;
                LayoutEngine.init(root);
                
            }
            
            var rawConfig = rawConfig || {};
            var addons = addons || [];
            var svg = makeSvgCanvas();
            var config = makeConfig(layoutType, rawConfig);
            var root = makeTree(descr);
            initializeElements(root);
            initializeLayout(root, layoutType, config);
            svg.appendChild(root.elements["main"]);
            // trigger addons
            for (var addon of addons) {
                addon.process(root);
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
