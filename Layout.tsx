import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './components/Navigation';

const Layout = () => {
    return (
        <div className="h-screen w-full bg-gray-100 flex justify-center overflow-hidden">
            {/* Mobile container simulation */}
            <div className="w-full h-full bg-white relative shadow-2xl flex flex-col overflow-hidden">
                <main className="flex-1 overflow-hidden relative pb-16">
                    <Outlet />
                </main>
                <Navigation />
            </div>
        </div>
    );
};

export default Layout;