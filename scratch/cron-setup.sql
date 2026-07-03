-- Enable pg_cron extension (if not already enabled)
create extension if not exists pg_cron;

-- Enable pg_net extension for HTTP requests
create extension if not exists pg_net;

-- Schedule the sync-matches task every 3 hours
select
  cron.schedule(
    'sync-matches-every-3-hours',
    '0 */3 * * *',
    $$
    select
      net.http_get(
          -- Ganti URL di bawah dengan domain production Vercel Anda setelah di-deploy
          url:='https://domain-anda.com/api/cron/sync-matches?secret=super_secret_cron_key_fable_cup_2026'
      ) as request_id;
    $$
  );

-- Catatan:
-- Jika ingin mengetes apakah cron ini jalan, bisa ganti cron time menjadi '* * * * *' (tiap menit) untuk sementara.
-- Untuk melihat status/log dari cron job, jalankan query berikut:
-- select * from cron.job_run_details order by start_time desc limit 10;
