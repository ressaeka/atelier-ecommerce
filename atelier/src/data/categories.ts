export interface Category {
  id: number;
  name: string;
  image: string;
  itemCount: number;
  slug: string;
}

export const categories: Category[] = [
  {
    id: 1,
    name: 'Tailoring & Suits',
    image: 'public/images/jas.jpeg',
    itemCount: 15,
    slug: 'tailoring-suits',
  },
  {
    id: 2,
    name: 'Rajut Kasual',
    image: 'public/images/rajut-kasual.jpeg',
    itemCount: 12,
    slug: 'rajut-kasual',
  },
  {
    id: 3,
    name: 'Kemeja Linen',
    image: 'public/images/kameja-linen.jpeg',
    itemCount: 18,
    slug: 'kemeja-linen',
  },
  {
    id: 4,
    name: 'Aksesori Noir',
    image: 'public/images/dompet.jpeg',
    itemCount: 20,
    slug: 'aksesori-pria',
  },
  {
    id: 5,
    name: 'Sepatu & Tas',
    image: 'public/images/tas_sepatu.jpeg',
    itemCount: 24,
    slug: 'sepatu-tas',
  },
];
