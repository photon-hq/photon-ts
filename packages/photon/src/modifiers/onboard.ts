import type {SomeModifier} from "./some-modifier.ts";
import type {WithoutKey} from "../magictype";

export const onboardModifier: SomeModifier<string, string, WithoutKey<'onboard'>, {onboard: {}}> = {
    main(app) {
        app.photon = {
            ...(app.photon as any),
            onboard: {},
        }

        return app as any;
    }
};
