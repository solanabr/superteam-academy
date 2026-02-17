import { ServiceFactory } from "./factory";
import { getServiceTracer, getServiceConfiguration } from "./factory";

// Test the new tracing and configuration services
async function testNewServices() {
	// Initialize the service factory
	ServiceFactory.initialize({
		environment: "development",
	});

	// Test service tracer
	const tracer = getServiceTracer();
	const spanId = tracer.startSpan("test-operation", "test-service");
	tracer.log(spanId, "Starting test operation");
	tracer.setTag(spanId, "test", "true");

	// Simulate some work
	await new Promise((resolve) => setTimeout(resolve, 100));

	tracer.log(spanId, "Test operation completed");
	tracer.endSpan(spanId);

	tracer.getSpan(spanId);

	// Test service configuration
	const config = getServiceConfiguration();
	config.set("TEST_KEY", "test_value");
}

// Run the test
testNewServices().catch(console.error);
