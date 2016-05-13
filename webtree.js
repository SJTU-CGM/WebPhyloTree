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
    function dfs(node, func) {
	if (node.is_node) {
	    for (var child of node.children) {
		dfs(child, func);
	    }
	}
	func(node);
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
	    console.log(this);
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
	var body = SvgHelper.g();
	SvgHelper.append(caps, body);
	node.elements = {
	    "capsule": caps,
	    "body": body
	}
    }
    function addBranchLineElement(node) {
	var brch = SvgHelper.line();
	var brchGroup = SvgHelper.g();
	SvgHelper.append(brchGroup, brch);
	SvgHelper.append(node.elements["capsule"], brchGroup);
	Object.assign(node.elements, {
	    "branch_line": brch,
	    "branch_group": brchGroup
	})
    }
    function addVBranchLineElement(node) {
	var vbrch = SvgHelper.line();
	SvgHelper.append(node.elements["branch_group"], vbrch);
	node.elements["vbranch_line"] = vbrch;
    }
    function addLabel(node) {
	var label = SvgHelper.text(node.name);
	SvgHelper.append(node.elements["body"], label);
	node.elements["label"] = label;
    }
    function addStandardElements(node) {
	addPackingElements(node);
	addBranchLineElement(node);
	addVBranchLineElement(node);
    }


    
    // style
    function addStyle(node) {
	node.style = {
	    "branch_unit": 32,
	};
    }


    // layout
    var layout = (function(){
	var exports = {};
	// Module layout
	exports.rectangular = (function () {
	    var defalutLeafLayout = {
		"size": 30,
		"joint": 15
	    };
	    function init (node, config) {
		var leaf_layout = Object.assign({}, defalutLeafLayout, (config.layout && config.layout.leaf));
		dfs(node, function(node) {
		    if (node.is_leaf) {
			node.layout = Object.assign({}, leaf_layout, {
			    "length": node.data["branch_length"] * node.style["branch_unit"]			
			})
			refresh(node);
		    } else {
			var sumh = 0;
			for (var child of node.children) {
			    setTop(child, sumh);
			    sumh += child.layout["size"];
			}
			var btop = node.children[0].layout["joint"];
			var bbot = sumh - child.layout["size"] + child.layout["joint"];
			node.layout = {
			    "size": sumh,
			    "joint": (btop + bbot) / 2,
			    "branch_top": btop,
			    "branch_bot": bbot,
			    "length": node.data["branch_length"] * node.style["branch_unit"]
			}
			refresh(node);
			for (var child of node.children) {
			    SvgHelper.append(node.elements["body"], child.elements["capsule"]);
			}
		    }
		});
		/*
		if (node.is_node) {
		    var sumh = 0;
		    for (var child of node.children) {
			init(child, leaf_layout);
			setTop(child, sumh);
			sumh += child.layout["size"];
		    }
		    var btop = node.children[0].layout["joint"];
		    var bbot = sumh - child.layout["size"] + child.layout["joint"];
		    node.layout = {
			"size": sumh,
			"joint": (btop + bbot) / 2,
			"branch_top": btop,
			"branch_bot": bbot,
			"length": node.data["branch_length"] * node.style["branch_unit"]
		    }
		    refresh(node);
		    for (var child of node.children) {
			SvgHelper.append(node.elements["body"], child.elements["capsule"]);
		    }
		} else {
		    node.layout = Object.assign({}, leaf_layout, {
			"length": node.data["branch_length"] * node.style["branch_unit"]			
		    })
		    refresh(node);
		}*/
	    }
	    function setTop(node, top) {
		SvgHelper.attr(node.elements["capsule"], {
		    "transform": SvgHelper.format("translate(0,%)", top)
		})
	    }
	    function refresh (node) {
		if (node.is_node) {
		    refreshBranchLine(node);
		    refreshVBranchLine(node);
		    refreshBody(node);
		} else {
		    refreshBranchLine(node);
		    refreshBody(node);
		    refreshLabel(node);
		}
	    }
	    function refreshBranchLine(node) {
		SvgHelper.attr(node.elements["branch_line"], {
		    "x1": 0,
		    "x2": node.layout["length"],
		    "y1": node.layout["joint"],
		    "y2": node.layout["joint"],
		})
	    }
	    function refreshVBranchLine(node) {
		SvgHelper.attr(node.elements["vbranch_line"], {
		    "x1": node.layout["length"],
		    "x2": node.layout["length"],
		    "y1": node.layout["branch_top"],
		    "y2": node.layout["branch_bot"],
		})
	    }
	    function refreshBody(node) {
		var blen = node.layout["length"];
		SvgHelper.attr(node.elements["body"], {
		    "transform": SvgHelper.format("translate(%,0)", blen)
		})
	    }
	    function refreshLabel(node) {
		SvgHelper.attr(node.elements["label"], {
		    "transform": SvgHelper.format("translate(0,%)", node.layout["joint"]),
		    "dominant-baseline": "central",
		});
	    }
	    return {
		init: init, refresh: refresh
	    };
	})(); // END layout.rectangular

	exports.circular = (function(){
	    // BEGIN layout.circular
	    function init(node) {}
	    // END layout.circular
	})();
	
	return exports;
	// END layout
    })(); 



    
    var Recipes = { // [ config, node_pipeline, tree_pipline]
	"rect_view": {
	    "config": {},
	    "node_pipline": [addStandardElements, addStyle], 
	    "leaf_pipline": [addStandardElements, addLabel, addStyle], 
	    "tree_pipline": [layout.rectangular.init],
	},
    }
    function generateTree(descr, recipe) {
	function piplineToOperation(pipline) {
	    return function (obj) {
		for (var proc of pipline) {
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
	    return generateTree(descr, Recipes["rect_view"]);
	}
    }
})()
