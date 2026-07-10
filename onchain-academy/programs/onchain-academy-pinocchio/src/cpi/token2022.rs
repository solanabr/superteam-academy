//! Hand-rolled Token-2022 instructions (no spl crates on-chain).
//!
//! Wire formats verified against spl-token-2022 5.0.2 `TokenInstruction::pack`
//! and byte-compared to the real builders in `tests/discriminator_parity.rs`:
//!
//! * `MintTo`                        = `[7, amount: u64 LE]`
//! * `InitializeMint2`               = `[20, decimals, mint_authority(32), freeze tag(0)]`
//! * `InitializeNonTransferableMint` = `[32]`
//! * `InitializePermanentDelegate`   = `[35, delegate(32)]`
//! * `MetadataPointerExtension`      = `[39, 0=Initialize, authority(32), metadata(32)]`
//!   (`OptionalNonZeroPubkey` = raw 32 bytes, all-zero = None)

use pinocchio::{
    cpi::{invoke, invoke_signed, Signer},
    instruction::{InstructionAccount, InstructionView},
    AccountView, Address, ProgramResult,
};

use crate::consts::TOKEN_2022_ID;

/// Token-2022 `Mint` with NonTransferable + PermanentDelegate +
/// MetadataPointer extensions: 165 base padding + 1 account-type byte +
/// (2+2+0) + (2+2+32) + (2+2+64) TLV entries. Pinned against
/// `ExtensionType::try_calculate_account_len::<Mint>` in the parity tests.
pub const XP_MINT_SPACE: usize = 274;

pub const INIT_NON_TRANSFERABLE_DATA: [u8; 1] = [32];

pub fn init_permanent_delegate_data(delegate: &Address) -> [u8; 33] {
    let mut data = [0u8; 33];
    data[0] = 35;
    data[1..33].copy_from_slice(delegate.as_array());
    data
}

pub fn init_metadata_pointer_data(authority: &Address, metadata: &Address) -> [u8; 66] {
    let mut data = [0u8; 66];
    data[0] = 39;
    data[1] = 0; // MetadataPointerInstruction::Initialize
    data[2..34].copy_from_slice(authority.as_array());
    data[34..66].copy_from_slice(metadata.as_array());
    data
}

/// `initialize_mint2(decimals = 0, mint_authority, freeze_authority = None)`.
pub fn init_mint2_data(mint_authority: &Address) -> [u8; 35] {
    let mut data = [0u8; 35];
    data[0] = 20;
    data[1] = 0; // decimals
    data[2..34].copy_from_slice(mint_authority.as_array());
    data[34] = 0; // freeze_authority: COption::None
    data
}

pub fn mint_to_data(amount: u64) -> [u8; 9] {
    let mut data = [0u8; 9];
    data[0] = 7;
    data[1..9].copy_from_slice(&amount.to_le_bytes());
    data
}

#[inline(always)]
fn mint_ix(mint: &AccountView, data: &[u8]) -> ProgramResult {
    let accounts = [InstructionAccount::writable(mint.address())];
    let ix = InstructionView {
        program_id: &TOKEN_2022_ID,
        accounts: &accounts,
        data,
    };
    invoke::<1, _>(&ix, &[mint])
}

pub fn init_non_transferable(mint: &AccountView) -> ProgramResult {
    mint_ix(mint, &INIT_NON_TRANSFERABLE_DATA)
}

pub fn init_permanent_delegate(mint: &AccountView, delegate: &Address) -> ProgramResult {
    mint_ix(mint, &init_permanent_delegate_data(delegate))
}

pub fn init_metadata_pointer(
    mint: &AccountView,
    authority: &Address,
    metadata: &Address,
) -> ProgramResult {
    mint_ix(mint, &init_metadata_pointer_data(authority, metadata))
}

pub fn init_mint2(mint: &AccountView, mint_authority: &Address) -> ProgramResult {
    mint_ix(mint, &init_mint2_data(mint_authority))
}

/// `mint_to` signed by the Config PDA (the mint authority).
/// Metas: `[mint(w), destination(w), authority(ro, signer)]`.
pub fn mint_to_signed(
    mint: &AccountView,
    destination: &AccountView,
    config: &AccountView,
    amount: u64,
    config_signer: &Signer,
) -> ProgramResult {
    let data = mint_to_data(amount);
    let accounts = [
        InstructionAccount::writable(mint.address()),
        InstructionAccount::writable(destination.address()),
        InstructionAccount::readonly_signer(config.address()),
    ];
    let ix = InstructionView {
        program_id: &TOKEN_2022_ID,
        accounts: &accounts,
        data: &data,
    };
    invoke_signed::<3, _>(
        &ix,
        &[mint, destination, config],
        core::slice::from_ref(config_signer),
    )
}
