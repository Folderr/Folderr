// We aren't going to force a length in our enums specifically because they are here due to
// Large length and consistency

enum PASSWORD {
	// Both describe regexs.password (Structures/Utilities/reg-exps.ts) and the frontend's copy of it
	PASSWORD_LENGTH_EXCEED = "Password is too long, it can be at most 256 characters",
	PASSWORD_REQUIREMENTS = "Password must be 8 to 256 characters long, with at least one letter and at least one punctuation mark or space, such as . , ! ? @ # - _",
	NO_NUL = "Password may not contain the NUL character",
}

enum USERNAME {
	USERNAME_LETTER_REQUIREMENTS = "Username may only contain lowercase letters, numbers, and an underscore.",
	USERNAME_LENGTH = "Username must be between 3 and 12 characters!",
}

enum EMAILER_SUBJECTS {
	VERIFY = "Folderr Account Verification",
	WELCOME = "Welcome to Folderr!",
	FORGOT_PASSWARD = "Your Folderr account password reset link",
	WARN = "Folderr Account Warning",
	BAN = "Folderr Account Banned",
	EMAIL_CHANGE = "Email Change Confirmation",
	TAKEDOWN = "Content Takedown",
}

// Responses are considered as anything the end user will see.
export const RESPONSES = {
	EMAILER_SUBJECTS,
	USERNAME,
	PASSWORD,
};

const ENUMS = {
	RESPONSES,
};

export default ENUMS;
