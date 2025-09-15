import {describe, test} from 'bun:test'
import {App} from "packages/photon";
import {Mock} from "../target.ts";
import crypto from 'crypto';

describe('sending', () => {
    const app = new App('Test Bot', '')

    test('one-way sending from user', async () => {
        const userId = crypto.randomUUID();

        const mockInstance = new Mock(userId)

        await app.deploy(mockInstance)

        const a = app.onboard()


        mockInstance.sendMessage('hello, world')

        await new Promise(() => {})
    }, 60 * 60 * 1000)
})