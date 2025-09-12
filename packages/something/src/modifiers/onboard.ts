import type {SomeModifier} from "./some-modifier.ts";
import { App } from "../app.ts";

type OnboardedApp<S extends App<any>> = S & { onboard: true }

const onboardModifier: SomeModifier<App<any>, OnboardedApp<App<any>>> = {
    main(app: App<any>): OnboardedApp<App<any>> {
        return {...app, onboard: true} as OnboardedApp<App<any>>
    }
}

declare module "../app.ts" {
    interface App<S> {
        onboard(): S extends { onboard: true } ?
            never :
            OnboardedApp<App<S & { onboard: true }>>;
    }
}

App.prototype.onboard = function () {
    return onboardModifier.main(this);
}


export {};