//START OF COOKIE HANDLING
function setCookie(key, value) {
	document.cookie = `${key}=${value}`;
}

function getCookie(key) {
	let cookies = document.cookie.split('; ');
	let value;

	cookies.forEach((pair) => {
		let splitPair = pair.split('=');

		if (splitPair[0] === key) {
			value = splitPair[1];
		}
	});

	return value;
}
//END OF COOKIE HANDLING
