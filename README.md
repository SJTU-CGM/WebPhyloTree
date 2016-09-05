# WebTree
Extensible tree viewer implemented with JavaScript, works on HTML and SVG.  

This is a brief introduction. For comprehensive information on configuration and writing addo-ons, please visit our [Wiki page](https://github.com/KelvinLu1024/WebTree/wiki).

## Supported Layouts
* Rectangular
* Circular
* Unrooted

## Install
WebTree is divided into 2 source files, or libraries: `webtree.js`(core), `extensions.js`(optional).

## Usage
(Codes showed below are included in `example/`)  
It's assumed that the document is either an HTML or XML, see examples below.
```html
<!DOCTYPE html>

<html>
  <head>
    <script src="../webtree.js" type="text/javascript"></script>
    <!--optional-->
    <script src="../extensions.js" type="text/javascript"></script>
    <!--example main.js-->
    <style>
      html, body, svg {
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <script src="main.js" type="text/javascript"></script>
  </body>
</html>
```
```xml
<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="800px" height="800px">
  <script xlink:href="../webtree.js" type="text/javascript" />
  <!--optional-->
  <script xlink:href="../extensions.js" type="text/javascript" />
  <!--example main.js-->
  <script xlink:href="main.js" type="text/javascript" />
</svg>
```
variable `container` is defined as an element and variable `description` is defined as something like
```javascript
// name: name of node (optional)
// length: branch length
var description = {
  name: "E", length: 10,
  subnodes: [
    { name: "D", length: 30,
      subnodes: [
        { name: "C", length: 20 },
        { name: "B", length: 20 }
      ]
    },
    { name: "A", length: 20 }
  ]
};
```

### Beginner
```javascript
// draw a rectangular tree
var tree = WebTree.rectangular(svgElement, description);

var root = tree["root"];
var elem = tree["element"];
container.appendChild(elem);
```

### Advanced
```javascript
// overwrite default configs
var tree = WebTree.rectangular(svgElement, description, {
  "branch_unit": 20
});

var root = tree["root"];
var elem = tree["element"];
container.appendChild(elem);
```

### Expert
(`extensions.js` is required)
```javascript
// add buttons for internal nodes and labels for leaves
var tree = WebTree.load(description, {
  layout: "rectangular",
  extensions: [ WebTree.Extensions.LeafButton, WebTree.Extensions.LeafLabel ],
  branch_unit: 5,
  leaf_size: 32
});

var root = tree["root"];
var elem = tree["element"];
container.appendChild(elem);
```
__Note:__ if you works on a HTML, `svgElement` should be replaced by a SVG container elements (e.g. `<svg>`, `<g>`).

## See also
As WebTree takes JSON as input, you may need [a parser for Newick](
https://github.com/KelvinLu1024/newick.js) || [a parser for PhyloXML](https://github.com/KelvinLu1024/phyloxml.js)
