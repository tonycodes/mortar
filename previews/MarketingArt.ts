/** Inline SVG art for marketing section fixtures, so previews never hit the network. */
const svg = (viewBox: string, body: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}' preserveAspectRatio='xMidYMid slice'>${body}</svg>`,
  )}`;
/** `count` copies of a shape, each drawn from its index. */
const repeat = (count: number, shape: (i: number) => string) =>
  Array.from({ length: count }, (_, i) => shape(i)).join("");

/** A landscape: sky, sun and two ridges. */
export const scene = (sky: string, near: string, far: string) =>
  svg(
    "0 0 600 600",
    `<rect width='600' height='600' fill='#${sky}'/><circle cx='420' cy='170' r='70' fill='#ffffff' fill-opacity='.55'/><path d='M0 380 L140 250 L290 360 L430 230 L600 350 V600 H0Z' fill='#${far}'/><path d='M0 470 L180 380 L360 470 L520 400 L600 440 V600 H0Z' fill='#${near}'/>`,
  );

export const scenes = [
  scene("f6d365", "243b55", "4b6cb7"),
  scene("a1c4fd", "2f4858", "33658a"),
  scene("fbc2eb", "5f2c82", "a6416d"),
  scene("d4fc79", "1d4d4f", "3a7d44"),
  scene("ffecd2", "6b3e26", "c06c3e"),
];

/** Inline style for an image that fills a fixture slot. */
export const art = {
  display: "block",
  width: "100%",
  height: 180,
  objectFit: "cover",
  borderRadius: 8,
} as const;

const sidebar =
  "<rect width='220' height='760' fill='#1f2430'/><rect x='24' y='28' width='120' height='16' rx='8' fill='#5b6478'/>" +
  repeat(
    6,
    (i) =>
      `<rect x='24' y='${88 + i * 40}' width='${150 - (i % 3) * 24}' height='12' rx='6' fill='#3b4252'/>`,
  );
const toolbar =
  "<rect x='260' y='28' width='300' height='20' rx='10' fill='#d9dbe1'/><rect x='1040' y='22' width='120' height='32' rx='8' fill='#4f46e5'/>";
const cards = repeat(3, (i) => {
  const x = 260 + i * 306;
  return `<rect x='${x}' y='88' width='286' height='132' rx='12' fill='#ffffff' stroke='#e3e5ea'/><rect x='${x + 24}' y='112' width='90' height='12' rx='6' fill='#c3c7d0'/><rect x='${x + 24}' y='146' width='140' height='30' rx='8' fill='#2a2f3a'/>`;
});
const table =
  "<rect x='260' y='252' width='898' height='470' rx='12' fill='#ffffff' stroke='#e3e5ea'/>" +
  repeat(7, (i) => {
    const y = 286 + i * 60;
    return `<rect x='284' y='${y}' width='32' height='32' rx='16' fill='#dfe3ec'/><rect x='336' y='${y + 8}' width='${260 - (i % 3) * 40}' height='14' rx='7' fill='#c3c7d0'/><rect x='${980 - (i % 2) * 40}' y='${y + 8}' width='${120 + (i % 2) * 40}' height='14' rx='7' fill='#e3e5ea'/>`;
  });
/** A wide product screenshot: sidebar, toolbar, cards and table rows. */
export const screenshot = svg(
  "0 0 1200 760",
  `<rect width='1200' height='760' fill='#f7f7f8'/>${sidebar}${toolbar}${cards}${table}`,
);
