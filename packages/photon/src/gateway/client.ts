/**
 * Gateway Client - Target SDK for connecting to Gateway
 */

import { targetService } from "../grpc";
import { GatewayBase } from "./base";

 export class GatewayClient extends GatewayBase {
     override service: any = targetService()
     
     // streams
     messagesStream: any
     
     override postConnect(): void {
         this.messagesStream = this.client.Messages()
     }
     
     readonly Client = {
         getUserId: async (externalId: string): Promise<string> => {
             const metadata = this.generateMetadata()
             metadata.delete("project-secret")
             
             const response = await this.client.Utils({
                 get_user_id: {
                     external_id: externalId
                 }
             }, { metadata })
             
             if  (response.success) {
                 return response.user_id
             } else {
                 throw new Error(`Failed to get user ID: ${response.error}`)
             }
         },
         
         getExternalId: async (userId: string): Promise<string> => {
             const response = await this.client.Utils({
                 get_user_id: {
                     user_id: userId
                 }
             })
             
             if  (response.success) {
                 return response.external_id
             } else {
                 throw new Error(`Failed to get user ID: ${response.error}`)
             }
         }
     }
 }