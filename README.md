# WebTree

WebTree is a JavaScript library which facilitates visualizing tree in HTML and SVG document.




## Supported Layouts

* Rectangular
* Circular
* Unrooted




## Usage

This section illustrates visualizing tree in HTML document. The source code are also included in `example/` directory. 



### Tree Description

The tree to be visualized should be described in the form of a JavaScript object, for example:

```javascript
var description = {
  name: "N1", length: 10,
  subnodes: [
    { name: "N2", length: 30,
      subnodes: [
        { name: "A", length: 10 },
        { name: "B", length: 20 }
      ]
    },
    { name: "C", length: 20 }
  ]
};
```



### Tree Construction

The most simple way looks like this. `"rectangular"` can be replaced with `"circular"` or `"unrooted"` to use the other types of layout. 

```javascript
var tree = WebTree.load("rectangular", description);
```

Users can also supply configuration of layout parameters. Wiki page contains a [list of layout parameters and their meanings](https://github.com/KelvinLu1024/WebTree/wiki/List-of-Layout-Parameters). 

```javascript
var tree = WebTree.load("rectangular", description, {
        "branch_length_unit": 10,
        "leaf_span": 50,
    }
);
```

WebTree is shipped with several addons, users can also supply addons while constructing a tree. Wiki page contains a [list of addons and their meanings](https://github.com/KelvinLu1024/WebTree/wiki/List-of-Addons). 

```javascript
var tree = WebTree.load("rectangular", description, {
        "branch_length_unit": 10,
        "leaf_span": 50,
    },
    [ WebTree.Addons.LeafLabel, WebTree.Addons.ExtendBranch ]
);
```


### The Tree Object

The value of `tree` now is an object having 2 properties: `element` and `root`. 

`tree.element` is a `<svg>` element. Users can directly insert it to `<body>`. 

```javascript
document.getElementsByTagName("body")[0].appendChild(tree.element);
```

`tree.root` is for addon developers and power users. It is safe to ignore it.



### Shortcuts

Sometimes, it is desirable to construct many trees in the same layout. So WebTree provides three more tree constructor: `WebTree.rectangular`, `WebTree.circular` and `WebTree.unrooted`. Their usages are almost the same as `WebTree.load`, except that they ommits the first parameter. In a nut shell, `WebTree.rectangular(...)` is exactly the same as `WebTree.load("rectangular", ...)`. 




## See also

As WebTree takes JSON as input, you may need [a parser for Newick](https://github.com/KelvinLu1024/newick.js) or [a parser for PhyloXML](https://github.com/KelvinLu1024/phyloxml.js)
