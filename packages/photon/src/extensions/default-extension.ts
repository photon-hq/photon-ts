import { z } from "zod";
import { sendAction } from "../actions/send.ts";
import type { SomeExtension } from "../core/some-extension.ts";
import { compiledPhotonSchema } from "../types";

export const defaultExtensions = {
    actions: {
        send: sendAction,
    },
    photonType: compiledPhotonSchema,
} satisfies SomeExtension;
