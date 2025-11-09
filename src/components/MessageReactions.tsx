import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface MessageReactionsProps {
  messageId: string;
  reactions: { [emoji: string]: string[] }; // emoji -> [userId1, userId2, ...]
  currentUserId: string;
  onReact: (messageId: string, emoji: string) => void;
}

export const MessageReactions = ({ 
  messageId, 
  reactions, 
  currentUserId, 
  onReact 
}: MessageReactionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const userReaction = Object.keys(reactions || {}).find(emoji => 
    reactions[emoji].includes(currentUserId)
  );

  return (
    <div className="flex items-center gap-1">
      {/* Display existing reactions */}
      <AnimatePresence>
        {Object.entries(reactions || {}).map(([emoji, users]) => (
          users.length > 0 && (
            <motion.button
              key={emoji}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => onReact(messageId, emoji)}
              className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs transition-all ${
                users.includes(currentUserId)
                  ? 'bg-primary/20 ring-1 ring-primary/40'
                  : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              <span>{emoji}</span>
              {users.length > 1 && (
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {users.length}
                </span>
              )}
            </motion.button>
          )
        ))}
      </AnimatePresence>

      {/* Add reaction button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Smile className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {REACTIONS.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  onReact(messageId, emoji);
                  setIsOpen(false);
                }}
                className={`p-2 rounded-lg hover:bg-accent transition-colors ${
                  userReaction === emoji ? 'bg-primary/20' : ''
                }`}
              >
                <span className="text-xl">{emoji}</span>
              </motion.button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
