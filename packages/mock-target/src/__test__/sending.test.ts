import {describe, test} from 'bun:test'
import {App} from "photon";
import {Mock} from "../target.ts";
import crypto from 'crypto';

describe('sending', () => {
    const app = new App('Test Bot', 'hi')

    test('one-way sending from user', async () => {
        const userId = crypto.randomUUID();

        const mockInstance = new Mock(userId)

        await app.deploy(mockInstance)

        const a = app.onboard().asPhoton()
        const b = app.onboard().asPhoton()
        app.use(a)


        mockInstance.sendMessage('hello, world')

        await new Promise(() => {})
    }, 60 * 60 * 1000)
})