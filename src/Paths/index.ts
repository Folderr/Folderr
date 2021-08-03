// Export { default as Home } from './Home';
export {default as Short} from './short';
export {default as Images} from './image';
export {default as Videos} from './video';
export {default as Files} from './files';

// Authorization locked API endpoints
export {default as APIInfo} from './API/private-info';
export {default as APIConfigr} from './API/configurator';

// Public API endpoints
export {default as APISignup} from './API/Public/signup';
export {default as APIPong} from './API/Public/pong';

// Authorization locked User-related endpoints
export {default as APINotifs} from './API/User/notifications';
export {default as APIDNotifs} from './API/User/clear-notifications';
export {default as APIDAccount} from './API/User/delete-account';
export {default as APIAccount} from './API/User/account';
export {default as APIAdminNotify} from './API/Admin/admin-notification';
export {default as APIDNotify} from './API/User/delete-notification';
export {default as APIDAdminNotify} from './API/Admin/delete-admin-notiification';
export {default as APIUpdateAcc} from './API/User/update-account';
export {default as APIGenToken} from './API/User/generate-token';
export {default as APIShorten} from './API/User/shorten';
export {default as APIDeleteLink} from './API/User/delete-link';
export {default as APILinks} from './API/User/links';
export {default as APIUploadFile} from './API/User/upload-file';
export {default as APIFiles} from './API/User/files';
export {default as APIDeleteImage} from './API/User/delete-file';
export {default as APILogin} from './API/User/authorize';
export {default as APIAVEXR} from './API/User/add-mirror';
export {default as APIDVEXR} from './API/User/remove-mirror';
export {default as Verify} from './API/User/verify';
export {default as DenySelf} from './API/User/deny-self';
export {default as APITokens} from './API/User/tokens';
export {default as APIDeleteToken} from './API/User/delete-token';

// Admin Authorization locked endpoints for administration & moderation features
export {default as APIBan} from './API/Admin/ban';
export {default as APIUnban} from './API/Admin/unban';
export {default as APIWarn} from './API/Admin/warn-user';
export {default as APITakedown} from './API/Admin/takedown';
export {default as APILookup} from './API/Admin/lookup-content';
export {default as APIAccountLookup} from './API/Admin/reverse-lookup-account';
export {default as APIPVerify} from './API/Admin/verify-account';
export {default as APIDVerify} from './API/Admin/deny-account';
export {default as APIUsers} from './API/Admin/users';

// Authroization locked owner endpoints
export {default as APIOwnerManage} from './API/Management/manage';
export {default as APIEval} from './API/Management/eval';
export {default as APIAddAdmin} from './API/Management/add-admin';
export {default as APIDelAdmin} from './API/Management/remove-admin';
