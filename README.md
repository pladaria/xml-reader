# XML Reader

Reads XML documents and emits JS objects with a simple, easy to use structure.

## Features

- Small, fast and simple
- Runs everywhere (browser, node.js, React Native, ServiceWorkers, WebWorkers...)
- Event driven API
- Can process input piece-by-piece in a serial fashion
- Stream mode (low memory usage)

## Install

```bash
npm install --save xml-reader
```

## Node structure

The objects emitted by the reader have a tree structure where each node has the following properties:

```javascript
{
    name, // element name (empty for text nodes)
    type, // node type (element or text), see NodeType constants
    value, // value of a text node
    parent, // reference to parent node (null in root node)
    attributes, // map of attributes name => value
    children // array of nodes
}
```

## Examples

### Read document

Basic example. Read and parse a XML document.

```javascript
const Reader = require('xml-reader');
const reader = Reader.create();
const xml =
    `<?xml version="1.0" encoding="UTF-8"?>
    <message>
        <to>Alice</to>
        <from>Bob</from>
        <heading color="blue">Hello</heading>
        <body color="red">This is a demo!</body>
    </message>`;

reader.on('done', data => console.log(data));
reader.parse(xml);

/*
Console output:

{ name: 'message',
  type: 'element',
  children: [
    { name: 'to',
      type: 'element',
      children: [{ type: 'text', value: 'Alice' }]},
    { name: 'from',
      type: 'element',
      children: [{ type: 'text', value: 'Bob' }]},
    { name: 'heading',
      type: 'element',
      attributes: { color: 'blue' },
      children: [{ type: 'text', value: 'Hello' }]},
    { name: 'body',
      type: 'element',
      attributes: { color: 'red' },
      children: [{ type: 'text', value: 'This is a demo!' }]}]}

Note: empty values and references to parent nodes removed for brevity!
*/
```

### Stream mode

In stream mode, nodes are removed from root as they are emitted. This way memory usage does not increases.

```javascript
const Reader = require('xml-reader');
const reader = Reader.create({stream: true});
const xml =
    `<root>
        <item v=1/>
        <item v=2/>
        <item v=3/>
    </root>`;

reader.on('item', (data) => console.log(data));
// {name: 'item', type: 'element', value: '', attributes: {v: '1'}, children: []}
// {name: 'item', type: 'element', value: '', attributes: {v: '2'}, children: []}
// {name: 'item', type: 'element', value: '', attributes: {v: '3'}, children: []}

reader.on('done', data => console.log(data.children.length));
// 0

reader.parse(xml);
```

### Stream mode (chunked)

In this example we are calling multiple times to the parser. This is useful if your XML document is a stream that comes from a TCP socket or WebSocket (for example XMPP streams).

Simply feed the parser with the data as it arrives. As you can see, the result is exactly the same as the previous one.

```javascript
const Reader = require('xml-reader');
const reader = Reader.create({stream: true});
const xml =
    `<root>
        <item v=1/>
        <item v=2/>
        <item v=3/>
    </root>`;

reader.on('item', (data) => console.log(data));
// {name: 'item', type: 'element', value: '', attributes: {v: '1'}, children: []}
// {name: 'item', type: 'element', value: '', attributes: {v: '2'}, children: []}
// {name: 'item', type: 'element', value: '', attributes: {v: '3'}, children: []}

reader.on('done', data => console.log(data.children.length));
// 0

// Note that here we are calling the parser with just one char each time
xml.split('').forEach(char => reader.parse(char));
```
## To do

- ES5 lib (webpack build)
- CDATA, comments, doctype and other tags are ignored

## License

MIT
