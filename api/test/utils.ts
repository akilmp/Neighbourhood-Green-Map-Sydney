/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import crypto from 'node:crypto';

export function createPrismaMock() {
  const users = new Map<string, any>();
  const spots = new Map<string, any>();
  const photos: any[] = [];
  const tags = new Map<string, any>();
  const spotTags: any[] = [];

  return {
    user: {
      async create({ data }: any) {
        const user = { ...data, id: crypto.randomUUID(), emailVerified: true };
        users.set(user.id, user);
        return user;
      },
      async findUnique({ where: { email } }: any) {
        return Array.from(users.values()).find((u) => u.email === email) ?? null;
      },
    },
    async $executeRaw(_strings: TemplateStringsArray, ...values: any[]) {
      const [id, name, description, lng, lat, facilities, category, isPublished, userId] = values;
      const spot = { id, name, description, lat, lng, userId, facilities, category, isPublished };
      spots.set(id, spot);
      return 1;
    },
    spotPhoto: {
      async createMany({ data }: any) {
        data.forEach((d: any) => photos.push({ ...d, id: crypto.randomUUID() }));
        return { count: data.length };
      },
    },
    tag: {
      async upsert({ where: { name }, create }: any) {
        let tag = tags.get(name);
        if (!tag) {
          tag = { id: crypto.randomUUID(), name };
          tags.set(name, tag);
        }
        return tag;
      },
    },
    spotTag: {
      async create({ data }: any) {
        spotTags.push(data);
        return data;
      },
    },
    spot: {
      async findUnique({ where: { id } }: any) {
        const spot = spots.get(id);
        if (!spot) return null;
        return {
          ...spot,
          photos: photos.filter((p) => p.spotId === id),
          tags: spotTags
            .filter((st) => st.spotId === id)
            .map((st) => ({ tagId: st.tagId, spotId: id, tag: Array.from(tags.values()).find((t) => t.id === st.tagId) })),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
      async findMany() {
        return Array.from(spots.values()).map((spot) => ({
          ...spot,
          photos: photos.filter((p) => p.spotId === spot.id),
          tags: spotTags
            .filter((st) => st.spotId === spot.id)
            .map((st) => ({ tagId: st.tagId, spotId: spot.id, tag: Array.from(tags.values()).find((t) => t.id === st.tagId) })),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      },
      async update({ where: { id }, data }: any) {
        const spot = spots.get(id);
        if (!spot) throw new Error('Not found');
        Object.assign(spot, data);
        return {
          ...spot,
          photos: photos.filter((p) => p.spotId === id),
          tags: spotTags
            .filter((st) => st.spotId === id)
            .map((st) => ({ tagId: st.tagId, spotId: id, tag: Array.from(tags.values()).find((t) => t.id === st.tagId) })),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
      async delete({ where: { id } }: any) {
        const spot = spots.get(id);
        spots.delete(id);
        return spot;
      },
    },
    async $queryRaw() {
      return Array.from(spots.values());
    },
  };
}
