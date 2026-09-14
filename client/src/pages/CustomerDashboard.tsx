import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function CustomerDashboard() {
  const me = useQuery(trpc.auth.me.queryOptions());

  if (me.isLoading) return <main className="min-h-screen grid place-items-center bg-[#09090b] text-white">Carregando sua área...</main>;
  if (!me.data) return <main className="min-h-screen grid place-items-center bg-[#09090b] text-white"><section className="rounded-2xl border border-white/10 bg-white/[.04] p-8 text-center"><h1 className="text-2xl font-semibold">Área do cliente</h1><p className="mt-2 text-white/60">Entre na sua conta para continuar.</p><Link href="/" className="mt-6 inline-flex rounded-xl bg-red-600 px-5 py-3">Entrar</Link></section></main>;

  return <main className="min-h-screen bg-[#09090b] text-white"><div className="mx-auto max-w-6xl px-6 py-10"><header className="mb-8"><p className="text-xs uppercase tracking-[.2em] text-red-400">snyx.store.api</p><h1 className="mt-2 text-3xl font-bold">Área do cliente</h1><p className="mt-1 text-white/60">Olá, {me.data.name || me.data.email}.</p></header><div className="grid gap-5 md:grid-cols-3"><Card title="Minha conta"><p className="text-sm text-white/60">E-mail</p><p className="mt-1 break-all">{me.data.email}</p><p className="mt-4 text-sm text-white/60">Acesso</p><p className="mt-1">Cliente</p></Card><Card title="Minha licença"><p className="text-sm text-white/60">Status</p><p className="mt-1 text-emerald-400">Conta ativa</p><p className="mt-4 text-sm text-white/60">Licença</p><p className="mt-1 text-white/70">Os dados da sua licença aparecerão aqui quando vinculados à conta.</p></Card><Card title="Suporte"><p className="text-white/70">Precisa de ajuda com sua licença ou extensão?</p><a href="mailto:suporte@snyx.store.api" className="mt-5 inline-flex rounded-xl bg-red-600 px-4 py-2">Falar com suporte</a></Card></div></div></main>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><h2 className="text-lg font-semibold">{title}</h2><div className="mt-5">{children}</div></section>; }
