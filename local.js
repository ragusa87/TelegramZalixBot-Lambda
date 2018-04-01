/**
 * Use the bot from the commandline
 * > npm run start
 *
 * @type {ZalixBot}
 */
const ZalixBot = require("./ZalixBot");
const readline = require('readline');

let bucketName =  process.env.BUCKET || "zalixbot";
let bot = new ZalixBot("apiket", bucketName, true);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.prompt();
rl.on("line", (command) => {
    if ("quit" === command) {
        rl.close();
        return;
    }
    bot.onMessage({
        "date": 1441645532,
        "chat": {
            "last_name": "Test Lastname",
            "id": 26154595,
            "first_name": "Test",
            "username": "Test"
        },
        "message_id": 1365,
        "from": {
            "last_name": "Test Lastname",
            "id": 1111111,
            "first_name": "Test",
            "username": "Test"
        },
        "text": command
    })
        .then(() => rl.prompt())
        .catch((error) => {
            console.error(error);
            rl.prompt();
        });
});