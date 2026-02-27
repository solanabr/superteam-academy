import { connectToDatabase } from '@/lib/mongodb';
import { Challenge } from '@/models';

export interface TestCase {
  id: string;
  description: string;
  input?: unknown;
  expectedOutput: unknown;
  hidden?: boolean;
  timeout?: number;
}

interface ChallengeDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  prompt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  xp_reward: number;
  time_estimate: number;
  language: 'typescript' | 'javascript' | 'rust';
  starter_code: string;
  solution_code: string;
  test_cases: TestCase[];
  function_name?: string;
  hints?: string[];
  tags?: string[];
}

// Sample challenges for seeding
const sampleChallenges: ChallengeDefinition[] = [
  {
    id: 'challenge-two-sum',
    slug: 'two-sum',
    title: 'Two Sum',
    description:
      'Given an array of integers and a target, return indices of two numbers that add up to the target.',
    prompt: `## Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

### Examples

**Example 1:**
- Input: nums = [2, 7, 11, 15], target = 9
- Output: [0, 1]
- Explanation: nums[0] + nums[1] = 2 + 7 = 9

**Example 2:**
- Input: nums = [3, 2, 4], target = 6
- Output: [1, 2]

### Constraints
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9`,
    difficulty: 'easy',
    category: 'Arrays & Hashing',
    xp_reward: 50,
    time_estimate: 15,
    language: 'typescript',
    starter_code: `function twoSum(nums: number[], target: number): number[] {
  // Your code here
  return [];
}

module.exports = { twoSum };`,
    solution_code: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}

module.exports = { twoSum };`,
    test_cases: [
      {
        id: 'test-1',
        description: 'Basic case: [2, 7, 11, 15], target = 9',
        input: { nums: [2, 7, 11, 15], target: 9 },
        expectedOutput: [0, 1],
        hidden: false,
      },
      {
        id: 'test-2',
        description: 'Middle elements: [3, 2, 4], target = 6',
        input: { nums: [3, 2, 4], target: 6 },
        expectedOutput: [1, 2],
        hidden: false,
      },
      {
        id: 'test-3',
        description: 'Same numbers: [3, 3], target = 6',
        input: { nums: [3, 3], target: 6 },
        expectedOutput: [0, 1],
        hidden: true,
      },
    ],
    function_name: 'twoSum',
    hints: [
      "Try using a hash map to store numbers you've seen",
      'For each number, check if target - number exists in the map',
      'Remember to store indices, not the numbers themselves',
    ],
    tags: ['arrays', 'hash-table', 'easy'],
  },
  {
    id: 'challenge-valid-parentheses',
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    description: 'Check if a string containing parentheses, brackets, and braces is valid.',
    prompt: `## Valid Parentheses

Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Examples

**Example 1:**
- Input: s = "()"
- Output: true

**Example 2:**
- Input: s = "()[]{}"
- Output: true

**Example 3:**
- Input: s = "(]"
- Output: false

### Constraints
- 1 <= s.length <= 10^4
- s consists of parentheses only \`'()[]{}'\``,
    difficulty: 'easy',
    category: 'Stacks',
    xp_reward: 50,
    time_estimate: 15,
    language: 'typescript',
    starter_code: `function isValid(s: string): boolean {
  // Your code here
  return false;
}

module.exports = { isValid };`,
    solution_code: `function isValid(s: string): boolean {
  const stack: string[] = [];
  const pairs: { [key: string]: string } = {
    ')': '(',
    '}': '{',
    ']': '[',
  };
  
  for (const char of s) {
    if (char in pairs) {
      if (stack.length === 0 || stack.pop() !== pairs[char]) {
        return false;
      }
    } else {
      stack.push(char);
    }
  }
  
  return stack.length === 0;
}

module.exports = { isValid };`,
    test_cases: [
      {
        id: 'test-1',
        description: 'Simple valid: "()"',
        input: '()',
        expectedOutput: true,
        hidden: false,
      },
      {
        id: 'test-2',
        description: 'Multiple types: "()[]{}"',
        input: '()[]{}',
        expectedOutput: true,
        hidden: false,
      },
      {
        id: 'test-3',
        description: 'Invalid mix: "(]"',
        input: '(]',
        expectedOutput: false,
        hidden: false,
      },
      {
        id: 'test-4',
        description: 'Nested valid: "{[]}"',
        input: '{[]}',
        expectedOutput: true,
        hidden: true,
      },
    ],
    function_name: 'isValid',
    hints: [
      'Use a stack to track opening brackets',
      'When you see a closing bracket, check if the top of the stack matches',
      'At the end, the stack should be empty for a valid string',
    ],
    tags: ['stack', 'string', 'easy'],
  },
  {
    id: 'challenge-reverse-linked-list',
    slug: 'reverse-linked-list',
    title: 'Reverse Linked List',
    description: 'Reverse a singly linked list.',
    prompt: `## Reverse Linked List

Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.

### Examples

**Example 1:**
- Input: head = [1, 2, 3, 4, 5]
- Output: [5, 4, 3, 2, 1]

**Example 2:**
- Input: head = [1, 2]
- Output: [2, 1]

**Example 3:**
- Input: head = []
- Output: []

### Constraints
- The number of nodes in the list is the range [0, 5000]
- -5000 <= Node.val <= 5000`,
    difficulty: 'easy',
    category: 'Linked Lists',
    xp_reward: 50,
    time_estimate: 20,
    language: 'typescript',
    starter_code: `interface ListNode {
  val: number;
  next: ListNode | null;
}

function reverseList(head: ListNode | null): ListNode | null {
  // Your code here
  return null;
}

module.exports = { reverseList };`,
    solution_code: `interface ListNode {
  val: number;
  next: ListNode | null;
}

function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr = head;
  
  while (curr !== null) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  
  return prev;
}

module.exports = { reverseList };`,
    test_cases: [
      {
        id: 'test-1',
        description: 'Multiple nodes: [1, 2, 3, 4, 5]',
        input: [1, 2, 3, 4, 5],
        expectedOutput: [5, 4, 3, 2, 1],
        hidden: false,
      },
      {
        id: 'test-2',
        description: 'Two nodes: [1, 2]',
        input: [1, 2],
        expectedOutput: [2, 1],
        hidden: false,
      },
      {
        id: 'test-3',
        description: 'Empty list: []',
        input: [],
        expectedOutput: [],
        hidden: true,
      },
    ],
    function_name: 'reverseList',
    hints: [
      'Use three pointers: prev, curr, and next',
      'Iterate through the list, reversing links one at a time',
      'Be careful not to lose the next node when modifying links',
    ],
    tags: ['linked-list', 'recursion', 'easy'],
  },
  {
    id: 'challenge-merge-intervals',
    slug: 'merge-intervals',
    title: 'Merge Intervals',
    description: 'Given an array of intervals, merge all overlapping intervals.',
    prompt: `## Merge Intervals

Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

### Examples

**Example 1:**
- Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
- Output: [[1,6],[8,10],[15,18]]
- Explanation: Since intervals [1,3] and [2,6] overlap, merge them into [1,6].

**Example 2:**
- Input: intervals = [[1,4],[4,5]]
- Output: [[1,5]]
- Explanation: Intervals [1,4] and [4,5] are considered overlapping.

### Constraints
- 1 <= intervals.length <= 10^4
- intervals[i].length == 2
- 0 <= start_i <= end_i <= 10^4`,
    difficulty: 'medium',
    category: 'Intervals',
    xp_reward: 75,
    time_estimate: 25,
    language: 'typescript',
    starter_code: `function merge(intervals: number[][]): number[][] {
  // Your code here
  return [];
}

module.exports = { merge };`,
    solution_code: `function merge(intervals: number[][]): number[][] {
  if (intervals.length <= 1) return intervals;
  
  // Sort by start time
  intervals.sort((a, b) => a[0] - b[0]);
  
  const result: number[][] = [intervals[0]];
  
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const lastMerged = result[result.length - 1];
    
    if (current[0] <= lastMerged[1]) {
      // Overlapping, merge
      lastMerged[1] = Math.max(lastMerged[1], current[1]);
    } else {
      // Non-overlapping, add to result
      result.push(current);
    }
  }
  
  return result;
}

module.exports = { merge };`,
    test_cases: [
      {
        id: 'test-1',
        description: 'Multiple merges',
        input: [
          [1, 3],
          [2, 6],
          [8, 10],
          [15, 18],
        ],
        expectedOutput: [
          [1, 6],
          [8, 10],
          [15, 18],
        ],
        hidden: false,
      },
      {
        id: 'test-2',
        description: 'Edge merge: [[1,4],[4,5]]',
        input: [
          [1, 4],
          [4, 5],
        ],
        expectedOutput: [[1, 5]],
        hidden: false,
      },
      {
        id: 'test-3',
        description: 'No overlap: [[1,2],[3,4]]',
        input: [
          [1, 2],
          [3, 4],
        ],
        expectedOutput: [
          [1, 2],
          [3, 4],
        ],
        hidden: true,
      },
    ],
    function_name: 'merge',
    hints: [
      'First, sort the intervals by start time',
      'Compare each interval with the last merged interval',
      'If they overlap, update the end of the last merged interval',
    ],
    tags: ['arrays', 'sorting', 'medium'],
  },
  {
    id: 'challenge-binary-search',
    slug: 'binary-search',
    title: 'Binary Search',
    description: 'Implement binary search to find a target value in a sorted array.',
    prompt: `## Binary Search

Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.

### Examples

**Example 1:**
- Input: nums = [-1,0,3,5,9,12], target = 9
- Output: 4
- Explanation: 9 exists in nums and its index is 4

**Example 2:**
- Input: nums = [-1,0,3,5,9,12], target = 2
- Output: -1
- Explanation: 2 does not exist in nums so return -1

### Constraints
- 1 <= nums.length <= 10^4
- -10^4 < nums[i], target < 10^4
- All the integers in nums are unique
- nums is sorted in ascending order`,
    difficulty: 'easy',
    category: 'Binary Search',
    xp_reward: 50,
    time_estimate: 15,
    language: 'typescript',
    starter_code: `function search(nums: number[], target: number): number {
  // Your code here
  return -1;
}

module.exports = { search };`,
    solution_code: `function search(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}

module.exports = { search };`,
    test_cases: [
      {
        id: 'test-1',
        description: 'Found in array',
        input: { nums: [-1, 0, 3, 5, 9, 12], target: 9 },
        expectedOutput: 4,
        hidden: false,
      },
      {
        id: 'test-2',
        description: 'Not in array',
        input: { nums: [-1, 0, 3, 5, 9, 12], target: 2 },
        expectedOutput: -1,
        hidden: false,
      },
      {
        id: 'test-3',
        description: 'First element',
        input: { nums: [1, 2, 3, 4, 5], target: 1 },
        expectedOutput: 0,
        hidden: true,
      },
    ],
    function_name: 'search',
    hints: [
      'Use two pointers: left and right',
      'Calculate mid and compare with target',
      'Narrow down the search range based on comparison',
    ],
    tags: ['binary-search', 'arrays', 'easy'],
  },
  {
    id: 'challenge-maximum-subarray',
    slug: 'maximum-subarray',
    title: 'Maximum Subarray',
    description: 'Find the contiguous subarray with the largest sum.',
    prompt: `## Maximum Subarray

Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

### Examples

**Example 1:**
- Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
- Output: 6
- Explanation: The subarray [4,-1,2,1] has the largest sum 6.

**Example 2:**
- Input: nums = [1]
- Output: 1
- Explanation: The subarray [1] has the largest sum 1.

**Example 3:**
- Input: nums = [5,4,-1,7,8]
- Output: 23
- Explanation: The subarray [5,4,-1,7,8] has the largest sum 23.

### Constraints
- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4`,
    difficulty: 'medium',
    category: 'Dynamic Programming',
    xp_reward: 75,
    time_estimate: 20,
    language: 'typescript',
    starter_code: `function maxSubArray(nums: number[]): number {
  // Your code here
  return 0;
}

module.exports = { maxSubArray };`,
    solution_code: `function maxSubArray(nums: number[]): number {
  let maxSum = nums[0];
  let currentSum = nums[0];
  
  for (let i = 1; i < nums.length; i++) {
    // Either extend the current subarray or start fresh
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  
  return maxSum;
}

module.exports = { maxSubArray };`,
    test_cases: [
      {
        id: 'test-1',
        description: 'Mixed array',
        input: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
        expectedOutput: 6,
        hidden: false,
      },
      {
        id: 'test-2',
        description: 'Single element',
        input: [1],
        expectedOutput: 1,
        hidden: false,
      },
      {
        id: 'test-3',
        description: 'All positive',
        input: [5, 4, -1, 7, 8],
        expectedOutput: 23,
        hidden: true,
      },
    ],
    function_name: 'maxSubArray',
    hints: [
      "Use Kadane's algorithm",
      'Track current sum and max sum',
      'Reset current sum when it becomes negative',
    ],
    tags: ['dynamic-programming', 'arrays', 'medium'],
  },
];

export class ChallengeService {
  static async ensureSeeded(): Promise<void> {
    await connectToDatabase();

    const existing = await Challenge.countDocuments();
    if (existing > 0) {
      return;
    }

    const docs = sampleChallenges.map((c) => ({
      ...c,
      is_active: true,
    }));

    if (docs.length > 0) {
      await Challenge.insertMany(docs, { ordered: false });
    }
  }

  static async getAllChallenges() {
    await this.ensureSeeded();
    return Challenge.find({ is_active: true }).sort({ order: 1, title: 1 }).lean();
  }

  static async getChallengeById(id: string) {
    await this.ensureSeeded();
    return Challenge.findOne({
      $or: [{ id }, { slug: id }],
      is_active: true,
    }).lean();
  }

  static async getChallengesByCategory(category: string) {
    await this.ensureSeeded();
    return Challenge.find({
      category,
      is_active: true,
    })
      .sort({ order: 1 })
      .lean();
  }

  static async getAllCategories(): Promise<string[]> {
    await this.ensureSeeded();
    const categories = await Challenge.distinct('category', { is_active: true });
    return categories.filter(Boolean) as string[];
  }
}
