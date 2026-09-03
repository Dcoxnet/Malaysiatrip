"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "print" | "process" | "reserve";
type Folder = "Абдуали" | "Бахыткуль" | "Immigration";
type Doc = { id: string; title: string; note: string; status: Status; folders: Folder[]; tag: string };

const STORAGE_KEY = "imas_visa_checklist_state_v2";
const status: Record<Status, { title: string; color: string }> = {
  print: { title: "Печатать сейчас", color: "#b44734" },
  process: { title: "В процессе", color: "#2f5f8f" },
  reserve: { title: "Резерв / позже", color: "#1f7a55" },
};
const docs: Doc[] = [
  { id:"passport-son",title:"Паспорт Абдуали",note:"Новый паспорт — копии всех страниц",status:"print",folders:["Абдуали"],tag:"обязательно" },
  { id:"passport-mother",title:"Паспорт Бахыткуль",note:"Страница данных, последний въезд и current pass",status:"print",folders:["Бахыткуль","Immigration"],tag:"обязательно" },
  { id:"passports-imm",title:"Паспорта для Immigration",note:"Data page + въездной штамп, оригиналы с собой",status:"print",folders:["Immigration"],tag:"обязательно" },
  { id:"imm55",title:"IMM.55",note:"По 2 экземпляра на каждого заявителя",status:"print",folders:["Immigration"],tag:"форма" },
  { id:"birth",title:"Свидетельство о рождении",note:"Страницы 1–6 + заверенный английский перевод",status:"print",folders:["Абдуали","Бахыткуль","Immigration"],tag:"печать" },
  { id:"photos",title:"Фотографии 35×50 мм",note:"По 4 фотографии на синем фоне",status:"print",folders:["Абдуали","Бахыткуль"],tag:"подготовить" },
  { id:"offer",title:"Offer Letter IMAS",note:"Полный PDF + 2 копии первой страницы",status:"process",folders:["Абдуали","Immigration"],tag:"печать" },
  { id:"confirmation",title:"Confirmation Letter IMAS",note:"Добавить сразу после получения от школы",status:"process",folders:["Абдуали","Immigration"],tag:"ждём" },
  { id:"receipts",title:"Квитанции IMAS",note:"School fees, registration и Visa Fee Receipt",status:"process",folders:["Абдуали","Бахыткуль","Immigration"],tag:"собрать" },
  { id:"moe",title:"Документы MOE / KPM",note:"Полученные approval и support letters",status:"process",folders:["Абдуали","Immigration"],tag:"если есть" },
  { id:"tenancy",title:"Tenancy Agreement",note:"Один экземпляр со stamp / LHDN",status:"reserve",folders:["Бахыткуль","Immigration"],tag:"резерв" },
  { id:"old-passport",title:"Старый паспорт Абдуали",note:"Для объяснения замены паспорта и повторного MOE",status:"reserve",folders:["Абдуали","Immigration"],tag:"резерв" },
  { id:"bank",title:"Bank statements",note:"3 месяца, остаток от RM10,000",status:"reserve",folders:["Бахыткуль"],tag:"Guardian Pass" },
  { id:"family",title:"Embassy Family Letter",note:"Добавить после получения",status:"reserve",folders:["Абдуали","Бахыткуль"],tag:"позже" },
  { id:"ticket",title:"Билет / itinerary",note:"Держать в резерве, если уже есть",status:"reserve",folders:["Immigration"],tag:"по запросу" },
];

export default function Home() {
  const [client] = useState(() => createClient());
  const [ready,setReady] = useState(false);
  const [session,setSession] = useState<Awaited<ReturnType<NonNullable<typeof client>["auth"]["getSession"]>>["data"]["session"]>(null);
  const [checked,setChecked] = useState<Record<string,boolean>>({});
  const [filter,setFilter] = useState<"all"|Status>("all");
  const [folder,setFolder] = useState<"all"|Folder>("all");
  const [query,setQuery] = useState("");
  const remoteReady = useRef(false);

  useEffect(()=>{
    const frame = requestAnimationFrame(() => {
      setChecked(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"));
      if (!client) setReady(true);
    });
    if (!client) return () => cancelAnimationFrame(frame);
    client.auth.getSession().then(({data})=>{setSession(data.session);setReady(true)});
    const {data:{subscription}}=client.auth.onAuthStateChange((_event,next)=>{remoteReady.current=false;setSession(next)});
    return ()=>{ cancelAnimationFrame(frame); subscription.unsubscribe(); };
  },[client]);
  useEffect(()=>{
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY,JSON.stringify(checked));
    if (!client || !session || !remoteReady.current) return;
    const timer=setTimeout(()=>client.from("checklist_progress").upsert({user_id:session.user.id,checked}),450);
    return ()=>clearTimeout(timer);
  },[checked,client,ready,session]);

  useEffect(()=>{
    if(!client||!session||remoteReady.current)return;
    let active=true;
    client.from("checklist_progress").select("checked").eq("user_id",session.user.id).maybeSingle().then(({data})=>{
      if(!active)return;
      setChecked(current=>({...current,...(data?.checked??{})}));
      remoteReady.current=true;
    });
    return()=>{active=false};
  },[client,session]);

  const visible=useMemo(()=>docs.filter(d=>(filter==="all"||d.status===filter)&&(folder==="all"||d.folders.includes(folder))&&`${d.title} ${d.note}`.toLowerCase().includes(query.toLowerCase())),[filter,folder,query]);
  const complete=docs.filter(d=>checked[d.id]).length;
  const progress=Math.round(complete/docs.length*100);
  const login=()=>client?.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${location.origin}/auth/callback`}});

  if(!ready) return <Splash text="Загрузка"/>;
  if(!client) return <Splash text="Авторизация не настроена"/>;
  if(!session) return <main className="grid min-h-screen place-items-center bg-[#f5f2e9] p-4"><section className="w-full max-w-md rounded-2xl border border-[#dcd8cb] bg-white p-8"><p className="text-xs font-bold text-[#7d6b3d]">SPECIAL PASS FILES</p><h1 className="mt-4 text-3xl font-bold">Вход в папки документов</h1><button onClick={login} className="mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#dcd8cb] font-semibold"><Image src="/google.svg" alt="" width={20} height={20}/>Войти через Google</button></section></main>;

  return <div className="min-h-screen bg-[#f5f2e9] text-[#2d2926]">
    <header className="sticky top-0 z-30 border-b border-[#dcd8cb] bg-white/95"><div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 lg:px-12"><button onClick={()=>setFolder("all")} className="flex items-center gap-3 font-bold"><span className="grid size-9 place-items-center rounded-lg bg-[#7d6b3d] text-xs text-white">SP</span>Special Pass Files</button><nav className="hidden gap-6 text-sm md:flex">{(["Абдуали","Бахыткуль","Immigration"] as Folder[]).map(x=><button key={x} onClick={()=>setFolder(x)}>{x}</button>)}</nav><button onClick={()=>client.auth.signOut()} className="rounded-lg border px-3 py-2 text-xs font-semibold">Выйти</button></div></header>
    <main className="mx-auto max-w-[1440px] px-4 py-6 lg:px-12">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <section className="rounded-2xl bg-[#2d2926] p-6 text-[#f5f2e9] sm:flex sm:items-end sm:justify-between sm:p-8"><div className="max-w-xl"><p className="font-mono text-[11px] font-bold text-[#d7cdae]">SPECIAL PASS • IMMIGRATION MALAYSIA</p><h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Папки для Special Pass и Student Pass</h1><p className="mt-3 text-sm text-[#ede6d6]">Только нужные документы для Абдуали, Бахыткуль и Immigration.</p></div><div className="mt-5 w-full rounded-xl border border-white/15 bg-white/10 p-4 sm:mt-0 sm:w-52"><div className="flex items-end justify-between"><span className="text-xs">Готовность</span><b className="font-mono text-3xl">{progress}%</b></div><div className="mt-3 h-2 rounded bg-white/15"><div className="h-full rounded bg-[#d7cdae]" style={{width:`${progress}%`}}/></div><p className="mt-2 text-[11px] text-white/60">{complete} из {docs.length}</p></div></section>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск по документам" className="h-11 flex-1 rounded-lg border border-[#dcd8cb] bg-white px-4 text-sm outline-none"/><div className="flex gap-1 overflow-auto rounded-lg bg-[#eee8d8] p-1">{(["all","print","process","reserve"] as const).map(x=><button key={x} onClick={()=>setFilter(x)} className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold ${filter===x?"bg-white shadow":""}`}>{x==="all"?"Все":status[x].title}</button>)}</div></div>
          <div className="mt-5 grid gap-4 xl:grid-cols-3">{(["print","process","reserve"] as Status[]).map(s=><section key={s} className="rounded-xl border border-[#dcd8cb] bg-white p-3"><div className="flex justify-between p-1"><h2 className="font-bold">{status[s].title}</h2><span className="rounded-full bg-[#eee8d8] px-2 font-mono text-xs">{visible.filter(d=>d.status===s).length}</span></div><div className="mt-3 space-y-2">{visible.filter(d=>d.status===s).map(d=><button key={d.id} onClick={()=>setChecked(c=>({...c,[d.id]:!c[d.id]}))} className={`w-full rounded-lg border p-3 text-left ${checked[d.id]?"border-[#8cc4aa] bg-[#edf7f1]":"border-[#e3dfd4] bg-[#faf9f4]"}`}><div className="flex gap-2"><span className={`grid size-5 shrink-0 place-items-center rounded border text-xs ${checked[d.id]?"bg-[#1f7a55] text-white":""}`}>{checked[d.id]?"✓":""}</span><span><b className="block text-sm">{d.title}</b><span className="mt-1 block text-xs leading-5 text-[#5e5954]">{d.note}</span></span></div><div className="mt-2 flex justify-between pl-7 font-mono text-[9px]"><span style={{color:status[s].color}}>{d.tag}</span><span>{d.folders.join(" · ")}</span></div></button>)}</div></section>)}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3"><Info title="Адрес" text="No. 15, Block 2G4, Persiaran Perdana, Presint 2, Putrajaya"/><Info title="Печать рядом" text="Printec Putrajaya, Shaftsbury Putrajaya, Presint 1"/><Info title="Главное" text="Оригиналы обоих паспортов взять с собой"/></div>
        </div>
        <aside className="space-y-4"><Panel title="Сводка папок"><Row a="Папки" b="3"/><Row a="Срок пребывания" b="11 сент. 2026"/><Row a="Документы" b={String(docs.length)}/></Panel><Panel title="Ближайшие действия"><Action when="Сейчас" text="Разложить паспорта и IMM.55"/><Action when="После" text="Добавить Confirmation Letter IMAS"/><Action when="Печать" text="Offer Letter и свидетельство о рождении"/></Panel><Panel title="Папки">{(["Абдуали","Бахыткуль","Immigration"] as Folder[]).map(x=><button key={x} onClick={()=>setFolder(folder===x?"all":x)} className={`mb-2 flex w-full items-center justify-between rounded-lg p-3 text-sm ${folder===x?"bg-[#eee8d8]":"bg-[#faf9f4]"}`}><b>{x}</b><span>{docs.filter(d=>d.folders.includes(x)).length}</span></button>)}</Panel></aside>
      </div>
    </main>
  </div>;
}

function Splash({text}:{text:string}){return <main className="grid min-h-screen place-items-center bg-[#f5f2e9]"><h1 className="text-2xl font-bold">{text}</h1></main>}
function Panel({title,children}:{title:string;children:React.ReactNode}){return <section className="rounded-xl border border-[#dcd8cb] bg-white p-5"><h2 className="mb-4 font-bold">{title}</h2>{children}</section>}
function Row({a,b}:{a:string;b:string}){return <div className="mb-3 flex justify-between text-sm"><span className="text-[#77716a]">{a}</span><b className="font-mono text-xs">{b}</b></div>}
function Action({when,text}:{when:string;text:string}){return <div className="mb-4 flex gap-3"><span className="w-12 shrink-0 font-mono text-[9px] font-bold uppercase text-[#2f5f8f]">{when}</span><p className="text-sm font-semibold">{text}</p></div>}
function Info({title,text}:{title:string;text:string}){return <section className="rounded-xl border border-[#dcd8cb] bg-white p-4"><p className="font-mono text-[10px] font-bold uppercase text-[#7d6b3d]">{title}</p><p className="mt-2 text-sm leading-5">{text}</p></section>}
