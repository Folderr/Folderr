// A warning is a notification with this title. Warning a user, deleting a notification and clearing
// them all check it, so rename it here only; existing warnings keep the old title and lose their lock
export const WARNING_TITLE = "Warn";

/** How long a warning can't be deleted for, in milliseconds (90 days) */
export const WARNING_LOCK_MS = 90 * 24 * 60 * 60 * 1000;
