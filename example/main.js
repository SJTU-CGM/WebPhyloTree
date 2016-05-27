"use strict";

//var filename = "example.newick";
var filename = "tree-of-life.newick";

function main() {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = load;
    xhr.open("GET", filename);
    xhr.send();

    function load() {
	if (xhr.readyState === XMLHttpRequest.DONE) {
	    if (xhr.status === 200) {
		var tree = parseNewick(xhr.responseText);
		loadTree(tree);
	    } else {
		alert('There was a problem with the request.');
	    }
	}
    }
}

var root;
function loadTree(tree) {
    //root = WebTree.rectangular(tree);
    //root = WebTree.circular(tree);
    root = WebTree.unrooted(tree);
    document.rootElement.appendChild(root.element);
    WebTree.DFS(root, function(node){
	if (node.is_leaf) {
	    WebTree.Extensions.labelRotate(node);
	}
    });
}

main();
