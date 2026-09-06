import { Building2, GraduationCap, School } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Destination, DocumentItem } from "../model/types";

const destinations=[
  {id:"immigration" as const,title:"Иммиграция",subtitle:"Общие файлы",Icon:Building2},
  {id:"school-mother" as const,title:"Виза школы — Мама",subtitle:"Отдельная подборка",Icon:GraduationCap},
  {id:"school-brother" as const,title:"Виза школы — Братишка",subtitle:"Отдельная подборка",Icon:School},
];

export function DestinationNav({value,docs,onChange}:{value:Destination;docs:DocumentItem[];onChange:(value:Destination)=>void}){
  const count=(id:Destination)=>id==="immigration"?docs.filter(d=>d.section==="immigration").length:docs.filter(d=>d.section==="school"&&d.person===(id==="school-mother"?"mother":"brother")).length;
  return <nav aria-label="Разделы документов" className="overflow-hidden bg-nav text-on-dark">
    <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 lg:px-10"><span className="eyebrow text-white/45">Выберите пакет</span><span className="text-[11px] text-white/45">Иммиграционные файлы общие</span></div>
    <div className="grid gap-px bg-white/20 sm:grid-cols-3">{destinations.map(({id,title,subtitle,Icon})=>{const active=value===id;return <motion.button layout key={id} type="button" aria-pressed={active} onClick={()=>onChange(id)} whileTap={{scale:.985}} className={cn("group relative flex min-h-[72px] items-center gap-3 px-4 py-3 text-left transition-colors sm:min-h-36 sm:flex-col sm:items-stretch sm:justify-between sm:p-5",active?"bg-accent text-ink":"bg-nav-soft hover:bg-nav-hover")}>
      {active&&<motion.span layoutId="active-destination" className="absolute inset-x-0 bottom-0 h-1 bg-ink"/>}<span className="flex items-center justify-between sm:w-full"><Icon className="size-5 sm:size-7"/><span className={cn("ml-3 font-mono text-xs font-bold sm:text-base",!active&&"text-white/45")}>{String(count(id)).padStart(2,"0")}</span></span><span className="min-w-0 flex-1 sm:flex-initial"><strong className="block text-sm leading-tight sm:text-lg">{title}</strong><span className={cn("mt-1 block text-[10px] sm:text-xs",active?"text-accent-ink":"text-white/45")}>{subtitle}</span></span>
    </motion.button>})}</div>
  </nav>;
}
