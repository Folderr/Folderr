// Authorization locked  endpoints

// Admin Authorization locked endpoints for administration & moderation features
import ConfigureShareX from "./configurator.js";
import AddAdmin from "./Management/add-admin.js";
// Authroization locked owner endpoints
import OwnerManage from "./Management/manage.js";
import DelAdmin from "./Management/remove-admin.js";
// Public  endpoints
import Info from "./private-info.js";
import Account from "./User/account.js";
import AddMirror from "./User/add-mirror.js";
import Login from "./User/authorize.js";
import DelNotifs from "./User/clear-notifications.js";
import DelAccount from "./User/delete-account.js";
import DeleteImage from "./User/delete-file.js";
import DeleteLink from "./User/delete-link.js";
import DelNotify from "./User/delete-notification.js";
import DeleteToken from "./User/delete-token.js";
import DenySelf from "./User/deny-self.js";
import Files from "./User/files.js";
import GenToken from "./User/generate-token.js";
import Links from "./User/links.js";
// User Flexible Authorization endpoints
import Logout from "./User/logout.js";
// Authorization locked User-related endpoints
import Notifs from "./User/notifications.js";
import RemoveMirror from "./User/remove-mirror.js";
import Shorten from "./User/shorten.js";
import Tokens from "./User/tokens.js";
import UpdateAcc from "./User/update-account.js";
import UploadFile from "./User/upload-file.js";
import VerifySelf from "./User/verify.js";

export const version = "2";
export const prefix = "/api";

export const endpoints = {
	Info,
	Configr: ConfigureShareX,
	Notifs,
	DelNotifs,
	DelAccount,
	Account,
	DelNotify,
	UpdateAcc,
	GenToken,
	Shorten,
	DeleteLink,
	Links,
	UploadFile,
	Files,
	DeleteImage,
	Login,
	AMirror: AddMirror,
	DMirror: RemoveMirror,
	DenySelf,
	Verify: VerifySelf,
	Tokens,
	DeleteToken,
	OwnerManage,
	AddAdmin,
	DelAdmin,
	Logout,
};
