'use strict';

const test = require('ava');
const clone = require('clone');
const Reader = require('../src/reader.js');

/**
 * Returns true if all parent properties effectively
 * point to their parents
 */
const checkParents = (obj, expectedParent) => {
    if (obj.parent !== expectedParent) {
        return false;
    }
    return obj.children.every(child => checkParents(child, obj));
};

/**
 * Removes parent properties to simplify comparisions
 */
const removeParents = obj => {
    delete obj.parent;
    obj.children.forEach(removeParents);
    return obj;
};

const assert = (t, reader, event, xml, expected) => {
    reader.on(event, (data) => {
        t.true(checkParents(data, null), 'parents ok');
        const result = removeParents(data);
        t.deepEqual(result, expected, 'result ok');
        t.end();
    });
    reader.parse(xml);
};

const assertMany = (t, reader, event, xml, expected) => {
    let index = 0;
    reader.on(event, (data) => {
        const result = removeParents(clone(data));
        t.deepEqual(result, expected[index], 'result ok');
        index++;
    });
    reader.parse(xml);
};

test.cb('element with text node', t => {
    const reader = Reader.create();
    const xml = `<root><item>hello</item></root>`;
    const expected = {
        name: 'root',
        type: 'element',
        value: '',
        attributes: {},
        children: [{
            name: 'item',
            type: 'element',
            value: '',
            attributes: {},
            children: [{
                name: '',
                type: 'text',
                value: 'hello',
                attributes: {},
                children: [],
            }],
        }],
    };
    assert(t, reader, 'done', xml, expected);
});

test.cb('element with attributes', t => {
    const reader = Reader.create();
    const xml = `<root><item a=1 b='2'c="3"d/></root>`;
    const expected = {
        name: 'root',
        type: 'element',
        value: '',
        attributes: {},
        children: [{
            name: 'item',
            type: 'element',
            value: '',
            attributes: {a: '1', b: '2', c: '3', d: ''},
            children: [],
        }],
    };
    assert(t, reader, 'done', xml, expected);
});

test.cb('alternative done event', t => {
    const reader = Reader.create({doneEvent: 'end'});
    const xml = `<done/>`;
    const expected = {
        name: 'done',
        type: 'element',
        value: '',
        attributes: {},
        children: [],
    };
    assert(t, reader, 'end', xml, expected);
});

test.cb('some tags ignored', t => {
    const reader = Reader.create();
    const xml = `
        ignored text start
        <?xml foo=bar?>
        <!DOCTYPE baz>
        <root>
            <!-- comment -->
        </root>
        ignored text end`;
    const expected = {
        name: 'root',
        type: 'element',
        value: '',
        attributes: {},
        children: [],
    };
    assert(t, reader, 'done', xml, expected);
});

test.cb('capture by tag name', t => {
    const reader = Reader.create();
    const xml = `
        <root>
            <item v=1/>
            <item v=2/>
            <item v=3/>
        </root>`;
    const expected = [
        {name: 'item', type: 'element', value: '', attributes: {v: '1'}, children: []},
        {name: 'item', type: 'element', value: '', attributes: {v: '2'}, children: []},
        {name: 'item', type: 'element', value: '', attributes: {v: '3'}, children: []},
    ];
    reader.on('done', data => {
        t.is(data.children.length, 3, 'root node has expected number of children');
        t.end();
    })
    assertMany(t, reader, 'item', xml, expected);
});


test.cb('capture by tag name in stream mode', t => {
    const reader = Reader.create({stream: true});
    const xml = `
        <root>
            <item v=1/>
            <item v=2/>
            <item v=3/>
        </root>`;
    const expected = [
        {name: 'item', type: 'element', value: '', attributes: {v: '1'}, children: []},
        {name: 'item', type: 'element', value: '', attributes: {v: '2'}, children: []},
        {name: 'item', type: 'element', value: '', attributes: {v: '3'}, children: []},
    ];
    reader.on('done', data => {
        t.is(data.children.length, 0, 'root node has 0 children');
        t.end();
    })
    assertMany(t, reader, 'item', xml, expected);
});

test.cb('parse Sync', t => {
    const xml = '<root/>';
    const result = Reader.parseSync(xml);
    const expected = {
        name: 'root',
        type: 'element',
        value: '',
        parent: null,
        attributes: {},
        children: [],
    };
    t.deepEqual(result, expected);
    t.end();
});

test.cb('with parent nodes', t => {
    const xml = '<root><level1><level2></level2></level1></root>';
    const reader = Reader.create({parentNodes: true});
    reader.on('tag:level1', (tag) => {
        t.is(tag.parent.name, 'root');
    });
    reader.on('tag:level2', (tag) => {
        t.is(tag.parent.name, 'level1');
    });
    reader.on('done', (tag) => {
        t.pass('done');
    });
    reader.parse(xml);
    t.plan(3);
    t.end();
});

test.cb('without parent nodes', t => {
    const xml = '<root><level1><level2></level2></level1></root>';
    const reader = Reader.create({parentNodes: false});
    reader.on('tag:level1', (tag) => {
        t.is(tag.parent, null);
    });
    reader.on('tag:level2', (tag) => {
        t.is(tag.parent, null);
    });
    reader.on('done', (tag) => {
        t.pass('done');
    });
    reader.parse(xml);
    t.plan(3);
    t.end();
});

test.cb('custom tag event prefix', t => {
    const xml = '<root><level1><level2></level2></level1></root>';
    const reader = Reader.create({tagPrefix: '$'});
    reader.on('$level1', (tag) => {
        t.pass('level1');
    });
    reader.on('$level2', (tag) => {
        t.pass('level2');
    });
    reader.on('done', (tag) => {
        t.pass('done');
    });
    reader.on('tag', (name, tag) => {
        switch (name) {
            case 'root': return t.pass('root');
            case 'level1': return t.pass('level1');
            case 'level2': return t.pass('level2');
            default: t.fail(`unexpected tag: ${name}`);
        }
    });
    reader.parse(xml);
    t.plan(6);
    t.end();
});

test.cb('read CDATA texts', t => {
    const xml = '<root><hi><![CDATA[<hello>]]></hi></root>';
    const reader = Reader.create({tagPrefix: '$'});
    reader.on('$hi', (tag) => {
        t.is(tag.children.length, 1);
        t.is(tag.children[0].value, '<hello>');
    });
    reader.parse(xml);
    t.plan(2);
    t.end();
});

test.cb('unexpected closing tags are ignored', t => {
    const xml = '<root><hi></discarded>hello</hi></root>';
    const reader = Reader.create();
    reader.on('tag:hi', (tag) => {
        t.is(tag.children.length, 1);
        t.is(tag.children[0].value, 'hello');
    });
    reader.on('tag:root', (tag) => t.pass('root'));
    reader.on('tag:discarded', (tag) => t.fail('discarded'));
    reader.parse(xml);
    t.plan(3);
    t.end();
});

test.cb('emitTopLevelOnly true', t => {
    const xml = '<root><level1><level2>2</level2></level1><level1><level2>2</level2></level1></root>';
    const reader = Reader.create({emitTopLevelOnly: true});
    reader.on('tag:level1', (tag) => t.pass('level1'));
    reader.on('tag', (name, tag) => (name === 'level1') && t.pass('level1'));

    reader.on('tag:level2', (tag) => t.fail('level2'));
    reader.on('tag', (name, tag) => (name === 'level2') && t.fail('level2'));
    reader.parse(xml);
    t.plan(4);
    t.end();
});

test.cb('emitTopLevelOnly false', t => {
    const xml = '<root><level1><level2>2</level2></level1><level1><level2>2</level2></level1></root>';
    const reader = Reader.create({emitTopLevelOnly: false});
    reader.on('tag:level1', (tag) => t.pass('level1'));
    reader.on('tag:level2', (tag) => t.pass('level2'));
    reader.parse(xml);
    t.plan(4);
    t.end();
});


test.cb('stops emitting when document ends', t => {
    const xml = '<root><level1><level2>2</level2></level1></root>';
    const reader = Reader.create();
    reader.on('tag:level1', (tag) => t.pass('level1'));
    reader.on('tag:level2', (tag) => t.pass('level2'));
    reader.parse(xml);
    reader.parse(xml);
    t.plan(2);
    t.end();
});

test.cb('resetting allows parsing multiple documents', t => {
    const xml = '<root><level1><level2>2</level2></level1></root>';
    const reader = Reader.create();
    reader.on('tag:level1', (tag) => t.pass('level1'));
    reader.on('tag:level2', (tag) => t.pass('level2'));
    reader.parse(xml);
    reader.reset();
    reader.parse(xml);
    t.plan(4);
    t.end();
});
