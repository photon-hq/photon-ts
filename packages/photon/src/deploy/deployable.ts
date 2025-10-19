import type { _Target } from "./target"

export type Deployable = {
    deploy(...targets: _Target[]): Promise<void>
    deploy(projectKey: string, ...targets: _Target[]): Promise<void>
}