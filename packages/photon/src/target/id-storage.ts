export class IDStorage {
    userByExternal: Record<string, string> = {};
    externalByUser: Record<string, string> = {};

    set(v: { userId: string; externalId: string }) {
        this.userByExternal[v.externalId] = v.userId;
        this.externalByUser[v.userId] = v.externalId;
    }

    getByUserId(userId: string): string | undefined {
        return this.externalByUser[userId];
    }

    getByExternalId(externalId: string): string | undefined {
        return this.userByExternal[externalId];
    }
}
