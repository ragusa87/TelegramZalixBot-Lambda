const ZalixBot = require("./ZalixBot");

exports.handler = function (event, context, callback) {
    try {
        let bucketName = process.env.BUCKET || "zalixbot";
        let bot = new ZalixBot(event.params.token, bucketName, false);
        bot.onMessage(event["body-json"].message).then(() => {
            callback(null, "OK");
        }).catch((error) => {
            callback(error);
        });
    } catch (error) {
        callback(error);
    }
};
