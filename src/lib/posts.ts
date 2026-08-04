import { getCollection, type CollectionEntry } from "astro:content";
export type Post = CollectionEntry<"posts">;
export async function getPosts() { return (await getCollection("posts", ({data}) => !data.draft)).sort((a,b) => b.data.publishDate.valueOf()-a.data.publishDate.valueOf()); }
export function sortSeriesPosts(a: Post, b: Post) {
  const aOrder = a.data.seriesOrder;
  const bOrder = b.data.seriesOrder;
  if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder || b.data.publishDate.valueOf() - a.data.publishDate.valueOf();
  if (aOrder !== undefined) return -1;
  if (bOrder !== undefined) return 1;
  return b.data.publishDate.valueOf() - a.data.publishDate.valueOf();
}
export function formatDate(date: Date) { return new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"long",day:"numeric"}).format(date); }
export function readingTime(body: string) { return Math.max(1,Math.ceil(body.replace(/\s/g,"").length/500)); }
export function coverClass(category: string) { return category === "靶场复盘" ? "lab" : category === "技术学习" ? "tech" : "note"; }
