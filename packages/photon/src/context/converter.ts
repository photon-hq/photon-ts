/**
 * Context message converter
 */

import type { Context } from '../core/context'
import type {
  GrpcContextDataType,
  GrpcContextRequestType,
  GrpcContextResponseType
} from './types'

/**
 * Convert gRPC request to TypeScript Context
 */
export function grpcRequestToContext(request: GrpcContextRequestType): {
  context: Context
  projectId?: string
} {
  const data = request.context

  const states: Record<string, Record<string, any>> = {}
  
  try {
    for (const [key, value] of Object.entries(data.states)) {
      states[key] = JSON.parse(value.json_data)
    }
  } catch (error) {
    throw new Error(`Failed to parse states: ${(error as Error).message}`)
  }

  return {
    context: {
      scope: data.scope,
      user: {
        id: data.user.id,
        photon: data.user.photon ?? null,
        email: data.user.email ?? null
      },
      states,
      agentConfig: data.agent_config ? {
        id: data.agent_config.id,
        instructions: data.agent_config.instructions
      } : {
        id: '',
        instructions: []
      }
    },
    projectId: request.project_id
  }
}

/**
 * Convert complete Context to gRPC response
 */
export function contextToGrpcResponse(
  requestId: string,
  context: Context
): GrpcContextResponseType {
  return {
    request_id: requestId,
    success: true,
    context: contextToGrpcData(context)
  }
}

/**
 * Create error response
 */
export function createErrorResponse(
  requestId: string,
  error: Error
): GrpcContextResponseType {
  return {
    request_id: requestId,
    success: false,
    error: error.message
  }
}

/**
 * Convert Context to gRPC ContextData
 */
function contextToGrpcData(context: Context): GrpcContextDataType {
  const grpcStates: Record<string, { json_data: string }> = {}
  
  try {
    for (const [key, value] of Object.entries(context.states)) {
      grpcStates[key] = {
        json_data: JSON.stringify(value)
      }
    }
  } catch (error) {
    throw new Error(`Failed to serialize states: ${(error as Error).message}`)
  }

  return {
    scope: context.scope,
    user: {
      id: context.user.id,
      photon: context.user.photon ?? undefined,
      email: context.user.email ?? undefined
    },
    states: grpcStates,
    agent_config: {
      id: context.agentConfig.id,
      instructions: context.agentConfig.instructions
    }
  }
}

