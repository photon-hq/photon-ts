import {App} from "../app.ts";

export interface SomeModifier {
    main(app: App): App
}