import type { ImageMetadata } from 'astro';
import uthLogo from '../assets/education/uth.png';

interface Education {
  name: string;
  shortName: string;
  url: string;
  logo: ImageMetadata;
}

export const education: Education[] = [
  {
    name: 'University of Transport Ho Chi Minh City',
    shortName: 'UTH',
    url: 'https://uth.edu.vn/',
    logo: uthLogo,
  },
];
