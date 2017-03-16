var FormInspector = (function(){


    "use strict";


    function FormInspectorError(who, message) {
        return "FormInspector::" + who + ": " + message;
    }


    function inspect(formElem) {
        return inspectElements(formElem.elements);
    }


    function inspectElements(elements) {

        var mapping = {};

        function updateMapping(d) {
            var name = d.name;
            var value = d.value;
            if (mapping.hasOwnProperty(name)) {
                console.log(mapping)
                throw FormInspectorError("inspectElements", "duplicated name ("+name+")");
            } else {
                mapping[name] = value;
            }
        }


        for (let e of elements) {
            switch (e.tagName.toUpperCase()) {
                case "SELECT":
                    updateMapping(inspectSelect(e));
                    break;
                case "INPUT":
                    if (e.type != "submit") {
                        updateMapping(inspectInput(e));
                    }
                    break;
                case "FIELDSET":
                    // do nothing, as form.elements is recursive
                    break;
                default:
                    throw FormInspectorError("inspectForm", "Unespected element ("+e+").");
            }
        }
        return mapping;
    }


    function inspectSelect(elem) {
        return {
            name: elem.name,
            value: elem.value
        };
    }


    function inspectInput(elem) {
        var value = null;
        switch (elem.type) {
            case "checkbox":
                value = elem.checked;
                break;
            case "number":
                value = parseFloat(elem.value);
                break;
            default:
                value = elem.value;
        }
        return {
            name: elem.name,
            value: value
        };
    }


    return {
        inspect: inspect
    };


})();
