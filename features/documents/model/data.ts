import type { DocumentItem, Status } from "./types";

export const STORAGE_KEY = "imas_visa_checklist_state_v2";
export const STATUS: Record<Status,{title:string;color:string}> = {
  print:{title:"Печатать сейчас",color:"var(--status-print)"},
  process:{title:"В процессе",color:"var(--status-process)"},
  reserve:{title:"Резерв / позже",color:"var(--status-reserve)"},
};
export const DOCUMENTS: DocumentItem[] = [
  {id:"imm-passports",title:"Паспорта мамы и братишки",note:"Data page + последний въезд / current pass, оригиналы с собой",status:"print",section:"immigration",tag:"общий файл"},
  {id:"imm55",title:"IMM.55",note:"По 2 экземпляра на каждого заявителя",status:"print",section:"immigration",tag:"общая подача"},
  {id:"imm-birth",title:"Свидетельство о рождении",note:"Страницы 1–6 + заверенный английский перевод",status:"print",section:"immigration",tag:"подтверждение родства"},
  {id:"imm-offer",title:"Offer Letter IMAS",note:"Полный PDF + отдельная копия первой страницы",status:"process",section:"immigration",tag:"подтверждение школы"},
  {id:"imm-confirmation",title:"Confirmation Letter IMAS",note:"Добавить сразу после получения от школы",status:"process",section:"immigration",tag:"самое важное"},
  {id:"imm-receipts",title:"Квитанции IMAS",note:"Оплата школы и Visa Fee Receipt",status:"process",section:"immigration",tag:"общий пакет"},
  {id:"imm-tenancy",title:"Tenancy Agreement",note:"Один экземпляр со stamp / LHDN",status:"reserve",section:"immigration",tag:"по запросу"},
  {id:"imm-old-passport",title:"Старый паспорт братишки",note:"Для объяснения замены паспорта и повторного MOE",status:"reserve",section:"immigration",tag:"по запросу"},
  {id:"brother-passport",title:"Новый паспорт",note:"Копии всех страниц",status:"print",section:"school",person:"brother",tag:"Student Pass"},
  {id:"brother-photos",title:"Фотографии 35×50 мм",note:"4 фотографии на синем фоне",status:"print",section:"school",person:"brother",tag:"Student Pass"},
  {id:"brother-birth",title:"Свидетельство о рождении",note:"Оригинал, копия и заверенный перевод",status:"print",section:"school",person:"brother",tag:"Student Pass"},
  {id:"brother-moe",title:"Документы MOE / KPM",note:"Полученные approval и support letters",status:"process",section:"school",person:"brother",tag:"Student Pass"},
  {id:"mother-passport",title:"Паспорт мамы",note:"Копии всех страниц",status:"print",section:"school",person:"mother",tag:"Guardian Pass"},
  {id:"mother-photos",title:"Фотографии 35×50 мм",note:"4 фотографии на синем фоне",status:"print",section:"school",person:"mother",tag:"Guardian Pass"},
  {id:"mother-bank",title:"Bank statements",note:"3 месяца, остаток от RM10,000",status:"reserve",section:"school",person:"mother",tag:"Guardian Pass"},
  {id:"mother-tenancy",title:"Tenancy Agreement",note:"Договор со stamp / LHDN",status:"reserve",section:"school",person:"mother",tag:"Guardian Pass"},
  {id:"mother-family",title:"Embassy Family Letter",note:"Добавить после получения",status:"process",section:"school",person:"mother",tag:"Guardian Pass"},
];
