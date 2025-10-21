/**
 * Photon Service Proto Loader
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type GrpcObject, loadPackageDefinition, type ServiceDefinition } from "@grpc/grpc-js";
import { loadSync, type Options as ProtoLoaderOptions } from "@grpc/proto-loader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROTO_PATH = join(__dirname, "../../proto/photon-service.proto");

const PROTO_OPTIONS: ProtoLoaderOptions = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};

let protoCache: GrpcObject | null = null;

function loadProto(): GrpcObject {
    if (!protoCache) {
        const packageDef = loadSync(PROTO_PATH, PROTO_OPTIONS);
        protoCache = loadPackageDefinition(packageDef);
    }
    return protoCache;
}

/**
 * Get Gateway Service client constructor (Server connects to Gateway via bidirectional stream)
 */
export function getGatewayServiceClient(): any {
    const proto = loadProto();
    const service = (proto.photon as any)?.GatewayService;

    if (!service) {
        throw new Error("GatewayService not found");
    }

    return service;
}
