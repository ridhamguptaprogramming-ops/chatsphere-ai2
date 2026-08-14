import React from 'react';

interface ReactionPickerProps {
  onSelectReaction: (emoji: string) => void;
  onClose: () => void;
}

const COMMON_REACTIONS = ['❤️', '😂', '👍', '😮', '😢', '🔥', '🎉', '🙏'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onSelectReaction,
  onClose,
}) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-1 p-1.5 bg-neutral-900 border border-neutral-700/80 rounded-full shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 z-30"
    >
      {COMMON_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelectReaction(emoji);
            onClose();
          }}
          className="p-1.5 text-lg hover:scale-125 transition-transform rounded-full hover:bg-neutral-800"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
