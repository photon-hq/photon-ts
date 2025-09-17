import type {SomeModifier} from "./some-modifier.ts";
import { App } from "../app.ts";

// Branded type to track onboarded apps
type OnboardedMarker = { readonly __onboarded: true };

// Check if already onboarded
type IsOnboarded<T> = T extends OnboardedMarker ? true : false;

// Onboard modifier can only be used once per app.
export const onboardModifier = {
    main<T extends App<any>>(
        app: IsOnboarded<T> extends true 
            ? "ERROR: Cannot use onboardModifier twice - app is already onboarded" 
            : T
    ): T & OnboardedMarker {
        const onboardedApp = Object.create(Object.getPrototypeOf(app));
        Object.assign(onboardedApp, app, { __onboarded: true as const });
        return onboardedApp as T & OnboardedMarker;
    }
} satisfies SomeModifier<any, any>;
