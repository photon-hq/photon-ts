export type WithoutKey<K extends PropertyKey> = { [P in K]?: never };

export type OmitDiscriminant<T, K extends keyof T> = T extends any ? Omit<T, K> : never;

export type IsBroadString<T> = string extends T ? (T extends string ? true : false) : false;
