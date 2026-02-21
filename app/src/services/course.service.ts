import type { Course, CourseService, CourseFilters, Module, Lesson } from '@/types'

/**
 * Course service implementation with sample data
 * In production, this would integrate with a CMS like Sanity
 */
class LocalCourseService implements CourseService {
  private courses: Course[] = [
    {
      id: 'solana-fundamentals',
      slug: 'solana-fundamentals',
      title: 'Solana Fundamentals',
      description: 'Learn the basics of Solana blockchain development',
      longDescription: `Master the fundamentals of Solana blockchain development. This comprehensive course covers everything from basic concepts to advanced programming patterns. You'll learn about accounts, transactions, programs, and the Solana runtime environment.

      Perfect for developers coming from other blockchain ecosystems or those new to blockchain development entirely. By the end of this course, you'll have built several Solana programs and understand the core concepts that make Solana unique.`,
      thumbnail: '/images/courses/solana-fundamentals.jpg',
      banner: '/images/courses/solana-fundamentals-banner.jpg',
      difficulty: 'beginner',
      duration: 20,
      xpReward: 1500,
      tags: ['solana', 'blockchain', 'rust', 'web3'],
      category: 'Blockchain Development',
      language: 'en',
      instructor: {
        name: 'Alex Santos',
        avatar: '/images/instructors/alex-santos.jpg',
        bio: 'Senior Solana developer with 5+ years in blockchain development'
      },
      modules: [
        {
          id: 'intro-to-solana',
          courseId: 'solana-fundamentals',
          title: 'Introduction to Solana',
          description: 'Understanding the Solana blockchain and its unique features',
          order: 1,
          xpReward: 200,
          estimatedDuration: 120,
          lessons: [
            {
              id: 'what-is-solana',
              moduleId: 'intro-to-solana',
              courseId: 'solana-fundamentals',
              title: 'What is Solana?',
              description: 'Learn about Solana\'s architecture and key features',
              content: `# What is Solana?

Solana is a high-performance blockchain supporting builders around the world creating crypto apps that scale today. Solana is a decentralized blockchain built to enable scalable, user-friendly apps for the world.

## Key Features

### Speed
Solana can process over 65,000 transactions per second, making it one of the fastest blockchains available.

### Low Cost
Transaction fees on Solana are typically less than $0.01, making it accessible for all types of applications.

### Energy Efficient
Solana uses a Proof of Stake consensus mechanism, making it much more energy efficient than Proof of Work blockchains.

## The Solana Advantage

Solana's unique architecture combines several innovations:

1. **Proof of History (PoH)**: A cryptographic clock that provides a way to prove that an event has occurred at a specific moment in time
2. **Tower BFT**: A PBFT-like consensus algorithm that leverages the cryptographic clock
3. **Turbine**: A block propagation protocol
4. **Gulf Stream**: A mempool-less transaction forwarding protocol
5. **Sealevel**: A parallel smart contracts run-time
6. **Pipelining**: A transaction processing unit for validation optimization
7. **Cloudbreak**: A horizontally-scaled accounts database
8. **Archivers**: A distributed ledger storage

## Getting Started

To start building on Solana, you'll need:
- Basic understanding of Rust (recommended) or C
- Solana CLI tools
- A development environment

Let's dive deeper into these concepts in the following lessons.`,
              order: 1,
              type: 'lesson',
              xpReward: 25,
              estimatedDuration: 30,
              resources: [
                {
                  id: 'solana-docs',
                  title: 'Official Solana Documentation',
                  type: 'link',
                  url: 'https://docs.solana.com',
                  description: 'Comprehensive documentation for Solana development'
                }
              ]
            },
            {
              id: 'solana-accounts',
              moduleId: 'intro-to-solana',
              courseId: 'solana-fundamentals',
              title: 'Understanding Accounts',
              description: 'Learn about Solana\'s account model',
              content: `# Understanding Solana Accounts

In Solana, everything is an account. This is fundamentally different from Ethereum's model where you have accounts and contracts as separate entities.

## Account Structure

Every account in Solana has the following structure:

\`\`\`rust
pub struct Account {
    pub lamports: u64,        // Balance in lamports
    pub data: Vec<u8>,        // Data stored in the account
    pub owner: Pubkey,        // Program that owns this account
    pub executable: bool,     // Can this account be executed as a program?
    pub rent_epoch: Epoch,    // Next epoch this account owes rent
}
\`\`\`

## Types of Accounts

### 1. Native Accounts
- **System Account**: Basic accounts that hold SOL
- **Program Account**: Contains executable code
- **Sysvar Account**: Contains network cluster state

### 2. Program Derived Accounts (PDAs)
- Accounts whose address is derived deterministically from a program ID and seeds
- Cannot hold private keys
- Only the deriving program can sign for them

### 3. Associated Token Accounts (ATAs)
- Standardized way to find token accounts for a given wallet and mint

## Account Ownership

- Every account is owned by a program
- Only the owning program can modify the account's data
- Only the account's owner can debit lamports
- Anyone can credit lamports to an account

## Rent

Accounts must maintain a minimum balance to be rent-exempt. This prevents state bloat on the blockchain.

\`\`\`javascript
// Calculate rent exemption
const rentExemption = await connection.getMinimumBalanceForRentExemption(dataSize);
\`\`\`

Understanding accounts is crucial for Solana development as they form the foundation of all interactions on the network.`,
              order: 2,
              type: 'lesson',
              xpReward: 30,
              estimatedDuration: 45,
              resources: []
            }
          ]
        },
        {
          id: 'rust-basics',
          courseId: 'solana-fundamentals',
          title: 'Rust for Solana',
          description: 'Essential Rust concepts for Solana development',
          order: 2,
          xpReward: 400,
          estimatedDuration: 240,
          lessons: [
            {
              id: 'rust-ownership',
              moduleId: 'rust-basics',
              courseId: 'solana-fundamentals',
              title: 'Ownership and Borrowing',
              description: 'Master Rust\'s ownership system',
              content: `# Ownership and Borrowing in Rust

Rust's ownership system is what makes it memory-safe without garbage collection. Understanding this is crucial for Solana development.

## The Three Rules of Ownership

1. Each value in Rust has a variable that's called its owner
2. There can only be one owner at a time
3. When the owner goes out of scope, the value will be dropped

## Example

\`\`\`rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 is moved to s2, s1 is no longer valid
    
    // println!("{}", s1); // This would cause a compile error
    println!("{}", s2); // This is fine
}
\`\`\`

## Borrowing

Instead of taking ownership, we can borrow references:

\`\`\`rust
fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1); // Borrow s1
    
    println!("The length of '{}' is {}.", s1, len); // s1 is still valid
}

fn calculate_length(s: &String) -> usize {
    s.len()
} // s goes out of scope, but doesn't drop the value (it doesn't own it)
\`\`\`

## Mutable References

\`\`\`rust
fn main() {
    let mut s = String::from("hello");
    change(&mut s);
    println!("{}", s); // Prints "hello, world"
}

fn change(some_string: &mut String) {
    some_string.push_str(", world");
}
\`\`\`

## Rules of References

1. At any given time, you can have either one mutable reference or any number of immutable references
2. References must always be valid

This system prevents data races at compile time and ensures memory safety.`,
              order: 1,
              type: 'lesson',
              xpReward: 35,
              estimatedDuration: 60,
              resources: []
            }
          ]
        },
        {
          id: 'first-program',
          courseId: 'solana-fundamentals',
          title: 'Your First Solana Program',
          description: 'Build and deploy your first program',
          order: 3,
          xpReward: 600,
          estimatedDuration: 180,
          lessons: [
            {
              id: 'hello-world-program',
              moduleId: 'first-program',
              courseId: 'solana-fundamentals',
              title: 'Hello World Program',
              description: 'Create a simple Solana program',
              content: `# Hello World Solana Program

Let's build your first Solana program! This will be a simple "Hello World" program that logs a message when called.

## Program Structure

\`\`\`rust
use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Log a message to the blockchain
    msg!("Hello World Rust program entrypoint");
    
    // Gracefully exit the program
    Ok(())
}
\`\`\`

## Key Components

### Entrypoint
The \`entrypoint!\` macro declares the program's entry point. Every Solana program must have exactly one entrypoint.

### Process Instruction Function
This function receives:
- \`program_id\`: The public key of the program
- \`accounts\`: Array of accounts involved in the transaction
- \`instruction_data\`: Data passed to the program

### Message Logging
The \`msg!\` macro logs messages to the blockchain, which can be viewed in transaction logs.

## Building the Program

To build your program:

\`\`\`bash
cargo build-bpf
\`\`\`

This creates a \`.so\` file that can be deployed to Solana.

## Deployment

Deploy your program using the Solana CLI:

\`\`\`bash
solana program deploy target/deploy/hello_world.so
\`\`\`

Congratulations! You've built and deployed your first Solana program.`,
              order: 1,
              type: 'lesson',
              xpReward: 50,
              estimatedDuration: 90,
              codeChallenge: {
                id: 'hello-world-challenge',
                lessonId: 'hello-world-program',
                prompt: 'Modify the Hello World program to accept a custom message from instruction_data and log it to the blockchain.',
                starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // TODO: Parse the instruction_data as a string and log it
    
    Ok(())
}`,
                solutionCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Convert instruction_data to string and log it
    if let Ok(message) = std::str::from_utf8(instruction_data) {
        msg!("Custom message: {}", message);
    } else {
        msg!("Hello World Rust program entrypoint");
    }
    
    Ok(())
}`,
                testCases: [
                  {
                    id: 'test1',
                    input: 'Custom message data',
                    expectedOutput: 'Custom message: Custom message data',
                    description: 'Should log custom message from instruction_data'
                  }
                ],
                hints: [
                  'Use std::str::from_utf8() to convert bytes to string',
                  'Handle the Result type returned by from_utf8()',
                  'Use msg!() to log the message'
                ],
                language: 'rust'
              },
              resources: []
            }
          ]
        }
      ],
      totalLessons: 4,
      totalChallenges: 1,
      publishedAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z',
      isPublished: true,
      prerequisites: ['Basic programming knowledge'],
      learningOutcomes: [
        'Understand Solana\'s architecture and account model',
        'Write basic Rust code for Solana programs',
        'Deploy and interact with Solana programs',
        'Understand transactions and instruction processing'
      ]
    },
    {
      id: 'anchor-framework',
      slug: 'anchor-framework',
      title: 'Anchor Framework Deep Dive',
      description: 'Master the most popular Solana development framework',
      longDescription: 'Dive deep into the Anchor framework, the most popular tool for Solana development. Learn how to build complex DApps with ease using Anchor\'s powerful abstractions and built-in security features.',
      thumbnail: '/images/courses/anchor-framework.jpg',
      difficulty: 'intermediate',
      duration: 35,
      xpReward: 2500,
      tags: ['anchor', 'solana', 'rust', 'defi'],
      category: 'Framework',
      language: 'en',
      instructor: {
        name: 'Maria Garcia',
        avatar: '/images/instructors/maria-garcia.jpg',
        bio: 'Anchor core contributor and DeFi protocol architect'
      },
      modules: [],
      totalLessons: 12,
      totalChallenges: 4,
      publishedAt: '2024-01-20T00:00:00Z',
      updatedAt: '2024-02-05T00:00:00Z',
      isPublished: true,
      prerequisites: ['Solana Fundamentals', 'Intermediate Rust'],
      learningOutcomes: [
        'Master Anchor framework concepts',
        'Build complex DeFi protocols',
        'Implement security best practices',
        'Deploy production-ready applications'
      ]
    },
    {
      id: 'solana-nfts',
      slug: 'solana-nfts',
      title: 'NFT Development on Solana',
      description: 'Build NFT collections and marketplaces on Solana',
      longDescription: 'Learn how to create, mint, and trade NFTs on Solana. This course covers Metaplex standards, custom NFT programs, and building complete NFT marketplaces.',
      thumbnail: '/images/courses/solana-nfts.jpg',
      difficulty: 'intermediate',
      duration: 25,
      xpReward: 2000,
      tags: ['nft', 'metaplex', 'solana', 'marketplace'],
      category: 'NFTs',
      language: 'en',
      instructor: {
        name: 'David Chen',
        avatar: '/images/instructors/david-chen.jpg',
        bio: 'NFT platform architect and Metaplex expert'
      },
      modules: [],
      totalLessons: 8,
      totalChallenges: 3,
      publishedAt: '2024-01-25T00:00:00Z',
      updatedAt: '2024-02-10T00:00:00Z',
      isPublished: true,
      prerequisites: ['Solana Fundamentals'],
      learningOutcomes: [
        'Understand NFT standards on Solana',
        'Create and mint NFT collections',
        'Build NFT marketplaces',
        'Implement royalty mechanisms'
      ]
    }
  ]

  async getCourses(filters?: CourseFilters): Promise<Course[]> {
    let filteredCourses = [...this.courses]

    if (filters) {
      if (filters.category) {
        filteredCourses = filteredCourses.filter(course => 
          course.category.toLowerCase().includes(filters.category!.toLowerCase())
        )
      }

      if (filters.difficulty) {
        filteredCourses = filteredCourses.filter(course => 
          course.difficulty === filters.difficulty
        )
      }

      if (filters.language) {
        filteredCourses = filteredCourses.filter(course => 
          course.language === filters.language
        )
      }

      if (filters.tags && filters.tags.length > 0) {
        filteredCourses = filteredCourses.filter(course =>
          filters.tags!.some(tag => 
            course.tags.some(courseTag => 
              courseTag.toLowerCase().includes(tag.toLowerCase())
            )
          )
        )
      }

      if (filters.duration) {
        filteredCourses = filteredCourses.filter(course => {
          if (filters.duration!.min !== undefined && course.duration < filters.duration!.min) {
            return false
          }
          if (filters.duration!.max !== undefined && course.duration > filters.duration!.max) {
            return false
          }
          return true
        })
      }
    }

    return filteredCourses.filter(course => course.isPublished)
  }

  async getCourse(slug: string): Promise<Course | null> {
    return this.courses.find(course => course.slug === slug && course.isPublished) || null
  }

  async getCourseById(id: string): Promise<Course | null> {
    return this.courses.find(course => course.id === id && course.isPublished) || null
  }

  async searchCourses(query: string, filters?: CourseFilters): Promise<Course[]> {
    const allCourses = await this.getCourses(filters)
    const lowercaseQuery = query.toLowerCase()

    return allCourses.filter(course =>
      course.title.toLowerCase().includes(lowercaseQuery) ||
      course.description.toLowerCase().includes(lowercaseQuery) ||
      course.longDescription.toLowerCase().includes(lowercaseQuery) ||
      course.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      course.category.toLowerCase().includes(lowercaseQuery) ||
      course.instructor.name.toLowerCase().includes(lowercaseQuery)
    )
  }
}

// Export singleton instance
export const courseService = new LocalCourseService()