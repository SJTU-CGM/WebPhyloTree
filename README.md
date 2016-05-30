# WebTree
A Web-based embedable dynamic tree viewer. Process JSON into SVG. HTML and SVG. Work out of box.

## Supported Layout
* Rectangular
* Circular
* Unrooted

## Usage
### Beginning
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

## See also
As WebTree takes JSON as input, you may need a parser for Newick or phyloXML.  
```javascript
parseNewick(String::txt)  
```
https://github.com/KelvinLu1024/newick.js
