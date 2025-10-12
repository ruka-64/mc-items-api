import { Hono } from 'hono';
import { getList } from './utils/getList.ts';
import { version } from './consts.ts';
import { decodeBase64, encodeBase64 } from '@std/encoding/base64';

export const kv = await Deno.openKv();

const app = new Hono();

app.get('/', (c) => {
  return c.text('Minecraft Items API');
});

app.get('/favicon.ico', (c) => c.newResponse(null, 204));

app.get('/list', async (c) => {
  const res = await getList();
  return c.json(res);
});

app.get(`/icon/${version}/:id`, async (c) => {
  const cache = await kv.get<string>(['iconCache', c.req.param('id')]);
  if (cache.value) {
    const decoded = decodeBase64(cache.value);
    return c.body(decoded, 200, {
      'Content-Type': 'image/webp',
      'X-MCAPI-Cache': 'HIT',
    });
  } else {
    const res = await fetch('https://n5v.net' + c.req.path);
    if (res.ok) {
      const arrBuff = await res.arrayBuffer();
      const base64 = encodeBase64(arrBuff);
      console.log(base64);
      await kv.set(['iconCache', c.req.param('id')], base64, { expireIn: 1000 * 60 * 60 * 24 });
      return c.body(arrBuff, 200, {
        'Content-Type': 'image/webp',
        'X-MCAPI-Cache': 'MISS',
      });
    } else {
      return c.json(
        {
          success: false,
          message: `Execpted status is 2xx, but result was ${res.status}`,
        },
        400
      );
    }
  }
});

app.get(`/:name`, async (c) => {
  const direct = c.req.query('direct')! === 'yes';
  const itemName = c.req.param('name');
  if (!itemName) {
    return c.json(
      {
        success: false,
        message: 'Invalid or missing params',
      },
      400
    );
  }
  const res = await getList();
  if (!res.success) {
    return c.json(
      {
        success: false,
        message: res.message,
      },
      500
    );
  } else {
    const filename = res.data[itemName];
    if (!filename) {
      return c.json(
        {
          success: false,
          message: 'Cannot find item',
        },
        400
      );
    }
    if (direct) {
      return await fetch(`/icon/${version}/${filename}.webp`);
    }
    return c.json({
      success: true,
      url: `/icon/${version}/${filename}.webp`,
    });
  }
});

Deno.serve(app.fetch);
