import buns from '../assets/images/epic-morning-buns.webp';
import wheatLoaf from '../assets/images/organic-wheat-free-loaf.webp';
import bananaPudding from '../assets/images/classic-banana-pudding.webp';
import cakes from '../assets/images/category/cakes.webp';
import cookies from '../assets/images/category/cookies.jpg';
import donuts from '../assets/images/category/donuts.jpg';
import breads from '../assets/images/category/breads.jpg';
import icebox from '../assets/images/category/icebox.jpg';
import allProducts from '../assets/images/category/all.jpg';

const IMAGE_BY_FILE = {
  'epic-morning-buns.webp': buns,
  'organic-wheat-free-loaf.webp': wheatLoaf,
  'classic-banana-pudding.webp': bananaPudding,
  'cakes.webp': cakes,
  'category/cakes.webp': cakes,
  'cookies.jpg': cookies,
  'category/cookies.jpg': cookies,
  'donuts.jpg': donuts,
  'category/donuts.jpg': donuts,
  'breads.jpg': breads,
  'category/breads.jpg': breads,
  'icebox.jpg': icebox,
  'category/icebox.jpg': icebox,
};

const IMAGE_BY_CATEGORY = {
  Breads: breads,
  Cakes: cakes,
  'Icebox Desserts': icebox,
  Cookies: cookies,
  Donuts: donuts,
};

export function getProductImage(product) {
  if (!product) return allProducts;
  return (
    IMAGE_BY_FILE[product.image] ||
    IMAGE_BY_CATEGORY[product.category] ||
    allProducts
  );
}

export function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export const SUGAR_LEVELS = {
  light: { label: 'Ringan', className: 'sugar-light', range: '≤10 g' },
  balanced: { label: 'Seimbang', className: 'sugar-balanced', range: '11–20 g' },
  indulgent: { label: 'Manja', className: 'sugar-indulgent', range: '21–35 g' },
  extra: { label: 'Manja banget', className: 'sugar-extra', range: '>35 g' },
};

export function sugarLevelMeta(level) {
  return SUGAR_LEVELS[level] || SUGAR_LEVELS.balanced;
}

export const CATEGORY_BY_SLUG = {
  breads: 'Breads',
  cakes: 'Cakes',
  'icebox-desserts': 'Icebox Desserts',
  cookies: 'Cookies',
  donuts: 'Donuts',
};

export const CATEGORY_FILTERS = [
  { label: 'Semua', slug: 'all', value: null },
  { label: 'Breads', slug: 'breads', value: 'Breads' },
  { label: 'Cakes', slug: 'cakes', value: 'Cakes' },
  { label: 'Icebox Desserts', slug: 'icebox-desserts', value: 'Icebox Desserts' },
  { label: 'Cookies', slug: 'cookies', value: 'Cookies' },
  { label: 'Donuts', slug: 'donuts', value: 'Donuts' },
];
