interface SQLiteError extends Error {
  code?: string;
  errno?: number;
}

export class DatabaseError extends Error {
  public readonly originalError: SQLiteError | null;
  public readonly needsPermission: boolean;

  constructor(message: string, originalError?: SQLiteError) {
    super(message);
    this.name = "DatabaseError";
    this.originalError = originalError ?? null;
    this.needsPermission = originalError?.code === "SQLITE_AUTH";
  }
}
