"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, CheckCircle } from "lucide-react";

interface InterestModalProps {
  ideaId: string;
  ideaTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: {
    ideaId: string;
    role: string;
    message: string;
    portfolioUrl?: string;
  }) => Promise<void>;
}

const roleOptions = [
  { value: "developer", label: "Developer" },
  { value: "designer", label: "Designer" },
  { value: "product-manager", label: "Product Manager" },
  { value: "marketing", label: "Marketing" },
  { value: "business-development", label: "Business Development" },
  { value: "investor", label: "Investor / Advisor" },
  { value: "other", label: "Other" },
];

export function InterestModal({
  ideaId,
  ideaTitle,
  isOpen,
  onClose,
  onSubmit,
}: InterestModalProps) {
  const t = useTranslations("common");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !message.trim()) return;

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({
          ideaId,
          role,
          message,
          portfolioUrl: portfolioUrl || undefined,
        });
      }
      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Failed to submit interest:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRole("");
    setMessage("");
    setPortfolioUrl("");
    setIsSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Express Interest</DialogTitle>
          <DialogDescription>
            Tell the idea owner about yourself and how you can contribute to &quot;{ideaTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Interest Submitted!</h3>
            <p className="text-muted-foreground mt-2">
              The idea owner will be notified and can reach out to you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">
                What role are you interested in? <span className="text-red-500">*</span>
              </Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                placeholder="Introduce yourself, mention your relevant skills and experience, and explain why you're interested in this project..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio/GitHub URL (optional)</Label>
              <Input
                id="portfolio"
                type="url"
                placeholder="https://github.com/username or https://your-portfolio.com"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" variant="solana" disabled={isSubmitting || !role || !message.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Interest
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
