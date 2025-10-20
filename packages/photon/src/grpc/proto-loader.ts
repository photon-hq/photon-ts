/**
 * Context Service Proto Loader (SDK)
 */

import {
  type GrpcObject,
  type ServiceDefinition,
  loadPackageDefinition
} from '@grpc/grpc-js'
import {
  loadSync,
  type Options as ProtoLoaderOptions
} from '@grpc/proto-loader'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROTO_PATH = join(__dirname, '../../../../proto/context-service.proto')

const PROTO_OPTIONS: ProtoLoaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
}

/**
 * Load the Proto definition
 */
let protoCache: GrpcObject | null = null

function loadProto(): GrpcObject {
  if (!protoCache) {
    const packageDef = loadSync(PROTO_PATH, PROTO_OPTIONS)
    protoCache = loadPackageDefinition(packageDef)
  }
  return protoCache
}

/**
 * Obtain the ContextService service definition (Server side)
 */
export function getContextServiceDefinition(): ServiceDefinition {
  const proto = loadProto()
  const service = (proto.photon as any)?.context?.ContextService?.service
  
  if (!service) {
    throw new Error('ContextService definition not found')
  }
  
  return service
}
