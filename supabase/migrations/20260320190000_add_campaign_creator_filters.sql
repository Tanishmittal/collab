alter table public.campaigns
  add column if not exists target_platforms text[] not null default '{}',
  add column if not exists min_followers integer,
  add column if not exists min_engagement_rate numeric(5,2),
  add column if not exists verified_socials_only boolean not null default false,
  add column if not exists portfolio_required boolean not null default false;

create or replace function public.parse_influencer_followers(raw_value text)
returns integer
language plpgsql
immutable
as $$
declare
  cleaned text;
  base_value numeric;
begin
  if raw_value is null or btrim(raw_value) = '' then
    return 0;
  end if;

  cleaned := lower(replace(btrim(raw_value), ',', ''));

  if right(cleaned, 1) = 'm' then
    base_value := regexp_replace(left(cleaned, length(cleaned) - 1), '[^0-9\.]', '', 'g')::numeric;
    return round(base_value * 1000000)::integer;
  end if;

  if right(cleaned, 1) = 'k' then
    base_value := regexp_replace(left(cleaned, length(cleaned) - 1), '[^0-9\.]', '', 'g')::numeric;
    return round(base_value * 1000)::integer;
  end if;

  return coalesce(nullif(regexp_replace(cleaned, '[^0-9\.]', '', 'g'), ''), '0')::numeric::integer;
exception
  when others then
    return 0;
end;
$$;

create or replace function public.validate_campaign_application_eligibility()
returns trigger
language plpgsql
as $$
declare
  campaign_record public.campaigns%rowtype;
  influencer_record public.influencer_profiles%rowtype;
  matching_platform boolean;
  portfolio_count integer;
  engagement_value numeric;
begin
  select *
    into campaign_record
  from public.campaigns
  where id = new.campaign_id;

  if not found then
    raise exception 'Campaign not found.';
  end if;

  select *
    into influencer_record
  from public.influencer_profiles
  where id = new.influencer_profile_id;

  if not found then
    raise exception 'Influencer profile not found.';
  end if;

  if campaign_record.city is not null and influencer_record.city is distinct from campaign_record.city then
    raise exception 'This campaign is limited to creators in %.', campaign_record.city;
  end if;

  if campaign_record.niche is not null and influencer_record.niche is distinct from campaign_record.niche then
    raise exception 'This campaign is limited to % creators.', campaign_record.niche;
  end if;

  if coalesce(array_length(campaign_record.target_platforms, 1), 0) > 0 then
    select exists (
      select 1
      from unnest(campaign_record.target_platforms) as platform
      where lower(platform) = any (
        select lower(value) from unnest(coalesce(influencer_record.platforms, '{}')) as value
      )
    )
      into matching_platform;

    if not coalesce(matching_platform, false) then
      raise exception 'This campaign requires %.', array_to_string(campaign_record.target_platforms, ' or ');
    end if;
  end if;

  if campaign_record.min_followers is not null
     and public.parse_influencer_followers(influencer_record.followers) < campaign_record.min_followers then
    raise exception 'This campaign requires at least % followers.', campaign_record.min_followers;
  end if;

  if campaign_record.min_engagement_rate is not null then
    engagement_value := coalesce(nullif(regexp_replace(coalesce(influencer_record.engagement_rate, ''), '[^0-9\.]', '', 'g'), ''), '0')::numeric;
    if engagement_value < campaign_record.min_engagement_rate then
      raise exception 'This campaign requires at least %%% engagement.', campaign_record.min_engagement_rate;
    end if;
  end if;

  if campaign_record.verified_socials_only
     and (
       coalesce(influencer_record.is_verified, false) = false
       or coalesce(array_length(influencer_record.platforms, 1), 0) = 0
     ) then
    raise exception 'This campaign requires verified social accounts.';
  end if;

  if campaign_record.portfolio_required then
    select count(*)
      into portfolio_count
    from public.portfolio_items
    where influencer_profile_id = influencer_record.id;

    if coalesce(portfolio_count, 0) = 0 then
      raise exception 'This campaign requires a published portfolio.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_campaign_application_eligibility_trigger on public.campaign_applications;

create trigger validate_campaign_application_eligibility_trigger
before insert on public.campaign_applications
for each row
execute function public.validate_campaign_application_eligibility();
