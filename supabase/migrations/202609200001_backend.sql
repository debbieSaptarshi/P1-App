-- Private, versioned per-feature records. Only the API may write; JWT clients
-- can read their own records. Validation is shared by Expo and the API.
create table public.account_revisions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0)
);
create table public.app_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  collection text not null check (collection in ('profile','onboarding','foods','food_entries','hydration','saved_foods','recipes','exercise','weights','steps','preferences')),
  id text not null check (length(id) between 1 and 120),
  schema_version integer not null default 1,
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 200000),
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, id)
);
create index records_date on public.app_records(user_id, collection, (data->>'date'));
create table public.sync_mutations (
  user_id uuid not null references auth.users(id) on delete cascade,
  mutation_id uuid not null,
  revision bigint not null,
  created_at timestamptz not null default now(),
  primary key(user_id, mutation_id)
);
create table public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_key uuid not null,
  task text not null,
  status text not null default 'pending' check (status in ('pending','completed','failed')),
  provider text not null, model text not null, prompt_version text not null,
  result jsonb, error_code text, input_tokens integer, output_tokens integer,
  created_at timestamptz not null default now(), completed_at timestamptz,
  unique(user_id, request_key)
);
create index ai_requests_quota on public.ai_requests(user_id, created_at);

create table public.community_groups (
 id text primary key, name text not null, description text not null,
 category text not null check(category in ('weight_loss','nutrition','exercise','general'))
);
create table public.group_members (
 group_id text not null references public.community_groups(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(group_id,user_id)
);
create table public.community_posts (
 id uuid primary key default gen_random_uuid(), group_id text not null references public.community_groups(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 author_name text not null, body text not null check(length(body) between 1 and 3000),
 created_at timestamptz not null default now()
);
create index posts_feed on public.community_posts(created_at desc, id);
create index posts_group on public.community_posts(group_id, created_at desc);
create index posts_owner on public.community_posts(user_id);
create table public.post_likes (
 post_id uuid not null references public.community_posts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, primary key(post_id,user_id)
);
create table public.post_comments (
 id uuid primary key default gen_random_uuid(), post_id uuid not null references public.community_posts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 author_name text not null, body text not null check(length(body) between 1 and 3000), created_at timestamptz not null default now()
);
create index comments_post on public.post_comments(post_id, created_at);
create index comments_owner on public.post_comments(user_id);
create table public.challenges (
 id text primary key, title text not null, description text not null, reward text not null,
 ends_at timestamptz not null
);
create table public.challenge_members (
 challenge_id text not null references public.challenges(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, primary key(challenge_id,user_id)
);
create table public.content_reports (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 post_id uuid references public.community_posts(id) on delete cascade,
 reason text not null check(length(reason) between 1 and 1000), created_at timestamptz not null default now()
);
create table public.user_blocks (
 user_id uuid not null references auth.users(id) on delete cascade,
 blocked_id uuid not null references auth.users(id) on delete cascade,
 primary key(user_id,blocked_id), check(user_id <> blocked_id)
);

-- Explicit grants: clients never bypass the API's validation/quota checks.
do $$ declare t text; begin
 foreach t in array array['account_revisions','app_records','sync_mutations','ai_requests','community_groups','group_members','community_posts','post_likes','post_comments','challenges','challenge_members','content_reports','user_blocks'] loop
  execute format('alter table public.%I enable row level security', t);
  execute format('revoke all on public.%I from anon, authenticated', t);
  execute format('grant all on public.%I to service_role', t);
 end loop;
end $$;
grant select on public.app_records, public.account_revisions, public.ai_requests to authenticated;
create policy records_owner_read on public.app_records for select to authenticated using(user_id = (select auth.uid()));
create policy revision_owner_read on public.account_revisions for select to authenticated using(user_id = (select auth.uid()));
create policy ai_owner_read on public.ai_requests for select to authenticated using(user_id = (select auth.uid()));

create function public.account_snapshot(p_user uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object('revision', coalesce((select revision from public.account_revisions where user_id=p_user),0),
 'records', coalesce((select jsonb_agg(jsonb_build_object('collection',collection,'id',id,'data',data) order by collection,id)
 from public.app_records where user_id=p_user),'[]'::jsonb));
$$;

create function public.apply_record_changes(p_user uuid, p_mutation uuid, p_expected bigint, p_changes jsonb) returns bigint
language plpgsql security invoker set search_path = '' as $$
declare current_revision bigint; previous_revision bigint; item jsonb;
begin
 if jsonb_typeof(p_changes) <> 'array' or jsonb_array_length(p_changes) not between 1 and 500 then raise exception 'INVALID_CHANGES'; end if;
 insert into public.account_revisions(user_id) values(p_user) on conflict do nothing;
 select revision into current_revision from public.account_revisions where user_id=p_user for update;
 select revision into previous_revision from public.sync_mutations where user_id=p_user and mutation_id=p_mutation;
 if found then return previous_revision; end if;
 if current_revision <> p_expected then raise exception 'REVISION_CONFLICT' using errcode='P0001'; end if;
 for item in select value from jsonb_array_elements(p_changes) loop
  if item->'data' = 'null'::jsonb then
   delete from public.app_records where user_id=p_user and collection=item->>'collection' and id=item->>'id';
  else
   insert into public.app_records(user_id,collection,id,data) values(p_user,item->>'collection',item->>'id',item->'data')
   on conflict(user_id,collection,id) do update set data=excluded.data, updated_at=now();
  end if;
 end loop;
 current_revision := current_revision+1;
 update public.account_revisions set revision=current_revision where user_id=p_user;
 insert into public.sync_mutations(user_id,mutation_id,revision) values(p_user,p_mutation,current_revision);
 return current_revision;
end $$;

-- Serialize reservations per account so quotas hold across API replicas.
create function public.reserve_ai_request(p_user uuid, p_id uuid, p_key uuid, p_task text, p_provider text, p_model text, p_version text, p_limit integer) returns public.ai_requests
language plpgsql security invoker set search_path = '' as $$
declare found_request public.ai_requests; used integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text, 41));
 select * into found_request from public.ai_requests where user_id=p_user and request_key=p_key;
 if found then return found_request; end if;
 select count(*) into used from public.ai_requests where user_id=p_user and created_at > now()-interval '24 hours';
 if used >= p_limit then raise exception 'AI_QUOTA_EXCEEDED'; end if;
 insert into public.ai_requests(id,user_id,request_key,task,provider,model,prompt_version)
 values(p_id,p_user,p_key,p_task,p_provider,p_model,p_version) returning * into found_request;
 return found_request;
end $$;

-- Shared community counts are derived from membership rows, never client counters.
create function public.community_snapshot(p_user uuid) returns jsonb language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object(
 'groups',coalesce((select jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'description',g.description,'category',g.category,
 'members',(select count(*) from public.group_members m where m.group_id=g.id),
 'joined',exists(select 1 from public.group_members m where m.group_id=g.id and m.user_id=p_user))) from public.community_groups g),'[]'::jsonb),
 'groupPosts',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'groupId',p.group_id,'authorName',p.author_name,'authorId',p.user_id,'body',p.body,'createdAt',p.created_at,
 'reactions',(select count(*) from public.post_likes l where l.post_id=p.id),
 'comments',(select count(*) from public.post_comments c where c.post_id=p.id),
 'liked',exists(select 1 from public.post_likes l where l.post_id=p.id and l.user_id=p_user)) order by p.created_at desc)
 from (select * from public.community_posts p where not exists(select 1 from public.user_blocks b where (b.user_id=p_user and b.blocked_id=p.user_id) or (b.blocked_id=p_user and b.user_id=p.user_id)) order by created_at desc limit 100) p),'[]'::jsonb),
 'challenges',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'title',c.title,'description',c.description,'reward',c.reward,
 'daysRemaining',greatest(0,ceil(extract(epoch from (c.ends_at-now()))/86400)),
 'participants',(select count(*) from public.challenge_members m where m.challenge_id=c.id),
 'joined',exists(select 1 from public.challenge_members m where m.challenge_id=c.id and m.user_id=p_user))) from public.challenges c where c.ends_at > now()),'[]'::jsonb),
 'leaderboard',coalesce((select jsonb_agg(jsonb_build_object('rank',rank,'userId',user_id,'displayName',name,'score',score,'highlight',user_id=p_user)) from (
 select m.user_id, coalesce(r.data->>'name','Member') name, count(distinct e.data->>'date') score,
 rank() over(order by count(distinct e.data->>'date') desc,m.user_id) rank
 from (select distinct user_id from public.group_members) m
 left join public.app_records r on r.user_id=m.user_id and r.collection='profile'
 left join public.app_records e on e.user_id=m.user_id and e.collection='food_entries' and e.data->>'date' >= (current_date-29)::text
 where not exists(select 1 from public.user_blocks b where (b.user_id=p_user and b.blocked_id=m.user_id) or (b.blocked_id=p_user and b.user_id=m.user_id))
 group by m.user_id,r.data->>'name' order by score desc,m.user_id limit 100) ranks),'[]'::jsonb));
$$;

revoke all on function public.account_snapshot(uuid), public.apply_record_changes(uuid,uuid,bigint,jsonb), public.reserve_ai_request(uuid,uuid,uuid,text,text,text,text,integer), public.community_snapshot(uuid) from public, anon, authenticated;
grant execute on function public.account_snapshot(uuid), public.apply_record_changes(uuid,uuid,bigint,jsonb), public.reserve_ai_request(uuid,uuid,uuid,text,text,text,text,integer), public.community_snapshot(uuid) to service_role;

-- Public group definitions only; no fabricated members, posts or health logs.
insert into public.community_groups(id,name,description,category) values
 ('everyday-nutrition','Everyday nutrition','Share practical meals and habits. Joining makes your display name and logging-day score visible to other members.','nutrition'),
 ('move-together','Move together','Encourage each other to stay active. Joining makes your display name and logging-day score visible to other members.','exercise');
