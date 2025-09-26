import type { z } from "zod";
import { BasePhoton, type PhotonPlugin, type PluginMethods } from "../types";
import { type CompiledPhoton, compiledPhotonSchema } from "../types/compiled";
import { GatewayServer } from "../gateway/server";

type AnyPlugin = PhotonPlugin<string, "base" | "modifier", any, any, any>;

export class App<TState extends Record<string, any>> {
    private state: TState;
    private plugins: AnyPlugin[] = [];
    private basePluginName: string | null = null;

    public constructor(initialState: TState = {} as TState) {
        this.state = initialState;
    }

    public use<P extends PhotonPlugin<any, any, any, any, any>>(
        plugin: TState extends z.infer<P["inputSchema"]> ? P : "Error: Input state mismatch",
    ): this & PluginMethods<P> {
        const p = plugin as P;

        if (this.isBasePlugin(p)) {
            this.ensureNoBaseApplied();
            this.applyBasePlugin(p);
        } else {
            this.ensureBaseApplied();
        }

        this.plugins.push(p as AnyPlugin);

        const { setState, getState } = this.createStateAccessorsForPlugin(p);
        const pluginMethods = p.install(setState, getState);
        Object.assign(this, pluginMethods);

        return this as this & PluginMethods<P>;
    }

    public getState(): TState {
        return this.state;
    }

    public async deploy(apiKey?: string): Promise<void> {
        const key = apiKey || process.env.PHOTON_API_KEY;
        if (!key) {
            throw new Error("API key is required for deployment.");
        }
        const compiledPhoton = this.compile();
        console.log("\nCompiling Photon application...");
        console.dir(compiledPhoton, { depth: null });
        console.log("\nCompiled successfully.");
        const gateway = await GatewayServer.connect(key);
        await gateway.register(compiledPhoton);
        gateway.disconnect();
    }

    private isBasePlugin(p: AnyPlugin): p is PhotonPlugin<string, "base", any, any, any> {
        return p.type === "base";
    }

    private ensureNoBaseApplied(): void {
        if (this.basePluginName) {
            throw new Error("A base plugin has already been applied.");
        }
    }

    private ensureBaseApplied(): void {
        if (!this.basePluginName) {
            throw new Error("A modifier plugin cannot be applied before a base plugin.");
        }
    }

    private applyBasePlugin<P extends PhotonPlugin<string, "base", any, any, any>>(p: P): void {
        this.basePluginName = p.name;
        const initialState = p.outputSchema.parse({});
        this.state = {
            ...this.state,
            [p.name]: initialState,
            [BasePhoton]: p.name,
        } as TState;
    }

    private createStateAccessorsForPlugin<P extends PhotonPlugin<any, any, any, any, any>>(_p: P) {
        const setState = (newState: Partial<any>) => {
            if (!this.basePluginName) return;
            const currentBaseState = this.state[this.basePluginName as keyof TState];
            this.state = {
                ...this.state,
                [this.basePluginName]: { ...currentBaseState, ...newState },
            } as TState;
        };
        const getState = () => {
            if (!this.basePluginName) return;
            return this.state[this.basePluginName as keyof TState];
        };
        return { setState, getState } as const;
    }

    private compile(): CompiledPhoton {
        const stringKeyState: Record<string, any> = Object.fromEntries(
            Object.entries(this.state as Record<string, any>),
        );

        const compiledPlugins = this.plugins.map((p) => ({
            name: p.name,
            type: p.type,
            inputSchema: (p.inputSchema as any).shape || (p.inputSchema as any)._def,
            outputSchema: (p.outputSchema as any).shape || (p.outputSchema as any)._def,
        }));
        return compiledPhotonSchema.parse({ state: stringKeyState, plugins: compiledPlugins });
    }
}
