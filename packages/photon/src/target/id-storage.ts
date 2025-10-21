export class IDStorage {
    userByExternal: Record<string, string> = {};
    externalByUser: Record<string, string> = {};
    
    set(userId: string, externalId: string) {
        this.userByExternal[externalId] = userId;
        this.externalByUser[userId] = externalId;
    }
    
    getByUserId(userId: string): string | undefined {
        return this.externalByUser[userId];
    }
    
    getByExternalId(externalId: string): string | undefined {
        return this.userByExternal[externalId];
    }
}
