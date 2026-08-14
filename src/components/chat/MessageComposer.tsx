import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import {
  Smile,
  Paperclip,
  Send,
  X,
  Image as ImageIcon,
  FileText,
  Mic,
} from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { storageService } from '../../services/storageService';
import { useToastStore } from '../../stores/toastStore';

export const MessageComposer: React.FC = () => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    sendMessage,
    replyingToMessage,
    setReplyingToMessage,
    editingMessage,
    setEditingMessage,
    editMessage,
    sendTypingSignal,
  } = useChatStore();

  const { addToast } = useToastStore();

  // Populate message text if editing
  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    sendTypingSignal(e.target.value.trim().length > 0);

    // Auto resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const text = content.trim();
    if (!text && !editingMessage) return;

    if (editingMessage) {
      await editMessage(editingMessage.id, text);
      setContent('');
      setEditingMessage(null);
      return;
    }

    if (text) {
      await sendMessage(text, 'text');
      setContent('');
      sendTypingSignal(false);
      setShowEmojiPicker(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'File too large',
        message: 'Please select a file smaller than 25MB.',
      });
      return;
    }

    setIsUploading(true);
    setShowAttachMenu(false);

    try {
      const bucket = type === 'image' ? 'chat-media' : 'documents';
      const result = await storageService.uploadFile(file, bucket);

      await sendMessage(
        type === 'image' ? 'Sent a photo' : file.name,
        type,
        result.url,
        result.name,
        result.size
      );

      addToast({
        type: 'success',
        title: 'File uploaded',
        message: `${file.name} sent successfully.`,
      });
    } catch (err) {
      console.error('File upload error:', err);
      addToast({
        type: 'error',
        title: 'Upload failed',
        message: 'Could not upload file. Please try again.',
      });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="relative bg-[#0B0B0B] border-t border-[#262626] p-4 sm:p-6 z-20">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'image')}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.doc,.docx,.txt,.zip,.csv"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'file')}
      />

      {/* Replying Preview Bar */}
      {replyingToMessage && (
        <div className="flex items-center justify-between mb-3 p-3 bg-[#1A1A1A] rounded-2xl border-l-4 border-[#FF7A00] text-xs">
          <div className="min-w-0 pr-2">
            <span className="font-bold text-[#FF7A00]">
              Replying to {replyingToMessage.sender?.full_name || 'Message'}
            </span>
            <p className="text-gray-300 truncate mt-0.5">{replyingToMessage.content}</p>
          </div>
          <button
            onClick={() => setReplyingToMessage(null)}
            className="p-1 text-gray-400 hover:text-white rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editing Message Bar */}
      {editingMessage && (
        <div className="flex items-center justify-between mb-3 p-3 bg-[#1A1A1A] rounded-2xl border-l-4 border-amber-500 text-xs">
          <div>
            <span className="font-bold text-amber-400">Editing Message</span>
            <p className="text-gray-300 truncate mt-0.5">{editingMessage.content}</p>
          </div>
          <button
            onClick={() => {
              setEditingMessage(null);
              setContent('');
            }}
            className="p-1 text-gray-400 hover:text-white rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-40 shadow-2xl rounded-2xl overflow-hidden border border-[#262626]">
          <EmojiPicker
            theme={EmojiTheme.DARK}
            onEmojiClick={(emojiData) => {
              setContent((prev) => prev + emojiData.emoji);
            }}
          />
        </div>
      )}

      {/* Attachment Options Menu Popover */}
      {showAttachMenu && (
        <div className="absolute bottom-20 left-12 z-40 bg-[#1A1A1A] border border-[#262626] rounded-2xl shadow-2xl p-2 flex flex-col gap-1 w-48 animate-in fade-in zoom-in-95">
          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-3 p-2.5 text-xs text-gray-200 hover:bg-[#222222] rounded-xl transition-colors text-left"
          >
            <ImageIcon className="w-4 h-4 text-[#FF7A00]" />
            <span>Photos & Videos</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 p-2.5 text-xs text-gray-200 hover:bg-[#222222] rounded-xl transition-colors text-left"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Documents & Files</span>
          </button>
        </div>
      )}

      {/* Main Composer Input Bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 text-gray-400">
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachMenu(false);
            }}
            className="hover:text-white transition-colors p-1"
            title="Emojis"
          >
            <Smile className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              setShowAttachMenu(!showAttachMenu);
              setShowEmojiPicker(false);
            }}
            className="hover:text-white transition-colors p-1"
            title="Attach media"
          >
            <Paperclip className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full bg-[#1A1A1A] border-none rounded-2xl py-3 px-5 text-[15px] focus:ring-1 focus:ring-[#FF7A00] outline-none text-gray-300 shadow-inner resize-none max-h-32 scrollbar-thin"
          />
        </div>

        {content.trim() || editingMessage ? (
          <button
            onClick={handleSend}
            disabled={isUploading}
            className="w-12 h-12 bg-[#FF7A00] rounded-2xl flex items-center justify-center text-black shadow-lg hover:scale-105 transition-transform shrink-0 disabled:opacity-50"
            title="Send"
          >
            <Send className="w-5 h-5 fill-black" />
          </button>
        ) : (
          <button
            onClick={() => {
              addToast({
                type: 'info',
                title: 'Microphone feature',
                message: 'Voice recording mode ready.',
              });
            }}
            className="w-12 h-12 bg-[#1A1A1A] hover:bg-[#222222] rounded-2xl flex items-center justify-center text-gray-400 hover:text-white transition-all shrink-0"
            title="Voice Note"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
