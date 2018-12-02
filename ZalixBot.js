const persiter = require("./Persister");
const fetch = require('node-fetch');
// https://core.telegram.org/bots/webhooks
// https://github.com/telegraf/telegraf/blob/develop/core/network/client.js
class ZalixBot {
    constructor(apiKey, bucketName, debug) {
        this.apiKey = apiKey;
        this.debug = debug;
        this.persister = new persiter.Persister(bucketName, this.apiKey.substring(0, 3));
    }

    //
    /**
     * Send a message via a Promise.
     * Inspired from https://github.com/telegraf/telegraf/blob/develop/core/network/client.js
     * @param {integer} chatId
     * @param {string} text
     * @returns {Promise}
     */
    messagePromise(chatId, text) {
        // For testing purpose, we do not send a message
        if (this.debug) {
            console.log("Fake send " + chatId + " > " + text);
            return Promise.resolve("OK");
        }

        // Send the real message using telegram api.
        return Promise.resolve({
            method: 'POST',
            compress: true,
            headers: {'content-type': 'application/json', 'connection': 'keep-alive'},
            body: JSON.stringify({
                'chat_id': chatId,
                'text': text
            })
        }).then((config) => {
            return fetch("https://api.telegram.org/bot" + this.apiKey + "/sendMessage", config);
        }).then((res) => {
            return res.text()
        }).then((text) => {
            return JSON.parse(text);
        }).then((data) => {
            if (!data.ok) {
                throw new Error(JSON.stringify(data));
            }
            return typeof data.result !== "undefined" ? data.result : null;
        });
    }
    onNotifyAdmin(message){
        return this.persister.load().then(() => {
            let adminId = this.persister.getAdminId();
            if (!adminId <= 0){
                throw new Error("No Admin yet")
            }
            if (!message){
                throw new Error("Message is empty")
            }
            this.messagePromise(adminId, message)
        });
   }
   onMessage(message) {
        if (!message.text || message.text.trim() === "") {
            return this.messagePromise(message.chat.id, "Vous devez saisir du texte uniquement");
        }

        return this.persister.load().then(() => {
            // Start add a guest
            if (message.text.toLowerCase().indexOf("/start") === 0) {
                if (!this.persister.getGuestId()) {
                    return this.persister.setGuestId(message.chat.id).then(() => {
                        return this.messagePromise(message.chat.id, "You are guest");
                    });
                }
                return this.messagePromise(message.chat.id, "There is already a guest");
            }

            // Stop erase the guest or reset the chat
            if (message.text.toLowerCase().indexOf("/stop") === 0) {
                if (message.chat.id === this.persister.getAdminId()) {
                    return this.persister.reset().then(() => {
                        return this.messagePromise(message.chat.id, "Resetting chat..");
                    });

                } else if (message.chat.id === this.persister.getGuestId()) {
                    return this.persister.setGuestId(0).then(() => {
                        return this.messagePromise(message.chat.id, "You are not a guest anymore");
                    })
                }

                return this.messagePromise(message.chat.id, "You are neither an admin or a guest")
            }

            // /admin set an admin if the password is correct (Ymd)
            if (message.text.toLowerCase().indexOf("/admin") === 0) {
                let password = message.text.toLowerCase().substring("/admin".length + 1);
                let date = new Date();
                let expectedPassword = date.getFullYear() + ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + date.getDate()).slice(-2);
                if (expectedPassword === password) {
                    return this.persister.setAdminId(message.chat.id).then(() => {
                        return this.messagePromise(message.chat.id, "You are admin")
                    });
                }
                return this.messagePromise(message.chat.id, "Bad password '" + password + "'");
            }

            // Forward messages between guest and admin
            if (this.persister.getAdminId() && this.persister.getGuestId()) {

                // Handle invalid command
                if (message.text.trim().substr(0, 1) === "/") {
                    return this.messagePromise(message.chat.id, "Commande invalide " + message.text);
                }

                // Send admin message to guest
                if (message.chat.id === this.persister.getAdminId()) {
                    return this.messagePromise(this.persister.getGuestId(), message.text);
                }
                // Send guest message to admin
                if (message.chat.id === this.persister.getGuestId()) {
                    return this.messagePromise(this.persister.getAdminId(), message.text);
                }

                // This is never used
                return this.messagePromise(message.chat.id, "You are not a guest, type /start to be guest or /admin.")
            } else {
                // Default message when there is no guest or no admin
                return this.messagePromise(message.chat.id, "Il faut connecter un admin et un guest pour commencer");
            }
        });
    }
}

module.exports = ZalixBot;
