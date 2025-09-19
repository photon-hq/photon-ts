import {App} from "../app.ts";
import "../modifiers/onboard.ts";
import {onboardA} from "./a.ts";
import {onboardB} from "./b.ts"; // Import to ensure module augmentation is applied

export const testApp = new App('1', 'b')

testApp.use(onboardA)
