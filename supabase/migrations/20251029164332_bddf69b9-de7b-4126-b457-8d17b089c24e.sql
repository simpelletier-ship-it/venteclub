-- Créer un trigger pour notifier lors de nouveaux messages
DROP TRIGGER IF EXISTS on_message_created ON public.messages;

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();