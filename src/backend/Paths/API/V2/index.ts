// Authorization locked  endpoints

// Admin Authorization locked endpoints for administration & moderation features
// Authroization locked owner endpoints
import OwnerManage from "./Management/manage.js";
// Public  endpoints
import Account from "./User/account.js";
import AddMirror from "./User/add-mirror.js";
import Login from "./User/authorize.js";
import DelAccount from "./User/delete-account.js";
import DeleteToken from "./User/delete-token.js";
import DenySelf from "./User/deny-self.js";
// User Flexible Authorization endpoints
import Logout from "./User/logout.js";
// Authorization locked User-related endpoints
import RemoveMirror from "./User/remove-mirror.js";
import Shorten from "./User/shorten.js";
import Tokens from "./User/tokens.js";
import UpdateAcc from "./User/update-account.js";
import UploadFile from "./User/upload-file.js";
import VerifySelf from "./User/verify.js";

export const version = "2";
export const prefix = "/api";

export const endpoints = {
	DelAccount,
	Account,
	UpdateAcc,
	Shorten,
	UploadFile,
	Login,
	AMirror: AddMirror,
	DMirror: RemoveMirror,
	DenySelf,
	Verify: VerifySelf,
	Tokens,
	DeleteToken,
	OwnerManage,
	Logout,
};
