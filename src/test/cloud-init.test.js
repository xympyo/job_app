import { expect, it, vi } from "vitest";
import { createCloudRepository } from "../lib/repository";
import { TABLES } from "../lib/constants";

it("loads a new account as empty without copying the owner's CV records", async () => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    range: vi.fn(async () => ({ data: [], error: null })),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  const client = { from: vi.fn(() => query), rpc: vi.fn() };
  const data = await createCloudRepository(client).load("new-user");
  expect(Object.keys(data)).toEqual(TABLES);
  expect(Object.values(data).every((rows) => rows.length === 0)).toBe(true);
  expect(query.eq).toHaveBeenCalledWith("user_id", "new-user");
  expect(client.rpc).not.toHaveBeenCalled();
});
