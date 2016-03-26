'use strict';

const EventEmitter = require('eventemitter3');
const Lexer = require('xml-lexer');
const Type = Lexer.Type;

const NodeType = {
    element: 'element',
    text: 'text',
};

const createNode = (options) => Object.assign({
    name: '',
    type: NodeType.element,
    value: '',
    parent: null,
    attributes: {},
    children: [],
}, options);

const create = (options) => {
    options = Object.assign({
        stream: false,
        doneEvent: 'done',
    }, options);

    const lexer = Lexer.create();
    const reader = new EventEmitter();

    let rootNode = createNode();
    let current = null;
    let attrName = '';

    lexer.on('data', (data) => {
        switch (data.type) {

            case Type.openTag:
                if (current === null) {
                    current = rootNode;
                    current.name = data.value;
                } else {
                    const node = createNode({
                        name: data.value,
                        parent: current
                    });
                    current.children.push(node);
                    current = node;
                }
                break;

            case Type.closeTag:
                const parent = current.parent;
                if (current.name !== data.value) {
                    // ignore unexpected closing tag
                    break;
                }
                if (options.stream && current.parent === rootNode) {
                    rootNode.children = [];
                    // do not expose parent node in top level nodes
                    delete current.parent;
                }
                reader.emit(current.name, current);
                if (current === rootNode) {
                    // end of document, stop listening
                    lexer.removeAllListeners('data');
                    reader.emit(options.doneEvent, current);
                    rootNode = null;
                }
                current = parent;
                break;

            case Type.text:
                current.children.push(createNode({
                    type: NodeType.text,
                    value: data.value,
                    parent: current,
                }));
                break;

            case Type.attributeName:
                attrName = data.value;
                current.attributes[attrName] = '';
                break;

            case Type.attributeValue:
                current.attributes[attrName] = data.value;
                break;

            default:
                break;
        }
    });
    reader.parse = lexer.write;
    return reader;
};

module.exports = {
    create,
    NodeType,
};
