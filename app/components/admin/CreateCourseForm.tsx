/**
 * CreateCourseForm — admin-only form for creating on-chain courses.
 *
 * Validates:
 *   1. Wallet must be connected
 *   2. Connected wallet must be in the authorized admin wallets list
 * Uses goey-toast for all events, errors, and success feedback.
 */

'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Transaction, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, type Idl } from '@coral-xyz/anchor';
import { goeyToast } from 'goey-toast';
import { buildCreateCourseIx, type CreateCourseInput } from '@/context/solana/course-transactions';
import idlJson from '@/context/idl/onchain_academy.json';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateCourseForm({ onClose, onSuccess }: Props) {
    const { publicKey, signTransaction, connected, disconnect } = useWallet();
    const { connection } = useConnection();
    const { setVisible } = useWalletModal();

    const [authorizedWallets, setAuthorizedWallets] = useState<string[]>([]);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [form, setForm] = useState({
        courseId: '',
        creatorWallet: '',
        lessonCount: 1,
        difficulty: 0,
        xpPerLesson: 100,
        trackId: 0,
        trackLevel: 1,
        contentTxId: '0'.repeat(64),
        prerequisite: '',
        creatorRewardXp: 50,
        minCompletionsForReward: 10,
    });
    const [sending, setSending] = useState(false);
    const [txSignature, setTxSignature] = useState<string | null>(null);

    // Fetch authorized wallets on mount
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/admin/authority');
                if (res.ok) {
                    const data = await res.json();
                    setAuthorizedWallets(data.authorizedWallets || []);
                } else {
                    goeyToast.error('Failed to load authority data');
                }
            } catch {
                goeyToast.error('Network error loading authority');
            } finally {
                setLoadingAuth(false);
            }
        })();
    }, []);

    const walletAddress = publicKey?.toBase58() || '';
    const isAuthorized = authorizedWallets.includes(walletAddress);
    const isWrongWallet = connected && !isAuthorized && !loadingAuth;

    const update = (field: string, value: string | number) =>
        setForm((f) => ({ ...f, [field]: value }));

    const handleSubmit = async () => {
        if (!publicKey || !signTransaction) {
            goeyToast.warning('Please connect your wallet first');
            return;
        }

        if (!isAuthorized) {
            goeyToast.error('Connected wallet is not the config authority. Cannot sign course transactions.');
            return;
        }

        if (!form.courseId.trim()) {
            goeyToast.warning('Course ID is required');
            return;
        }

        if (!form.creatorWallet.trim()) {
            goeyToast.warning('Creator wallet address is required');
            return;
        }

        // Validate creator wallet is a valid public key
        try {
            new PublicKey(form.creatorWallet);
        } catch {
            goeyToast.error('Invalid creator wallet address');
            return;
        }

        setSending(true);
        goeyToast.info('Building transaction…');

        try {
            const provider = new AnchorProvider(connection, {
                publicKey,
                signTransaction,
                signAllTransactions: async (txs) => txs,
            }, { commitment: 'confirmed' });

            const program = new Program(idlJson as Idl, provider);

            // Parse content TX ID from hex
            const contentBytes: number[] = [];
            const hex = form.contentTxId.replace(/^0x/, '');
            for (let i = 0; i < 64; i += 2) {
                contentBytes.push(parseInt(hex.substring(i, i + 2), 16) || 0);
            }
            while (contentBytes.length < 32) contentBytes.push(0);

            const input: CreateCourseInput = {
                courseId: form.courseId,
                creator: new PublicKey(form.creatorWallet),
                contentTxId: contentBytes.slice(0, 32),
                lessonCount: form.lessonCount,
                difficulty: form.difficulty,
                xpPerLesson: form.xpPerLesson,
                trackId: form.trackId,
                trackLevel: form.trackLevel,
                prerequisite: form.prerequisite ? new PublicKey(form.prerequisite) : null,
                creatorRewardXp: form.creatorRewardXp,
                minCompletionsForReward: form.minCompletionsForReward,
            };

            const ix = await buildCreateCourseIx(program, input, publicKey);
            const tx = new Transaction().add(ix);
            tx.feePayer = publicKey;
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

            goeyToast.info('Please sign the transaction in your wallet…');
            const signed = await signTransaction(tx);

            goeyToast.info('Broadcasting transaction…');
            const sig = await connection.sendRawTransaction(signed.serialize());

            goeyToast.info('Confirming on-chain…');
            await connection.confirmTransaction(sig, 'confirmed');

            setTxSignature(sig);
            goeyToast.success(`Course "${form.courseId}" created on-chain!`);

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (err) {
            console.error('[CreateCourse]', err);
            const msg = err instanceof Error ? err.message : 'Transaction failed';
            if (msg.includes('User rejected')) {
                goeyToast.warning('Transaction cancelled by user');
            } else if (msg.includes('insufficient')) {
                goeyToast.error('Insufficient SOL for transaction fees');
            } else if (msg.includes('already in use')) {
                goeyToast.error('A course with this ID already exists on-chain');
            } else {
                goeyToast.error(`Transaction failed: ${msg}`);
            }
        } finally {
            setSending(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '8px 12px', borderRadius: '6px',
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.04)',
        color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '12px', fontWeight: 600,
        color: 'rgba(255,255,255,0.6)', marginBottom: '4px',
    };

    const fieldStyle: React.CSSProperties = { marginBottom: '12px' };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        }}>
            <div style={{
                background: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px', padding: '24px',
                maxWidth: '520px', width: '95%',
                maxHeight: '85vh', overflowY: 'auto',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Create Course On-Chain</h2>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                        fontSize: '20px', cursor: 'pointer',
                    }}>x</button>
                </div>

                {/* Loading authority */}
                {loadingAuth ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.4)' }}>
                        Loading authority data…
                    </div>
                ) : !connected ? (
                    /* Wallet not connected */
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <div style={{ fontSize: '13px', marginBottom: '12px', color: '#6366f1', fontWeight: 600 }}>Wallet not connected</div>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 8px' }}>
                            Connect the <strong>config authority wallet</strong> to create courses.
                        </p>
                        <p style={{
                            fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 16px',
                            fontFamily: 'monospace', wordBreak: 'break-all', maxWidth: '400px', marginInline: 'auto',
                        }}>
                            {authorizedWallets.length > 0
                                ? `Authorized: ${authorizedWallets.map(w => w.slice(0, 6) + '…' + w.slice(-4)).join(', ')}`
                                : 'No authorized wallets configured'}
                        </p>
                        <button onClick={() => { setVisible(true); goeyToast.info('Select your admin wallet…'); }}
                            style={{
                                padding: '10px 24px', borderRadius: '8px',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none', color: '#fff', fontSize: '14px',
                                fontWeight: 600, cursor: 'pointer',
                            }}>
                            Connect Wallet
                        </button>
                    </div>
                ) : isWrongWallet ? (
                    /* Wrong wallet connected */
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <div style={{ fontSize: '13px', marginBottom: '12px', color: '#f87171', fontWeight: 600 }}>Wrong wallet</div>
                        <p style={{ fontSize: '14px', color: '#f87171', fontWeight: 600, margin: '0 0 8px' }}>
                            Wrong wallet connected
                        </p>
                        <p style={{
                            fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px',
                        }}>
                            Connected: <code style={{ color: '#f87171' }}>{walletAddress.slice(0, 8)}…{walletAddress.slice(-4)}</code>
                        </p>
                        <p style={{
                            fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 16px',
                            fontFamily: 'monospace', maxWidth: '400px', marginInline: 'auto',
                        }}>
                            Required: {authorizedWallets.map(w => w.slice(0, 6) + '…' + w.slice(-4)).join(', ')}
                        </p>
                        <button onClick={() => { disconnect(); goeyToast.info('Disconnected. Connect the correct wallet.'); }}
                            style={{
                                padding: '10px 24px', borderRadius: '8px',
                                background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)',
                                color: '#f87171', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                            }}>
                            Disconnect & Try Again
                        </button>
                    </div>
                ) : txSignature ? (
                    /* Success */
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div style={{ fontSize: '13px', marginBottom: '8px', color: '#4ade80', fontWeight: 600 }}>Success</div>
                        <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px' }}>Course Created!</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                            {txSignature}
                        </p>
                    </div>
                ) : (
                    /* Form */
                    <>
                        <div style={{
                            padding: '8px 12px', borderRadius: '6px', marginBottom: '16px',
                            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
                            fontSize: '12px', color: 'rgba(255,255,255,0.6)',
                        }}>
                            Authorized wallet connected: <code>{walletAddress.slice(0, 8)}…{walletAddress.slice(-4)}</code>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Course ID *</label>
                                <input style={inputStyle} value={form.courseId} placeholder="e.g. solana-101"
                                    onChange={(e) => update('courseId', e.target.value)} />
                            </div>
                            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Creator Wallet (XP recipient) *</label>
                                <input style={inputStyle} value={form.creatorWallet} placeholder="Public key"
                                    onChange={(e) => update('creatorWallet', e.target.value)} />
                            </div>
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Lesson Count</label>
                                <input type="number" style={inputStyle} value={form.lessonCount} min={1} max={255}
                                    onChange={(e) => update('lessonCount', Number(e.target.value))} />
                            </div>
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Difficulty</label>
                                <select style={inputStyle} value={form.difficulty}
                                    onChange={(e) => update('difficulty', Number(e.target.value))}>
                                    <option value={0}>Beginner</option>
                                    <option value={1}>Intermediate</option>
                                    <option value={2}>Advanced</option>
                                </select>
                            </div>
                            <div style={fieldStyle}>
                                <label style={labelStyle}>XP per Lesson</label>
                                <input type="number" style={inputStyle} value={form.xpPerLesson}
                                    onChange={(e) => update('xpPerLesson', Number(e.target.value))} />
                            </div>
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Track ID</label>
                                <input type="number" style={inputStyle} value={form.trackId}
                                    onChange={(e) => update('trackId', Number(e.target.value))} />
                            </div>
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Track Level</label>
                                <input type="number" style={inputStyle} value={form.trackLevel}
                                    onChange={(e) => update('trackLevel', Number(e.target.value))} />
                            </div>
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Creator Reward XP</label>
                                <input type="number" style={inputStyle} value={form.creatorRewardXp}
                                    onChange={(e) => update('creatorRewardXp', Number(e.target.value))} />
                            </div>
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Min Completions for Reward</label>
                                <input type="number" style={inputStyle} value={form.minCompletionsForReward}
                                    onChange={(e) => update('minCompletionsForReward', Number(e.target.value))} />
                            </div>
                            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Content TX ID (hex, 32 bytes)</label>
                                <input style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '11px' }}
                                    value={form.contentTxId}
                                    onChange={(e) => update('contentTxId', e.target.value)} />
                            </div>
                            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Prerequisite Course PDA (optional)</label>
                                <input style={inputStyle} value={form.prerequisite} placeholder="Leave empty for none"
                                    onChange={(e) => update('prerequisite', e.target.value)} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={onClose} style={{
                                padding: '8px 16px', borderRadius: '6px',
                                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer',
                            }}>Cancel</button>
                            <button onClick={handleSubmit}
                                disabled={sending || !form.courseId || !form.creatorWallet}
                                style={{
                                    padding: '8px 20px', borderRadius: '6px',
                                    background: sending ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    border: 'none', color: '#fff', fontSize: '13px',
                                    fontWeight: 600, cursor: sending ? 'wait' : 'pointer',
                                    opacity: (!form.courseId || !form.creatorWallet) ? 0.5 : 1,
                                }}>
                                {sending ? 'Signing…' : 'Create Course'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
