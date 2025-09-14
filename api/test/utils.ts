/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import crypto from 'node:crypto';

export function createPrismaMock() {
  const users = new Map<string, any>();
  const spots = new Map<string, any>();
  const photos: any[] = [];
  const tags = new Map<string, any>();
  const spotTags: any[] = [];
  const routes = new Map<string, any>();
  let routeSpots: any[] = [];

  return {
    user: {
      async create({ data }: any) {
        const user = { emailVerified: true, ...data, id: crypto.randomUUID() };
        users.set(user.id, user);
        return user;
      },
      async findUnique({ where: { email } }: any) {
        return Array.from(users.values()).find((u) => u.email === email) ?? null;
      },
    },
    async $executeRaw(strings: TemplateStringsArray, ...values: any[]) {
      const query = strings[0];
      if (query.includes('INSERT INTO "Spot"')) {
        const [id, name, description, lng, lat, _facilities, _category, _isPublished, userId] = values;
        const spot = { id, name, description, lat, lng, userId };
        spots.set(id, spot);
        return 1;
      }
      if (query.includes('INSERT INTO "Route"')) {
        const [id, name, description, distanceKm, isPublished, path, ownerId] = values;
        const route = {
          id,
          name,
          description,
          distanceKm,
          isPublished,
          ownerId,
          path: JSON.parse(path),
        };
        routes.set(id, route);
        return 1;
      }
      if (query.includes('UPDATE "Route" SET path')) {
        const [path, id] = values;
        const route = routes.get(id);
        if (route) route.path = JSON.parse(path);
        return 1;
      }
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
    async $queryRaw(strings?: TemplateStringsArray, ...values: any[]) {
      const query = strings ? strings[0] : '';
      if (query.includes('FROM "Route"')) {
        const id = values[0];
        const route = routes.get(id);
        return [{ path: JSON.stringify(route?.path) }];
      }
      return Array.from(spots.values());
    },
    routeSpot: {
      async createMany({ data }: any) {
        routeSpots.push(...data);
        return { count: data.length };
      },
      async deleteMany({ where: { routeId } }: any) {
        const before = routeSpots.length;
        routeSpots = routeSpots.filter((rs) => rs.routeId !== routeId);
        return { count: before - routeSpots.length };
      },
    },
    route: {
      async findMany() {
        return Array.from(routes.values()).map((route) => ({
          ...route,
          spots: routeSpots
            .filter((rs) => rs.routeId === route.id)
            .sort((a, b) => a.order - b.order)
            .map((rs) => ({ ...rs, spot: spots.get(rs.spotId) })),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      },
      async findUnique({ where: { id } }: any) {
        const route = routes.get(id);
        if (!route) return null;
        return {
          ...route,
          spots: routeSpots
            .filter((rs) => rs.routeId === id)
            .sort((a, b) => a.order - b.order)
            .map((rs) => ({ ...rs, spot: spots.get(rs.spotId) })),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
      async update({ where: { id }, data }: any) {
        const route = routes.get(id);
        if (!route) throw new Error('Not found');
        Object.assign(route, data);
        if (data.spots) {
          routeSpots = routeSpots.filter((rs) => rs.routeId !== id);
          routeSpots.push(...data.spots.create.map((d: any) => ({ routeId: id, ...d })));
        }
        return this.findUnique({ where: { id } });
      },
      async delete({ where: { id } }: any) {
        const route = routes.get(id);
        routes.delete(id);
        routeSpots = routeSpots.filter((rs) => rs.routeId !== id);
        return route;
      },
    },
  };
}
