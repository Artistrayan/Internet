import { useCallback, useEffect, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowUpFromLine, CircleAlert, CircleCheck, Gauge, Globe2, Play, Radio, Square, Wifi } from 'lucide-react';
import { LiveMeasurementClient, LiveMeasurementResult } from '../core/network/LiveMeasurementClient';

const apiUrl = import.meta.env.VITE_MEASUREMENT_API_URL as string | undefined;

function metric(value: number | null, unit: string, digits = 1): string {
  return value === null ? '—' : `${value.toFixed(digits)} ${unit}`;
}

function MetricCard({ label, value, unit, icon: Icon }: {
  label: string;
  value: number | null;
  unit: string;
  icon: typeof Activity;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-sm">{label}</span>
        <Icon size={18} />
      </div>
      <div className="mt-4 font-mono text-3xl font-semibold text-white">
        {metric(value, unit)}
      </div>
      <p className="mt-2 text-xs text-slate-500">نتیجه اندازه‌گیری زنده؛ بدون مقدار پیش‌فرض</p>
    </section>
  );
}

export function Dashboard() {
  const [result, setResult] = useState<LiveMeasurementResult | null>(null);
  const [running, setRunning] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runMeasurement = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const client = new LiveMeasurementClient(apiUrl);
      const measured = await client.measure();
      setResult(measured);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'اندازه‌گیری انجام نشد.');
    } finally {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    if (!continuous) return;
    void runMeasurement();
    const timer = window.setInterval(() => void runMeasurement(), 60_000);
    return () => window.clearInterval(timer);
  }, [continuous, runMeasurement]);

  const successfulProbes = result?.probeSamples.filter((sample) => sample.succeeded).length ?? null;
  const failedProbes = result?.probeSamples.filter((sample) => !sample.succeeded).length ?? null;

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b13] px-4 py-6 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                <Wifi size={25} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">موتور جامع اینترنت</h1>
                <p className="mt-1 text-sm text-slate-400">هسته اندازه‌گیری واقعی شبکه</p>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              این پنل فقط داده‌ای را نمایش می‌دهد که در همین اتصال و در زمان آزمایش اندازه‌گیری شده باشد.
              تا قبل از اتصال به سرور اندازه‌گیری، هیچ عدد یا امتیازی تولید نمی‌شود.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void runMeasurement()}
              disabled={running || !apiUrl}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play size={16} />
              {running ? 'در حال اندازه‌گیری…' : 'آزمایش واقعی'}
            </button>
            <button
              type="button"
              onClick={() => setContinuous((value) => !value)}
              disabled={!apiUrl}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800 disabled:opacity-40"
            >
              {continuous ? <Square size={16} /> : <Radio size={16} />}
              {continuous ? 'توقف پایش' : 'پایش پیوسته'}
            </button>
          </div>
        </header>

        {!apiUrl && (
          <section className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
            <CircleAlert className="mt-0.5 shrink-0" size={20} />
            <div>
              <h2 className="font-semibold">سرور اندازه‌گیری هنوز پیکربندی نشده است</h2>
              <p className="mt-1 text-sm leading-6 text-amber-100/80">
                متغیر VITE_MEASUREMENT_API_URL باید به آدرس سرور واقعی متصل شود.
                تا آن زمان، نمایش سرعت، پینگ و آمار شبکه غیرفعال می‌ماند.
              </p>
            </div>
          </section>
        )}

        {error && (
          <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            خطای اندازه‌گیری: {error}
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="تأخیر میانگین" value={result?.latencyMs ?? null} unit="ms" icon={Activity} />
          <MetricCard label="نوسان تأخیر" value={result?.jitterMs ?? null} unit="ms" icon={Gauge} />
          <MetricCard label="سرعت دریافت" value={result?.download.megabitsPerSecond ?? null} unit="Mbps" icon={ArrowDownToLine} />
          <MetricCard label="سرعت ارسال" value={result?.upload.megabitsPerSecond ?? null} unit="Mbps" icon={ArrowUpFromLine} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-2">
              <Globe2 className="text-cyan-300" size={19} />
              <h2 className="font-semibold">کیفیت اتصال به نقطه اندازه‌گیری</h2>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-xs text-slate-500">Packet Loss آزمون HTTP</p>
                <p className="mt-2 font-mono text-2xl text-white">{metric(result?.packetLossPercent ?? null, '%')}</p>
              </div>
              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-xs text-slate-500">پروب موفق</p>
                <p className="mt-2 font-mono text-2xl text-white">
                  {successfulProbes === null ? '—' : `${successfulProbes}/5`}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-500">
              این Packet Loss بر اساس درخواست‌های HTTP ناموفق به سرور آزمایش محاسبه می‌شود؛
              معادل اندازه‌گیری افت بسته در سطح IP نیست.
            </p>
            {failedProbes !== null && failedProbes > 0 && (
              <div className="mt-3 space-y-1 text-xs text-rose-300">
                {result?.probeSamples.filter((sample) => !sample.succeeded).map((sample) => (
                  <p key={sample.sequence}>پروب {sample.sequence}: {sample.error}</p>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-2">
              <Activity className="text-cyan-300" size={19} />
              <h2 className="font-semibold">صحت انتقال داده</h2>
            </div>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <span className="text-sm text-slate-400">داده دریافت‌شده</span>
                <span className="font-mono text-sm text-white">
                  {result?.download.bytesTransferred === null || !result ? '—' : `${(result.download.bytesTransferred / 1_048_576).toFixed(2)} MiB`}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <span className="text-sm text-slate-400">داده تأییدشده ارسالی</span>
                <span className="font-mono text-sm text-white">
                  {result?.upload.bytesTransferred === null || !result ? '—' : `${(result.upload.bytesTransferred / 1_048_576).toFixed(2)} MiB`}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-400">زمان آخرین آزمایش</span>
                <span className="font-mono text-xs text-white">
                  {result ? new Date(result.measuredAt).toLocaleString() : 'هنوز اندازه‌گیری نشده'}
                </span>
              </div>
            </div>
            {(result?.download.error || result?.upload.error) && (
              <div className="mt-4 space-y-1 text-xs text-rose-300">
                {result.download.error && <p>دریافت: {result.download.error}</p>}
                {result.upload.error && <p>ارسال: {result.upload.error}</p>}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-2">
            <CircleCheck className="text-cyan-300" size={19} />
            <h2 className="font-semibold">وضعیت قابلیت‌ها</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['اندازه‌گیری واقعی HTTP', apiUrl ? 'آماده پس از اتصال سرور' : 'منتظر پیکربندی سرور'],
              ['موتور مسیریابی تطبیقی', 'پیاده‌سازی نشده'],
              ['تجمیع چند اتصال', 'پیاده‌سازی نشده'],
              ['عامل بومی روتر و سیستم‌عامل', 'پیاده‌سازی نشده'],
            ].map(([name, status]) => (
              <div key={name} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-sm text-slate-300">{name}</p>
                <p className="mt-2 text-xs text-slate-500">{status}</p>
              </div>
            ))}
          </div>
        </section>

        {running && (
          <p className="text-center text-xs text-cyan-300" role="status">
            درخواست‌های واقعی در حال اجرا هستند؛ این صفحه تا پایان انتقال داده عددی نمایش نمی‌دهد.
          </p>
        )}
      </div>
    </main>
  );
}
