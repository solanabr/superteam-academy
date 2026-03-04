"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTitle,
  DialogContent,
} from "@/components/ui/dialog";
import {
  FileText,
  File,
  ExternalLink,
  Download,
  Loader2,
} from "lucide-react";

interface CourseFile {
  id: string;
  name: string;
  description?: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  downloadable?: boolean;
}

interface CourseFilesViewerProps {
  courseId: string;
  files: CourseFile[];
}

export function CourseFilesViewer({ courseId, files }: CourseFilesViewerProps) {
  const [selectedFile, setSelectedFile] = useState<CourseFile | null>(null);

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf": return <FileText className="w-5 h-5 text-red-500" />;
      case "pptx":
      case "ppt": return <File className="w-5 h-5 text-orange-500" />;
      case "docx":
      case "doc": return <File className="w-5 h-5 text-blue-500" />;
      case "xlsx":
      case "xls": return <File className="w-5 h-5 text-green-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + " MB";

  return (
    <>
      <div className="space-y-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => setSelectedFile(file)}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 mt-0.5">{getFileIcon(file.fileType)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium break-all">{file.name}</p>
                {file.description && (
                  <p className="text-sm text-muted-foreground break-words mt-1">{file.description}</p>
                )}
                <p className="text-xs text-muted-foreground break-all mt-1">
                  {file.fileName} • {formatFileSize(file.fileSize)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:flex-shrink-0 sm:ml-4">
              <Button size="sm" variant="default" className="flex-1 sm:flex-initial">
                <ExternalLink className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Open</span>
              </Button>

              {file.downloadable && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-initial"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const res = await fetch(`/api/courses/${courseId}/files/${file.id}/download`);
                    const { url } = await res.json();
                    window.open(url, "_blank");
                  }}
                >
                  <Download className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base md:text-lg font-semibold break-words pr-4">
                {selectedFile?.name}
              </DialogTitle>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {selectedFile && (
              <SecurePDFViewer
                courseId={courseId}
                fileId={selectedFile.id}
                fileName={selectedFile.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SecurePDFViewer({ courseId, fileId }: { courseId: string; fileId: string; fileName: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    const loadLibrary = async () => {
      // @ts-expect-error: necessary because TS cannot infer type correctly here
      if (window.pdfjsLib) {
        loadPDF();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.async = true;
      script.onload = () => {
        // @ts-expect-error: necessary because TS cannot infer type correctly here
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        loadPDF();
      };
      document.body.appendChild(script);
    };

    loadLibrary();
  }, [fileId]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);
      // Passing URL directly to getDocument allows for internal streaming optimization
      const url = `/api/courses/${courseId}/files/${fileId}/view`;
      // @ts-expect-error: necessary because TS cannot infer type correctly here
      const loadingTask = window.pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setLoading(false);
    } catch (err) {
      setError("Failed to load document");
      setLoading(false);
    }
  };

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    const page = await pdfDoc.getPage(pageNum);
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const viewport = page.getViewport({ scale });
    
    const outputScale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height = Math.floor(viewport.height) + "px";

    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      transform: transform,
    };

    renderTaskRef.current = page.render(renderContext);
    
    try {
      await renderTaskRef.current.promise;
    } catch (err) {
    }
  }, [pdfDoc, scale]);

  useEffect(() => {
    if (pdfDoc) renderPage(currentPage);
  }, [currentPage, scale, pdfDoc, renderPage]);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 3.0));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.5));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <FileText className="w-12 h-12 text-red-500" />
        <p className="text-sm text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-2 border-b bg-white flex-shrink-0">
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
            Prev
          </Button>
          <span className="text-xs font-medium min-w-[60px] text-center">
            {currentPage} / {numPages}
          </span>
          <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.min(p + 1, numPages))} disabled={currentPage === numPages}>
            Next
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" onClick={handleZoomOut} className="h-8 w-8 p-0">-</Button>
          <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button size="sm" variant="outline" onClick={handleZoomIn} className="h-8 w-8 p-0">+</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="shadow-2xl bg-white transition-transform duration-200"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>
    </div>
  );
}