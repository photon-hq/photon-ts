import type { SomeModifier } from "photon";

type InPhoton = {};

type OutPhoton = { prompt: 1 };

export function promptModifier(content: string): SomeModifier<InPhoton, OutPhoton> {
    return {
        main(app) {
            (app.photon as any)["prompt"] = content;
            return app as any;
        },
    };
}
