'use strict';
const Reader = require('..');
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
Empty values and references to parent nodes removed for brevity:
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
*/
