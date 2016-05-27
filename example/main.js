"use strict";

var tree = { name: "A", length: 10,
	     subnodes: [{ name: "B", length: 30,
			  subnodes: [{ name: "D", length: 20 },
				     { name: "E", length: 20 }] },
			{ name: "C", length: 20 }] }

var root;
function main() {
    //root = WebTree.rectangular(tree);
    //root = WebTree.circular(tree);
    root = WebTree.unrooted(tree);
    document.rootElement.appendChild(root.elem);
    WebTree.DFS(root, function(node){
	if (node.subnodes == undefined) {
	    WebTree.Appendage.label(node);
	    WebTree.Extension.rotateLabel(node);
	}
    });
}

main();
