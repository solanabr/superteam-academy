'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, X } from 'lucide-react';

interface WalletInstallModalProps {
  isOpen: boolean;
  walletName: string;
  walletUrl?: string;
  onClose: () => void;
  onInstall: () => void;
  onSelectAnother: () => void;
}

export function WalletInstallModal({
  isOpen,
  walletName,
  walletUrl,
  onClose,
  onInstall,
  onSelectAnother,
}: WalletInstallModalProps) {
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen === false) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Wallet Not Found</DialogTitle>
          </div>
          <DialogDescription className="mt-2 text-base">
            {walletName} is not installed on your browser or mobile device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              To sign in with {walletName}, you need to install it first. Click the button below to
              install or download {walletName} on your device.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Steps:</h4>
            <ol className="list-inside list-decimal space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>Click &quot;Install {walletName}&quot; button below</li>
              <li>Follow the installation instructions</li>
              <li>Return to this page and try signing in again</li>
            </ol>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelectAnother();
            }}
            className="flex-1"
          >
            Select Another Wallet
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onInstall();
            }}
            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
            disabled={!walletUrl}
          >
            <Download className="h-4 w-4" />
            Install {walletName}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
