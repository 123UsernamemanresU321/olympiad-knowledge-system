import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Layers, FileText, ScrollText, Archive } from 'lucide-react';

export function Sidebar() {
    const location = useLocation();
    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Subjects', path: '/subjects', icon: BookOpen },
        { name: 'Problem Sets', path: '/search?type=problem', icon: Layers },
        { name: 'Mock Exams', path: '/search', icon: FileText },
    ];

    const resourceItems = [
        { name: 'Key Theorems', path: '/search?type=theorem', icon: ScrollText },
        { name: 'Past Papers', path: '/search', icon: Archive },
    ];

    const renderLink = (item: { name: string, path: string, icon: any }) => {
        const active = isActive(item.path);
        return (
            <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all w-full ${active
                    ? 'bg-primary-900 border-l-2 border-primary-500 text-primary-500 pl-[10px]'
                    : 'text-text-400 hover:text-text-200 hover:bg-base-600'
                    }`}
            >
                <item.icon className={`h-4 w-4 shrink-0 shadow-sm ${active ? 'text-primary-500' : 'text-text-400'}`} />
                <span className="text-sm font-medium">{item.name}</span>
            </Link>
        );
    };

    return (
        <aside className="w-64 flex-shrink-0 bg-base-700 border-r border-base-600 flex flex-col h-screen sticky top-0 hidden md:flex z-30">
            <div className="p-6 flex items-center gap-3 shrink-0">
                <div className="bg-primary-500 rounded flex items-center justify-center h-8 w-8 text-white shadow-lg shadow-primary-500/20">
                    <span className="font-bold">O</span>
                </div>
                <div>
                    <h1 className="text-sm font-bold text-text-100 tracking-tight leading-none mb-1">Olympiad Hub</h1>
                    <p className="text-[10px] text-text-500 uppercase tracking-widest leading-none">Knowledge Base</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-1 mt-2">
                {navItems.map(renderLink)}

                <div className="mt-6 mb-2 px-3">
                    <h2 className="text-[10px] font-bold text-text-500 uppercase tracking-widest">Resources</h2>
                </div>

                {resourceItems.map(renderLink)}
            </div>

            <div className="p-4 border-t border-base-600 shrink-0 mt-auto bg-base-700">
                <Link to="/study" className="flex items-center justify-center w-full bg-primary-500 hover:bg-primary-400 text-white text-xs font-bold py-3 rounded-sm transition-colors shadow-lg shadow-primary-500/20 tracking-wider">
                    START PRACTICE
                </Link>
            </div>
        </aside>
    );
}
