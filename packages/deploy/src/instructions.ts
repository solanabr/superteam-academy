import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  BPF_LOADER_UPGRADEABLE_ID,
  SYSVAR_RENT,
  SYSVAR_CLOCK,
} from "./constants";

/**
 * BPF Loader Upgradeable instruction enum variants (bincode u32LE):
 * 0 = InitializeBuffer
 * 1 = Write { offset: u32, bytes: Vec<u8> }
 * 2 = DeployWithMaxDataLen { max_data_len: usize }
 * 3 = Upgrade
 * 4 = SetAuthority
 * 5 = Close
 */

export function createInitializeBufferInstruction(
  bufferAddress: PublicKey,
  authorityAddress: PublicKey
): TransactionInstruction {
  const data = Buffer.alloc(4);
  data.writeUInt32LE(0, 0); // variant 0: InitializeBuffer

  return new TransactionInstruction({
    keys: [
      { pubkey: bufferAddress, isSigner: false, isWritable: true },
      { pubkey: authorityAddress, isSigner: false, isWritable: false },
    ],
    programId: BPF_LOADER_UPGRADEABLE_ID,
    data,
  });
}

export function createWriteInstruction(
  bufferAddress: PublicKey,
  authorityAddress: PublicKey,
  offset: number,
  bytes: Uint8Array
): TransactionInstruction {
  // bincode: u32LE(1) + u32LE(offset) + u64LE(vec_len) + bytes
  const data = Buffer.alloc(4 + 4 + 8 + bytes.length);
  data.writeUInt32LE(1, 0); // variant 1: Write
  data.writeUInt32LE(offset, 4); // offset
  data.writeBigUInt64LE(BigInt(bytes.length), 8); // vec length prefix (bincode u64)
  Buffer.from(bytes).copy(data, 16); // payload

  return new TransactionInstruction({
    keys: [
      { pubkey: bufferAddress, isSigner: false, isWritable: true },
      { pubkey: authorityAddress, isSigner: true, isWritable: false },
    ],
    programId: BPF_LOADER_UPGRADEABLE_ID,
    data,
  });
}

export function createDeployInstruction(
  payerAddress: PublicKey,
  programDataAddress: PublicKey,
  programAddress: PublicKey,
  bufferAddress: PublicKey,
  authorityAddress: PublicKey,
  maxDataLen: number
): TransactionInstruction {
  // bincode: u32LE(2) + u64LE(max_data_len)
  const data = Buffer.alloc(4 + 8);
  data.writeUInt32LE(2, 0); // variant 2: DeployWithMaxDataLen
  data.writeBigUInt64LE(BigInt(maxDataLen), 4); // max_data_len (usize as u64)

  return new TransactionInstruction({
    keys: [
      { pubkey: payerAddress, isSigner: true, isWritable: true },
      { pubkey: programDataAddress, isSigner: false, isWritable: true },
      { pubkey: programAddress, isSigner: false, isWritable: true },
      { pubkey: bufferAddress, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_RENT, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_CLOCK, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: authorityAddress, isSigner: true, isWritable: false },
    ],
    programId: BPF_LOADER_UPGRADEABLE_ID,
    data,
  });
}

export function createCloseBufferInstruction(
  bufferAddress: PublicKey,
  recipientAddress: PublicKey,
  authorityAddress: PublicKey
): TransactionInstruction {
  const data = Buffer.alloc(4);
  data.writeUInt32LE(5, 0); // variant 5: Close

  return new TransactionInstruction({
    keys: [
      { pubkey: bufferAddress, isSigner: false, isWritable: true },
      { pubkey: recipientAddress, isSigner: false, isWritable: true },
      { pubkey: authorityAddress, isSigner: true, isWritable: false },
    ],
    programId: BPF_LOADER_UPGRADEABLE_ID,
    data,
  });
}
