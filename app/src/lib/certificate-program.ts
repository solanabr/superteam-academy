import { AnchorProvider, Program, web3, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { 
  ASSOCIATED_TOKEN_PROGRAM_ID, 
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync
} from '@solana/spl-token';
import { 
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  findMetadataPda
} from '@metaplex-foundation/js';
import type { LmsCertificates } from './types/lms_certificates';

export const PROGRAM_ID = new PublicKey('CertMintProgram111111111111111111111111111');

export class CertificateProgram {
  constructor(
    private program: Program<LmsCertificates>,
    private provider: AnchorProvider
  ) {}

  static async create(provider: AnchorProvider, idl: any): Promise<CertificateProgram> {
    const program = new Program(idl, PROGRAM_ID, provider);
    return new CertificateProgram(program, provider);
  }

  async initializeCourse(
    courseId: number,
    courseName: string,
    instructor: PublicKey
  ): Promise<string> {
    const [courseAccount] = this.getCoursePDA(courseId);

    const tx = await this.program.methods
      .initializeCourse(new BN(courseId), courseName, instructor)
      .accounts({
        course: courseAccount,
        instructor: instructor,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async mintCertificate(
    courseId: number,
    student: PublicKey,
    studentName: string,
    completionDate: Date = new Date()
  ): Promise<{
    signature: string;
    mint: PublicKey;
    tokenAccount: PublicKey;
    metadata: PublicKey;
  }> {
    const [courseAccount] = this.getCoursePDA(courseId);
    const [certificateAccount] = this.getCertificatePDA(courseId, student);
    
    // Generate new mint account
    const mint = web3.Keypair.generate();
    const tokenAccount = getAssociatedTokenAddressSync(mint.publicKey, student);
    const [metadata] = findMetadataPda(mint.publicKey);

    const completionTimestamp = new BN(Math.floor(completionDate.getTime() / 1000));

    const tx = await this.program.methods
      .mintCertificate(
        new BN(courseId),
        studentName,
        completionTimestamp
      )
      .accounts({
        course: courseAccount,
        certificate: certificateAccount,
        mint: mint.publicKey,
        tokenAccount: tokenAccount,
        metadata: metadata,
        student: student,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([mint])
      .rpc();

    return {
      signature: tx,
      mint: mint.publicKey,
      tokenAccount,
      metadata
    };
  }

  async verifyCertificate(
    courseId: number,
    student: PublicKey
  ): Promise<any> {
    const [certificateAccount] = this.getCertificatePDA(courseId, student);

    try {
      const result = await this.program.methods
        .verifyCertificate(new BN(courseId))
        .accounts({
          certificate: certificateAccount,
          student: student,
        })
        .view();

      return result;
    } catch (error) {
      console.error('Certificate verification failed:', error);
      return null;
    }
  }

  async getCourse(courseId: number): Promise<any> {
    const [courseAccount] = this.getCoursePDA(courseId);
    
    try {
      const course = await this.program.account.course.fetch(courseAccount);
      return course;
    } catch (error) {
      console.error('Failed to fetch course:', error);
      return null;
    }
  }

  async getCertificate(courseId: number, student: PublicKey): Promise<any> {
    const [certificateAccount] = this.getCertificatePDA(courseId, student);
    
    try {
      const certificate = await this.program.account.certificate.fetch(certificateAccount);
      return certificate;
    } catch (error) {
      console.error('Failed to fetch certificate:', error);
      return null;
    }
  }

  getCoursePDA(courseId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('course'),
        Buffer.from(courseId.toString().padStart(8, '0'), 'hex')
      ],
      PROGRAM_ID
    );
  }

  getCertificatePDA(courseId: number, student: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('certificate'),
        Buffer.from(courseId.toString().padStart(8, '0'), 'hex'),
        student.toBuffer()
      ],
      PROGRAM_ID
    );
  }
}

// Helper function to create certificate metadata URI
export function createCertificateMetadata(
  courseId: number,
  courseName: string,
  studentName: string,
  completionDate: Date,
  mint: PublicKey
) {
  return {
    name: `Certificate: ${courseName}`,
    description: `Certificate of completion for ${courseName} course by ${studentName}. Completed on ${completionDate.toLocaleDateString()}.`,
    image: `https://api.superteam-brazil-lms.com/certificates/${courseId}/${mint.toString()}/image`,
    attributes: [
      {
        trait_type: 'Course ID',
        value: courseId.toString()
      },
      {
        trait_type: 'Course Name',
        value: courseName
      },
      {
        trait_type: 'Student Name',
        value: studentName
      },
      {
        trait_type: 'Completion Date',
        value: completionDate.toISOString()
      },
      {
        trait_type: 'Certificate Type',
        value: 'Course Completion'
      }
    ],
    properties: {
      category: 'Education',
      creators: [
        {
          address: 'SuperteamBrazilLMS',
          share: 100
        }
      ]
    }
  };
}