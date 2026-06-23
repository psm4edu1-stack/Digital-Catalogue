import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Grid, Tag, Package, User } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/categories', label: 'Categories', icon: Grid },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/offers', label: 'Offers', icon: Tag },
];

const BottomNav = () => {
  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-white" role="navigation" aria-label="Mobile navigation">
      {navItems.map(({ to, label, icon: Icon, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) =>
            `bottom-nav-item${isActive ? ' active' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                fill={isActive ? 'currentColor' : 'none'}
                style={{ opacity: isActive ? 1 : 0.6 }}
              />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
