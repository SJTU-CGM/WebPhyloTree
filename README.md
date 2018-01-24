# WebPhyloTree

WebPhyloTree is a JavaScript library which helps visualizing tree in HTML and SVG document. The primary function of WebPhyloTree is to  translate a description of tree into a DOM tree of SVG elements (or, the display of the tree). Users can customize the display by setting layout parameters or enabling addons. The tree can be either static or interactive, depending on enabled addons.




## Supported Layouts

* Rectangular
* Circular
* Unrooted




## Usage

This section illustrates visualizing tree in HTML document. The source code are also included in `example/` directory. 



### Tree Description

The tree to be visualized should be described as a JavaScript object (see [Specification of Tree Description](https://github.com/SJTU-CGM/WebPhyloTree/wiki/Specification-of-Tree-Description)), for example:

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

The most simple way to construct a tree looks like this. `"rectangular"` can be replaced with `"circular"` or `"unrooted"` to use the other types of layout. 

```javascript
var tree = WebPhyloTree.load("rectangular", description);
```

Users can customize the layout of tree by defining some layout parameters. (see [list of layout parameters and their meanings](https://github.com/SJTU-CGM/WebPhyloTree/wiki/List-of-Layout-Parameters)). 

```javascript
var tree = WebPhyloTree.load("rectangular", description, {
        "branch_length_unit": 10,
        "leaf_span": 50,
    }
);
```

WebPhyloTree is shipped with several addons, users can enable them during tree construction. (see [list of addons and their meanings](https://github.com/SJTU-CGM/WebPhyloTree/wiki/List-of-Addons)). 

```javascript
var tree = WebPhyloTree.load("rectangular", description, {
        "branch_length_unit": 10,
        "leaf_span": 50,
    },
    [ WebPhyloTree.Addons.LeafButtom, WebPhyloTree.Addons.ExtendBranch ]
);
```


### The Tree Object

The value of `tree` is now an object with 2 properties: `element` and `root`. 

`tree.element` is a `<svg>` element. Users can insert it to document to display the tree

```javascript
document.getElementsByTagName("body")[0].appendChild(tree.element);
```

`tree.root` is provided for addon developers and power users. It is safe to ignore it.



### Shortcuts

Sometimes, it is desirable to construct many trees in the same layout. So WebPhyloTree provides three more tree constructor: `WebPhyloTree.rectangular`, `WebPhyloTree.circular` and `WebPhyloTree.unrooted`. Their usages are almost the same as `WebPhyloTree.load`, except that they ommits the first parameter. In a nut shell, `WebPhyloTree.rectangular(...)` is equivalent to `WebPhyloTree.load("rectangular", ...)`. 




## See also

As WebPhyloTree takes JSON as input, you may need [a parser for Newick](https://github.com/KelvinLu1024/newick.js) or [a parser for PhyloXML](https://github.com/KelvinLu1024/phyloxml.js).
