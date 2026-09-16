__mods["js/data.js"] = (() => {
const __flowerAssets = {"adonis":"assets/flowers/adonis-01.webp","aster":"assets/flowers/aster-01.webp","azalea-korean":"assets/flowers/azalea-korean-01.webp","balloon-flower":"assets/flowers/balloon-flower-01.webp","camellia":"assets/flowers/camellia-01.webp","canola":"assets/flowers/canola-01.webp","cherry-blossom":"assets/flowers/cherry-blossom-01.webp","chinese-fringe-tree":"assets/flowers/chinese-fringe-tree-01.webp","chrysanthemum":"assets/flowers/chrysanthemum-01.webp","coreopsis":"assets/flowers/coreopsis-01.webp","cornelian-cherry":"assets/flowers/cornelian-cherry-01.webp","cosmos":"assets/flowers/cosmos-01.webp","crape-myrtle":"assets/flowers/crape-myrtle-01.webp","cyclamen":"assets/flowers/cyclamen-01.webp","daffodil":"assets/flowers/daffodil-01.webp","dandelion":"assets/flowers/dandelion-01.webp","forsythia":"assets/flowers/forsythia-01.webp","gaura":"assets/flowers/gaura-01.webp","gerbera":"assets/flowers/gerbera-01.webp","globe-amaranth":"assets/flowers/globe-amaranth-01.webp","hellebore":"assets/flowers/hellebore-01.webp","hydrangea":"assets/flowers/hydrangea-01.webp","iris":"assets/flowers/iris-01.webp","lavender":"assets/flowers/lavender-01.webp","leopard-plant":"assets/flowers/leopard-plant-01.webp","lily":"assets/flowers/lily-01.webp","lotus":"assets/flowers/lotus-01.webp","magnolia":"assets/flowers/magnolia-01.webp","marigold":"assets/flowers/marigold-01.webp","morning-glory":"assets/flowers/morning-glory-01.webp","mugunghwa":"assets/flowers/mugunghwa-01.webp","peony":"assets/flowers/peony-01.webp","plum-blossom-red":"assets/flowers/plum-blossom-red-01.webp","poppy":"assets/flowers/poppy-01.webp","red-clover":"assets/flowers/red-clover-01.webp","red-spider-lily":"assets/flowers/red-spider-lily-01.webp","rose":"assets/flowers/rose-01.webp","royal-azalea":"assets/flowers/royal-azalea-01.webp","salvia":"assets/flowers/salvia-01.webp","sasanqua":"assets/flowers/sasanqua-01.webp","shasta-daisy":"assets/flowers/shasta-daisy-01.webp","silver-grass":"assets/flowers/silver-grass-01.webp","snowdrop":"assets/flowers/snowdrop-01.webp","sunflower":"assets/flowers/sunflower-01.webp","trumpet-creeper":"assets/flowers/trumpet-creeper-01.webp","tulip":"assets/flowers/tulip-01.webp","ume":"assets/flowers/ume-01.webp","verbena":"assets/flowers/verbena-01.webp","wintersweet":"assets/flowers/wintersweet-01.webp","zinnia":"assets/flowers/zinnia-01.webp"};
const img = (id) => __flowerAssets[id] || 'assets/flowers/flower-fallback-01.webp';

const REFERENCE_IMAGE_OVERRIDES = Object.freeze({
  'leopard-plant': {
    url: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Farfugium_japonicum.jpg',
    creator: 'Juni', license: 'CC BY 2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Farfugium_japonicum.jpg'
  },
  'chinese-fringe-tree': {
    url: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chionanthus_retusus.jpg',
    creator: 'Stickpen', license: 'CC0 1.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Chionanthus_retusus.jpg'
  },
  'cornelian-cherry': {
    url: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cornus_officinalis.JPG',
    creator: 'Doctoroftcm', license: 'CC BY-SA 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Cornus_officinalis.JPG'
  },
  sasanqua: {
    url: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Camellia_sasanqua.jpg',
    creator: 'Juni', license: 'CC BY 2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Camellia_sasanqua.jpg'
  },
  wintersweet: {
    url: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chimonanthus_praecox_(18248235374).jpg',
    creator: 'M a n u e l', license: 'CC BY 2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Chimonanthus_praecox_(18248235374).jpg'
  },
  sunflower: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Sunflower_-a_close_up_view.jpg/1280px-Sunflower_-a_close_up_view.jpg',
    creator: 'Reji Jacob', license: 'Public domain',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Sunflower_-a_close_up_view.jpg'
  },
  mugunghwa: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Hibiscus_syriacus_Flower.jpg/960px-Hibiscus_syriacus_Flower.jpg',
    creator: 'PapiPijuan', license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Hibiscus_syriacus_Flower.jpg'
  },
  rose: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Rose_double.jpg/1280px-Rose_double.jpg',
    creator: 'Bontempi1953', license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Rose_double.jpg'
  },
  tulip: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/20260506_Tulip_closeup.jpg',
    creator: 'DanilWikiUser', license: 'CC0 1.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:20260506_Tulip_closeup.jpg'
  },
  hydrangea: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Blue_Hydrangea_Mathilda_Gutges_-blueflower.jpg/1280px-Blue_Hydrangea_Mathilda_Gutges_-blueflower.jpg',
    creator: 'Michele Dorsey Walfred', license: 'CC BY 2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Blue_Hydrangea_Mathilda_Gutges_-blueflower.jpg'
  },
  zinnia: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Zinnia_elegans_flower.jpg/960px-Zinnia_elegans_flower.jpg',
    creator: 'Sara Nabih', license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Zinnia_elegans_flower.jpg'
  },
  'crape-myrtle': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Lagerstroemia_indica_4.jpg/960px-Lagerstroemia_indica_4.jpg',
    creator: 'Juan Carlos Fonseca Mata', license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lagerstroemia_indica_4.jpg'
  },
  cosmos: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Cosmos_bipinnatus_pink%2C_Burdwan%2C_West_Bengal%2C_India_10_01_2013.jpg/960px-Cosmos_bipinnatus_pink%2C_Burdwan%2C_West_Bengal%2C_India_10_01_2013.jpg',
    creator: 'Joydeep', license: 'CC BY-SA 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Cosmos_bipinnatus_pink,_Burdwan,_West_Bengal,_India_10_01_2013.jpg'
  }
});

const TAXONOMY_BY_ID = Object.freeze({
  "sunflower": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Asterales",orderKo:"국화목",familyKo:"국화과",familyLatin:"Asteraceae",genusKo:"해바라기속",genusLatin:"Helianthus",acceptedName:"Helianthus annuus",taxonType:"종"}),
  "mugunghwa": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Malvales",orderKo:"아욱목",familyKo:"아욱과",familyLatin:"Malvaceae",genusKo:"무궁화속",genusLatin:"Hibiscus",acceptedName:"Hibiscus syriacus",taxonType:"종"}),
  "rose": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Rosales",orderKo:"장미목",familyKo:"장미과",familyLatin:"Rosaceae",genusKo:"장미속",genusLatin:"Rosa",acceptedName:"Rosa spp.",taxonType:"여러 종·원예품종 통칭",note:"장미는 Rosa 속의 여러 종과 원예품종을 함께 부르는 이름이에요."}),
  "tulip": Object.freeze({majorGroup:"monocots",majorGroupKo:"외떡잎식물군",order:"Liliales",orderKo:"백합목",familyKo:"백합과",familyLatin:"Liliaceae",genusKo:"튤립속",genusLatin:"Tulipa",acceptedName:"Tulipa gesneriana",taxonType:"종(재배기원)",note:"Kew POWO에서 재배 기원의 accepted species로 다뤄요."}),
  "cherry-blossom": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Rosales",orderKo:"장미목",familyKo:"장미과",familyLatin:"Rosaceae",genusKo:"벚나무속",genusLatin:"Prunus",acceptedName:"Prunus serrulata group",taxonType:"벚나무류 통칭",note:"벚꽃은 여러 벚나무류의 꽃을 가리켜 단일 종으로 고정하지 않아요."}),
  "forsythia": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Lamiales",orderKo:"꿀풀목",familyKo:"물푸레나무과",familyLatin:"Oleaceae",genusKo:"개나리속",genusLatin:"Forsythia",acceptedName:"Forsythia koreana",taxonType:"종"}),
  "azalea-korean": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Ericales",orderKo:"진달래목",familyKo:"진달래과",familyLatin:"Ericaceae",genusKo:"진달래속",genusLatin:"Rhododendron",acceptedName:"Rhododendron mucronulatum",taxonType:"종"}),
  "royal-azalea": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Ericales",orderKo:"진달래목",familyKo:"진달래과",familyLatin:"Ericaceae",genusKo:"진달래속",genusLatin:"Rhododendron",acceptedName:"Rhododendron schlippenbachii",taxonType:"종"}),
  "chrysanthemum": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Asterales",orderKo:"국화목",familyKo:"국화과",familyLatin:"Asteraceae",genusKo:"국화속",genusLatin:"Chrysanthemum",acceptedName:"Chrysanthemum × morifolium",taxonType:"교잡종",note:"Kew POWO에서 accepted hybrid로 다뤄요."}),
  "cosmos": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Asterales",orderKo:"국화목",familyKo:"국화과",familyLatin:"Asteraceae",genusKo:"코스모스속",genusLatin:"Cosmos",acceptedName:"Cosmos bipinnatus",taxonType:"종"}),
  "zinnia": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Asterales",orderKo:"국화목",familyKo:"국화과",familyLatin:"Asteraceae",genusKo:"백일홍속",genusLatin:"Zinnia",acceptedName:"Zinnia elegans",taxonType:"종"}),
  "crape-myrtle": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Myrtales",orderKo:"도금양목",familyKo:"부처꽃과",familyLatin:"Lythraceae",genusKo:"배롱나무속",genusLatin:"Lagerstroemia",acceptedName:"Lagerstroemia indica",taxonType:"종"}),
  "trumpet-creeper": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Lamiales",orderKo:"꿀풀목",familyKo:"능소화과",familyLatin:"Bignoniaceae",genusKo:"능소화속",genusLatin:"Campsis",acceptedName:"Campsis grandiflora",taxonType:"종"}),
  "hydrangea": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Cornales",orderKo:"층층나무목",familyKo:"수국과",familyLatin:"Hydrangeaceae",genusKo:"수국속",genusLatin:"Hydrangea",acceptedName:"Hydrangea macrophylla",taxonType:"종"}),
  "camellia": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Ericales",orderKo:"진달래목",familyKo:"차나무과",familyLatin:"Theaceae",genusKo:"동백나무속",genusLatin:"Camellia",acceptedName:"Camellia japonica",taxonType:"종"}),
  "canola": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Brassicales",orderKo:"십자화목",familyKo:"배추과",familyLatin:"Brassicaceae",genusKo:"배추속",genusLatin:"Brassica",acceptedName:"Brassica napus",taxonType:"종(재배기원)",note:"재배 기원의 종이며 Kew POWO에서 accepted species로 다뤄요."}),
  "dandelion": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Asterales",orderKo:"국화목",familyKo:"국화과",familyLatin:"Asteraceae",genusKo:"민들레속",genusLatin:"Taraxacum",acceptedName:"Taraxacum spp.",taxonType:"여러 종 통칭",note:"민들레는 앱에서 Taraxacum 속 여러 종을 함께 다뤄요."}),
  "magnolia": Object.freeze({majorGroup:"magnoliids",majorGroupKo:"목련군",order:"Magnoliales",orderKo:"목련목",familyKo:"목련과",familyLatin:"Magnoliaceae",genusKo:"목련속",genusLatin:"Magnolia",acceptedName:"Magnolia kobus",taxonType:"종",note:"목련은 외떡잎/진정쌍떡잎이 아니라 목련군에 속해요."}),
  "lavender": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Lamiales",orderKo:"꿀풀목",familyKo:"꿀풀과",familyLatin:"Lamiaceae",genusKo:"라벤더속",genusLatin:"Lavandula",acceptedName:"Lavandula angustifolia",taxonType:"종"}),
  "lotus": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Proteales",orderKo:"Proteales",familyKo:"연꽃과",familyLatin:"Nelumbonaceae",genusKo:"연꽃속",genusLatin:"Nelumbo",acceptedName:"Nelumbo nucifera",taxonType:"종"}),
  "ume": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Rosales",orderKo:"장미목",familyKo:"장미과",familyLatin:"Rosaceae",genusKo:"벚나무속",genusLatin:"Prunus",acceptedName:"Prunus mume",taxonType:"종"}),
  "morning-glory": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Solanales",orderKo:"가지목",familyKo:"메꽃과",familyLatin:"Convolvulaceae",genusKo:"고구마속",genusLatin:"Ipomoea",acceptedName:"Ipomoea nil",taxonType:"종"}),
  "coreopsis": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Asterales",orderKo:"국화목",familyKo:"국화과",familyLatin:"Asteraceae",genusKo:"기생초속",genusLatin:"Coreopsis",acceptedName:"Coreopsis lanceolata",taxonType:"종"}),
  "shasta-daisy": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Asterales",orderKo:"국화목",familyKo:"국화과",familyLatin:"Asteraceae",genusKo:"프랑스국화속",genusLatin:"Leucanthemum",acceptedName:"Leucanthemum × superbum",taxonType:"교잡종",note:"원예 교잡종이라 단일 야생종과 같은 방식으로 보지 않아요."}),
  "aster": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Asterales",orderKo:"국화목",familyKo:"국화과",familyLatin:"Asteraceae",genusKo:"심피오트리쿰속 등",genusLatin:"Symphyotrichum",acceptedName:"Symphyotrichum spp.",taxonType:"여러 종 통칭",note:"아스타라는 원예 이름은 여러 비슷한 국화과 식물에 쓰여 앱에서는 Symphyotrichum 중심의 통칭으로 다뤄요."}),
  "daffodil": Object.freeze({majorGroup:"monocots",majorGroupKo:"외떡잎식물군",order:"Asparagales",orderKo:"비짜루목",familyKo:"수선화과",familyLatin:"Amaryllidaceae",genusKo:"수선화속",genusLatin:"Narcissus",acceptedName:"Narcissus spp.",taxonType:"여러 종·원예품종 통칭",note:"수선화는 Narcissus 속 여러 종과 원예품종을 포함해요."}),
  "peony": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Saxifragales",orderKo:"범의귀목",familyKo:"작약과",familyLatin:"Paeoniaceae",genusKo:"작약속",genusLatin:"Paeonia",acceptedName:"Paeonia lactiflora",taxonType:"종"}),
  "poppy": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Ranunculales",orderKo:"미나리아재비목",familyKo:"양귀비과",familyLatin:"Papaveraceae",genusKo:"양귀비속",genusLatin:"Papaver",acceptedName:"Papaver rhoeas",taxonType:"종"}),
  "lily": Object.freeze({majorGroup:"monocots",majorGroupKo:"외떡잎식물군",order:"Liliales",orderKo:"백합목",familyKo:"백합과",familyLatin:"Liliaceae",genusKo:"백합속",genusLatin:"Lilium",acceptedName:"Lilium spp.",taxonType:"여러 종·원예품종 통칭",note:"백합은 Lilium 속 여러 종과 원예품종을 함께 다뤄요."}),
  "iris": Object.freeze({majorGroup:"monocots",majorGroupKo:"외떡잎식물군",order:"Asparagales",orderKo:"비짜루목",familyKo:"붓꽃과",familyLatin:"Iridaceae",genusKo:"붓꽃속",genusLatin:"Iris",acceptedName:"Iris sanguinea",taxonType:"종"}),
  "balloon-flower": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Asterales",orderKo:"국화목",familyKo:"초롱꽃과",familyLatin:"Campanulaceae",genusKo:"도라지속",genusLatin:"Platycodon",acceptedName:"Platycodon grandiflorus",taxonType:"종"}),
  "red-spider-lily": Object.freeze({majorGroup:"monocots",majorGroupKo:"외떡잎식물군",order:"Asparagales",orderKo:"비짜루목",familyKo:"수선화과",familyLatin:"Amaryllidaceae",genusKo:"상사화속",genusLatin:"Lycoris",acceptedName:"Lycoris radiata",taxonType:"종"}),
  "silver-grass": Object.freeze({majorGroup:"monocots",majorGroupKo:"외떡잎식물군",order:"Poales",orderKo:"벼목",familyKo:"벼과",familyLatin:"Poaceae",genusKo:"억새속",genusLatin:"Miscanthus",acceptedName:"Miscanthus sinensis",taxonType:"종"}),
  "gaura": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Myrtales",orderKo:"도금양목",familyKo:"바늘꽃과",familyLatin:"Onagraceae",genusKo:"달맞이꽃속",genusLatin:"Oenothera",acceptedName:"Oenothera lindheimeri",taxonType:"종",note:"예전 Gaura lindheimeri는 현재 Kew POWO에서 이 이름의 이명으로 다뤄요."}),
  "verbena": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Lamiales",orderKo:"꿀풀목",familyKo:"마편초과",familyLatin:"Verbenaceae",genusKo:"",genusLatin:"Glandularia",acceptedName:"Glandularia × hybrida",taxonType:"인공교잡종",note:"기존 Verbena × hybrida는 Kew POWO에서 Glandularia × hybrida의 이명으로 다뤄요."}),
  "snowdrop": Object.freeze({majorGroup:"monocots",majorGroupKo:"외떡잎식물군",order:"Asparagales",orderKo:"비짜루목",familyKo:"수선화과",familyLatin:"Amaryllidaceae",genusKo:"설강화속",genusLatin:"Galanthus",acceptedName:"Galanthus nivalis",taxonType:"종"}),
  "adonis": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Ranunculales",orderKo:"미나리아재비목",familyKo:"미나리아재비과",familyLatin:"Ranunculaceae",genusKo:"복수초속",genusLatin:"Adonis",acceptedName:"Adonis amurensis",taxonType:"종"}),
  "hellebore": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Ranunculales",orderKo:"미나리아재비목",familyKo:"미나리아재비과",familyLatin:"Ranunculaceae",genusKo:"헬레보루스속",genusLatin:"Helleborus",acceptedName:"Helleborus × hybridus",taxonType:"원예교잡종",note:"원예 교잡계통이므로 단일 야생종과 구분해 표시해요."}),
  "pansy": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Malpighiales",orderKo:"말피기목",familyKo:"제비꽃과",familyLatin:"Violaceae",genusKo:"제비꽃속",genusLatin:"Viola",acceptedName:"Viola × wittrockiana",taxonType:"인공교잡종",note:"Kew POWO에서 artificial hybrid로 다뤄요."}),
  "cyclamen": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Ericales",orderKo:"진달래목",familyKo:"앵초과",familyLatin:"Primulaceae",genusKo:"시클라멘속",genusLatin:"Cyclamen",acceptedName:"Cyclamen persicum",taxonType:"종"}),
  "plum-blossom-red": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Rosales",orderKo:"장미목",familyKo:"장미과",familyLatin:"Rosaceae",genusKo:"벚나무속",genusLatin:"Prunus",acceptedName:"Prunus mume cultivars",taxonType:"재배품종군",note:"홍매화는 매실나무(Prunus mume)의 붉은 꽃 재배품종군을 가리켜요."}),
  "gerbera": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Asterales",orderKo:"국화목",familyKo:"국화과",familyLatin:"Asteraceae",genusKo:"거베라속",genusLatin:"Gerbera",acceptedName:"Gerbera jamesonii",taxonType:"원예 교잡계통",note:"시중 거베라는 G. jamesonii 계통을 중심으로 다양한 원예 교잡계통이 있어 단일 종으로 단정하지 않아요."}),
  "marigold": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Asterales",orderKo:"국화목",familyKo:"국화과",familyLatin:"Asteraceae",genusKo:"천수국속",genusLatin:"Tagetes",acceptedName:"Tagetes spp.",taxonType:"여러 종·원예품종 통칭",note:"메리골드는 Tagetes 속의 여러 종과 원예품종을 함께 부르는 이름이에요."}),
  "salvia": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Lamiales",orderKo:"꿀풀목",familyKo:"꿀풀과",familyLatin:"Lamiaceae",genusKo:"배암차즈기속",genusLatin:"Salvia",acceptedName:"Salvia splendens",taxonType:"종"}),
  "globe-amaranth": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Caryophyllales",orderKo:"석죽목",familyKo:"비름과",familyLatin:"Amaranthaceae",genusKo:"천일홍속",genusLatin:"Gomphrena",acceptedName:"Gomphrena globosa",taxonType:"종"}),
  "wintersweet": Object.freeze({majorGroup:"magnoliids",majorGroupKo:"목련군",order:"Laurales",orderKo:"녹나무목",familyKo:"받침꽃과",familyLatin:"Calycanthaceae",genusKo:"납매속",genusLatin:"Chimonanthus",acceptedName:"Chimonanthus praecox",taxonType:"종"}),
  "sasanqua": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Ericales",orderKo:"진달래목",familyKo:"차나무과",familyLatin:"Theaceae",genusKo:"동백나무속",genusLatin:"Camellia",acceptedName:"Camellia sasanqua",taxonType:"종"}),
  "cornelian-cherry": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Cornales",orderKo:"층층나무목",familyKo:"층층나무과",familyLatin:"Cornaceae",genusKo:"층층나무속",genusLatin:"Cornus",acceptedName:"Cornus officinalis",taxonType:"종"}),
  "chinese-fringe-tree": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Lamiales",orderKo:"꿀풀목",familyKo:"물푸레나무과",familyLatin:"Oleaceae",genusKo:"이팝나무속",genusLatin:"Chionanthus",acceptedName:"Chionanthus retusus",taxonType:"종"}),
  "leopard-plant": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Asterales",orderKo:"국화목",familyKo:"국화과",familyLatin:"Asteraceae",genusKo:"털머위속",genusLatin:"Farfugium",acceptedName:"Farfugium japonicum",taxonType:"종"}),
  "red-clover": Object.freeze({majorGroup:"eudicots",majorGroupKo:"진정쌍떡잎식물군",order:"Fabales",orderKo:"콩목",familyKo:"콩과",familyLatin:"Fabaceae",genusKo:"토끼풀속",genusLatin:"Trifolium",acceptedName:"Trifolium pratense",taxonType:"종",note:"국가생물종목록에서 귀화식물로 기록된 여러해살이풀이다."})
});

const STANDARD_NAME_OVERRIDES = Object.freeze({
  'camellia': '동백나무',
  'canola': '유채',
  'ume': '매실나무',
  'balloon-flower': '도라지',
  'red-spider-lily': '석산',
  'silver-grass': '억새'
});

const FLOWER_LANGUAGE_SOURCES = Object.freeze({
  nihhs: Object.freeze({ label: '국립원예특작과학원 꽃말사전', url: 'https://www.nihhs.go.kr/usr/persnal/Flower_library.do' }),
  rhs: Object.freeze({ label: 'RHS The meaning of flowers', url: 'https://www.rhs.org.uk/education-learning/school-gardening/resources/curriculum-linked/the-meaning-of-flowers' }),
  smithsonian: Object.freeze({ label: 'Smithsonian Gardens · Language of Flowers', url: 'https://gardens.si.edu/learn/blog/the-language-of-flowers/' })
});

const FLOWER_LANGUAGE_BY_ID = Object.freeze({
  'sunflower': { meaning: '동경 · 숭배', level: '보통', note: '국내외 자료 모두 해바라기를 동경·헌신 계열 의미와 연결하지만 표현은 조금 달라요.', sources: ['nihhs','rhs'] },
  'mugunghwa': { meaning: '은근 · 끈기 · 섬세한 아름다움', level: '보통', note: '국내 원예자료에서 널리 쓰이는 의미예요.', sources: ['nihhs'] },
  'rose': { meaning: '사랑 · 아름다움', level: '낮음', note: '장미는 색과 문화에 따라 꽃말 차이가 특히 커요.', sources: ['rhs','smithsonian'] },
  'tulip': { meaning: '자애 · 명성 · 명예', level: '낮음', note: '튤립은 색에 따라 사랑·용서 등 다른 의미도 널리 쓰여요.', sources: ['nihhs','rhs','smithsonian'] },
  'cherry-blossom': { meaning: '아름다운 정신 · 삶의 덧없음', level: '낮음', note: '벚꽃은 문화권에 따라 상징 의미가 크게 달라요.', sources: ['nihhs'] },
  'forsythia': { meaning: '희망', level: '보통', note: '국내 꽃말 자료에서 반복적으로 쓰이는 의미예요.', sources: ['nihhs'] },
  'azalea-korean': { meaning: '절제', level: '보통', note: '국내 꽃말 자료를 중심으로 정리했어요.', sources: ['nihhs'] },
  'royal-azalea': { meaning: '정열 · 명예', level: '보통', note: '국내 꽃말 자료를 중심으로 정리했어요.', sources: ['nihhs'] },
  'chrysanthemum': { meaning: '청결 · 정조 · 순결', level: '낮음', note: '국화는 색에 따라 의미가 달라지는 대표적인 꽃이에요.', sources: ['nihhs','rhs'] },
  'cosmos': { meaning: '순정 · 조화', level: '낮음', note: '자료마다 순정·조화·겸손 등 표현 차이가 있어요.', sources: ['nihhs'] },
  'zinnia': { meaning: '떠나간 벗을 그리워함', level: '낮음', note: '오래된 꽃말 전통에서 주로 전해지는 의미라 자료에 따라 표현이 달라요.', sources: ['smithsonian'] },
  'crape-myrtle': { meaning: '헤어진 벗에게 보내는 마음', level: '보통', note: '국내 원예자료에서 쓰이는 의미예요.', sources: ['nihhs'] },
  'trumpet-creeper': { meaning: '명예', level: '낮음', note: '국내 자료에서도 표현이 하나로 완전히 통일되지는 않아요.', sources: ['nihhs'] },
  'hydrangea': { meaning: '냉정 · 무정 · 거만', level: '낮음', note: '수국은 문화권과 꽃색에 따라 감사·진심 등 전혀 다른 의미도 쓰여요.', sources: ['nihhs','rhs'] },
  'camellia': { meaning: '겸손한 아름다움', level: '낮음', note: '동백은 색과 문화권에 따라 의미가 달라질 수 있어요.', sources: ['nihhs'] },
  'canola': { meaning: '명랑 · 기분 전환', level: '보통', note: '국내 꽃말 자료를 중심으로 정리했어요.', sources: ['nihhs'] },
  'dandelion': { meaning: '사랑의 신탁 · 행복', level: '낮음', note: '민들레는 민속적 해석이 많아 자료별 차이가 커요.', sources: ['nihhs'] },
  'magnolia': { meaning: '숭고한 정신 · 자연애', level: '낮음', note: '목련류는 종과 문화권에 따라 의미가 달라요.', sources: ['nihhs'] },
  'lavender': { meaning: '헌신 · 정절', level: '낮음', note: '서양 꽃말 자료에서는 헌신 등으로 설명되며 국내 표현과 차이가 있을 수 있어요.', sources: ['rhs'] },
  'lotus': { meaning: '청정 · 신성', level: '낮음', note: '연꽃은 종교·문화적 상징의 영향이 커서 일반 꽃말과 구분해 봐야 해요.', sources: ['nihhs'] },
  'ume': { meaning: '고결 · 인내', level: '낮음', note: '매화는 동아시아 문화적 상징과 꽃말이 함께 쓰여 자료별 표현이 달라요.', sources: ['nihhs'] },
  'morning-glory': { meaning: '기쁜 소식 · 덧없는 사랑', level: '낮음', note: '나팔꽃은 상반된 의미가 함께 전해지는 경우가 있어요.', sources: ['nihhs'] },
  'coreopsis': { meaning: '상쾌한 기분', level: '낮음', note: '국내 원예자료 중심의 참고 의미예요.', sources: ['nihhs'] },
  'shasta-daisy': { meaning: '순진 · 평화', level: '낮음', note: '데이지류 전체 의미가 섞여 쓰이는 경우가 많아 종 단위로는 주의가 필요해요.', sources: ['rhs'] },
  'aster': { meaning: '믿는 사랑 · 추억', level: '낮음', note: '아스타/애스터류를 묶어 전해지는 꽃말이 많아 종별 차이가 있을 수 있어요.', sources: ['rhs'] },
  'daffodil': { meaning: '존중 · 기사도', level: '보통', note: '서양 자료에서 비교적 반복되는 의미지만 국내 자료와 표현은 다를 수 있어요.', sources: ['rhs'] },
  'peony': { meaning: '수줍음', level: '보통', note: '국내외 꽃말 자료에서 수줍음 계열 의미가 겹쳐요.', sources: ['nihhs','rhs','smithsonian'] },
  'poppy': { meaning: '위안 · 휴식', level: '낮음', note: '양귀비류는 색과 종에 따라 의미가 크게 달라요.', sources: ['rhs'] },
  'lily': { meaning: '순결 · 깨끗한 마음', level: '보통', note: '국내외 자료에서 순결 계열 의미가 자주 겹치지만 백합류 전체를 묶은 표현이에요.', sources: ['nihhs','rhs'] },
  'iris': { meaning: '좋은 소식 · 사랑의 메시지', level: '낮음', note: '붓꽃류와 꽃색에 따라 다른 의미가 함께 쓰여요.', sources: ['nihhs','rhs'] },
  'balloon-flower': { meaning: '성실 · 품위', level: '보통', note: '국내 원예자료에서 반복적으로 쓰이는 의미예요.', sources: ['nihhs'] },
  'red-spider-lily': { meaning: '그리움 · 슬픈 추억', level: '낮음', note: '석산의 꽃말은 문화권과 인터넷 자료별 차이가 매우 커 참고용으로 보는 게 좋아요.', sources: ['nihhs'] },
  'silver-grass': { meaning: '활력 · 세력', level: '낮음', note: '억새는 꽃말 자료가 많지 않아 국내 자료 중심의 참고 의미예요.', sources: ['nihhs'] },
  'gaura': { meaning: '섬세함 · 자유로운 마음', level: '낮음', note: '가우라는 통용 꽃말의 출처가 제한적이라 참고 수준으로만 제공해요.', sources: ['nihhs'] },
  'verbena': { meaning: '단결', level: '보통', note: '국내 꽃말 자료에서 쓰이는 의미예요.', sources: ['nihhs'] },
  'snowdrop': { meaning: '희망', level: '보통', note: '서양 꽃말 자료에서 희망의 의미가 반복돼요.', sources: ['rhs','smithsonian'] },
  'adonis': { meaning: '영원한 행복 · 회상', level: '낮음', note: '복수초는 국내 자료와 전승에 따라 표현 차이가 있어요.', sources: ['nihhs'] },
  'hellebore': { meaning: '존재 이유', level: '보통', note: '국내 원예자료에서 확인되는 의미예요.', sources: ['nihhs'] },
  'pansy': { meaning: '나를 생각해 주세요 · 사색', level: '보통', note: '서양 꽃말의 ‘thought’ 계열 의미와 국내 통용 의미가 비슷해요.', sources: ['rhs','smithsonian'] },
  'cyclamen': { meaning: '수줍음 · 내성적', level: '낮음', note: '지역과 자료에 따라 이별 등 다른 의미도 쓰여요.', sources: ['nihhs'] },
  'plum-blossom-red': { meaning: '고결 · 인내', level: '낮음', note: '홍매화도 매화의 문화적 상징과 함께 설명되는 경우가 많아요.', sources: ['nihhs'] },
  'gerbera': { meaning: '신비 · 수수께끼', level: '낮음', note: '거베라는 색별 꽃말이 다양하고 자료별 차이가 커요.', sources: ['nihhs'] },
  'marigold': { meaning: '질투 · 비애', level: '낮음', note: 'Tagetes 계열 기준이며 금잔화(Calendula)의 꽃말과 섞지 않았어요.', sources: ['nihhs'] },
  'salvia': { meaning: '불타는 마음 · 정열', level: '낮음', note: '살비아류는 종과 꽃색에 따라 의미 차이가 있어요.', sources: ['nihhs'] },
  'globe-amaranth': { meaning: '변치 않는 사랑', level: '낮음', note: '꽃이 오래 형태를 유지하는 특징에서 유래한 통용 의미로, 자료별 표현 차이가 있어요.', sources: ['nihhs'] }
});

function flowerLanguageFor(id) {
  const entry = FLOWER_LANGUAGE_BY_ID[id];
  if (!entry) return null;
  return Object.freeze({
    ...entry,
    sources: Object.freeze((entry.sources || []).map((key) => FLOWER_LANGUAGE_SOURCES[key]).filter(Boolean))
  });
}

function flower(data) {
  const taxonomyData = TAXONOMY_BY_ID[data.id] || {};
  const imageDisabled = data.id === 'pansy';
  const localImage = imageDisabled ? '' : (data.localImage || img(data.id));
  const curated = imageDisabled ? null : REFERENCE_IMAGE_OVERRIDES[data.id];
  const standardNameKo = data.standardNameKo || STANDARD_NAME_OVERRIDES[data.id] || '';
  return {
    colors: [],
    seasons: [],
    searchKeywords: [],
    eventKeywords: [],
    alternateNames: [],
    lookalikes: [],
    ...data,
    flowerLanguage: data.flowerLanguage || flowerLanguageFor(data.id),
    taxonomy: Object.freeze({
      kingdomKo: '식물계', kingdom: 'Plantae',
      phylumKo: '스트렙토식물문', phylum: 'Streptophyta',
      className: '속새강 · Equisetopsida', subclassName: '목련아강 · Magnoliidae',
      ...taxonomyData
    }),
    standardNameKo,
    localImage,
    image: imageDisabled ? '' : (data.image || curated?.url || localImage),
    imageCredit: data.imageCredit || (curated ? {
      creator: curated.creator,
      license: curated.license,
      sourceUrl: curated.sourceUrl,
      curated: true
    } : null)
  };
}

const SEASONS = Object.freeze(['봄', '여름', '가을', '겨울']);
const COLORS = Object.freeze(['흰색', '노랑', '분홍', '빨강', '보라', '파랑', '주황']);
const EVENT_SEARCH_KEYWORDS = Object.freeze(['꽃', '정원', '식물원', '수목원', '꽃축제', '정원축제', '박람회']);

const FLOWERS = Object.freeze([
  flower({id:'sunflower',nameKo:'해바라기',nameEn:'Sunflower',scientificName:'Helianthus annuus',family:'국화과',genus:'해바라기속',colors:['노랑'],bloom:{start:'07-01',end:'09-15'},seasons:['여름','가을'],description:'큰 두상화가 눈에 띄는 한해살이풀로 햇볕이 충분한 곳에서 잘 자란다.',identificationFeatures:'키가 크고 중앙의 짙은 원반꽃 둘레를 노란 혀꽃이 둘러싼다.',leafFeatures:'넓고 거친 잎이 줄기에 달린다.',flowerFeatures:'큰 원반 모양 꽃차례가 특징적이다.',habitat:'밭, 정원, 공원 등 햇볕이 잘 드는 곳',care:{sunlight:'양지',watering:'겉흙이 마르면 충분히',difficulty:'보통'},koreaViewingPeriod:'대체로 여름~초가을',searchKeywords:['여름꽃','태양꽃'],eventKeywords:['해바라기','여름꽃','꽃','정원','꽃축제'],lookalikes:[{nameKo:'금계국',scientificName:'Coreopsis lanceolata',targetId:'coreopsis',reason:'둘 다 국화과의 노란 데이지형 꽃이라 작은 해바라기 품종이나 멀리서 볼 때 비슷하게 느껴질 수 있다.',differences:['해바라기는 잎이 넓고 거칠며 일반적인 형태는 큰 꽃머리와 짙은 갈색~자주색 중심이 눈에 띈다.','금계국은 꽃이 훨씬 작고 중심부도 노란색 계열이며 길쭉한 잎이 줄기 아래쪽에 많이 달린다.'],tip:'꽃 중심 색과 잎을 함께 본다. 짙은 큰 중심과 넓고 거친 잎이면 해바라기 쪽이다.'}]}),
  flower({id:'mugunghwa',nameKo:'무궁화',nameEn:'Rose of Sharon',scientificName:'Hibiscus syriacus',family:'아욱과',genus:'무궁화속',colors:['흰색','분홍','보라'],bloom:{start:'07-01',end:'10-10'},seasons:['여름','가을'],description:'여름부터 가을까지 비교적 오랫동안 꽃을 볼 수 있는 낙엽관목이다.',identificationFeatures:'깔때기 모양 꽃과 중앙의 긴 수술기둥이 눈에 띈다.',leafFeatures:'잎은 어긋나고 가장자리에 톱니가 있다.',flowerFeatures:'품종에 따라 흰색·분홍·보라빛 등 색이 다양하다.',habitat:'정원, 공원, 길가 식재지',care:{sunlight:'양지',watering:'과습을 피하고 토양 상태에 맞게',difficulty:'보통'},koreaViewingPeriod:'대체로 7~10월',searchKeywords:['국화 국가상징','히비스커스'],eventKeywords:['무궁화','여름꽃','꽃','정원']}),
  flower({id:'rose',nameKo:'장미',nameEn:'Rose',scientificName:'Rosa spp.',family:'장미과',genus:'장미속',colors:['빨강','분홍','흰색','노랑','주황'],bloom:{start:'05-10',end:'06-30'},seasons:['봄','여름'],description:'수많은 원예 품종이 재배되는 대표적인 관상식물이다.',identificationFeatures:'겹겹의 꽃잎을 가진 품종이 많고 줄기에 가시가 있는 경우가 흔하다.',leafFeatures:'여러 장의 소엽으로 이루어진 겹잎이 흔하다.',flowerFeatures:'품종에 따라 꽃 크기와 형태, 향기가 매우 다양하다.',habitat:'정원, 공원, 장미원',care:{sunlight:'충분한 햇빛',watering:'통풍을 확보하고 뿌리 쪽에 물주기',difficulty:'보통'},precautions:'품종에 따라 줄기의 가시에 주의한다.',koreaViewingPeriod:'봄~초여름 중심, 품종에 따라 반복 개화',searchKeywords:['로즈','장미원'],eventKeywords:['장미','장미축제','꽃','정원','꽃축제']}),
  flower({id:'tulip',nameKo:'튤립',nameEn:'Tulip',scientificName:'Tulipa gesneriana',family:'백합과',genus:'튤립속',colors:['빨강','분홍','노랑','흰색','보라','주황'],bloom:{start:'04-01',end:'05-10'},seasons:['봄'],description:'봄 화단에서 널리 볼 수 있는 구근식물로 품종에 따라 색과 꽃 모양이 다양하다.',identificationFeatures:'곧은 꽃대 끝에 컵 모양 꽃이 하나씩 피는 형태가 흔하다.',leafFeatures:'폭이 넓고 매끈한 잎이 밑에서 나온다.',flowerFeatures:'컵 또는 종 모양이며 다양한 색의 원예 품종이 있다.',habitat:'화단, 정원, 공원',care:{sunlight:'양지~반양지',watering:'배수가 잘되게 관리',difficulty:'보통'},koreaViewingPeriod:'대체로 4~5월',searchKeywords:['구근','봄꽃'],eventKeywords:['튤립','봄꽃','꽃축제','정원']}),
  flower({id:'cherry-blossom',nameKo:'벚꽃',nameEn:'Cherry blossom',scientificName:'Prunus serrulata group',family:'장미과',genus:'벚나무속',colors:['분홍','흰색'],bloom:{start:'03-20',end:'04-20'},seasons:['봄'],description:'벚나무류에 피는 봄꽃을 통칭하며 지역과 품종에 따라 개화 시기가 크게 달라진다.',identificationFeatures:'가지에 여러 꽃이 모여 피며 꽃잎 끝이 살짝 갈라져 보이는 경우가 많다.',leafFeatures:'개화 뒤 잎이 본격적으로 펼쳐지는 종류가 많다.',flowerFeatures:'흰색부터 연분홍까지 색 변화가 있다.',habitat:'가로수길, 공원, 하천변, 산지',koreaViewingPeriod:'대체로 3월 말~4월, 지역 차이 큼',searchKeywords:['벚나무','사쿠라','봄꽃'],eventKeywords:['벚꽃','벚꽃축제','봄꽃','관광','꽃축제'],lookalikes:[{nameKo:'매화',scientificName:'Prunus mume',targetId:'ume',reason:'둘 다 장미과 벚나무속의 봄꽃으로 흰색이나 분홍색 다섯 꽃잎 꽃을 피워 개화기 초반에 헷갈릴 수 있다.',differences:['매화는 늦겨울~이른 봄의 잎 없는 가지에 향기로운 꽃이 피는 것이 특징적이다.','벚꽃류는 대체로 매화보다 늦은 봄에 풍성하게 피며, 여러 꽃이 모여 보이는 경우가 많다.'],tip:'개화 시기와 향, 꽃이 가지에 붙는 전체 모습을 함께 확인한다.'}]}),
  flower({id:'forsythia',nameKo:'개나리',nameEn:'Korean forsythia',scientificName:'Forsythia koreana',family:'물푸레나무과',genus:'개나리속',colors:['노랑'],bloom:{start:'03-15',end:'04-20'},seasons:['봄'],description:'이른 봄 잎보다 꽃이 먼저 눈에 띄는 낙엽관목이다.',identificationFeatures:'길게 늘어지는 가지를 따라 노란 네 갈래 꽃이 촘촘히 핀다.',leafFeatures:'꽃이 진 뒤 마주나는 잎이 뚜렷해진다.',flowerFeatures:'밝은 노란색의 통꽃이 네 갈래로 갈라진다.',habitat:'공원, 주택가, 산기슭 식재지',koreaViewingPeriod:'대체로 3~4월',searchKeywords:['노란봄꽃','관목'],eventKeywords:['개나리','봄꽃','꽃축제','공원']}),
  flower({id:'azalea-korean',nameKo:'진달래',nameEn:'Korean rosebay',scientificName:'Rhododendron mucronulatum',family:'진달래과',genus:'진달래속',colors:['분홍','보라'],bloom:{start:'03-20',end:'04-30'},seasons:['봄'],description:'산지에서 이른 봄에 흔히 볼 수 있는 낙엽성 진달래류다.',identificationFeatures:'잎이 본격적으로 나오기 전에 분홍빛 꽃이 가지에 피는 경우가 많다.',leafFeatures:'꽃 뒤에 타원형 잎이 나온다.',flowerFeatures:'깔때기 모양의 분홍~자주색 꽃이다.',habitat:'산지, 숲 가장자리',koreaViewingPeriod:'대체로 3~4월',searchKeywords:['참꽃','산꽃'],eventKeywords:['진달래','진달래축제','봄꽃','산꽃'],lookalikes:[{nameKo:'철쭉',scientificName:'Rhododendron schlippenbachii',targetId:'royal-azalea',reason:'둘 다 봄 산지에서 분홍색 깔때기 모양 꽃이 피는 진달래속 식물이다.',differences:['진달래는 꽃이 잎보다 먼저 피는 경우가 흔하다.','철쭉은 꽃이 필 때 잎이 함께 나오며, 넓은 잎이 가지 끝에 모여 달린다.'],tip:'꽃 주변에 잎이 거의 없는지, 넓은 잎이 함께 펼쳐져 있는지 먼저 본다.'}]}),
  flower({id:'royal-azalea',nameKo:'철쭉',nameEn:'Royal azalea',scientificName:'Rhododendron schlippenbachii',family:'진달래과',genus:'진달래속',colors:['분홍'],bloom:{start:'04-20',end:'06-05'},seasons:['봄','여름'],description:'산지에서 늦봄 무렵 연분홍 꽃을 피우는 진달래과 낙엽관목이다.',identificationFeatures:'가지 끝에 여러 장의 잎이 모여 돌려난 듯 보이고 꽃이 비교적 크다.',leafFeatures:'넓은 도란형 잎이 가지 끝에 모여 달린다.',flowerFeatures:'연분홍색 깔때기 모양 꽃에 반점이 보이기도 한다.',habitat:'산지, 숲 가장자리',precautions:'관상용 식물은 임의로 먹지 않는 것이 안전하다.',koreaViewingPeriod:'대체로 4월 말~5월',searchKeywords:['연달래','산철쭉과구별'],eventKeywords:['철쭉','철쭉제','봄꽃','산꽃'],lookalikes:[{nameKo:'진달래',scientificName:'Rhododendron mucronulatum',targetId:'azalea-korean',reason:'둘 다 봄 산지에서 분홍빛 깔때기 모양 꽃을 피우는 진달래속 식물이라 멀리서 비슷해 보일 수 있다.',differences:['철쭉은 꽃이 필 무렵 넓은 잎이 함께 펼쳐지는 경우가 많고, 잎이 가지 끝에 모여 달린다.','진달래는 잎이 본격적으로 나오기 전에 꽃이 먼저 피는 모습이 흔하다.'],tip:'꽃만 보지 말고 꽃 주변에 잎이 함께 펼쳐져 있는지 확인한다.'}]}),
  flower({id:'chrysanthemum',nameKo:'국화',nameEn:'Chrysanthemum',scientificName:'Chrysanthemum × morifolium',family:'국화과',genus:'국화속',colors:['노랑','흰색','분홍','빨강','보라'],bloom:{start:'09-10',end:'11-20'},seasons:['가을'],description:'가을을 대표하는 원예 식물 중 하나로 다양한 꽃 모양과 색의 품종이 있다.',identificationFeatures:'여러 작은 꽃이 모인 두상화이며 품종별 형태 차이가 크다.',leafFeatures:'잎은 갈라지고 특유의 향이 나는 경우가 있다.',flowerFeatures:'홑꽃부터 겹꽃까지 매우 다양하다.',habitat:'정원, 화단, 전시 온실',care:{sunlight:'양지',watering:'과습을 피하고 흙 상태에 맞게',difficulty:'보통'},koreaViewingPeriod:'대체로 가을',searchKeywords:['가을꽃','국화전시'],eventKeywords:['국화','국화축제','가을꽃','꽃박람회'],lookalikes:[{nameKo:'샤스타데이지',scientificName:'Leucanthemum × superbum',targetId:'shasta-daisy',reason:'둘 다 국화과의 두상화를 가져 홑꽃 국화 품종은 흰 혀꽃과 노란 중심을 가진 샤스타데이지와 비슷해 보일 수 있다.',differences:['국화는 품종에 따라 꽃 모양과 색이 매우 다양하고 잎이 깊게 갈라지며 향이 나는 경우가 많다.','샤스타데이지는 대체로 흰 혀꽃과 노란 중심이 뚜렷하고 잎이 좁고 길며 가장자리에 톱니가 있다.'],tip:'꽃만 보지 말고 잎 모양을 확인한다. 깊게 갈라진 잎이면 국화 쪽, 길고 좁은 잎이면 샤스타데이지 쪽을 먼저 본다.',note:'국화는 품종 차이가 매우 커서 모든 품종에 같은 구별법을 적용할 수는 없다.'}]}),
  flower({id:'cosmos',nameKo:'코스모스',nameEn:'Cosmos',scientificName:'Cosmos bipinnatus',family:'국화과',genus:'코스모스속',colors:['분홍','흰색','빨강'],bloom:{start:'08-20',end:'10-31'},seasons:['여름','가을'],description:'가늘게 갈라진 잎과 가벼운 꽃 모양이 특징인 한해살이풀이다.',identificationFeatures:'가느다란 줄기와 깃털처럼 잘게 갈라진 잎, 넓은 혀꽃이 눈에 띈다.',leafFeatures:'실처럼 잘게 갈라진 잎이다.',flowerFeatures:'분홍·흰색 계열의 8장 안팎 혀꽃이 흔하다.',habitat:'하천변, 공원, 들판, 화단',koreaViewingPeriod:'늦여름~가을',searchKeywords:['가을꽃','들꽃'],eventKeywords:['코스모스','코스모스축제','가을꽃','꽃길']}),
  flower({id:'zinnia',nameKo:'백일홍',nameEn:'Zinnia',scientificName:'Zinnia elegans',family:'국화과',genus:'백일홍속',colors:['빨강','분홍','노랑','주황','흰색'],bloom:{start:'06-15',end:'10-15'},seasons:['여름','가을'],description:'여름부터 가을까지 비교적 오랜 기간 꽃을 즐길 수 있는 한해살이 원예식물이다.',identificationFeatures:'줄기가 곧고 꽃이 선명한 색으로 피며 잎이 마주난다.',leafFeatures:'넓은 피침형 또는 달걀형 잎이 마주난다.',flowerFeatures:'홑꽃과 겹꽃 등 품종이 다양하다.',habitat:'화단, 정원, 꽃밭',care:{sunlight:'양지',watering:'통풍과 배수를 확보',difficulty:'쉬움'},koreaViewingPeriod:'대체로 여름~가을',searchKeywords:['지니아','여름꽃'],eventKeywords:['백일홍','여름꽃','꽃밭','꽃축제'],lookalikes:[{nameKo:'거베라',scientificName:'Gerbera jamesonii hybrids',targetId:'gerbera',reason:'둘 다 국화과의 크고 선명한 데이지형 꽃을 다양한 색으로 피워 화단이나 절화에서 비슷해 보일 수 있다.',differences:['백일홍은 가지가 갈라지는 줄기에 잎이 마주나고 줄기 끝에 꽃이 핀다.','거베라는 잎이 뿌리 가까이에 로제트로 모이고, 잎이 거의 없는 긴 꽃대 끝에 큰 꽃머리가 하나씩 달린다.'],tip:'꽃 아래 줄기를 본다. 줄기에 마주난 잎이 이어지면 백일홍, 잎이 밑동에 모이고 긴 꽃대만 올라오면 거베라 쪽이다.'}]}),
  flower({id:'crape-myrtle',nameKo:'배롱나무',nameEn:'Crape myrtle',scientificName:'Lagerstroemia indica',family:'부처꽃과',genus:'배롱나무속',colors:['분홍','빨강','흰색','보라'],bloom:{start:'07-01',end:'09-20'},seasons:['여름','가을'],description:'한여름에 주름진 꽃잎이 모인 꽃차례를 만드는 낙엽성 나무다.',identificationFeatures:'매끈하고 얼룩진 듯 벗겨지는 수피와 풍성한 원추꽃차례가 특징이다.',leafFeatures:'작은 타원형 잎이 달린다.',flowerFeatures:'얇고 구겨진 듯한 꽃잎이 여러 장 모인다.',habitat:'공원, 정원, 사찰, 가로수',koreaViewingPeriod:'대체로 7~9월',searchKeywords:['목백일홍','여름나무꽃'],eventKeywords:['배롱나무','여름꽃','정원','사찰']}),
  flower({id:'trumpet-creeper',nameKo:'능소화',nameEn:'Chinese trumpet creeper',scientificName:'Campsis grandiflora',family:'능소화과',genus:'능소화속',colors:['주황'],bloom:{start:'06-20',end:'08-31'},seasons:['여름'],description:'벽이나 지지물을 타고 오르며 주황빛 나팔 모양 꽃을 피우는 덩굴성 식물이다.',identificationFeatures:'굵은 덩굴과 큰 주황색 통꽃이 아래로 늘어지듯 핀다.',leafFeatures:'여러 소엽으로 이루어진 깃꼴겹잎이다.',flowerFeatures:'넓게 벌어진 주황색 나팔 모양 꽃이다.',habitat:'담장, 정원, 공원',koreaViewingPeriod:'대체로 여름',searchKeywords:['담장꽃','덩굴꽃'],eventKeywords:['능소화','여름꽃','정원','꽃길']}),
  flower({id:'hydrangea',nameKo:'수국',nameEn:'Hydrangea',scientificName:'Hydrangea macrophylla',family:'수국과',genus:'수국속',colors:['파랑','보라','분홍','흰색'],bloom:{start:'06-01',end:'07-31'},seasons:['여름'],description:'초여름에 큰 공 모양 또는 반구형 꽃차례가 돋보이는 관목이다.',identificationFeatures:'작은 꽃들이 큰 덩어리처럼 모여 보이며 잎이 넓다.',leafFeatures:'넓은 타원형 잎에 톱니가 있다.',flowerFeatures:'토양과 품종 등에 따라 다양한 색으로 보일 수 있다.',habitat:'정원, 수목원, 반그늘이 있는 식재지',care:{sunlight:'반양지~반그늘',watering:'건조하지 않도록 흙 상태 확인',difficulty:'보통'},koreaViewingPeriod:'대체로 6~7월',searchKeywords:['초여름꽃','하이드레인지아'],eventKeywords:['수국','수국축제','초여름꽃','정원','수목원']}),
  flower({id:'camellia',nameKo:'동백꽃',nameEn:'Camellia',scientificName:'Camellia japonica',family:'차나무과',genus:'동백나무속',colors:['빨강','분홍','흰색'],bloom:{start:'11-20',end:'03-31'},seasons:['겨울','봄'],description:'상록성 동백나무에 피는 꽃으로 따뜻한 남부 지역과 해안에서 겨울~봄에 볼 수 있다.',identificationFeatures:'광택 있는 두꺼운 상록 잎과 큼직한 꽃이 함께 보인다.',leafFeatures:'두껍고 윤기 있는 타원형 잎이다.',flowerFeatures:'붉은색이 흔하지만 품종에 따라 색과 겹 정도가 다양하다.',habitat:'남부 해안, 섬 지역, 정원',koreaViewingPeriod:'겨울~이른 봄, 지역에 따라 차이 큼',searchKeywords:['겨울꽃','동백나무'],eventKeywords:['동백','동백꽃','겨울꽃','수목원','섬 관광'],lookalikes:[{nameKo:'애기동백',scientificName:'Camellia sasanqua',targetId:'sasanqua',reason:'둘 다 광택 있는 상록 잎과 붉거나 분홍·흰 꽃을 가진 동백나무속 식물이다.',differences:['애기동백은 대체로 가을~겨울에 먼저 피고, 동백꽃은 늦겨울~봄에 중심적으로 핀다.','동백류는 품종에 따라 꽃 모양 차이가 커서 꽃 모양 하나만으로 단정하기 어렵다.'],tip:'꽃 모양만 보지 말고 개화 시기를 함께 확인한다.'}]}),
  flower({id:'canola',nameKo:'유채꽃',nameEn:'Rapeseed flower',scientificName:'Brassica napus',family:'배추과',genus:'배추속',colors:['노랑'],bloom:{start:'03-01',end:'05-10'},seasons:['봄'],description:'넓은 밭을 노랗게 채우는 봄 풍경으로 익숙한 배추과 작물의 꽃이다.',identificationFeatures:'네 장의 노란 꽃잎이 십자 모양으로 보이고 줄기 위에 꽃이 모여 핀다.',leafFeatures:'줄기를 감싸는 듯한 잎이 나타날 수 있다.',flowerFeatures:'작은 노란 네잎꽃이 여러 개 모여 핀다.',habitat:'재배지, 들판, 관광 꽃밭',koreaViewingPeriod:'대체로 봄, 남부는 더 이른 시기 가능',searchKeywords:['봄노란꽃','카놀라'],eventKeywords:['유채','유채꽃','봄꽃','꽃축제','제주']}),
  flower({id:'dandelion',nameKo:'민들레',nameEn:'Dandelion',scientificName:'Taraxacum spp.',family:'국화과',genus:'민들레속',colors:['노랑','흰색'],bloom:{start:'03-15',end:'06-30'},seasons:['봄','여름'],description:'길가와 풀밭에서 흔히 볼 수 있는 여러해살이 국화과 식물군이다.',identificationFeatures:'땅에 붙어 퍼지는 잎 사이에서 속이 빈 꽃대가 올라오고 노란 두상화가 핀다.',leafFeatures:'깊게 갈라진 잎이 로제트 형태로 퍼진다.',flowerFeatures:'수많은 작은 혀꽃이 한 송이처럼 보인다.',habitat:'길가, 잔디밭, 들판',koreaViewingPeriod:'봄 중심, 조건에 따라 더 길게 관찰 가능',searchKeywords:['들꽃','노란꽃'],eventKeywords:['민들레','봄꽃','들꽃','생태공원'],lookalikes:[{nameKo:'서양민들레류',scientificName:'Taraxacum officinale agg.',reason:'노란 두상화와 땅에 퍼지는 로제트형 잎 때문에 다른 민들레류와 매우 비슷하다.',differences:['서양민들레류는 꽃 아래 바깥쪽 총포 조각이 옆이나 아래로 퍼지거나 젖혀지는 형태가 흔하다.','민들레류는 종 구분이 복잡해 잎 모양 하나만으로는 정확히 나누기 어렵다.'],tip:'꽃 바로 아래 총포 조각을 먼저 보고, 한 특징만으로 종을 단정하지 않는다.',note:'현재 민들레 항목은 Taraxacum spp. 여러 종을 함께 다루므로 유사종 정보는 현장 구별 참고용이다.'}]}),
  flower({id:'magnolia',nameKo:'목련',nameEn:'Magnolia',scientificName:'Magnolia kobus',family:'목련과',genus:'목련속',colors:['흰색'],bloom:{start:'03-15',end:'04-20'},seasons:['봄'],description:'이른 봄 잎보다 먼저 큰 흰 꽃이 피는 낙엽성 나무다.',identificationFeatures:'털이 있는 겨울눈에서 큰 흰 꽃이 나오며 가지 끝에서 눈에 잘 띈다.',leafFeatures:'넓은 타원형 잎이 꽃 뒤에 펼쳐진다.',flowerFeatures:'굵고 긴 꽃잎처럼 보이는 화피가 여러 장이다.',habitat:'공원, 정원, 학교, 산지',koreaViewingPeriod:'대체로 3~4월',searchKeywords:['봄나무꽃','백목련과구별'],eventKeywords:['목련','봄꽃','정원','수목원']}),
  flower({id:'lavender',nameKo:'라벤더',nameEn:'Lavender',scientificName:'Lavandula angustifolia',family:'꿀풀과',genus:'라벤더속',colors:['보라'],bloom:{start:'05-20',end:'07-20'},seasons:['봄','여름'],description:'향이 강한 잎과 보라색 꽃차례로 잘 알려진 허브류다.',identificationFeatures:'가느다란 꽃대에 작은 보라색 꽃이 층층이 모인다.',leafFeatures:'좁고 회녹색을 띠는 잎이 흔하다.',flowerFeatures:'작은 자주·보라색 꽃이 이삭 모양으로 모인다.',habitat:'허브정원, 식물원, 재배지',care:{sunlight:'양지',watering:'배수가 잘되게, 과습 주의',difficulty:'보통'},koreaViewingPeriod:'늦봄~초여름 중심',searchKeywords:['허브','보라꽃'],eventKeywords:['라벤더','허브','보라꽃','정원','꽃축제'],lookalikes:[{nameKo:'살비아',scientificName:'Salvia splendens',targetId:'salvia',reason:'둘 다 꿀풀과 식물로 작은 꽃이 위로 길게 모인 이삭 같은 꽃차례를 만들어 화단에서 비슷한 실루엣으로 보일 수 있다.',differences:['라벤더는 잎이 좁고 회녹색인 경우가 흔하며 향이 강한 관목성 허브다.','살비아는 달걀형 잎과 촘촘한 관 모양 꽃차례가 특징이고, 대표적인 원예형은 선명한 붉은색 꽃과 포엽이 눈에 띈다.'],tip:'꽃색보다 잎을 본다. 좁은 회녹색 잎이면 라벤더, 넓은 달걀형 잎이면 살비아 쪽을 확인한다.'}]}),
  flower({id:'lotus',nameKo:'연꽃',nameEn:'Sacred lotus',scientificName:'Nelumbo nucifera',family:'연꽃과',genus:'연꽃속',colors:['분홍','흰색'],bloom:{start:'06-25',end:'08-31'},seasons:['여름'],description:'연못과 습지에서 큰 원형 잎과 큼직한 꽃을 피우는 수생식물이다.',identificationFeatures:'물 위로 높이 올라오는 둥근 잎과 큰 꽃, 독특한 연밥이 특징이다.',leafFeatures:'큰 원형 잎이 물 위에 펼쳐지거나 높이 올라온다.',flowerFeatures:'분홍 또는 흰 꽃잎이 여러 겹 둘러진 큰 꽃이다.',habitat:'연못, 습지, 재배지',koreaViewingPeriod:'대체로 7~8월',searchKeywords:['수생식물','연못꽃'],eventKeywords:['연꽃','연꽃축제','습지','여름꽃']}),
  flower({id:'ume',nameKo:'매화',nameEn:'Japanese apricot blossom',scientificName:'Prunus mume',family:'장미과',genus:'벚나무속',colors:['흰색','분홍','빨강'],bloom:{start:'02-20',end:'04-05'},seasons:['겨울','봄'],description:'늦겨울부터 이른 봄에 향기로운 꽃을 피우는 낙엽성 나무다.',identificationFeatures:'잎보다 꽃이 먼저 피고 짧은 꽃자루로 가지 가까이에 붙어 보인다.',leafFeatures:'꽃 이후 달걀형 잎이 펼쳐진다.',flowerFeatures:'다섯 장 꽃잎의 흰색·분홍색 꽃이 흔하다.',habitat:'정원, 농원, 공원, 사찰',koreaViewingPeriod:'남부는 2월부터, 중부는 주로 3월 이후',searchKeywords:['매실나무꽃','봄꽃'],eventKeywords:['매화','매화축제','봄꽃','매실'],lookalikes:[{nameKo:'벚꽃',scientificName:'Prunus serrulata group',targetId:'cherry-blossom',reason:'둘 다 벚나무속의 봄꽃으로 흰색~분홍색 꽃을 잎이 무성해지기 전에 보여 비슷하게 느껴질 수 있다.',differences:['매화는 늦겨울~이른 봄의 잎 없는 가지에 향기로운 꽃이 피고 꽃자루가 매우 짧아 가지 가까이에 붙어 보인다.','벚꽃류는 보통 매화보다 늦게 피고 여러 꽃이 모여 풍성하게 보이는 경우가 많다.'],tip:'꽃이 가지에 바짝 붙어 있는지와 개화 시기, 향을 함께 확인한다.'}]}),
  flower({id:'morning-glory',nameKo:'나팔꽃',nameEn:'Morning glory',scientificName:'Ipomoea nil',family:'메꽃과',genus:'고구마속',colors:['파랑','보라','분홍','흰색'],bloom:{start:'07-01',end:'09-30'},seasons:['여름','가을'],description:'여름철 아침에 나팔 모양 꽃이 잘 보이는 덩굴성 한해살이풀이다.',identificationFeatures:'가느다란 덩굴이 지지물을 감고 오르며 깔때기 모양 꽃이 핀다.',leafFeatures:'심장형 또는 세 갈래처럼 보이는 잎이 있다.',flowerFeatures:'넓은 깔때기 모양 꽃이며 색이 다양하다.',habitat:'울타리, 정원, 길가',koreaViewingPeriod:'대체로 여름~초가을',searchKeywords:['덩굴꽃','아침꽃'],eventKeywords:['나팔꽃','여름꽃','정원'],lookalikes:[{nameKo:'메꽃류',scientificName:'Calystegia spp.',reason:'둘 다 덩굴로 자라고 깔때기 모양 꽃을 피워 멀리서 비슷하다.',differences:['나팔꽃은 심장형 또는 세 갈래 잎이 흔하고 꽃색이 파랑·보라·분홍 등 다양하다.','메꽃류는 꽃받침 바로 아래에 큰 포엽 두 장이 꽃받침을 감싸듯 붙는 특징이 있다.'],tip:'꽃 아래쪽을 가까이 보고, 꽃받침을 감싸는 큰 포엽 두 장이 있는지 확인한다.'}]}),
  flower({id:'coreopsis',nameKo:'금계국',nameEn:'Lance-leaved coreopsis',scientificName:'Coreopsis lanceolata',family:'국화과',genus:'기생초속',colors:['노랑'],bloom:{start:'05-10',end:'07-10'},seasons:['봄','여름'],description:'도로변과 공터, 꽃밭에서 노란 두상화를 무리지어 볼 수 있는 여러해살이풀이다.',identificationFeatures:'노란 혀꽃 끝이 갈라져 보이고 중앙부도 노란색 계열이다.',leafFeatures:'길쭉한 잎이 줄기 아래쪽에 많다.',flowerFeatures:'선명한 노란색의 국화 모양 꽃이다.',habitat:'도로변, 공원, 하천변, 꽃밭',koreaViewingPeriod:'늦봄~초여름',searchKeywords:['노란들꽃','코레옵시스'],eventKeywords:['금계국','노란꽃','꽃길','봄꽃']}),
  flower({id:'shasta-daisy',nameKo:'샤스타데이지',nameEn:'Shasta daisy',scientificName:'Leucanthemum × superbum',family:'국화과',genus:'프랑스국화속',colors:['흰색','노랑'],bloom:{start:'05-20',end:'07-20'},seasons:['봄','여름'],description:'흰 혀꽃과 노란 중앙부가 대비되는 원예용 여러해살이풀이다.',identificationFeatures:'큰 흰색 데이지형 꽃과 곧은 줄기가 특징이다.',leafFeatures:'긴 타원형 잎 가장자리에 톱니가 있다.',flowerFeatures:'흰 혀꽃이 노란 원반꽃을 둘러싼다.',habitat:'정원, 공원, 꽃밭',koreaViewingPeriod:'늦봄~초여름',searchKeywords:['데이지','흰꽃'],eventKeywords:['샤스타데이지','데이지','정원','꽃밭']}),
  flower({id:'aster',nameKo:'아스타',nameEn:'Aster',scientificName:'Symphyotrichum spp.',family:'국화과',genus:'심피오트리쿰속 등',colors:['보라','분홍','흰색'],bloom:{start:'08-25',end:'10-31'},seasons:['여름','가을'],description:'원예에서 아스타로 불리는 가을 국화과 식물군으로 여러 품종이 재배된다.',identificationFeatures:'작은 데이지형 꽃이 가지 끝에 많이 달리는 형태가 흔하다.',leafFeatures:'종과 품종에 따라 잎 모양이 다르다.',flowerFeatures:'보라·분홍·흰색 혀꽃과 노란 중앙부가 흔하다.',habitat:'정원, 화단',koreaViewingPeriod:'늦여름~가을 중심',searchKeywords:['애스터','가을데이지'],eventKeywords:['아스타','애스터','가을꽃','정원']}),
  flower({id:'daffodil',nameKo:'수선화',nameEn:'Daffodil',scientificName:'Narcissus spp.',family:'수선화과',genus:'수선화속',colors:['노랑','흰색'],bloom:{start:'02-20',end:'04-20'},seasons:['겨울','봄'],description:'늦겨울~봄에 피는 구근식물로 중앙의 부화관이 눈에 띈다.',identificationFeatures:'가느다란 잎 사이에서 꽃대가 올라오고 중앙에 컵 또는 나팔 모양 구조가 있다.',leafFeatures:'길고 납작한 선형 잎이다.',flowerFeatures:'바깥 화피와 중앙의 돌출된 부화관이 구분된다.',habitat:'정원, 공원, 화분',precautions:'관상용 구근과 식물체는 식용으로 다루지 않는다.',koreaViewingPeriod:'대체로 2월 말~4월',searchKeywords:['봄구근','나르키수스'],eventKeywords:['수선화','봄꽃','구근','꽃축제']}),
  flower({id:'peony',nameKo:'작약',nameEn:'Chinese peony',scientificName:'Paeonia lactiflora',family:'작약과',genus:'작약속',colors:['분홍','흰색','빨강'],bloom:{start:'05-01',end:'06-10'},seasons:['봄','여름'],description:'늦봄에 큰 꽃을 피우는 여러해살이 초본으로 정원에 많이 심는다.',identificationFeatures:'초본 줄기 위에 매우 큰 꽃이 피고 잎이 여러 갈래로 갈라진다.',leafFeatures:'윤기 있는 소엽들이 모여 달린다.',flowerFeatures:'큰 꽃에 수술이 많고 원예 품종은 겹꽃도 흔하다.',habitat:'정원, 약용·관상 재배지',koreaViewingPeriod:'대체로 5~6월',searchKeywords:['피오니','큰꽃'],eventKeywords:['작약','봄꽃','꽃밭','정원']}),
  flower({id:'poppy',nameKo:'개양귀비',nameEn:'Corn poppy',scientificName:'Papaver rhoeas',family:'양귀비과',genus:'양귀비속',colors:['빨강','주황','분홍','흰색'],bloom:{start:'05-01',end:'06-20'},seasons:['봄','여름'],description:'늦봄 꽃밭에서 흔히 재배되는 관상용 양귀비류 중 하나다.',identificationFeatures:'가느다란 꽃대 끝에 얇고 구겨진 듯한 넓은 꽃잎이 핀다.',leafFeatures:'깊게 갈라진 잎과 털이 보일 수 있다.',flowerFeatures:'종이처럼 얇은 꽃잎과 짙은 중앙부가 특징적이다.',habitat:'꽃밭, 공원, 정원',koreaViewingPeriod:'대체로 5~6월',searchKeywords:['꽃양귀비','포피'],eventKeywords:['개양귀비','꽃양귀비','봄꽃','꽃밭']}),
  flower({id:'lily',nameKo:'백합',nameEn:'Lily',scientificName:'Lilium spp.',family:'백합과',genus:'백합속',colors:['흰색','노랑','주황','분홍','빨강'],bloom:{start:'06-01',end:'08-10'},seasons:['여름'],description:'큰 꽃과 뚜렷한 수술이 특징인 구근성 여러해살이풀이다.',identificationFeatures:'곧은 줄기에 좁은 잎이 달리고 큰 여섯 갈래 꽃이 핀다.',leafFeatures:'좁고 긴 잎이 줄기를 따라 달리는 종류가 많다.',flowerFeatures:'나팔형·그릇형 등 다양한 큰 꽃과 긴 수술이 보인다.',habitat:'정원, 산지, 재배지',koreaViewingPeriod:'초여름~한여름, 종류별 차이',searchKeywords:['릴리','구근'],eventKeywords:['백합','여름꽃','정원','꽃축제']}),
  flower({id:'iris',nameKo:'붓꽃',nameEn:'Iris',scientificName:'Iris sanguinea',family:'붓꽃과',genus:'붓꽃속',colors:['보라','파랑'],bloom:{start:'05-01',end:'06-15'},seasons:['봄','여름'],description:'초여름 무렵 자주빛 꽃을 피우는 여러해살이풀이다.',identificationFeatures:'검처럼 곧은 잎 사이에서 꽃대가 올라오며 꽃잎 일부가 아래로 늘어진다.',leafFeatures:'칼날처럼 납작하고 길다.',flowerFeatures:'세 장의 큰 바깥 화피가 아래로 펼쳐지는 구조가 눈에 띈다.',habitat:'습지 주변, 정원, 들',koreaViewingPeriod:'대체로 5~6월',searchKeywords:['아이리스','보라꽃'],eventKeywords:['붓꽃','아이리스','습지','정원']}),
  flower({id:'balloon-flower',nameKo:'도라지꽃',nameEn:'Balloon flower',scientificName:'Platycodon grandiflorus',family:'초롱꽃과',genus:'도라지속',colors:['보라','흰색'],bloom:{start:'06-20',end:'08-31'},seasons:['여름'],description:'별 모양의 청보라색 꽃과 풍선처럼 부푼 꽃봉오리가 특징인 여러해살이풀이다.',identificationFeatures:'꽃봉오리가 둥글게 부풀고 개화하면 다섯 갈래 별 모양이 된다.',leafFeatures:'타원형 잎 가장자리에 톱니가 있다.',flowerFeatures:'주로 청보라색의 다섯 갈래 통꽃이다.',habitat:'산지 풀밭, 정원, 재배지',koreaViewingPeriod:'대체로 여름',searchKeywords:['길경','보라별꽃'],eventKeywords:['도라지꽃','여름꽃','야생화','정원']}),
  flower({id:'red-spider-lily',nameKo:'꽃무릇',nameEn:'Red spider lily',scientificName:'Lycoris radiata',family:'수선화과',genus:'상사화속',colors:['빨강'],bloom:{start:'09-05',end:'10-05'},seasons:['가을'],description:'초가을 잎 없이 꽃대가 올라와 붉은 꽃이 무리지어 피는 구근식물이다.',identificationFeatures:'긴 꽃대 끝에 수술이 길게 뻗은 붉은 꽃들이 방사형으로 핀다.',leafFeatures:'꽃이 진 뒤 잎이 나오는 생활사가 특징적이다.',flowerFeatures:'가늘고 뒤로 말리는 꽃잎과 매우 긴 수술이 돋보인다.',habitat:'사찰 주변, 숲 가장자리, 정원',precautions:'관상용 식물체와 구근은 임의로 섭취하지 않는다.',koreaViewingPeriod:'대체로 9월',searchKeywords:['석산','가을붉은꽃'],eventKeywords:['꽃무릇','상사화','가을꽃','사찰','축제']}),
  flower({id:'silver-grass',nameKo:'억새꽃',nameEn:'Silver grass',scientificName:'Miscanthus sinensis',family:'벼과',genus:'억새속',colors:['흰색'],bloom:{start:'09-01',end:'11-15'},seasons:['가을'],description:'가을에 은빛으로 보이는 큰 원추꽃차례가 바람에 흔들리는 여러해살이풀이다.',identificationFeatures:'키 큰 줄기 끝에 깃털 같은 꽃차례가 넓게 퍼진다.',leafFeatures:'길고 좁은 잎의 가운데에 흰 줄이 보이는 경우가 많다.',flowerFeatures:'작은 꽃들이 모여 큰 은빛 원추꽃차례를 이룬다.',habitat:'산지 초원, 하천변, 들판',koreaViewingPeriod:'가을',searchKeywords:['가을풀','은빛억새'],eventKeywords:['억새','억새축제','가을','산']}),
  flower({id:'gaura',nameKo:'가우라',nameEn:'Gaura',scientificName:'Oenothera lindheimeri',family:'바늘꽃과',genus:'달맞이꽃속',colors:['흰색','분홍'],bloom:{start:'06-01',end:'10-20'},seasons:['여름','가을'],description:'가느다란 줄기에서 작은 흰색·분홍색 꽃이 나비처럼 흔들리는 원예식물이다.',identificationFeatures:'긴 꽃대에 꽃이 드문드문 달리고 긴 수술이 눈에 띈다.',leafFeatures:'좁은 피침형 잎이 줄기를 따라 달린다.',flowerFeatures:'네 장의 꽃잎이 한쪽으로 모여 보이는 경우가 많다.',habitat:'정원, 공원, 화단',koreaViewingPeriod:'여름~가을',searchKeywords:['나비바늘꽃','화이트가우라'],eventKeywords:['가우라','정원','여름꽃','가을꽃']}),
  flower({id:'verbena',nameKo:'버베나',nameEn:'Verbena',scientificName:'Verbena × hybrida',family:'마편초과',genus:'마편초속',colors:['보라','분홍','빨강','흰색'],bloom:{start:'05-20',end:'10-15'},seasons:['봄','여름','가을'],description:'작은 꽃이 둥글게 모여 피는 원예용 초화류로 다양한 품종이 있다.',identificationFeatures:'낮게 퍼지거나 곧게 자라며 작은 다섯 갈래 꽃이 촘촘히 모인다.',leafFeatures:'마주나는 잎에 톱니가 있는 품종이 많다.',flowerFeatures:'작은 꽃들이 반구형 꽃차례를 이룬다.',habitat:'화단, 화분, 정원',koreaViewingPeriod:'늦봄~가을, 재배 조건에 따라 차이',searchKeywords:['마편초','원예꽃'],eventKeywords:['버베나','정원','꽃축제']}),
  flower({id:'snowdrop',nameKo:'설강화',nameEn:'Snowdrop',scientificName:'Galanthus nivalis',family:'수선화과',genus:'설강화속',colors:['흰색'],bloom:{start:'01-20',end:'03-15'},seasons:['겨울','봄'],description:'늦겨울부터 이른 봄에 고개를 숙인 작은 흰 꽃을 피우는 구근식물이다.',identificationFeatures:'가느다란 잎 사이에서 꽃대가 올라와 흰 꽃 하나가 아래를 향해 핀다.',leafFeatures:'좁은 선형 잎이다.',flowerFeatures:'바깥쪽 흰 화피 세 장이 길고 안쪽 화피는 짧다.',habitat:'정원, 수목원, 온대 지역 재배지',koreaViewingPeriod:'재배 환경에서 늦겨울~초봄',searchKeywords:['스노드롭','겨울구근'],eventKeywords:['설강화','스노드롭','겨울꽃','수목원']}),
  flower({id:'adonis',nameKo:'복수초',nameEn:'Amur adonis',scientificName:'Adonis amurensis',family:'미나리아재비과',genus:'복수초속',colors:['노랑'],bloom:{start:'02-10',end:'04-05'},seasons:['겨울','봄'],description:'이른 봄 산지에서 노란 꽃을 피우는 여러해살이풀이다.',identificationFeatures:'낮은 키에서 윤기 있는 노란 꽃이 피고 잎이 잘게 갈라진다.',leafFeatures:'여러 갈래로 잘게 갈라진 잎이다.',flowerFeatures:'여러 장의 노란 꽃잎 같은 꽃받침·꽃잎이 햇빛 아래 펼쳐진다.',habitat:'산지 숲 가장자리',precautions:'야생 식물은 채취하거나 섭취하지 않고 관찰 중심으로 이용한다.',koreaViewingPeriod:'대체로 2~4월, 지역 차이',searchKeywords:['이른봄꽃','노란야생화'],eventKeywords:['복수초','야생화','봄꽃','수목원']}),
  flower({id:'hellebore',nameKo:'헬레보루스',nameEn:'Hellebore',scientificName:'Helleborus × hybridus',family:'미나리아재비과',genus:'헬레보루스속',colors:['흰색','분홍','보라'],bloom:{start:'01-15',end:'04-15'},seasons:['겨울','봄'],description:'겨울부터 봄 사이에 꽃을 볼 수 있는 상록성 또는 반상록성 원예 여러해살이풀이다.',identificationFeatures:'아래를 향하거나 옆을 향하는 컵 모양 꽃과 손바닥 모양으로 갈라진 잎이 특징이다.',leafFeatures:'여러 갈래로 갈라진 두꺼운 잎이다.',flowerFeatures:'꽃잎처럼 보이는 꽃받침이 오래 남는다.',habitat:'정원, 온실, 수목원',precautions:'관상용 식물은 임의로 섭취하지 않는다.',koreaViewingPeriod:'재배 환경에서 겨울~봄',searchKeywords:['크리스마스로즈','겨울정원'],eventKeywords:['헬레보루스','겨울꽃','식물원','정원']}),
  flower({id:'pansy',nameKo:'팬지',nameEn:'Pansy',scientificName:'Viola × wittrockiana',family:'제비꽃과',genus:'제비꽃속',colors:['보라','노랑','흰색','파랑','빨강'],bloom:{start:'10-15',end:'05-15'},seasons:['가을','겨울','봄'],description:'서늘한 계절 화단에 널리 쓰이는 원예용 제비꽃류다.',identificationFeatures:'꽃 중앙에 얼굴 같은 짙은 무늬가 나타나는 품종이 많다.',leafFeatures:'둥근 달걀형 잎에 톱니가 있다.',flowerFeatures:'넓은 다섯 장 꽃잎과 다양한 색 조합이 특징이다.',habitat:'겨울·봄 화단, 화분, 공원',care:{sunlight:'양지~반양지',watering:'과습을 피하고 흙이 마르지 않게',difficulty:'쉬움'},koreaViewingPeriod:'가을~봄 식재지에서 관찰 가능',searchKeywords:['삼색제비꽃','겨울화단'],eventKeywords:['팬지','겨울꽃','봄꽃','정원']}),
  flower({id:'cyclamen',nameKo:'시클라멘',nameEn:'Cyclamen',scientificName:'Cyclamen persicum',family:'앵초과',genus:'시클라멘속',colors:['분홍','빨강','흰색','보라'],bloom:{start:'11-01',end:'03-31'},seasons:['겨울','봄'],description:'겨울철 실내와 온실에서 흔히 보는 구근성 관상식물이다.',identificationFeatures:'심장형 무늬 잎 위로 꽃대가 올라오고 꽃잎이 뒤로 젖혀진다.',leafFeatures:'은빛 무늬가 있는 심장형 잎이 흔하다.',flowerFeatures:'꽃잎이 뒤로 말려 올라가 독특한 실루엣을 만든다.',habitat:'실내 화분, 온실, 식물원',care:{sunlight:'밝은 간접광~반양지',watering:'구근 중심부 과습을 피함',difficulty:'보통'},koreaViewingPeriod:'실내·온실에서 겨울 중심',searchKeywords:['겨울화분','시클라맨'],eventKeywords:['시클라멘','겨울꽃','식물원','온실']}),
  flower({id:'plum-blossom-red',nameKo:'홍매화',nameEn:'Red plum blossom',scientificName:'Prunus mume cultivars',family:'장미과',genus:'벚나무속',colors:['분홍','빨강'],bloom:{start:'02-20',end:'04-05'},seasons:['겨울','봄'],description:'매화 중 붉거나 진분홍 꽃을 피우는 원예 품종들을 흔히 홍매화라 부른다.',identificationFeatures:'잎보다 먼저 붉은 계열 꽃이 가지 가까이 피는 점이 눈에 띈다.',leafFeatures:'꽃 뒤에 잎이 펼쳐진다.',flowerFeatures:'붉은색~진분홍 계열의 다섯 장 또는 겹꽃 품종이 있다.',habitat:'정원, 공원, 사찰',koreaViewingPeriod:'늦겨울~초봄',searchKeywords:['홍매','붉은매화'],eventKeywords:['홍매화','매화','봄꽃','사찰']}),
  flower({id:'gerbera',nameKo:'거베라',nameEn:'Gerbera daisy',scientificName:'Gerbera jamesonii hybrids',family:'국화과',genus:'거베라속',colors:['빨강','분홍','노랑','주황','흰색'],bloom:{start:'04-15',end:'10-15'},seasons:['봄','여름','가을'],description:'큰 데이지형 꽃으로 절화와 화분에 널리 쓰이는 원예식물이다.',identificationFeatures:'잎이 뿌리 가까이에 모이고 긴 꽃대 끝에 큰 두상화가 하나씩 핀다.',leafFeatures:'긴 타원형 잎이 로제트 형태로 모인다.',flowerFeatures:'선명한 색의 혀꽃이 중앙 원반꽃을 둘러싼다.',habitat:'온실, 화분, 정원',koreaViewingPeriod:'재배 환경에 따라 봄~가을',searchKeywords:['거베라데이지','절화'],eventKeywords:['거베라','꽃박람회','화훼','정원']}),
  flower({id:'marigold',nameKo:'메리골드',nameEn:'Marigold',scientificName:'Tagetes spp.',family:'국화과',genus:'천수국속',colors:['노랑','주황'],bloom:{start:'05-15',end:'10-31'},seasons:['봄','여름','가을'],description:'노랑·주황색 꽃이 오래 피어 화단에 널리 심는 한해살이 원예식물이다.',identificationFeatures:'깃꼴로 갈라진 잎과 노란색 또는 주황색 두상화가 함께 보인다.',leafFeatures:'여러 조각으로 깊게 갈라진 잎이다.',flowerFeatures:'홑꽃부터 공 모양 겹꽃까지 다양하다.',habitat:'화단, 공원, 화분',care:{sunlight:'양지',watering:'겉흙이 마르면 충분히',difficulty:'쉬움'},koreaViewingPeriod:'늦봄~가을',searchKeywords:['천수국','만수국','노란화단'],eventKeywords:['메리골드','화단','가을꽃','꽃축제']}),
  flower({id:'salvia',nameKo:'살비아',nameEn:'Scarlet sage',scientificName:'Salvia splendens',family:'꿀풀과',genus:'배암차즈기속',colors:['빨강','분홍','보라','흰색'],bloom:{start:'06-01',end:'10-20'},seasons:['여름','가을'],description:'선명한 꽃색과 곧은 꽃차례로 공원 화단에 널리 쓰이는 원예식물이다.',identificationFeatures:'네모진 줄기와 마주나는 잎, 위로 선 꽃차례가 특징적이다.',leafFeatures:'달걀형 잎이 마주나며 가장자리에 톱니가 있다.',flowerFeatures:'입술 모양 작은 꽃이 촘촘한 꽃차례를 만든다.',habitat:'화단, 공원, 정원',koreaViewingPeriod:'여름~가을',searchKeywords:['깨꽃','세이지'],eventKeywords:['살비아','여름꽃','가을꽃','정원'],lookalikes:[{nameKo:'라벤더',scientificName:'Lavandula angustifolia',targetId:'lavender',reason:'둘 다 꿀풀과 식물로 작은 꽃이 위로 길게 모이는 꽃차례를 만들어 화단에서 비슷한 실루엣으로 보일 수 있다.',differences:['살비아는 달걀형 잎과 촘촘한 관 모양 꽃, 큰 포엽이 특징이고 대표적인 원예형은 선명한 붉은색이 흔하다.','라벤더는 좁고 회녹색인 향기로운 잎과 보라색 계열 꽃이삭이 특징이다.'],tip:'꽃색보다 잎을 본다. 넓은 달걀형 잎이면 살비아, 좁은 회녹색 잎이면 라벤더 쪽을 확인한다.'}]}),
  flower({id:'globe-amaranth',nameKo:'천일홍',nameEn:'Globe amaranth',scientificName:'Gomphrena globosa',family:'비름과',genus:'천일홍속',colors:['보라','분홍','흰색','빨강'],bloom:{start:'06-15',end:'10-31'},seasons:['여름','가을'],description:'둥근 꽃머리가 오래 유지되어 꽃밭과 드라이플라워에 쓰이는 한해살이풀이다.',identificationFeatures:'가느다란 꽃대 끝에 작은 공 모양의 꽃머리가 하나씩 달린다.',leafFeatures:'마주나는 타원형 잎에 잔털이 있다.',flowerFeatures:'보라·분홍·흰색의 둥근 꽃머리가 특징이다.',habitat:'화단, 정원, 꽃밭',koreaViewingPeriod:'여름~가을',searchKeywords:['공모양꽃','드라이플라워'],eventKeywords:['천일홍','여름꽃','가을꽃','꽃밭'],lookalikes:[{nameKo:'붉은토끼풀',scientificName:'Trifolium pratense',targetId:'red-clover',reason:'둘 다 분홍~붉은 자주색의 둥근 꽃머리를 만들어 멀리서 보면 비슷한 인상을 줄 수 있다.',differences:['천일홍은 타원형의 한 장짜리 잎이 마주나고, 꽃머리가 둥글며 종이처럼 단단해 보이는 포엽이 눈에 띈다.','붉은토끼풀은 잎이 세 장의 작은잎으로 이루어지고, 작은 나비 모양 꽃들이 둥근 꽃머리를 만든다.'],tip:'가장 빠른 구별법은 잎이다. 세 장의 작은잎이면 붉은토끼풀 쪽을 먼저 확인한다.'}]}),
  flower({id:'wintersweet',nameKo:'납매',nameEn:'Wintersweet',scientificName:'Chimonanthus praecox',family:'받침꽃과',genus:'납매속',colors:['노랑'],bloom:{start:'01-15',end:'03-10'},seasons:['겨울','봄'],description:'한겨울부터 이른 봄 사이 잎보다 먼저 향기로운 노란 꽃을 피우는 낙엽성 관목이다.',identificationFeatures:'잎이 나오기 전 가지에 밀랍처럼 반투명한 노란 꽃이 달리고 향기가 강하다.',leafFeatures:'마주나는 타원형 잎으로 끝이 뾰족하며 꽃이 진 뒤 본격적으로 펼쳐진다.',flowerFeatures:'노란 화피가 여러 겹 겹치며 안쪽에 짙은 자주빛이 도는 경우가 있다.',habitat:'정원, 수목원, 사찰 주변 등 식재지',koreaViewingPeriod:'대체로 1월 중순~3월 초, 지역과 해에 따라 차이',searchKeywords:['겨울꽃','향기꽃','황매'],eventKeywords:['납매','겨울꽃','수목원','정원']}),
  flower({id:'sasanqua',nameKo:'애기동백',nameEn:'Sasanqua camellia',scientificName:'Camellia sasanqua',family:'차나무과',genus:'동백나무속',colors:['흰색','분홍','빨강'],bloom:{start:'10-15',end:'01-15'},seasons:['가을','겨울'],description:'늦가을부터 겨울 사이 꽃을 피우는 상록성 동백나무류로 정원과 공원에 주로 식재된다.',identificationFeatures:'광택 있는 상록 잎 사이로 비교적 일찍 꽃이 피며 동백나무와 비슷해 혼동하기 쉽다.',leafFeatures:'작고 단단한 타원형 잎에 윤기가 있고 가장자리에 잔 톱니가 있다.',flowerFeatures:'흰색·분홍·붉은색 계열의 꽃이 피며 품종에 따라 홑꽃과 겹꽃이 있다.',habitat:'정원, 공원, 남부지역 식재지',koreaViewingPeriod:'대체로 늦가을~겨울, 품종과 지역에 따라 차이',searchKeywords:['산다화','겨울동백','동백류'],eventKeywords:['애기동백','동백','겨울꽃','정원','수목원'],lookalikes:[{nameKo:'동백꽃',scientificName:'Camellia japonica',targetId:'camellia',reason:'둘 다 윤기 있는 상록 잎과 흰색·분홍·붉은색 계열 꽃을 가진 동백나무속 식물이다.',differences:['애기동백은 대체로 가을~초겨울에 꽃이 시작되는 편이고 잎과 꽃이 동백나무보다 작은 경우가 많다.','동백나무는 늦겨울~봄에 꽃이 두드러지고, 일반적으로 잎이 더 크고 두꺼운 편이다.'],tip:'개화 시기와 잎 크기를 함께 보고, 원예 품종은 꽃 모양 하나만으로 단정하지 않는다.'}]}),
  flower({id:'cornelian-cherry',nameKo:'산수유',nameEn:'Japanese cornel',scientificName:'Cornus officinalis',family:'층층나무과',genus:'층층나무속',colors:['노랑'],bloom:{start:'03-10',end:'04-20'},seasons:['봄'],description:'이른 봄 잎보다 먼저 작은 노란 꽃들이 무리지어 피는 낙엽성 나무다.',identificationFeatures:'잎이 나오기 전 가지에서 작은 노란 꽃 여러 개가 둥글게 모여 피는 모습이 두드러진다.',leafFeatures:'마주나는 타원형 잎으로 잎맥이 활처럼 굽어 보인다.',flowerFeatures:'작은 노란 꽃들이 산형꽃차례처럼 모여 가지 곳곳에 달린다.',habitat:'정원, 공원, 마을 주변, 재배지',koreaViewingPeriod:'대체로 3~4월, 지역과 기온에 따라 차이',searchKeywords:['봄노란꽃','산수유꽃','봄나무'],eventKeywords:['산수유','봄꽃','꽃축제','마을','공원']}),
  flower({id:'chinese-fringe-tree',nameKo:'이팝나무',nameEn:'Chinese fringe tree',scientificName:'Chionanthus retusus',family:'물푸레나무과',genus:'이팝나무속',colors:['흰색'],bloom:{start:'04-25',end:'06-05'},seasons:['봄','여름'],description:'늦봄에 가늘고 흰 꽃이 나무 전체를 덮을 듯 풍성하게 피는 낙엽성 나무다.',identificationFeatures:'개화기에는 가지 끝의 흰 꽃차례가 멀리서도 하얗게 보이며 가로수로도 자주 만날 수 있다.',leafFeatures:'마주나는 타원형 잎으로 가장자리가 대체로 밋밋하다.',flowerFeatures:'네 갈래로 깊게 갈라진 가늘고 긴 흰 꽃잎이 여러 송이 모여 핀다.',habitat:'산지, 공원, 정원, 가로수길',koreaViewingPeriod:'대체로 4월 말~6월 초',searchKeywords:['흰나무꽃','가로수꽃','오월꽃'],eventKeywords:['이팝나무','봄꽃','가로수길','꽃길','공원']}),
  flower({id:'leopard-plant',nameKo:'털머위',nameEn:'Leopard plant',scientificName:'Farfugium japonicum',family:'국화과',genus:'털머위속',colors:['노랑'],bloom:{start:'09-20',end:'11-30'},seasons:['가을'],description:'둥글고 두꺼운 잎 사이에서 긴 꽃대가 올라와 노란 꽃을 피우는 상록성 여러해살이풀이다.',identificationFeatures:'큰 둥근 잎과 그 위로 솟은 꽃대 끝의 노란 국화 모양 꽃이 함께 보인다.',leafFeatures:'두껍고 윤기 있는 둥근 잎이 긴 잎자루 끝에 달린다.',flowerFeatures:'노란 혀꽃과 중앙의 노란 원반꽃이 모여 작은 두상화를 이룬다.',habitat:'남해안·제주·울릉도 등의 숲 가장자리와 바닷가, 반그늘진 정원',koreaViewingPeriod:'가을 중심이며 지역과 환경에 따라 더 이르게 꽃이 보일 수 있음',searchKeywords:['가을노란꽃','바닷가식물','반그늘'],eventKeywords:['털머위','가을꽃','제주','남해안','정원']}),
  flower({id:'red-clover',nameKo:'붉은토끼풀',nameEn:'Red clover',scientificName:'Trifolium pratense',family:'콩과',genus:'토끼풀속',colors:['분홍','빨강'],bloom:{start:'05-01',end:'09-30'},seasons:['봄','여름','가을'],description:'유럽 등지에서 목초용으로 도입되어 국내에서도 풀밭과 길가에서 볼 수 있는 여러해살이 귀화식물이다.',identificationFeatures:'분홍빛~붉은 자주빛의 작은 나비 모양 꽃이 둥근 꽃머리를 만들고, 줄기와 잎에 털이 보이는 점이 특징이다.',leafFeatures:'잎은 세 장의 작은잎으로 이루어지고 표면에 옅은 V자형 무늬가 나타나는 경우가 많다.',flowerFeatures:'작은 나비 모양 꽃 여러 개가 둥글고 조밀한 머리모양 꽃차례를 이룬다.',habitat:'길가, 잔디밭, 풀밭, 둑 등 햇볕이 드는 곳',koreaViewingPeriod:'주로 늦봄~여름에 많이 보이며 지역과 환경에 따라 초가을까지 꽃을 볼 수 있다.',searchKeywords:['레드클로버','붉은클로버','홍차축초','토끼풀'],eventKeywords:['붉은토끼풀','클로버','야생화','풀밭','꽃길'],lookalikes:[{nameKo:'토끼풀',scientificName:'Trifolium repens',reason:'둘 다 세 장의 작은잎과 둥근 꽃차례를 가져 잎만 보면 헷갈리기 쉽다.',differences:['붉은토끼풀은 분홍~붉은 자주빛 꽃이 피고 줄기가 비교적 곧게 올라오며 털이 있다.','토끼풀은 흰 꽃이 흔하고 땅을 기는 줄기가 마디에서 뿌리를 내리는 형태가 특징이다.'],tip:'꽃색뿐 아니라 줄기가 곧게 서는지, 땅을 기며 마디에서 뿌리내리는지 확인한다.'},{nameKo:'천일홍',scientificName:'Gomphrena globosa',targetId:'globe-amaranth',reason:'둘 다 분홍~붉은 자주색의 둥근 꽃머리 때문에 멀리서 비슷하게 보일 수 있다.',differences:['붉은토끼풀은 잎이 세 장의 작은잎으로 이루어지고 작은 나비 모양 꽃들이 둥근 꽃머리를 만든다.','천일홍은 타원형의 한 장짜리 잎이 마주나며 둥근 꽃머리가 종이처럼 단단해 보인다.'],tip:'꽃머리보다 잎을 먼저 확인한다. 세 장의 작은잎이면 붉은토끼풀이다.'}]})
]);

function uniqueTaxonomyOptions(key, labelBuilder) {
  const seen = new Map();
  FLOWERS.forEach((flower) => {
    const value = flower.taxonomy?.[key];
    if (!value || seen.has(value)) return;
    seen.set(value, labelBuilder(flower.taxonomy));
  });
  return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1], 'ko-KR'));
}

const MAJOR_GROUP_OPTIONS = Object.freeze(uniqueTaxonomyOptions('majorGroup', (t) => t.majorGroupKo));
const ORDER_OPTIONS = Object.freeze(uniqueTaxonomyOptions('order', (t) => t.orderKo && t.orderKo !== t.order ? `${t.orderKo} · ${t.order}` : t.order));
const FAMILY_OPTIONS = Object.freeze(uniqueTaxonomyOptions('familyLatin', (t) => `${t.familyKo} · ${t.familyLatin}`));
const GENUS_OPTIONS = Object.freeze(uniqueTaxonomyOptions('genusLatin', (t) => `${t.genusKo ? `${t.genusKo} · ` : ''}${t.genusLatin}`));

function getFlowerById(id) {
  return FLOWERS.find((item) => item.id === id) || null;
}
return { "SEASONS": SEASONS, "COLORS": COLORS, "EVENT_SEARCH_KEYWORDS": EVENT_SEARCH_KEYWORDS, "FLOWERS": FLOWERS, "MAJOR_GROUP_OPTIONS": MAJOR_GROUP_OPTIONS, "ORDER_OPTIONS": ORDER_OPTIONS, "FAMILY_OPTIONS": FAMILY_OPTIONS, "GENUS_OPTIONS": GENUS_OPTIONS, "getFlowerById": getFlowerById };
})();
