/**
 * gRPC Types
 */

import type { ProtoContextType } from "./context";

// Compile Context

export interface CompileContextRequestType {
    request_id: string;
    project_id: string;
    context: ProtoContextType;
}

export interface CompileContextResponseType {
    request_id: string;
    success: boolean;
    error?: string;
    context?: ProtoContextType;
}

// Run Action

export interface RunActionRequestType {
    request_id: string;
    action_name: string;
    params: Record<string, string>;
    context: ProtoContextType;
}

export interface RunActionResponseType {
    request_id: string;
    success: boolean;
    error?: string;
    result?: string;
}

// Register

export interface RegisterRequestType {
    project_id: string;
    token: string;
    instance_id: string;
    sdk_version: string;
    sdk_address: string;
    capabilities: string[];
}

export interface RegisterResponseType {
    success: boolean;
    error?: string;
    config: GatewayConfigType;
}

export interface GatewayConfigType {
    gateway_address: string;
    heartbeat_interval: number;
}

// Send Message

export interface SendMessageRequestType {
    user_id: string;
    message: MessageType;
}

export interface SendMessageResponseType {
    success: boolean;
    error?: string;
    message_id: string;
}

export interface MessageType {
    role: string;
    content: string;
    timestamp?: string;
    metadata: Record<string, string>;
}

// Heartbeat

export interface HeartbeatRequestType {
    instance_id: string;
    status: "healthy" | "degraded" | "unhealthy";
    metrics: Record<string, string>;
}

export interface HeartbeatResponseType {
    success: boolean;
    command?: string;
}

// Unregister

export interface UnregisterRequestType {
    instance_id: string;
    reason: string;
}

export interface UnregisterResponseType {
    success: boolean;
    error?: string;
}

// Handlers

export type CompileContextHandler = (request: CompileContextRequestType) => Promise<CompileContextResponseType>;

export type RunActionHandler = (request: RunActionRequestType) => Promise<RunActionResponseType>;
