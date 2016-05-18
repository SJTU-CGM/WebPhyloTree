var WebTree = (function(){
    // @help functions
    function dfs(node, func) {
	if (node.is_node) {
	    for (var child of node.children) {
		dfs(child, func);
	    }
	}
	func(node);
    }
    function bfs(queue, func) {
	queue = queue.slice(0);
	while (queue.length > 0) {
	    var node = queue.shift();
	    func(node);
	    if (node.is_node) {
		for (var child of node.children) {
		    queue.push(child);
		}
	    }
	}
    }
    function member(arr) {
	return function(val) {
	    return arr.indexOf(val) >= 0;
	}
    }

    // @constructor
    function Node(name, length, data) {
	this.name = name;
	this.length = length;
	this.parent = null;
	this.data = data;
	this.children = [];
	return this;
    }
    Node.prototype = {
	is_node: true, is_leaf: false,
	append: function(child) {
	    this.children.push(child);
	    child.parent = this;
	}
    }
    function Leaf(name, length, data) {
	this.name = name;
	this.length = length;
	this.parent = null;
	this.data = data;
	return this;
    }
    Leaf.prototype = {
	is_node: false, is_leaf: true,
	append: function(_) {
	    debugger;
	},
    }

    // @elements
    var Elements = (function(){
	function createCapsule(node) {
	    var caps = SvgHelper.g();
	    node.elements = { "capsule": caps };
	    node.element = caps;
	}
	function addBodyElement(node) {
	    var body = SvgHelper.g();
	    node.element.appendChild(body);
	    node.elements["body"] = body;
	}	    
	function addBranchLineElement(node) {
	    var brch = SvgHelper.path();
	    node.element.appendChild(brch);
	    node.elements["branch"] = brch;
	}
	function addVBranchLineElement(node) {
	    var vbrch = SvgHelper.path();
	    node.element.appendChild(vbrch);
	    node.elements["vbranch"] = vbrch;
	}
	function addCoreElement(node) {
	    var core = SvgHelper.g();
	    node.elements["core"] = core;
	    node.element.appendChild(core);
	}
	function addStandardElements(node) {
	    createCapsule(node);
	    addBodyElement(node);
	    addBranchLineElement(node);
	    addVBranchLineElement(node);
	    addCoreElement(node);
	}
	
	return {
	    standard: addStandardElements,
	};
    })();


    // @base
    var Base = {
	viewer: function(node) {
	    node.layout = {};
	},
	dynamicViewer: function(node) {
	    Base.viewer(node);
	    node.attributes = {};
	},
    };


    // @appendages
    var Appendages = {
	label: function (node) {
	    var label = SvgHelper.text(node.data["label"] || node.name);
	    node.elements["core"].appendChild(label);
	    node.elements["label"] = label;
	},
	labelButton: function(node) {
	    var labelBtn = SvgHelper.rect(0, -16, 50, 28);
	    node.elements["core"].appendChild(labelBtn);
	    node.elements["label_button"] = labelBtn;	    
	},
	button: function (node) {
	    var button = SvgHelper.circle(0, 0, 5);
	    node.elements["core"].appendChild(button);
	    node.elements["button"] = button;
	}
    };
    
    // @binder
    var Binder = {
	operator: function(name, func) {
	    return function (node) {
		node[name] = function(){ return func(node); }
	    };
	},
	listener: function(elem, type, func) {
	    return function (node) {
		SvgHelper.bind(
		    node.elements[elem],
		    type,
		    function() { func(node); }
		);
	    }
	},
    };


    // @extensions
    var Extensions = {
	nodeFold: Binder.listener("button", "click", function(node){
	    var classList = node.element.classList;
	    if (classList.contains("folded")) {
		node.children = node.attributes["_children"];
	    } else {
		node.attributes["_children"] = node.children;
		node.children = [];
	    }
	    node.adjustLayout();
	    classList.toggle("folded");
	}),
	nodeHint: Binder.listener("button", "mouseover", function(node) {
	    SvgHelper.title(node.elements["button"], (node.attributes["hint"] || ""));
	}),
	getClassList: Binder.operator("getClassList", function(node) {
	    return node.element.classList;
	}),
	nameToNode: function(node) {
	    if (node.share.nameToNode == undefined) {
		node.share.nameToNode = {};
	    }
	    node.share.nameToNode[node.name] = node;
	},
	extBranch: function(root) {
	    var maxDepth = 0;
	    root.attributes["depth"] = 0;
	    bfs(root.children, function(node){
		node.attributes["depth"] = node.parent.attributes["depth"] + node.layout["length"];
		maxDepth = Math.max(maxDepth, node.attributes["depth"]);
	    });
	    dfs(root, function(node){
		if (node.is_leaf) {
		    var delta = maxDepth - node.attributes["depth"];
		    var ebranch = SvgHelper.line(-delta, 0, 0, 0);
		    node.elements["core"].appendChild(ebranch);
		    node.elements["ebranch"] = ebranch;
		    var oldAdjust = node.adjustLayout;
		    node.adjustLayout = function(){
			if (oldAdjust != undefined) {
			    oldAdjust();
			}
			var trans = document.querySelector("svg").createSVGTransform();
			trans.setTranslate(delta, 0);
			node.elements["core"].transform.baseVal.appendItem(trans);
		    }
		    node.adjustLayout();
		}
	    });
	},
	labelRotate: function(leaf) {
	    console.log(leaf.name, leaf.element.getCTM());
	    if (leaf.element.getCTM().c < 0) {
		var label = leaf.elements["label"];
		var trans = document.querySelector("svg").createSVGTransform();
		trans.setRotate(180, 0, 0);
		leaf.elements["label"].transform.baseVal.appendItem(trans);
		var trans = document.querySelector("svg").createSVGTransform();
		trans.setTranslate(-label.getBoundingClientRect().width, 0);
		leaf.elements["label"].transform.baseVal.appendItem(trans);
	    }
	}
    }


    // @layout
    var Layout = (function(){
	var L = {}
	function calcLength(node) {
	    node.layout["length"] = node.config["branch_unit"] * node.data["branch_length"];
	}
	function count(root) {
	    dfs(root, function(node) {
		if (node.is_leaf) {
		    node.layout["count"] = 1;
		} else {
		    node.layout["count"] = 0;
		    for (var child of node.children) {
			node.layout["count"] += child.layout["count"];			
		    }
		}
	    });
	}
	function setUnitDegree(root) {
	    root.share["unit"] = 360 / root.layout["count"];
	}
	function calcRotate(node) {
	    if (node.is_node) {
		if (node.children == undefined)
		    debugger;
		var sum = 0;
		for (var child of node.children) {
		    child.layout["rotate"] = sum * node.share["unit"];
		    sum += child.layout["count"];
		}
	    }
	}
	function calcSpan(node) {
	    node.layout["span"] = node.layout["count"] * node.share["unit"];
	}
	function insertToParent(node) {
	    if (node.parent) {
		node.parent.elements["body"].appendChild(node.element);
	    }
	}
	function reloadChildren(node) {
	    if (node.is_node) {
		while (node.elements["body"].childNodes.length > 0) {
		    node.elements["body"].firstChild.remove();
		}
		node.children.map(insertToParent);
	    }
	}
	// @layout @@rectangular
	L.rectangular = (function () {
	    function adjust(node) {
		if (node.is_node) {
		    reloadChildren(node);
		    var path = [];
		    while (node) {
			path.push(node);
			node = node.parent;
		    }
		    for (var node of path) {
			calcBody(node);
			calcVBranch(node);
			refresh(node);
			for (var child of node.children) {
			    refreshCapsule(child);
			}
		    }
		}
	    }
	    function init(root) {
		// set default config
		root.layout["top"] = 0;
		dfs(root, calcBody);
		dfs(root, calcVBranch);
		dfs(root, calcLength);
		dfs(root, refresh);
		dfs(root, insertToParent);
	    }
	    function calcBody(node) {
		if (node.is_leaf) {
		    node.layout["size"] = node.config["size"] != undefined ? node.config["size"] : 32;
		} else {
		    if (node.children.length == 0) {
			node.layout["size"] = node.config["folded_size"] != undefined ? node.config["folded_size"] : 32;
		    } else {
			var size = 0;
			for (var child of node.children) {
			    child.layout["top"] = size;
			    size += child.layout["size"];
			}
			node.layout["size"] = size;
		    }
		}
	    }
	    function calcVBranch(node) {
		if (node.is_leaf || node.children.length == 0) {
		    node.layout["branch_top"] = 0;
		    node.layout["branch_bot"] = 0;
		    node.layout["joint"] = node.layout["size"] / 2;
		} else {
		    var first = node.children[0];
		    var last = node.children[node.children.length-1];
		    node.layout["branch_top"] = first.layout["joint"];
		    node.layout["branch_bot"] = node.layout["size"] - last.layout["size"] + last.layout["joint"];
		    node.layout["joint"] = (node.layout["branch_top"] + node.layout["branch_bot"]) / 2;
		}
	    }
	    function refresh (node) {
		refreshCapsule(node);
		refreshBranchLine(node);
		refreshVBranchLine(node);
		refreshCore(node);
		refreshBody(node);
	    }
	    function refreshCapsule(node) {
		SvgHelper.attr(node.element, {
		    "transform": SvgHelper.format("translate(0,%)", node.layout["top"])
		})		
	    }
	    function refreshBranchLine(node) {
		SvgHelper.attr(node.elements["branch"], {
		    "d": SvgHelper.format("M 0,%  H %",
					  node.layout["joint"],
					  node.layout["length"])
		})
	    }
	    function refreshVBranchLine(node) {
		SvgHelper.attr(node.elements["vbranch"], {
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
		init: init,
		bindAdjuster: Binder.operator("adjustLayout", adjust),
	    };
	})(); 
	// @layout @@circular
	L.circular = (function(){
	    function adjust(node) {
		reloadChildren(node);
		calcVBranch(node);
		refreshVBranchLine(node);
	    }
	    function init(root) {
		count(root);
		setUnitDegree(root);
		root.layout["rotate"] = 0;
		bfs([root], calcRotate);
		dfs(root, calcVBranch);
		dfs(root, calcLength);
		root.layout["radius"] = root.layout["length"];
		bfs(root.children, calcRadius);
		dfs(root, refresh);
		var deep = 0;
		dfs(root, function(node) {
		    deep = Math.max(node.layout["radius"], deep);
		});
		SvgHelper.transform(root.element,
				    SvgHelper.format("translate(%, %)", deep+250, deep+250));
		dfs(root, insertToParent);
	    }
	    function calcVBranch(node) {
		if (node.is_leaf || node.children.length == 0) {
		    node.layout["vbranch_from"] = 0;
		    node.layout["vbranch_to"] = 0;
		    node.layout["joint"] = node.share["unit"] / 2;
		} else {
		    var first = node.children[0];
		    var last = node.children[node.children.length-1];
		    node.layout["vbranch_from"] = first.layout["joint"];
		    node.layout["vbranch_to"] = last.layout["rotate"] + last.layout["joint"];
		    node.layout["joint"] = (node.layout["vbranch_from"] + node.layout["vbranch_to"]) / 2;
		}
	    }
	    function calcRadius(node) {
		node.layout["radius"] = node.parent.layout["radius"] + node.layout["length"];
	    }
	    function refresh (node) {
		refreshCapsule(node);
		refreshBranchLine(node);
		refreshVBranchLine(node);
		refreshCore(node);
	    }
	    function refreshCapsule(node) {
		SvgHelper.transform(node.element,
				    SvgHelper.format("rotate(%)", node.layout["rotate"]));
	    }
	    function refreshBranchLine(node) {
		SvgHelper.attr(node.elements["branch"], {
		    "d": SvgHelper.format("M %,0 h -%", node.layout["radius"], node.layout["length"]),
		    "transform": SvgHelper.format("rotate(%)", node.layout["joint"]),
		});
	    }
	    function refreshVBranchLine(node) {
		var delta = node.layout["vbranch_to"] - node.layout["vbranch_from"];
		var radius = node.layout["radius"];
		SvgHelper.attr(node.elements["vbranch"], {
		    "d": SvgHelper.format("M %,0  A %,% 0 %,1 %,%",
					  radius,
					  radius, radius,
					  (delta > 180) ? 1 : 0,
					  radius * Math.cos(delta * Math.PI / 180),
					  radius * Math.sin(delta * Math.PI / 180)),
		    "transform": SvgHelper.format("rotate(%)", node.layout["vbranch_from"]),
		});
	    }
	    function refreshCore(node) {
		SvgHelper.transform(node.elements["core"],
				    SvgHelper.format("rotate(%)  translate(%,0)",
						     node.layout["joint"],
						     node.layout["radius"]));
	    }
	    return {
		init: init,
		bindAdjuster: Binder.operator("adjustLayout", adjust),
	    };
	})();
	// @layout @@unrooted
	L.unrooted = (function(){
	    function adjust(node) {
		reloadChildren(node);
	    }
	    function init(root) {
		count(root);
		setUnitDegree(root);
		root.layout["rotate"] = 0;
		root.data["branch_length"] = 0;
		calc(root);
		dfs(root, refresh);
		dfs(root, insertToParent);
		var maxDepth = 0;
		root.attributes["depth"] = 0;
		bfs(root.children, function(node){
		    node.attributes["depth"] = node.parent.attributes["depth"] + node.layout["length"];
		    maxDepth = Math.max(maxDepth, node.attributes["depth"]);
		});
		SvgHelper.transform(
		    root.element, SvgHelper.format("translate(%, %)", maxDepth, maxDepth)
		);
	    }
	    function calc(root) {
		bfs([root], calcRotate);
		dfs(root, calcSpan);
		dfs(root, calcLength);		
	    }
	    function refresh(node) {
		refreshCapsule(node);
		refreshBranchLine(node);
		refreshBody(node);
		refreshCore(node);		
	    }
	    function refreshCapsule(node) {
		SvgHelper.transform(
		    node.element,
		    SvgHelper.format("rotate(%)", node.layout["rotate"])
		);
	    }
	    function refreshBranchLine(node) {
		SvgHelper.attr(
		    node.elements["branch"],
		    {
			"d": SvgHelper.format("M 0,0  H %", node.layout["length"]),
			"transform": SvgHelper.format("rotate(%)", node.layout["span"] / 2)
		    }
		);
	    }
	    function refreshCore(node) {
		SvgHelper.transform(
		    node.elements["core"],
		    SvgHelper.format("rotate(%) translate(%,0)",
				     node.layout["span"] / 2,
				     node.layout["length"])
		);
	    }
	    function refreshBody(node) {
		SvgHelper.transform(
		    node.elements["body"],
		    SvgHelper.format("rotate(%) translate(%,0) rotate(%)",
				     node.layout["span"] / 2,
				     node.layout["length"],
				     - node.layout["span"] / 2)
		);
	    }
	    return {
		init: init,
		bindAdjuster: Binder.operator("adjustLayout", adjust),
	    };
	})();
	return L;
    })();

    // @recipe
    var Recipes = {
	"rectangular": {
	    "node_config": {
		"branch_unit": 5,
	    },
	    "node_pipeline": [Elements.standard, Base.dynamicViewer, Layout.rectangular.bindAdjuster, Appendages.button, Extensions.nodeFold], 
	    "leaf_config": {
		"branch_unit": 5,
		"size": 32,
	    },
	    "leaf_pipeline": [Elements.standard, Base.dynamicViewer, Layout.rectangular.bindAdjuster, Appendages.label], 
	    "tree_pipeline": [Layout.rectangular.init, Extensions.extBranch],
	},
	"circular": {
	    "node_config": {
		"branch_unit": 2,
	    },
	    "node_pipeline": [Elements.standard, Base.dynamicViewer, Layout.circular.bindAdjuster], 
	    "leaf_config": {
		"branch_unit": 2,
	    },
	    "leaf_pipeline": [Elements.standard, Base.dynamicViewer, Layout.circular.bindAdjuster, Appendages.label], 
	    "tree_pipeline": [Layout.circular.init, Extensions.extBranch],
	},
	"unrooted": {
	    "node_config": {
		"branch_unit": 5,
	    },
	    "node_pipeline": [Elements.standard, Base.dynamicViewer, Layout.unrooted.bindAdjuster], 
	    "leaf_config": {
		"branch_unit": 5,
	    },
	    "leaf_pipeline": [Elements.standard, Base.dynamicViewer, Layout.unrooted.bindAdjuster, Appendages.label], 
	    "tree_pipeline": [Layout.unrooted.init],
	}
    };

    // @generate
    function generateTree(descr, recipe) {
	function pipelineToOperation(pipeline) {
	    return function (obj) {
		for (var proc of pipeline) {
		    proc(obj);
		}
	    };
	}
	function createTree(descr) {
	    var name = descr["name"], data = descr["data"] || {};
	    var length = (descr["length"] != undefined) ? descr["length"] : data["branch_length"];
	    length = (length != undefined) ? length : 1;
	    data["branch_length"] = length;
	    if (typeof descr["children"] == "object" && descr["children"].length > 0) {
		var node = new Node(name, length, data);
		for (var child of descr["children"]) {
		    node.append(createTree(child));
		}
		return node;
	    } else {
		var leaf = new Leaf(name, length, data);
		return leaf;
	    }
	}
	var processNode = pipelineToOperation(recipe["node_pipeline"]);
	var processLeaf = pipelineToOperation(recipe["leaf_pipeline"]);
	var initTree = pipelineToOperation(recipe["tree_pipeline"]);
	var root = createTree(descr);
	var shareDict = {};
	dfs(root, function(node){
	    node.share = shareDict;
	    node.config = recipe[(node.is_node ? "node_config" : "leaf_config")];
	    (node.is_node ? processNode : processLeaf)(node);
	})
	initTree(root);
	return root;
    }
    
    return {
	DFS: dfs, BFS: bfs,
	Binder: Binder,
	Appendages: Appendages,
	Extensions: Extensions,
	Recipes: Recipes,
	rectangular: function(descr) {
	    return generateTree(descr, Recipes["rectangular"]);
	},
	circular: function(descr) {
	    return generateTree(descr, Recipes["circular"]);
	},
	unrooted: function(descr) {
	    return generateTree(descr, Recipes["unrooted"]);
	},
	load: function(tree_descr, raw_recipe) {
	    var recipe = {};
	    var layoutEngine = Layout[raw_recipe["layout"]];
	    var pipeline = [].concat(
		[Elements.standard, Base.dynamicViewer, layoutEngine.bindAdjuster],
		(raw_recipe["pipeline"] || [])
	    );
	    recipe["node_config"] = Object.assign(
		{
		    "branch_unit": 10,
		},
		raw_recipe["config"],
		raw_recipe["node_config"]
	    );
	    recipe["leaf_config"] = Object.assign(
		{
		    "branch_unit": 10,
		},
		raw_recipe["config"],
		raw_recipe["leaf_config"]
	    );
	    recipe["node_pipeline"] = pipeline.concat((raw_recipe["node_pipeline"] || []));
	    recipe["leaf_pipeline"] = pipeline.concat((raw_recipe["leaf_pipeline"] || []));
	    recipe["tree_pipeline"] = [layoutEngine.init].concat((raw_recipe["tree_pipeline"] || []));
	    return generateTree(tree_descr, recipe);
	},
	expert: function(descr, recipe) {
	    return generateTree(descr, recipe);
	}
    }
})()
