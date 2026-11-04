export const usernameRegex = /^\w{3,16}$/;
// 8 to 256 characters, with a letter (any language) and a symbol, punctuation mark or space.
// Keep in sync with src/backend/Structures/Utilities/reg-exps.ts
export const passwordRegex =
	/^(?=.*\p{L})(?=.*[\p{M}\p{Z}\p{P}\p{S}]).{8,256}$/u;
export const emailRegex =
	/([\w.\-$%#!+/=^;&'*]{2,})?@[a-z\d$-_.+!*’(,;:@&=/]{2,}\.[a-z]{2,}(.[a-z]{2,})?/;
