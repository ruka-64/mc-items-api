import { version } from '../consts.ts';
import { JSDOM } from 'jsdom';

type getListFailed = {
  success: false;
  message: string;
};

type getListSuccess = {
  success: true;
  cache: 'HIT' | 'MISS';
  prefix: string;
  ext: string;
  data: Record<string, string>;
};

type getListT = getListSuccess | getListFailed;

const kv = await Deno.openKv();

const replacements: Record<string, string> = {
  'enchanted_book[stored_enchantments={levels:{“minecraft:aqua_affinity”:1}}]': 'enchanted_book',
  'goat_horn[instrument=”minecraft:ponder_goat_horn”]': 'goat_horn',
  'white_banner[banner_patterns=[{“pattern”:”minecraft:rhombus”,”color”:”cyan”},{“pattern”:”minecraft:stripe_bottom”,”color”:”light_gray”},{“pattern”:”minecraft:stripe_center”,”color”:”gray”},{“pattern”:”minecraft:border”,”color”:”light_gray”},{“pattern”:”minecraft:stripe_middle”,”color”:”black”},{“pattern”:”minecraft:half_horizontal”,”color”:”light_gray”},{“pattern”:”minecraft:circle”,”color”:”light_gray”},{“pattern”:”minecraft:border”,”color”:”black”}]]':
    'ominous_banner',
};

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const escapedKeys = Object.keys(replacements).map(escapeRegExp);

const pattern = new RegExp(escapedKeys.join('|'), 'g');

export async function getList(): Promise<getListT> {
  const cache = await kv.get<Record<string, string>>(['listCache', 'data']);
  if (cache.value) {
    const version = await kv.get<string>(['listCache', 'version']);
    return {
      success: true,
      cache: 'HIT',
      prefix: `/icon/${version.value!}/`,
      ext: 'webp',
      data: cache.value,
    };
  }

  const res = await fetch('https://n5v.net/command/block-item-id/');
  if (!res.ok) {
    return {
      success: false,
      message: `Execpted status is 2xx, but result was ${res.status}`,
    };
  }
  const html = await res.text();
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const list = doc.querySelectorAll('#itemList li');
  const results: Record<string, string> = {};
  list.forEach((val) => {
    const img = val.querySelector('img');
    if (img!.src.includes('64-2096.webp')) return;
    const parts = val.textContent.trim().split('\n');
    // console.log(parts);
    let itemName: string | null = null;
    if (parts.length > 1) {
      const name = parts[1].trim();
      itemName = name.replace(pattern, (matched) => replacements[matched]);
    }
    results[itemName ?? 'no text'] = img!.src.replace(`../../icon/${version}/`, '').replace('.webp', '');
  });
  const filtered = Object.entries(results).filter(([k]) => {
    if (k.endsWith('slab[type=double]')) return false;
    if (k.endsWith('[powered=true]')) return false;
    if (k.endsWith('[lit=true]')) return false;
    if (k.endsWith('[lit=false]')) return false;
    if (k.endsWith('[level=1～9]')) return false;
    if (k.endsWith('spawn_egg')) return false;
    if (k.endsWith('arm_collision')) return false;
    if (k.endsWith('air')) return false;
    if (k.endsWith('_cake')) return false;
    if (k.endsWith('_cauldron')) return false;
    if (k.endsWith('_crop')) return false;
    if (k.endsWith('_stem')) return false;
    if (k.endsWith('wall_torch')) return false;
    if (k.endsWith('wall_skull')) return false;
    if (k.endsWith('wall_head')) return false;
    if (k.endsWith('wall_fan')) return false;
    if (k.endsWith('wall_banner')) return false;
    if (k.endsWith('wall_sign')) return false;
    if (k.endsWith('wall_hanging_sign')) return false;
    if (k.endsWith(' 36')) return false;
    if (k === 'allow') return false;
    if (k === 'deny') return false;
    if (k === 'border_block') return false;

    if (k === 'petrified_oak_slab') return false;
    if (k === 'debug_stick') return false;
    if (k === 'farmland') return false;
    if (k === 'snow') return false;
    if (k === 'standing_banner') return false;
    if (k === 'moving_piston') return false;
    if (k === 'piston_head') return false;
    if (k === 'tripwire') return false;
    if (k === 'redstone_wire') return false;
    if (k === 'frosted_ice') return false;
    if (k === 'end_portal') return false;
    if (k === 'nether_portal') return false;
    if (k === 'beetroots') return false;
    if (k === 'carrots') return false;
    if (k === 'potatoes') return false;
    if (k === 'bamboo_sapling') return false;
    if (k === 'end_gateway') return false;
    if (k.startsWith('painting[')) return false;
    if (k.startsWith('enchanted_book[')) return false;
    if (k.startsWith('ominous_bottle[')) return false;
    if (k.startsWith('suspicious_stew[')) return false;
    if (k.startsWith('goat_horn[')) return false;
    if (k.startsWith('firework_rocket[')) return false;
    if (k.startsWith('potted_')) return false;
    if (k.startsWith('potion[potion_contents={potion:”minecraft:long_')) return false;
    if (k.startsWith('lingering_potion[potion_contents={potion:”minecraft:long_')) return false;
    if (k.startsWith('splash_potion[potion_contents={potion:”minecraft:long_')) return false;

    if (k.startsWith('potion[potion_contents={potion:”minecraft:strong_')) return false;
    if (k.startsWith('lingering_potion[potion_contents={potion:”minecraft:strong_')) return false;
    if (k.startsWith('splash_potion[potion_contents={potion:”minecraft:strong_')) return false;

    if (k.startsWith('tipped_arrow[potion_contents={potion:”minecraft:long_')) return false;
    if (k.startsWith('tipped_arrow[potion_contents={potion:”minecraft:strong_')) return false;
    return true;
  });
  const newObj: Record<string, string> = Object.fromEntries(filtered);

  await kv.set(['listCache', 'data'], newObj, {
    expireIn: 1000 * 60 * 60 * 24,
  });
  await kv.set(['listCache', 'version'], version, { expireIn: 1000 * 60 * 60 * 24 });
  return {
    success: true,
    cache: 'MISS',
    prefix: `/icon/${version}/`,
    ext: 'webp',
    data: newObj,
  };
}
