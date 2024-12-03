/**
 * Obtains parameters from the hash of the URL
 * @returns {Object} The hash parameters
 */
function getHashParameters() {
	const parameters = new Object();
	const parameterFilter = new RegExp(/([^&;=]+)=?([^&;]*)/, "g");
	const pureLocationHash = window.location.hash.substring(1);

	let match;
	while ((match = parameterFilter.exec(pureLocationHash))) {
		parameters[match[1]] = decodeURIComponent(match[2]);
	}
	return parameters;
}