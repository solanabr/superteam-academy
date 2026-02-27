export interface QuizQuestion {
  id: string;
  category: "web3-basics" | "solana" | "development" | "defi";
  question: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    category: "web3-basics",
    question: "What is a blockchain?",
    options: [
      { id: "a", text: "A centralized database managed by a single company" },
      {
        id: "b",
        text: "A distributed, immutable ledger maintained by a network of nodes",
      },
      { id: "c", text: "A type of cryptocurrency wallet" },
      { id: "d", text: "A programming language for smart contracts" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q2",
    category: "solana",
    question: "What makes Solana different from most other blockchains?",
    options: [
      { id: "a", text: "It uses Proof of Work like Bitcoin" },
      {
        id: "b",
        text: "Proof of History combined with parallel transaction execution",
      },
      { id: "c", text: "It can only process one transaction at a time" },
      { id: "d", text: "It does not require validators" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q3",
    category: "solana",
    question: "What is a smart contract called on Solana?",
    options: [
      { id: "a", text: "A module" },
      { id: "b", text: "A contract" },
      { id: "c", text: "A program" },
      { id: "d", text: "A script" },
    ],
    correctOptionId: "c",
  },
  {
    id: "q4",
    category: "development",
    question: "What language are Solana programs primarily written in?",
    options: [
      { id: "a", text: "Solidity" },
      { id: "b", text: "JavaScript" },
      { id: "c", text: "Python" },
      { id: "d", text: "Rust" },
    ],
    correctOptionId: "d",
  },
  {
    id: "q5",
    category: "solana",
    question: "What is an account on Solana?",
    options: [
      { id: "a", text: "A username and password pair" },
      {
        id: "b",
        text: "A buffer of bytes stored on-chain that can hold data or executable code",
      },
      { id: "c", text: "A type of transaction" },
      { id: "d", text: "A wallet application" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q6",
    category: "defi",
    question: "What does DeFi stand for?",
    options: [
      { id: "a", text: "Defined Finance" },
      { id: "b", text: "Decentralized Fiction" },
      { id: "c", text: "Decentralized Finance" },
      { id: "d", text: "Digital Financial Interface" },
    ],
    correctOptionId: "c",
  },
  {
    id: "q7",
    category: "development",
    question: "What is a PDA (Program Derived Address)?",
    options: [
      { id: "a", text: "A public wallet address anyone can spend from" },
      {
        id: "b",
        text: "A deterministic address derived from seeds where no private key exists",
      },
      { id: "c", text: "A type of token on Solana" },
      { id: "d", text: "A database connection string" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q8",
    category: "defi",
    question: "What is an AMM (Automated Market Maker)?",
    options: [
      { id: "a", text: "A bot that sends spam transactions" },
      { id: "b", text: "A centralized exchange order book" },
      {
        id: "c",
        text: "A protocol that uses liquidity pools and a mathematical formula to price assets",
      },
      { id: "d", text: "A hardware wallet manufacturer" },
    ],
    correctOptionId: "c",
  },
];
