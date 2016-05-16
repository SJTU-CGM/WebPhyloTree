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
    function Node(name, data) {
	this.name = name;
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
    function Leaf(name, data) {
	this.name = name;
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
	function addPackingElements(node) {
	    var caps = SvgHelper.g();
	    var body = SvgHelper.g();
	    var bchg = SvgHelper.g();
	    var core = SvgHelper.g();
	    SvgHelper.append(caps, body);
	    SvgHelper.append(caps, bchg);
	    SvgHelper.append(caps, core);
	    node.elements = {
		"capsule": caps,
		"core": core,
		"branch_group": bchg,
		"body": body,
	    }
	}
	function addBranchLineElement(node) {
	    var brch = SvgHelper.path();
	    SvgHelper.append(node.elements["branch_group"], brch);
	    node.elements["branch_line"] = brch;
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
	    node.operations = {};
	    node.attributes = {};
	},
    };


    // @appendages
    var Appendages = {
	label: function (node) {
	    var label = SvgHelper.text(node.data["label"] || node.name);
	    SvgHelper.append(node.elements["core"], label);
	    node.elements["label"] = label;
	},
	labelButton: function(node) {
	    var labelBtn = SvgHelper.rect(0, -16, 50, 28);
	    SvgHelper.append(node.elements["core"], labelBtn);
	    node.elements["label_button"] = labelBtn;	    
	},
	button: function (node) {
	    var button = SvgHelper.circle(0, 0, 5);
	    SvgHelper.append(node.elements["core"], button);
	    node.elements["button"] = button;
	}
    };
    
    // @binder
    var Binder = {
	operator: function(name, func) {
	    return function (node) {
		node.operations[name] = function(){ return func(node); }
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
	    var classList = node.elements["capsule"].classList;
	    if (classList.contains("folded")) {
		node.children = node.attributes["_children"];
	    } else {
		node.attributes["_children"] = node.children;
		node.children = [];
	    }
	    node.operations.adjustLayout();
	    classList.toggle("folded");
	}),
	nodeHint: Binder.listener("button", "mouseover", function(node) {
	    SvgHelper.title(node.elements["button"], (node.attributes["hint"] || ""));
	}),
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
	function insertToParent(node) {
	    if (node.parent) {
		SvgHelper.append(node.parent.elements["body"], node.elements["capsule"]);
	    }
	}
	function reloadChildren(node) {
	    while (node.elements["body"].childNodes.length > 0) {
		node.elements["body"].firstChild.remove();
	    }
	    node.children.map(insertToParent);
	}
	// @layout @@rectangular
	L.rectangular = (function () {
	    function adjust(node) {
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
		    node.layout["size"] = node.config["size"]
		} else {
		    if (node.children.length == 0) {
			node.layout["size"] = node.config["folded_size"];
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
		    node.layout["joint"] = 16;
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
		SvgHelper.attr(node.elements["capsule"], {
		    "transform": SvgHelper.format("translate(0,%)", node.layout["top"])
		})		
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
		SvgHelper.transform(root.elements["capsule"],
				    SvgHelper.format("translate(%, %)", deep, deep));
		dfs(root, insertToParent);
	    }
	    function calcVBranch(node) {
		if (node.is_leaf || node.children.length == 0) {
		    node.layout["vbranch_from"] = 0;
		    node.layout["vbranch_to"] = 0;
		    node.layout["joint"] = node.layout["unit"] / 2;
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
		SvgHelper.transform(node.elements["capsule"],
				    SvgHelper.format("rotate(%)", node.layout["rotate"]));
	    }
	    function refreshBranchLine(node) {
		SvgHelper.attr(node.elements["branch_line"], {
		    "d": SvgHelper.format("M %,0 h -%", node.layout["radius"], node.layout["length"]),
		    "transform": SvgHelper.format("rotate(%)", node.layout["joint"]),
		});
	    }
	    function refreshVBranchLine(node) {
		var delta = node.layout["vbranch_to"] - node.layout["vbranch_from"];
		var radius = node.layout["radius"];
		console.log(node.name, delta);
		SvgHelper.attr(node.elements["vbranch_line"], {
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
		dfs(root, refresh);
		dfs(root, insertToParent);
		SvgHelper.transform(
		    root.elements["capsule"],
		    "translate(500, 300)"
		);
	    }
	    function calc(root) {
		bfs([root], calcRotate);
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
		    node.elements["capsule"],
		    SvgHelper.format("rotate(%)", node.layout["rotate"])
		);
	    }
	    function refreshBranchLine(node) {
		SvgHelper.attr(
		    node.elements["branch_line"],
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
		"branch_unit": 50,
	    },
	    "node_pipeline": [Elements.standard, Base.dynamicViewer, Appendages.button], 
	    "leaf_config": {
		"branch_unit": 50,
		"size": 32,
	    },
	    "leaf_pipeline": [Elements.standard, Base.dynamicViewer, Appendages.label], 
	    "tree_pipeline": [Layout.rectangular.init],
	},
	"unrooted": {
	    "node_config": {
		"branch_unit": 50,
	    },
	    "node_pipeline": [Elements.standard, Base.dynamicViewer], 
	    "leaf_config": {
		"branch_unit": 50,
		"size": 32,
	    },
	    "leaf_pipeline": [Elements.standard, Base.dynamicViewer, Appendages.label], 
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
	    if (typeof descr["children"] == "object" && descr["children"].length > 0) {
		var node = new Node(descr["name"], descr["data"]);
		for (var child of descr["children"]) {
		    node.append(createTree(child));
		}
		return node;
	    } else {
		var leaf = new Leaf(descr["name"], descr["data"]);
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
	Binder: Binder,
	Appendages: Appendages,
	Extensions: Extensions,
	Recipes: Recipes,
	rectangular: function(descr) {
	    return generateTree(descr, Recipes["rectangular"]);
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
		    "node_size": 32,
		},
		raw_recipe["config"],
		raw_recipe["node_config"]
	    );
	    recipe["leaf_config"] = Object.assign(
		{
		    "branch_unit": 10,
		    "leaf_size": 32,
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
