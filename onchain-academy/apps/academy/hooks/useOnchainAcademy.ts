import { BN } from '@coral-xyz/anchor'
import { createCollectionV2, mplCore } from '@metaplex-foundation/mpl-core'
import { generateSigner, keypairIdentity } from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
} from '@metaplex-foundation/umi-web3js-adapters'
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAnchorProgram } from './useAnchorProgram'

export const PROGRAM_ID = new PublicKey(
  'ACAD7Gj75zuQiBAtar5y6rPiUrMjPstFyUeTBZk3QpsB',
)
export const MPL_CORE_PROGRAM_ID = new PublicKey(
  'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d',
)

// PDA Utils
export const getConfigPda = () =>
  PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID)[0]
export const getCoursePda = (courseId: string) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('course'), Buffer.from(courseId)],
    PROGRAM_ID,
  )[0]
export const getEnrollmentPda = (courseId: string, learner: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('enrollment'), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID,
  )[0]
export const getMinterRolePda = (minter: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('minter'), minter.toBuffer()],
    PROGRAM_ID,
  )[0]
export const getAchievementTypePda = (achievementId: string) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('achievement'), Buffer.from(achievementId)],
    PROGRAM_ID,
  )[0]
export const getReceiptPda = (achievementId: string, recipient: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [
      Buffer.from('achievement_receipt'),
      Buffer.from(achievementId),
      recipient.toBuffer(),
    ],
    PROGRAM_ID,
  )[0]

export const useOnchainAcademy = () => {
  const program = useAnchorProgram()
  const { connection } = useConnection()
  const { publicKey: walletPubkey } = useWallet()
  const queryClient = useQueryClient()

  // Helper to wait for transaction confirmation
  const confirmTx = async (signature: string) => {
    const latestBlockhash = await connection.getLatestBlockhash()
    await connection.confirmTransaction({
      signature,
      ...latestBlockhash,
    })
    return signature
  }

  // --- Queries ---
  const getConfig = useQuery({
    queryKey: ['onchain-config'],
    queryFn: () => program.account.config.fetch(getConfigPda()),
  })

  // --- External Methods (Learner / Wallet signer) ---

  const enroll = useMutation({
    mutationFn: async ({
      courseId,
      prereqCoursePda,
      prereqEnrollmentPda,
    }: {
      courseId: string
      prereqCoursePda?: PublicKey
      prereqEnrollmentPda?: PublicKey
    }) => {
      if (!walletPubkey) throw new Error('Wallet not connected')
      const coursePda = getCoursePda(courseId)
      const enrollmentPda = getEnrollmentPda(courseId, walletPubkey)

      const builder = program.methods.enroll(courseId).accountsPartial({
        course: coursePda,
        enrollment: enrollmentPda,
        learner: walletPubkey,
        systemProgram: SystemProgram.programId,
      })

      if (prereqCoursePda && prereqEnrollmentPda) {
        builder.remainingAccounts([
          { pubkey: prereqCoursePda, isWritable: false, isSigner: false },
          { pubkey: prereqEnrollmentPda, isWritable: false, isSigner: false },
        ])
      }

      const tx = await builder.rpc()
      return confirmTx(tx)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['enrollment', variables.courseId],
      })
    },
  })

  const closeEnrollment = useMutation({
    mutationFn: async ({ courseId }: { courseId: string }) => {
      if (!walletPubkey) throw new Error('Wallet not connected')
      const coursePda = getCoursePda(courseId)
      const enrollmentPda = getEnrollmentPda(courseId, walletPubkey)

      const tx = await program.methods
        .closeEnrollment()
        .accountsPartial({
          course: coursePda,
          enrollment: enrollmentPda,
          learner: walletPubkey,
        })
        .rpc()
      return confirmTx(tx)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['enrollment', variables.courseId],
      })
    },
  })

  // --- Internal/Backend/Admin Methods (Requires special signers / roles) ---
  // Using walletPubkey as the generic 'authority' or 'backendSigner' assumes the connected wallet has permission

  const completeLesson = useMutation({
    mutationFn: async ({
      courseId,
      learnerPubkey,
      lessonIndex,
    }: {
      courseId: string
      learnerPubkey: PublicKey
      lessonIndex: number
    }) => {
      if (!walletPubkey) throw new Error('Wallet not connected')
      const configPda = getConfigPda()
      const coursePda = getCoursePda(courseId)
      const enrollmentPda = getEnrollmentPda(courseId, learnerPubkey)
      const config = await program.account.config.fetch(configPda)
      const learnerXpAta = getAssociatedTokenAddressSync(
        config.xpMint,
        learnerPubkey,
        false,
        TOKEN_2022_PROGRAM_ID,
      )

      const tx = await program.methods
        .completeLesson(lessonIndex)
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner: learnerPubkey,
          learnerTokenAccount: learnerXpAta,
          xpMint: config.xpMint,
          backendSigner: walletPubkey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc()

      return confirmTx(tx)
    },
  })

  const finalizeCourse = useMutation({
    mutationFn: async ({
      courseId,
      learnerPubkey,
      creatorPubkey,
    }: {
      courseId: string
      learnerPubkey: PublicKey
      creatorPubkey: PublicKey
    }) => {
      if (!walletPubkey) throw new Error('Wallet not connected')
      const configPda = getConfigPda()
      const config = await program.account.config.fetch(configPda)
      const coursePda = getCoursePda(courseId)
      const enrollmentPda = getEnrollmentPda(courseId, learnerPubkey)

      const learnerXpAta = getAssociatedTokenAddressSync(
        config.xpMint,
        learnerPubkey,
        false,
        TOKEN_2022_PROGRAM_ID,
      )
      const creatorXpAta = getAssociatedTokenAddressSync(
        config.xpMint,
        creatorPubkey,
        false,
        TOKEN_2022_PROGRAM_ID,
      )

      const tx = await program.methods
        .finalizeCourse()
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner: learnerPubkey,
          learnerTokenAccount: learnerXpAta,
          creatorTokenAccount: creatorXpAta,
          creator: creatorPubkey,
          xpMint: config.xpMint,
          backendSigner: walletPubkey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc()

      return confirmTx(tx)
    },
  })

  const issueCredential = useMutation({
    mutationFn: async ({
      courseId,
      learnerPubkey,
      credentialName,
      metadataUri,
      coursesCompleted,
      totalXp,
      trackCollectionPubkey,
    }: {
      courseId: string
      learnerPubkey: PublicKey
      credentialName: string
      metadataUri: string
      coursesCompleted: number
      totalXp: number
      trackCollectionPubkey: PublicKey
    }) => {
      if (!walletPubkey) throw new Error('Wallet not connected')
      const configPda = getConfigPda()
      const coursePda = getCoursePda(courseId)
      const enrollmentPda = getEnrollmentPda(courseId, learnerPubkey)
      const credentialAsset = Keypair.generate()

      const tx = await program.methods
        .issueCredential(
          credentialName,
          metadataUri,
          coursesCompleted,
          new BN(totalXp),
        )
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner: learnerPubkey,
          credentialAsset: credentialAsset.publicKey,
          trackCollection: trackCollectionPubkey,
          payer: walletPubkey,
          backendSigner: walletPubkey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([credentialAsset])
        .rpc()

      return confirmTx(tx)
    },
  })

  const upgradeCredential = useMutation({
    mutationFn: async ({
      courseId,
      learnerPubkey,
      existingAssetPubkey,
      newName,
      newUri,
      coursesCompleted,
      totalXp,
      trackCollectionPubkey,
    }: {
      courseId: string
      learnerPubkey: PublicKey
      existingAssetPubkey: PublicKey
      newName: string
      newUri: string
      coursesCompleted: number
      totalXp: number
      trackCollectionPubkey: PublicKey
    }) => {
      if (!walletPubkey) throw new Error('Wallet not connected')
      const configPda = getConfigPda()
      const coursePda = getCoursePda(courseId)
      const enrollmentPda = getEnrollmentPda(courseId, learnerPubkey)

      const tx = await program.methods
        .upgradeCredential(newName, newUri, coursesCompleted, new BN(totalXp))
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner: learnerPubkey,
          credentialAsset: existingAssetPubkey,
          trackCollection: trackCollectionPubkey,
          payer: walletPubkey,
          backendSigner: walletPubkey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      return confirmTx(tx)
    },
  })

  const createCourse = useMutation({
    mutationFn: async ({
      courseId,
      contentTxId,
      lessonCount,
      difficulty,
      xpPerLesson,
      trackId,
      trackLevel,
      prerequisite,
      creatorRewardXp,
      minCompletionsForReward,
    }: {
      courseId: string
      contentTxId: number[]
      lessonCount: number
      difficulty: number
      xpPerLesson: number
      trackId: number
      trackLevel: number
      prerequisite: PublicKey | null
      creatorRewardXp: number
      minCompletionsForReward: number
    }) => {
      if (!walletPubkey) throw new Error('Wallet not connected')
      const coursePda = getCoursePda(courseId)
      const configPda = getConfigPda()

      const tx = await program.methods
        .createCourse({
          courseId,
          creator: walletPubkey,
          contentTxId,
          lessonCount,
          difficulty,
          xpPerLesson,
          trackId,
          trackLevel,
          prerequisite,
          creatorRewardXp,
          minCompletionsForReward,
        })
        .accountsPartial({
          course: coursePda,
          config: configPda,
          authority: walletPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      return confirmTx(tx)
    },
  })

  const awardAchievement = useMutation({
    mutationFn: async ({
      achievementId,
      recipientPubkey,
      collectionPubkey,
    }: {
      achievementId: string
      recipientPubkey: PublicKey
      collectionPubkey: PublicKey
    }) => {
      if (!walletPubkey) throw new Error('Wallet not connected')
      const configPda = getConfigPda()
      const config = await program.account.config.fetch(configPda)
      const achievementTypePda = getAchievementTypePda(achievementId)
      const receiptPda = getReceiptPda(achievementId, recipientPubkey)
      const minterRolePda = getMinterRolePda(walletPubkey)
      const asset = Keypair.generate()

      const recipientXpAta = getAssociatedTokenAddressSync(
        config.xpMint,
        recipientPubkey,
        false,
        TOKEN_2022_PROGRAM_ID,
      )

      const tx = await program.methods
        .awardAchievement()
        .accountsPartial({
          config: configPda,
          achievementType: achievementTypePda,
          achievementReceipt: receiptPda,
          minterRole: minterRolePda,
          asset: asset.publicKey,
          collection: collectionPubkey,
          recipient: recipientPubkey,
          recipientTokenAccount: recipientXpAta,
          xpMint: config.xpMint,
          payer: walletPubkey,
          minter: walletPubkey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([asset])
        .rpc()

      return confirmTx(tx)
    },
  })

  const rewardXp = useMutation({
    mutationFn: async ({
      amount,
      recipient,
      label,
    }: {
      amount: number
      recipient: PublicKey
      label: string
    }) => {
      if (!walletPubkey) throw new Error('Wallet not connected')
      const configPda = getConfigPda()
      const config = await program.account.config.fetch(configPda)
      const minterRolePda = getMinterRolePda(walletPubkey)
      const recipientXpAta = getAssociatedTokenAddressSync(
        config.xpMint,
        recipient,
        false,
        TOKEN_2022_PROGRAM_ID,
      )

      const tx = await program.methods
        .rewardXp(new BN(amount), label)
        .accountsPartial({
          config: configPda,
          minterRole: minterRolePda,
          xpMint: config.xpMint,
          recipientTokenAccount: recipientXpAta,
          minter: walletPubkey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc()

      return confirmTx(tx)
    },
  })

  const initialize = useMutation({
    mutationFn: async ({
      authorityPubkey,
    }: {
      authorityPubkey?: PublicKey
    }) => {
      if (!walletPubkey) throw new Error('Wallet not connected')
      const authority = authorityPubkey ?? walletPubkey
      const configPda = getConfigPda()
      const xpMint = Keypair.generate()
      const backendMinterRolePda = getMinterRolePda(authority)

      const tx = await program.methods
        .initialize()
        .accountsPartial({
          config: configPda,
          xpMint: xpMint.publicKey,
          authority,
          backendMinterRole: backendMinterRolePda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([xpMint])
        .rpc()

      return confirmTx(tx)
    },
  })

  const updateConfig = useMutation({
    mutationFn: async ({
      newBackendSigner,
      oldMinterRolePda,
    }: {
      newBackendSigner: PublicKey
      oldMinterRolePda?: PublicKey
    }) => {
      if (!walletPubkey) throw new Error('Wallet not connected')
      const configPda = getConfigPda()

      const builder = program.methods
        .updateConfig({ newBackendSigner })
        .accountsPartial({
          config: configPda,
          authority: walletPubkey,
        })

      if (oldMinterRolePda) {
        builder.remainingAccounts([
          { pubkey: oldMinterRolePda, isWritable: true, isSigner: false },
        ])
      }

      const tx = await builder.rpc()
      return confirmTx(tx)
    },
  })

  const updateCourse = useMutation({
    mutationFn: async ({
      courseId,
      newContentTxId,
      newIsActive,
      newXpPerLesson,
      newCreatorRewardXp,
      newMinCompletionsForReward,
    }: {
      courseId: string
      newContentTxId?: number[] | null
      newIsActive?: boolean | null
      newXpPerLesson?: number | null
      newCreatorRewardXp?: number | null
      newMinCompletionsForReward?: number | null
    }) => {
      if (!walletPubkey) throw new Error('Wallet not connected')
      const configPda = getConfigPda()
      const coursePda = getCoursePda(courseId)

      const tx = await program.methods
        .updateCourse({
          newContentTxId: newContentTxId ?? null,
          newIsActive: newIsActive ?? null,
          newXpPerLesson: newXpPerLesson ?? null,
          newCreatorRewardXp: newCreatorRewardXp ?? null,
          newMinCompletionsForReward: newMinCompletionsForReward ?? null,
        })
        .accountsPartial({
          config: configPda,
          course: coursePda,
          authority: walletPubkey,
        })
        .rpc()

      return confirmTx(tx)
    },
  })

  const createAchievementType = useMutation({
    mutationFn: async ({
      achievementId,
      name,
      metadataUri,
      maxSupply,
      xpReward,
      collectionPubkey,
    }: {
      achievementId: string
      name: string
      metadataUri: string
      maxSupply: number
      xpReward: number
      collectionPubkey: PublicKey
    }) => {
      if (!walletPubkey) throw new Error('Wallet not connected')
      const configPda = getConfigPda()
      const achievementTypePda = getAchievementTypePda(achievementId)

      const tx = await program.methods
        .createAchievementType({
          achievementId,
          name,
          metadataUri,
          maxSupply,
          xpReward,
        })
        .accountsPartial({
          config: configPda,
          achievementType: achievementTypePda,
          collection: collectionPubkey,
          authority: walletPubkey,
          payer: walletPubkey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      return confirmTx(tx)
    },
  })

  const deactivateAchievementType = useMutation({
    mutationFn: async ({ achievementId }: { achievementId: string }) => {
      if (!walletPubkey) throw new Error('Wallet not connected')
      const configPda = getConfigPda()
      const achievementTypePda = getAchievementTypePda(achievementId)

      const tx = await program.methods
        .deactivateAchievementType()
        .accountsPartial({
          config: configPda,
          achievementType: achievementTypePda,
          authority: walletPubkey,
        })
        .rpc()

      return confirmTx(tx)
    },
  })

  const createTrack = useMutation({
    mutationFn: async ({
      name,
      uri,
      walletAdapterKeypair,
    }: {
      name: string
      uri: string
      walletAdapterKeypair: Keypair
    }) => {
      const umi = createUmi(connection.rpcEndpoint)
        .use(mplCore())
        .use(keypairIdentity(fromWeb3JsKeypair(walletAdapterKeypair)))

      const collectionSigner = generateSigner(umi)
      const configPda = getConfigPda()

      const { signature } = await createCollectionV2(umi, {
        collection: collectionSigner,
        name,
        uri,
        updateAuthority: fromWeb3JsPublicKey(configPda),
      }).sendAndConfirm(umi)

      return {
        signature,
        collectionAddress: collectionSigner.publicKey.toString(),
      }
    },
  })

  return {
    getConfig,
    enroll,
    closeEnrollment,
    completeLesson,
    finalizeCourse,
    issueCredential,
    upgradeCredential,
    createCourse,
    awardAchievement,
    rewardXp,
    initialize,
    updateConfig,
    updateCourse,
    createAchievementType,
    deactivateAchievementType,
    createTrack,
  }
}
