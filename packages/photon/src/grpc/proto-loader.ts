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
        const packageDef = loadSync(PROTO_PATH, PROTO_OPTIONS);
        protoCache = loadPackageDefinition(packageDef);
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
 * Get ServerService client (Target connects to Gateway)
 */
export function getTargetServiceClient(): any {
    const proto = loadProto();
    const service = (proto.photon as any)?.TargetService;

    if (!service) {
        throw new Error("TargetService not found");
    }

    return service;
}
