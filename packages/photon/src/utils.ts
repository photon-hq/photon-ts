export const _set = (obj: any, path: string, value: any) => {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key === undefined) continue;
        if (current[key] === undefined) {
            current[key] = {};
        }
        current = current[key];
    }
    const lastKey = keys[keys.length - 1];
    if (lastKey !== undefined) {
        current[lastKey] = value;
    }
};

export const _get = (obj: any, path: string, defaultValue: any) => {
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
        if (key === undefined) continue;
        if (current === undefined) {
            return defaultValue;
        }
        current = current[key];
    }
    return current;
};
