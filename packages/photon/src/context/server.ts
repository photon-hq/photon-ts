/**
 * Context Server
 */

import * as grpc from '@grpc/grpc-js'
import { AsyncLocalStorage } from 'node:async_hooks'
import type { Context } from '../core/context'
import { getContextServiceDefinition } from '../grpc/proto-loader'
import {
    grpcRequestToContext,
    contextToGrpcResponse,
    createErrorResponse
} from './converter'
import type {
    GrpcContextRequestType,
    GrpcContextResponseType
} from './types'

const als = new AsyncLocalStorage<Context>()

/**
 * Context Builder
 */
async function buildContext(context: Context, projectId?: string): Promise<void> {
    // TODO: To be realized
}

export interface ContextServerConfigType {
    port: number
    host?: string
}

export class ContextServer {
    private readonly config: Required<ContextServerConfigType>
    private readonly server: grpc.Server
    private isRunning = false

    constructor(config: ContextServerConfigType) {
        this.config = {
            port: config.port,
            host: config.host ?? '0.0.0.0'
        }

        this.server = new grpc.Server()
        this.registerService()
    }

    /**
     * Register gRPC Service
     */
    private registerService(): void {
        const serviceDefinition = getContextServiceDefinition()

        this.server.addService(serviceDefinition, {
            ProcessContextStream: this.handleContextStream.bind(this)
        })
    }

    /**
     * Handle Duplex flow
     */
    private handleContextStream(
        call: grpc.ServerDuplexStream<GrpcContextRequestType, GrpcContextResponseType>
    ): void {
        console.log('[ContextServer] New stream connection')

        call.on('data', async (request: GrpcContextRequestType) => {
            try {
                const response = await this.processRequest(request)
                call.write(response)
            } catch (error) {
                console.error('[ContextServer] Error processing request:', error)
                const errorResponse = createErrorResponse(
                    request.request_id,
                    error as Error
                )
                call.write(errorResponse)
            }
        })

        call.on('end', () => {
            console.log('[ContextServer] Client ended stream')
            call.end()
        })

        call.on('error', (error: Error) => {
            console.error('[ContextServer] Stream error:', error)
        })
    }

    /**
     * Handle a single request
     */
    private async processRequest(
        request: GrpcContextRequestType
    ): Promise<GrpcContextResponseType> {
        const { context, projectId } = grpcRequestToContext(request)

        try {

            await als.run(context, async () => {
                await buildContext(context, projectId)
            })

            return contextToGrpcResponse(request.request_id, context)
        } catch (error) {
            return createErrorResponse(request.request_id, error as Error)
        }
    }

    /**
     * Start Server
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            throw new Error('Server is already running')
        }

        return new Promise((resolve, reject) => {
            const address = `${this.config.host}:${this.config.port}`

            this.server.bindAsync(
                address,
                grpc.ServerCredentials.createInsecure(),
                (error: Error | null, port: number) => {
                    if (error) {
                        reject(error)
                        return
                    }

                    this.isRunning = true
                    console.log(`[ContextServer] Server started on ${address} (port: ${port})`)
                    resolve()
                }
            )
        })
    }

    /**
     * Stop Server
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            return
        }

        return new Promise((resolve) => {
            this.server.tryShutdown(() => {
                this.isRunning = false
                console.log('[ContextServer] Server stopped')
                resolve()
            })
        })
    }
}

