//! Hand-rolled Metaplex Core CPIs (no mpl-core crate on-chain).
//!
//! Wire formats and account-meta orders verified against the generated
//! mpl-core 0.9.1 client source and byte-compared to the real `*CpiBuilder`
//! outputs in `tests/discriminator_parity.rs`:
//!
//! * `CreateV2`           = disc 20, args `{data_state, name, uri, plugins, external}`
//! * `CreateCollectionV2` = disc 21, args `{name, uri, plugins, external}`
//! * `UpdateV1`           = disc 15, args `{new_name?, new_uri?, new_update_authority?}`
//! * `UpdatePluginV1`     = disc  6, args `{plugin}`
//!
//! `Plugin` variant indices: PermanentFreezeDelegate = 5, Attributes = 6.
//! `PluginAuthority::UpdateAuthority` = 2. `DataState::AccountState` = 0.
//! Optional accounts a builder leaves unset become read-only references to the
//! mpl-core program id itself — the account views pass `mpl_program` in those
//! slots, exactly like the generated Cpi structs.

use pinocchio::{
    cpi::{invoke_signed, Signer},
    instruction::{InstructionAccount, InstructionView},
    AccountView, ProgramResult,
};

use crate::consts::MPL_CORE_ID;
use crate::events::BorshWriter;

/// One `Attribute { key, value }` for an `Attributes` plugin.
pub struct Attr<'a> {
    pub key: &'a [u8],
    pub value: &'a [u8],
}

/// Renders `v` as decimal ASCII (what Anchor's `.to_string()` produced).
pub fn itoa_u64(buf: &mut [u8; 20], mut v: u64) -> &[u8] {
    let mut i = buf.len();
    loop {
        i -= 1;
        buf[i] = b'0' + (v % 10) as u8;
        v /= 10;
        if v == 0 {
            break;
        }
    }
    &buf[i..]
}

/// Borsh `Plugin::Attributes(Attributes { attribute_list })`.
fn put_attributes_plugin(w: &mut BorshWriter, attrs: &[Attr]) {
    w.put_u8(6); // Plugin::Attributes
    w.put_u32(attrs.len() as u32);
    for a in attrs {
        w.put_str_bytes(a.key);
        w.put_str_bytes(a.value);
    }
}

/// The program's fixed plugin set for minted assets:
/// `[PermanentFreezeDelegate { frozen: true } / UpdateAuthority,
///   Attributes(attrs) / UpdateAuthority]`.
fn put_asset_plugins(w: &mut BorshWriter, attrs: &[Attr]) {
    w.put_u8(1); // plugins: Option = Some
    w.put_u32(2); // Vec<PluginAuthorityPair> length
    w.put_u8(5); // Plugin::PermanentFreezeDelegate
    w.put_u8(1); // frozen: true
    w.put_u8(1); // authority: Option = Some
    w.put_u8(2); // PluginAuthority::UpdateAuthority
    put_attributes_plugin(w, attrs);
    w.put_u8(1); // authority: Option = Some
    w.put_u8(2); // PluginAuthority::UpdateAuthority
}

pub fn create_v2_data<'a>(buf: &'a mut [u8], name: &[u8], uri: &[u8], attrs: &[Attr]) -> &'a [u8] {
    let mut w = BorshWriter::new(buf);
    w.put_u8(20); // discriminator
    w.put_u8(0); // data_state: DataState::AccountState
    w.put_str_bytes(name);
    w.put_str_bytes(uri);
    put_asset_plugins(&mut w, attrs);
    w.put_u8(0); // external_plugin_adapters: Option = None
    w.finish()
}

pub fn create_collection_v2_data<'a>(buf: &'a mut [u8], name: &[u8], uri: &[u8]) -> &'a [u8] {
    let mut w = BorshWriter::new(buf);
    w.put_u8(21); // discriminator
    w.put_str_bytes(name);
    w.put_str_bytes(uri);
    w.put_u8(0); // plugins: Option = None
    w.put_u8(0); // external_plugin_adapters: Option = None
    w.finish()
}

pub fn update_v1_data<'a>(buf: &'a mut [u8], new_name: &[u8], new_uri: &[u8]) -> &'a [u8] {
    let mut w = BorshWriter::new(buf);
    w.put_u8(15); // discriminator
    w.put_u8(1); // new_name: Option = Some
    w.put_str_bytes(new_name);
    w.put_u8(1); // new_uri: Option = Some
    w.put_str_bytes(new_uri);
    w.put_u8(0); // new_update_authority: Option = None
    w.finish()
}

pub fn update_plugin_v1_data<'a>(buf: &'a mut [u8], attrs: &[Attr]) -> &'a [u8] {
    let mut w = BorshWriter::new(buf);
    w.put_u8(6); // discriminator
    put_attributes_plugin(&mut w, attrs);
    w.finish()
}

/// `CreateV2` metas: asset(w,s), collection(w), authority(ro,s), payer(w,s),
/// owner(ro), update_authority = mpl id (unset), system(ro),
/// log_wrapper = mpl id (unset).
pub fn create_v2_metas<'a>(
    asset: &'a AccountView,
    collection: &'a AccountView,
    config: &'a AccountView,
    payer: &'a AccountView,
    owner: &'a AccountView,
    system_program: &'a AccountView,
) -> [InstructionAccount<'a>; 8] {
    [
        InstructionAccount::writable_signer(asset.address()),
        InstructionAccount::writable(collection.address()),
        InstructionAccount::readonly_signer(config.address()),
        InstructionAccount::writable_signer(payer.address()),
        InstructionAccount::readonly(owner.address()),
        InstructionAccount::readonly(&MPL_CORE_ID),
        InstructionAccount::readonly(system_program.address()),
        InstructionAccount::readonly(&MPL_CORE_ID),
    ]
}

/// `CreateCollectionV2` metas: collection(w,s), update_authority(ro),
/// payer(w,s), system(ro).
pub fn create_collection_v2_metas<'a>(
    collection: &'a AccountView,
    config: &'a AccountView,
    payer: &'a AccountView,
    system_program: &'a AccountView,
) -> [InstructionAccount<'a>; 4] {
    [
        InstructionAccount::writable_signer(collection.address()),
        InstructionAccount::readonly(config.address()),
        InstructionAccount::writable_signer(payer.address()),
        InstructionAccount::readonly(system_program.address()),
    ]
}

/// `UpdateV1` metas: asset(w), collection(RO), payer(w,s), authority(ro,s),
/// system(ro), log_wrapper = mpl id (unset).
pub fn update_v1_metas<'a>(
    asset: &'a AccountView,
    collection: &'a AccountView,
    config: &'a AccountView,
    payer: &'a AccountView,
    system_program: &'a AccountView,
) -> [InstructionAccount<'a>; 6] {
    [
        InstructionAccount::writable(asset.address()),
        InstructionAccount::readonly(collection.address()),
        InstructionAccount::writable_signer(payer.address()),
        InstructionAccount::readonly_signer(config.address()),
        InstructionAccount::readonly(system_program.address()),
        InstructionAccount::readonly(&MPL_CORE_ID),
    ]
}

/// `UpdatePluginV1` metas: asset(w), collection(WRITABLE — unlike UpdateV1),
/// payer(w,s), authority(ro,s), system(ro), log_wrapper = mpl id (unset).
pub fn update_plugin_v1_metas<'a>(
    asset: &'a AccountView,
    collection: &'a AccountView,
    config: &'a AccountView,
    payer: &'a AccountView,
    system_program: &'a AccountView,
) -> [InstructionAccount<'a>; 6] {
    [
        InstructionAccount::writable(asset.address()),
        InstructionAccount::writable(collection.address()),
        InstructionAccount::writable_signer(payer.address()),
        InstructionAccount::readonly_signer(config.address()),
        InstructionAccount::readonly(system_program.address()),
        InstructionAccount::readonly(&MPL_CORE_ID),
    ]
}

/// `CreateV2` — mints a soulbound asset into `collection`, owned by `owner`,
/// authority + update authority = Config PDA. Buffer covers the largest
/// possible ix-data-supplied name/uri (transaction-size bounded).
#[allow(clippy::too_many_arguments)]
#[inline(never)]
pub fn create_v2_signed(
    mpl_program: &AccountView,
    asset: &AccountView,
    collection: &AccountView,
    config: &AccountView,
    payer: &AccountView,
    owner: &AccountView,
    system_program: &AccountView,
    name: &[u8],
    uri: &[u8],
    attrs: &[Attr],
    config_signer: &Signer,
) -> ProgramResult {
    let mut buf = [0u8; 1408];
    let data = create_v2_data(&mut buf, name, uri, attrs);
    let accounts = create_v2_metas(asset, collection, config, payer, owner, system_program);
    let ix = InstructionView {
        program_id: &MPL_CORE_ID,
        accounts: &accounts,
        data,
    };
    invoke_signed::<8, _>(
        &ix,
        &[
            asset,
            collection,
            config,
            payer,
            owner,
            mpl_program,
            system_program,
            mpl_program,
        ],
        core::slice::from_ref(config_signer),
    )
}

/// `CreateCollectionV2` — creates a collection with update authority =
/// Config PDA and no plugins. `name`/`uri` are state-bounded (≤ 64 / ≤ 128).
#[inline(never)]
pub fn create_collection_v2_signed(
    collection: &AccountView,
    config: &AccountView,
    payer: &AccountView,
    system_program: &AccountView,
    name: &[u8],
    uri: &[u8],
    config_signer: &Signer,
) -> ProgramResult {
    let mut buf = [0u8; 256];
    let data = create_collection_v2_data(&mut buf, name, uri);
    let accounts = create_collection_v2_metas(collection, config, payer, system_program);
    let ix = InstructionView {
        program_id: &MPL_CORE_ID,
        accounts: &accounts,
        data,
    };
    invoke_signed::<4, _>(
        &ix,
        &[collection, config, payer, system_program],
        core::slice::from_ref(config_signer),
    )
}

/// `UpdateV1` — renames/re-URIs an asset (update authority = Config PDA).
#[allow(clippy::too_many_arguments)]
#[inline(never)]
pub fn update_v1_signed(
    mpl_program: &AccountView,
    asset: &AccountView,
    collection: &AccountView,
    config: &AccountView,
    payer: &AccountView,
    system_program: &AccountView,
    new_name: &[u8],
    new_uri: &[u8],
    config_signer: &Signer,
) -> ProgramResult {
    let mut buf = [0u8; 1280];
    let data = update_v1_data(&mut buf, new_name, new_uri);
    let accounts = update_v1_metas(asset, collection, config, payer, system_program);
    let ix = InstructionView {
        program_id: &MPL_CORE_ID,
        accounts: &accounts,
        data,
    };
    invoke_signed::<6, _>(
        &ix,
        &[
            asset,
            collection,
            payer,
            config,
            system_program,
            mpl_program,
        ],
        core::slice::from_ref(config_signer),
    )
}

/// `UpdatePluginV1` — replaces the `Attributes` plugin on an asset.
#[allow(clippy::too_many_arguments)]
#[inline(never)]
pub fn update_plugin_v1_signed(
    mpl_program: &AccountView,
    asset: &AccountView,
    collection: &AccountView,
    config: &AccountView,
    payer: &AccountView,
    system_program: &AccountView,
    attrs: &[Attr],
    config_signer: &Signer,
) -> ProgramResult {
    let mut buf = [0u8; 256];
    let data = update_plugin_v1_data(&mut buf, attrs);
    let accounts = update_plugin_v1_metas(asset, collection, config, payer, system_program);
    let ix = InstructionView {
        program_id: &MPL_CORE_ID,
        accounts: &accounts,
        data,
    };
    invoke_signed::<6, _>(
        &ix,
        &[
            asset,
            collection,
            payer,
            config,
            system_program,
            mpl_program,
        ],
        core::slice::from_ref(config_signer),
    )
}
