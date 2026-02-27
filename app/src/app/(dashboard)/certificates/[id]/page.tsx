'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/hooks';
import { useWalletContext } from '@/components/providers';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  downloadCertificateAsPDF,
  downloadCertificateAsJPG,
  downloadCertificateAsPNG,
} from '@/lib/services/certificate-download.service';
import {
  Award,
  Calendar,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Share2,
  Shield,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  ArrowLeft,
  BadgeCheck,
  Star,
  Clock,
  BookOpen,
  Trophy,
  FileImage,
  FileText,
  Loader2,
  User,
  FileCode,
  Facebook,
  MessageCircle,
  Send,
  Mail,
} from 'lucide-react';

export default function CertificatePage() {
  const { t } = useTranslation();
  const { connected, address } = useWalletContext();
  const params = useParams();
  const certificateId = params.id as string;
  const [isDownloading, setIsDownloading] = useState<'pdf' | 'jpg' | 'png' | null>(null);
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownershipStatus, setOwnershipStatus] = useState<{
    checked: boolean;
    isOwner: boolean;
    isRecipient: boolean;
    isOnChainOwner: boolean;
  }>({ checked: false, isOwner: false, isRecipient: false, isOnChainOwner: false });

  // Fetch certificate data
  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/certificates/${certificateId}`);
        if (!response.ok) {
          throw new Error('Certificate not found');
        }
        const data = await response.json();
        setCertificate(data.certificate);
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError(err instanceof Error ? err.message : 'Failed to load certificate');
      } finally {
        setLoading(false);
      }
    };

    if (certificateId) {
      fetchCertificate();
    }
  }, [certificateId]);

  // Verify ownership when wallet is connected
  useEffect(() => {
    const verifyOwnership = async () => {
      if (!connected || !address || !certificate?.onChain) {
        setOwnershipStatus({
          checked: true,
          isOwner: false,
          isRecipient: false,
          isOnChainOwner: false,
        });
        return;
      }

      try {
        const response = await fetch(`/api/certificates/${certificateId}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: address }),
        });

        if (response.ok) {
          const data = await response.json();
          setOwnershipStatus({
            checked: true,
            isOwner: data.isOwner,
            isRecipient: data.isRecipient,
            isOnChainOwner: data.isOnChainOwner,
          });
        } else {
          setOwnershipStatus({
            checked: true,
            isOwner: false,
            isRecipient: false,
            isOnChainOwner: false,
          });
        }
      } catch (err) {
        console.error('Ownership verification failed:', err);
        setOwnershipStatus({
          checked: true,
          isOwner: false,
          isRecipient: false,
          isOnChainOwner: false,
        });
      }
    };

    if (certificate) {
      verifyOwnership();
    }
  }, [connected, address, certificate, certificateId]);

  // Download handlers
  const handleDownloadPDF = async () => {
    setIsDownloading('pdf');
    try {
      await downloadCertificateAsPDF(
        'certificate-card',
        `certificate-${certificate.courseName.toLowerCase().replace(/\s+/g, '-')}`,
        {
          id: certificate.id,
          courseName: certificate.courseName,
          recipientName: certificate.recipientName,
          recipientAddress: certificate.recipientAddress,
          issuedDate: certificate.issuedDate,
          credentialId: certificate.credentialId,
          issuerName: certificate.issuerName,
          grade: certificate.grade,
          xpEarned: certificate.xpEarned,
          skills: certificate.skills,
          verified: certificate.verified,
          onChain: certificate.onChain,
          mintAddress: certificate.mintAddress,
        }
      );
      toast.success('Certificate downloaded as PDF');
    } catch (error) {
      console.error('PDF download failed:', error);
      toast.error('Failed to download PDF');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadJPG = async () => {
    setIsDownloading('jpg');
    try {
      await downloadCertificateAsJPG(
        'certificate-card',
        `certificate-${certificate.courseName.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('Certificate downloaded as JPG');
    } catch (error) {
      console.error('JPG download failed:', error);
      toast.error('Failed to download JPG');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadPNG = async () => {
    setIsDownloading('png');
    try {
      await downloadCertificateAsPNG(
        'certificate-card',
        `certificate-${certificate.courseName.toLowerCase().replace(/\s+/g, '-')}`
      );
      toast.success('Certificate downloaded as PNG');
    } catch (error) {
      console.error('PNG download failed:', error);
      toast.error('Failed to download PNG');
    } finally {
      setIsDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="container py-20">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          </CardHeader>
          <CardContent>
            <p>{t('common.loading')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="container py-20">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <CardTitle>{t('certificates.notFound')}</CardTitle>
            <CardDescription>{error || t('certificates.notFoundDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/profile">{t('certificates.backToProfile')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const copyCredentialId = () => {
    navigator.clipboard.writeText(certificate.credentialId);
    toast.success('Credential ID copied to clipboard');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/certificates/${certificate.id}`);
    toast.success('Certificate link copied to clipboard');
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(
      `I just earned my ${certificate.courseName} certificate from @CapySolBuild! #Solana #Web3`
    );
    const url = encodeURIComponent(`${window.location.origin}/certificates/${certificate.id}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(`${window.location.origin}/certificates/${certificate.id}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const shareOnFacebook = () => {
    const url = encodeURIComponent(`${window.location.origin}/certificates/${certificate.id}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `I just earned my ${certificate.courseName} certificate from CapySolBuild Academy! Check it out: ${window.location.origin}/certificates/${certificate.id}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareOnTelegram = () => {
    const text = encodeURIComponent(
      `I just earned my ${certificate.courseName} certificate from CapySolBuild Academy!`
    );
    const url = encodeURIComponent(`${window.location.origin}/certificates/${certificate.id}`);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const shareOnReddit = () => {
    const title = encodeURIComponent(
      `I earned my ${certificate.courseName} certificate on CapySolBuild Academy!`
    );
    const url = encodeURIComponent(`${window.location.origin}/certificates/${certificate.id}`);
    window.open(`https://www.reddit.com/submit?url=${url}&title=${title}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out my ${certificate.courseName} certificate!`);
    const body = encodeURIComponent(
      `I just earned my ${certificate.courseName} certificate from CapySolBuild Academy! You can verify it here: ${window.location.origin}/certificates/${certificate.id}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="container max-w-4xl py-8">
      {/* Back Link */}
      <Button variant="ghost" className="mb-6 gap-2" asChild>
        <Link href="/profile">
          <ArrowLeft className="h-4 w-4" />
          {t('certificates.backToProfile')}
        </Link>
      </Button>

      {/* Certificate Card */}
      <Card id="certificate-card" className="mb-8 overflow-hidden">
        {/* Certificate Header */}
        <div className="from-primary/20 via-primary/10 to-background bg-gradient-to-br p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <div className="bg-background rounded-full p-6 shadow-lg">
                <Award className="text-primary h-16 w-16" />
              </div>
              {certificate.verified && (
                <div className="absolute -right-1 -bottom-1 rounded-full bg-green-500 p-1 text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              )}
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold">{t('certificates.certificateOf')}</h1>
          <h2 className="text-primary text-4xl font-bold">{certificate.courseName}</h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl">
            {certificate.courseDescription}
          </p>
        </div>

        <CardContent className="p-8">
          {/* Recipient */}
          <div className="mb-8 text-center">
            <p className="text-muted-foreground mb-2">{t('certificates.awardedTo')}</p>
            <div className="flex items-center justify-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {certificate.recipientName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-xl font-bold">{certificate.recipientName}</p>
                <code className="text-muted-foreground text-xs">
                  {certificate.recipientAddress.slice(0, 8)}...
                  {certificate.recipientAddress.slice(-8)}
                </code>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Certificate Details Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">{t('certificates.issuedOn')}</p>
                  <p className="font-semibold">{certificate.issuedDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">{t('certificates.credentialId')}</p>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm">{certificate.credentialId}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={copyCredentialId}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Award className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">{t('certificates.issuedBy')}</p>
                  <p className="font-semibold">{certificate.issuerName}</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Star className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">{t('certificates.grade')}</p>
                  <p className="text-primary text-xl font-semibold">{certificate.grade}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t('certificates.completionTime')}
                  </p>
                  <p className="font-semibold">{certificate.completionTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Trophy className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">{t('certificates.xpEarned')}</p>
                  <p className="font-semibold">{certificate.xpEarned.toLocaleString()} XP</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Skills */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <BookOpen className="h-5 w-5" />
              {t('certificates.skillsCovered')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {certificate.skills.map((skill: string) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Completion Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{certificate.lessonsCompleted}</p>
              <p className="text-muted-foreground text-sm">{t('certificates.lessons')}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{certificate.challengesSolved}</p>
              <p className="text-muted-foreground text-sm">{t('certificates.challenges')}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-primary text-2xl font-bold">{certificate.grade}</p>
              <p className="text-muted-foreground text-sm">{t('certificates.finalGrade')}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-500">
                <CheckCircle2 className="mx-auto h-6 w-6" />
              </p>
              <p className="text-muted-foreground text-sm">{t('certificates.verified')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* On-Chain Verification */}
      {certificate.onChain && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-green-500" />
              {t('certificates.onChainVerification')}
            </CardTitle>
            <CardDescription>{t('certificates.onChainDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mint Address */}
            <div className="rounded-lg border p-4">
              <p className="text-muted-foreground mb-2 text-sm font-medium">
                {t('certificates.mintAddress')}
              </p>
              <div className="mb-3 flex items-center gap-2">
                <code className="bg-muted flex-1 rounded px-2 py-1 font-mono text-sm break-all">
                  {certificate.mintAddress}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(certificate.mintAddress);
                    toast.success('Mint address copied');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {/* Multiple Explorer Links */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a
                    href={`https://explorer.solana.com/address/${certificate.mintAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Solana Explorer
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a
                    href={`https://solscan.io/token/${certificate.mintAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Solscan
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a
                    href={`https://solana.fm/address/${certificate.mintAddress}?cluster=devnet-alpha`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Solana FM
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a
                    href={`https://xray.helius.xyz/token/${certificate.mintAddress}?network=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    XRAY
                  </a>
                </Button>
              </div>
            </div>

            {/* Transaction Signature */}
            <div className="rounded-lg border p-4">
              <p className="text-muted-foreground mb-2 text-sm font-medium">
                {t('certificates.transactionSignature')}
              </p>
              <div className="mb-3 flex items-center gap-2">
                <code className="bg-muted flex-1 rounded px-2 py-1 font-mono text-xs break-all">
                  {certificate.transactionSignature}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(certificate.transactionSignature);
                    toast.success('Transaction signature copied');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a
                    href={`https://explorer.solana.com/tx/${certificate.transactionSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Transaction
                  </a>
                </Button>
              </div>
            </div>

            {/* Metadata URI */}
            {certificate.metadataUri && (
              <div className="rounded-lg border p-4">
                <p className="text-muted-foreground mb-2 text-sm font-medium">
                  <FileCode className="mr-1 inline h-4 w-4" />
                  Metadata URI
                </p>
                <div className="mb-3 flex items-center gap-2">
                  <code className="bg-muted flex-1 rounded px-2 py-1 font-mono text-xs break-all">
                    {certificate.metadataUri}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(certificate.metadataUri);
                      toast.success('Metadata URI copied');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <a
                      href={
                        certificate.metadataUri.startsWith('ipfs://')
                          ? `https://ipfs.io/ipfs/${certificate.metadataUri.replace('ipfs://', '')}`
                          : certificate.metadataUri
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Metadata
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Ownership Proof */}
            {ownershipStatus.checked && ownershipStatus.isOwner && (
              <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                <div className="rounded-full bg-blue-500 p-2">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-600 dark:text-blue-400">
                    Ownership Verified
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {ownershipStatus.isOnChainOwner
                      ? 'Your connected wallet owns this NFT certificate on-chain'
                      : 'You are the recipient of this certificate'}
                  </p>
                </div>
              </div>
            )}

            {/* Verification Badge */}
            <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
              <div className="rounded-full bg-green-500 p-2">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-600 dark:text-green-400">
                  On-Chain Verified
                </p>
                <p className="text-muted-foreground text-sm">
                  This certificate is permanently recorded on the Solana blockchain
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Share & Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('certificates.shareDownload')}
          </CardTitle>
          <CardDescription>
            Share your achievement on social media or download the certificate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Social Sharing */}
          <div>
            <p className="mb-2 text-sm font-medium">Share on Social Media</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={shareOnTwitter}>
                <Twitter className="h-4 w-4" />
                Twitter/X
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={shareOnLinkedIn}>
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={shareOnFacebook}>
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={shareOnWhatsApp}>
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={shareOnTelegram}>
                <Send className="h-4 w-4" />
                Telegram
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={shareOnReddit}>
                <MessageCircle className="h-4 w-4" />
                Reddit
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={shareViaEmail}>
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={copyLink}>
                <LinkIcon className="h-4 w-4" />
                {t('certificates.copyLink')}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Download Options */}
          <div>
            <p className="mb-2 text-sm font-medium">Download Certificate</p>
            <div className="flex flex-wrap gap-3">
              <Button
                className="gap-2"
                onClick={handleDownloadPDF}
                disabled={isDownloading !== null}
              >
                {isDownloading === 'pdf' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Download PDF
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleDownloadJPG}
                disabled={isDownloading !== null}
              >
                {isDownloading === 'jpg' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileImage className="h-4 w-4" />
                )}
                Download JPG
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleDownloadPNG}
                disabled={isDownloading !== null}
              >
                {isDownloading === 'png' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileImage className="h-4 w-4" />
                )}
                Download PNG
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
