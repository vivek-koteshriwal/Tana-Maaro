export const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const VIDEO_UPLOAD_LIMIT_MESSAGE =
    "Your video exceeds the 100 MB upload limit. Please compress or reduce the file size before uploading.";

export const IMAGE_UPLOAD_LIMIT_MESSAGE =
    "Your image exceeds the 5 MB upload limit. Please compress or reduce the file size before uploading.";

export const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/avif",
];

export const ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/quicktime",
    "video/webm",
];

export const ALLOWED_UPLOAD_TYPES = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_VIDEO_TYPES,
];

export function isVideoContentType(contentType: string) {
    return ALLOWED_VIDEO_TYPES.includes(contentType);
}

export function isImageContentType(contentType: string) {
    return ALLOWED_IMAGE_TYPES.includes(contentType);
}

export function validateUploadMetadata({
    contentType,
    fileSize,
}: {
    contentType: string;
    fileSize?: number | null;
}) {
    if (!ALLOWED_UPLOAD_TYPES.includes(contentType)) {
        return "Invalid file format. Only images and standard videos are supported.";
    }

    if (typeof fileSize !== "number" || Number.isNaN(fileSize)) {
        return null;
    }

    if (isVideoContentType(contentType) && fileSize > MAX_VIDEO_UPLOAD_BYTES) {
        return VIDEO_UPLOAD_LIMIT_MESSAGE;
    }

    if (isImageContentType(contentType) && fileSize > MAX_IMAGE_UPLOAD_BYTES) {
        return IMAGE_UPLOAD_LIMIT_MESSAGE;
    }

    return null;
}
