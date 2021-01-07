var tf = require("@tensorflow/tfjs-node");
var { fork } = require('child_process');
var nsfw = require("nsfwjs");
var axios = require("axios");
var chalk = require('chalk');
var fs = require("fs");
var version = '1.0.17';
var ready = true;
tf.enableProdMode();

console.log(`\n\nYou're using @auntodev/displicit-local version ${version}\nCopyright (c) Aunto Development, 2021\n\n`);

module.exports = {
    version: version,
    update: download,
    classify: async function (url, child, func) {
        if (!fs.existsSync(`${__dirname}/model/`)) {
            console.warn(w('displicit-local couldn\'t find model files, attempting to fetch them from the internet...'));

            try {
                await download();
            } catch(err) {
                return console.error(err);
            }
        };

        if (!ready) return console.error('displicit-local is not ready for requests - please wait for downloading of model files to finish');

        if (child && func) {
            var forked = fork(`${__dirname}/child.js`);
            forked.send({ url });

            forked.on('message', async (msg) => {
                if (msg.err) throw msg.msg;
                func(msg);
            });
        } else if (func) {
            let res = await check(url);
            func(res);
        } else return check(url);
    }
};

async function download () {
    ready = false;

    var count = 0;
    var array = [
        { name: 'group1-shard1of6', url: 'https://github.com/AuntoDev/Displicit-Local/blob/main/model/group1-shard1of6?raw=true' },
        { name: 'group1-shard2of6', url: 'https://github.com/AuntoDev/Displicit-Local/blob/main/model/group1-shard2of6?raw=true' },
        { name: 'group1-shard3of6', url: 'https://github.com/AuntoDev/Displicit-Local/blob/main/model/group1-shard3of6?raw=true' },
        { name: 'group1-shard4of6', url: 'https://github.com/AuntoDev/Displicit-Local/blob/main/model/group1-shard4of6?raw=true' },
        { name: 'group1-shard5of6', url: 'https://github.com/AuntoDev/Displicit-Local/blob/main/model/group1-shard5of6?raw=true' },
        { name: 'group1-shard6of6', url: 'https://github.com/AuntoDev/Displicit-Local/blob/main/model/group1-shard6of6?raw=true' },
        { name: 'model.json', url: 'https://github.com/AuntoDev/Displicit-Local/blob/main/model/model.json?raw=true' },
        { name: 'README.md', url: 'https://github.com/AuntoDev/Displicit-Local/blob/main/model/README.md?raw=true' }
    ];

    console.warn(`\n${w(`displicit-local is fetching ${array.length} items from the internet`)}\n${w('----- THIS MAY TAKE A WHILE -----')}\n`);

    if (!fs.existsSync(`${__dirname}/model/`)){
        console.warn(w(`${__dirname}/model/ doesn't exist, creating it...`));
        fs.mkdirSync(`${__dirname}/model/`);
    };

    array.forEach(async(entry) => {
        var name = entry.name;
        var url = entry.url;
        var res;
        
        try {
            res = await axios.get(url, {
                responseType: 'stream'
            });
        } catch(err) {
            console.error(err);
            throw new Error(`displicit-local failed to fetch a model file from GitHub: ${url}`);
        };

        try {
            res.data.pipe(fs.createWriteStream(`${__dirname}/model/${name}`));
        } catch (err) {
            return console.error(err);
        };

        res.data.on('end', () => {
            count++;
            console.debug(`displicit-local fetched: ${name} ${url} (${count}/${array.length})`);
        });
    
        res.data.on('error', () => {
            count++;
            console.error(new Error(`displicit-local failed to fetch a model file from GitHub: ${url}`));
        });
    });

    return new Promise((resolve) => {
        var int = setInterval(() => {
            if (count >= array.length) {
                clearInterval(int);
                console.debug('\ndisplicit-local has fetched all the files it needs!\n');
                ready = true;
                resolve();
            };
        }, 10);
    });
};

async function check (url) {
    var res;

    try {
        res = await axios.get(url, {
            responseType: 'arraybuffer'
        });
    } catch(err) {
        console.error(err);
        throw new Error(`The webserver located at ${url} either doesn't exist, refused to connect, is down, or displicit-local cannot access it.`);
    };

    if (!res || !res.data) throw new Error(`The webserver located at ${url} either doesn't exist, refused to connect, is down, or displicit-local cannot access it.`);

    tf.engine().startScope();

    var model;

    try {
        model = await nsfw.load(`file://${__dirname}/model/`, { size: 299 });
    } catch(err) {
        throw new Error('displicit-local failed to load model\n"Displicit.update()" maybe?');
    };
    
    var img = await tf.node.decodeImage(res.data, 3);
    var classes = await model.classify(img);
    
    img.dispose();
    
    var reviewed = {
        sexy: {},
        porn: {},
        hentai: {},
        err: false
    };
    
    classes.forEach(async(c) => {
        if(c.className == "Sexy") reviewed.sexy = { name: "explicit", pr: c.probability };
        if(c.className == "Porn") reviewed.porn = { name: "pornography", pr: c.probability };
        if(c.className == "Hentai") reviewed.hentai = { name: "hentai", pr: c.probability };
    });
    
    tf.dispose(model);
    tf.dispose(classes);
    tf.disposeVariables();
    tf.engine().endScope();

    return reviewed;
};

function w (msg) {
    return chalk.yellow('WARN') + '  ' + msg;
};