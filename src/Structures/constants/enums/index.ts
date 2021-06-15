/* eslint max-len: ["off"] */

// We aren't going to force a length in our enums specifically because they are here due to
// Large length and consistency

enum PASSWORD {
	PASSWORD_LENGTH_EXCEED = 'Password is too long, password must be between 8 and 32 characters of length',
	PASSWORD_REQUIREMENTS = 'Password must be 8-32 characters long, must contain 1 uppercase and lowercase letter, and 1 digit. Password may contain "_", "&", "."',
	NO_NUL = 'Password may not contain the NUL character'
}

enum USERNAME {
	USERNAME_LETTER_REQUIREMENTS = 'Username may only contain lowercase letters, numbers, and an underscore.',
	USERNAME_LENGTH = 'Username must be between 3 and 12 characters!'
}

enum EMAILER_SUBJECTS {
	VERIFY = 'Folderr Account Verification',
	FORGOT_PASSWARD = 'Your Folderr account has had a password reset request',
	WARN = 'Folderr Account Warning',
	BAN = 'Folderr Account Banned',
	EMAIL_CHANGE = 'Email Change Confirmation',
	TAKEDOWN = 'Content Takedown'
}

// Responses are considered as anything the end user will see.
export const RESPONSES = {
	EMAILER_SUBJECTS,
	USERNAME,
	PASSWORD
};

const ENUMS = {
	RESPONSES
};

export default ENUMS;
