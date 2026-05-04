-- Create the trigger that fires before each row update on active_battles
-- to atomically flip status to 'active' when both players are ready
CREATE TRIGGER active_battles_autostart_trigger
  BEFORE UPDATE ON public.active_battles
  FOR EACH ROW
  EXECUTE FUNCTION public.active_battles_autostart();