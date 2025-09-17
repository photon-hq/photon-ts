import { test, expect } from "bun:test";
import { App, onboardModifier } from '../index';

test("onboard modifier should work once", () => {
    const app = new App('test', 'test app');
    const onboardedApp = app.onboard();
    
    // Verify that the app has the onboard property
    expect((onboardedApp as any).photon.onboard).toBeDefined();
    
    // Verify that the app still has its methods
    expect(typeof onboardedApp.use).toBe('function');
    expect(typeof onboardedApp.deploy).toBe('function');
});