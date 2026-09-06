"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { DOCUMENTS, STORAGE_KEY } from "../model/data";
import type { Destination, Person, Section, Status } from "../model/types";
import { DestinationNav } from "./destination-nav";
import { DocumentFilters } from "./document-filters";
import { DocumentList } from "./document-list";

export function DocumentsDashboard(){
  const [client]=useState(()=>createClient());
  const [ready,setReady]=useState(false);
  const [session,setSession]=useState<Awaited<ReturnType<NonNullable<typeof client>["auth"]["getSession"]>>["data"]["session"]>(null);
  const [checked,setChecked]=useState<Record<string,boolean>>({});
  const [filter,setFilter]=useState<"all"|Status>("all");
  const [section,setSection]=useState<Section>("immigration");
  const [person,setPerson]=useState<Person>("brother");
  const [query,setQuery]=useState("");
  const remoteReady=useRef(false);

  useEffect(()=>{const frame=requestAnimationFrame(()=>{setChecked(JSON.parse(localStorage.getItem(STORAGE_KEY)??"{}"));if(!client)setReady(true)});if(!client)return()=>cancelAnimationFrame(frame);client.auth.getSession().then(({data})=>{setSession(data.session);setReady(true)});const{data:{subscription}}=client.auth.onAuthStateChange((_event,next)=>{remoteReady.current=false;setSession(next)});return()=>{cancelAnimationFrame(frame);subscription.unsubscribe()}},[client]);
  useEffect(()=>{if(!ready)return;localStorage.setItem(STORAGE_KEY,JSON.stringify(checked));if(!client||!session||!remoteReady.current)return;const timer=setTimeout(()=>client.from("checklist_progress").upsert({user_id:session.user.id,checked}),450);return()=>clearTimeout(timer)},[checked,client,ready,session]);
  useEffect(()=>{if(!client||!session||remoteReady.current)return;let active=true;client.from("checklist_progress").select("checked").eq("user_id",session.user.id).maybeSingle().then(({data})=>{if(!active)return;setChecked(current=>({...current,...(data?.checked??{})}));remoteReady.current=true});return()=>{active=false}},[client,session]);

  const destination:Destination=section==="immigration"?"immigration":person==="mother"?"school-mother":"school-brother";
  const selectDestination=(next:Destination)=>{if(next==="immigration")setSection("immigration");else{setSection("school");setPerson(next==="school-mother"?"mother":"brother")}};
  const currentDocs=DOCUMENTS.filter(item=>item.section===section&&(section==="immigration"||item.person===person));
  const visible=useMemo(()=>DOCUMENTS.filter(item=>(filter==="all"||item.status===filter)&&item.section===section&&(section==="immigration"||item.person===person)&&`${item.title} ${item.note}`.toLowerCase().includes(query.toLowerCase())),[filter,person,query,section]);
  const complete=currentDocs.filter(item=>checked[item.id]).length;
  const progress=Math.round(complete/currentDocs.length*100);
  const title=section==="immigration"?"Иммиграция":person==="mother"?"Виза школы — Мама":"Виза школы — Братишка";
  const login=()=>client?.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${location.origin}/auth/callback`}});

  if(!ready)return <Splash text="Загрузка"/>;
  if(!client)return <Splash text="Авторизация не настроена"/>;
  if(!session)return <main className="grid min-h-screen place-items-center bg-panel p-4"><motion.section initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="w-full max-w-md border border-line bg-surface p-8"><p className="eyebrow text-accent-ink">SPECIAL PASS FILES</p><h1 className="mt-4 text-3xl font-black">Вход в папки документов</h1><Button variant="outline" onClick={login} className="mt-7 w-full gap-3"><Image src="/google.svg" alt="" width={20} height={20}/>Войти через Google</Button></motion.section></main>;

  return <div className="min-h-screen bg-panel text-ink"><header className="bg-nav text-on-dark"><div className="mx-auto flex h-16 max-w-screen items-center justify-between px-5 lg:px-10"><div className="flex items-center gap-3"><span className="h-7 w-2 bg-accent"/><span className="text-base font-extrabold sm:text-lg">Семейные документы</span></div><div className="flex items-center gap-4"><span className="hidden text-xs text-white/45 sm:block">Специальный пропуск · 2026</span><Button variant="ghost" size="sm" onClick={()=>client.auth.signOut()} className="border border-white/25">Выйти</Button></div></div></header>
    <div className="mx-auto max-w-screen"><DestinationNav value={destination} docs={DOCUMENTS} onChange={selectDestination}/></div>
    <motion.main key={destination} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.22}} className="mx-auto max-w-screen px-5 py-7 lg:px-10 lg:py-10"><section className="flex flex-col gap-6 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="eyebrow text-muted">Текущий раздел</p><h1 className="mt-2 text-4xl font-black tracking-[-.04em] sm:text-5xl">{title}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-muted">{section==="immigration"?"Общие иммиграционные файлы семьи собраны в одном разделе. Отмечай готовые документы — прогресс сохранится автоматически.":"Отдельный пакет документов для подачи через школу IMAS. Он не смешивается с общими иммиграционными файлами."}</p></div><Stats values={[["Файлов",currentDocs.length],["Готово",complete],["Прогресс",`${progress}%`]]}/></section>
      <DocumentFilters query={query} onQuery={setQuery} filter={filter} onFilter={setFilter}/><DocumentList documents={visible} checked={checked} onToggle={id=>setChecked(value=>({...value,[id]:!value[id]}))}/><InfoGrid/></motion.main>
  </div>;
}

function Stats({values}:{values:[string,string|number][]}){return <div className="grid min-w-full grid-cols-3 border border-line-strong bg-surface lg:min-w-[360px]">{values.map(([label,value])=><div key={label} className="border-r border-line p-4 last:border-r-0"><span className="block text-[10px] text-muted">{label}</span><b className="mt-1 block font-mono text-xl">{value}</b></div>)}</div>}
function InfoGrid(){const items=[["Адрес","No. 15, Block 2G4, Persiaran Perdana, Presint 2, Putrajaya"],["Печать рядом","Printec Putrajaya, Shaftsbury Putrajaya, Presint 1"],["Главное","Оригиналы обоих паспортов взять с собой"]];return <section className="mt-6 grid gap-px border border-line-strong bg-line-strong md:grid-cols-3">{items.map(([title,text])=><article key={title} className="bg-surface p-5"><p className="eyebrow text-accent-ink">{title}</p><p className="mt-2 text-sm leading-5 text-muted">{text}</p></article>)}</section>}
function Splash({text}:{text:string}){return <main className="grid min-h-screen place-items-center bg-panel"><h1 className="text-2xl font-bold">{text}</h1></main>}
