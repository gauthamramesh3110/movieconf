let createRoom = document.getElementById('create-room');
let joinRoom = document.getElementById('join-room');
let nickname = document.getElementById('nickname');
let warning = document.getElementById('warning');

createRoom.onclick = function (e) {
	if (!isNicknameValid(nickname.value)) {
		nickname.style.borderColor = 'red';
		warning.style.visibility = 'visible';
		return;
	}

	fetch('/create-room')
		.then((res) => {
			return res.json();
		})
		.then((data) => {
			setCookie('roomId', data.roomId);
			setCookie('nickname', nickname.value);
			setCookie('isHost', true);
			window.location.href = '/home.html';
		});
};

joinRoom.onclick = function (e) {
	if (!isNicknameValid(nickname.value)) {
		nickname.style.borderColor = 'red';
		warning.style.visibility = 'visible';
		return;
	}

	let roomId = prompt('Enter Room ID: ');

	if (roomId == null || roomId.length == 0) {
		return;
	}

	setCookie('roomId', roomId);
	setCookie('nickname', nickname.value);
	setCookie('isHost', false);
	window.location.href = '/home.html';
};

//START OF NICKNAME REACTION CONTROLS
nickname.oninput = function (e) {
	if (!isNicknameValid(nickname.value)) {
		nickname.style.borderColor = 'red';
		warning.style.visibility = 'visible';
	} else {
		nickname.style.borderColor = '#19297c';
		warning.style.visibility = 'hidden';
	}
};

nickname.onblur = function (e) {
	if (isNicknameValid(nickname.value)) {
		nickname.style.borderColor = 'lightslategray';
		warning.style.visibility = 'hidden';
	}
};

nickname.onfocus = function (e) {
	if (isNicknameValid(nickname.value)) {
		nickname.style.borderColor = '#19297c';
		warning.style.visibility = 'hidden';
	}
};
// END OF NICKNAME REACTION CONTROLS

//START OF NICKNAME VALIDATION

function isNicknameValid(nickname) {
	if (nickname.length >= 5 && nickname.length <= 20) {
		return true;
	}
	return false;
}

//END OF NICKNAME VALIDATION
