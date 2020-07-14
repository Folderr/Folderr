/* eslint @typescript-eslint/camelcase: "off" */

/**
 * @fileoverview Codes to send in the response
 */

export interface FoldCodes {
    file_parse_error: number;
    no_file: number;
    no_update: number;
    file_mime_error: number;
    file_size_limit: number;
    file_forbidden_mime: number;
    file_delete: number;
    file_unknown_error: number;
    no_user_found: number;
    no_input: number;
    partial_input: number;
    illegal_input: number;
    invalid_password: number;
    illegal_password: number;
    password_size: number;
    password_error: number;
    username_or_email_taken: number;
    illegal_username: number;
    username_size_limit: number;
    db_error: number;
    fatal_lock: number;
    locked: number;
    short_url_not_found: number;
    short_url_invalid: number;
    short_url_missing: number;
    admin_add: number;
    admin_remove: number;
    user_delete: number;
    user_update: number;
    user_create: number;
    signup_requested: number;
    signup_error: number;
    user_denied_admin: number;
    user_denied: number;
    user_accepted: number;
    user_accepted_admin: number;
    token_add: number;
    token_size_limit: number;
    token_remove: number;
    tokens_purge: number;
    link_delete: number;
    link_unknown_error: number;
    notification_delete: number;
    notifications_purge: number;
    eval_error: number;
    eval_size_limit: number;
    mirror_add: number;
    mirror_remove: number;
    mirror_unauthorized: number;
    mirror_invalid_url: number;
    mirror_reject: number;
    mirror_banned_url: number;
    unknown_error: number;
    db_unknown_error: number;
    db_not_found: number;
    permission_deny: number;
    security_error: number;
    external_error: number;
    bad_email: number;
    emailer_not_configured: number;
    banned_email: number;
    email_sent: number;
}

export const FoldCodes: FoldCodes = {
    file_parse_error: 1000,
    no_file: 1001,
    no_update: 1002,
    file_mime_error: 1003,
    file_size_limit: 1004,
    file_forbidden_mime: 1005,
    file_delete: 1006,
    file_unknown_error: 1007,
    no_user_found: 1008,
    no_input: 1009,
    partial_input: 1010,
    illegal_input: 1011,
    invalid_password: 1012,
    illegal_password: 1013,
    password_size: 1014,
    password_error: 1015,
    username_or_email_taken: 1016,
    illegal_username: 1017,
    username_size_limit: 1018,
    db_error: 1019,
    fatal_lock: 1020,
    locked: 1021,
    short_url_not_found: 1022,
    short_url_invalid: 1023,
    short_url_missing: 1024,
    admin_add: 1025,
    admin_remove: 1026,
    user_delete: 1027,
    user_update: 1028,
    user_create: 1029,
    signup_requested: 1030,
    signup_error: 1031,
    user_denied_admin: 1032,
    user_denied: 1033,
    user_accepted: 1034,
    user_accepted_admin: 1035,
    token_add: 1036,
    token_size_limit: 1037,
    token_remove: 1038,
    tokens_purge: 1039,
    link_delete: 1040,
    link_unknown_error: 1041,
    notification_delete: 1042,
    notifications_purge: 1043,
    eval_error: 1044,
    eval_size_limit: 1045,
    mirror_add: 1046,
    mirror_remove: 1047,
    mirror_unauthorized: 1048,
    mirror_reject: 1049,
    mirror_invalid_url: 1050,
    mirror_banned_url: 1051,
    unknown_error: 1052,
    db_unknown_error: 1053,
    db_not_found: 1054,
    permission_deny: 1055,
    security_error: 1056,
    external_error: 1057,
    bad_email: 1058,
    emailer_not_configured: 1059,
    banned_email: 1060,
    email_sent: 1061,
};

export default FoldCodes;
