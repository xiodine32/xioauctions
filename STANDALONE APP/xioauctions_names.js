const https = require('https');
const parseXml = require('@rgrove/parse-xml');
const readline = require('readline');

function doRequest(item) {
    return new Promise((res, rej) => {
        https.get(`https://www.wowhead.com/item=${item}&xml`, resp => {
            let data = '';
            resp.on('data', chunk => data += chunk);
            resp.on('end', () => res(data));
        }).on('error', err => rej(err));
    });
}

function readInput(ask) {
    return new Promise(res => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        let text = '';
        console.log(ask);
        rl.on('line', line => {
            text += line + '\n';
            if (line.length === 0) {
                rl.close();
                res(text.trim());
            }
        });
    });
}

async function doMatch(item) {
    const response = await doRequest(item);
    let doc = parseXml(response).children[0].children[0];
    let itemName = doc.children[0].children[0].text;
    const recipe = response.includes('Gathered by players')
        ? undefined
        : doc.children.find(x => x.name === 'createdBy')?.children[0]?.children.map(x => ({
        id: +x.attributes.id,
        name: x.attributes.name,
        q: +x.attributes.count
    })) ?? undefined;

    const sellPriceJson = JSON.parse('{' + (doc.children.find(x => x.name === "jsonEquip")?.children[0]?.text || '') + '}');
    const maxStackSize = parseInt(/>Max Stack: (\d+)</.exec(doc.children.find(x => x.name === "htmlTooltip")?.children[0]?.text || '')?.[1] || 0);

    return {
        id: item,
        name: itemName,
        recipe: (recipe?.length ?? []) > 0 ? recipe : undefined,
        price: sellPriceJson?.sellprice,
        maxStackSize: maxStackSize
    };
}

async function calculateIds(ids) {
    const results = (await Promise.all(ids.map(id => doMatch(id))))
        .reduce((p, c) => ({...p, [c.id]: {name: c.name, recipe: c.recipe, price: c.price, maxStackSize: c.maxStackSize}}), {});

    const items = {};
    const recipes = {};
    const sell_prices = {};
    const stack_sizes = {};

    for (const [itemId, content] of Object.entries(results)) {
        items[itemId] = content.name;
        sell_prices[itemId] = content.price;
        stack_sizes[itemId] = content.maxStackSize;
        for (const {id, name, q} of content?.recipe ?? []) {
            if (recipes[itemId] === undefined) {
                recipes[itemId] = {};
            }
            recipes[itemId][id] = q;
            items[id] = name;
        }
    }

    return {items, recipes, sell_prices, stack_sizes};
}

async function main() {
    const str = await readInput("Enter xioauctions string:");
    const input = transformInput(str);
    const {items, recipes, sell_prices, stack_sizes} = (await calculateIds(Array.from(input.keys())));
    // console.log(input);
    const vendors = {
        180732: 10000 / 20,
        172057: 37500 / 10,
        178786: 35000 / 10,
        172056: 50000 / 10,
        172059: 42500 / 10,
        172058: 45000 / 10
    }
    const resulting_json = JSON.stringify({items, recipes, vendors, sell_prices, stack_sizes});
    const fs = require('fs');
    let data = fs.readFileSync('./xioauctions.html', 'utf-8');
    let toReplace;
    toReplace = /^(\s*<script id="XioAuctions_Import" type="application\/json">[^<]+?<\/script>)/m.exec(data)[1];
    data = data.replace(toReplace, '<script id="XioAuctions_Import" type="application/json">' + resulting_json + '</script>');
    toReplace = /^(\s*<script id="XioAuctions_Addon" type="text\/plain">[^<]+?<\/script>)/m.exec(data)[1];
    data = data.replace(toReplace, '<script id="XioAuctions_Addon" type="text/plain">' + str.trim() + '</script>');
    fs.writeFileSync('./xioauctions.html', data);
    return 'done!';
}

function transformInput(valueInput) {
    function parse(line) {
        let [itemId, lines] = line.split(",")
        return {
            itemId: +itemId,
            items: lines.substr(0, lines.length - 1).split("|").map(x => {
                const [q, c] = x.split("&");
                return {q: +q, c: +c};
            }).sort((a, b) => a.c - b.c)
        }
    }

    const lines = new Map();
    for (const line of valueInput.split("\n")) {
        const {itemId, items} = parse(line);
        lines.set(itemId, items);
    }
    return lines;
}

main()
    .then(data => {
        if (data) {
            console.log(data);
        }
    })
    .catch(err => console.error(err));
