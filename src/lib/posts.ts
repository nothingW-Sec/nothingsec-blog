import { getCollection, type CollectionEntry } from "astro:content";
export type Post = CollectionEntry<"posts">;
export async function getPosts() { return (await getCollection("posts", ({data}) => !data.draft)).sort((a,b) => b.data.publishDate.valueOf()-a.data.publishDate.valueOf()); }
export function formatDate(date: Date) { return new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"long",day:"numeric"}).format(date); }
export function readingTime(body: string) { return Math.max(1,Math.ceil(body.replace(/\s/g,"").length/500)); }
export function coverClass(category: string) { return category === "靶场复盘" ? "lab" : category === "技术学习" ? "tech" : "note"; }
