'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();
  
  const links = [
    { name: 'Inicio', href: '/' },
    { name: 'Catálogo', href: '/catalogo' },
    { name: 'Vista Previa', href: '/vistaPrevia' }
  ];
  
  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-white text-xl font-bold">Balance de cuentas</h1>
        <ul className="flex space-x-4">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>
                <span
                  className={`px-3 py-2 rounded-md text-white hover:bg-gray-700 transition duration-300 ${
                    pathname === link.href ? 'bg-gray-900' : ''
                  }`}
                >
                  {link.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
