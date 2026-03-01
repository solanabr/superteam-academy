'use client';

import { useCallback, useState } from 'react';
import { AlertTriangle, Trash2, XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { useUserStore } from '@/lib/stores/user-store';

export function DangerZone() {
  const reset = useUserStore((s) => s.reset);
  const [closeEnrollmentsOpen, setCloseEnrollmentsOpen] = useState(false);
  const [resetDataOpen, setResetDataOpen] = useState(false);

  const handleCloseEnrollments = useCallback(() => {
    // Placeholder: In production this would call an on-chain instruction
    // to close all enrollment accounts for the connected wallet.
    setCloseEnrollmentsOpen(false);
  }, []);

  const handleResetLocalData = useCallback(() => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('superteam-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // localStorage unavailable
    }

    reset();
    setResetDataOpen(false);
  }, [reset]);

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Irreversible actions. Proceed with caution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Close All Enrollments */}
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Close All Enrollments</p>
            <p className="text-xs text-muted-foreground">
              Permanently close all your on-chain course enrollments. This cannot be undone.
            </p>
          </div>
          <Dialog
            open={closeEnrollmentsOpen}
            onOpenChange={setCloseEnrollmentsOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0 gap-2"
              >
                <XCircle className="size-3.5" />
                Close Enrollments
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Close All Enrollments?</DialogTitle>
                <DialogDescription>
                  This will permanently close all your on-chain enrollment
                  accounts. Your progress data will be lost and you will need
                  to re-enroll in courses. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleCloseEnrollments}
                >
                  Yes, Close All
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Reset Local Data */}
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Reset Local Data</p>
            <p className="text-xs text-muted-foreground">
              Clear all locally stored preferences, streak data, and cached settings.
            </p>
          </div>
          <Dialog open={resetDataOpen} onOpenChange={setResetDataOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0 gap-2"
              >
                <Trash2 className="size-3.5" />
                Reset Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Local Data?</DialogTitle>
                <DialogDescription>
                  This will clear all locally stored data including your streak,
                  notification preferences, theme settings, and other cached
                  information. On-chain data (XP, credentials) will not be
                  affected.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleResetLocalData}
                >
                  Yes, Reset Everything
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
