export const ACCOUNT_DELETION_WINDOW_DAYS = 7;
export const ACCOUNT_DELETION_WINDOW_MS =
    ACCOUNT_DELETION_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export const DELETE_ACCOUNT_REASONS = [
    "Taking a break",
    "Privacy concerns",
    "Too many notifications",
    "Found another platform",
    "Not useful anymore",
    "Temporary issue",
    "Other",
] as const;

export const HIDDEN_ACCOUNT_STATUSES = new Set([
    "pending_deletion",
    "deactivated",
    "deleted",
]);

export const BLOCKED_LOGIN_STATUSES = new Set([
    "deactivated",
    "suspended",
    "deleted",
]);

export function getScheduledDeletionAt(baseDate = new Date()) {
    return new Date(baseDate.getTime() + ACCOUNT_DELETION_WINDOW_MS);
}

export function maskEmail(email?: string | null) {
    if (!email) {
        return null;
    }

    const [local, domain] = email.split("@");
    if (!local || !domain) {
        return email;
    }

    const visibleLocal = local.slice(0, 2);
    return `${visibleLocal}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

export function isPublicUserVisible(status?: string | null) {
    return !HIDDEN_ACCOUNT_STATUSES.has(String(status || "active"));
}

export function isPublicAuthorVisible(authorStatus?: string | null) {
    return !HIDDEN_ACCOUNT_STATUSES.has(String(authorStatus || "active"));
}

export function isBlockedLoginStatus(status?: string | null) {
    return BLOCKED_LOGIN_STATUSES.has(String(status || "active"));
}

export function isPendingDeletionWindowActive(input: {
    status?: string | null;
    scheduledDeletionAt?: string | null;
}, now = new Date()) {
    if (input.status !== "pending_deletion") {
        return false;
    }

    if (!input.scheduledDeletionAt) {
        return true;
    }

    const scheduledTime = Date.parse(input.scheduledDeletionAt);
    if (Number.isNaN(scheduledTime)) {
        return true;
    }

    return scheduledTime > now.getTime();
}

export function hasPendingDeletionExpired(input: {
    status?: string | null;
    scheduledDeletionAt?: string | null;
}, now = new Date()) {
    if (input.status !== "pending_deletion" || !input.scheduledDeletionAt) {
        return false;
    }

    const scheduledTime = Date.parse(input.scheduledDeletionAt);
    if (Number.isNaN(scheduledTime)) {
        return false;
    }

    return scheduledTime <= now.getTime();
}
