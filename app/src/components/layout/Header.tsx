import { Search, Bell, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Header() {
    return (
        <header className="h-[60px] bg-base-800 border-b border-base-600 flex items-center justify-end px-8 sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-6">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-text-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search theorems..."
                        className="w-64 bg-base-600 border border-base-500 rounded-sm py-1.5 pl-9 pr-8 text-sm text-text-200 placeholder-text-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                    />
                    <div className="absolute inset-y-0 right-1 flex items-center justify-center">
                        <div className="bg-primary-900 border border-primary-500/30 rounded px-1.5 py-0.5 text-[10px] font-mono text-primary-400">
                            ⌘K
                        </div>
                    </div>
                </div>

                <Link to="/errors" className="text-xs font-medium text-warning-500 hover:text-warning-400 bg-warning-900/30 px-3 py-1.5 rounded-sm border border-warning-900/50 transition-colors">
                    Debug Errors
                </Link>

                <div className="flex items-center gap-4 border-l border-base-600 pl-4">
                    <button className="text-text-500 hover:text-text-300 transition-colors">
                        <Bell className="h-5 w-5" />
                    </button>
                    <button className="h-8 w-8 rounded-full bg-base-500 border border-base-400 overflow-hidden flex items-center justify-center text-text-300 hover:text-white transition-colors">
                        <User className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
