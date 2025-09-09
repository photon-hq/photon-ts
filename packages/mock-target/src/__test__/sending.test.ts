import {describe, test} from 'bun:test'
import {App} from "something";
import {Mock} from "../target.ts";

describe('sending', () => {
    const app = new App('Test Bot', '')

    test('one-way sending from user', async () => {
        const mockInstance = new Mock()

        await app.deploy(mockInstance)

        mockInstance.sendMessage('hello, world')

        await new Promise(() => {})
    }, 60 * 60 * 1000)
})