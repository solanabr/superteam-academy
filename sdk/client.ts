import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import IDL from "./idl";
import { SuperteamAcademy } from "./types";

export const PROGRAM_ID = new PublicKey("Acad111111111111111111111111111111111111111");

export class SuperteamAcademyClient {
  program: Program<SuperteamAcademy>;
  provider: AnchorProvider;

  constructor(connection: Connection, wallet: Wallet) {
    this.provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    this.program = new Program(IDL, PROGRAM_ID, this.provider);
  }

  // ═══════════════════════════════════════════════════════════════
  // PDAs
  // ═══════════════════════════════════════════════════════════════

  getConfigPda(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_ID
    );
  }

  getCoursePda(courseId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("course"), Buffer.from(courseId)],
      PROGRAM_ID
    );
  }

  getLearnerProfilePda(learner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("learner"), learner.toBuffer()],
      PROGRAM_ID
    );
  }

  getEnrollmentPda(courseId: string, learner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
      PROGRAM_ID
    );
  }

  getCredentialPda(learner: PublicKey, trackId: number): [PublicKey, number] {
    const trackIdBuffer = Buffer.alloc(2);
    trackIdBuffer.writeUInt16LE(trackId, 0);
    return PublicKey.findProgramAddressSync(
      [Buffer.from("credential"), learner.toBuffer(), trackIdBuffer],
      PROGRAM_ID
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Platform Management
  // ═══════════════════════════════════════════════════════════════

  async initialize(maxDailyXp: number, maxAchievementXp: number): Promise<string> {
    const [configPda] = this.getConfigPda();
    
    const tx = await this.program.methods
      .initialize(maxDailyXp, maxAchievementXp)
      .accounts({
        authority: this.provider.wallet.publicKey,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async getConfig() {
    const [configPda] = this.getConfigPda();
    return this.program.account.config.fetch(configPda);
  }

  // ═══════════════════════════════════════════════════════════════
  // Learner
  // ═══════════════════════════════════════════════════════════════

  async initLearner(): Promise<string> {
    const [learnerProfilePda] = this.getLearnerProfilePda(this.provider.wallet.publicKey);
    
    const tx = await this.program.methods
      .initLearner()
      .accounts({
        learner: this.provider.wallet.publicKey,
        learnerProfile: learnerProfilePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async getLearnerProfile(learner?: PublicKey) {
    const target = learner || this.provider.wallet.publicKey;
    const [learnerProfilePda] = this.getLearnerProfilePda(target);
    return this.program.account.learnerProfile.fetch(learnerProfilePda);
  }

  // ═══════════════════════════════════════════════════════════════
  // Courses
  // ═══════════════════════════════════════════════════════════════

  async createCourse(params: {
    courseId: string;
    creator: PublicKey;
    authority?: PublicKey;
    contentTxId: number[];
    contentType: number;
    lessonCount: number;
    challengeCount: number;
    difficulty: number;
    xpTotal: number;
    trackId: number;
    trackLevel: number;
    prerequisite?: PublicKey;
    completionRewardXp: number;
    minCompletionsForReward: number;
  }): Promise<string> {
    const [coursePda] = this.getCoursePda(params.courseId);
    const [configPda] = this.getConfigPda();

    const tx = await this.program.methods
      .createCourse({
        courseId: params.courseId,
        creator: params.creator,
        authority: params.authority || params.creator,
        contentTxId: params.contentTxId,
        contentType: params.contentType,
        lessonCount: params.lessonCount,
        challengeCount: params.challengeCount,
        difficulty: params.difficulty,
        xpTotal: params.xpTotal,
        trackId: params.trackId,
        trackLevel: params.trackLevel,
        prerequisite: params.prerequisite || null,
        completionRewardXp: params.completionRewardXp,
        minCompletionsForReward: params.minCompletionsForReward,
      })
      .accounts({
        authority: this.provider.wallet.publicKey,
        config: configPda,
        course: coursePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async getCourse(courseId: string) {
    const [coursePda] = this.getCoursePda(courseId);
    return this.program.account.course.fetch(coursePda);
  }

  // ═══════════════════════════════════════════════════════════════
  // Enrollment
  // ═══════════════════════════════════════════════════════════════

  async enroll(courseId: string, prerequisiteEnrollment?: PublicKey): Promise<string> {
    const [coursePda] = this.getCoursePda(courseId);
    const [learnerProfilePda] = this.getLearnerProfilePda(this.provider.wallet.publicKey);
    const [enrollmentPda] = this.getEnrollmentPda(courseId, this.provider.wallet.publicKey);
    const [configPda] = this.getConfigPda();

    const tx = await this.program.methods
      .enroll()
      .accounts({
        learner: this.provider.wallet.publicKey,
        config: configPda,
        course: coursePda,
        learnerProfile: learnerProfilePda,
        prerequisiteEnrollment: prerequisiteEnrollment || null,
        enrollment: enrollmentPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async getEnrollment(courseId: string, learner?: PublicKey) {
    const target = learner || this.provider.wallet.publicKey;
    const [enrollmentPda] = this.getEnrollmentPda(courseId, target);
    return this.program.account.enrollment.fetch(enrollmentPda);
  }

  // ═══════════════════════════════════════════════════════════════
  // Events
  // ═══════════════════════════════════════════════════════════════

  onLessonCompleted(callback: (event: any) => void) {
    this.program.addEventListener("LessonCompleted", callback);
  }

  onCourseFinalized(callback: (event: any) => void) {
    this.program.addEventListener("CourseFinalized", callback);
  }

  onCredentialIssued(callback: (event: any) => void) {
    this.program.addEventListener("CredentialIssued", callback);
  }

  // ═══════════════════════════════════════════════════════════════
  // Utility Methods
  // ═══════════════════════════════════════════════════════════════

  calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100));
  }

  getTrackName(trackId: number): string {
    const tracks: Record<number, string> = {
      0: "Standalone",
      1: "Anchor Framework",
      2: "Rust for Solana",
      3: "DeFi Development",
      4: "Program Security",
    };
    return tracks[trackId] || "Unknown Track";
  }

  getDifficultyName(difficulty: number): string {
    const difficulties: Record<number, string> = {
      1: "Beginner",
      2: "Intermediate",
      3: "Advanced",
    };
    return difficulties[difficulty] || "Unknown";
  }
}

export default SuperteamAcademyClient;
