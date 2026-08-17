DROP POLICY "products_public_read" ON public.products;
CREATE POLICY "products_anon_read_active" ON public.products FOR SELECT TO anon USING (is_active);
CREATE POLICY "products_auth_read" ON public.products FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;