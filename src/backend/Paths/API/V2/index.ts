// Authorization locked  endpoints
import Info from './private-info';
import ConfigureShareX from './configurator';

// Public  endpoints
import Signup from './Public/signup';
import Pong from './Public/pong';

// Authorization locked User-related endpoints
import Notifs from './User/notifications';
import DelNotifs from './User/clear-notifications';
import DelAccount from './User/delete-account';
import Account from './User/account';
import AdminNotify from './Admin/admin-notification';
import DelNotify from './User/delete-notification';
import DelAdminNotify from './Admin/delete-admin-notiification';
import UpdateAcc from './User/update-account';
import GenToken from './User/generate-token';
import Shorten from './User/shorten';
import DeleteLink from './User/delete-link';
import Links from './User/links';
import UploadFile from './User/upload-file';
import Files from './User/files';
import DeleteImage from './User/delete-file';
import Login from './User/authorize';
import AddMirror from './User/add-mirror';
import RemoveMirror from './User/remove-mirror';
import VerifySelf from './User/verify';
import DenySelf from './User/deny-self';
import Tokens from './User/tokens';
import DeleteToken from './User/delete-token';

// Admin Authorization locked endpoints for administration & moderation features
import Ban from './Admin/ban';
import Unban from './Admin/unban';
import Warn from './Admin/warn-user';
import Takedown from './Admin/takedown';
import Lookup from './Admin/lookup-content';
import AccountLookup from './Admin/reverse-lookup-account';
import PVerify from './Admin/verify-account';
import DVerify from './Admin/deny-account';
import Users from './Admin/users';

// Authroization locked owner endpoints
import OwnerManage from './Management/manage';
import Eval from './Management/eval';
import AddAdmin from './Management/add-admin';
import DelAdmin from './Management/remove-admin';

export const version = '2';
export const prefix = '/api';

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
	OwnerManage,
	Eval,
	AddAdmin,
	DelAdmin
};
