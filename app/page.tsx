"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "print" | "process" | "reserve";
type Section = "immigration" | "school";
type Person = "mother" | "brother";
type Destination = "immigration" | "school-mother" | "school-brother";
type Doc = { id: string; title: string; note: string; status: Status; section: Section; person?: Person; tag: string };

const STORAGE_KEY = "imas_visa_checklist_state_v2";
const status: Record<Status, { title: string; color: string }> = {
  print: { title: "Печатать сейчас", color: "#b44734" },
  process: { title: "В процессе", color: "#2f5f8f" },
  reserve: { title: "Резерв / позже", color: "#1f7a55" },
};
const docs: Doc[] = [
  { id:"imm-passports",title:"Паспорта мамы и братишки",note:"Data page + последний въезд / current pass, оригиналы с собой",status:"print",section:"immigration",tag:"общий файл" },
  { id:"imm55",title:"IMM.55",note:"По 2 экземпляра на каждого заявителя",status:"print",section:"immigration",tag:"общая подача" },
  { id:"imm-birth",title:"Свидетельство о рождении",note:"Страницы 1–6 + заверенный английский перевод",status:"print",section:"immigration",tag:"подтверждение родства" },
  { id:"imm-offer",title:"Offer Letter IMAS",note:"Полный PDF + отдельная копия первой страницы",status:"process",section:"immigration",tag:"подтверждение школы" },
  { id:"imm-confirmation",title:"Confirmation Letter IMAS",note:"Добавить сразу после получения от школы",status:"process",section:"immigration",tag:"самое важное" },
  { id:"imm-receipts",title:"Квитанции IMAS",note:"Оплата школы и Visa Fee Receipt",status:"process",section:"immigration",tag:"общий пакет" },
  { id:"imm-tenancy",title:"Tenancy Agreement",note:"Один экземпляр со stamp / LHDN",status:"reserve",section:"immigration",tag:"по запросу" },
  { id:"imm-old-passport",title:"Старый паспорт братишки",note:"Для объяснения замены паспорта и повторного MOE",status:"reserve",section:"immigration",tag:"по запросу" },
  { id:"brother-passport",title:"Новый паспорт",note:"Копии всех страниц",status:"print",section:"school",person:"brother",tag:"Student Pass" },
  { id:"brother-photos",title:"Фотографии 35×50 мм",note:"4 фотографии на синем фоне",status:"print",section:"school",person:"brother",tag:"Student Pass" },
  { id:"brother-birth",title:"Свидетельство о рождении",note:"Оригинал, копия и заверенный перевод",status:"print",section:"school",person:"brother",tag:"Student Pass" },
  { id:"brother-moe",title:"Документы MOE / KPM",note:"Полученные approval и support letters",status:"process",section:"school",person:"brother",tag:"Student Pass" },
  { id:"mother-passport",title:"Паспорт мамы",note:"Копии всех страниц",status:"print",section:"school",person:"mother",tag:"Guardian Pass" },
  { id:"mother-photos",title:"Фотографии 35×50 мм",note:"4 фотографии на синем фоне",status:"print",section:"school",person:"mother",tag:"Guardian Pass" },
  { id:"mother-bank",title:"Bank statements",note:"3 месяца, остаток от RM10,000",status:"reserve",section:"school",person:"mother",tag:"Guardian Pass" },
  { id:"mother-tenancy",title:"Tenancy Agreement",note:"Договор со stamp / LHDN",status:"reserve",section:"school",person:"mother",tag:"Guardian Pass" },
  { id:"mother-family",title:"Embassy Family Letter",note:"Добавить после получения",status:"process",section:"school",person:"mother",tag:"Guardian Pass" },
];

export default function Home() {
  const [client] = useState(() => createClient());
  const [ready,setReady] = useState(false);
  const [session,setSession] = useState<Awaited<ReturnType<NonNullable<typeof client>["auth"]["getSession"]>>["data"]["session"]>(null);
  const [checked,setChecked] = useState<Record<string,boolean>>({});
  const [filter,setFilter] = useState<"all"|Status>("all");
  const [section,setSection] = useState<Section>("immigration");
  const [person,setPerson] = useState<Person>("brother");
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

  const visible=useMemo(()=>docs.filter(d=>(filter==="all"||d.status===filter)&&d.section===section&&(section==="immigration"||d.person===person)&&`${d.title} ${d.note}`.toLowerCase().includes(query.toLowerCase())),[filter,person,query,section]);
  const currentDocs=docs.filter(d=>d.section===section&&(section==="immigration"||d.person===person));
  const complete=currentDocs.filter(d=>checked[d.id]).length;
  const progress=Math.round(complete/currentDocs.length*100);
  const destination: Destination = section === "immigration" ? "immigration" : person === "mother" ? "school-mother" : "school-brother";
  const selectDestination=(next:Destination)=>{
    if(next==="immigration") setSection("immigration");
    else { setSection("school"); setPerson(next==="school-mother"?"mother":"brother"); }
  };
  const login=()=>client?.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${location.origin}/auth/callback`}});

  if(!ready) return <Splash text="Загрузка"/>;
  if(!client) return <Splash text="Авторизация не настроена"/>;
  if(!session) return <main className="grid min-h-screen place-items-center bg-[#f5f2e9] p-4"><section className="w-full max-w-md rounded-2xl border border-[#dcd8cb] bg-white p-8"><p className="text-xs font-bold text-[#7d6b3d]">SPECIAL PASS FILES</p><h1 className="mt-4 text-3xl font-bold">Вход в папки документов</h1><button onClick={login} className="mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#dcd8cb] font-semibold"><Image src="/google.svg" alt="" width={20} height={20}/>Войти через Google</button></section></main>;

  const currentTitle=section==="immigration"?"Иммиграция":person==="mother"?"Виза школы — Мама":"Виза школы — Братишка";
  return <div className="min-h-screen bg-[#f1f3f5] text-[#171717]">
    <header className="bg-[#090909] text-white"><div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-10"><div className="flex items-center gap-3"><span className="h-7 w-2 bg-[#55a7d8]"/><span className="text-base font-extrabold sm:text-lg">Семейные документы</span></div><div className="flex items-center gap-4"><span className="hidden text-xs text-white/45 sm:block">Специальный пропуск · 2026</span><button onClick={()=>client.auth.signOut()} className="border border-white/25 px-3 py-2 text-xs font-bold transition hover:bg-white hover:text-black">Выйти</button></div></div></header>
    <div className="mx-auto max-w-[1440px]"><DestinationNav value={destination} docs={docs} onChange={selectDestination}/></div>
    <main className="mx-auto max-w-[1440px] px-5 py-7 lg:px-10 lg:py-10">
      <section className="flex flex-col gap-6 border-b border-[#cfd4d8] pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl"><p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#6e7479]">Текущий раздел</p><h1 className="mt-2 text-4xl font-black tracking-[-.04em] sm:text-5xl">{currentTitle}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[#687077]">{section==="immigration"?"Общие иммиграционные файлы семьи собраны в одном разделе. Отмечай готовые документы — прогресс сохранится автоматически.":"Отдельный пакет документов для подачи через школу IMAS. Он не смешивается с общими иммиграционными файлами."}</p></div>
        <div className="grid min-w-full grid-cols-3 border border-[#aeb5ba] bg-white lg:min-w-[360px]">{[["Файлов",String(currentDocs.length)],["Готово",String(complete)],["Прогресс",`${progress}%`]].map(([label,value])=><div key={label} className="border-r border-[#d4d8db] p-4 last:border-r-0"><span className="block text-[10px] text-[#747a7f]">{label}</span><b className="mt-1 block font-mono text-xl">{value}</b></div>)}</div>
      </section>
      <section className="mt-7 flex flex-col gap-3 lg:flex-row"><label className="relative flex-1"><span className="sr-only">Поиск по документам</span><span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#777]">⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск по документам" className="h-12 w-full border border-[#b7bdc1] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#171717]"/></label><div className="flex gap-px overflow-x-auto bg-[#aeb5ba]">{(["all","print","process","reserve"] as const).map(x=><button key={x} onClick={()=>setFilter(x)} className={`h-12 shrink-0 px-4 text-xs font-bold transition ${filter===x?"bg-[#171717] text-white":"bg-white hover:bg-[#e7eaec]"}`}>{x==="all"?"Все документы":status[x].title}</button>)}</div></section>
      <section className="mt-5 overflow-hidden border border-[#9fa7ac] bg-white">
        <div className="hidden grid-cols-[1fr_180px_170px_70px] bg-[#111] px-5 py-3 text-[11px] font-bold text-white md:grid"><span>Документ</span><span>Категория</span><span>Статус</span><span className="text-right">Готово</span></div>
        {visible.length===0?<p className="p-10 text-center text-sm text-[#737a80]">По этому запросу документов нет</p>:visible.map(d=><button key={d.id} onClick={()=>setChecked(c=>({...c,[d.id]:!c[d.id]}))} className={`grid w-full gap-3 border-t border-[#d8dcdf] p-4 text-left first:border-t-0 md:grid-cols-[1fr_180px_170px_70px] md:items-center md:px-5 ${checked[d.id]?"bg-[#edf7f4]":"hover:bg-[#f6f7f8]"}`}><span className="flex min-w-0 gap-3"><span aria-hidden="true" className="mt-0.5 grid size-8 shrink-0 place-items-center border border-[#b7bdc1] bg-white text-sm">▤</span><span className="min-w-0"><strong className={`block text-sm ${checked[d.id]?"line-through decoration-[#64a990]":""}`}>{d.title}</strong><span className="mt-1 block text-xs leading-5 text-[#737a80]">{d.note}</span></span></span><span className="pl-11 font-mono text-[10px] uppercase text-[#687077] md:pl-0">{d.tag}</span><span className="pl-11 text-xs font-bold md:pl-0" style={{color:status[d.status].color}}>{status[d.status].title}</span><span className={`ml-11 grid size-7 place-items-center justify-self-start border text-sm md:ml-0 md:justify-self-end ${checked[d.id]?"border-[#1f7a55] bg-[#1f7a55] text-white":"border-[#9fa7ac] bg-white"}`}>{checked[d.id]?"✓":""}</span></button>)}
      </section>
      <section className="mt-6 grid gap-px bg-[#b5bbc0] border border-[#b5bbc0] md:grid-cols-3"><Info title="Адрес" text="No. 15, Block 2G4, Persiaran Perdana, Presint 2, Putrajaya"/><Info title="Печать рядом" text="Printec Putrajaya, Shaftsbury Putrajaya, Presint 1"/><Info title="Главное" text="Оригиналы обоих паспортов взять с собой"/></section>
    </main>
  </div>;
}

const destinations: {id:Destination;title:string;subtitle:string;symbol:string}[] = [
  {id:"immigration",title:"Иммиграция",subtitle:"Общие файлы",symbol:"▥"},
  {id:"school-mother",title:"Виза школы — Мама",subtitle:"Отдельная подборка",symbol:"◇"},
  {id:"school-brother",title:"Виза школы — Братишка",subtitle:"Отдельная подборка",symbol:"⌂"},
];

function DestinationNav({value,docs,onChange}:{value:Destination;docs:Doc[];onChange:(value:Destination)=>void}){
  const count=(id:Destination)=>id==="immigration"
    ? docs.filter(doc=>doc.section==="immigration").length
    : docs.filter(doc=>doc.section==="school"&&doc.person===(id==="school-mother"?"mother":"brother")).length;
  return <nav aria-label="Разделы документов" className="overflow-hidden bg-[#11100f] text-white">
    <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 lg:px-10"><span className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Выберите пакет</span><span className="text-[11px] text-white/45">Иммиграционные файлы общие</span></div>
    <div className="grid gap-px bg-white/20 sm:grid-cols-3">{destinations.map(item=>{
      const active=value===item.id;
      return <button key={item.id} type="button" aria-pressed={active} onClick={()=>onChange(item.id)} className={`group flex min-h-[72px] items-center gap-3 px-4 py-3 text-left transition-colors sm:min-h-36 sm:flex-col sm:items-stretch sm:justify-between sm:p-5 ${active?"bg-[#55a7d8] text-[#171513]":"bg-[#1d1c1b] hover:bg-[#292725]"}`}>
        <span className="flex items-center justify-between sm:w-full"><span aria-hidden="true" className="text-xl font-bold">{item.symbol}</span><span className={`ml-3 font-mono text-xs font-bold sm:text-base ${active?"text-[#171513]":"text-white/45"}`}>{String(count(item.id)).padStart(2,"0")}</span></span>
        <span className="min-w-0 flex-1 sm:flex-initial"><strong className="block text-sm leading-tight sm:text-lg">{item.title}</strong><span className={`mt-1 block text-[10px] sm:text-xs ${active?"text-[#173447]":"text-white/45"}`}>{item.subtitle}</span></span>
      </button>})}</div>
  </nav>;
}

function Splash({text}:{text:string}){return <main className="grid min-h-screen place-items-center bg-[#f5f2e9]"><h1 className="text-2xl font-bold">{text}</h1></main>}
function Info({title,text}:{title:string;text:string}){return <section className="bg-white p-5"><p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#4b7f9e]">{title}</p><p className="mt-2 text-sm leading-5 text-[#4f565b]">{text}</p></section>}
