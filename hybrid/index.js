class BothDevices {
	constructor(iosOptions = {}, androidOptions) {
		this.APNS = require('./apns')(iosOptions)
		this.FCM  = require('./fcm')(androidOptions)
	}

	async send(notifications) {
		try {
			return await _objectPromiseAll({
				ios: this.APNS.send(notifications),
				android: this.FCM.send(notifications)
			})
		} catch (err) {
			throw err
		}
	}

	async _objectPromiseAll(promise) {
		try {
			const results = await Promise.all(Object.values(promise))
			
			let obj = {}
			Object.keys(promise).map((key, index) => obj[key] = results[index])

			return obj
		} catch(err) {
			return err
		}
	}
}
module.exports = (iosOptions, androidOptions) => new BothDevices(iosOptions, androidOptions)