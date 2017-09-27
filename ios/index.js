const fs = require('fs')
const http2 = require('http2')

class APNS {
    constructor(options = {}) {
        this.key = options.key ? fs.readFileSync(options.key) : null;
        this.cert = options.cert ? fs.readFileSync(options.cert) : null;
        this.p12 = options.p12 ? fs.readFileSync(options.p12) : null;
        this.password = options.password;
        this.bundle = options.bundle;
        this.production = options.production ? options.production : false;
    }
    async send(notifications) {
        try {
            return await Promise.all(_sendPushNotification(notifications));
        } catch (err) {
            throw err
        }
    }
    async _sendPushNotification(notifications) {
        try {
            let self = this
            if (!notifications) { throw new Error("INVALID_NOTIFICATION_OBJECT") }

            notifications = (!Array.isArray(notifications)) ? [notifications] : notifications
            let params = {
                method:     'POST',
                host:       (this.production) ? 'api.push.apple.com' : 'api.development.push.apple.com',
                port:       443,
                path:       '/3/device/',
                key:        (this.key) ? this.key : undefined,
                cert:       (this.cert) ? this.cert : undefined,
                pfx:        (this.p12) ? this.p12 : undefined,
                passphrase: (this.password) ? this.password: undefined,
                headers:    {
                    'apns-topic': (this.bundle) ? this.bundle : undefined
                }
            }

            notifications = notifications.reduce((array, notification) => self._splitNotifications(array, notification), [])

            return notifications.map(notification => self._buildRequest(params, notification))
        } catch (err) {
            throw err
        }
    }
    _splitNotifications(array, notification) {
        if (Array.isArray(notification.to)) { array.push(this._remapNotification(notification.to, notification)) }
        else {
            for (const device in notification.to) {
                array.push(_remapNotification(device, notification))
            }
        }

        return array
    }
    _remapNotification(device, push) {
        return {
            aps: (push.aps) ? push.aps : { badge: 0, sound: "default" },
            notification : (typeof push.notification == 'string') ? { body: push.notification } : push.notification,
            priority : (push.priority == 10) ? push.priority : 5,
            expiration : push.expiration,
            to: device
        }
    }
    _prepareParams(params, notification) {
        params.path += notification.to
        params.headers = {
            'apns-priority': (notification.priority) ? notification.priority : undefined,
            'apns-expiration': (notification.expiration) ? notification.expiration : undefined
        }

        return params
    }
    _ensureParams(params) {
        switch (true){
            case (!params.notification): throw new Error('MISSING_NOTIFICATION')
            case (!params.to): throw new Error('MISSING_DEVICE')
            default: return
        }
    }
    _buildBody(push){
        const body = { aps: push.aps, data: push.data }
        body.aps.alert = push.notification
    }
    async _buildRequest(params, notification) {
        try{
            this._ensureParams(params)
            params = this._prepareParams(JSON.parse(JSON.stringify(params)), push)
            let body = _buildBody(notification)
            
            return await this._post(body, params, notification)
        } catch (err) {
            throw err
        }
    }
    async _post(body, params, notification) {
        return new Promise((resolve, reject) => {
            const req = http2.request(options, res => {
                const data = []

                res.on('data', (chunks) => data.push(chunks.toString('utf8')))
                res.on('end', () => {
                    res.body = data.join('')
                    resolve({
                        status: res.statusCode,
                        body: (res.body != '') ? res.body : undefined
                    })
                })
            })
            req.on('error', (err) => reject(err))
            req.write(JSON.stringify(body))
            req.end();
        })
    }
}

function instantiate(options) {
    return new APNS(options)
}
module.exports = instantiate