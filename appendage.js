(function(WT){
  WT.Appendage = {
    label: function (node) {
      var label = WT.SvgHelper.text(node.data["label"] || node.name);
      node.elements["hook"].appendChild(label);
      node.elements["label"] = label;
    },
    labelButton: function(node) {
      var labelBtn = WT.SvgHelper.rect(0, -16, 50, 28);
      node.elements["hook"].appendChild(labelBtn);
      node.elements["label_button"] = labelBtn;
    },
    button: function (node) {
      var button = WT.SvgHelper.circle(0, 0, 5);
      node.elements["hook"].appendChild(button);
      node.elements["button"] = button;
    }
  };
})(WebTree);
