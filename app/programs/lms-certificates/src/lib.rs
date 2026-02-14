use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
        Metadata,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};

declare_id!("CertMintProgram111111111111111111111111111");

#[program]
pub mod lms_certificates {
    use super::*;

    pub fn initialize_course(
        ctx: Context<InitializeCourse>,
        course_id: u64,
        course_name: String,
        instructor: Pubkey,
    ) -> Result<()> {
        let course = &mut ctx.accounts.course;
        course.course_id = course_id;
        course.course_name = course_name;
        course.instructor = instructor;
        course.total_students = 0;
        course.bump = ctx.bumps.course;
        Ok(())
    }

    pub fn mint_certificate(
        ctx: Context<MintCertificate>,
        course_id: u64,
        student_name: String,
        completion_date: i64,
    ) -> Result<()> {
        let course = &mut ctx.accounts.course;
        
        // Verify course exists
        require!(course.course_id == course_id, ErrorCode::InvalidCourse);
        
        // Create certificate metadata
        let certificate_name = format!("Certificate: {}", course.course_name);
        let certificate_description = format!(
            "Certificate of completion for {} course by {}. Completed on {}.",
            course.course_name,
            student_name,
            completion_date
        );
        let certificate_uri = format!(
            "https://api.superteam-brazil-lms.com/certificates/{}/{}",
            course_id,
            ctx.accounts.mint.key()
        );

        // Mint NFT to student
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.course.to_account_info(),
        };
        
        let course_seeds = &[
            b"course",
            &course_id.to_le_bytes(),
            &[course.bump],
        ];
        let signer = &[&course_seeds[..]];
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        mint_to(cpi_ctx, 1)?;

        // Create metadata
        let data_v2 = DataV2 {
            name: certificate_name,
            symbol: "CERT".to_string(),
            uri: certificate_uri,
            seller_fee_basis_points: 0,
            creators: Some(vec![mpl_token_metadata::types::Creator {
                address: course.instructor,
                verified: false,
                share: 100,
            }]),
            collection: None,
            uses: None,
        };

        let metadata_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                payer: ctx.accounts.student.to_account_info(),
                update_authority: ctx.accounts.course.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                metadata: ctx.accounts.metadata.to_account_info(),
                mint_authority: ctx.accounts.course.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            signer,
        );

        create_metadata_accounts_v3(metadata_ctx, data_v2, false, true, None)?;

        // Update course stats
        course.total_students += 1;

        // Create certificate record
        let certificate = &mut ctx.accounts.certificate;
        certificate.mint = ctx.accounts.mint.key();
        certificate.student = ctx.accounts.student.key();
        certificate.course_id = course_id;
        certificate.student_name = student_name;
        certificate.completion_date = completion_date;
        certificate.bump = ctx.bumps.certificate;

        Ok(())
    }

    pub fn verify_certificate(
        ctx: Context<VerifyCertificate>,
        course_id: u64,
    ) -> Result<CertificateInfo> {
        let certificate = &ctx.accounts.certificate;
        
        Ok(CertificateInfo {
            mint: certificate.mint,
            student: certificate.student,
            course_id: certificate.course_id,
            student_name: certificate.student_name.clone(),
            completion_date: certificate.completion_date,
            is_valid: true,
        })
    }
}

#[derive(Accounts)]
#[instruction(course_id: u64)]
pub struct InitializeCourse<'info> {
    #[account(
        init,
        payer = instructor,
        space = Course::LEN,
        seeds = [b"course", &course_id.to_le_bytes()],
        bump
    )]
    pub course: Account<'info, Course>,
    
    #[account(mut)]
    pub instructor: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(course_id: u64)]
pub struct MintCertificate<'info> {
    #[account(
        mut,
        seeds = [b"course", &course_id.to_le_bytes()],
        bump = course.bump
    )]
    pub course: Account<'info, Course>,

    #[account(
        init,
        payer = student,
        space = Certificate::LEN,
        seeds = [b"certificate", &course_id.to_le_bytes(), student.key().as_ref()],
        bump
    )]
    pub certificate: Account<'info, Certificate>,

    #[account(
        init,
        payer = student,
        mint::decimals = 0,
        mint::authority = course,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = student,
        associated_token::mint = mint,
        associated_token::authority = student,
    )]
    pub token_account: Account<'info, TokenAccount>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub student: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_metadata_program: Program<'info, Metadata>,
}

#[derive(Accounts)]
#[instruction(course_id: u64)]
pub struct VerifyCertificate<'info> {
    #[account(
        seeds = [b"certificate", &course_id.to_le_bytes(), student.key().as_ref()],
        bump = certificate.bump
    )]
    pub certificate: Account<'info, Certificate>,
    
    /// CHECK: This is not dangerous because we only use it as a seed
    pub student: UncheckedAccount<'info>,
}

#[account]
pub struct Course {
    pub course_id: u64,
    pub course_name: String,
    pub instructor: Pubkey,
    pub total_students: u64,
    pub bump: u8,
}

impl Course {
    const LEN: usize = 8 + // discriminator
        8 + // course_id
        (4 + 32) + // course_name (max 32 chars)
        32 + // instructor
        8 + // total_students
        1; // bump
}

#[account]
pub struct Certificate {
    pub mint: Pubkey,
    pub student: Pubkey,
    pub course_id: u64,
    pub student_name: String,
    pub completion_date: i64,
    pub bump: u8,
}

impl Certificate {
    const LEN: usize = 8 + // discriminator
        32 + // mint
        32 + // student
        8 + // course_id
        (4 + 64) + // student_name (max 64 chars)
        8 + // completion_date
        1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CertificateInfo {
    pub mint: Pubkey,
    pub student: Pubkey,
    pub course_id: u64,
    pub student_name: String,
    pub completion_date: i64,
    pub is_valid: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid course ID")]
    InvalidCourse,
}