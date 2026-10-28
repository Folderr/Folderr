// Authorization locked  endpoints

// Admin Authorization locked endpoints for administration & moderation features
// Authroization locked owner endpoints
import OwnerManage from "./Management/manage.js";
// Public  endpoints
import Account from "./User/account.js";
import Login from "./User/authorize.js";
import DelAccount from "./User/delete-account.js";
import DeleteToken from "./User/delete-token.js";
// User Flexible Authorization endpoints
import Logout from "./User/logout.js";
// Authorization locked User-related endpoints
import Tokens from "./User/tokens.js";
import UpdateAcc from "./User/update-account.js";
import UploadFile from "./User/upload-file.js";

export const version = "2";
export const prefix = "/api";

export const endpoints = {
	DelAccount,
	Account,
	UpdateAcc,
	UploadFile,
	Login,
	Tokens,
	DeleteToken,
	OwnerManage,
	Logout,
};
