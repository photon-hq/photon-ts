/**
 * Photon Service Proto Loader
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type GrpcObject, loadPackageDefinition } from "@grpc/grpc-js";
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
        try {
            const packageDef = loadSync(PROTO_PATH, PROTO_OPTIONS);
            protoCache = loadPackageDefinition(packageDef);
        } catch (error) {
            throw new Error(`Failed to load Proto file at ${PROTO_PATH}: ${(error as Error).message}`);
        }
    }
    return protoCache;
}

/**
 * Get ServerService client (Server connects to Gateway)
 */
export function getServerServiceClient(): any {
    const proto = loadProto();
    const service = (proto.photon as any)?.ServerService;

    if (!service) {
        throw new Error("ServerService not found");
    }

    return service;
}

/**
 * Get TargetService client (Target connects to Gateway)
 */
export function getTargetServiceClient(): any {
    const proto = loadProto();
    const service = (proto.photon as any)?.TargetService;

    if (!service) {
        throw new Error("TargetService not found");
    }

    return service;
}

/**
 * Get ServerService definition (for Gateway server implementation)
 */
export function getServerServiceDefinition(): any {
    const proto = loadProto();
    const service = (proto.photon as any)?.ServerService?.service;

    if (!service) {
        throw new Error("ServerService definition not found");
    }

    return service;
}

/**
 * Get TargetService definition (for Gateway server implementation)
 */
export function getTargetServiceDefinition(): any {
    const proto = loadProto();
    const service = (proto.photon as any)?.TargetService?.service;

    if (!service) {
        throw new Error("TargetService definition not found");
    }

    return service;
}
