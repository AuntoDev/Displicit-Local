var tf = require("@tensorflow/tfjs-node");
var nsfw = require("nsfwjs");
var axios = require("axios");
tf.enableProdMode();

console.debug(`displicit-local spawned process ${process.pid || '#'}`);

process.on('message', async msg => {
    var res = await check(msg.url);
    process.send(res);
    console.debug(`displicit-local process ${process.pid || '#'} has finished its tasks, killing it...`);
    process.exit();
});

async function check (url) {
    var res;

    try {
        res = await axios.get(url, {
            responseType: 'arraybuffer'
        });
    } catch(err) {
        console.error(err);
        return { err: true, msg: err };
    };

    if (!res || !res.data) return { err: true, msg: new Error(`The webserver located at ${url} either doesn't exist, refused to connect, is down, or displicit-local cannot access it.`) };

    tf.engine().startScope();

    var model;

    try {
        model = await nsfw.load(`file://${__dirname}/model/`, { size: 299 });
    } catch(err) {
        return { err: true, msg: new Error('displicit-local failed to load model\n"Displicit.update()" maybe?') };
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