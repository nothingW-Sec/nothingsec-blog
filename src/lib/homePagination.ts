import type { Post } from "./posts";

export const HOME_PAGE_SIZE = 6;

export function getHomePageCount(postCount: number) {
  return Math.max(1, Math.ceil(postCount / HOME_PAGE_SIZE));
}

export function getHomePagePosts(posts: Post[], page: number) {
  const start = (page - 1) * HOME_PAGE_SIZE;
  return posts.slice(start, start + HOME_PAGE_SIZE);
}

export function homePageUrl(page: number) {
  return page <= 1 ? "/#articles" : `/page/${page}/#articles`;
}
