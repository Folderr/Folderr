export const usernameRegex = /^\w{3,16}$/;
export const passwordRegex = /(?=.*[A-Za-z-_])(?=.*[\p{M}\p{Z}\p{P}]).{8,256}/u;
export const emailRegex =
	/([\w.\-$%#!+/=^;&'*]{2,})?@[a-z\d$-_.+!*’(,;:@&=/]{2,}\.[a-z]{2,}(.[a-z]{2,})?/;