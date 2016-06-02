(function(WT){
    WT.Binder = {
	operator: function(name, func) {
	    return function (node) {
		node[name] = function(){ return func(node); }
	    };
	},
	listener: function(ename, type, func) {
	    return function (node) {
		node.elements[ename].addEventListener(
		    type, function() { func(node); }
		);
	    }
	},
    };
    WT.Extension = {
	extBranch: function(root) {
	    var maxDepth = 0;
	    root.attributes["depth"] = 0;
	    WT.BFS(root.subnodes, function(node){
		node.attributes["depth"] = node.parent.attributes["depth"] + node.layout["length"];
		maxDepth = Math.max(maxDepth, node.attributes["depth"]);
	    });
	    WT.DFS(root, function(node){
		if (isLeaf(node)) {
		    var delta = maxDepth - node.attributes["depth"];
		    var ebranch = WT.SvgHelper.line(-delta, 0, 0, 0);
		    node.layout["shift"] += delta;
		    node.elements["hook"].appendChild(ebranch);
		    node.elements["ebranch"] = ebranch;
		    // translate
		    var trans = document.querySelector("svg").createSVGTransform();
		    trans.setTranslate(delta, 0);
		    node.elements["hook"].transform.baseVal.appendItem(trans);
		}
	    });
	},
	rotateLabel: function(leaf) {
	    if (leaf.subnodes == undefined) {
		var CTM = leaf.elements["hook"].getCTM();
		if (CTM.a < 0) {
		    var label = leaf.elements["label"];
		    var BOX = label.getBBox();
		    var trans = document.querySelector("svg").createSVGTransform();
		    trans.setRotate(180, 0, 0);
		    leaf.elements["label"].transform.baseVal.appendItem(trans);
		    var trans = document.querySelector("svg").createSVGTransform();
		    trans.setTranslate(-BOX.width, 0);
		    leaf.elements["label"].transform.baseVal.appendItem(trans);
		}
	    }
	},
	select: function(node) {
	    if (node.subnodes == undefined) { // is leaf
		node.select = function() {
		    node.elem.classList.add('selected');
		};
		node.unselect = function() {
		    node.elem.classList.remove('selected');
		};
	    } else {
		node.select = function() {
		    for (var sub of node.subnodes)
			node.select();
		}
		node.unselect = function () {
		    for (var sub of node.subnodes)
			node.unselect();
		}
	    }
	},
	getNodeByName: function(root) {
	    var map = {};
	    WT.DFS(root, function(node){
		map[node.name] = node;
		node.getNodeByName = function(name) { return map[name]; }
	    });
	}
    }
})(WebTree);
