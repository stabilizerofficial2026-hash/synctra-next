create or replace function public.synctra_review_report(p_report_id uuid, p_status text, p_note text default '')
returns void
language plpgsql
security definer
set search_path = public, synctra_private, pg_temp
as $function$
declare
  v_old text;
  v_target_type text;
  v_target_id uuid;
begin
  if not synctra_private.is_moderator() then
    raise exception 'Moderator access required';
  end if;
  if p_status not in ('reviewing','actioned','dismissed') then
    raise exception 'Invalid moderation status';
  end if;
  if length(coalesce(p_note,'')) > 2000 then
    raise exception 'Moderator note too long';
  end if;

  select report_status, target_type, target_id
    into v_old, v_target_type, v_target_id
  from public.content_reports
  where id = p_report_id
  for update;
  if not found then
    raise exception 'Report not found';
  end if;

  update public.content_reports
     set report_status = p_status
   where id = p_report_id;

  -- Taking action on a reported Open Minds message removes it from member-visible chat.
  if p_status = 'actioned' and v_target_type = 'community_message' then
    update public.community_messages
       set moderation_status = 'removed'
     where id = v_target_id;
  end if;

  insert into public.audit_logs(actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(),
    'report_' || p_status,
    'report',
    p_report_id,
    jsonb_build_object(
      'previous_status', v_old,
      'target_type', v_target_type,
      'target_id', v_target_id,
      'content_action', case when p_status = 'actioned' and v_target_type = 'community_message' then 'message_hidden' else 'none' end,
      'note', coalesce(p_note,'')
    )
  );
end;
$function$;
revoke all on function public.synctra_review_report(uuid,text,text) from public;
grant execute on function public.synctra_review_report(uuid,text,text) to authenticated;
