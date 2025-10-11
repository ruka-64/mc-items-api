import { Hono } from 'hono';
import { getList } from './utils/getList.ts';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Minecraft Items API');
});

app.get('/list', async (c) => {
  const res = await getList();
  return c.json(res);
});

Deno.serve(app.fetch);
