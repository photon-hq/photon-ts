import {describe, test} from 'bun:test'
import {App} from "something";
import {Mock} from "../target.ts";
import crypto from 'crypto';

describe('sending', () => {
    const app = new App('Test Bot', '')

    test('one-way sending from user', async () => {
        const userId = crypto.randomUUID();

        const mockInstance = new Mock(userId)

        await app.deploy(mockInstance)

        mockInstance.sendMessage('hello, world')

        await new Promise(() => {})
    }, 60 * 60 * 1000)
})