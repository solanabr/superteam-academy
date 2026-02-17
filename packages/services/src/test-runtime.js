// Simple runtime test for new services
import { ServiceFactory, getServiceTracer, getServiceConfiguration } from "./factory";

// Initialize
ServiceFactory.initialize({ environment: "development" });

// Test tracer
const tracer = getServiceTracer();
const spanId = tracer.startSpan("test", "test-service");
tracer.endSpan(spanId);

// Test config
const config = getServiceConfiguration();
config.set("test", "value");
