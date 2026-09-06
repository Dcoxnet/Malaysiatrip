export type Status = "print" | "process" | "reserve";
export type Section = "immigration" | "school";
export type Person = "mother" | "brother";
export type Destination = "immigration" | "school-mother" | "school-brother";
export type DocumentItem = { id:string; title:string; note:string; status:Status; section:Section; person?:Person; tag:string };
