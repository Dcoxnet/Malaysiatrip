import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STATUS } from "../model/data";
import type { Status } from "../model/types";

export function DocumentFilters({query,onQuery,filter,onFilter}:{query:string;onQuery:(value:string)=>void;filter:"all"|Status;onFilter:(value:"all"|Status)=>void}){
  return <section className="mt-7 flex flex-col gap-3 lg:flex-row"><label className="relative flex-1"><span className="sr-only">Поиск по документам</span><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"/><input value={query} onChange={e=>onQuery(e.target.value)} placeholder="Поиск по документам" className="h-12 w-full border border-line-strong bg-surface pl-10 pr-4 text-sm outline-none transition focus:border-ink"/></label><div className="flex gap-px overflow-x-auto bg-line-strong">{(["all","print","process","reserve"] as const).map(id=><Button key={id} variant="outline" onClick={()=>onFilter(id)} className={cn("shrink-0 border-0",filter===id&&"bg-ink text-on-dark hover:bg-ink/85")}>{id==="all"?"Все документы":STATUS[id].title}</Button>)}</div></section>;
}
