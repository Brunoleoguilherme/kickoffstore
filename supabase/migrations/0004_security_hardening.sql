-- Clube da Estampa — Security hardening (advisors follow-up)

-- 1) grant_role_by_email is a privilege-granting SECURITY DEFINER function.
--    It must NOT be callable via the public API. Only usable via service role /
--    SQL editor for one-time bootstrap.
revoke all on function public.grant_role_by_email(text, text) from public;
revoke all on function public.grant_role_by_email(text, text) from anon;
revoke all on function public.grant_role_by_email(text, text) from authenticated;

-- 2) handle_new_user is a trigger function; it should not be RPC-callable.
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

-- 3) current_user_permissions: only signed-in users need it, not anon.
revoke all on function public.current_user_permissions() from public;
revoke all on function public.current_user_permissions() from anon;
grant execute on function public.current_user_permissions() to authenticated;

-- 4) Pin search_path on remaining functions (linter WARN 0011).
alter function public.set_updated_at() set search_path = public;
alter function public.search_products(text, integer, integer) set search_path = public;
