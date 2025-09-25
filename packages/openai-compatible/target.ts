import type { Target } from "photon";
import { startServer } from "./src/openai-server/start.ts";

export class OpenAICompatibleTarget implements Target {
    private readonly port: number;

    constructor(port: number = 3000) {
        this.port = port;
    }

    async start(): Promise<boolean> {
        startServer(this.port);

        return true;
    }
}
