var WebTree = (function(){
    function sum(_) {
	var s = 0;
	for (var n of arguments) {
	    s += n;
	}
	return s;
    }
    function log() {
	console.log.apply(null, arguments)
    }
    function apply(func, arr) {
	func.apply(null, arr);
    }
    function dfs(node, func) {
	if (node.is_node) {
	    for (var child of node.children) {
		dfs(child, func);
	    }
	}
	func(node);
    }
    function bfs(queue, func) {
	while (queue.length > 0) {
	    var node = queue.shift();
	    func(node);
	    for (var child of node.children) {
		queue.push(child);
	    }
	}
    }
    // Node constructor
    function Node(name, data) {
	this.name = name;
	this.parent = null;
	this.data = data;
	this.children = [];
	return this;
    }
    Node.prototype = {
	is_node: true, is_leaf: false,
	appendChild: function(child) {
	    this.children.push(child);
	    child.parent = this;
	}
    }
    // Leaf constructor
    function Leaf(name, data) {
	this.name = name;
	this.parent = null;
	this.data = data;
	return this;
    }
    Leaf.prototype = {
	is_node: false, is_leaf: true,
	appendChild: function(_) {
	    debugger;
	},
    }






    
    // elements
    function addPackingElements(node) {
	var caps = SvgHelper.g();
	var core = SvgHelper.g();
	var body = SvgHelper.g();
	SvgHelper.append(caps, core);
	SvgHelper.append(caps, body);
	node.elements = {
	    "capsule": caps,
	    "core": core,
	    "body": body,
	}
    }
    function addBranchLineElement(node) {
	var brch = SvgHelper.path();
	var brchGroup = SvgHelper.g();
	SvgHelper.append(brchGroup, brch);
	SvgHelper.append(node.elements["capsule"], brchGroup);
	Object.assign(node.elements, {
	    "branch_line": brch,
	    "branch_group": brchGroup
	})
    }
    function addVBranchLineElement(node) {
	var vbrch = SvgHelper.path();
	SvgHelper.append(node.elements["branch_group"], vbrch);
	node.elements["vbranch_line"] = vbrch;
    }
    function addStandardElements(node) {
	addPackingElements(node);
	addBranchLineElement(node);
	addVBranchLineElement(node);
    }


    
    function viewerSupport(node, config) {
	node.style = {
	    "branch_unit": 32,
	};
	node.layout = {};
    }
    function dynamicViewerSupport(node, config) {
	viewerSupport(node, config);
	node.operations = {};
	node.attributes = {};
    }



    // @widget
    var widget = {
	label: function (node, config) {
	    var label = SvgHelper.text(node.name);
	    SvgHelper.append(node.elements["core"], label);
	    node.elements["label"] = label;
	},
	labelButton: function(node, config) {
	    var labelBtn = SvgHelper.rect(0, -16, 50, 28);
	    SvgHelper.append(node.elements["core"], labelBtn);
	    node.elements["label_button"] = labelBtn;	    
	},
	button: function (node, config) {
	    var button = SvgHelper.circle(0, 0, 5);
	    SvgHelper.append(node.elements["core"], button);
	    node.elements["button"] = button;
	},
    }


    // @operation
    function operationBinder(name, func) {
	return function (node) {
	    node.operations[name] = function(){ return func(node); }
	};
    }


    // @listener
    var listener = (function(){
	// BEGIN listener
	var exports = {};
	function createBinder(spec) {
	    return function (node) {
		var listener =  function () {
		    spec["listener"].apply(null, [node].concat(Array.from(arguments)));
		};
		SvgHelper.bind(node.elements[spec["elem"]],
			       spec["type"], listener);
	    }
	}
	var specifications = {
	    nodeFold: {
		"elem": "button",
		"type": "click",
		"listener": function(node){
		    if (node.attributes["folded"]) {
			node.children = node.attributes["_children"];
			node.attributes["_children"] = [];
		    } else {
			node.attributes["_children"] = node.children;
			node.children = [];
		    }
		    node.operations.adjustLayout();
		    node.attributes["folded"] = ! node.attributes["folded"];
		},
	    },
	    leafSelect: {
		"elem": "label_button",
		"type": "click",
		"listener": function(node) {
		    node.elements["label_button"].classList.toggle("selected");
		    node.attributes["selected"] = ! node.attributes["selected"];
		}
	    }
	}

	for (var key in specifications) {
	    exports[key] = createBinder(specifications[key]);
	}
	return exports;
	// END listener
    })()


    // @layout
    var layout = (function(){
	var exports = {};
	// Module layout
	exports.rectangular = (function () {
	    function adjust(node) {
		cleanChildren(node);
		var path = [];
		while (node) {
		    path.push(node);
		    node = node.parent;
		}
		for (var node of path) {
		    calcBody(node);
		    calcVBranch(node);
		    calcLength(node);
		    refresh(node);
		}
	    }
	    function cleanChildren(node) {
		while (node.elements["body"].childNodes.length > 0) {
		    node.elements["body"].firstChild.remove();
		}
		node.children.map(insertToParent);
	    }
	    function init(root, config) {
		dfs(root, calcBody);
		dfs(root, calcVBranch);
		dfs(root, calcLength);
		dfs(root, refresh);
		dfs(root, insertToParent);
	    }
	    function calcBody(node) {
		if (node.is_leaf) {
		    node.layout["size"] = 32;
		} else {
		    var size = 0;
		    for (var child of node.children) {
			setTop(child, size);
			size += child.layout["size"];
		    }
		    node.layout["size"] = size;
		}
	    }
	    function calcVBranch(node) {
		if (node.is_leaf || node.children.length == 0) {
		    node.layout["branch_top"] = 0;
		    node.layout["branch_bot"] = 0;
		    node.layout["joint"] = 16;
		} else {
		    var first = node.children[0];
		    var last = node.children[node.children.length-1];
		    node.layout["branch_top"] = first.layout["joint"];
		    node.layout["branch_bot"] = node.layout["size"] - last.layout["size"] + last.layout["joint"];
		    node.layout["joint"] = (node.layout["branch_top"] + node.layout["branch_bot"]) / 2;
		}
	    }
	    function calcLength(node) {
		node.layout["length"] = node.style["branch_unit"] * node.data["branch_length"];
	    }
	    function insertToParent(node) {
		if (node.parent) {
		    SvgHelper.append(node.parent.elements["body"], node.elements["capsule"]);
		}
	    }
	    function setTop(node, top) {
		SvgHelper.attr(node.elements["capsule"], {
		    "transform": SvgHelper.format("translate(0,%)", top)
		})
	    }
	    function refresh (node) {
		refreshBranchLine(node);
		refreshVBranchLine(node);
		refreshCore(node);
		refreshBody(node);
	    }
	    function refreshBranchLine(node) {
		SvgHelper.attr(node.elements["branch_line"], {
		    "d": SvgHelper.format("M 0,%  H %",
					  node.layout["joint"],
					  node.layout["length"])
		})
	    }
	    function refreshVBranchLine(node) {
		SvgHelper.attr(node.elements["vbranch_line"], {
		    "d": SvgHelper.format("M %,%  V %",
					  node.layout["length"],
					  node.layout["branch_top"],
					  node.layout["branch_bot"])
		})
	    }
	    function refreshCore(node) {
		SvgHelper.attr(node.elements["core"], {
		    "transform": SvgHelper.format("translate(%, %)",
						  node.layout["length"],
						  node.layout["joint"]),
		});
	    }
	    function refreshBody(node) {
		var blen = node.layout["length"];
		SvgHelper.attr(node.elements["body"], {
		    "transform": SvgHelper.format("translate(%,0)", blen)
		})
	    }
	    return {
		initLayout: init,
		layoutAdjuster: operationBinder("adjustLayout", adjust),
	    };
	})(); // END layout.rectangular
	return exports;
	// END layout
    })(); 



    // @recipe
    var Recipes = { // [ config, node_pipeline, tree_pipline]
	"rect": {
	    "config": {},
	    "node_pipline": [addStandardElements, dynamicViewerSupport, widget.button,
			     layout.rectangular.layoutAdjuster, listener.nodeFold], 
	    "leaf_pipline": [addStandardElements, dynamicViewerSupport, widget.labelButton, widget.label, listener.leafSelect], 
	    "tree_pipline": [layout.rectangular.initLayout],
	},
    }
    function generateTree(descr, recipe) {
	function piplineToOperation(pipline) {
	    return function (obj) {
		for (var proc of pipline) {
		    if (proc == undefined) {
			debugger;
		    }
		    proc(obj, recipe["config"]);
		}
	    };
	}
	function dfs(descr) {
	    var name = descr["name"];
	    var data = descr["data"];
	    if (typeof descr["children"] == "object" && descr["children"].length > 0) {
		var node = new Node(name, data);
		processNode(node);
		for (var child of descr["children"]) {
		    node.appendChild(dfs(child));
		}
		return node;
	    } else {
		var leaf = new Leaf(name, data);
		processLeaf(leaf);
		return leaf;
	    }
	}		
	var processNode = piplineToOperation(recipe.node_pipline);
	var processLeaf = piplineToOperation(recipe.leaf_pipline);
	var initTree = piplineToOperation(recipe.tree_pipline);
	var root = dfs(descr);
	initTree(root);
	return root;
    }

    
    return {
	rectangular: function(descr) {
	    return generateTree(descr, Recipes["rect"]);
	}
    }
})()
