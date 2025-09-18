import {App} from "../app.ts";
import "../modifiers/onboard.ts"; // Import to ensure module augmentation is applied

import a from "./a.ts";
import b from "./b.ts";
import {onboardModifier} from "../modifiers/onboard.ts";

const testApp = new App('1', 'b')
const h = testApp.use(onboardModifier)

export type TestApp = typeof testApp

const aApp = testApp.use(a)
aApp.use(b)