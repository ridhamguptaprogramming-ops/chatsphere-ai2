import React from 'react';
import { X, Download } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';

export const ImageViewer: React.FC = () => {
  const { activeImageViewerUrl, openImageViewer } = useChatStore();

  if (!activeImageViewerUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <a
          href={activeImageViewerUrl}
          download="chat_image.png"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors shadow-lg"
          title="Download Image"
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          onClick={() => openImageViewer(null)}
          className="p-2.5 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors shadow-lg"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <img
        src={activeImageViewerUrl}
        alt="Enlarged preview"
        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
      />
    </div>
  );
};
