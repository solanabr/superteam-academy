'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Download, Award, CheckCircle, QrCode, Share2, Shield } from 'lucide-react';
import { useParams, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CertificatePage() {
  const params = useParams();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'pt';
  const courseId = params.id as string;
  const { connected, publicKey } = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(true);

  const certificateData = {
    id: `CERT-${courseId.padStart(3, '0')}-ABC123`,
    studentName: 'João Silva',
    courseName: 'Advanced Smart Contracts on Solana',
    instructor: 'João Santos',
    completionDate: '2024-01-15',
    mintAddress: '8xKj...P3Rt',
    transactionSignature: '3xKj...P3Rt',
    image: 'https://placehold.co/800x600/14b8a6/ffffff?text=Certificate'
  };

  const handleMintNFT = async () => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsMinting(true);
    
    // Simulate minting process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success('NFT Certificate minted successfully!');
    setHasCertificate(true);
    setIsMinting(false);
  };

  const handleDownload = () => {
    toast.success('Certificate downloaded!');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Certificate link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
            <Award className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Certificate of Completion
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Congratulations on completing the course! This certificate is minted on Solana blockchain and is verifiable on-chain.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificate Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-primary-200">
              <div className="border-4 border-primary-500 rounded-xl p-8 text-center">
                {/* Certificate Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <Award className="w-8 h-8 text-primary-600" />
                    <span className="text-xl font-bold text-primary-600">Superteam Brazil</span>
                  </div>
                  <div className="text-sm text-gray-500 uppercase tracking-widest">
                    Certificate of Completion
                  </div>
                </div>

                {/* Certificate Body */}
                <div className="py-8 border-t border-b border-gray-200">
                  <p className="text-gray-600 mb-4">This certifies that</p>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {certificateData.studentName}
                  </h2>
                  <p className="text-gray-600 mb-4">has successfully completed</p>
                  <h3 className="text-2xl font-bold text-primary-600 mb-4">
                    {certificateData.courseName}
                  </h3>
                  <p className="text-gray-600">
                    on {new Date(certificateData.completionDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Certificate Footer */}
                <div className="mt-8 flex items-center justify-between">
                  <div className="text-left">
                    <div className="text-sm text-gray-500">Instructor</div>
                    <div className="font-semibold text-gray-900">{certificateData.instructor}</div>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm">Verified on Solana</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Certificate ID</div>
                    <div className="font-mono text-sm">{certificateData.id}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={handleDownload}
                className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                Download PDF
              </button>
              
              <button
                onClick={handleShare}
                className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </button>

              {!hasCertificate && (
                <button
                  onClick={handleMintNFT}
                  disabled={isMinting || !connected}
                  className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors disabled:opacity-50"
                >
                  {isMinting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Mint NFT
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Certificate Details */}
          <div className="space-y-6">
            {/* Verification */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-green-500" />
                <h3 className="text-lg font-bold text-gray-900">Verified Certificate</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                This certificate has been verified on the Solana blockchain.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Certificate ID:</span>
                  <span className="font-mono">{certificateData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mint Address:</span>
                  <span className="font-mono">{certificateData.mintAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Network:</span>
                  <span>Devnet</span>
                </div>
              </div>
              <button className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                View on Explorer
              </button>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <QrCode className="w-32 h-32 mx-auto text-gray-800 mb-4" />
              <p className="text-sm text-gray-600">
                Scan to verify certificate
              </p>
            </div>

            {/* Share Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Achievement Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Course Completed</span>
                    <span className="font-semibold">100%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 rounded-full h-2" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">24</div>
                    <div className="text-sm text-gray-600">Lessons</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">48h</div>
                    <div className="text-sm text-gray-600">Study Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}