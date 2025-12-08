
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ChefHat, ShoppingCart, Settings, Refrigerator } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; id?: string }> = ({ to, icon, label, id }) => {
  return (
    <NavLink
      to={to}
      id={id}
      aria-label={`Navigate to ${label}`}
      className="relative flex flex-col items-center justify-center w-full h-full"
    >
      {({ isActive: navIsActive }) => (
        <>
          {/* Animated Background Pill */}
          {navIsActive && (
            <MotionDiv
              layoutId="nav-pill"
              className="absolute -top-0.5 w-14 h-14 bg-brand-primary/20 rounded-2xl"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          
          <div className={`relative z-10 flex flex-col items-center space-y-1 transition-all duration-200 ${navIsActive ? 'text-brand-primary scale-105' : 'text-brand-text-secondary'}`}>
              {icon}
              <span className={`text-caption font-semibold tracking-wide ${navIsActive ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
          </div>
        </>
      )}
    </NavLink>
  );
};

export const Navigation: React.FC = () => {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 h-[85px] bg-brand-surface/90 backdrop-blur-xl rounded-t-[24px] pb-[20px] border-t-2 border-brand-divider/50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-full max-w-md mx-auto pt-1">
        <NavItem to="/" icon={<Home size={26} strokeWidth={1.5} />} label="Home" />
        <NavItem to="/pantry" icon={<Refrigerator size={26} strokeWidth={1.5} />} label="Pantry" />
        <NavItem to="/recipes" icon={<ChefHat size={26} strokeWidth={1.5} />} label="Cook" />
        <NavItem to="/shopping" icon={<ShoppingCart size={26} strokeWidth={1.5} />} label="Shop" />
        <NavItem to="/settings" icon={<Settings size={26} strokeWidth={1.5} />} label="Settings" id="tour-settings-nav" />
      </div>
    </nav>
  );
};
