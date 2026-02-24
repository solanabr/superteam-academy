import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/admin";
import { getBackendProgram } from "@/lib/solana/backend-signer";
import { findConfigPDA, findCoursePDA } from "@/lib/solana/pda";
import {
  parseAnchorError,
  isClientError,
} from "@/lib/solana/anchor-errors";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await params;
    const body = await req.json();
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { isActive, xpPerLesson, creatorRewardXp, minCompletionsForReward } =
      body as {
        isActive?: boolean;
        xpPerLesson?: number;
        creatorRewardXp?: number;
        minCompletionsForReward?: number;
      };

    const { program, signer } = getBackendProgram();
    const [configPDA] = findConfigPDA();
    const [coursePDA] = findCoursePDA(courseId);

    const tx = await program.methods
      .updateCourse({
        newContentTxId: null,
        newIsActive: isActive !== undefined ? isActive : null,
        newXpPerLesson: xpPerLesson !== undefined ? xpPerLesson : null,
        newCreatorRewardXp:
          creatorRewardXp !== undefined ? creatorRewardXp : null,
        newMinCompletionsForReward:
          minCompletionsForReward !== undefined
            ? minCompletionsForReward
            : null,
      })
      .accounts({
        config: configPDA,
        course: coursePDA,
        authority: signer.publicKey,
      })
      .signers([signer])
      .rpc();

    return NextResponse.json({ signature: tx, courseId });
  } catch (err: unknown) {
    const anchor = parseAnchorError(err);
    if (anchor && isClientError(anchor.code)) {
      return NextResponse.json(
        { error: anchor.message, code: anchor.name },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Transaction failed";
    console.error("Admin course PATCH error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
