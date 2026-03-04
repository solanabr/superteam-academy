"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, X, FileText, File as FileIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const fileUploadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  order: z.number().min(0),
  status: z.enum(["public", "private", "preview"]),
  sectionId: z.string().optional(),
  downloadable: z.boolean(), // NEW FIELD
});

interface R2FileUploadFormProps {
  courseId: string;
  sections?: { id: string; name: string; status: string }[];
  onSuccess?: () => void;
}

export function R2FileUploadForm({ 
  courseId, 
  sections = [], 
  onSuccess 
}: R2FileUploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<z.infer<typeof fileUploadSchema>>({
    resolver: zodResolver(fileUploadSchema),
    defaultValues: {
      name: "",
      description: "",
      order: 0,
      status: "public",
      sectionId: undefined,
      downloadable: false, 
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 50MB");
      return;
    }

    const allowedExtensions = ["pdf", "pptx", "ppt", "docx", "doc", "xlsx", "xls", "zip"];
    const extension = file.name.split(".").pop()?.toLowerCase();
    
    if (!extension || !allowedExtensions.includes(extension)) {
      toast.error("Invalid file type. Allowed: PDF, PPTX, DOCX, XLSX, ZIP");
      return;
    }

    setSelectedFile(file);

    if (!form.getValues("name")) {
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      form.setValue("name", nameWithoutExtension);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FileIcon className="w-8 h-8 text-gray-400" />;

    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return <FileText className="w-8 h-8 text-red-500" />;
      case "pptx":
      case "ppt":
        return <FileIcon className="w-8 h-8 text-orange-500" />;
      case "docx":
      case "doc":
        return <FileIcon className="w-8 h-8 text-blue-500" />;
      case "xlsx":
      case "xls":
        return <FileIcon className="w-8 h-8 text-green-500" />;
      case "zip":
        return <FileIcon className="w-8 h-8 text-purple-500" />;
      default:
        return <FileIcon className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };
  const router = useRouter();



 const onSubmit = async (values: z.infer<typeof fileUploadSchema>) => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const urlResponse = await fetch("/api/get-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          courseId,
        }),
      });

      if (!urlResponse.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, key, fileUrl } = await urlResponse.json();

      const uploadPromise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
          else reject(new Error("Upload to R2 failed"));
        });

        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
        
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", selectedFile.type);
        xhr.send(selectedFile);
      });

      await uploadPromise;

      // 3. Save metadata to your Database
      const saveResponse = await fetch(`/api/courses/${courseId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          storageKey: key,
          fileUrl: fileUrl,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.name.split(".").pop()?.toLowerCase() || "unknown",
          mimeType: selectedFile.type,
        }),
      });

      if (!saveResponse.ok) throw new Error("Failed to save file to database");

      toast.success("File uploaded successfully!");
      
      form.reset();
      setSelectedFile(null);
      
      router.refresh(); 

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.zip"
            disabled={uploading}
          />

          {selectedFile ? (
            <div className="flex items-center justify-center gap-4">
              {getFileIcon()}
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold truncate">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {!uploading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ) : (
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-semibold mb-2">Click to upload file</p>
              <p className="text-sm text-gray-500">
                PDF, PPTX, DOCX, XLSX, or ZIP (max 50MB)
              </p>
            </label>
          )}

          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        {/* File Details Form */}
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Module 1 Slides" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="preview">Preview</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Public files are visible to enrolled students
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {sections.length > 0 && (
            <FormField
              control={form.control}
              name="sectionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a section" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Organize files by section
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Lower numbers appear first
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="min-h-20 resize-none"
                  placeholder="Brief description of this file..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="downloadable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Allow Download
                </FormLabel>
                <FormDescription>
                  When enabled, students can download this file. 
                  When disabled, files are view-only (secure PDF viewer).
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              setSelectedFile(null);
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={uploading || !selectedFile}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload File"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}