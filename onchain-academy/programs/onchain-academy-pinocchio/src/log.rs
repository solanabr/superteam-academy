//! Thin syscall wrappers. Pinocchio 0.11 no longer bundles log helpers; these
//! call the syscalls directly and compile to no-ops on the host (unit tests).

#[cfg(any(target_os = "solana", target_arch = "bpf"))]
use pinocchio::syscalls;

#[inline(always)]
pub fn sol_log(message: &str) {
    #[cfg(any(target_os = "solana", target_arch = "bpf"))]
    unsafe {
        syscalls::sol_log_(message.as_ptr(), message.len() as u64)
    }
    #[cfg(not(any(target_os = "solana", target_arch = "bpf")))]
    let _ = message;
}

/// Emits a `Program data: <base64>` log — the wire format of Anchor's `emit!`.
/// `data` is a slice of byte slices; on SBF a `&[u8]` fat pointer is exactly
/// the (addr: u64, len: u64) pair the syscall expects.
#[inline(always)]
pub fn sol_log_data(data: &[&[u8]]) {
    #[cfg(any(target_os = "solana", target_arch = "bpf"))]
    unsafe {
        syscalls::sol_log_data(data.as_ptr() as *const u8, data.len() as u64)
    }
    #[cfg(not(any(target_os = "solana", target_arch = "bpf")))]
    let _ = data;
}
