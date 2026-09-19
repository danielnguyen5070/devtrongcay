import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const coversDir = join(root, "public/images/blog");
const viDir = join(root, "content/blogs/vi");
const enDir = join(root, "content/blogs/en");

mkdirSync(coversDir, { recursive: true });
mkdirSync(viDir, { recursive: true });
mkdirSync(enDir, { recursive: true });

const palettes = [
  ["#4f8447", "#1e4924", "#071309"],
  ["#738f52", "#315d2d", "#08140a"],
  ["#365f37", "#14351a", "#050e07"],
  ["#477b43", "#1a421f", "#071208"],
  ["#6a7d3e", "#2a4a22", "#081109"],
  ["#3f6a4a", "#16341d", "#061109"],
  ["#58724a", "#243a22", "#09120b"],
  ["#2f5533", "#122616", "#050d07"],
  ["#7a8f55", "#3a562c", "#0b140c"],
  ["#415d38", "#1b331c", "#071008"],
  ["#5c7a48", "#274028", "#08130a"],
  ["#334f32", "#142318", "#050c07"],
  ["#69865a", "#314a2c", "#0a140c"],
  ["#46664a", "#1d3822", "#071209"],
  ["#556b3d", "#28351c", "#0a1109"],
  ["#2d4a38", "#13241c", "#050e0a"],
  ["#6e8250", "#364828", "#0c130b"],
  ["#3a5a40", "#183022", "#06110b"],
  ["#4a6e52", "#214033", "#08140f"],
  ["#61744a", "#2c3d24", "#0a120b"],
];

function coverSvg(index, slug) {
  const [a, b, c] = palettes[index % palettes.length];
  const rot = (index * 17) % 28 - 14;
  const rx = 190 + (index % 5) * 12;
  const ry = 250 + (index % 4) * 10;
  const holes = [
    [320 + (index % 7) * 4, 250, 28, 11, -18],
    [490 - (index % 6) * 5, 270, 30, 12, 16],
    [290, 370 + (index % 5) * 6, 24, 10, -12],
    [510, 390, 26, 11, 14],
    [340, 490, 22, 10, -8],
    [470, 510, 23, 10, 10],
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img" aria-label="${slug}">
  <rect width="800" height="800" fill="#090b09"/>
  <defs>
    <radialGradient id="g-${index}" cx="48%" cy="38%" r="62%">
      <stop offset="0" stop-color="${a}"/>
      <stop offset=".46" stop-color="${b}"/>
      <stop offset="1" stop-color="${c}"/>
    </radialGradient>
  </defs>
  <g transform="translate(400 410) rotate(${rot})">
    <ellipse cx="0" cy="-10" rx="${rx}" ry="${ry}" fill="url(#g-${index})"/>
    <path d="M0 -${ry - 8} C 8 ${ry * 0.05} 4 ${ry * 0.7} -6 ${ry - 18}" fill="none" stroke="rgba(164,204,143,.28)" stroke-width="4"/>
    ${holes
      .map(
        ([x, y, hr, hy, r]) =>
          `<ellipse cx="${x - 400}" cy="${y - 410}" rx="${hr}" ry="${hy}" transform="rotate(${r})" fill="#090b09" opacity=".94"/>`,
      )
      .join("\n    ")}
  </g>
</svg>
`;
}

const posts = [
  {
    slug: "monstera-deliciosa",
    date: "2026-09-18",
    coverImage: "/images/blog/monstera-deliciosa.svg",
    category: { vi: "Giống cây", en: "Species" },
    title: { vi: "Monstera Deliciosa", en: "Monstera Deliciosa" },
    description: {
      vi: "Loài nền của chi Monstera: cách đọc lá, tưới vừa phải, và khi nào nên cho leo.",
      en: "The type species of the genus: how to read the leaf, water with restraint, and when to let it climb.",
    },
    body: {
      vi: `**Monstera deliciosa** là điểm bắt đầu hợp lý nếu bạn muốn hiểu chi này. Lá non gần như nguyên vẹn. Cửa sổ và xẻ thùy xuất hiện khi cây đủ sáng và bắt đầu leo.

## Ánh sáng

Đặt gần cửa sổ sáng, tránh nắng trưa trực tiếp. Lá nhỏ, cuống dài và ít cửa sổ thường là dấu hiệu thiếu sáng, không phải thiếu phân.

## Tưới

Để lớp mặt giá thể khô rồi mới tưới đẫm. Rễ khí là cơ quan thở, không phải tín hiệu cây đang khát.

## Cho leo

Khi thân bắt đầu dài, hãy cho dựa cột rêu hoặc gỗ. Lá trưởng thành trên giá đỡ sẽ lớn hơn hẳn lá trên chậu treo.`,
      en: `**Monstera deliciosa** is the cleanest place to start in this genus. Juvenile leaves stay almost entire. Fenestration and splits arrive once the plant has enough light and a reason to climb.

## Light

Keep it near a bright window and out of harsh midday sun. Small leaves, long petioles, and few windows usually mean low light, not a missing fertilizer.

## Water

Let the top of the mix dry, then water thoroughly. Aerial roots are for breathing and anchoring, not a thirst alarm.

## Climbing

When internodes start to stretch, give it a moss pole or board. Mature leaves on a support grow larger than the same plant in a hanging pot.`,
    },
  },
  {
    slug: "thai-constellation",
    date: "2026-09-17",
    coverImage: "/images/blog/thai-constellation.svg",
    category: { vi: "Variegated", en: "Variegated" },
    title: { vi: "Thai Constellation", en: "Thai Constellation" },
    description: {
      vi: "Đốm kem ổn định hơn Albo, nhưng phần trắng vẫn cần sáng tán và tưới chậm hơn cây xanh.",
      en: "Cream speckling is more stable than Albo, but the white tissue still wants diffused light and a slower wet-dry cycle.",
    },
    body: {
      vi: `Thai Constellation giữ pattern dạng sao vì mô phân sinh đã được ổn định trong nuôi cấy mô. Bạn ít gặp nhánh xanh hoàn toàn, nhưng lá quá trắng vẫn dễ cháy và chậm lớn.

Cho sáng mạnh nhưng lọc. Phần kem không quang hợp tốt, nên cây cần nhiều lá xanh xung quanh để nuôi mô trắng.

Tưới ít hơn Deliciosa cùng kích thước. Giá thể thoáng, ấm vừa, và kiên nhẫn với nhịp ra lá.`,
      en: `Thai Constellation keeps its starry pattern because the meristem was stabilized in tissue culture. Fully green reversions are uncommon, but overly white leaves still scorch and grow slowly.

Give strong, filtered light. Cream tissue photosynthesizes poorly, so the plant needs enough green around each splash to feed it.

Water less than a green Deliciosa of the same size. Use an airy mix, keep it only modestly warm, and wait out the slower leaf rhythm.`,
    },
  },
  {
    slug: "albo-borsigiana",
    date: "2026-09-16",
    coverImage: "/images/blog/albo-borsigiana.svg",
    category: { vi: "Variegated", en: "Variegated" },
    title: { vi: "Albo Borsigiana", en: "Albo Borsigiana" },
    description: {
      vi: "Variegation dạng sector: chọn ngọn có cả xanh lẫn trắng nếu muốn giữ pattern lâu dài.",
      en: "Sectoral variegation: keep a growing point with both green and white if you want the pattern to last.",
    },
    body: {
      vi: `Albo Borsigiana không “cố định” như Thai. Mắt ngủ quyết định lá tiếp theo. Ngọn quá trắng sẽ yếu. Ngọn quá xanh sẽ trả về lá thường.

Khi cắt, giữ một đoạn thân có cả hai màu. Borsigiana thân mảnh hơn Deliciosa, nội đốt dài hơn, nên cột leo giúp lá không bị nhỏ dần.

Tránh phân đạm cao. Cây cần ánh sáng đều hơn là kích thích tăng trưởng.`,
      en: `Albo Borsigiana is not locked the way Thai Constellation is. Each axillary bud decides the next leaf. A too-white apex stalls. A too-green apex reverts.

When you prune, keep a node that still shows both colors. Borsigiana is slimmer than Deliciosa, with longer internodes, so a pole keeps leaf size from shrinking.

Skip heavy nitrogen. Even light matters more than aggressive feeding.`,
    },
  },
  {
    slug: "monstera-aurea",
    date: "2026-09-15",
    coverImage: "/images/blog/monstera-aurea.svg",
    category: { vi: "Variegated", en: "Variegated" },
    title: { vi: "Monstera Aurea", en: "Monstera Aurea" },
    description: {
      vi: "Vàng chanh trên nền xanh đậm: đẹp dưới sáng lọc, dễ mất màu nếu để tối.",
      en: "Lime gold over deep green: it sings in filtered light and fades if you keep it too dim.",
    },
    body: {
      vi: `Aurea (còn gọi Marmorata vàng) cần sáng hơn cây xanh thuần để giữ sắc vàng. Thiếu sáng, mô vàng sẽ ngả xanh và pattern mờ.

Không phun nước lên lá khi nắng gắt. Mô vàng mỏng, dễ cháy loang.

Giá thể nhanh thoát, chậu vừa rễ, và chỉ sang chậu khi khối rễ đã chiếm phần lớn hỗn hợp.`,
      en: `Aurea (sometimes sold as yellow Marmorata) needs more light than a fully green plant to keep the gold. In low light the yellow tissue greens out and the pattern dulls.

Do not mist leaves in strong sun. The gold tissue is thin and marks easily.

Use a fast mix, a pot that only just fits the roots, and wait to up-pot until the root mass has taken the container.`,
    },
  },
  {
    slug: "monstera-mint",
    date: "2026-09-14",
    coverImage: "/images/blog/monstera-mint.svg",
    category: { vi: "Variegated", en: "Variegated" },
    title: { vi: "Monstera Mint", en: "Monstera Mint" },
    description: {
      vi: "Xanh bạc loang nhẹ: chậm hơn Deliciosa, chịu sai lầm tưới kém hơn Albo.",
      en: "A soft mint wash: slower than green Deliciosa, and less forgiving of wet soil than Albo.",
    },
    body: {
      vi: `Mint không phải Albo nhạt màu. Pattern thường dạng sương, xanh lạnh, đôi khi kèm vùng gần trắng.

Cây lớn chậm. Đừng bù bằng tưới nhiều. Rễ Mint dễ nát nếu giá thể đặc.

Sáng gián tiếp mạnh suốt ngày là điều kiện giữ được lớp mint. Khi tối, lá mới sẽ đậm và đều màu hơn.`,
      en: `Mint is not a washed-out Albo. The pattern is usually a cool, misty wash, sometimes with near-white patches.

It grows slowly. Do not compensate with extra water. Mint roots collapse quickly in a dense mix.

Strong indirect light all day is what keeps the mint layer. In shade, new leaves come in darker and more even.`,
    },
  },
  {
    slug: "monstera-adansonii",
    date: "2026-09-13",
    coverImage: "/images/blog/monstera-adansonii.svg",
    category: { vi: "Giống cây", en: "Species" },
    title: { vi: "Adansonii", en: "Adansonii" },
    description: {
      vi: "Lá thủng sớm, thân mảnh: hợp treo hoặc cho leo, miễn là ẩm không biến thành ướt.",
      en: "Holes appear early on a slender vine: hang it or climb it, as long as humidity never turns into wet soil.",
    },
    body: {
      vi: `Adansonii ra cửa sổ khi còn nhỏ. Đó không phải dấu hiệu trưởng thành như Deliciosa.

Thân nhỏ nên chậu lớn là có hại. Tưới theo khối rễ, không theo kích thước chậu.

Nếu cho leo, lá sẽ dày và lỗ ổn định hơn. Nếu treo, chấp nhận lá nhỏ hơn và nội đốt dài.`,
      en: `Adansonii fenestrates while still juvenile. Those holes are not the same maturity signal you wait for on Deliciosa.

The vine is thin, so an oversized pot works against you. Water the root mass, not the container size.

On a climb, leaves thicken and the holes settle. In a hanging pot, expect smaller blades and longer internodes.`,
    },
  },
  {
    slug: "monstera-esqueleto",
    date: "2026-09-12",
    coverImage: "/images/blog/monstera-esqueleto.svg",
    category: { vi: "Giống cây", en: "Species" },
    title: { vi: "Esqueleto", en: "Esqueleto" },
    description: {
      vi: "Lá lưới lớn, cần không gian và sáng mạnh hơn Adansonii trông có vẻ giống.",
      en: "A large lattice leaf that needs space and more light than the Adansonii it is often compared with.",
    },
    body: {
      vi: `Esqueleto (thường gắn với *Monstera epipremnoides*) tạo cửa sổ rộng đến mức lá gần như còn gân. Cây này không phải Adansonii phóng to.

Cần cột chắc và chậu ổn định. Lá trưởng thành nặng. Thiếu sáng, cửa sổ sẽ hẹp và phiến lá dày một cách vụng.

Giữ ẩm không khí nếu nhà máy lạnh, nhưng gốc vẫn phải khô giữa các lần tưới.`,
      en: `Esqueleto (often linked to *Monstera epipremnoides*) opens windows so wide the leaf is almost a ribcage. It is not a scaled-up Adansonii.

Give it a solid pole and a stable pot. Mature leaves are heavy. In weak light the windows stay narrow and the blade looks clumsily thick.

Raise air humidity if the room is air-conditioned, but the rootball still needs to dry between waterings.`,
    },
  },
  {
    slug: "monstera-obliqua",
    date: "2026-09-11",
    coverImage: "/images/blog/monstera-obliqua.svg",
    category: { vi: "Giống cây", en: "Species" },
    title: { vi: "Obliqua", en: "Obliqua" },
    description: {
      vi: "Mỏng, hiếm, dễ nhầm với Adansonii: chỉ giữ được nếu ẩm cao và giá thể cực thoáng.",
      en: "Thin, scarce, and often mislabeled: it only holds if humidity stays high and the mix stays extremely airy.",
    },
    body: {
      vi: `Obliqua thật có phiến lá mỏng như giấy và tỷ lệ lỗ rất cao. Phần lớn cây bán với tên này là Adansonii.

Nếu bạn chắc là Obliqua, hãy nghĩ như trồng lan: vỏ thông, perlite, sphagnum rất thoáng, ẩm không khí cao, sáng lọc.

Không để úng. Một lần thối gốc là mất cây. Quan sát mép lỗ: Obliqua thật gần như chỉ còn mạng gân.`,
      en: `True Obliqua has a paper-thin blade and an extreme hole-to-tissue ratio. Most plants sold under the name are Adansonii.

If you are sure you have Obliqua, grow it like an orchid: bark, perlite, very open sphagnum, high ambient humidity, filtered light.

Never leave it soggy. One rotten node can end the plant. Look at the hole edges: the real species is almost all vein.`,
    },
  },
  {
    slug: "monstera-peru",
    date: "2026-09-10",
    coverImage: "/images/blog/monstera-peru.svg",
    category: { vi: "Giống cây", en: "Species" },
    title: { vi: "Monstera Peru", en: "Monstera Peru" },
    description: {
      vi: "Lá dày, gân nổi, không cửa sổ: tưới chậm và sáng mạnh hơn họ hàng lá mỏng.",
      en: "Thick, bullate leaves with no windows: water slowly and give it more light than the thin-leaved cousins.",
    },
    body: {
      vi: `Peru (*Monstera karstenianum*) không xẻ lá. Vẻ đẹp nằm ở gân nổi và mặt lá sáp.

Vì phiến dày, cây chịu khô hơn Deliciosa. Úng mới là rủi ro. Chờ giá thể khô sâu hơn một chút rồi mới tưới.

Sáng mạnh giúp gân nổi rõ. Thiếu sáng, lá phẳng và nội đốt dài, mất đúng cái làm Peru đáng giữ.`,
      en: `Peru (*Monstera karstenianum*) does not fenestrate. The interest is the bullate veins and the waxy surface.

Because the blade is thick, it tolerates dryness better than Deliciosa. Wet mix is the real risk. Let the substrate dry a little deeper before you water.

Strong light keeps the texture. In shade the leaf flattens, internodes stretch, and you lose the reason to grow Peru.`,
    },
  },
  {
    slug: "monstera-standleyana",
    date: "2026-09-09",
    coverImage: "/images/blog/monstera-standleyana.svg",
    category: { vi: "Giống cây", en: "Species" },
    title: { vi: "Standleyana", en: "Standleyana" },
    description: {
      vi: "Lá hình khiên, sọc kem: leo để sọc thẳng và phiến dày hơn.",
      en: "Shield-shaped leaves with cream streaks: climb it if you want the stripes to stay straight and the blade to thicken.",
    },
    body: {
      vi: `Standleyana thường được bán dạng Albo với sọc kem dọc gân. Cây còn nhỏ thì lá mềm; khi leo, phiến cứng và sọc rõ hơn.

Không cắt sọc trắng hoàn toàn khỏi ngọn. Giống Albo khác, mắt ngủ sẽ quyết định lá sau.

Tưới vừa, sáng lọc, và cho thân áp vào cột. Cây này đẹp hơn khi được đối xử như cây leo, không phải khóm để bàn.`,
      en: `Standleyana is often sold as an Albo form with cream streaks along the veins. Juvenile leaves stay soft; once it climbs, the blade hardens and the stripes sharpen.

Do not cut every white streak out of the apex. As with other Albos, the next bud decides the next leaf.

Moderate water, filtered light, and a stem pressed to a pole. It looks better treated as a climber than as a desk plant.`,
    },
  },
  {
    slug: "monstera-siltepecana",
    date: "2026-09-08",
    coverImage: "/images/blog/monstera-siltepecana.svg",
    category: { vi: "Giống cây", en: "Species" },
    title: { vi: "Siltepecana", en: "Siltepecana" },
    description: {
      vi: "Hai hình thái rõ: lá bạc khi còn bò, lá xanh đậm xẻ thùy khi đã leo.",
      en: "Two clear forms: silvery crawlers, then darker, divided leaves once the plant climbs.",
    },
    body: {
      vi: `Siltepecana là bài học về juvenile và adult. Lá non bạc, hình mác. Khi bám trụ, lá lớn, xanh hơn và bắt đầu xẻ.

Nếu bạn thích lớp bạc, hãy để một phần bò. Nếu muốn lá trưởng thành, buộc thân lên cột và tăng sáng.

Đừng hoảng khi màu bạc giảm. Đó là sự trưởng thành, không phải bệnh.`,
      en: `Siltepecana is a lesson in juvenile versus adult form. Young leaves are silver and lance-shaped. Once it grips a support, they enlarge, darken, and begin to divide.

Keep a creeping section if you love the silver. Train it up and add light if you want the adult leaf.

Do not panic when the silver fades. That is maturity, not a deficiency.`,
    },
  },
  {
    slug: "monstera-dubia",
    date: "2026-09-07",
    coverImage: "/images/blog/monstera-dubia.svg",
    category: { vi: "Giống cây", en: "Species" },
    title: { vi: "Monstera Dubia", en: "Monstera Dubia" },
    description: {
      vi: "Lá dán sát gỗ khi còn nhỏ: cần tấm bám, không phải chậu treo.",
      en: "Juvenile leaves plaster themselves to wood: give it a board, not a hanging basket.",
    },
    body: {
      vi: `Dubia shingling: lá non ép sát bề mặt, xếp ngói. Không có tấm bám, cây sẽ hoang và mất form.

Dùng gỗ, xơ dừa ép hoặc rêu. Giữ bề mặt hơi ẩm, gốc vẫn thoáng.

Khi trưởng thành, Dubia rời mặt bám và ra lá xẻ. Nhiều người cắt giữ phần juvenile vì thích kiểu dán tường hơn.`,
      en: `Dubia is a shingler: juvenile leaves press flat and overlap. Without a board, the plant wanders and loses its form.

Use wood, compressed coco, or moss. Keep that surface lightly moist while the potting mix stays airy.

As it matures, Dubia leaves the board and produces divided blades. Many growers cut it back to keep the juvenile, wall-hugging look.`,
    },
  },
  {
    slug: "monstera-pinnatipartita",
    date: "2026-09-06",
    coverImage: "/images/blog/monstera-pinnatipartita.svg",
    category: { vi: "Giống cây", en: "Species" },
    title: { vi: "Pinnatipartita", en: "Pinnatipartita" },
    description: {
      vi: "Từ lá nguyên đến thùy sâu: kiên nhẫn cho leo nếu muốn thấy form trưởng thành.",
      en: "From entire leaves to deep lobes: be patient and let it climb if you want the adult form.",
    },
    body: {
      vi: `Pinnatipartita hay gây thất vọng vì cây giống bán ra trông như Philodendron lá nguyên. Form đẹp chỉ xuất hiện sau nhiều đốt leo.

Cần sáng mạnh, cột cao, và thời gian. Tưới đều nhưng không để úng — thân mọng nước hơn Deliciosa một chút.

Khi thùy bắt đầu sâu, đừng chuyển chậu liên tục. Cây đang dùng năng lượng để đổi hình thái.`,
      en: `Pinnatipartita disappoints people because nursery plants look like an entire-leaf Philodendron. The dramatic form only arrives after many climbing nodes.

Give it strong light, a tall pole, and time. Water evenly without waterlogging — the stem is a little juicier than Deliciosa.

Once the lobes deepen, stop repotting. The plant is spending energy on the morphological shift.`,
    },
  },
  {
    slug: "monstera-lechleriana",
    date: "2026-09-05",
    coverImage: "/images/blog/monstera-lechleriana.svg",
    category: { vi: "Giống cây", en: "Species" },
    title: { vi: "Lechleriana", en: "Lechleriana" },
    description: {
      vi: "Lỗ dọc gân giữa, phiến dài: sáng đều và giá thể thoáng sẽ giữ được nhịp ra lá.",
      en: "Holes along the midrib on a long blade: even light and an open mix keep the leaf rhythm steady.",
    },
    body: {
      vi: `Lechleriana dễ nhận ở cửa sổ chạy song song gân giữa, không phải kiểu xẻ rìa của Deliciosa.

Cây ưa ẩm không khí nhưng rễ vẫn cần oxy. Hỗn hợp vỏ thông, perlite và một ít đất là đủ.

Lá dài nên cần không gian xoay. Đừng ép sát tường nếu bạn muốn thấy form đầy đủ.`,
      en: `Lechleriana is easy to recognize: windows run along the midrib rather than splitting the margin the way Deliciosa does.

It likes humid air and oxygen at the roots. Bark, perlite, and a little soil is enough.

The blades are long, so they need room to turn. Do not pin the plant to a wall if you want the full outline.`,
    },
  },
  {
    slug: "watering-monstera",
    date: "2026-09-04",
    coverImage: "/images/blog/watering-monstera.svg",
    category: { vi: "Chăm sóc", en: "Care" },
    title: { vi: "Tưới nước", en: "Watering" },
    description: {
      vi: "Tưới theo rễ và ánh sáng, không theo lịch. Úng giết Monstera nhiều hơn khô.",
      en: "Water from the roots and the light, not from a calendar. Wet mix kills more Monsteras than drought.",
    },
    body: {
      vi: `Lịch tưới cố định thất bại vì chậu, giá thể và sáng thay đổi mỗi tuần.

Chờ lớp trên khô, nâng chậu, nhìn rễ khí. Tưới đẫm đến khi nước chảy đáy, rồi đổ hết khay.

Mùa tăng trưởng cần thường xuyên hơn mùa tối. Cây variegated luôn chậm khô hơn cây xanh cùng chậu — mô trắng thoát hơi kém.`,
      en: `A fixed watering schedule fails because pot, mix, and light change every week.

Wait for the top to dry, lift the pot, look at the aerial roots. Water until it leaves the drainage holes, then empty the saucer.

Growth season asks for more frequency than dark months. Variegated plants dry slower than green ones in the same pot — white tissue transpires less.`,
    },
  },
  {
    slug: "monstera-light",
    date: "2026-09-03",
    coverImage: "/images/blog/monstera-light.svg",
    category: { vi: "Chăm sóc", en: "Care" },
    title: { vi: "Ánh sáng", en: "Light" },
    description: {
      vi: "Cửa sổ, kích thước lá và màu phiến nói thật hơn mọi app đo lux.",
      en: "Windows, leaf size, and blade color tell you more than any lux app.",
    },
    body: {
      vi: `Monstera không phải cây góc tối. Thiếu sáng: cuống dài, lá nhỏ, không cửa sổ, đất lâu khô.

Sáng đúng: lá mới lớn hơn lá cũ, cửa sổ tăng dần, thân ngắn lại.

Variegated cần sáng hơn cây xanh để nuôi mô trắng, nhưng nắng trực tiếp buổi trưa sẽ đốt kem và vàng. Lọc bằng rèm mỏng.`,
      en: `Monstera is not a dark-corner plant. Low light shows up as long petioles, small leaves, no windows, and soil that stays wet.

Right light: each new leaf outsizes the last, fenestration increases, internodes shorten.

Variegated plants need more light than green ones to feed white tissue, but midday sun will burn cream and gold. Filter it with a thin curtain.`,
    },
  },
  {
    slug: "monstera-soil",
    date: "2026-09-02",
    coverImage: "/images/blog/monstera-soil.svg",
    category: { vi: "Chăm sóc", en: "Care" },
    title: { vi: "Giá thể", en: "Soil Mix" },
    description: {
      vi: "Thoáng trước, ẩm sau. Một hỗn hợp đất vườn đặc sẽ làm rễ Monstera ngộp.",
      en: "Air first, moisture second. A dense garden mix smothers Monstera roots.",
    },
    body: {
      vi: `Công thức làm việc tốt: vỏ thông, perlite hoặc pumice, một ít đất hoặc coco, thêm than nếu bạn thích.

Cầm nắm hỗn hợp khi ướt — nó phải vỡ ra, không nát thành bùn.

Sang chậu khi rễ đã vòng, không phải vì cây cao. Chậu cao hẹp hợp cây leo hơn chậu thấp miệng rộng.`,
      en: `A mix that works: bark, perlite or pumice, a little soil or coco, charcoal if you like it.

Squeeze the wet mix — it should break apart, not collapse into mud.

Up-pot when roots have circled, not because the plant is tall. A deeper, narrower pot suits a climber better than a wide bowl.`,
    },
  },
  {
    slug: "fenestration",
    date: "2026-09-01",
    coverImage: "/images/blog/fenestration.svg",
    category: { vi: "Sinh lý", en: "Growth" },
    title: { vi: "Cửa sổ lá", en: "Fenestration" },
    description: {
      vi: "Cửa sổ là phản ứng với sáng và leo, không phải phân bón đắt.",
      en: "Windows are a response to light and climbing, not to expensive fertilizer.",
    },
    body: {
      vi: `Fenestration giúp lá lớn không rách trong mưa rừng và cho ánh sáng xuống tầng dưới. Trong nhà, tín hiệu tương tự là sáng mạnh cộng với hướng leo.

Cây treo ít cửa sổ vì nó không nhận được tín hiệu trưởng thành. Buộc thân, tăng sáng, chờ vài lá — đừng cắt liên tục.

Lá đã ra sẽ không tự xẻ thêm. Chỉ lá mới phản ánh điều kiện hiện tại.`,
      en: `Fenestration keeps a large leaf from shredding in forest rain and lets light reach lower stories. Indoors, the same cues are strong light plus a vertical path.

Hanging plants fenestrate less because they never get the maturity signal. Tie the stem, add light, wait a few leaves — do not keep chopping.

A leaf that has already hardened will not add windows. Only new leaves report current conditions.`,
    },
  },
  {
    slug: "moss-pole",
    date: "2026-08-30",
    coverImage: "/images/blog/moss-pole.svg",
    category: { vi: "Chăm sóc", en: "Care" },
    title: { vi: "Cột rêu", en: "Moss Pole" },
    description: {
      vi: "Cột chỉ có ích khi thân thật sự bám. Rêu ẩm giúp rễ khí, nhưng gốc chậu vẫn phải thoát nước.",
      en: "A pole only works if the stem actually attaches. Moist moss helps aerial roots, but the pot still has to drain.",
    },
    body: {
      vi: `Buộc thân, không buộc cuống lá. Điểm bám là đốt, nơi rễ khí xuất phát.

Rêu ướt sũng sẽ truyền nước xuống giá thể và gây úng. Xịt cột, đừng ngâm.

Gỗ và coco cũng được. Quan trọng là mặt bám ổn định và cây không bị xoay mỗi tuần.`,
      en: `Tie the stem, not the petiole. The attachment point is the node, where aerial roots emerge.

Sodden moss dumps water into the mix and causes rot. Mist the pole; do not soak it.

Wood and coco work too. What matters is a stable face and a plant you are not rotating every week.`,
    },
  },
  {
    slug: "yellow-leaves",
    date: "2026-08-28",
    coverImage: "/images/blog/yellow-leaves.svg",
    category: { vi: "Chẩn đoán", en: "Diagnosis" },
    title: { vi: "Lá vàng", en: "Yellow Leaves" },
    description: {
      vi: "Một lá già vàng là bình thường. Nhiều lá vàng cùng lúc thường là tưới hoặc sáng.",
      en: "One old yellow leaf is normal. Several at once is usually water or light.",
    },
    body: {
      vi: `Lá gốc vàng chậm khi cây ra lá mới là chu kỳ. Vàng nhanh, mềm, đất ướt: quá nước. Vàng giòn, giá thể đá: quá khô hoặc cháy nắng.

Variegated vàng ở vùng kem không phải thiếu đạm. Đó thường là cháy sáng hoặc mô trắng già.

Đọc cả rễ. Mùi chua và thân đen ở đốt là thối — hãy cắt về mô khỏe trước khi tưới lại.`,
      en: `A slow yellowing of a basal leaf while a new one opens is ordinary cycling. Fast, soft yellows in wet soil: too much water. Crisp yellow with a bone-dry mix: drought or sunburn.

Cream patches turning yellow on a variegated leaf are not a nitrogen shortage. That is usually scorch or aging white tissue.

Read the roots too. A sour smell and black nodes mean rot — cut to healthy tissue before you water again.`,
    },
  },
];

for (const [index, post] of posts.entries()) {
  writeFileSync(join(coversDir, `${post.slug}.svg`), coverSvg(index, post.slug));

  for (const locale of ["vi", "en"]) {
    const mdx = `---
title: "${post.title[locale]}"
description: "${post.description[locale]}"
slug: ${post.slug}
date: "${post.date}"
coverImage: "${post.coverImage}"
category: "${post.category[locale]}"
---

${post.body[locale]}
`;
    writeFileSync(join(locale === "vi" ? viDir : enDir, `${post.slug}.mdx`), mdx);
  }
}

const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#080908"/>
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="rgba(255,255,255,.14)"/>
  <text x="80" y="340" fill="#d6dad2" font-size="42" font-family="Inter, sans-serif" letter-spacing="18">DEV TRONG CAY</text>
</svg>
`;
writeFileSync(join(root, "public/images/og-home.svg"), og);
writeFileSync(join(coversDir, "placeholder.svg"), coverSvg(0, "placeholder"));

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#080908"/>
  <circle cx="16" cy="16" r="7" fill="#2f5533"/>
</svg>
`;
writeFileSync(join(root, "app/icon.svg"), favicon);

console.log(`Wrote ${posts.length} posts and covers`);
