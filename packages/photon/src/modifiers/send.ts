import type { SomeModifier } from "../core/some-modifier.ts";
import { _get, _set } from "../utils.ts";

interface InPhoton {
    onboard: {
        flow: { type: string; content: string }[];
    };
}

export function sendModifier(content: string): SomeModifier<InPhoton, {}> {
    return {
        main(app) {
            const current = _get(app.photon, "onboard.flow", []);
            _set(app.photon, "onboard.flow", [
                ...current,
                {
                    type: "send",
                    content,
                },
            ]);
            return app;
        },
    };
}
