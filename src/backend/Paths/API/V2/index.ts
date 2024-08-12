/* eslint-disable @typescript-eslint/naming-convention */
// Authorization locked  endpoints
import Info from "./private-info.js";
import ConfigureShareX from "./configurator.js";

// Public  endpoints
import Signup from "./Public/signup.js";
import Pong from "./Public/pong.js";

// Authorization locked User-related endpoints
import Notifs from "./User/notifications.js";
import DelNotifs from "./User/clear-notifications.js";
import DelAccount from "./User/delete-account.js";
import Account from "./User/account.js";
import AdminNotify from "./Admin/admin-notification.js";
import DelNotify from "./User/delete-notification.js";
import DelAdminNotify from "./Admin/delete-admin-notiification.js";
import UpdateAcc from "./User/update-account.js";
import GenToken from "./User/generate-token.js";
import Shorten from "./User/shorten.js";
import DeleteLink from "./User/delete-link.js";
import Links from "./User/links.js";
import UploadFile from "./User/upload-file.js";
import Files from "./User/files.js";
import DeleteImage from "./User/delete-file.js";
import Login from "./User/authorize.js";
import AddMirror from "./User/add-mirror.js";
import RemoveMirror from "./User/remove-mirror.js";
import VerifySelf from "./User/verify.js";
import DenySelf from "./User/deny-self.js";
import Tokens from "./User/tokens.js";
import DeleteToken from "./User/delete-token.js";

// User Flexible Authorization endpoints
import Logout from "./User/logout.js";

// Admin Authorization locked endpoints for administration & moderation features
import Ban from "./Admin/ban.js";
import Unban from "./Admin/unban.js";
import Warn from "./Admin/warn-user.js";
import Takedown from "./Admin/takedown.js";
import Lookup from "./Admin/lookup-content.js";
import AccountLookup from "./Admin/reverse-lookup-account.js";
import PVerify from "./Admin/verify-account.js";
import DVerify from "./Admin/deny-account.js";
import Users from "./Admin/users.js";
import Stats from "./Admin/statistics.js";

// Authroization locked owner endpoints
import OwnerManage from "./Management/manage.js";
import Eval from "./Management/eval.js";
import AddAdmin from "./Management/add-admin.js";
import DelAdmin from "./Management/remove-admin.js";

export const version = "2";
export const prefix = "/api";

export const endpoints = {
	Info,
	Configr: ConfigureShareX,
	Signup,
	Pong,
	Notifs,
	DelNotifs,
	DelAccount,
	Account,
	AdminNotify,
	DelNotify,
	DelAdminNotify,
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
	DVerify,
	DenySelf,
	Verify: VerifySelf,
	Tokens,
	DeleteToken,
	Ban,
	Unban,
	Warn,
	Takedown,
	Lookup,
	AccountLookup,
	PVerify,
	Users,
	Stats,
	OwnerManage,
	Eval,
	AddAdmin,
	DelAdmin,
	Logout,
};
