import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerServiceWorker } from "@/components/ServiceWorkerRegistration";

// ServiceWorkerRegistration itself is a one-line wrapper (useEffect calling
// registerServiceWorker()) — renderToStaticMarkup can't exercise useEffect
// at all (it's server-only, no commit phase), so the real behavior is
// tested directly against the exported function below instead of trying to
// force an incompatible rendering method to support hooks.
describe("registerServiceWorker", () => {
  let register: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    register = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, "navigator", {
      value: { serviceWorker: { register } },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("registers /sw.js with scope / and updateViaCache none in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    registerServiceWorker();
    expect(register).toHaveBeenCalledWith("/sw.js", {
      scope: "/",
      type: "module",
      updateViaCache: "none",
    });
  });

  it("does not register in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    registerServiceWorker();
    expect(register).not.toHaveBeenCalled();
  });

  it("never throws when serviceWorker is unsupported", () => {
    vi.stubEnv("NODE_ENV", "production");
    Object.defineProperty(globalThis, "navigator", { value: {}, configurable: true });
    expect(() => registerServiceWorker()).not.toThrow();
  });

  it("swallows a registration failure without surfacing it", async () => {
    vi.stubEnv("NODE_ENV", "production");
    register.mockRejectedValue(new Error("registration blocked"));
    expect(() => registerServiceWorker()).not.toThrow();
    // Let the rejected promise's .catch() settle before the test ends.
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});
