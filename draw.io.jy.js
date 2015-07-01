Draw.loadPlugin(function(draw)
{
console.log('Jupyter plugin loaded!');

var stylesheet = document.createElement("link");
stylesheet.setAttribute("rel", "stylesheet");
stylesheet.setAttribute("type", "text/css");
stylesheet.setAttribute("href", 'draw.io.jy.css');
document.getElementsByTagName("head")[0].appendChild(stylesheet);

var toolbar = document.querySelectorAll('.geToolbar')[0];
var scheme_colors = [
    '#197795',
    '#090909',
    '#4abfe6',
    '#6d6d6d',
    '#5596ac',
    '#3b3b3b',
    '#98dcf3',
    '#d1d1d1',
    '#77d3f4',
    '#9f9f9f'
];

function create_dialog(settings) {
    var body = document.querySelectorAll('body')[0];

    var backdrop = document.createElement('div');
    body.appendChild(backdrop);
    backdrop.style.position = 'absolute';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.background = 'black';
    backdrop.style.opacity = 0.2;

    var dialog = document.createElement('div');
    body.appendChild(dialog);
    dialog.style.position = 'absolute';
    dialog.style.display = 'flex';
    dialog.style.width = '100%';
    dialog.style.height = '100%';

    var prompt = document.createElement('div');
    dialog.appendChild(prompt);
    prompt.style.background = 'white';
    prompt.style.padding = '20px';
    prompt.style.display = 'innline-flex';
    prompt.style.margin = 'auto';
    prompt.style.border = '1px solid black';
    prompt.style['border-radius'] = '5px';
    prompt.innerHTML = '<b>Classify the selected element:</b><br>';

    var group_label = document.createElement('div');
    group_label.innerText = 'Group:';
    group_label.style['margin-top'] = '10px';
    prompt.appendChild(group_label);
    var group = document.createElement('input');
    group.setAttribute('type', 'number');
    group.setAttribute('name', 'group');
    group.setAttribute('value', settings.group || 1);
    group.setAttribute('min', 1);
    group.setAttribute('max', 10);
    prompt.appendChild(group);

    var class_label = document.createElement('div');
    class_label.innerText = 'Classification:';
    class_label.style['margin-top'] = '10px';
    prompt.appendChild(class_label);
    var classification = document.createElement('select');
    var block = document.createElement('option');
    block.innerText = 'block';
    block.setAttribute('value', 'block');
    classification.appendChild(block);
    var separator = document.createElement('option');
    separator.innerText = 'separator';
    separator.setAttribute('value', 'separator');
    classification.appendChild(separator);
    var text = document.createElement('option');
    text.innerText = 'text';
    text.setAttribute('value', 'text');
    classification.appendChild(text);
    var strongconnection = document.createElement('option');
    strongconnection.innerText = 'strong connection';
    strongconnection.setAttribute('value', 'strongconnection');
    classification.appendChild(strongconnection);
    var weakconnection = document.createElement('option');
    weakconnection.innerText = 'weak connection';
    weakconnection.setAttribute('value', 'weakconnection');
    classification.appendChild(weakconnection);
    classification.value = settings.classification || 'block';
    prompt.appendChild(classification);

    prompt.appendChild(document.createElement('br'));
    prompt.appendChild(document.createElement('br'));
    var apply = document.createElement('button');
    apply.innerText = 'Apply';
    var cancel = document.createElement('button');
    cancel.innerText = 'Cancel';
    prompt.appendChild(apply);
    prompt.appendChild(cancel);

    var resolve;
    var reject;
    var promise = new Promise(function(res, rej) {
        resolve = res;
        reject = rej;
    });

    function cleanup() {
        body.removeChild(backdrop);
        body.removeChild(dialog);
    };

    cancel.onclick = function() {
        cleanup();
        reject();
    };

    apply.onclick = function() {
        resolve({group: group.value, classification: classification.value});
        cleanup();
    };
    return promise;
};

function create_separator() {
    var separator = document.createElement('a');
    separator.className = 'geSeparator';
    toolbar.appendChild(separator);
    return separator;
};

function create_button(title, cb, disabled) {
    var button = document.createElement('a');
    button.className = 'geButton' + (disabled ? ' mxDisabled' : '');
    button.style.width = 'initial';
    button.style['padding-top'] = '4px';
    button.innerText = title;
    toolbar.appendChild(button);
    if (cb) {
        button.onclick = cb;
    }
    return button;
};

function get_selected() {
    return draw.editor.graph.getSelectionCell();
};

function set_model(cell, model) {
    draw.editor.graph.getModel().setValue(cell, model);
};

function clone_model(cell) {
    var model = draw.editor.graph.getModel().getValue(cell);
    if (model===undefined || model===null || typeof model === 'string') {
        var new_model = document.createElement('object');
        if (model !== undefined && model !== null) {
            new_model.setAttribute('label', model);
        } else {
            new_model.setAttribute('label', '');
        }
        set_model(cell, new_model);
        model = new_model;
    }
    return model!==undefined && model!==null ? model.cloneNode(!0) : null;
};

function get_meta(cell, key) {
    var model = clone_model(cell);
    return model ? model.getAttribute(key) : null;
};

function set_meta(cell, key, value) {
    var model = clone_model(cell);
    if (model) {
        if (value && value.length > 0) {
            model.setAttribute(key, value);
        } else if (model.getAttribute(key)) {
            model.removeAttribute(key);
        }
        set_model(cell, model);
    }
};

function redraw_cell(cell) {
    var group = parseInt(get_meta(cell, 'group'));
    var classification = get_meta(cell, 'classification');
    var graph = draw.editor.graph;
    if (group && classification) {
        graph.setCellStyles('fontFamily', 'Helvetica Neue, Helvetica, Arial', [cell]);
        graph.setCellStyles('fontSize', 23, [cell]);
        graph.setCellStyles('shadow', 0, [cell]);
        graph.setCellStyles('glass', 0, [cell]);
        graph.setCellStyles('opacity', null, [cell]);
        graph.setCellStyles('verticalAlign', 'middle', [cell]);
        graph.setCellStyles('align', 'center', [cell]);
        
        // Apply class to cell.
        var state = graph.view.states.get(cell);
        if (state.shape) {
            var g = state.shape.node;
            g.setAttribute('class', classification + ' group' + group);
        }

        if (classification === 'block') {
            // Set cell width, height, font-face, and font-size.
            graph.setCellStyles('fontColor', '#FFFFFF', [cell]);
            graph.setCellStyles('strokeWidth', 0, [cell]);
            graph.setCellStyles('fillColor', scheme_colors[group-1], [cell]);
            
            var model = graph.getModel();
            model.beginUpdate();
            try {
                var geom = graph.getCellGeometry(cell).clone();
                geom.width = 217;
                geom.height = 65;
                model.setGeometry(cell, geom);
            } finally {
                model.endUpdate();
            }
        }

        if (classification === 'separator') {
            graph.setCellStyles('fontColor', '#d0d0d0', [cell]);
            graph.setCellStyles('strokeWidth', 1, [cell]);
            graph.setCellStyles('strokeColor', '#d0d0d0', [cell]);
            graph.setCellStyles('dashed', '1', [cell]);
            graph.setCellStyles('dashPattern', "17.0 25.0", [cell]);
        }

        if (classification === 'strongconnection') {
            graph.setCellStyles('fontColor', scheme_colors[group-1], [cell]);
            graph.setCellStyles('strokeWidth', 3, [cell]);
            graph.setCellStyles('strokeColor', scheme_colors[group-1], [cell]);
            graph.setCellStyles('dashed', '0', [cell]);
        }

        if (classification === 'weakconnection') {
            graph.setCellStyles('fontColor', scheme_colors[group-1], [cell]);
            graph.setCellStyles('strokeWidth', 10, [cell]);
            graph.setCellStyles('strokeColor', scheme_colors[group-1], [cell]);
            graph.setCellStyles('dashed', '1', [cell]);
            graph.setCellStyles('dashPattern', "0.1 3.0", [cell]);
        }

        if (classification === 'text') {
            graph.setCellStyles('fontColor', scheme_colors[group-1], [cell]);
            graph.setCellStyles('strokeWidth', 0, [cell]);
        }
    }
};

create_separator();
create_button('Jupyter:', undefined, true);
create_button('Classify selected', function() {
    var cell = get_selected();
    if (cell) {

        create_dialog({
                classification: get_meta(cell, 'classification'),
                group: get_meta(cell, 'group'),
            }).then(function(settings) {
                set_meta(cell, 'classification', settings.classification);
                set_meta(cell, 'group', settings.group);
                redraw_cell(cell);
                console.log('Dialog applied', settings);
            })
            .catch(function() {console.log('Dialog canceled');});
    }
});

function redraw() {
    var cells = draw.editor.graph.model.cells;
    var i;
    for (i in cells) {
        if (cells.hasOwnProperty(i)) {
            redraw_cell(cells[i]);
        }
    }
};

// Hook changes
var graphModelChanged = mxGraph.prototype.graphModelChanged;
mxGraph.prototype.graphModelChanged = function() {
    var ret = graphModelChanged.apply(this, arguments);
    redraw();
    return ret;
};

redraw();

});