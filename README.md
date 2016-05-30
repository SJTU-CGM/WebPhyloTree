# WebTree
An embedable tree viewer implemented as a JavaScript library. It takes JSON as input and works on both HTML and SVG.  

This is a brief introduction which exhibits the most basic usages. For comprehensive information, please visit the [Wiki page](https://github.com/KelvinLu1024/WebTree/wiki).

## Supported Layouts
* Rectangular
* Circular
* Unrooted

## Usage
It's assumed that the document is an svg file, for example, 
```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <script xlink:href="../webtree.js" type="text/javascript" />
  <!--optional-->
  <script xlink:href="../extension.js" type="text/javascript" />
  <!--optional-->
  <script xlink:href="../appendage.js" type="text/javascript" />
  <!--put your code here-->
  <script xlink:href="main.js" type="text/javascript" />
</svg>
```
and a variable `description` is defined as something like
```javascript
// name: name of node (optional)
// length: branch length
var description = {
    name: "E", length: 10,
    subnodes: [ {name: "D", length: 30,
                subnodes: [ {name: "C", length: 20},
                            {name: "B", length: 20} ]},
                {name: "A", length: 20} ]
};
```

### Beginner
```javascript
// draw a rectangular tree in <svg>
var svgElement = document.rootElement;
var root = WebTree.rectangular(svgElement, description);
```

### Advanced
```javascript
// overwrite default configs
var root = WebTree.rectangular(svgElement, description, {
  "branch_unit": 20,
  "leaf_size": 40,
});
```

### Expert
```javascript
// modify the nodes and leaves (add buttons and labels)
var root = WebTree.load(svgElement, description, {
  layout: "rectangular",
  node_modifiers: [WebTree.Appendage.button],
  leaf_modifiers: [WebTree.Appendage.label],
  config: {
    "branch_unit": 10,
    "leaf_size": 32,
  },
});
```
__Note:__ if you works on a HTML, `svgElement` should be replaced by a SVG container elements (e.g. `<svg>`, `<g>`).

## See also
As WebTree takes JSON as input, you may need a parser for Newick or phyloXML.  
```javascript
parseNewick(String::txt)  
```
https://github.com/KelvinLu1024/newick.js
