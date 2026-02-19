// app/src/app/api/issue-credential/route.ts
import { NextResponse } from "next/server";
import { getServerProgram, getBackendWallet } from "@/lib/server";
import { Keypair, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "@/lib/constants";
import { BN } from "@coral-xyz/anchor";

export async function POST(request: Request) {
  try {
    const { courseId, walletAddress, credentialName, metadataUri } = await request.json();
    
    const program = getServerProgram();
    const backendWallet = getBackendWallet();
    const learnerPubkey = new PublicKey(walletAddress);

    // Генерируем новый адрес для NFT (Credential Asset)
    // В реальном проде мы могли бы использовать детерминированный адрес, но рандом безопаснее для коллизий
    const credentialAsset = Keypair.generate();

    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
    const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], PROGRAM_ID);
    const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), learnerPubkey.toBuffer()], PROGRAM_ID);

    // Нам нужно знать Track ID (ID коллекции)
    // В реальном коде это нужно читать из аккаунта курса
    const courseAccount = await program.account.course.fetch(coursePda);
    
    // ВАЖНО: Мы предполагаем, что коллекция уже создана скриптом create-mock-track.ts
    // И ее адрес нам нужно знать. Для хакатона захардкодим адрес коллекции трека "Solana Basic"
    // Тебе нужно будет выполнить скрипт create-mock-track.ts и вставить сюда адрес
    // Пока оставим заглушку, но это место надо будет обновить
    const TRACK_COLLECTION_ADDRESS = new PublicKey("AvGWDqCTVmpb2q88tw2DxPCysmkpijTU47UdYqE1d8Vu"); // Пример из доки

    // Данные для метаданных
    // В идеале мы должны прочитать реальный прогресс из чейна, но для скорости передадим пока так
    const coursesCompleted = 1; 
    const totalXp = new BN(1000); 

    const tx = await program.methods
      .issueCredential(
        credentialName || "Solana Developer Certificate",
        metadataUri || "https://arweave.net/placeholder-cert",
        coursesCompleted,
        totalXp
      )
        .accountsPartial({
            config: configPda,
            course: coursePda,
            enrollment: enrollmentPda,
            learner: learnerPubkey,
            credentialAsset: credentialAsset.publicKey,
            trackCollection: TRACK_COLLECTION_ADDRESS,
            payer: backendWallet.publicKey,
            backendSigner: backendWallet.publicKey,
            mplCoreProgram: new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"),
            systemProgram: new PublicKey("11111111111111111111111111111111"),
        } as any)
        .signers([backendWallet.payer, credentialAsset])
        .rpc();

    return NextResponse.json({ 
      success: true, 
      txSignature: tx,
      assetId: credentialAsset.publicKey.toString() 
    });

  } catch (error: any) {
    console.error("API issue-credential error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}