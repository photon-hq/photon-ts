import { App } from "photon";
import { promptModifier } from "../modifiers/prompt.ts";

const a1 = new App().onboard((context) => {
    context.send("Hello, world!");
}, "hi")