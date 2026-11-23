create unique index if not exists moderation_appeals_one_per_report
  on public.moderation_appeals(report_id);

create or replace function public.synctra_appeal_queue()
returns table(appeal_id uuid, report_id uuid, appellant_id uuid, appellant_name text, appellant_username text, appeal_reason text, appeal_status text, appeal_created_at timestamptz, target_type text, report_reason text, report_status text)
language plpgsql security definer
set search_path = public, synctra_private, pg_temp
as $function$
begin
  if not synctra_private.is_moderator() then raise exception 'Moderator access required'; end if;
  return query
  select a.id, a.report_id, a.appellant_id, coalesce(p.display_name,'SyncTrA member'), coalesce(p.username,''),
         a.appeal_reason, a.appeal_status, a.created_at, r.target_type, r.reason, r.report_status
  from public.moderation_appeals a
  join public.content_reports r on r.id=a.report_id
  left join public.profiles p on p.user_id=a.appellant_id
  where a.appeal_status in ('open','reviewing')
  order by a.created_at asc limit 200;
end;
$function$;

create or replace function public.synctra_review_appeal(p_appeal_id uuid,p_status text,p_note text default '')
returns void language plpgsql security definer
set search_path = public, synctra_private, pg_temp
as $function$
declare v_old text; v_report_id uuid; v_target_type text; v_target_id uuid;
begin
  if not synctra_private.is_moderator() then raise exception 'Moderator access required'; end if;
  if p_status not in ('reviewing','accepted','rejected') then raise exception 'Invalid appeal status'; end if;
  if length(coalesce(p_note,''))>2000 then raise exception 'Moderator note too long'; end if;
  select a.appeal_status,a.report_id,r.target_type,r.target_id into v_old,v_report_id,v_target_type,v_target_id
  from public.moderation_appeals a join public.content_reports r on r.id=a.report_id
  where a.id=p_appeal_id for update of a;
  if not found then raise exception 'Appeal not found'; end if;
  update public.moderation_appeals set appeal_status=p_status,moderator_note=coalesce(p_note,''),
    resolved_at=case when p_status in ('accepted','rejected') then now() else null end,
    resolved_by=case when p_status in ('accepted','rejected') then auth.uid() else null end
  where id=p_appeal_id;
  if p_status='accepted' and v_target_type='community_message' then
    update public.community_messages set moderation_status='published' where id=v_target_id and moderation_status='removed';
  end if;
  insert into public.audit_logs(actor_id,action,target_type,target_id,metadata)
  values(auth.uid(),'appeal_'||p_status,'moderation_appeal',p_appeal_id,
    jsonb_build_object('report_id',v_report_id,'target_type',v_target_type,'target_id',v_target_id,
      'previous_status',v_old,'content_restored',(p_status='accepted' and v_target_type='community_message'),'note',coalesce(p_note,'')));
end;
$function$;
revoke all on function public.synctra_appeal_queue() from public,anon;
revoke all on function public.synctra_review_appeal(uuid,text,text) from public,anon;
grant execute on function public.synctra_appeal_queue() to authenticated;
grant execute on function public.synctra_review_appeal(uuid,text,text) to authenticated;
