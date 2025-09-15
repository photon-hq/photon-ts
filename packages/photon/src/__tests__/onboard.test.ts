import { test, expect } from "bun:test";
import { App, onboardModifier } from '../index';

test("onboard modifier should work once", () => {
    const app = new App('test', 'test app');
    const onboardedApp = app.use(onboardModifier);
    
    // Verify that the app has the onboarded marker
    expect((onboardedApp as any).__onboarded).toBe(true);
    
    // Verify that the app still has its methods
    expect(typeof onboardedApp.use).toBe('function');
    expect(typeof onboardedApp.deploy).toBe('function');
});