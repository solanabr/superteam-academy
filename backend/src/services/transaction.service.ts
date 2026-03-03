/**
 * Transaction Builder & Signing Service (Phase 2)
 *
 * Responsibility:
 * 1. Load Anchor program from IDL
 * 2. Build instructions for each operation
 * 3. Sign transactions with backend_signer keypair
 * 4. Return signed TX to frontend for user to submit
 *
 * ⚠️ Prerequisites:
 * - Anchor program already deployed to Devnet
 * - IDL at lib/anchor/academy.json
 * - backend/.env configured with:
 *   - ANCHOR_PROGRAM_ID
 *   - BACKEND_SIGNER_SECRET_KEY
 *   - XP_TOKEN_MINT
 *   - SOLANA_RPC_URL
 */

import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load IDL from file
const idlPath = path.join(__dirname, '../../../lib/anchor/academy.json')
let IDL: Record<string, unknown> | null
try {
  const idlContent = fs.readFileSync(idlPath, 'utf-8')
  IDL = JSON.parse(idlContent) as Record<string, unknown>
} catch (error) {
  console.warn('⚠️ Failed to load IDL from', idlPath, '- TX builder will fail')
  IDL = null
}

interface TransactionRequest {
  userId: string
  courseId: string
  lessonIndex: number
  xpAmount: number
}

interface SignedTransactionResponse {
  signedTx: string // Base64-encoded signed transaction
  blockhash: string
  backendSignature: string
}

export class TransactionService {
  private program: Program | null = null
  private backendSigner: Keypair | null = null
  private connection: Connection
  private programId: PublicKey

  constructor() {
    // Initialize connection
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    this.connection = new Connection(rpcUrl, 'confirmed')
    
    // Use a valid placeholder public key if ANCHOR_PROGRAM_ID is not set
    const programIdStr = process.env.ANCHOR_PROGRAM_ID || 'ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf'
    try {
      this.programId = new PublicKey(programIdStr)
    } catch (error) {
      console.warn('⚠️ Invalid ANCHOR_PROGRAM_ID in .env, using valid placeholder')
      this.programId = new PublicKey('ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf')
    }

    this.initialize()
  }

  private initialize() {
    // Load backend signer from env
    const signerSecret = process.env.BACKEND_SIGNER_SECRET_KEY
    if (!signerSecret) {
      console.warn('⚠️ BACKEND_SIGNER_SECRET_KEY not set. TX signing will fail.')
      return
    }

    try {
      const secretArray = JSON.parse(signerSecret)
      this.backendSigner = Keypair.fromSecretKey(new Uint8Array(secretArray))
      console.log('✅ Backend signer loaded:', this.backendSigner.publicKey.toBase58())
    } catch (error) {
      console.error('❌ Failed to load backend signer:', error)
      return
    }

    // Initialize Anchor program
    if (!IDL) {
      console.warn('⚠️ IDL not loaded, program initialization skipped')
      return
    }

    try {
      if (!this.backendSigner) {
        console.warn('⚠️ Backend signer not available, skipping program initialization')
        return
      }

      const wallet = new Wallet(this.backendSigner)
      const provider = new AnchorProvider(this.connection, wallet, { commitment: 'confirmed' })
      // Anchor v0.29 API: new Program(idl, programId, provider)
      this.program = new Program(IDL as Parameters<typeof Program>[0], this.programId, provider)
      console.log('✅ Program initialized:', this.programId.toBase58())
    } catch (error) {
      console.error('❌ Failed to initialize program:', error)
    }
  }

  /**
   * Sign a transaction with backend keypair
   */
  private signTransaction(tx: Transaction): string {
    if (!this.backendSigner) {
      throw new Error('Backend signer not initialized')
    }

    tx.sign(this.backendSigner)
    return tx.serialize().toString('base64')
  }

  /**
   * Helper: Get PDA
   */
  private getPda(seeds: (Buffer | Uint8Array)[]): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(seeds, this.programId)
    return pda
  }

  /**
   * Build complete_lesson instruction
   *
   * Calls: program.methods.completeLesson(lessonIndex, xpAmount)
   */
  private async buildCompleteLessonInstruction(
    userId: string,
    courseId: string,
    lessonIndex: number,
    xpAmount: number
  ): Promise<TransactionInstruction> {
    if (!this.program || !this.backendSigner) {
      throw new Error('Program or backend signer not initialized')
    }

    const userKey = new PublicKey(userId)
    const config = this.getPda([Buffer.from('config')])
    const course = this.getPda([Buffer.from('course'), Buffer.from(courseId)])
    const enrollment = this.getPda([Buffer.from('enrollment'), Buffer.from(courseId), userKey.toBuffer()])
    const learner = this.getPda([Buffer.from('learner'), userKey.toBuffer()])
    const xpMintStr = process.env.XP_TOKEN_MINT || 'ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf'
    let xpMint: PublicKey
    try {
      xpMint = new PublicKey(xpMintStr)
    } catch (error) {
      console.warn('⚠️ Invalid XP_TOKEN_MINT in .env, using placeholder')
      xpMint = new PublicKey('ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf')
    }
    const userXpAta = await getAssociatedTokenAddress(xpMint, userKey)

    try {
      return await this.program.methods
        .completeLesson(lessonIndex, xpAmount)
        .accounts({
          config,
          course,
          enrollment,
          learner,
          xpMint,
          userXpAta,
          user: userKey,
          backendSigner: this.backendSigner.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction()
    } catch (error) {
      console.error('Failed to build completeLessoninstruction:', error)
      throw new Error(`Failed to build complete_lesson instruction: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Build enroll instruction
   */
  private async buildEnrollInstruction(userId: string, courseId: string): Promise<TransactionInstruction> {
    if (!this.program) {
      throw new Error('Program not initialized')
    }

    const userKey = new PublicKey(userId)
    const course = this.getPda([Buffer.from('course'), Buffer.from(courseId)])
    const learner = this.getPda([Buffer.from('learner'), userKey.toBuffer()])
    const enrollment = this.getPda([Buffer.from('enrollment'), Buffer.from(courseId), userKey.toBuffer()])

    try {
      return await this.program.methods
        .enroll(courseId)
        .accounts({
          enrollment,
          course,
          learner,
          user: userKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction()
    } catch (error) {
      console.error('Failed to build enroll instruction:', error)
      throw new Error(`Failed to build enroll instruction: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Build finalize_course instruction
   */
  private async buildFinalizeCourseInstruction(userId: string, courseId: string): Promise<TransactionInstruction> {
    if (!this.program) {
      throw new Error('Program not initialized')
    }

    const userKey = new PublicKey(userId)
    const config = this.getPda([Buffer.from('config')])
    const course = this.getPda([Buffer.from('course'), Buffer.from(courseId)])
    const learner = this.getPda([Buffer.from('learner'), userKey.toBuffer()])
    const enrollment = this.getPda([Buffer.from('enrollment'), Buffer.from(courseId), userKey.toBuffer()])

    try {
      return await this.program.methods
        .finalizeCourse(courseId)
        .accounts({
          config,
          course,
          learner,
          enrollment,
          user: userKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction()
    } catch (error) {
      console.error('Failed to build finalize_course instruction:', error)
      throw new Error(`Failed to build finalize_course instruction: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Public API: Complete lesson (called from HTTP endpoint)
   */
  async completeLessonTX(req: TransactionRequest): Promise<SignedTransactionResponse> {
    if (!this.connection || !this.backendSigner) {
      throw new Error('Transaction service not initialized')
    }

    try {
      // 1. Build instruction
      const instruction = await this.buildCompleteLessonInstruction(
        req.userId,
        req.courseId,
        req.lessonIndex,
        req.xpAmount
      )

      // 2. Get blockhash
      const { blockhash } = await this.connection.getLatestBlockhash()

      // 3. Create transaction
      const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: new PublicKey(req.userId),
      }).add(instruction)

      // 4. Sign with backend
      const signedTxBase64 = this.signTransaction(tx)

      return {
        signedTx: signedTxBase64,
        blockhash,
        backendSignature: this.backendSigner.publicKey.toBase58(),
      }
    } catch (error) {
      console.error('Failed to build complete_lesson TX:', error)
      throw error
    }
  }

  /**
   * Public API: Enroll in course
   */
  async enrollTX(userId: string, courseId: string): Promise<SignedTransactionResponse> {
    if (!this.connection || !this.backendSigner) {
      throw new Error('Transaction service not initialized')
    }

    try {
      const instruction = await this.buildEnrollInstruction(userId, courseId)
      const { blockhash } = await this.connection.getLatestBlockhash()

      const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: new PublicKey(userId),
      }).add(instruction)

      const signedTxBase64 = this.signTransaction(tx)

      return {
        signedTx: signedTxBase64,
        blockhash,
        backendSignature: this.backendSigner.publicKey.toBase58(),
      }
    } catch (error) {
      console.error('Failed to build enroll TX:', error)
      throw error
    }
  }

  /**
   * Public API: Finalize course
   */
  async finalizeCourseT(userId: string, courseId: string): Promise<SignedTransactionResponse> {
    if (!this.connection || !this.backendSigner) {
      throw new Error('Transaction service not initialized')
    }

    try {
      const instruction = await this.buildFinalizeCourseInstruction(userId, courseId)
      const { blockhash } = await this.connection.getLatestBlockhash()

      const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: new PublicKey(userId),
      }).add(instruction)

      const signedTxBase64 = this.signTransaction(tx)

      return {
        signedTx: signedTxBase64,
        blockhash,
        backendSignature: this.backendSigner.publicKey.toBase58(),
      }
    } catch (error) {
      console.error('Failed to build finalize_course TX:', error)
      throw error
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.program !== null && this.backendSigner !== null
  }
}

// Singleton export
export const transactionService = new TransactionService()
