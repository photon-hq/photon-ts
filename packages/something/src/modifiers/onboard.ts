import type {SomeModifier} from "./some-modifier.ts";
import { App } from "../app.ts";

/// First Message from User
const onboardModifier: SomeModifier = {
    main(app: App): App {
        return app
    }
}

declare module "../app.ts" {
    interface App {
        onboard(): App;
    }
}


App.prototype.onboard = function () {
    return onboardModifier.main(this);
}

export {};