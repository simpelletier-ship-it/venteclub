import { motion, PanInfo, useAnimation } from "framer-motion";
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNotificationProps {
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
  variant?: "default" | "success" | "warning" | "error";
}

export const MobileNotification = ({
  title,
  message,
  onClose,
  duration = 5000,
  variant = "default",
}: MobileNotificationProps) => {
  const controls = useAnimation();

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleDismiss = async () => {
    await controls.start({
      y: -100,
      opacity: 0,
      transition: { duration: 0.3 },
    });
    onClose();
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -50 || info.velocity.y < -500) {
      handleDismiss();
    } else {
      controls.start({ y: 0 });
    }
  };

  const variantStyles = {
    default: "bg-background border-border",
    success: "bg-green-500/10 border-green-500/20",
    warning: "bg-yellow-500/10 border-yellow-500/20",
    error: "bg-red-500/10 border-red-500/20",
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={controls}
      exit={{ y: -100, opacity: 0 }}
      drag="y"
      dragConstraints={{ top: -100, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className={cn(
        "fixed top-4 left-4 right-4 z-[100] p-4 rounded-lg border shadow-lg backdrop-blur-sm",
        variantStyles[variant]
      )}
      style={{ y: 0 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="w-12 h-1 mx-auto bg-muted-foreground/20 rounded-full" />
      </div>
    </motion.div>
  );
};
