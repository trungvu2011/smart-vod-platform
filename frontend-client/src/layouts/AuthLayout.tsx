import { Outlet } from 'react-router-dom';
import { Play } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-wp-surface flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-wp-primary-container/20 via-wp-surface to-wp-surface" />
        
        {/* Decorative blurred circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-wp-primary-container/30 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-wp-tertiary-container/20 rounded-full blur-[60px]" />

        <div className="relative z-10 text-center space-y-6 px-12">
          <div className="w-16 h-16 rounded-2xl bg-wp-gradient mx-auto flex items-center justify-center shadow-wp-ambient">
            <Play size={28} className="text-wp-on-primary fill-current" />
          </div>
          <h1 className="text-4xl font-bold text-wp-on-surface tracking-tight">WayPoint</h1>
          <p className="text-lg text-wp-on-surface-variant max-w-sm mx-auto">
            Enterprise Video Platform
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <Outlet />
      </div>
    </div>
  );
}
