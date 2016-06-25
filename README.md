# WebTree
Extensible tree viewer implemented with JavaScript, works on HTML and SVG.  

This is a brief introduction. For comprehensive information on configuration and writing addo-ons, please visit our [Wiki page](https://github.com/KelvinLu1024/WebTree/wiki).

## Supported Layouts
* Rectangular
* Circular
* Unrooted

## Install
WebTree is divided into 3 sublibraries: `webtree.js`, `appendage.js` and `extension.js`  
* `webtree.js` **core**. 
* `appendage.js` **optional**  
a collection of functions that add extra elements onto the tree (e.g. labels and buttons). 
* `extension.js` **optional**  
a collection of functions that do extra works (e.g. extending leaf branches). 

## Usage
(Codes showed below are included in `example/`)  
It's assumed that the document is either an HTML or XML, see examples below.
```html
<!DOCTYPE html>

<html>
  <head>
    <script src="../webtree.js" type="text/javascript"></script>
    <!--<script src="../extension.js" type="text/javascript"></script>-->
    <!--<script src="../appendage.js" type="text/javascript"></script>-->
  </head>
  <body>
    <svg style="stroke:black; fill:grey;" width="1200" height="1200" />
    <script src="main.js" type="text/javascript"></script>
  </body>
</html>
```
```xml
<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     stroke="black" fill="grey"
     width="1200" height="1200">
  <script xlink:href="../webtree.js" type="text/javascript" />
  <!--<script xlink:href="../extension.js" type="text/javascript" />-->
  <!--<script xlink:href="../appendage.js" type="text/javascript" />-->
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
  "branch_unit": 20
});
```

### Expert
(`appendages.js` is required)
```javascript
// add buttons for internal nodes and labels for leaves
var root = WebTree.load(svgElement, description, {
  layout: "rectangular",
  node_modifiers: [WebTree.Appendage.button],
  leaf_modifiers: [WebTree.Appendage.label],
  config: {
    "branch_unit": 10
  },
});
```
__Note:__ if you works on a HTML, `svgElement` should be replaced by a SVG container elements (e.g. `<svg>`, `<g>`).

## See also
As WebTree takes JSON as input, you may need a parser for Newick.  
```javascript
parseNewick(String::txt)  
```
https://github.com/KelvinLu1024/newick.js
