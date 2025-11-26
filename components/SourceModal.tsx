"use client";

import { X, ExternalLink } from "lucide-react";
import { useEffect } from "react";

interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: {
    title: string;
    url: string;
    snippet: string;
  } | null;
}

export default function SourceModal({ isOpen, onClose, source }: SourceModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !source) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900 pr-8">Source Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {source.title}
            </h3>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">URL:</p>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline break-all"
            >
              {source.url}
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
            </a>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Description:</p>
            <p className="text-gray-700 leading-relaxed">{source.snippet}</p>
          </div>
          
          <div className="pt-4 border-t">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Visit Source
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
