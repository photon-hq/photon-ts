import { App } from "photon";
import { promptModifier } from "../modifiers/prompt.ts";

const a1 = new App().onboard(() => {}).modifier(promptModifier("1"));
const a3 = new App().onboard(() => {});
const a2 = new App("hi", "hi");

const c = a2.use(a1);
