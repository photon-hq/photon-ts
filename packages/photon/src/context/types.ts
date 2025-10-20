import type { Context } from '../core/context'

/**
 * gRPC Context Request Message Type
 */
export interface GrpcContextRequestType {
    request_id: string
    project_id?: string
    context: GrpcContextDataType
}

/**
 * gRPC Context Response Message Type
 */
export interface GrpcContextResponseType {
    request_id: string
    success: boolean
    error?: string
    context?: GrpcContextDataType
}

/**
 * gRPC Context Data Structural Type
 */
export interface GrpcContextDataType {
    scope: string
    user: GrpcUserType
    states: Record<string, GrpcStatesType>
    agent_config?: GrpcAgentConfigType
}

/**
 * gRPC User Structural Type
 */
export interface GrpcUserType {
    id: string
    photon?: string
    email?: string
}

/**
 * gRPC States Structural Type
 */
export interface GrpcStatesType {
    json_data: string
}

/**
 * gRPC AgentConfig Structural Type
 */
export interface GrpcAgentConfigType {
    id: string
    instructions: string[]
}

/**
 * Context Builder Function Type
 * 
 * Receive the context (with agentConfig empty) and directly modify context.agentconfig
 * Note: Instead of returning a value, directly modify the passed-in Context
 */
export type ContextBuilderType = (
    context: Context,
    projectId?: string
) => Promise<void> | void

