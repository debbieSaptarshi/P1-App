import { dish } from './dish';
import type { CampusDish } from './types';

const LAXMI = 'https://www.district.in/dining/mumbai/hotel-laxmi-next-powai';

export const RESTAURANT_DISHES: CampusDish[] = [
  dish(['laxmi-pav-bhaji', 'Pav bhaji', 'rest-laxmi', ['snack', 'lunch', 'dinner'], '2 pav + bhaji', 300, 450, 11, 60, 18, 8, 860, 'veg', 3, 'field_typical', ['pao bhaji'], { sourceUrl: LAXMI }]),
  dish(['laxmi-misal-pav', 'Misal pav', 'rest-laxmi', ['breakfast', 'snack'], '2 pav + misal', 280, 380, 14, 48, 14, 8, 780, 'veg', 2.5, 'field_typical', [], { sourceUrl: LAXMI }]),
  dish(['laxmi-masala-dosa', 'Masala dosa', 'rest-laxmi', ['breakfast', 'snack'], '1 dosa', 200, 360, 8, 54, 13, 4, 640, 'veg', 2, 'field_typical', ['rava masala dosa'], { sourceUrl: LAXMI }]),
  dish(['laxmi-idli', 'Idli sambar', 'rest-laxmi', ['breakfast'], '3 idli + sambar', 250, 220, 8, 42, 3, 5, 580, 'veg', 0.5, 'field_typical', [], { sourceUrl: LAXMI }]),
  dish(['laxmi-medu-vada', 'Medu vada', 'rest-laxmi', ['breakfast', 'snack'], '2 vada + sambar', 180, 280, 8, 32, 14, 4, 520, 'veg', 3, 'field_typical', [], { sourceUrl: LAXMI }]),
  dish(['laxmi-filter-coffee', 'Filter coffee', 'rest-laxmi', ['breakfast', 'snack'], '1 cup / 150 ml', 150, 70, 2, 10, 2, 0, 40, 'veg', 0, 'field_typical', [], { sourceUrl: LAXMI }]),
  dish(['laxmi-dahi-puri', 'Dahi sev batata puri', 'rest-laxmi', ['snack'], '1 plate', 180, 260, 7, 36, 10, 4, 480, 'veg', 1, 'scraped', ['dahi batata puri', 'papadi chaat', 'sev batata puri'], { sourceUrl: LAXMI }]),
  dish(['laxmi-bhel', 'Dahi bhel puri', 'rest-laxmi', ['snack'], '1 plate', 150, 220, 6, 34, 7, 4, 420, 'veg', 1, 'scraped', ['sev puri'], { sourceUrl: LAXMI }]),
  dish(['laxmi-tawa-pulao', 'Tawa pulao', 'rest-laxmi', ['lunch', 'dinner'], '1 plate / 300 g', 300, 420, 8, 64, 14, 4, 780, 'veg', 2, 'field_typical', [], { sourceUrl: LAXMI }]),
  dish(['laxmi-veg-fried-rice', 'Veg fried rice', 'rest-laxmi', ['lunch', 'dinner'], '1 plate / 300 g', 300, 430, 8, 68, 13, 4, 860, 'veg', 2, 'field_typical', [], { sourceUrl: LAXMI }]),
  dish(['laxmi-dal-fry', 'Dal fry', 'rest-laxmi', ['lunch', 'dinner'], '1 katori / 160 g', 160, 160, 9, 18, 6, 4, 520, 'veg', 1.5, 'field_typical', [], { sourceUrl: LAXMI }]),
  dish(['laxmi-roti', 'Tandoori roti', 'rest-laxmi', ['lunch', 'dinner'], '2 roti', 90, 200, 6, 36, 4, 3, 280, 'veg', 0.5, 'field_typical', ['naan'], { sourceUrl: LAXMI }]),
  dish(['laxmi-paneer', 'Methi matar malai / paneer', 'rest-laxmi', ['lunch', 'dinner'], '1 katori / 180 g', 180, 290, 12, 14, 20, 3, 620, 'veg', 2.5, 'field_typical', ['veg makhanwala', 'veg kadai'], { sourceUrl: LAXMI }]),
  dish(['laxmi-upma', 'Upma', 'rest-laxmi', ['breakfast'], '1 plate / 200 g', 200, 230, 6, 38, 7, 3, 480, 'veg', 1.5, 'field_typical', [], { sourceUrl: LAXMI }]),

  dish(['bk-whopper', 'Whopper', 'rest-burger-king', ['lunch', 'dinner', 'snack'], '1 burger', 270, 650, 28, 52, 36, 3, 980, 'nonveg', 3, 'field_typical', ['chicken whopper']]),
  dish(['bk-veg-whopper', 'Veg Whopper', 'rest-burger-king', ['lunch', 'dinner', 'snack'], '1 burger', 250, 560, 16, 54, 30, 5, 920, 'veg', 3, 'field_typical', ['paneer king']]),
  dish(['bk-crispy-veg', 'Crispy Veg', 'rest-burger-king', ['snack'], '1 burger', 170, 390, 10, 42, 18, 3, 680, 'veg', 2, 'field_typical']),
  dish(['bk-fries', 'BK fries', 'rest-burger-king', ['snack'], 'medium / 110 g', 110, 330, 4, 42, 16, 4, 380, 'veg', 3, 'field_typical']),
  dish(['bk-coke', 'Coca-Cola', 'rest-burger-king', ['snack'], 'M / 400 ml', 400, 170, 0, 42, 0, 0, 20, 'veg', 0, 'field_typical']),
  dish(['bk-shake', 'BK thick shake', 'rest-burger-king', ['snack'], '1 regular', 300, 340, 8, 52, 12, 0, 180, 'veg', 0, 'field_typical']),

  dish(['chaat-sev-puri', 'Sev puri', 'rest-chaat', ['snack'], '6 puri', 150, 240, 5, 32, 10, 4, 560, 'veg', 1.5, 'field_typical']),
  dish(['chaat-bhel', 'Bhel puri', 'rest-chaat', ['snack'], '1 plate / 140 g', 140, 200, 5, 34, 5, 4, 420, 'veg', 1, 'field_typical']),
  dish(['chaat-dahi-puri', 'Dahi puri', 'rest-chaat', ['snack'], '6 puri', 180, 260, 7, 36, 10, 4, 480, 'veg', 1, 'field_typical', ['dahi bhallle']]),
  dish(['chaat-ragda', 'Ragda pattice', 'rest-chaat', ['snack'], '2 pattice + ragda', 250, 320, 9, 42, 12, 7, 620, 'veg', 2, 'field_typical', ['tawa aloo chaat']]),
  dish(['chaat-vada-pav', 'Vada pav', 'rest-chaat', ['snack'], '1 pav', 130, 220, 5, 32, 8, 3, 380, 'veg', 2, 'field_typical']),

  dish(['chai-cutting', 'Cutting chai', 'rest-chai-bun-maska', ['breakfast', 'snack'], '1 glass / 100 ml', 100, 35, 1, 5, 1, 0, 10, 'veg', 0, 'field_typical', ['chai', 'tea']]),
  dish(['chai-bun-maska', 'Bun maska', 'rest-chai-bun-maska', ['breakfast', 'snack'], '1 bun + butter', 90, 260, 6, 32, 12, 1, 240, 'veg', 2, 'field_typical', ['bun jam'], { priceInr: 60 }]),
  dish(['chai-bun-jam', 'Bun jam', 'rest-chai-bun-maska', ['breakfast', 'snack'], '1 bun + jam', 85, 230, 5, 38, 6, 1, 180, 'veg', 1, 'field_typical', [], { priceInr: 50 }]),
  dish(['chai-bread-butter', 'Bread butter', 'rest-chai-bun-maska', ['breakfast', 'snack'], '2 slices', 70, 180, 4, 22, 8, 1, 200, 'veg', 1.5, 'field_typical', [], { priceInr: 50 }]),

  dish(['dominos-margherita', 'Margherita pizza', 'rest-dominos-h1', ['snack', 'dinner'], '2 slices / regular', 180, 420, 16, 48, 16, 2, 780, 'veg', 1.5, 'field_typical', ['lean crust double cheese margh pizza']]),
  dish(['dominos-peppy-paneer', 'Peppy paneer pizza', 'rest-dominos-h1', ['snack', 'dinner'], '2 slices', 200, 480, 18, 50, 20, 3, 920, 'veg', 2, 'field_typical']),
  dish(['dominos-garlic-bread', 'Garlic breadsticks', 'rest-dominos-h1', ['snack'], '1 portion', 120, 280, 7, 32, 14, 2, 480, 'veg', 2, 'field_typical']),

  dish(['gulmohar-thali', 'Gulmohar veg thali', 'rest-gulmohar', ['lunch', 'dinner'], '1 thali', 550, 720, 20, 88, 28, 10, 1100, 'veg', 3, 'field_typical']),
  dish(['gulmohar-chicken', 'Gulmohar chicken meal', 'rest-gulmohar', ['lunch', 'dinner'], '1 plate', 450, 680, 32, 62, 26, 4, 980, 'nonveg', 3, 'field_typical']),
];
