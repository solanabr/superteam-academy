import type { CodingChallenge } from './types';

export const nftMetaplexChallenges: CodingChallenge[] = [
  // ── Beginner (nft-001 to nft-006) ──────────────────────────────────────
  {
    id: 'nft-001',
    title: 'Define NFT Metadata Structure',
    description:
      'Create a TypeScript interface and factory function for NFT metadata following the Metaplex Token Metadata standard. The metadata must include name, symbol, uri, seller_fee_basis_points, and a creators array.',
    difficulty: 'beginner',
    category: 'nft-metaplex',
    language: 'typescript',
    starterCode: `interface Creator {
  address: string;
  verified: boolean;
  share: number;
}

interface NftMetadata {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Creator[];
}

// TODO: Implement createNftMetadata that returns an NftMetadata object.
// - Validate that name is non-empty and max 32 characters
// - Validate that symbol is non-empty and max 10 characters
// - Validate that sellerFeeBasisPoints is between 0 and 10000
// - Validate that creator shares sum to 100
// - Throw descriptive errors for invalid input
function createNftMetadata(
  name: string,
  symbol: string,
  uri: string,
  sellerFeeBasisPoints: number,
  creators: Creator[]
): NftMetadata {
  // Your code here
}`,
    solution: `interface Creator {
  address: string;
  verified: boolean;
  share: number;
}

interface NftMetadata {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Creator[];
}

function createNftMetadata(
  name: string,
  symbol: string,
  uri: string,
  sellerFeeBasisPoints: number,
  creators: Creator[]
): NftMetadata {
  if (!name || name.length > 32) {
    throw new Error('Name must be 1-32 characters');
  }
  if (!symbol || symbol.length > 10) {
    throw new Error('Symbol must be 1-10 characters');
  }
  if (sellerFeeBasisPoints < 0 || sellerFeeBasisPoints > 10000) {
    throw new Error('Seller fee basis points must be 0-10000');
  }
  const totalShares = creators.reduce((sum, c) => sum + c.share, 0);
  if (totalShares !== 100) {
    throw new Error('Creator shares must sum to 100');
  }
  return { name, symbol, uri, sellerFeeBasisPoints, creators };
}`,
    testCases: [
      {
        input: 'createNftMetadata("Cool NFT", "COOL", "https://arweave.net/abc", 500, [{ address: "Fg6...", verified: true, share: 100 }])',
        expectedOutput: '{"name":"Cool NFT","symbol":"COOL","uri":"https://arweave.net/abc","sellerFeeBasisPoints":500,"creators":[{"address":"Fg6...","verified":true,"share":100}]}',
        description: 'Creates valid metadata with a single creator',
      },
      {
        input: 'createNftMetadata("", "COOL", "https://arweave.net/abc", 500, [{ address: "Fg6...", verified: true, share: 100 }])',
        expectedOutput: 'Error: Name must be 1-32 characters',
        description: 'Rejects empty name',
      },
      {
        input: 'createNftMetadata("Cool NFT", "COOL", "https://arweave.net/abc", 500, [{ address: "A", verified: true, share: 50 }, { address: "B", verified: false, share: 30 }])',
        expectedOutput: 'Error: Creator shares must sum to 100',
        description: 'Rejects creator shares that do not sum to 100',
      },
    ],
    hints: [
      'The sellerFeeBasisPoints field uses basis points: 500 = 5% royalty.',
      'Use Array.reduce to sum creator shares and validate they equal 100.',
      'Check each constraint independently and throw specific error messages.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },
  {
    id: 'nft-002',
    title: 'Create a Metaplex Core Asset',
    description:
      'Write a TypeScript function that builds the instruction data for creating a Metaplex Core asset. The function should assemble the correct account keys and arguments for the create instruction.',
    difficulty: 'beginner',
    category: 'nft-metaplex',
    language: 'typescript',
    starterCode: `interface CoreAssetParams {
  name: string;
  uri: string;
  owner: string;
  payer: string;
  collection?: string;
}

interface CreateAssetInstruction {
  programId: string;
  accounts: string[];
  data: { name: string; uri: string };
}

const MPL_CORE_PROGRAM_ID = 'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7';

// TODO: Implement buildCreateAssetInstruction
// - Set programId to MPL_CORE_PROGRAM_ID
// - Accounts order: [payer, owner, asset (derive as payer + "-asset"), collection (if provided)]
// - Data contains name and uri
function buildCreateAssetInstruction(params: CoreAssetParams): CreateAssetInstruction {
  // Your code here
}`,
    solution: `interface CoreAssetParams {
  name: string;
  uri: string;
  owner: string;
  payer: string;
  collection?: string;
}

interface CreateAssetInstruction {
  programId: string;
  accounts: string[];
  data: { name: string; uri: string };
}

const MPL_CORE_PROGRAM_ID = 'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7';

function buildCreateAssetInstruction(params: CoreAssetParams): CreateAssetInstruction {
  const accounts = [params.payer, params.owner, params.payer + '-asset'];
  if (params.collection) {
    accounts.push(params.collection);
  }
  return {
    programId: MPL_CORE_PROGRAM_ID,
    accounts,
    data: { name: params.name, uri: params.uri },
  };
}`,
    testCases: [
      {
        input: 'buildCreateAssetInstruction({ name: "My NFT", uri: "https://arweave.net/xyz", owner: "owner1", payer: "payer1" })',
        expectedOutput: '{"programId":"CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7","accounts":["payer1","owner1","payer1-asset"],"data":{"name":"My NFT","uri":"https://arweave.net/xyz"}}',
        description: 'Creates instruction without collection',
      },
      {
        input: 'buildCreateAssetInstruction({ name: "Col NFT", uri: "https://arweave.net/abc", owner: "owner2", payer: "payer2", collection: "col1" })',
        expectedOutput: '{"programId":"CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7","accounts":["payer2","owner2","payer2-asset","col1"],"data":{"name":"Col NFT","uri":"https://arweave.net/abc"}}',
        description: 'Creates instruction with collection account',
      },
      {
        input: 'buildCreateAssetInstruction({ name: "Test", uri: "https://arweave.net/t", owner: "o", payer: "p" }).accounts.length',
        expectedOutput: '3',
        description: 'Returns 3 accounts when no collection is provided',
      },
    ],
    hints: [
      'The asset address is derived from the payer — concatenate payer + "-asset" for this exercise.',
      'Only include the collection account in the array if params.collection is defined.',
      'The programId is always MPL_CORE_PROGRAM_ID regardless of parameters.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },
  {
    id: 'nft-003',
    title: 'Build a Collection',
    description:
      'Implement a Rust struct and constructor for an on-chain NFT collection. The collection tracks name, uri, size, and the current number of minted items.',
    difficulty: 'beginner',
    category: 'nft-metaplex',
    language: 'rust',
    starterCode: `use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Collection {
    pub name: String,
    pub uri: String,
    pub size: u64,
    pub current_size: u64,
    pub authority: [u8; 32],
}

impl Collection {
    // TODO: Implement new() that creates a Collection with current_size = 0
    // - Validate name is non-empty and <= 32 bytes
    // - Validate size > 0
    // - Return Err(&str) for invalid input

    // TODO: Implement can_mint() -> bool
    // Returns true if current_size < size

    // TODO: Implement increment() -> Result<(), &str>
    // Increments current_size if can_mint(), else returns Err
}`,
    solution: `use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Collection {
    pub name: String,
    pub uri: String,
    pub size: u64,
    pub current_size: u64,
    pub authority: [u8; 32],
}

impl Collection {
    pub fn new(name: String, uri: String, size: u64, authority: [u8; 32]) -> Result<Self, &'static str> {
        if name.is_empty() || name.len() > 32 {
            return Err("Name must be 1-32 bytes");
        }
        if size == 0 {
            return Err("Size must be greater than 0");
        }
        Ok(Self {
            name,
            uri,
            size,
            current_size: 0,
            authority,
        })
    }

    pub fn can_mint(&self) -> bool {
        self.current_size < self.size
    }

    pub fn increment(&mut self) -> Result<(), &'static str> {
        if !self.can_mint() {
            return Err("Collection is full");
        }
        self.current_size = self.current_size.checked_add(1).ok_or("Overflow")?;
        Ok(())
    }
}`,
    testCases: [
      {
        input: 'Collection::new("Art".into(), "https://arweave.net/col".into(), 100, [0u8; 32])',
        expectedOutput: 'Ok(Collection { name: "Art", uri: "https://arweave.net/col", size: 100, current_size: 0, authority: [0; 32] })',
        description: 'Creates a valid collection with current_size initialized to 0',
      },
      {
        input: 'Collection::new("".into(), "uri".into(), 10, [0u8; 32])',
        expectedOutput: 'Err("Name must be 1-32 bytes")',
        description: 'Rejects empty collection name',
      },
      {
        input: 'let mut c = Collection::new("X".into(), "u".into(), 1, [0u8; 32]).unwrap(); c.increment().unwrap(); c.increment()',
        expectedOutput: 'Err("Collection is full")',
        description: 'Prevents minting beyond collection size',
      },
    ],
    hints: [
      'Use checked_add for safe arithmetic when incrementing current_size.',
      'The can_mint method is a simple comparison between current_size and size.',
      'Initialize current_size to 0 in the constructor — items are minted separately.',
    ],
    xpReward: 50,
    estimatedMinutes: 12,
  },
  {
    id: 'nft-004',
    title: 'Parse NFT Attributes',
    description:
      'Write a TypeScript function that parses a JSON metadata string and extracts NFT attributes into a structured map. Handle the standard Metaplex attributes array format.',
    difficulty: 'beginner',
    category: 'nft-metaplex',
    language: 'typescript',
    starterCode: `interface Attribute {
  trait_type: string;
  value: string | number;
}

// TODO: Implement parseAttributes
// - Parse the JSON string into an object
// - Extract the "attributes" array
// - Return a Map<string, string | number> keyed by trait_type
// - If JSON is invalid, throw "Invalid JSON"
// - If attributes array is missing, return an empty Map
function parseAttributes(metadataJson: string): Map<string, string | number> {
  // Your code here
}`,
    solution: `interface Attribute {
  trait_type: string;
  value: string | number;
}

function parseAttributes(metadataJson: string): Map<string, string | number> {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(metadataJson);
  } catch {
    throw new Error('Invalid JSON');
  }
  const result = new Map<string, string | number>();
  const attributes = parsed.attributes;
  if (!Array.isArray(attributes)) {
    return result;
  }
  for (const attr of attributes as Attribute[]) {
    result.set(attr.trait_type, attr.value);
  }
  return result;
}`,
    testCases: [
      {
        input: 'parseAttributes(\'{"attributes":[{"trait_type":"Background","value":"Blue"},{"trait_type":"Level","value":5}]}\')',
        expectedOutput: 'Map(2) { "Background" => "Blue", "Level" => 5 }',
        description: 'Parses attributes with mixed string and number values',
      },
      {
        input: 'parseAttributes(\'{"name":"NFT"}\')',
        expectedOutput: 'Map(0) {}',
        description: 'Returns empty map when attributes array is missing',
      },
      {
        input: 'parseAttributes("not json")',
        expectedOutput: 'Error: Invalid JSON',
        description: 'Throws error for invalid JSON input',
      },
    ],
    hints: [
      'Wrap JSON.parse in a try-catch to handle invalid JSON gracefully.',
      'Check Array.isArray on the attributes field before iterating.',
      'Use Map.set(trait_type, value) to build the result map from each attribute.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },
  {
    id: 'nft-005',
    title: 'Enforce Royalty Percentages',
    description:
      'Implement a Rust function that validates and enforces royalty configurations for NFT sales. Royalties use basis points (1 bp = 0.01%). The total across all recipients must not exceed a maximum.',
    difficulty: 'beginner',
    category: 'nft-metaplex',
    language: 'rust',
    starterCode: `pub struct RoyaltyRecipient {
    pub address: [u8; 32],
    pub basis_points: u16,
}

pub struct RoyaltyConfig {
    pub recipients: Vec<RoyaltyRecipient>,
    pub total_basis_points: u16,
}

const MAX_ROYALTY_BPS: u16 = 10_000;

// TODO: Implement validate_royalties
// - Verify each recipient has basis_points > 0
// - Sum all basis_points and check it matches total_basis_points
// - Ensure total_basis_points <= MAX_ROYALTY_BPS
// - Ensure at least one recipient exists
// - Return Ok(()) or Err with descriptive message
pub fn validate_royalties(config: &RoyaltyConfig) -> Result<(), &'static str> {
    // Your code here
}

// TODO: Implement calculate_royalty_amount
// - Given a sale_price in lamports and basis_points, return the royalty amount
// - Use checked arithmetic to prevent overflow
pub fn calculate_royalty_amount(sale_price: u64, basis_points: u16) -> Result<u64, &'static str> {
    // Your code here
}`,
    solution: `pub struct RoyaltyRecipient {
    pub address: [u8; 32],
    pub basis_points: u16,
}

pub struct RoyaltyConfig {
    pub recipients: Vec<RoyaltyRecipient>,
    pub total_basis_points: u16,
}

const MAX_ROYALTY_BPS: u16 = 10_000;

pub fn validate_royalties(config: &RoyaltyConfig) -> Result<(), &'static str> {
    if config.recipients.is_empty() {
        return Err("At least one recipient required");
    }
    let mut sum: u16 = 0;
    for r in &config.recipients {
        if r.basis_points == 0 {
            return Err("Recipient basis_points must be > 0");
        }
        sum = sum.checked_add(r.basis_points).ok_or("Basis points overflow")?;
    }
    if sum != config.total_basis_points {
        return Err("Recipient shares do not match total");
    }
    if config.total_basis_points > MAX_ROYALTY_BPS {
        return Err("Total exceeds maximum royalty");
    }
    Ok(())
}

pub fn calculate_royalty_amount(sale_price: u64, basis_points: u16) -> Result<u64, &'static str> {
    let amount = (sale_price as u128)
        .checked_mul(basis_points as u128)
        .ok_or("Multiplication overflow")?
        .checked_div(10_000)
        .ok_or("Division error")?;
    Ok(amount as u64)
}`,
    testCases: [
      {
        input: 'validate_royalties(&RoyaltyConfig { recipients: vec![RoyaltyRecipient { address: [1; 32], basis_points: 500 }], total_basis_points: 500 })',
        expectedOutput: 'Ok(())',
        description: 'Validates a correct royalty config with 5% to one recipient',
      },
      {
        input: 'validate_royalties(&RoyaltyConfig { recipients: vec![], total_basis_points: 0 })',
        expectedOutput: 'Err("At least one recipient required")',
        description: 'Rejects config with no recipients',
      },
      {
        input: 'calculate_royalty_amount(1_000_000_000, 500)',
        expectedOutput: 'Ok(50_000_000)',
        description: 'Calculates 5% royalty on 1 SOL (1B lamports)',
      },
    ],
    hints: [
      'Basis points divide by 10,000 to get the percentage: 500 bps = 5%.',
      'Cast to u128 before multiplying sale_price by basis_points to prevent overflow.',
      'Iterate recipients with checked_add to safely accumulate the total basis points.',
    ],
    xpReward: 50,
    estimatedMinutes: 15,
  },
  {
    id: 'nft-006',
    title: 'Verify Creator Addresses',
    description:
      'Write a TypeScript function that validates a list of NFT creators. Each creator must have a valid base58 public key, and exactly one creator must be marked as verified. Creator shares must sum to 100.',
    difficulty: 'beginner',
    category: 'nft-metaplex',
    language: 'typescript',
    starterCode: `interface Creator {
  address: string;
  verified: boolean;
  share: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// TODO: Implement verifyCreators
// - Check that there is at least 1 and at most 5 creators
// - Each address must be a base58 string of 32-44 characters
// - Each share must be a non-negative integer
// - Shares must sum to 100
// - At least one creator must be verified
// - Collect all errors and return them
function verifyCreators(creators: Creator[]): ValidationResult {
  // Your code here
}`,
    solution: `interface Creator {
  address: string;
  verified: boolean;
  share: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function verifyCreators(creators: Creator[]): ValidationResult {
  const errors: string[] = [];
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  if (creators.length === 0 || creators.length > 5) {
    errors.push('Must have 1-5 creators');
  }

  for (let i = 0; i < creators.length; i++) {
    if (!base58Regex.test(creators[i].address)) {
      errors.push(\`Creator \${i} has invalid address\`);
    }
    if (!Number.isInteger(creators[i].share) || creators[i].share < 0) {
      errors.push(\`Creator \${i} has invalid share\`);
    }
  }

  const totalShares = creators.reduce((sum, c) => sum + c.share, 0);
  if (totalShares !== 100) {
    errors.push('Shares must sum to 100');
  }

  const hasVerified = creators.some((c) => c.verified);
  if (!hasVerified) {
    errors.push('At least one creator must be verified');
  }

  return { valid: errors.length === 0, errors };
}`,
    testCases: [
      {
        input: 'verifyCreators([{ address: "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS", verified: true, share: 100 }])',
        expectedOutput: '{"valid":true,"errors":[]}',
        description: 'Validates a single verified creator with 100% share',
      },
      {
        input: 'verifyCreators([{ address: "invalid!", verified: true, share: 100 }])',
        expectedOutput: '{"valid":false,"errors":["Creator 0 has invalid address"]}',
        description: 'Detects invalid base58 address',
      },
      {
        input: 'verifyCreators([{ address: "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS", verified: false, share: 100 }])',
        expectedOutput: '{"valid":false,"errors":["At least one creator must be verified"]}',
        description: 'Requires at least one verified creator',
      },
    ],
    hints: [
      'Solana public keys are base58 encoded and typically 32-44 characters long.',
      'Use a regex like /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ to validate base58 format.',
      'Collect all errors into an array instead of returning on the first failure.',
    ],
    xpReward: 50,
    estimatedMinutes: 12,
  },

  // ── Intermediate (nft-007 to nft-014) ──────────────────────────────────
  {
    id: 'nft-007',
    title: 'Generate Metadata URI',
    description:
      'Implement a TypeScript function that constructs an off-chain metadata JSON object compliant with the Metaplex standard and returns a data URI. The metadata must include image, external_url, attributes, and properties.files.',
    difficulty: 'intermediate',
    category: 'nft-metaplex',
    language: 'typescript',
    starterCode: `interface MetadataInput {
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl: string;
  attributes: { trait_type: string; value: string | number }[];
  animationUrl?: string;
}

// TODO: Implement generateMetadataUri
// - Build a JSON object following the Metaplex off-chain metadata standard
// - Include: name, symbol, description, image, external_url, attributes
// - Include properties.files array with the image (type "image/png")
// - If animationUrl is provided, add it to properties.files with type "video/mp4"
// - Include properties.category as "image" or "video" based on animationUrl presence
// - Return a data URI: "data:application/json;base64," + base64 encoded JSON
function generateMetadataUri(input: MetadataInput): string {
  // Your code here
}`,
    solution: `interface MetadataInput {
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl: string;
  attributes: { trait_type: string; value: string | number }[];
  animationUrl?: string;
}

function generateMetadataUri(input: MetadataInput): string {
  const files: { uri: string; type: string }[] = [
    { uri: input.image, type: 'image/png' },
  ];

  if (input.animationUrl) {
    files.push({ uri: input.animationUrl, type: 'video/mp4' });
  }

  const metadata = {
    name: input.name,
    symbol: input.symbol,
    description: input.description,
    image: input.image,
    external_url: input.externalUrl,
    attributes: input.attributes,
    properties: {
      files,
      category: input.animationUrl ? 'video' : 'image',
    },
  };

  const json = JSON.stringify(metadata);
  const base64 = Buffer.from(json).toString('base64');
  return 'data:application/json;base64,' + base64;
}`,
    testCases: [
      {
        input: 'generateMetadataUri({ name: "T", symbol: "T", description: "d", image: "https://img.png", externalUrl: "https://example.com", attributes: [] }).startsWith("data:application/json;base64,")',
        expectedOutput: 'true',
        description: 'Returns a data URI with correct prefix',
      },
      {
        input: 'JSON.parse(Buffer.from(generateMetadataUri({ name: "T", symbol: "T", description: "d", image: "https://img.png", externalUrl: "https://example.com", attributes: [{ trait_type: "Color", value: "Red" }] }).split(",")[1], "base64").toString()).attributes.length',
        expectedOutput: '1',
        description: 'Encodes attributes correctly in the data URI',
      },
      {
        input: 'JSON.parse(Buffer.from(generateMetadataUri({ name: "V", symbol: "V", description: "d", image: "https://img.png", externalUrl: "https://e.com", attributes: [], animationUrl: "https://vid.mp4" }).split(",")[1], "base64").toString()).properties.category',
        expectedOutput: '"video"',
        description: 'Sets category to video when animationUrl is provided',
      },
    ],
    hints: [
      'The Metaplex standard uses snake_case for JSON fields: external_url, trait_type.',
      'Use Buffer.from(json).toString("base64") to encode the metadata JSON.',
      'The properties.category should be "video" if an animation URL exists, otherwise "image".',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },
  {
    id: 'nft-008',
    title: 'Compressed NFT (cNFT) Basics',
    description:
      'Implement a TypeScript function that constructs the leaf data for a compressed NFT. The leaf schema includes owner, delegate, nonce, data hash, and creator hash, packed into a single hash.',
    difficulty: 'intermediate',
    category: 'nft-metaplex',
    language: 'typescript',
    starterCode: `import { createHash } from 'crypto';

interface LeafSchema {
  owner: string;
  delegate: string;
  nonce: number;
  dataHash: string;
  creatorHash: string;
}

// TODO: Implement computeLeafHash
// - Concatenate: owner + delegate + nonce (as 8-byte LE hex) + dataHash + creatorHash
// - Return the SHA-256 hash of the concatenation as a hex string
// - Validate that nonce is a non-negative integer
function computeLeafHash(leaf: LeafSchema): string {
  // Your code here
}

// TODO: Implement computeDataHash
// - Takes name, symbol, uri, sellerFeeBasisPoints
// - Concatenate all fields as strings separated by ":"
// - Return SHA-256 hash as hex string
function computeDataHash(name: string, symbol: string, uri: string, sellerFeeBasisPoints: number): string {
  // Your code here
}`,
    solution: `import { createHash } from 'crypto';

interface LeafSchema {
  owner: string;
  delegate: string;
  nonce: number;
  dataHash: string;
  creatorHash: string;
}

function computeLeafHash(leaf: LeafSchema): string {
  if (!Number.isInteger(leaf.nonce) || leaf.nonce < 0) {
    throw new Error('Nonce must be a non-negative integer');
  }
  const nonceBuf = Buffer.alloc(8);
  nonceBuf.writeBigUInt64LE(BigInt(leaf.nonce));
  const nonceHex = nonceBuf.toString('hex');
  const preimage = leaf.owner + leaf.delegate + nonceHex + leaf.dataHash + leaf.creatorHash;
  return createHash('sha256').update(preimage).digest('hex');
}

function computeDataHash(name: string, symbol: string, uri: string, sellerFeeBasisPoints: number): string {
  const preimage = [name, symbol, uri, sellerFeeBasisPoints.toString()].join(':');
  return createHash('sha256').update(preimage).digest('hex');
}`,
    testCases: [
      {
        input: 'computeDataHash("NFT", "N", "https://arweave.net/x", 500).length',
        expectedOutput: '64',
        description: 'Data hash returns a 64-character hex SHA-256 digest',
      },
      {
        input: 'computeLeafHash({ owner: "aaa", delegate: "bbb", nonce: 0, dataHash: "ccc", creatorHash: "ddd" }).length',
        expectedOutput: '64',
        description: 'Leaf hash returns a 64-character hex SHA-256 digest',
      },
      {
        input: 'computeDataHash("A", "B", "C", 100) === computeDataHash("A", "B", "C", 100)',
        expectedOutput: 'true',
        description: 'Data hash is deterministic for same inputs',
      },
    ],
    hints: [
      'Use Buffer.alloc(8) and writeBigUInt64LE to convert the nonce to little-endian bytes.',
      'SHA-256 always produces a 32-byte (64-hex-character) digest.',
      'Concatenate all fields into a single string before hashing to create the preimage.',
    ],
    xpReward: 100,
    estimatedMinutes: 25,
  },
  {
    id: 'nft-009',
    title: 'Merkle Tree for cNFTs',
    description:
      'Build a simple Merkle tree implementation in TypeScript for compressed NFT leaf verification. Implement tree construction from leaves and root computation.',
    difficulty: 'intermediate',
    category: 'nft-metaplex',
    language: 'typescript',
    starterCode: `import { createHash } from 'crypto';

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// TODO: Implement buildMerkleTree
// - Takes an array of leaf hashes (hex strings)
// - If odd number of leaves, duplicate the last leaf
// - Build tree bottom-up by hashing pairs: sha256(left + right)
// - Return the tree as an array of levels (bottom to top)
// - Level 0 = leaves, last level = [root]
function buildMerkleTree(leaves: string[]): string[][] {
  // Your code here
}

// TODO: Implement getMerkleRoot
// - Returns the root hash from the tree
// - Throw if leaves array is empty
function getMerkleRoot(leaves: string[]): string {
  // Your code here
}`,
    solution: `import { createHash } from 'crypto';

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function buildMerkleTree(leaves: string[]): string[][] {
  if (leaves.length === 0) {
    throw new Error('Cannot build tree from empty leaves');
  }
  const tree: string[][] = [];
  let currentLevel = [...leaves];
  if (currentLevel.length % 2 !== 0) {
    currentLevel.push(currentLevel[currentLevel.length - 1]);
  }
  tree.push(currentLevel);

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      nextLevel.push(sha256(currentLevel[i] + currentLevel[i + 1]));
    }
    if (nextLevel.length > 1 && nextLevel.length % 2 !== 0) {
      nextLevel.push(nextLevel[nextLevel.length - 1]);
    }
    tree.push(nextLevel);
    currentLevel = nextLevel;
  }
  return tree;
}

function getMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) {
    throw new Error('Cannot compute root from empty leaves');
  }
  const tree = buildMerkleTree(leaves);
  return tree[tree.length - 1][0];
}`,
    testCases: [
      {
        input: 'getMerkleRoot(["a1", "b2", "c3", "d4"]).length',
        expectedOutput: '64',
        description: 'Root is a valid 64-character SHA-256 hex digest',
      },
      {
        input: 'buildMerkleTree(["a", "b", "c", "d"]).length',
        expectedOutput: '3',
        description: 'Tree with 4 leaves has 3 levels (leaves, mid, root)',
      },
      {
        input: 'getMerkleRoot(["leaf1"]) === sha256("leaf1" + "leaf1")',
        expectedOutput: 'true',
        description: 'Single leaf is duplicated and hashed to produce root',
      },
    ],
    hints: [
      'When the number of leaves is odd, duplicate the last leaf to make it even.',
      'Build the tree level by level: hash pairs from left to right.',
      'The root is always the single element in the final level of the tree.',
    ],
    xpReward: 100,
    estimatedMinutes: 25,
  },
  {
    id: 'nft-010',
    title: 'Verify Merkle Proof',
    description:
      'Implement a Rust function that verifies a Merkle proof for a compressed NFT leaf. Given a leaf hash, proof hashes, and the expected root, verify the leaf belongs to the tree.',
    difficulty: 'intermediate',
    category: 'nft-metaplex',
    language: 'rust',
    starterCode: `use sha2::{Sha256, Digest};

pub struct MerkleProof {
    pub leaf: [u8; 32],
    pub proof: Vec<[u8; 32]>,
    pub root: [u8; 32],
    pub index: u32,
}

fn hash_pair(left: &[u8; 32], right: &[u8; 32]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(left);
    hasher.update(right);
    let result = hasher.finalize();
    let mut out = [0u8; 32];
    out.copy_from_slice(&result);
    out
}

// TODO: Implement verify_proof
// - Start with the leaf hash as the current hash
// - For each proof element, determine order using the index bit:
//   - If bit at position i is 0, current is left, proof element is right
//   - If bit at position i is 1, current is right, proof element is left
// - Hash the pair and advance
// - Compare final hash to root
// - Return true if they match
pub fn verify_proof(proof: &MerkleProof) -> bool {
    // Your code here
}`,
    solution: `use sha2::{Sha256, Digest};

pub struct MerkleProof {
    pub leaf: [u8; 32],
    pub proof: Vec<[u8; 32]>,
    pub root: [u8; 32],
    pub index: u32,
}

fn hash_pair(left: &[u8; 32], right: &[u8; 32]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(left);
    hasher.update(right);
    let result = hasher.finalize();
    let mut out = [0u8; 32];
    out.copy_from_slice(&result);
    out
}

pub fn verify_proof(proof: &MerkleProof) -> bool {
    let mut current = proof.leaf;
    for (i, sibling) in proof.proof.iter().enumerate() {
        let bit = (proof.index >> i) & 1;
        current = if bit == 0 {
            hash_pair(&current, sibling)
        } else {
            hash_pair(sibling, &current)
        };
    }
    current == proof.root
}`,
    testCases: [
      {
        input: 'verify_proof(&MerkleProof { leaf: hash_pair(&[1u8; 32], &[0u8; 32]), proof: vec![], root: hash_pair(&[1u8; 32], &[0u8; 32]), index: 0 })',
        expectedOutput: 'true',
        description: 'Verifies a proof with empty path (leaf is root)',
      },
      {
        input: 'let l = [1u8; 32]; let r = [2u8; 32]; let root = hash_pair(&l, &r); verify_proof(&MerkleProof { leaf: l, proof: vec![r], root, index: 0 })',
        expectedOutput: 'true',
        description: 'Verifies a simple two-leaf proof where leaf is on the left',
      },
      {
        input: 'let l = [1u8; 32]; let r = [2u8; 32]; let root = hash_pair(&l, &r); verify_proof(&MerkleProof { leaf: r, proof: vec![l], root, index: 1 })',
        expectedOutput: 'true',
        description: 'Verifies a proof where the leaf is on the right (index=1)',
      },
    ],
    hints: [
      'The index bit at position i determines whether the current node is left (0) or right (1).',
      'Use bitwise shift and AND: (index >> i) & 1 to extract each bit.',
      'The final computed hash must exactly match the expected root for verification to pass.',
    ],
    xpReward: 100,
    estimatedMinutes: 25,
  },
  {
    id: 'nft-011',
    title: 'NFT Transfer Hook',
    description:
      'Implement a Rust transfer hook that validates NFT transfers. The hook checks a cooldown period between transfers and optionally enforces a whitelist of allowed recipients.',
    difficulty: 'intermediate',
    category: 'nft-metaplex',
    language: 'rust',
    starterCode: `pub struct TransferContext {
    pub from: [u8; 32],
    pub to: [u8; 32],
    pub last_transfer_timestamp: i64,
    pub current_timestamp: i64,
    pub cooldown_seconds: i64,
    pub whitelist: Option<Vec<[u8; 32]>>,
}

pub enum TransferError {
    CooldownActive { remaining: i64 },
    RecipientNotWhitelisted,
    SelfTransfer,
}

// TODO: Implement validate_transfer
// - Reject self-transfers (from == to)
// - Check cooldown: current_timestamp - last_transfer_timestamp >= cooldown_seconds
// - If whitelist is Some, verify 'to' is in the whitelist
// - Return Ok(()) if all checks pass, Err(TransferError) otherwise
pub fn validate_transfer(ctx: &TransferContext) -> Result<(), TransferError> {
    // Your code here
}`,
    solution: `pub struct TransferContext {
    pub from: [u8; 32],
    pub to: [u8; 32],
    pub last_transfer_timestamp: i64,
    pub current_timestamp: i64,
    pub cooldown_seconds: i64,
    pub whitelist: Option<Vec<[u8; 32]>>,
}

pub enum TransferError {
    CooldownActive { remaining: i64 },
    RecipientNotWhitelisted,
    SelfTransfer,
}

pub fn validate_transfer(ctx: &TransferContext) -> Result<(), TransferError> {
    if ctx.from == ctx.to {
        return Err(TransferError::SelfTransfer);
    }

    let elapsed = ctx.current_timestamp.saturating_sub(ctx.last_transfer_timestamp);
    if elapsed < ctx.cooldown_seconds {
        return Err(TransferError::CooldownActive {
            remaining: ctx.cooldown_seconds.saturating_sub(elapsed),
        });
    }

    if let Some(ref whitelist) = ctx.whitelist {
        if !whitelist.contains(&ctx.to) {
            return Err(TransferError::RecipientNotWhitelisted);
        }
    }

    Ok(())
}`,
    testCases: [
      {
        input: 'validate_transfer(&TransferContext { from: [1; 32], to: [2; 32], last_transfer_timestamp: 0, current_timestamp: 100, cooldown_seconds: 60, whitelist: None })',
        expectedOutput: 'Ok(())',
        description: 'Allows transfer when cooldown has elapsed and no whitelist',
      },
      {
        input: 'validate_transfer(&TransferContext { from: [1; 32], to: [1; 32], last_transfer_timestamp: 0, current_timestamp: 100, cooldown_seconds: 0, whitelist: None })',
        expectedOutput: 'Err(TransferError::SelfTransfer)',
        description: 'Rejects self-transfer',
      },
      {
        input: 'validate_transfer(&TransferContext { from: [1; 32], to: [2; 32], last_transfer_timestamp: 90, current_timestamp: 100, cooldown_seconds: 60, whitelist: None })',
        expectedOutput: 'Err(TransferError::CooldownActive { remaining: 50 })',
        description: 'Rejects transfer during cooldown period',
      },
    ],
    hints: [
      'Use saturating_sub to prevent underflow when computing elapsed time.',
      'Check self-transfer first — it is the cheapest validation.',
      'When a whitelist is Some, use Vec::contains to check if the recipient is allowed.',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },
  {
    id: 'nft-012',
    title: 'Burn an NFT',
    description:
      'Write a TypeScript function that constructs the instruction data for burning an NFT. The function must verify ownership, handle both regular and compressed NFTs, and build the correct accounts list.',
    difficulty: 'intermediate',
    category: 'nft-metaplex',
    language: 'typescript',
    starterCode: `interface BurnParams {
  mint: string;
  owner: string;
  tokenAccount: string;
  isCompressed: boolean;
  merkleTree?: string;
  leafIndex?: number;
}

interface BurnInstruction {
  type: 'regular' | 'compressed';
  accounts: string[];
  data: Record<string, unknown>;
}

// TODO: Implement buildBurnInstruction
// - For regular NFTs: accounts = [owner, mint, tokenAccount]
//   data = { instruction: "burn" }
// - For compressed NFTs: accounts = [owner, merkleTree]
//   data = { instruction: "burn_cnft", leafIndex }
// - Validate: compressed requires merkleTree and leafIndex
// - Throw if owner is empty
function buildBurnInstruction(params: BurnParams): BurnInstruction {
  // Your code here
}`,
    solution: `interface BurnParams {
  mint: string;
  owner: string;
  tokenAccount: string;
  isCompressed: boolean;
  merkleTree?: string;
  leafIndex?: number;
}

interface BurnInstruction {
  type: 'regular' | 'compressed';
  accounts: string[];
  data: Record<string, unknown>;
}

function buildBurnInstruction(params: BurnParams): BurnInstruction {
  if (!params.owner) {
    throw new Error('Owner is required');
  }

  if (params.isCompressed) {
    if (!params.merkleTree) {
      throw new Error('Merkle tree is required for compressed NFTs');
    }
    if (params.leafIndex === undefined || params.leafIndex < 0) {
      throw new Error('Valid leaf index is required for compressed NFTs');
    }
    return {
      type: 'compressed',
      accounts: [params.owner, params.merkleTree],
      data: { instruction: 'burn_cnft', leafIndex: params.leafIndex },
    };
  }

  return {
    type: 'regular',
    accounts: [params.owner, params.mint, params.tokenAccount],
    data: { instruction: 'burn' },
  };
}`,
    testCases: [
      {
        input: 'buildBurnInstruction({ mint: "m1", owner: "o1", tokenAccount: "ta1", isCompressed: false })',
        expectedOutput: '{"type":"regular","accounts":["o1","m1","ta1"],"data":{"instruction":"burn"}}',
        description: 'Builds a regular NFT burn instruction',
      },
      {
        input: 'buildBurnInstruction({ mint: "m1", owner: "o1", tokenAccount: "ta1", isCompressed: true, merkleTree: "mt1", leafIndex: 5 })',
        expectedOutput: '{"type":"compressed","accounts":["o1","mt1"],"data":{"instruction":"burn_cnft","leafIndex":5}}',
        description: 'Builds a compressed NFT burn instruction with merkle tree',
      },
      {
        input: 'buildBurnInstruction({ mint: "m1", owner: "o1", tokenAccount: "ta1", isCompressed: true })',
        expectedOutput: 'Error: Merkle tree is required for compressed NFTs',
        description: 'Throws when compressed NFT is missing merkle tree',
      },
    ],
    hints: [
      'Compressed NFTs do not use a token account — they are stored in a Merkle tree.',
      'Check isCompressed first to determine which code path to follow.',
      'The leafIndex for compressed NFTs identifies the position in the Merkle tree.',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },
  {
    id: 'nft-013',
    title: 'Set Delegate Authority',
    description:
      'Implement a Rust function that manages delegate authority for Metaplex Core assets. Support setting, revoking, and validating delegates with different roles (Transfer, Sale, Utility).',
    difficulty: 'intermediate',
    category: 'nft-metaplex',
    language: 'rust',
    starterCode: `#[derive(Clone, PartialEq, Debug)]
pub enum DelegateRole {
    Transfer,
    Sale,
    Utility,
}

#[derive(Clone, Debug)]
pub struct Delegate {
    pub address: [u8; 32],
    pub role: DelegateRole,
    pub expiry: Option<i64>,
}

pub struct Asset {
    pub owner: [u8; 32],
    pub delegates: Vec<Delegate>,
}

impl Asset {
    // TODO: Implement set_delegate
    // - Only owner can set delegates (verify caller == owner)
    // - Replace any existing delegate with the same role
    // - Max 3 delegates (one per role)
    // - Return Ok(()) or Err with message
    pub fn set_delegate(&mut self, caller: &[u8; 32], delegate: Delegate) -> Result<(), &'static str> {
        // Your code here
    }

    // TODO: Implement revoke_delegate
    // - Only owner can revoke
    // - Remove delegate matching the given role
    // - Return Err if no delegate with that role exists
    pub fn revoke_delegate(&mut self, caller: &[u8; 32], role: &DelegateRole) -> Result<(), &'static str> {
        // Your code here
    }

    // TODO: Implement is_authorized
    // - Check if address is owner OR has an active delegate with the given role
    // - Expired delegates (expiry < current_time) are not authorized
    pub fn is_authorized(&self, address: &[u8; 32], role: &DelegateRole, current_time: i64) -> bool {
        // Your code here
    }
}`,
    solution: `#[derive(Clone, PartialEq, Debug)]
pub enum DelegateRole {
    Transfer,
    Sale,
    Utility,
}

#[derive(Clone, Debug)]
pub struct Delegate {
    pub address: [u8; 32],
    pub role: DelegateRole,
    pub expiry: Option<i64>,
}

pub struct Asset {
    pub owner: [u8; 32],
    pub delegates: Vec<Delegate>,
}

impl Asset {
    pub fn set_delegate(&mut self, caller: &[u8; 32], delegate: Delegate) -> Result<(), &'static str> {
        if caller != &self.owner {
            return Err("Only owner can set delegates");
        }
        if let Some(pos) = self.delegates.iter().position(|d| d.role == delegate.role) {
            self.delegates[pos] = delegate;
        } else {
            if self.delegates.len() >= 3 {
                return Err("Maximum 3 delegates allowed");
            }
            self.delegates.push(delegate);
        }
        Ok(())
    }

    pub fn revoke_delegate(&mut self, caller: &[u8; 32], role: &DelegateRole) -> Result<(), &'static str> {
        if caller != &self.owner {
            return Err("Only owner can revoke delegates");
        }
        let pos = self.delegates.iter().position(|d| &d.role == role)
            .ok_or("No delegate with that role")?;
        self.delegates.remove(pos);
        Ok(())
    }

    pub fn is_authorized(&self, address: &[u8; 32], role: &DelegateRole, current_time: i64) -> bool {
        if address == &self.owner {
            return true;
        }
        self.delegates.iter().any(|d| {
            d.address == *address
                && d.role == *role
                && d.expiry.map_or(true, |exp| exp >= current_time)
        })
    }
}`,
    testCases: [
      {
        input: 'let mut a = Asset { owner: [1; 32], delegates: vec![] }; a.set_delegate(&[1; 32], Delegate { address: [2; 32], role: DelegateRole::Transfer, expiry: None })',
        expectedOutput: 'Ok(())',
        description: 'Owner can set a transfer delegate',
      },
      {
        input: 'let mut a = Asset { owner: [1; 32], delegates: vec![] }; a.set_delegate(&[2; 32], Delegate { address: [3; 32], role: DelegateRole::Sale, expiry: None })',
        expectedOutput: 'Err("Only owner can set delegates")',
        description: 'Non-owner cannot set delegates',
      },
      {
        input: 'let a = Asset { owner: [1; 32], delegates: vec![Delegate { address: [2; 32], role: DelegateRole::Transfer, expiry: Some(50) }] }; a.is_authorized(&[2; 32], &DelegateRole::Transfer, 100)',
        expectedOutput: 'false',
        description: 'Expired delegate is not authorized',
      },
    ],
    hints: [
      'Use Vec::position to find existing delegates with the same role before inserting.',
      'Check expiry with map_or: None means no expiry (always valid), Some(exp) must be >= current_time.',
      'The owner is always authorized for all roles — check ownership before delegates.',
    ],
    xpReward: 100,
    estimatedMinutes: 30,
  },
  {
    id: 'nft-014',
    title: 'Freeze/Thaw NFT',
    description:
      'Implement a TypeScript state machine that manages NFT freeze and thaw operations. Track freeze state, authority, and enforce proper state transitions with a freeze history log.',
    difficulty: 'intermediate',
    category: 'nft-metaplex',
    language: 'typescript',
    starterCode: `type FreezeState = 'unfrozen' | 'frozen';

interface FreezeEvent {
  action: 'freeze' | 'thaw';
  authority: string;
  timestamp: number;
}

interface NftFreezeManager {
  mint: string;
  state: FreezeState;
  freezeAuthority: string;
  history: FreezeEvent[];
}

// TODO: Implement createFreezeManager
// - Initialize with state 'unfrozen' and empty history
function createFreezeManager(mint: string, freezeAuthority: string): NftFreezeManager {
  // Your code here
}

// TODO: Implement freezeNft
// - Only freezeAuthority can freeze
// - Cannot freeze an already frozen NFT
// - Log the event to history
// - Return updated manager
function freezeNft(manager: NftFreezeManager, caller: string, timestamp: number): NftFreezeManager {
  // Your code here
}

// TODO: Implement thawNft
// - Only freezeAuthority can thaw
// - Cannot thaw an unfrozen NFT
// - Log the event to history
// - Return updated manager
function thawNft(manager: NftFreezeManager, caller: string, timestamp: number): NftFreezeManager {
  // Your code here
}`,
    solution: `type FreezeState = 'unfrozen' | 'frozen';

interface FreezeEvent {
  action: 'freeze' | 'thaw';
  authority: string;
  timestamp: number;
}

interface NftFreezeManager {
  mint: string;
  state: FreezeState;
  freezeAuthority: string;
  history: FreezeEvent[];
}

function createFreezeManager(mint: string, freezeAuthority: string): NftFreezeManager {
  return { mint, state: 'unfrozen', freezeAuthority, history: [] };
}

function freezeNft(manager: NftFreezeManager, caller: string, timestamp: number): NftFreezeManager {
  if (caller !== manager.freezeAuthority) {
    throw new Error('Unauthorized: not freeze authority');
  }
  if (manager.state === 'frozen') {
    throw new Error('NFT is already frozen');
  }
  return {
    ...manager,
    state: 'frozen',
    history: [...manager.history, { action: 'freeze', authority: caller, timestamp }],
  };
}

function thawNft(manager: NftFreezeManager, caller: string, timestamp: number): NftFreezeManager {
  if (caller !== manager.freezeAuthority) {
    throw new Error('Unauthorized: not freeze authority');
  }
  if (manager.state === 'unfrozen') {
    throw new Error('NFT is not frozen');
  }
  return {
    ...manager,
    state: 'unfrozen',
    history: [...manager.history, { action: 'thaw', authority: caller, timestamp }],
  };
}`,
    testCases: [
      {
        input: 'const m = createFreezeManager("mint1", "auth1"); freezeNft(m, "auth1", 1000).state',
        expectedOutput: '"frozen"',
        description: 'Freeze authority can freeze an unfrozen NFT',
      },
      {
        input: 'const m = createFreezeManager("mint1", "auth1"); freezeNft(m, "attacker", 1000)',
        expectedOutput: 'Error: Unauthorized: not freeze authority',
        description: 'Non-authority cannot freeze',
      },
      {
        input: 'const m = createFreezeManager("mint1", "auth1"); const f = freezeNft(m, "auth1", 1000); thawNft(f, "auth1", 2000).history.length',
        expectedOutput: '2',
        description: 'History tracks both freeze and thaw events',
      },
    ],
    hints: [
      'Use immutable updates (spread operator) to return new state objects.',
      'Check the current state before applying transitions — freeze requires unfrozen, thaw requires frozen.',
      'The history array serves as an audit log; append events, never overwrite.',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },

  // ── Advanced (nft-015 to nft-020) ──────────────────────────────────────
  {
    id: 'nft-015',
    title: 'Update Authority Pattern',
    description:
      'Implement a Rust authority management system for NFT collections that supports multisig update authority, timelocked transitions, and authority rotation with a pending/accept pattern.',
    difficulty: 'advanced',
    category: 'nft-metaplex',
    language: 'rust',
    starterCode: `pub struct AuthorityConfig {
    pub current_authority: [u8; 32],
    pub pending_authority: Option<[u8; 32]>,
    pub transition_started_at: Option<i64>,
    pub timelock_seconds: i64,
    pub multisig_threshold: u8,
    pub signers: Vec<[u8; 32]>,
    pub approvals: Vec<[u8; 32]>,
}

impl AuthorityConfig {
    // TODO: Implement initiate_transfer
    // - Only current_authority can initiate
    // - Set pending_authority and transition_started_at
    // - Clear any previous approvals
    // - Cannot initiate if a transfer is already pending
    pub fn initiate_transfer(&mut self, caller: &[u8; 32], new_authority: [u8; 32], current_time: i64) -> Result<(), &'static str> {
        // Your code here
    }

    // TODO: Implement approve_transfer
    // - Caller must be in the signers list
    // - Cannot approve twice
    // - Add caller to approvals
    // - Return Ok with bool indicating if threshold is met
    pub fn approve_transfer(&mut self, caller: &[u8; 32]) -> Result<bool, &'static str> {
        // Your code here
    }

    // TODO: Implement execute_transfer
    // - Requires enough approvals (>= multisig_threshold)
    // - Requires timelock period has elapsed
    // - Move pending_authority to current_authority
    // - Clear pending state and approvals
    pub fn execute_transfer(&mut self, current_time: i64) -> Result<(), &'static str> {
        // Your code here
    }

    // TODO: Implement cancel_transfer
    // - Only current_authority can cancel
    // - Clear pending state and approvals
    pub fn cancel_transfer(&mut self, caller: &[u8; 32]) -> Result<(), &'static str> {
        // Your code here
    }
}`,
    solution: `pub struct AuthorityConfig {
    pub current_authority: [u8; 32],
    pub pending_authority: Option<[u8; 32]>,
    pub transition_started_at: Option<i64>,
    pub timelock_seconds: i64,
    pub multisig_threshold: u8,
    pub signers: Vec<[u8; 32]>,
    pub approvals: Vec<[u8; 32]>,
}

impl AuthorityConfig {
    pub fn initiate_transfer(&mut self, caller: &[u8; 32], new_authority: [u8; 32], current_time: i64) -> Result<(), &'static str> {
        if caller != &self.current_authority {
            return Err("Only current authority can initiate transfer");
        }
        if self.pending_authority.is_some() {
            return Err("Transfer already pending");
        }
        self.pending_authority = Some(new_authority);
        self.transition_started_at = Some(current_time);
        self.approvals.clear();
        Ok(())
    }

    pub fn approve_transfer(&mut self, caller: &[u8; 32]) -> Result<bool, &'static str> {
        if self.pending_authority.is_none() {
            return Err("No transfer pending");
        }
        if !self.signers.contains(caller) {
            return Err("Caller is not an authorized signer");
        }
        if self.approvals.contains(caller) {
            return Err("Already approved");
        }
        self.approvals.push(*caller);
        Ok(self.approvals.len() >= self.multisig_threshold as usize)
    }

    pub fn execute_transfer(&mut self, current_time: i64) -> Result<(), &'static str> {
        let pending = self.pending_authority.ok_or("No transfer pending")?;
        let started = self.transition_started_at.ok_or("No transition timestamp")?;

        if (self.approvals.len() as u8) < self.multisig_threshold {
            return Err("Insufficient approvals");
        }
        if current_time.saturating_sub(started) < self.timelock_seconds {
            return Err("Timelock period has not elapsed");
        }

        self.current_authority = pending;
        self.pending_authority = None;
        self.transition_started_at = None;
        self.approvals.clear();
        Ok(())
    }

    pub fn cancel_transfer(&mut self, caller: &[u8; 32]) -> Result<(), &'static str> {
        if caller != &self.current_authority {
            return Err("Only current authority can cancel");
        }
        self.pending_authority = None;
        self.transition_started_at = None;
        self.approvals.clear();
        Ok(())
    }
}`,
    testCases: [
      {
        input: 'let mut cfg = AuthorityConfig { current_authority: [1; 32], pending_authority: None, transition_started_at: None, timelock_seconds: 60, multisig_threshold: 1, signers: vec![[1; 32]], approvals: vec![] }; cfg.initiate_transfer(&[1; 32], [2; 32], 100)',
        expectedOutput: 'Ok(())',
        description: 'Current authority can initiate a transfer',
      },
      {
        input: 'let mut cfg = AuthorityConfig { current_authority: [1; 32], pending_authority: Some([2; 32]), transition_started_at: Some(100), timelock_seconds: 60, multisig_threshold: 1, signers: vec![[1; 32]], approvals: vec![[1; 32]] }; cfg.execute_transfer(150)',
        expectedOutput: 'Err("Timelock period has not elapsed")',
        description: 'Cannot execute transfer before timelock expires',
      },
      {
        input: 'let mut cfg = AuthorityConfig { current_authority: [1; 32], pending_authority: Some([2; 32]), transition_started_at: Some(100), timelock_seconds: 60, multisig_threshold: 1, signers: vec![[1; 32]], approvals: vec![[1; 32]] }; cfg.execute_transfer(200); cfg.current_authority',
        expectedOutput: '[2; 32]',
        description: 'Authority transitions to pending after successful execution',
      },
    ],
    hints: [
      'The two-step pattern (initiate + accept) prevents accidental authority loss.',
      'Clear the approvals vec when initiating a new transfer to prevent stale approvals.',
      'Use saturating_sub when comparing timestamps to prevent underflow on crafted inputs.',
    ],
    xpReward: 200,
    estimatedMinutes: 40,
  },
  {
    id: 'nft-016',
    title: 'Collection Verification',
    description:
      'Implement a Rust on-chain collection verification system. The verifier validates that an NFT belongs to a collection using PDA derivation, checks the collection authority signature, and manages verified/unverified states.',
    difficulty: 'advanced',
    category: 'nft-metaplex',
    language: 'rust',
    starterCode: `use sha2::{Sha256, Digest};

pub struct CollectionItem {
    pub mint: [u8; 32],
    pub collection_mint: [u8; 32],
    pub verified: bool,
    pub collection_authority_pda: [u8; 32],
}

pub struct VerificationRequest {
    pub item_mint: [u8; 32],
    pub collection_mint: [u8; 32],
    pub authority_signer: [u8; 32],
    pub expected_pda: [u8; 32],
}

// TODO: Implement derive_collection_authority_pda
// - Seeds: ["collection_authority", collection_mint, authority]
// - Concatenate seeds and SHA-256 hash to simulate PDA derivation
// - Return the 32-byte hash
pub fn derive_collection_authority_pda(
    collection_mint: &[u8; 32],
    authority: &[u8; 32],
) -> [u8; 32] {
    // Your code here
}

// TODO: Implement verify_collection_item
// - Derive the PDA from collection_mint and authority_signer
// - Check derived PDA matches expected_pda in the request
// - If valid, return the CollectionItem with verified=true
// - If PDA mismatch, return Err
pub fn verify_collection_item(req: &VerificationRequest) -> Result<CollectionItem, &'static str> {
    // Your code here
}

// TODO: Implement unverify_collection_item
// - Only collection authority can unverify
// - Set verified to false
// - Return Err if item is already unverified
pub fn unverify_collection_item(
    item: &mut CollectionItem,
    authority: &[u8; 32],
) -> Result<(), &'static str> {
    // Your code here
}`,
    solution: `use sha2::{Sha256, Digest};

pub struct CollectionItem {
    pub mint: [u8; 32],
    pub collection_mint: [u8; 32],
    pub verified: bool,
    pub collection_authority_pda: [u8; 32],
}

pub struct VerificationRequest {
    pub item_mint: [u8; 32],
    pub collection_mint: [u8; 32],
    pub authority_signer: [u8; 32],
    pub expected_pda: [u8; 32],
}

pub fn derive_collection_authority_pda(
    collection_mint: &[u8; 32],
    authority: &[u8; 32],
) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(b"collection_authority");
    hasher.update(collection_mint);
    hasher.update(authority);
    let result = hasher.finalize();
    let mut out = [0u8; 32];
    out.copy_from_slice(&result);
    out
}

pub fn verify_collection_item(req: &VerificationRequest) -> Result<CollectionItem, &'static str> {
    let derived_pda = derive_collection_authority_pda(&req.collection_mint, &req.authority_signer);
    if derived_pda != req.expected_pda {
        return Err("PDA mismatch: invalid collection authority");
    }
    Ok(CollectionItem {
        mint: req.item_mint,
        collection_mint: req.collection_mint,
        verified: true,
        collection_authority_pda: derived_pda,
    })
}

pub fn unverify_collection_item(
    item: &mut CollectionItem,
    authority: &[u8; 32],
) -> Result<(), &'static str> {
    let derived_pda = derive_collection_authority_pda(&item.collection_mint, authority);
    if derived_pda != item.collection_authority_pda {
        return Err("Not the collection authority");
    }
    if !item.verified {
        return Err("Item is already unverified");
    }
    item.verified = false;
    Ok(())
}`,
    testCases: [
      {
        input: 'let pda = derive_collection_authority_pda(&[1; 32], &[2; 32]); pda.len()',
        expectedOutput: '32',
        description: 'PDA derivation produces a 32-byte hash',
      },
      {
        input: 'let pda = derive_collection_authority_pda(&[1; 32], &[2; 32]); let req = VerificationRequest { item_mint: [3; 32], collection_mint: [1; 32], authority_signer: [2; 32], expected_pda: pda }; verify_collection_item(&req).unwrap().verified',
        expectedOutput: 'true',
        description: 'Successfully verifies a collection item with matching PDA',
      },
      {
        input: 'let req = VerificationRequest { item_mint: [3; 32], collection_mint: [1; 32], authority_signer: [2; 32], expected_pda: [0; 32] }; verify_collection_item(&req)',
        expectedOutput: 'Err("PDA mismatch: invalid collection authority")',
        description: 'Rejects verification when PDA does not match',
      },
    ],
    hints: [
      'PDA seeds follow the pattern: [prefix_string, collection_mint, authority] concatenated before hashing.',
      'Always derive the PDA fresh and compare against the expected value — never trust provided PDAs.',
      'Unverification requires re-deriving the PDA to confirm the caller has authority.',
    ],
    xpReward: 200,
    estimatedMinutes: 35,
  },
  {
    id: 'nft-017',
    title: 'Calculate Trait Rarity',
    description:
      'Build a TypeScript rarity calculation engine for NFT collections. Compute statistical rarity scores, percentile rankings, and information-theoretic rarity (Shannon entropy) for trait combinations.',
    difficulty: 'advanced',
    category: 'nft-metaplex',
    language: 'typescript',
    starterCode: `interface NftTraits {
  tokenId: string;
  traits: Record<string, string>;
}

interface TraitRarity {
  traitType: string;
  value: string;
  count: number;
  percentage: number;
  rarityScore: number;
}

interface NftRarityResult {
  tokenId: string;
  totalScore: number;
  rank: number;
  percentile: number;
  traitRarities: TraitRarity[];
}

// TODO: Implement calculateCollectionRarity
// - Count occurrences of each trait_type:value combination across all NFTs
// - For each trait, rarityScore = 1 / (count / totalNfts)
// - totalScore for an NFT = sum of all its trait rarityScores
// - Rank NFTs by totalScore descending (rank 1 = rarest)
// - percentile = ((totalNfts - rank) / totalNfts) * 100
// - Handle missing traits: if an NFT lacks a trait_type that others have, treat it as a unique trait
function calculateCollectionRarity(collection: NftTraits[]): NftRarityResult[] {
  // Your code here
}

// TODO: Implement calculateShannonRarity
// - For a single NFT, calculate information content: -log2(probability) for each trait
// - probability = count of that trait value / total NFTs
// - Return the sum of information content across all traits
function calculateShannonRarity(nft: NftTraits, collection: NftTraits[]): number {
  // Your code here
}`,
    solution: `interface NftTraits {
  tokenId: string;
  traits: Record<string, string>;
}

interface TraitRarity {
  traitType: string;
  value: string;
  count: number;
  percentage: number;
  rarityScore: number;
}

interface NftRarityResult {
  tokenId: string;
  totalScore: number;
  rank: number;
  percentile: number;
  traitRarities: TraitRarity[];
}

function calculateCollectionRarity(collection: NftTraits[]): NftRarityResult[] {
  const totalNfts = collection.length;
  if (totalNfts === 0) return [];

  const allTraitTypes = new Set<string>();
  collection.forEach((nft) => {
    Object.keys(nft.traits).forEach((t) => allTraitTypes.add(t));
  });

  const traitCounts = new Map<string, number>();
  for (const nft of collection) {
    for (const traitType of allTraitTypes) {
      const value = nft.traits[traitType] ?? '__missing__';
      const key = traitType + ':' + value;
      traitCounts.set(key, (traitCounts.get(key) ?? 0) + 1);
    }
  }

  const results: NftRarityResult[] = collection.map((nft) => {
    const traitRarities: TraitRarity[] = [];
    let totalScore = 0;

    for (const traitType of allTraitTypes) {
      const value = nft.traits[traitType] ?? '__missing__';
      const key = traitType + ':' + value;
      const count = traitCounts.get(key) ?? 1;
      const percentage = (count / totalNfts) * 100;
      const rarityScore = 1 / (count / totalNfts);
      totalScore += rarityScore;
      traitRarities.push({ traitType, value, count, percentage, rarityScore });
    }

    return { tokenId: nft.tokenId, totalScore, rank: 0, percentile: 0, traitRarities };
  });

  results.sort((a, b) => b.totalScore - a.totalScore);
  for (let i = 0; i < results.length; i++) {
    results[i].rank = i + 1;
    results[i].percentile = ((totalNfts - results[i].rank) / totalNfts) * 100;
  }

  return results;
}

function calculateShannonRarity(nft: NftTraits, collection: NftTraits[]): number {
  const totalNfts = collection.length;
  if (totalNfts === 0) return 0;

  let totalInformation = 0;
  for (const [traitType, value] of Object.entries(nft.traits)) {
    let count = 0;
    for (const other of collection) {
      if (other.traits[traitType] === value) count++;
    }
    const probability = count / totalNfts;
    if (probability > 0) {
      totalInformation += -Math.log2(probability);
    }
  }

  return totalInformation;
}`,
    testCases: [
      {
        input: 'calculateCollectionRarity([{ tokenId: "1", traits: { bg: "red" } }, { tokenId: "2", traits: { bg: "red" } }, { tokenId: "3", traits: { bg: "blue" } }])[0].rank',
        expectedOutput: '1',
        description: 'The rarest NFT (unique blue bg) gets rank 1',
      },
      {
        input: 'calculateCollectionRarity([{ tokenId: "1", traits: { bg: "red" } }, { tokenId: "2", traits: { bg: "red" } }]).every(r => r.totalScore === r.traitRarities.reduce((s, t) => s + t.rarityScore, 0))',
        expectedOutput: 'true',
        description: 'Total score equals sum of individual trait rarity scores',
      },
      {
        input: 'Math.round(calculateShannonRarity({ tokenId: "1", traits: { bg: "blue" } }, [{ tokenId: "1", traits: { bg: "blue" } }, { tokenId: "2", traits: { bg: "red" } }, { tokenId: "3", traits: { bg: "red" } }, { tokenId: "4", traits: { bg: "red" } }]) * 100) / 100',
        expectedOutput: '2',
        description: 'Shannon rarity for a trait appearing once in 4 items is -log2(1/4) = 2',
      },
    ],
    hints: [
      'Rarity score for a trait = 1 / (frequency). Rarer traits have higher scores.',
      'Handle missing traits by assigning a "__missing__" value — NFTs without a common trait are unique.',
      'Shannon information content: -log2(p) where p is the probability of that trait value.',
    ],
    xpReward: 200,
    estimatedMinutes: 40,
  },
  {
    id: 'nft-018',
    title: 'Candy Machine Configuration',
    description:
      'Implement a Rust Candy Machine configuration builder that validates guard settings, phases, whitelist allocation, and pricing tiers. Enforce constraints like max supply, start/end times, and mint limits.',
    difficulty: 'advanced',
    category: 'nft-metaplex',
    language: 'rust',
    starterCode: `pub struct CandyMachineConfig {
    pub authority: [u8; 32],
    pub collection_mint: [u8; 32],
    pub max_supply: u64,
    pub price_lamports: u64,
    pub go_live_date: i64,
    pub end_date: Option<i64>,
    pub items_redeemed: u64,
    pub phases: Vec<MintPhase>,
}

pub struct MintPhase {
    pub label: String,
    pub start_time: i64,
    pub end_time: i64,
    pub price_lamports: u64,
    pub max_per_wallet: u8,
    pub whitelist: Option<Vec<[u8; 32]>>,
}

impl CandyMachineConfig {
    // TODO: Implement validate
    // - max_supply must be > 0
    // - go_live_date < end_date (if end_date is set)
    // - No overlapping phases
    // - Each phase: start_time < end_time, max_per_wallet > 0, label non-empty
    // - Phases must be sorted chronologically
    // - Return Vec of error strings (empty = valid)
    pub fn validate(&self) -> Vec<String> {
        // Your code here
    }

    // TODO: Implement get_active_phase
    // - Return the phase active at the given timestamp
    // - Return None if no phase is active
    pub fn get_active_phase(&self, current_time: i64) -> Option<&MintPhase> {
        // Your code here
    }

    // TODO: Implement can_mint
    // - Check if items_redeemed < max_supply
    // - Check if there's an active phase at current_time
    // - If whitelist exists on phase, check wallet is in it
    // - Return Ok(price) or Err with reason
    pub fn can_mint(&self, wallet: &[u8; 32], current_time: i64) -> Result<u64, String> {
        // Your code here
    }
}`,
    solution: `pub struct CandyMachineConfig {
    pub authority: [u8; 32],
    pub collection_mint: [u8; 32],
    pub max_supply: u64,
    pub price_lamports: u64,
    pub go_live_date: i64,
    pub end_date: Option<i64>,
    pub items_redeemed: u64,
    pub phases: Vec<MintPhase>,
}

pub struct MintPhase {
    pub label: String,
    pub start_time: i64,
    pub end_time: i64,
    pub price_lamports: u64,
    pub max_per_wallet: u8,
    pub whitelist: Option<Vec<[u8; 32]>>,
}

impl CandyMachineConfig {
    pub fn validate(&self) -> Vec<String> {
        let mut errors = Vec::new();

        if self.max_supply == 0 {
            errors.push("max_supply must be > 0".to_string());
        }

        if let Some(end) = self.end_date {
            if self.go_live_date >= end {
                errors.push("go_live_date must be before end_date".to_string());
            }
        }

        for (i, phase) in self.phases.iter().enumerate() {
            if phase.label.is_empty() {
                errors.push(format!("Phase {} has empty label", i));
            }
            if phase.start_time >= phase.end_time {
                errors.push(format!("Phase '{}': start_time must be before end_time", phase.label));
            }
            if phase.max_per_wallet == 0 {
                errors.push(format!("Phase '{}': max_per_wallet must be > 0", phase.label));
            }
        }

        for i in 1..self.phases.len() {
            if self.phases[i].start_time < self.phases[i - 1].end_time {
                errors.push(format!(
                    "Phase '{}' overlaps with '{}'",
                    self.phases[i].label,
                    self.phases[i - 1].label
                ));
            }
        }

        errors
    }

    pub fn get_active_phase(&self, current_time: i64) -> Option<&MintPhase> {
        self.phases.iter().find(|p| current_time >= p.start_time && current_time < p.end_time)
    }

    pub fn can_mint(&self, wallet: &[u8; 32], current_time: i64) -> Result<u64, String> {
        if self.items_redeemed >= self.max_supply {
            return Err("Sold out".to_string());
        }

        let phase = self.get_active_phase(current_time)
            .ok_or_else(|| "No active mint phase".to_string())?;

        if let Some(ref wl) = phase.whitelist {
            if !wl.contains(wallet) {
                return Err("Wallet not whitelisted for this phase".to_string());
            }
        }

        Ok(phase.price_lamports)
    }
}`,
    testCases: [
      {
        input: 'let cm = CandyMachineConfig { authority: [1; 32], collection_mint: [2; 32], max_supply: 100, price_lamports: 1_000_000_000, go_live_date: 1000, end_date: Some(2000), items_redeemed: 0, phases: vec![MintPhase { label: "Public".into(), start_time: 1000, end_time: 2000, price_lamports: 1_000_000_000, max_per_wallet: 3, whitelist: None }] }; cm.validate().len()',
        expectedOutput: '0',
        description: 'Valid candy machine config produces no errors',
      },
      {
        input: 'let cm = CandyMachineConfig { authority: [1; 32], collection_mint: [2; 32], max_supply: 0, price_lamports: 0, go_live_date: 2000, end_date: Some(1000), items_redeemed: 0, phases: vec![] }; cm.validate().len()',
        expectedOutput: '2',
        description: 'Detects max_supply=0 and go_live_date >= end_date errors',
      },
      {
        input: 'let cm = CandyMachineConfig { authority: [1; 32], collection_mint: [2; 32], max_supply: 10, price_lamports: 500, go_live_date: 100, end_date: None, items_redeemed: 10, phases: vec![MintPhase { label: "P".into(), start_time: 100, end_time: 200, price_lamports: 500, max_per_wallet: 1, whitelist: None }] }; cm.can_mint(&[3; 32], 150)',
        expectedOutput: 'Err("Sold out")',
        description: 'Cannot mint when items_redeemed equals max_supply',
      },
    ],
    hints: [
      'Check phase overlaps by ensuring each phase starts after the previous one ends.',
      'Use iter().find() to locate the active phase by checking the timestamp range.',
      'Validate all constraints independently and collect errors — do not short-circuit.',
    ],
    xpReward: 200,
    estimatedMinutes: 45,
  },
  {
    id: 'nft-019',
    title: 'Guard Group Setup',
    description:
      'Implement a TypeScript guard group configuration system for Candy Machine v3. Support multiple guard types (SOL payment, token gate, NFT gate, allow list, mint limit) with validation and serialization.',
    difficulty: 'advanced',
    category: 'nft-metaplex',
    language: 'typescript',
    starterCode: `type GuardType = 'solPayment' | 'tokenGate' | 'nftGate' | 'allowList' | 'mintLimit';

interface SolPaymentGuard {
  type: 'solPayment';
  lamports: number;
  destination: string;
}

interface TokenGateGuard {
  type: 'tokenGate';
  mint: string;
  amount: number;
}

interface NftGateGuard {
  type: 'nftGate';
  requiredCollection: string;
}

interface AllowListGuard {
  type: 'allowList';
  merkleRoot: string;
}

interface MintLimitGuard {
  type: 'mintLimit';
  id: number;
  limit: number;
}

type Guard = SolPaymentGuard | TokenGateGuard | NftGateGuard | AllowListGuard | MintLimitGuard;

interface GuardGroup {
  label: string;
  guards: Guard[];
}

interface GuardGroupConfig {
  defaultGuards: Guard[];
  groups: GuardGroup[];
}

// TODO: Implement validateGuardGroup
// - Each group label must be unique and 1-6 characters
// - No duplicate guard types within a group
// - SolPayment: lamports > 0, destination non-empty
// - TokenGate: amount > 0, mint non-empty
// - NftGate: requiredCollection non-empty
// - AllowList: merkleRoot must be 64-char hex
// - MintLimit: id >= 0, limit > 0
// - Max 5 guards per group, max 4 groups
// - Return { valid: boolean, errors: string[] }
function validateGuardGroup(config: GuardGroupConfig): { valid: boolean; errors: string[] } {
  // Your code here
}

// TODO: Implement serializeGuardConfig
// - Convert the guard config to a deterministic JSON string
// - Sort guards by type name within each group
// - Sort groups by label
function serializeGuardConfig(config: GuardGroupConfig): string {
  // Your code here
}`,
    solution: `type GuardType = 'solPayment' | 'tokenGate' | 'nftGate' | 'allowList' | 'mintLimit';

interface SolPaymentGuard {
  type: 'solPayment';
  lamports: number;
  destination: string;
}

interface TokenGateGuard {
  type: 'tokenGate';
  mint: string;
  amount: number;
}

interface NftGateGuard {
  type: 'nftGate';
  requiredCollection: string;
}

interface AllowListGuard {
  type: 'allowList';
  merkleRoot: string;
}

interface MintLimitGuard {
  type: 'mintLimit';
  id: number;
  limit: number;
}

type Guard = SolPaymentGuard | TokenGateGuard | NftGateGuard | AllowListGuard | MintLimitGuard;

interface GuardGroup {
  label: string;
  guards: Guard[];
}

interface GuardGroupConfig {
  defaultGuards: Guard[];
  groups: GuardGroup[];
}

function validateGuard(guard: Guard, prefix: string): string[] {
  const errors: string[] = [];
  switch (guard.type) {
    case 'solPayment':
      if (guard.lamports <= 0) errors.push(prefix + 'solPayment lamports must be > 0');
      if (!guard.destination) errors.push(prefix + 'solPayment destination required');
      break;
    case 'tokenGate':
      if (guard.amount <= 0) errors.push(prefix + 'tokenGate amount must be > 0');
      if (!guard.mint) errors.push(prefix + 'tokenGate mint required');
      break;
    case 'nftGate':
      if (!guard.requiredCollection) errors.push(prefix + 'nftGate requiredCollection required');
      break;
    case 'allowList':
      if (!/^[0-9a-f]{64}$/i.test(guard.merkleRoot)) errors.push(prefix + 'allowList merkleRoot must be 64-char hex');
      break;
    case 'mintLimit':
      if (guard.id < 0) errors.push(prefix + 'mintLimit id must be >= 0');
      if (guard.limit <= 0) errors.push(prefix + 'mintLimit limit must be > 0');
      break;
  }
  return errors;
}

function validateGuardGroup(config: GuardGroupConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.groups.length > 4) {
    errors.push('Maximum 4 groups allowed');
  }

  const labels = new Set<string>();
  for (const group of config.groups) {
    if (group.label.length < 1 || group.label.length > 6) {
      errors.push(\`Group label '\${group.label}' must be 1-6 characters\`);
    }
    if (labels.has(group.label)) {
      errors.push(\`Duplicate group label '\${group.label}'\`);
    }
    labels.add(group.label);

    if (group.guards.length > 5) {
      errors.push(\`Group '\${group.label}' exceeds 5 guards\`);
    }

    const types = new Set<string>();
    for (const guard of group.guards) {
      if (types.has(guard.type)) {
        errors.push(\`Group '\${group.label}' has duplicate guard type '\${guard.type}'\`);
      }
      types.add(guard.type);
      errors.push(...validateGuard(guard, \`Group '\${group.label}': \`));
    }
  }

  for (const guard of config.defaultGuards) {
    errors.push(...validateGuard(guard, 'Default: '));
  }

  return { valid: errors.length === 0, errors };
}

function serializeGuardConfig(config: GuardGroupConfig): string {
  const sortGuards = (guards: Guard[]) =>
    [...guards].sort((a, b) => a.type.localeCompare(b.type));

  const sorted = {
    defaultGuards: sortGuards(config.defaultGuards),
    groups: [...config.groups]
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((g) => ({ label: g.label, guards: sortGuards(g.guards) })),
  };

  return JSON.stringify(sorted);
}`,
    testCases: [
      {
        input: 'validateGuardGroup({ defaultGuards: [], groups: [{ label: "WL", guards: [{ type: "solPayment", lamports: 1000000000, destination: "addr1" }] }] }).valid',
        expectedOutput: 'true',
        description: 'Valid config with single group and SOL payment guard',
      },
      {
        input: 'validateGuardGroup({ defaultGuards: [], groups: [{ label: "WL", guards: [{ type: "allowList", merkleRoot: "invalid" }] }] }).errors.length',
        expectedOutput: '1',
        description: 'Detects invalid merkle root format',
      },
      {
        input: 'serializeGuardConfig({ defaultGuards: [{ type: "solPayment", lamports: 100, destination: "d" }], groups: [{ label: "B", guards: [] }, { label: "A", guards: [] }] }).includes(\'"A"\') && serializeGuardConfig({ defaultGuards: [{ type: "solPayment", lamports: 100, destination: "d" }], groups: [{ label: "B", guards: [] }, { label: "A", guards: [] }] }).indexOf("A") < serializeGuardConfig({ defaultGuards: [{ type: "solPayment", lamports: 100, destination: "d" }], groups: [{ label: "B", guards: [] }, { label: "A", guards: [] }] }).indexOf("B")',
        expectedOutput: 'true',
        description: 'Serialization sorts groups alphabetically by label',
      },
    ],
    hints: [
      'Candy Machine v3 guard labels are limited to 6 characters for on-chain storage efficiency.',
      'Use a Set to track guard types within each group and detect duplicates.',
      'Sort guards and groups before serialization to ensure deterministic output.',
    ],
    xpReward: 200,
    estimatedMinutes: 40,
  },
  {
    id: 'nft-020',
    title: 'NFT Token Gating',
    description:
      'Implement a Rust token gating system that grants access based on NFT ownership. Support multiple gating criteria: single NFT ownership, collection membership, trait-based access, and minimum holding duration.',
    difficulty: 'advanced',
    category: 'nft-metaplex',
    language: 'rust',
    starterCode: `#[derive(Clone)]
pub struct OwnedNft {
    pub mint: [u8; 32],
    pub collection: Option<[u8; 32]>,
    pub traits: Vec<(String, String)>,
    pub acquired_at: i64,
}

pub enum GateCondition {
    OwnsSpecificNft { mint: [u8; 32] },
    OwnsFromCollection { collection: [u8; 32], min_count: u32 },
    HasTrait { trait_type: String, trait_value: String },
    MinHoldDuration { collection: [u8; 32], seconds: i64 },
    AnyOf(Vec<GateCondition>),
    AllOf(Vec<GateCondition>),
}

pub struct GateResult {
    pub allowed: bool,
    pub reason: String,
    pub matched_nfts: Vec<[u8; 32]>,
}

// TODO: Implement evaluate_gate
// - OwnsSpecificNft: check if any owned NFT matches the mint
// - OwnsFromCollection: count NFTs from the collection, check >= min_count
// - HasTrait: check if any NFT has the matching trait_type and trait_value
// - MinHoldDuration: check if any NFT from the collection was acquired >= seconds ago
// - AnyOf: at least one sub-condition passes
// - AllOf: all sub-conditions pass
// - Return GateResult with matched NFT mints and descriptive reason
pub fn evaluate_gate(
    wallet_nfts: &[OwnedNft],
    condition: &GateCondition,
    current_time: i64,
) -> GateResult {
    // Your code here
}`,
    solution: `#[derive(Clone)]
pub struct OwnedNft {
    pub mint: [u8; 32],
    pub collection: Option<[u8; 32]>,
    pub traits: Vec<(String, String)>,
    pub acquired_at: i64,
}

pub enum GateCondition {
    OwnsSpecificNft { mint: [u8; 32] },
    OwnsFromCollection { collection: [u8; 32], min_count: u32 },
    HasTrait { trait_type: String, trait_value: String },
    MinHoldDuration { collection: [u8; 32], seconds: i64 },
    AnyOf(Vec<GateCondition>),
    AllOf(Vec<GateCondition>),
}

pub struct GateResult {
    pub allowed: bool,
    pub reason: String,
    pub matched_nfts: Vec<[u8; 32]>,
}

pub fn evaluate_gate(
    wallet_nfts: &[OwnedNft],
    condition: &GateCondition,
    current_time: i64,
) -> GateResult {
    match condition {
        GateCondition::OwnsSpecificNft { mint } => {
            let found = wallet_nfts.iter().find(|n| &n.mint == mint);
            match found {
                Some(nft) => GateResult {
                    allowed: true,
                    reason: "Owns required NFT".to_string(),
                    matched_nfts: vec![nft.mint],
                },
                None => GateResult {
                    allowed: false,
                    reason: "Does not own required NFT".to_string(),
                    matched_nfts: vec![],
                },
            }
        }
        GateCondition::OwnsFromCollection { collection, min_count } => {
            let matching: Vec<[u8; 32]> = wallet_nfts
                .iter()
                .filter(|n| n.collection.as_ref() == Some(collection))
                .map(|n| n.mint)
                .collect();
            let count = matching.len() as u32;
            if count >= *min_count {
                GateResult {
                    allowed: true,
                    reason: format!("Owns {} from collection (requires {})", count, min_count),
                    matched_nfts: matching,
                }
            } else {
                GateResult {
                    allowed: false,
                    reason: format!("Owns {} from collection but requires {}", count, min_count),
                    matched_nfts: matching,
                }
            }
        }
        GateCondition::HasTrait { trait_type, trait_value } => {
            let matching: Vec<[u8; 32]> = wallet_nfts
                .iter()
                .filter(|n| n.traits.iter().any(|(t, v)| t == trait_type && v == trait_value))
                .map(|n| n.mint)
                .collect();
            if matching.is_empty() {
                GateResult {
                    allowed: false,
                    reason: format!("No NFT with trait {}={}", trait_type, trait_value),
                    matched_nfts: vec![],
                }
            } else {
                GateResult {
                    allowed: true,
                    reason: format!("Has NFT with trait {}={}", trait_type, trait_value),
                    matched_nfts: matching,
                }
            }
        }
        GateCondition::MinHoldDuration { collection, seconds } => {
            let matching: Vec<[u8; 32]> = wallet_nfts
                .iter()
                .filter(|n| {
                    n.collection.as_ref() == Some(collection)
                        && current_time.saturating_sub(n.acquired_at) >= *seconds
                })
                .map(|n| n.mint)
                .collect();
            if matching.is_empty() {
                GateResult {
                    allowed: false,
                    reason: format!("No NFT held for {} seconds from collection", seconds),
                    matched_nfts: vec![],
                }
            } else {
                GateResult {
                    allowed: true,
                    reason: format!("{} NFTs meet hold duration requirement", matching.len()),
                    matched_nfts: matching,
                }
            }
        }
        GateCondition::AnyOf(conditions) => {
            let mut all_matched = Vec::new();
            for cond in conditions {
                let result = evaluate_gate(wallet_nfts, cond, current_time);
                if result.allowed {
                    return GateResult {
                        allowed: true,
                        reason: format!("Passed: {}", result.reason),
                        matched_nfts: result.matched_nfts,
                    };
                }
                all_matched.extend(result.matched_nfts);
            }
            GateResult {
                allowed: false,
                reason: "None of the conditions met".to_string(),
                matched_nfts: all_matched,
            }
        }
        GateCondition::AllOf(conditions) => {
            let mut all_matched = Vec::new();
            for cond in conditions {
                let result = evaluate_gate(wallet_nfts, cond, current_time);
                if !result.allowed {
                    return GateResult {
                        allowed: false,
                        reason: format!("Failed: {}", result.reason),
                        matched_nfts: result.matched_nfts,
                    };
                }
                all_matched.extend(result.matched_nfts);
            }
            GateResult {
                allowed: true,
                reason: "All conditions met".to_string(),
                matched_nfts: all_matched,
            }
        }
    }
}`,
    testCases: [
      {
        input: 'evaluate_gate(&[OwnedNft { mint: [1; 32], collection: Some([10; 32]), traits: vec![], acquired_at: 0 }], &GateCondition::OwnsSpecificNft { mint: [1; 32] }, 100).allowed',
        expectedOutput: 'true',
        description: 'Passes when wallet owns the specific NFT',
      },
      {
        input: 'evaluate_gate(&[OwnedNft { mint: [1; 32], collection: Some([10; 32]), traits: vec![("Role".into(), "Admin".into())], acquired_at: 0 }], &GateCondition::AllOf(vec![GateCondition::OwnsFromCollection { collection: [10; 32], min_count: 1 }, GateCondition::HasTrait { trait_type: "Role".into(), trait_value: "Admin".into() }]), 100).allowed',
        expectedOutput: 'true',
        description: 'AllOf passes when all sub-conditions are met',
      },
      {
        input: 'evaluate_gate(&[OwnedNft { mint: [1; 32], collection: Some([10; 32]), traits: vec![], acquired_at: 50 }], &GateCondition::MinHoldDuration { collection: [10; 32], seconds: 200 }, 100).allowed',
        expectedOutput: 'false',
        description: 'MinHoldDuration fails when NFT has not been held long enough',
      },
    ],
    hints: [
      'Use recursive evaluation for AnyOf and AllOf — each sub-condition is evaluated with the same function.',
      'For MinHoldDuration, use saturating_sub to safely compute the elapsed hold time.',
      'Collect matched NFT mints in the result so the caller can display which NFTs satisfied the gate.',
    ],
    xpReward: 200,
    estimatedMinutes: 45,
  },
];
