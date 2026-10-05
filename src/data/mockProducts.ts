// src/data/mockProducts.ts
// ─────────────────────────────────────────────────────────
// Curated catalog for Explorify
// ─────────────────────────────────────────────────────────

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  rating?: number;
};

export const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Footwear', 'Home & Living'];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Sony WH-1000XM4 Wireless Noise Cancelling Headphones',
    category: 'Electronics',
    price: 248.00,
    description: 'Industry-leading noise cancellation technology with Dual Noise Sensor technology. Next-level music with Edge-AI and DSEE Extreme. Up to 30-hour battery life with quick charging.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
  },
  {
    id: 2,
    name: 'Apple Watch Series 9 GPS 45mm Midnight Aluminum',
    category: 'Electronics',
    price: 389.00,
    description: 'Smarter, brighter, mightier. Powerful S9 chip, a magical new way to use your watch without touching the screen, and double the display brightness.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
  },
  {
    id: 3,
    name: 'Nike Air Max 270 Running Shoes',
    category: 'Footwear',
    price: 159.99,
    description: "Nike's first lifestyle Air Max brings you style, comfort and big attitude in the Nike Air Max 270. Boasting Nike's biggest heel Air unit yet.",
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
  },
  {
    id: 4,
    name: 'Relaxed Fit Heavyweight Cotton Crewneck',
    category: 'Fashion',
    price: 34.50,
    description: 'Crafted from 100% combed organic cotton. Features a relaxed drop-shoulder cut with reinforced collar stitching for lasting structure and softness.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
  },
  {
    id: 5,
    name: 'Minimalist Matte Ceramic Pour-Over Kettle',
    category: 'Home & Living',
    price: 68.00,
    description: 'Precision-pour gooseneck spout designed for balanced coffee brewing. Ergonomic wooden balance handle and thermal insulation interior.',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
  },
  {
    id: 6,
    name: 'Anker Powerline+ III Braided USB-C Cable (6ft)',
    category: 'Electronics',
    price: 18.99,
    description: 'High-speed charging with ultra-durable curved stainless-steel head and quadruple-weave ballistic nylon cable core.',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
  },
  {
    id: 7,
    name: 'Nordic Architectural Table Desk Lamp',
    category: 'Home & Living',
    price: 54.00,
    description: 'Warm ambient LED lighting with capacitive touch dimming and matte sandblasted metal finish. USB-C rechargeable battery included.',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
  },
  {
    id: 8,
    name: 'Ultralight Daily Commuter Backpack 22L',
    category: 'Fashion',
    price: 85.00,
    description: 'Water-resistant Cordura fabric, padded 16-inch laptop compartment, hidden security pocket, and breathable mesh back panel.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
  },
];

