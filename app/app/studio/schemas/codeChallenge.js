export default {
    name: 'codeChallenge',
    title: 'Code Challenge',
    type: 'document',
    fields: [
        { name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() },
        {
            name: 'passThreshold',
            title: 'Pass Threshold (%)',
            type: 'number',
            initialValue: 80,
            validation: (Rule) => Rule.required().min(0).max(100),
        },
        {
            name: 'points',
            title: 'Points',
            type: 'number',
            initialValue: 100,
            description: 'Weight within the milestone (sums to 100)',
            validation: (Rule) => Rule.required().min(1),
        },
        {
            name: 'prompt',
            title: 'Prompt',
            type: 'text',
            description: 'The challenge description shown to the student',
            validation: (Rule) => Rule.required(),
        },
        {
            name: 'starterCode',
            title: 'Starter Code',
            type: 'code',
            options: {
                language: 'typescript',
                languageAlternatives: [
                    { title: 'TypeScript', value: 'typescript' },
                    { title: 'Rust', value: 'rust' },
                    { title: 'JavaScript', value: 'javascript' },
                ],
            },
            validation: (Rule) => Rule.required(),
        },
        {
            name: 'language',
            title: 'Language',
            type: 'string',
            options: {
                list: [
                    { title: 'TypeScript', value: 'typescript' },
                    { title: 'Rust', value: 'rust' },
                    { title: 'JavaScript', value: 'javascript' },
                ],
            },
            initialValue: 'typescript',
            validation: (Rule) => Rule.required(),
        },
        {
            name: 'testCases',
            title: 'Test Cases',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'testCase',
                    title: 'Test Case',
                    fields: [
                        {
                            name: 'input',
                            title: 'Input',
                            type: 'string',
                            validation: (Rule) => Rule.required(),
                        },
                        {
                            name: 'expectedOutput',
                            title: 'Expected Output',
                            type: 'string',
                            validation: (Rule) => Rule.required(),
                        },
                        {
                            name: 'description',
                            title: 'Description',
                            type: 'string',
                            validation: (Rule) => Rule.required(),
                        },
                    ],
                    preview: {
                        select: { description: 'description', input: 'input', output: 'expectedOutput' },
                        prepare({ description, input, output }) {
                            return {
                                title: description || 'Test case',
                                subtitle: `${input} → ${output}`,
                            }
                        },
                    },
                },
            ],
            validation: (Rule) => Rule.required().min(1),
        },
    ],
    preview: {
        select: { title: 'title', language: 'language', testCases: 'testCases' },
        prepare({ title, language, testCases }) {
            return {
                title: title || 'Untitled Challenge',
                subtitle: `${language || 'typescript'} — ${testCases?.length || 0} test cases`,
            }
        },
    },
}
