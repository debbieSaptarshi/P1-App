import { dish } from './dish';
import type { CampusDish } from './types';

const H2 = 'https://h2canteen.com/';
const AROMA = 'https://aromadhaba.com/';
const H10 = 'https://gymkhana.iitb.ac.in/~hostel10/images/canteenmenu1.pdf';

export const CANTEEN_DISHES: CampusDish[] = [
  dish(['h2-veg-cheese-sandwich', 'Veg cheese sandwich', 'canteen-h2', ['snack', 'lunch'], '1 sandwich / 180 g', 180, 320, 12, 32, 16, 3, 640, 'veg', 1.5, 'field_typical', ['veg cheese sandwich'], { sourceUrl: H2 }]),
  dish(['h2-veg-franky', 'Veg cheese franky', 'canteen-h2', ['snack'], '1 franky / 200 g', 200, 380, 11, 42, 18, 4, 720, 'veg', 2, 'field_typical', ['veg cheese schezwan frankie', 'frankie', 'franky'], { sourceUrl: H2 }]),
  dish(['h2-open-shawarma', 'Chicken open shawarma', 'canteen-h2', ['snack', 'dinner'], '1 roll / 250 g', 250, 430, 24, 36, 20, 3, 890, 'nonveg', 2, 'scraped', ['chi open shawarma', 'open shawarma'], { sourceUrl: H2 }]),
  dish(['h2-brown-shawarma', 'Brown bread chicken shawarma', 'canteen-h2', ['snack'], '1 sandwich / 220 g', 220, 390, 22, 34, 16, 3, 820, 'nonveg', 1.5, 'scraped', ['brown bread chi shawarm'], { sourceUrl: H2 }]),
  dish(['h2-peri-shawarma', 'Peri peri chicken shawarma', 'canteen-h2', ['snack', 'dinner'], '1 roll / 250 g', 250, 450, 24, 38, 22, 3, 920, 'nonveg', 2.5, 'scraped', ['perry perry chicken shawrma'], { sourceUrl: H2 }]),
  dish(['h2-chicken-shawarma', 'Chicken shawarma', 'canteen-h2', ['snack', 'dinner'], '1 roll / 240 g', 240, 410, 23, 35, 18, 3, 860, 'nonveg', 2, 'scraped', ['chikan shawarma'], { sourceUrl: H2 }]),
  dish(['h2-schezwan', 'Extra schezwan', 'canteen-h2', ['snack'], '2 tbsp', 30, 45, 0, 6, 2, 0, 280, 'veg', 1, 'scraped', [], { sourceUrl: H2 }]),
  dish(['h2-orange-juice', 'Orange juice', 'canteen-h2', ['snack'], '1 glass / 250 ml', 250, 110, 2, 26, 0, 0, 5, 'veg', 0, 'scraped', ['juce', 'litchi juce', 'apple juce'], { sourceUrl: H2 }]),
  dish(['h2-tropicana', 'Tropicana mixed fruit', 'canteen-h2', ['snack'], '1 tetra / 200 ml', 200, 96, 0, 24, 0, 0, 10, 'veg', 0, 'scraped', ['tropicana pomegrenate delight', 'tropicana guva juce'], { sourceUrl: H2 }]),
  dish(['h2-milkshake', 'Butterscotch milkshake', 'canteen-h2', ['snack'], '1 glass / 300 ml', 300, 280, 8, 42, 9, 0, 140, 'veg', 0, 'scraped', [], { sourceUrl: H2 }]),
  dish(['h2-maaza', 'Maaza', 'canteen-h2', ['snack'], '1 bottle / 250 ml', 250, 110, 0, 28, 0, 0, 20, 'veg', 0, 'scraped', ['fanta', 'limca', '7 up', 'mirinda', 'thumpsup', 'mountain dew'], { sourceUrl: H2 }]),
  dish(['h2-monster', 'Monster energy ultra', 'canteen-h2', ['snack'], '1 can / 350 ml', 350, 10, 0, 3, 0, 0, 180, 'veg', 0, 'scraped', [], { sourceUrl: H2 }]),
  dish(['h2-paneer-rice', 'Paneer rice bowl', 'canteen-h2', ['lunch', 'dinner'], '1 plate / 320 g', 320, 520, 16, 62, 22, 5, 880, 'veg', 2.5, 'field_typical', ['veg and paneer'], { sourceUrl: H2 }]),
  dish(['h2-chicken-rice', 'Chicken rice / biryani', 'canteen-h2', ['lunch', 'dinner'], '1 plate / 350 g', 350, 560, 26, 64, 20, 3, 940, 'nonveg', 2.5, 'field_typical', ['rice and biryani'], { sourceUrl: H2 }]),
  dish(['h2-noodles', 'Veg hakka noodles', 'canteen-h2', ['snack', 'dinner'], '1 plate / 280 g', 280, 410, 10, 58, 16, 4, 980, 'veg', 2, 'field_typical', ['rice and noodles'], { sourceUrl: H2 }]),

  dish(['aroma-paneer-cheese-sandwich', 'Paneer cheese sandwich', 'canteen-aroma', ['snack', 'lunch'], '1 sandwich', 190, 340, 14, 30, 18, 2, 680, 'veg', 1.5, 'scraped', [], { priceInr: 68, sourceUrl: AROMA }]),
  dish(['aroma-chicken-cheese-sandwich', 'Chicken cheese sandwich', 'canteen-aroma', ['snack', 'lunch'], '1 sandwich', 200, 360, 20, 28, 16, 2, 720, 'nonveg', 1.5, 'scraped', [], { priceInr: 68, sourceUrl: AROMA }]),
  dish(['aroma-egg-cheese-sandwich', 'Egg cheese sandwich', 'canteen-aroma', ['snack', 'breakfast'], '1 sandwich', 190, 330, 16, 28, 16, 1, 690, 'egg', 1.5, 'scraped', [], { sourceUrl: AROMA }]),
  dish(['aroma-veg-cheese-sandwich', 'Veg cheese sandwich', 'canteen-aroma', ['snack'], '1 sandwich', 180, 300, 10, 32, 14, 3, 640, 'veg', 1.5, 'scraped', [], { priceInr: 57, sourceUrl: AROMA }]),
  dish(['aroma-watermelon-juice', 'Watermelon juice', 'canteen-aroma', ['snack'], '1 glass / 300 ml', 300, 90, 1, 22, 0, 1, 5, 'veg', 0, 'scraped', ['pineaple juice', 'musbi juice'], { sourceUrl: AROMA }]),
  dish(['aroma-mango-lassi', 'Mango lassi', 'canteen-aroma', ['snack'], '1 glass / 300 ml', 300, 220, 6, 36, 6, 0, 90, 'veg', 0, 'scraped', ['malai lassi'], { sourceUrl: AROMA }]),
  dish(['aroma-lays-chaat', 'Lays chaat', 'canteen-aroma', ['snack'], '1 plate', 80, 210, 3, 22, 12, 2, 380, 'veg', 1, 'scraped', ['kurkure chat'], { sourceUrl: AROMA }]),
  dish(['aroma-peri-shawarma', 'Chicken peri peri shawarma', 'canteen-aroma', ['snack', 'dinner'], '1 roll / 250 g', 250, 450, 24, 38, 22, 3, 920, 'nonveg', 2.5, 'scraped', ['chicken pery pery shorma'], { sourceUrl: AROMA }]),
  dish(['aroma-open-shawarma', 'Open shawarma', 'canteen-aroma', ['snack'], '1 plate / 260 g', 260, 440, 24, 36, 20, 3, 880, 'nonveg', 2, 'scraped', ['open sorama'], { sourceUrl: AROMA }]),
  dish(['aroma-chicken-shawarma', 'Chicken shawarma', 'canteen-aroma', ['snack', 'dinner'], '1 roll / 240 g', 240, 410, 23, 35, 18, 3, 860, 'nonveg', 2, 'scraped', ['chicken shorma'], { sourceUrl: AROMA }]),
  dish(['aroma-aloo-tikki', 'Aloo tikki', 'canteen-aroma', ['snack'], '2 tikki', 140, 260, 5, 32, 12, 4, 480, 'veg', 2, 'scraped', [], { sourceUrl: AROMA }]),
  dish(['aroma-full-fry', 'Egg full fry', 'canteen-aroma', ['breakfast', 'snack'], '2 eggs', 120, 190, 13, 2, 14, 0, 280, 'egg', 1, 'scraped', [], { sourceUrl: AROMA }]),
  dish(['aroma-chicken-gravy', 'Chicken gravy', 'canteen-aroma', ['lunch', 'dinner'], '1 katori / 200 g', 200, 280, 22, 8, 16, 1, 720, 'nonveg', 2, 'field_typical', ['non veg gravy'], { sourceUrl: AROMA }]),
  dish(['aroma-veg-gravy', 'Veg gravy', 'canteen-aroma', ['lunch', 'dinner'], '1 katori / 180 g', 180, 160, 5, 16, 8, 4, 620, 'veg', 2, 'field_typical', [], { sourceUrl: AROMA }]),
  dish(['aroma-biryani', 'Chicken biryani', 'canteen-aroma', ['lunch', 'dinner'], '1 plate / 350 g', 350, 560, 26, 64, 20, 3, 940, 'nonveg', 2.5, 'field_typical', ['briyani'], { sourceUrl: AROMA }]),
  dish(['aroma-fried-rice', 'Veg fried rice', 'canteen-aroma', ['lunch', 'dinner'], '1 plate / 300 g', 300, 420, 8, 68, 12, 4, 860, 'veg', 2, 'field_typical', ['chinese rice'], { sourceUrl: AROMA }]),
  dish(['aroma-noodles', 'Veg noodles', 'canteen-aroma', ['snack', 'dinner'], '1 plate / 280 g', 280, 410, 10, 58, 16, 4, 980, 'veg', 2, 'field_typical', [], { sourceUrl: AROMA }]),
  dish(['aroma-paratha', 'Paratha', 'canteen-aroma', ['breakfast', 'dinner'], '2 paratha', 160, 360, 8, 48, 16, 4, 420, 'veg', 2, 'field_typical', ['roti', 'paratha / roti'], { sourceUrl: AROMA }]),
  dish(['aroma-sprite', 'Sprite', 'canteen-aroma', ['snack'], '1 bottle / 250 ml', 250, 100, 0, 26, 0, 0, 20, 'veg', 0, 'scraped', ['diet coke', 'monster', 'predator lnergy'], { sourceUrl: AROMA }]),

  dish(['amul-veg-sandwich', 'Veg sandwich', 'canteen-amul-h14', ['snack'], '1 sandwich / 180 g', 180, 260, 8, 32, 10, 3, 520, 'veg', 1, 'field_typical', [], { priceInr: 80 }]),
  dish(['amul-cheese-sandwich', 'Cheese sandwich', 'canteen-amul-h14', ['snack'], '1 sandwich', 190, 320, 12, 30, 16, 2, 640, 'veg', 1.5, 'field_typical', ['yumm cheese sandwich'], { priceInr: 100 }]),
  dish(['amul-paneer-toast', 'Paneer cheese toast', 'canteen-amul-h14', ['snack'], '2 slices', 140, 280, 12, 22, 16, 1, 560, 'veg', 1.5, 'field_typical', [], { priceInr: 80 }]),
  dish(['amul-aloo-burger', 'Aloo tikki burger', 'canteen-amul-h14', ['snack'], '1 burger', 160, 290, 7, 36, 12, 3, 540, 'veg', 2, 'field_typical', [], { priceInr: 50 }]),
  dish(['amul-fries', 'Salty fries', 'canteen-amul-h14', ['snack'], '1 plate / 80 g', 80, 240, 3, 28, 13, 3, 280, 'veg', 2, 'field_typical', ['peri peri fries'], { priceInr: 60 }]),
  dish(['amul-shake', 'Amul mango shake', 'canteen-amul-h14', ['snack'], '1 glass / 300 ml', 300, 240, 8, 38, 7, 0, 110, 'veg', 0, 'field_typical', ['vanilla shake', 'chocolate shake'], { priceInr: 90 }]),
  dish(['amul-ice-cream', 'Amul ice cream', 'canteen-amul-h14', ['snack'], '1 scoop / 60 g', 60, 120, 2, 14, 6, 0, 45, 'veg', 0, 'field_typical']),
  dish(['amul-pani-puri', 'Pani puri', 'canteen-amul-h14', ['snack'], '6 puri', 150, 180, 4, 32, 4, 3, 520, 'veg', 1, 'field_typical', ['sev puri']]),
  dish(['amul-pasta', 'Red sauce pasta', 'canteen-amul-h14', ['snack', 'dinner'], '1 plate / 250 g', 250, 360, 10, 52, 12, 3, 640, 'veg', 1.5, 'field_typical', [], { priceInr: 100 }]),
  dish(['amul-chai', 'Hot chai', 'canteen-amul-h14', ['snack', 'breakfast'], '1 cup / 150 ml', 150, 45, 1, 7, 1, 0, 15, 'veg', 0, 'field_typical', ['hot coffee'], { priceInr: 20 }]),
  dish(['amul-bun-maska', 'Bun maska', 'canteen-amul-h14', ['snack', 'breakfast'], '1 bun + butter', 90, 260, 6, 32, 12, 1, 240, 'veg', 2, 'field_typical', [], { priceInr: 60 }]),

  dish(['h10-plain-maggi', 'Plain maggi', 'canteen-h10', ['snack'], '1 plate', 160, 280, 7, 40, 10, 2, 820, 'veg', 1.5, 'scraped', [], { priceInr: 22, sourceUrl: H10 }]),
  dish(['h10-cheese-maggi', 'Cheese maggi', 'canteen-h10', ['snack'], '1 plate', 190, 340, 10, 40, 14, 2, 860, 'veg', 1.5, 'scraped', ['plain cheese maggi', 'veg cheese maggi'], { priceInr: 30, sourceUrl: H10 }]),
  dish(['h10-egg-maggi', 'Egg maggi', 'canteen-h10', ['snack'], '1 plate', 200, 330, 12, 38, 14, 2, 880, 'egg', 2, 'scraped', ['omlet maggi', 'egg cheese maggi'], { priceInr: 28, sourceUrl: H10 }]),
  dish(['h10-tadka-maggi', 'Tadka maggi', 'canteen-h10', ['snack'], '1 plate', 180, 310, 8, 40, 12, 2, 900, 'veg', 2, 'scraped', ['special fry maggi', 'spicy maggi'], { priceInr: 25, sourceUrl: H10 }]),
  dish(['h10-aloo-paratha', 'Aloo paratha', 'canteen-h10', ['breakfast', 'snack'], '1 paratha', 120, 210, 5, 28, 9, 3, 320, 'veg', 2, 'scraped', ['gobi paratha', 'onion paratha', 'mix veg paratha'], { priceInr: 17, sourceUrl: H10 }]),
  dish(['h10-paneer-paratha', 'Paneer paratha', 'canteen-h10', ['breakfast', 'snack'], '1 paratha', 140, 260, 9, 28, 12, 3, 380, 'veg', 2, 'scraped', [], { priceInr: 24, sourceUrl: H10 }]),
  dish(['h10-plain-paratha', 'Plain paratha', 'canteen-h10', ['snack'], '1 paratha', 70, 140, 3, 20, 5, 2, 180, 'veg', 1.5, 'scraped', ['butter paratha'], { priceInr: 8, sourceUrl: H10 }]),

  dish(['mg-dosa', 'Market Gate masala dosa', 'canteen-market-gate', ['breakfast', 'snack'], '1 dosa', 180, 350, 8, 52, 12, 4, 620, 'veg', 2, 'field_typical', ['dosa']]),
  dish(['mg-pani-puri', 'Market Gate pani puri', 'canteen-market-gate', ['snack'], '8 puri', 180, 220, 5, 38, 5, 4, 640, 'veg', 1, 'field_typical', ['pani puri', 'sev puri']]),
];
