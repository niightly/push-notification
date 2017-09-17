module.exports = (params, module) => {
	if (!module && (!params.hasOwnProperty('ios') && !params.hasOwnProperty('android'))) {
		throw new Error("INVALID_PARAMS")
	}

	let setModule
	let tmpParams = (params[module] || params)

	switch (module) {
		case 'ios': return new require('./ios/')(tmpParams)
		case 'android': return new require('./android/')(tmpParams)
		default: return new require('./hybrid/')(params.ios, params.android)
	}
}
