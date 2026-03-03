/**
 * UpdateCourseForm — admin-only form for updating on-chain courses.
 *
 * Validates:
 *   1. Wallet must be connected
 *   2. Connected wallet must be in the authorized admin wallets list
 * All fields are optional per UpdateCourseParams.
 * Pre-filled with current on-chain values.
 * Uses goey-toast for all events and errors.
 */

'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, type Idl } from '@coral-xyz/anchor';
import { goeyToast } from 'goey-toast';
import { buildUpdateCourseIx, type UpdateCourseInput } from '@/context/solana/course-transactions';
import idlJson from '@/context/idl/onchain_academy.json';

interface CourseData {
    courseId: string;
    isActive: boolean;
    xpPerLesson: number;
    creatorRewardXp: number;
    minCompletionsForReward: number;
}

interface Props {
    course: CourseData;
    onClose: () => void;
    onSuccess: () => void;
}

export function UpdateCourseForm({ course, onClose, onSuccess }: Props) {
    const { publicKey, signTransaction, connected, disconnect } = useWallet();
    const { connection } = useConnection();
    const { setVisible } = useWalletModal();

    const [authorizedWallets, setAuthorizedWallets] = useState<string[]>([]);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [form, setForm] = useState({
        isActive: course.isActive,
        xpPerLesson: course.xpPerLesson,
        creatorRewardXp: course.creatorRewardXp,
        minCompletionsForReward: course.minCompletionsForReward,
        updateActive: false,
        updateXp: false,
        updateRewardXp: false,
        updateMinCompletions: false,
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

    const handleSubmit = async () => {
        if (!publicKey || !signTransaction) {
            goeyToast.warning('Please connect your wallet first');
            return;
        }

        if (!isAuthorized) {
            goeyToast.error('Connected wallet is not the config authority');
            return;
        }

        if (!form.updateActive && !form.updateXp && !form.updateRewardXp && !form.updateMinCompletions) {
            goeyToast.warning('Select at least one field to update');
            return;
        }

        setSending(true);
        goeyToast.info('Building update transaction…');

        try {
            const provider = new AnchorProvider(connection, {
                publicKey,
                signTransaction,
                signAllTransactions: async (txs) => txs,
            }, { commitment: 'confirmed' });

            const program = new Program(idlJson as Idl, provider);

            const input: UpdateCourseInput = {
                courseId: course.courseId,
                newIsActive: form.updateActive ? form.isActive : null,
                newXpPerLesson: form.updateXp ? form.xpPerLesson : null,
                newCreatorRewardXp: form.updateRewardXp ? form.creatorRewardXp : null,
                newMinCompletionsForReward: form.updateMinCompletions ? form.minCompletionsForReward : null,
            };

            const ix = await buildUpdateCourseIx(program, input, publicKey);
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

            // Build a friendly summary of what changed
            const changes: string[] = [];
            if (form.updateActive) changes.push(`status → ${form.isActive ? 'active' : 'inactive'}`);
            if (form.updateXp) changes.push(`XP → ${form.xpPerLesson}`);
            if (form.updateRewardXp) changes.push(`reward XP → ${form.creatorRewardXp}`);
            if (form.updateMinCompletions) changes.push(`min completions → ${form.minCompletionsForReward}`);
            goeyToast.success(`Course updated: ${changes.join(', ')}`);

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (err) {
            console.error('[UpdateCourse]', err);
            const msg = err instanceof Error ? err.message : 'Transaction failed';
            if (msg.includes('User rejected')) {
                goeyToast.warning('Transaction cancelled by user');
            } else if (msg.includes('insufficient')) {
                goeyToast.error('Insufficient SOL for transaction fees');
            } else {
                goeyToast.error(`Update failed: ${msg}`);
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
        display: 'flex', alignItems: 'center', gap: '8px',
        fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)',
        marginBottom: '4px', cursor: 'pointer',
    };

    const fieldStyle: React.CSSProperties = { marginBottom: '16px' };

    const checkboxStyle: React.CSSProperties = {
        width: '14px', height: '14px', accentColor: '#6366f1', cursor: 'pointer',
    };

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
                maxWidth: '460px', width: '95%',
                maxHeight: '85vh', overflowY: 'auto',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                        <h2 style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: 700 }}>Update Course</h2>
                        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                            {course.courseId}
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                        fontSize: '20px', cursor: 'pointer',
                    }}>x</button>
                </div>

                {loadingAuth ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.4)' }}>
                        Loading authority data…
                    </div>
                ) : !connected ? (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <div style={{ fontSize: '13px', marginBottom: '12px', color: '#6366f1', fontWeight: 600 }}>Wallet not connected</div>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 8px' }}>
                            Connect the <strong>config authority wallet</strong> to update this course.
                        </p>
                        <p style={{
                            fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 16px',
                            fontFamily: 'monospace', maxWidth: '400px', marginInline: 'auto',
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
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <div style={{ fontSize: '13px', marginBottom: '12px', color: '#f87171', fontWeight: 600 }}>Wrong wallet</div>
                        <p style={{ fontSize: '14px', color: '#f87171', fontWeight: 600, margin: '0 0 8px' }}>
                            Wrong wallet connected
                        </p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>
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
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div style={{ fontSize: '13px', marginBottom: '8px', color: '#4ade80', fontWeight: 600 }}>Success</div>
                        <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px' }}>Course Updated!</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                            {txSignature}
                        </p>
                    </div>
                ) : (
                    <>
                        <div style={{
                            padding: '8px 12px', borderRadius: '6px', marginBottom: '16px',
                            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
                            fontSize: '12px', color: 'rgba(255,255,255,0.6)',
                        }}>
                            Authorized wallet connected: <code>{walletAddress.slice(0, 8)}…{walletAddress.slice(-4)}</code>
                        </div>

                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>
                            Check the fields you want to update, then adjust their values.
                        </p>

                        {/* Active toggle */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                <input type="checkbox" style={checkboxStyle}
                                    checked={form.updateActive}
                                    onChange={(e) => setForm(f => ({ ...f, updateActive: e.target.checked }))} />
                                Active Status
                            </label>
                            {form.updateActive && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                    <button onClick={() => setForm(f => ({ ...f, isActive: true }))}
                                        style={{
                                            padding: '6px 16px', borderRadius: '6px', fontSize: '12px',
                                            border: '1px solid',
                                            borderColor: form.isActive ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)',
                                            background: form.isActive ? 'rgba(34,197,94,0.15)' : 'transparent',
                                            color: form.isActive ? '#22c55e' : 'rgba(255,255,255,0.5)',
                                            cursor: 'pointer', fontWeight: 600,
                                        }}>Active</button>
                                    <button onClick={() => setForm(f => ({ ...f, isActive: false }))}
                                        style={{
                                            padding: '6px 16px', borderRadius: '6px', fontSize: '12px',
                                            border: '1px solid',
                                            borderColor: !form.isActive ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.1)',
                                            background: !form.isActive ? 'rgba(248,113,113,0.15)' : 'transparent',
                                            color: !form.isActive ? '#f87171' : 'rgba(255,255,255,0.5)',
                                            cursor: 'pointer', fontWeight: 600,
                                        }}>Inactive</button>
                                </div>
                            )}
                        </div>

                        {/* XP per Lesson */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                <input type="checkbox" style={checkboxStyle}
                                    checked={form.updateXp}
                                    onChange={(e) => setForm(f => ({ ...f, updateXp: e.target.checked }))} />
                                XP per Lesson
                            </label>
                            {form.updateXp && (
                                <input type="number" style={{ ...inputStyle, marginTop: '4px' }}
                                    value={form.xpPerLesson}
                                    onChange={(e) => setForm(f => ({ ...f, xpPerLesson: Number(e.target.value) }))} />
                            )}
                        </div>

                        {/* Creator Reward XP */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                <input type="checkbox" style={checkboxStyle}
                                    checked={form.updateRewardXp}
                                    onChange={(e) => setForm(f => ({ ...f, updateRewardXp: e.target.checked }))} />
                                Creator Reward XP
                            </label>
                            {form.updateRewardXp && (
                                <input type="number" style={{ ...inputStyle, marginTop: '4px' }}
                                    value={form.creatorRewardXp}
                                    onChange={(e) => setForm(f => ({ ...f, creatorRewardXp: Number(e.target.value) }))} />
                            )}
                        </div>

                        {/* Min Completions */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                <input type="checkbox" style={checkboxStyle}
                                    checked={form.updateMinCompletions}
                                    onChange={(e) => setForm(f => ({ ...f, updateMinCompletions: e.target.checked }))} />
                                Min Completions for Reward
                            </label>
                            {form.updateMinCompletions && (
                                <input type="number" style={{ ...inputStyle, marginTop: '4px' }}
                                    value={form.minCompletionsForReward}
                                    onChange={(e) => setForm(f => ({ ...f, minCompletionsForReward: Number(e.target.value) }))} />
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={onClose} style={{
                                padding: '8px 16px', borderRadius: '6px',
                                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer',
                            }}>Cancel</button>
                            <button onClick={handleSubmit} disabled={sending}
                                style={{
                                    padding: '8px 20px', borderRadius: '6px',
                                    background: sending ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    border: 'none', color: '#fff', fontSize: '13px',
                                    fontWeight: 600, cursor: sending ? 'wait' : 'pointer',
                                }}>
                                {sending ? 'Signing…' : 'Update Course'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
