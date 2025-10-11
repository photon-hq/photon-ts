type IsEqual<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? (<T>() => T extends Y ? 1 : 2) extends <T>() => T extends X ? 1 : 2
        ? true
        : false
    : false;

type _DeepMerge<A, B> = [A] extends [never]
    ? B
    : [B] extends [never]
      ? A
      : IsEqual<A, B> extends true
        ? A
        : A extends readonly unknown[]
          ? B extends readonly unknown[]
              ? [...A, ...B]
              : B
          : A extends {}
            ? B extends {}
                ? {
                      [K in keyof A | keyof B]:
                          K extends keyof A
                              ? K extends keyof B
                                  ? DeepMerge<A[K], B[K]>
                                  : A[K]
                              : K extends keyof B
                                ? B[K]
                                : never;
                  }
                : B
            : B;

export type DeepMerge<A, B> = _DeepMerge<[A] extends [never] ? never : A, [B] extends [never] ? never : B>;
