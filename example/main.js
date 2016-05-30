"use strict";

var tree = { name: "E", length: 10,
	     subnodes: [{ name: "D", length: 30,
			  subnodes: [{ name: "C", length: 20 },
				     { name: "B", length: 20 }] },
			{ name: "A", length: 20 }] }

var root;
function main() {
    //root = WebTree.rectangular(document.rootElement, tree);
    root = WebTree.circular(document.rootElement, tree);
    //root = WebTree.unrooted(document.rootElement, tree);
    WebTree.DFS(root, function(node){
	if (node.subnodes == undefined) {
	    WebTree.Appendage.label(node);
	    WebTree.Extension.rotateLabel(node);
	}
    });
}

main();
