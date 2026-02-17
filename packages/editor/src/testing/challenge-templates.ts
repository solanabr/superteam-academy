import type { ChallengeSpec, TestCase } from "./challenge-types";

export interface ChallengeTemplate {
	id: string;
	name: string;
	category: string;
	difficulty: "beginner" | "intermediate" | "advanced";
	description: string;
	templateSpec: Partial<ChallengeSpec>;
	generators: TemplateGenerator[];
	tags: string[];
	estimatedCompletionTime: number; // minutes
}

export interface TemplateGenerator {
	name: string;
	description: string;
	parameters: GeneratorParameter[];
	generate: (params: Record<string, unknown>) => Partial<ChallengeSpec>;
}

export interface GeneratorParameter {
	name: string;
	type: "string" | "number" | "boolean" | "select";
	required: boolean;
	defaultValue?: unknown;
	options?: string[]; // For select type
	description: string;
	validation?: (value: unknown) => boolean;
}

export interface GeneratedChallenge {
	templateId: string;
	parameters: Record<string, unknown>;
	spec: ChallengeSpec;
	generatedAt: Date;
	seed?: string; // For reproducible generation
}

export class ChallengeTemplateManager {
	private templates: Map<string, ChallengeTemplate> = new Map();

	constructor() {
		this.initializeBuiltInTemplates();
	}

	getTemplate(templateId: string): ChallengeTemplate | null {
		return this.templates.get(templateId) || null;
	}

	getTemplatesByCategory(category: string): ChallengeTemplate[] {
		return Array.from(this.templates.values()).filter(
			(template) => template.category === category
		);
	}

	getTemplatesByDifficulty(difficulty: string): ChallengeTemplate[] {
		return Array.from(this.templates.values()).filter(
			(template) => template.difficulty === difficulty
		);
	}

	getAllTemplates(): ChallengeTemplate[] {
		return Array.from(this.templates.values());
	}

	generateChallenge(
		templateId: string,
		parameters: Record<string, unknown>,
		seed?: string
	): GeneratedChallenge {
		const template = this.getTemplate(templateId);
		if (!template) {
			throw new Error(`Template not found: ${templateId}`);
		}

		// Validate parameters
		this.validateParameters(template, parameters);

		// Generate challenge using template generators
		let generatedSpec: Partial<ChallengeSpec> = { ...template.templateSpec };

		for (const generator of template.generators) {
			const generatorParams = this.extractGeneratorParams(generator, parameters);
			const generated = generator.generate(generatorParams);
			generatedSpec = this.mergeSpecs(generatedSpec, generated);
		}

		// Apply parameters to template
		generatedSpec = this.applyParameters(generatedSpec, parameters);

		// Generate unique ID and finalize spec
		const challengeId = this.generateChallengeId(templateId, parameters, seed);
		const finalSpec: ChallengeSpec = {
			id: challengeId,
			title: generatedSpec.title || template.name,
			description: generatedSpec.description || template.description,
			language: generatedSpec.language || "javascript",
			difficulty: generatedSpec.difficulty || template.difficulty,
			xpReward: generatedSpec.xpReward || this.calculateXpReward(template),
			timeLimit: generatedSpec.timeLimit || 60,
			memoryLimit: generatedSpec.memoryLimit || 128,
			testCases: generatedSpec.testCases || [],
			solutionTemplate: generatedSpec.solutionTemplate || "",
			hints: generatedSpec.hints || [],
			tags: [...(generatedSpec.tags || []), ...template.tags],
			prerequisites: generatedSpec.prerequisites || [],
			track: generatedSpec.track || template.category,
			createdAt: new Date(),
			updatedAt: new Date(),
			...(generatedSpec.continueOnFailure !== undefined
				? { continueOnFailure: generatedSpec.continueOnFailure }
				: {}),
		};

		return {
			templateId,
			parameters,
			spec: finalSpec,
			generatedAt: new Date(),
			...(seed !== undefined ? { seed } : {}),
		};
	}

	private initializeBuiltInTemplates(): void {
		// Algorithm templates
		this.addTemplate(this.createArraySumTemplate());
		this.addTemplate(this.createStringReverseTemplate());
		this.addTemplate(this.createFibonacciTemplate());
		this.addTemplate(this.createSortingTemplate());

		// Data structure templates
		this.addTemplate(this.createStackTemplate());
		this.addTemplate(this.createQueueTemplate());
		this.addTemplate(this.createLinkedListTemplate());

		// Logic templates
		this.addTemplate(this.createFizzBuzzTemplate());
		this.addTemplate(this.createPrimeCheckerTemplate());
		this.addTemplate(this.createPalindromeTemplate());
	}

	private createArraySumTemplate(): ChallengeTemplate {
		return {
			id: "array-sum",
			name: "Array Sum Calculator",
			category: "algorithms",
			difficulty: "beginner",
			description: "Create a function that calculates the sum of all numbers in an array",
			templateSpec: {
				language: "javascript",
				timeLimit: 30,
				memoryLimit: 64,
				solutionTemplate: `function sumArray(arr) {
  // Your code here

}`,
				hints: [
					"Use a loop to iterate through the array",
					"Keep a running total variable",
					"Return the final sum",
				],
				tags: ["arrays", "loops", "math"],
			},
			generators: [
				{
					name: "testCaseGenerator",
					description: "Generates test cases with different array sizes",
					parameters: [
						{
							name: "arraySize",
							type: "select",
							required: true,
							defaultValue: "small",
							options: ["small", "medium", "large"],
							description: "Size of test arrays",
						},
					],
					generate: (params) => ({
						testCases: this.generateArraySumTestCases(params.arraySize as string),
					}),
				},
			],
			tags: ["arrays", "loops", "math"],
			estimatedCompletionTime: 15,
		};
	}

	private createStringReverseTemplate(): ChallengeTemplate {
		return {
			id: "string-reverse",
			name: "String Reverser",
			category: "strings",
			difficulty: "beginner",
			description: "Create a function that reverses a given string",
			templateSpec: {
				language: "javascript",
				timeLimit: 30,
				memoryLimit: 64,
				solutionTemplate: `function reverseString(str) {
  // Your code here

}`,
				hints: [
					"You can convert string to array and back",
					"Consider using built-in string methods",
					"Think about character positions",
				],
				tags: ["strings", "manipulation"],
			},
			generators: [
				{
					name: "testCaseGenerator",
					description: "Generates test cases with different string types",
					parameters: [
						{
							name: "includeSpecialChars",
							type: "boolean",
							required: false,
							defaultValue: false,
							description: "Include special characters in test strings",
						},
					],
					generate: (params) => ({
						testCases: this.generateStringReverseTestCases(params.includeSpecialChars as boolean),
					}),
				},
			],
			tags: ["strings", "manipulation"],
			estimatedCompletionTime: 10,
		};
	}

	private createFibonacciTemplate(): ChallengeTemplate {
		return {
			id: "fibonacci",
			name: "Fibonacci Sequence",
			category: "algorithms",
			difficulty: "intermediate",
			description: "Implement a function that returns the nth Fibonacci number",
			templateSpec: {
				language: "javascript",
				timeLimit: 60,
				memoryLimit: 128,
				solutionTemplate: `function fibonacci(n) {
  // Your code here

}`,
				hints: [
					"Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13...",
					"Each number is the sum of the two preceding ones",
					"Consider both recursive and iterative approaches",
					"Think about performance for large n",
				],
				tags: ["recursion", "iteration", "sequences", "math"],
			},
			generators: [
				{
					name: "testCaseGenerator",
					description: "Generates test cases for different Fibonacci positions",
					parameters: [
						{
							name: "maxN",
							type: "number",
							required: true,
							defaultValue: 20,
							description: "Maximum Fibonacci number to test",
						},
					],
					generate: (params) => ({
						testCases: this.generateFibonacciTestCases(params.maxN as number),
					}),
				},
			],
			tags: ["recursion", "iteration", "sequences", "math"],
			estimatedCompletionTime: 25,
		};
	}

	private createSortingTemplate(): ChallengeTemplate {
		return {
			id: "array-sort",
			name: "Array Sorting",
			category: "algorithms",
			difficulty: "intermediate",
			description: "Implement a sorting algorithm for an array of numbers",
			templateSpec: {
				language: "javascript",
				timeLimit: 120,
				memoryLimit: 256,
				solutionTemplate: `function sortArray(arr) {
  // Your code here

}`,
				hints: [
					"You can implement bubble sort, insertion sort, or quicksort",
					"Consider the efficiency of your algorithm",
					"Handle edge cases like empty arrays or single elements",
					"Test with both sorted and unsorted arrays",
				],
				tags: ["sorting", "algorithms", "arrays"],
			},
			generators: [
				{
					name: "testCaseGenerator",
					description: "Generates test cases with different array configurations",
					parameters: [
						{
							name: "arraySize",
							type: "select",
							required: true,
							defaultValue: "medium",
							options: ["small", "medium", "large"],
							description: "Size of test arrays",
						},
						{
							name: "includeDuplicates",
							type: "boolean",
							required: false,
							defaultValue: true,
							description: "Include duplicate values in arrays",
						},
					],
					generate: (params) => ({
						testCases: this.generateSortingTestCases(
							params.arraySize as string,
							params.includeDuplicates as boolean
						),
					}),
				},
			],
			tags: ["sorting", "algorithms", "arrays"],
			estimatedCompletionTime: 45,
		};
	}

	private createStackTemplate(): ChallengeTemplate {
		return {
			id: "stack-implementation",
			name: "Stack Data Structure",
			category: "data-structures",
			difficulty: "intermediate",
			description: "Implement a stack data structure with push, pop, and peek operations",
			templateSpec: {
				language: "javascript",
				timeLimit: 60,
				memoryLimit: 128,
				solutionTemplate: `class Stack {
  constructor() {
    // Your code here
  }

  push(item) {
    // Your code here
  }

  pop() {
    // Your code here
  }

  peek() {
    // Your code here
  }

  isEmpty() {
    // Your code here
  }

  size() {
    // Your code here
  }
}`,
				hints: [
					"Use an array as the underlying data structure",
					"Push adds to the end, pop removes from the end",
					"Peek returns the last item without removing it",
					"Handle empty stack cases",
				],
				tags: ["data-structures", "stack", "lifo"],
			},
			generators: [
				{
					name: "testCaseGenerator",
					description: "Generates test cases for stack operations",
					parameters: [
						{
							name: "maxOperations",
							type: "number",
							required: true,
							defaultValue: 10,
							description: "Maximum number of operations in test sequence",
						},
					],
					generate: (params) => ({
						testCases: this.generateStackTestCases(params.maxOperations as number),
					}),
				},
			],
			tags: ["data-structures", "stack", "lifo"],
			estimatedCompletionTime: 35,
		};
	}

	private createQueueTemplate(): ChallengeTemplate {
		return {
			id: "queue-implementation",
			name: "Queue Data Structure",
			category: "data-structures",
			difficulty: "intermediate",
			description:
				"Implement a queue data structure with enqueue, dequeue, and front operations",
			templateSpec: {
				language: "javascript",
				timeLimit: 60,
				memoryLimit: 128,
				solutionTemplate: `class Queue {
  constructor() {
    // Your code here
  }

  enqueue(item) {
    // Your code here
  }

  dequeue() {
    // Your code here
  }

  front() {
    // Your code here
  }

  isEmpty() {
    // Your code here
  }

  size() {
    // Your code here
  }
}`,
				hints: [
					"Use an array as the underlying data structure",
					"Enqueue adds to the end, dequeue removes from the front",
					"Front returns the first item without removing it",
					"Handle empty queue cases",
				],
				tags: ["data-structures", "queue", "fifo"],
			},
			generators: [
				{
					name: "testCaseGenerator",
					description: "Generates test cases for queue operations",
					parameters: [
						{
							name: "maxOperations",
							type: "number",
							required: true,
							defaultValue: 10,
							description: "Maximum number of operations in test sequence",
						},
					],
					generate: (params) => ({
						testCases: this.generateQueueTestCases(params.maxOperations as number),
					}),
				},
			],
			tags: ["data-structures", "queue", "fifo"],
			estimatedCompletionTime: 35,
		};
	}

	private createLinkedListTemplate(): ChallengeTemplate {
		return {
			id: "linked-list",
			name: "Linked List Implementation",
			category: "data-structures",
			difficulty: "advanced",
			description:
				"Implement a singly linked list with insert, delete, and search operations",
			templateSpec: {
				language: "javascript",
				timeLimit: 90,
				memoryLimit: 256,
				solutionTemplate: `class Node {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    // Your code here
  }

  append(data) {
    // Your code here
  }

  prepend(data) {
    // Your code here
  }

  delete(data) {
    // Your code here
  }

  find(data) {
    // Your code here
  }

  size() {
    // Your code here
  }

  toArray() {
    // Your code here
  }
}`,
				hints: [
					"Create a Node class to represent each element",
					"Keep track of the head of the list",
					"Handle edge cases like empty list and single node",
					"Consider traversal for search and delete operations",
				],
				tags: ["data-structures", "linked-list", "nodes", "pointers"],
			},
			generators: [
				{
					name: "testCaseGenerator",
					description: "Generates test cases for linked list operations",
					parameters: [
						{
							name: "maxSize",
							type: "number",
							required: true,
							defaultValue: 20,
							description: "Maximum size of the linked list in tests",
						},
					],
					generate: (params) => ({
						testCases: this.generateLinkedListTestCases(params.maxSize as number),
					}),
				},
			],
			tags: ["data-structures", "linked-list", "nodes", "pointers"],
			estimatedCompletionTime: 60,
		};
	}

	private createFizzBuzzTemplate(): ChallengeTemplate {
		return {
			id: "fizzbuzz",
			name: "FizzBuzz",
			category: "logic",
			difficulty: "beginner",
			description:
				"Print Fizz for multiples of 3, Buzz for multiples of 5, FizzBuzz for both",
			templateSpec: {
				language: "javascript",
				timeLimit: 30,
				memoryLimit: 64,
				solutionTemplate: `function fizzBuzz(n) {
  // Your code here

}`,
				hints: [
					"Use modulo operator (%) to check divisibility",
					"Check for multiples of both 3 and 5 first",
					"Return appropriate strings or numbers",
				],
				tags: ["logic", "conditionals", "loops", "modulo"],
			},
			generators: [
				{
					name: "testCaseGenerator",
					description: "Generates FizzBuzz test cases",
					parameters: [
						{
							name: "maxNumber",
							type: "number",
							required: true,
							defaultValue: 100,
							description: "Maximum number to test FizzBuzz up to",
						},
					],
					generate: (params) => ({
						testCases: this.generateFizzBuzzTestCases(params.maxNumber as number),
					}),
				},
			],
			tags: ["logic", "conditionals", "loops", "modulo"],
			estimatedCompletionTime: 20,
		};
	}

	private createPrimeCheckerTemplate(): ChallengeTemplate {
		return {
			id: "prime-checker",
			name: "Prime Number Checker",
			category: "math",
			difficulty: "intermediate",
			description: "Create a function that checks if a number is prime",
			templateSpec: {
				language: "javascript",
				timeLimit: 60,
				memoryLimit: 128,
				solutionTemplate: `function isPrime(n) {
  // Your code here

}`,
				hints: [
					"A prime number is only divisible by 1 and itself",
					"Check divisibility from 2 up to square root of n",
					"Handle edge cases like 1, 2, and negative numbers",
					"Consider optimization for better performance",
				],
				tags: ["math", "primes", "algorithms", "optimization"],
			},
			generators: [
				{
					name: "testCaseGenerator",
					description: "Generates prime number test cases",
					parameters: [
						{
							name: "maxNumber",
							type: "number",
							required: true,
							defaultValue: 1000,
							description: "Maximum number to test for primality",
						},
					],
					generate: (params) => ({
						testCases: this.generatePrimeTestCases(params.maxNumber as number),
					}),
				},
			],
			tags: ["math", "primes", "algorithms", "optimization"],
			estimatedCompletionTime: 30,
		};
	}

	private createPalindromeTemplate(): ChallengeTemplate {
		return {
			id: "palindrome-checker",
			name: "Palindrome Checker",
			category: "strings",
			difficulty: "beginner",
			description:
				"Check if a string is a palindrome (reads the same forwards and backwards)",
			templateSpec: {
				language: "javascript",
				timeLimit: 30,
				memoryLimit: 64,
				solutionTemplate: `function isPalindrome(str) {
  // Your code here

}`,
				hints: [
					"Ignore case sensitivity",
					"Remove spaces and punctuation",
					"Compare the string with its reverse",
					"Consider using two pointers approach",
				],
				tags: ["strings", "palindromes", "two-pointers"],
			},
			generators: [
				{
					name: "testCaseGenerator",
					description: "Generates palindrome test cases",
					parameters: [
						{
							name: "includeSpaces",
							type: "boolean",
							required: false,
							defaultValue: true,
							description: "Include strings with spaces and punctuation",
						},
					],
					generate: (params) => ({
						testCases: this.generatePalindromeTestCases(params.includeSpaces as boolean),
					}),
				},
			],
			tags: ["strings", "palindromes", "two-pointers"],
			estimatedCompletionTime: 15,
		};
	}

	// Test case generators
	private generateArraySumTestCases(size: string): TestCase[] {
		const sizes = { small: 5, medium: 10, large: 20 };
		const arraySize = sizes[size as keyof typeof sizes] || 10;

		const testCases: TestCase[] = [
			{
				id: "empty-array",
				input: [[]],
				expectedOutput: 0,
				description: "Empty array should return 0",
				isHidden: false,
				timeout: 5000,
			},
			{
				id: "single-element",
				input: [[5]],
				expectedOutput: 5,
				description: "Single element array",
				isHidden: false,
				timeout: 5000,
			},
		];

		// Generate random test cases
		for (let i = 0; i < 5; i++) {
			const arr = Array.from({ length: arraySize }, () => Math.floor(Math.random() * 100));
			const sum = arr.reduce((a, b) => a + b, 0);
			testCases.push({
				id: `random-${i}`,
				input: [arr],
				expectedOutput: sum,
				description: `Sum of ${arraySize} random numbers`,
				isHidden: false,
				timeout: 5000,
			});
		}

		return testCases;
	}

	private generateStringReverseTestCases(includeSpecial: boolean): TestCase[] {
		const testCases: TestCase[] = [
			{
				id: "empty-string",
				input: [""],
				expectedOutput: "",
				description: "Empty string should return empty string",
				isHidden: false,
				timeout: 5000,
			},
			{
				id: "single-char",
				input: ["a"],
				expectedOutput: "a",
				description: "Single character string",
				isHidden: false,
				timeout: 5000,
			},
			{
				id: "hello-world",
				input: ["hello"],
				expectedOutput: "olleh",
				description: "Simple word reversal",
				isHidden: false,
				timeout: 5000,
			},
		];

		if (includeSpecial) {
			testCases.push(
				{
					id: "with-spaces",
					input: ["hello world"],
					expectedOutput: "dlrow olleh",
					description: "String with spaces",
					isHidden: false,
					timeout: 5000,
				},
				{
					id: "special-chars",
					input: ["a!b@c#"],
					expectedOutput: "#c@b!a",
					description: "String with special characters",
					isHidden: false,
					timeout: 5000,
				}
			);
		}

		return testCases;
	}

	private generateFibonacciTestCases(maxN: number): TestCase[] {
		const fib = (n: number): number => {
			if (n <= 1) return n;
			return fib(n - 1) + fib(n - 2);
		};

		const testCases: TestCase[] = [
			{ id: "fib-0", input: [0], expectedOutput: 0, description: "Fibonacci of 0", isHidden: false, timeout: 5000 },
			{ id: "fib-1", input: [1], expectedOutput: 1, description: "Fibonacci of 1", isHidden: false, timeout: 5000 },
			{ id: "fib-2", input: [2], expectedOutput: 1, description: "Fibonacci of 2", isHidden: false, timeout: 5000 },
			{ id: "fib-3", input: [3], expectedOutput: 2, description: "Fibonacci of 3", isHidden: false, timeout: 5000 },
			{ id: "fib-4", input: [4], expectedOutput: 3, description: "Fibonacci of 4", isHidden: false, timeout: 5000 },
		];

		for (let i = 5; i <= Math.min(maxN, 20); i++) {
			testCases.push({
				id: `fib-${i}`,
				input: [i],
				expectedOutput: fib(i),
				description: `Fibonacci of ${i}`,
				isHidden: false,
				timeout: 5000,
			});
		}

		return testCases;
	}

	private generateSortingTestCases(size: string, includeDuplicates: boolean): TestCase[] {
		const sizes = { small: 5, medium: 10, large: 20 };
		const arraySize = sizes[size as keyof typeof sizes] || 10;

		const testCases: TestCase[] = [
			{
				id: "empty-array",
				input: [[]],
				expectedOutput: [],
				description: "Empty array should return empty array",
				isHidden: false,
				timeout: 5000,
			},
			{
				id: "single-element",
				input: [[42]],
				expectedOutput: [42],
				description: "Single element array",
				isHidden: false,
				timeout: 5000,
			},
			{
				id: "already-sorted",
				input: [[1, 2, 3, 4, 5]],
				expectedOutput: [1, 2, 3, 4, 5],
				description: "Already sorted array",
				isHidden: false,
				timeout: 5000,
			},
			{
				id: "reverse-sorted",
				input: [[5, 4, 3, 2, 1]],
				expectedOutput: [1, 2, 3, 4, 5],
				description: "Reverse sorted array",
				isHidden: false,
				timeout: 5000,
			},
		];

		// Generate random arrays
		for (let i = 0; i < 3; i++) {
			const arr = Array.from({ length: arraySize }, () => Math.floor(Math.random() * 100));
			if (includeDuplicates) {
				// Add some duplicates
				arr.push(arr[0], arr[Math.floor(arr.length / 2)]);
			}
			const sorted = [...arr].sort((a, b) => a - b);
			testCases.push({
				id: `random-${i}`,
				input: [arr],
				expectedOutput: sorted,
				description: `Random array of ${arraySize} elements`,
				isHidden: false,
				timeout: 5000,
			});
		}

		return testCases;
	}

	private generateStackTestCases(_maxOps: number): TestCase[] {
		// This would generate complex test cases for stack operations
		// Simplified for brevity
		return [
			{
				id: "basic-operations",
				input: [["push", "pop", "peek"]],
				expectedOutput: [undefined, 1, 2],
				description: "Basic stack operations",
				isHidden: false,
				timeout: 5000,
			},
		];
	}

	private generateQueueTestCases(_maxOps: number): TestCase[] {
		// Similar to stack test cases
		return [
			{
				id: "basic-operations",
				input: [["enqueue", "dequeue", "front"]],
				expectedOutput: [undefined, 1, 2],
				description: "Basic queue operations",
				isHidden: false,
				timeout: 5000,
			},
		];
	}

	private generateLinkedListTestCases(_maxSize: number): TestCase[] {
		// Complex test cases for linked list operations
		return [
			{
				id: "basic-operations",
				input: [["append", "prepend", "delete"]],
				expectedOutput: [
					[1, 2, 3],
					[0, 1, 2, 3],
					[0, 2, 3],
				],
				description: "Basic linked list operations",
				isHidden: false,
				timeout: 5000,
			},
		];
	}

	private generateFizzBuzzTestCases(maxNum: number): TestCase[] {
		const testCases: TestCase[] = [];

		for (let i = 1; i <= Math.min(maxNum, 100); i++) {
			let expected: string | number;
			if (i % 3 === 0 && i % 5 === 0) {
				expected = "FizzBuzz";
			} else if (i % 3 === 0) {
				expected = "Fizz";
			} else if (i % 5 === 0) {
				expected = "Buzz";
			} else {
				expected = i;
			}

			testCases.push({
				id: `fizzbuzz-${i}`,
				input: [i],
				expectedOutput: expected,
				description: `FizzBuzz for ${i}`,
				isHidden: false,
				timeout: 5000,
			});
		}

		return testCases;
	}

	private generatePrimeTestCases(maxNum: number): TestCase[] {
		const isPrime = (n: number): boolean => {
			if (n <= 1) return false;
			if (n <= 3) return true;
			if (n % 2 === 0 || n % 3 === 0) return false;
			for (let i = 5; i * i <= n; i += 6) {
				if (n % i === 0 || n % (i + 2) === 0) return false;
			}
			return true;
		};

		const testCases: TestCase[] = [
			{ id: "prime-1", input: [1], expectedOutput: false, description: "1 is not prime", isHidden: false, timeout: 5000 },
			{ id: "prime-2", input: [2], expectedOutput: true, description: "2 is prime", isHidden: false, timeout: 5000 },
			{ id: "prime-3", input: [3], expectedOutput: true, description: "3 is prime", isHidden: false, timeout: 5000 },
			{ id: "prime-4", input: [4], expectedOutput: false, description: "4 is not prime", isHidden: false, timeout: 5000 },
		];

		for (let i = 5; i <= Math.min(maxNum, 100); i++) {
			testCases.push({
				id: `prime-${i}`,
				input: [i],
				expectedOutput: isPrime(i),
				description: `${i} ${isPrime(i) ? "is" : "is not"} prime`,
				isHidden: false,
				timeout: 5000,
			});
		}

		return testCases;
	}

	private generatePalindromeTestCases(includeSpaces: boolean): TestCase[] {
		const testCases: TestCase[] = [
			{
				id: "empty",
				input: [""],
				expectedOutput: true,
				description: "Empty string is palindrome",
				isHidden: false,
				timeout: 5000,
			},
			{
				id: "single-char",
				input: ["a"],
				expectedOutput: true,
				description: "Single character is palindrome",
				isHidden: false,
				timeout: 5000,
			},
			{
				id: "racecar",
				input: ["racecar"],
				expectedOutput: true,
				description: "racecar is palindrome",
				isHidden: false,
				timeout: 5000,
			},
			{
				id: "hello",
				input: ["hello"],
				expectedOutput: false,
				description: "hello is not palindrome",
				isHidden: false,
				timeout: 5000,
			},
		];

		if (includeSpaces) {
			testCases.push(
				{
					id: "with-spaces",
					input: ["A man a plan a canal Panama"],
					expectedOutput: true,
					description: "Palindrome with spaces and case",
					isHidden: false,
					timeout: 5000,
				},
				{
					id: "sentence",
					input: ["Was it a car or a cat I saw"],
					expectedOutput: true,
					description: "Sentence palindrome",
					isHidden: false,
					timeout: 5000,
				}
			);
		}

		return testCases;
	}

	// Utility methods
	private addTemplate(template: ChallengeTemplate): void {
		this.templates.set(template.id, template);
	}

	private validateParameters(
		template: ChallengeTemplate,
		parameters: Record<string, unknown>
	): void {
		for (const generator of template.generators) {
			for (const param of generator.parameters) {
				if (param.required && !(param.name in parameters)) {
					throw new Error(`Missing required parameter: ${param.name}`);
				}

				if (param.name in parameters) {
					const value = parameters[param.name];
					if (param.validation && !param.validation(value)) {
						throw new Error(`Invalid value for parameter ${param.name}: ${value}`);
					}
				}
			}
		}
	}

	private extractGeneratorParams(
		generator: TemplateGenerator,
		allParams: Record<string, unknown>
	): Record<string, unknown> {
		const params: Record<string, unknown> = {};
		for (const param of generator.parameters) {
			if (param.name in allParams) {
				params[param.name] = allParams[param.name];
			} else if (param.required) {
				throw new Error(`Missing required parameter for ${generator.name}: ${param.name}`);
			} else {
				params[param.name] = param.defaultValue;
			}
		}
		return params;
	}

	private mergeSpecs(
		base: Partial<ChallengeSpec>,
		generated: Partial<ChallengeSpec>
	): Partial<ChallengeSpec> {
		return { ...base, ...generated };
	}

	private applyParameters(
		spec: Partial<ChallengeSpec>,
		parameters: Record<string, unknown>
	): Partial<ChallengeSpec> {
		// Apply any global parameters to the spec
		const result = { ...spec };

		// Replace placeholders in strings
		const replacePlaceholders = (str: string): string => {
			return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
				return parameters[key] !== undefined ? String(parameters[key]) : match;
			});
		};

		if (result.title) result.title = replacePlaceholders(result.title);
		if (result.description) result.description = replacePlaceholders(result.description);
		if (result.solutionTemplate)
			result.solutionTemplate = replacePlaceholders(result.solutionTemplate);

		return result;
	}

	private generateChallengeId(
		templateId: string,
		parameters: Record<string, unknown>,
		seed?: string
	): string {
		const paramHash = Object.keys(parameters)
			.sort()
			.map((key) => `${key}:${parameters[key]}`)
			.join("|");

		const baseString = `${templateId}|${paramHash}|${seed || Date.now()}`;
		let hash = 0;
		for (let i = 0; i < baseString.length; i++) {
			const char = baseString.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash &= hash; // Convert to 32-bit integer
		}

		return `${templateId}_${Math.abs(hash)}`;
	}

	private calculateXpReward(template: ChallengeTemplate): number {
		const baseRewards = {
			beginner: 50,
			intermediate: 100,
			advanced: 200,
		};

		return baseRewards[template.difficulty] || 100;
	}
}
