const ZalixBot = require("./ZalixBot");

exports.handler = function (event, context, callback) {
    try {
        let bucketName = process.env.BUCKET || "zalixbot";
        let bot = new ZalixBot(event.params.token, bucketName, false);

        // Notify action
        // The body string is a simple message {notify:string}
        if(event["body-json"].hasOwnProperty("notify")){
          return bot.onNotifyAdmin(event["body-json"].notify).then(() => {
              callback(null, "OK");
          }).catch((error) => {
              callback(error);
          });
        }

        // Default action {message: string, ..}
        bot.onMessage(event["body-json"].message).then(() => {
            callback(null, "OK");
        }).catch((error) => {
            callback(error);
        });

    } catch (error) {
        callback(error);
    }
};
