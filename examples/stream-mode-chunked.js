'use strict';
const Reader = require('..');
const reader = Reader.create({stream: true});
const xml =
    `<root>
        <item v=1/>
        <item v=2/>
        <item v=3/>
    </root>`;

reader.on('tag:item', (data) => console.log(data));
// {name: 'item', type: 'element', value: '', attributes: {v: '1'}, children: []}
// {name: 'item', type: 'element', value: '', attributes: {v: '2'}, children: []}
// {name: 'item', type: 'element', value: '', attributes: {v: '3'}, children: []}

reader.on('done', data => console.log(data.children.length));
// 0

// Note that here we are calling the parser with just one char each time
xml.split('').forEach(char => reader.parse(char));
