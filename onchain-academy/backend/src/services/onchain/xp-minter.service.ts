// backend/src/services/onchain/xp-minter.service.ts
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

export interface MintXPResult {
  signature: string;
  amount: number;
  recipient: string;
}

export class XPMinterService {
  private connection: Connection;
  private mintAuthority: Keypair;
  private xpMint: PublicKey;
  private decimals: number = 9;
  
  constructor() {
    // RPC connection
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );
    
    // Load mint authority keypair (your wallet that created the token)
    const keypairPath = process.env.MINT_AUTHORITY_KEYPAIR_PATH || 
                        path.join(process.env.HOME!, '.config/solana/id.json');
    
    this.mintAuthority = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')))
    );
    
    // Load XP mint address
    this.xpMint = new PublicKey(process.env.XP_MINT!);
    
    console.log('XP Minter initialized');
    console.log('Mint Authority:', this.mintAuthority.publicKey.toBase58());
    console.log('XP Mint:', this.xpMint.toBase58());
  }
  
  /**
   * Mint XP tokens to a user's wallet
   * @param userWallet - User's Solana wallet address (base58 string)
   * @param amount - Amount of XP to mint (will be converted to token base units)
   * @returns Transaction signature
   */
  async mintXP(userWallet: string, amount: number): Promise<MintXPResult> {
    console.log(`Minting ${amount} XP to ${userWallet}...`);
    
    const userPublicKey = new PublicKey(userWallet);
    
    // Get user's associated token account address
    const userTokenAccount = await getAssociatedTokenAddress(
      this.xpMint,
      userPublicKey,
      false, // Not a PDA
      TOKEN_2022_PROGRAM_ID
    );
    
    console.log('User token account:', userTokenAccount.toBase58());
    
    // Check if token account exists
    const accountInfo = await this.connection.getAccountInfo(userTokenAccount);
    
    const transaction = new Transaction();
    
    // If account doesn't exist, create it first
    if (!accountInfo) {
      console.log('Creating token account...');
      transaction.add(
        createAssociatedTokenAccountInstruction(
          this.mintAuthority.publicKey, // Payer
          userTokenAccount,             // Account to create
          userPublicKey,                // Owner
          this.xpMint,                  // Mint
          TOKEN_2022_PROGRAM_ID
        )
      );
    }
    
    // Mint tokens to user
    const amountInBaseUnits = amount * Math.pow(10, this.decimals);
    
    transaction.add(
      createMintToInstruction(
        this.xpMint,                     // Mint
        userTokenAccount,                // Destination
        this.mintAuthority.publicKey,   // Mint authority
        amountInBaseUnits,               // Amount in base units
        [],                              // No multisig signers
        TOKEN_2022_PROGRAM_ID
      )
    );
    
    // Send and confirm transaction
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.mintAuthority],
      { commitment: 'confirmed' }
    );
    
    console.log('✅ Minted successfully!');
    console.log('Signature:', signature);
    console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    
    return {
      signature,
      amount,
      recipient: userWallet,
    };
  }
  
  /**
   * Get XP balance for a user
   * @param userWallet - User's Solana wallet address
   * @returns Balance in XP (with decimals applied)
   */
  async getXPBalance(userWallet: string): Promise<number> {
    try {
      const userPublicKey = new PublicKey(userWallet);
      
      const userTokenAccount = await getAssociatedTokenAddress(
        this.xpMint,
        userPublicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      
      const balance = await this.connection.getTokenAccountBalance(userTokenAccount);
      
      return parseFloat(balance.value.uiAmountString || '0');
    } catch (error) {
      // If account doesn't exist, balance is 0
      console.log('No token account found, balance = 0');
      return 0;
    }
  }
  
  /**
   * Check if service is properly configured
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check mint exists
      const mintInfo = await this.connection.getAccountInfo(this.xpMint);
      if (!mintInfo) {
        console.error('❌ XP Mint does not exist');
        return false;
      }
      
      // Check authority has SOL
      const balance = await this.connection.getBalance(this.mintAuthority.publicKey);
      if (balance < 0.01 * 1e9) {
        console.error('❌ Mint authority has insufficient SOL');
        return false;
      }
      
      console.log('✅ XP Minter health check passed');
      return true;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const xpMinter = new XPMinterService();