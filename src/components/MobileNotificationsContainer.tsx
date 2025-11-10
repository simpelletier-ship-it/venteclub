import { AnimatePresence } from "framer-motion";
import { MobileNotification } from "./MobileNotification";
import { useMobileNotifications } from "@/hooks/useMobileNotifications";

export const MobileNotificationsContainer = () => {
  const { notifications, hideNotification } = useMobileNotifications();

  return (
    <AnimatePresence>
      {notifications.map((notification) => (
        <MobileNotification
          key={notification.id}
          title={notification.title}
          message={notification.message}
          variant={notification.variant}
          duration={notification.duration}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </AnimatePresence>
  );
};
