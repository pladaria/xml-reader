const XmlReader = require('..');

const xml =
    `<root>
        <item v=1/>
        <item v=2/>
        <item v=3/>
    </root>`;

console.log('1');
console.log(XmlReader.parseSync(xml));
console.log('2');
