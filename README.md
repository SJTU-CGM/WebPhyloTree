# WebTree
A Web-based embedable dynamic tree viewer. Process JSON into SVG. HTML and SVG. Work out of box.

## Supported Layouts
* Rectangular
* Circular
* Unrooted

## Usage
It's assumed that the document is an svg file, for example, 
```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet href="style.css" type="text/css"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <script xlink:href="../webtree.js" type="text/javascript" />
  <!--optional-->
  <script xlink:href="../extension.js" type="text/javascript" />
  <!--optional-->
  <script xlink:href="../appendage.js" type="text/javascript" />
  <!--example main.js-->
  <script xlink:href="main.js" type="text/javascript" />
</svg>
```
and a variable `description` is defined as something like
```javascript
var description = {
	name: "E", length: 10,
	subnodes: [
		{ name: "D", length: 30,
	      subnodes: [
	          { name: "C", length: 20 },
			  { name: "B", length: 20 }
		  ] },
        { name: "A", length: 20 }
    ]
};
```

### Beginner
```javascript
var root = WebTree.rectangular(document.rootElement, description);
```

### Advanced
```javascript
var root = WebTree.rectangular(document.rootElement, description, {
  "branch_unit": 10,
  "leaf_size": 32,
});
```

### Expert
```javascript
var root = WebTree.rectangular(document.rootElement, description, {
  layout: "rectangular",
  node_pipline: [WebTree.Appendage.button],
  leaf_pipline: [WebTree.Appendage.label, WebTree.Extension.rotateLabel],
  config: {
    "branch_unit": 10,
    "leaf_size": 32,
  },
});
```
__Note:__ if you works on a HTML, `document.rootElement` should be replace as a SVG container elements (e.g. <svg>, <g>).

## See also
As WebTree takes JSON as input, you may need a parser for Newick or phyloXML.  
```javascript
parseNewick(String::txt)  
```
https://github.com/KelvinLu1024/newick.js
