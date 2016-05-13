
var root
function main() {
    root = WebTree.rectangular({
	"name": "root",
	"data": {
	    "branch_length": 1,
	},
	"children": [
	    {
		"name": "A",
		"data": {
		    "branch_length": 2,
		},
	    },
	    {
		"name": "B",
		"data": {
		    "branch_length": 1,
		},
		"children": [
		    {
			"name": "C",
			"data": {
			    "branch_length": 1,
			},
		    },
		    {
			"name": "D",
			"data": {
			    "branch_length": 2,
			},
		    },
		],
	    },
	],
    });
    document.rootElement.appendChild(root.elements["capsule"]);
}

main()
