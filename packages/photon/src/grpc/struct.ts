export type StructLike = { fields?: Record<string, any> };

export function toStruct(obj: any): StructLike {
    const fields: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj ?? {})) {
        if (value === null) {
            fields[key] = { nullValue: 0 };
        } else if (typeof value === "number") {
            fields[key] = { numberValue: value };
        } else if (typeof value === "string") {
            fields[key] = { stringValue: value };
        } else if (typeof value === "boolean") {
            fields[key] = { boolValue: value };
        } else if (Array.isArray(value)) {
            fields[key] = { listValue: { values: value.map((v) => toStructValue(v)) } };
        } else if (typeof value === "object") {
            fields[key] = { structValue: toStruct(value) };
        }
    }
    return { fields };
}

function toStructValue(value: any): any {
    if (value === null) return { nullValue: 0 };
    if (typeof value === "number") return { numberValue: value };
    if (typeof value === "string") return { stringValue: value };
    if (typeof value === "boolean") return { boolValue: value };
    if (Array.isArray(value)) return { listValue: { values: value.map(toStructValue) } };
    if (typeof value === "object") return { structValue: toStruct(value) };
    return {};
}

export function fromStruct(struct: StructLike | null | undefined): any {
    if (!struct?.fields) return {};
    const obj: Record<string, any> = {};
    for (const [key, value] of Object.entries(struct.fields)) {
        if (value.nullValue !== undefined) obj[key] = null;
        else if (value.numberValue !== undefined) obj[key] = value.numberValue;
        else if (value.stringValue !== undefined) obj[key] = value.stringValue;
        else if (value.boolValue !== undefined) obj[key] = value.boolValue;
        else if (value.structValue !== undefined) obj[key] = fromStruct(value.structValue);
        else if (value.listValue !== undefined)
            obj[key] = value.listValue.values.map((v: any) => fromStruct({ fields: { tmp: v } }).tmp);
    }
    return obj;
}
