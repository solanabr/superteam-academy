import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, PDA_SEEDS } from "./idl";

const programId = new PublicKey(PROGRAM_ID);

export function findConfigPDA(): [PublicKey, number] {
	return PublicKey.findProgramAddressSync([...PDA_SEEDS.config], programId);
}

export function findCoursePDA(courseId: string): [PublicKey, number] {
	return PublicKey.findProgramAddressSync([...PDA_SEEDS.course(courseId)], programId);
}

export function findEnrollmentPDA(courseId: string, learner: PublicKey): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[...PDA_SEEDS.enrollment(courseId, learner)],
		programId
	);
}

export function findMinterRolePDA(minterKey: PublicKey): [PublicKey, number] {
	return PublicKey.findProgramAddressSync([...PDA_SEEDS.minter(minterKey)], programId);
}

export function findAchievementTypePDA(achievementId: string): [PublicKey, number] {
	return PublicKey.findProgramAddressSync([...PDA_SEEDS.achievement(achievementId)], programId);
}

export function findAchievementReceiptPDA(
	achievementId: string,
	recipient: PublicKey
): [PublicKey, number] {
	return PublicKey.findProgramAddressSync(
		[...PDA_SEEDS.achievementReceipt(achievementId, recipient)],
		programId
	);
}
