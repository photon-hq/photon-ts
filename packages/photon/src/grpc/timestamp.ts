export type TimestampLike = {
    seconds: number;
    nanos: number;
};

/**
 * Converts a JS Date (or string/number) to a google.protobuf.Timestamp-compatible object.
 * Always returns a valid TimestampLike.
 */
export function toTimestamp(value: Date | string | number | null): TimestampLike {
    const date = value === null ? new Date(0) : value instanceof Date ? value : new Date(value);
    const millis = date.getTime();
    return {
        seconds: Math.floor(millis / 1000),
        nanos: (millis % 1000) * 1e6,
    };
}

/**
 * Converts a google.protobuf.Timestamp to a JS Date.
 * Returns null if invalid.
 */
export function fromTimestamp(timestamp: TimestampLike): Date {
    const seconds = Number(timestamp.seconds ?? 0);
    const nanos = timestamp.nanos ?? 0;
    return new Date(seconds * 1000 + nanos / 1e6);
}

/**
 * Returns the current UTC time as TimestampLike.
 */
export function nowTimestamp(): TimestampLike {
    return toTimestamp(new Date());
}
