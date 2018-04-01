const AWS = require("aws-sdk");

class Persister {
    /**
     * Values are lazy loaded, call #load first.
     * @param bucket S3 bucket name
     * @param prefix
     */
    constructor(bucket, prefix) {
        this.bucket = bucket;
        this.prefix = prefix;
        this.adminId = 0;
        this.guestId = 0;
    }

    /**
     * Load one value
     * @param key
     * @returns {Promise<number>}
     */
    loadPromise(key) {
        return new AWS.S3().getObject({
            Bucket: this.bucket,
            Key: this.prefix + key
        }).promise().then((data) => {
            let number = parseInt(data.Body.toString('utf-8').trim(), 10);
            return isNaN(number) ? 0 : number;
        }, (error) => {
            console.error("Unable to load S3://" + this.bucket + "/" + this.prefix + key + ". Reason: " + error);
            return 0;
        });
    }

    /**
     * Load values for guestId and adminId
     * @returns {Promise}
     */
    load() {
        let adminPromise = this.loadPromise("admin");
        let guestPromise = this.loadPromise("guest");
        return Promise.all([adminPromise, guestPromise]).then((values) => {
            this.adminId = values[0];
            this.guestId = values[1];
        })
    }

    /**
     * Erase guest and admin id
     * @returns {Promise}
     */
    reset() {
        return Promise.all([this.setGuestId(0), this.setAdminId(0)]);
    }

    /**
     * Get admin id
     * @returns {number}
     */
    getAdminId() {
        return this.adminId;
    }

    /**
     * Get guest id
     * @returns {number}
     */
    getGuestId() {
        return this.guestId;
    }

    /**
     * Save vale
     * @param key admin/guest
     * @param {integer} value
     * @returns {Promise}
     */
    save(key, value) {
        return new AWS.S3().putObject({
            Bucket: this.bucket,
            Key: this.prefix + key,
            Body: "" + value
        }).promise().then(
            function (success) {
                return Promise.resolve(success);
            }, function (failure) {
                return Promise.reject(new Error("AWS Save failed " + failure));
            })
    }

    /**
     * Set guest id
     * @param value
     * @returns {Promise}
     */
    setGuestId(value) {
        this.guestId = value;
        return this.save("guest", value);
    }

    /**
     * Set admin id
     * @param value
     * @returns {Promise}
     */
    setAdminId(value) {
        this.adminId = value;
        return this.save("admin", value);
    }
}

module.exports = {Persister};
