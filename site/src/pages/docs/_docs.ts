import { getCollection, type CollectionEntry } from 'astro:content';

/** All docs pages, in nav order. Shared by the index, the nav and the dynamic route. */
export async function getDocs(): Promise<CollectionEntry<'docs'>[]> {
  const entries = await getCollection('docs');
  return entries.sort((a, b) => a.data.order - b.data.order);
}
