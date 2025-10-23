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

export function loadProto(): GrpcObject {
    if (!protoCache) {
        const packageDef = loadSync(PROTO_PATH, PROTO_OPTIONS);
        protoCache = loadPackageDefinition(packageDef);
    }
    return protoCache;
}

export const serverService = () => {
    const proto = loadProto();
    return (proto.photon as any).ServerService.service;
}

export const targetService = () => {
    const proto = loadProto();
    return (proto.photon as any).TargetService.service;
}
