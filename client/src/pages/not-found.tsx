import { Link } from "wouter";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="h-12 w-12 text-primary" />
        </div>
        
        <h1 className="text-4xl font-serif font-bold text-slate-900">Page Not Found</h1>
        
        <p className="text-muted-foreground text-lg">
          The page you are looking for might have been moved, deleted, or possibly never existed.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/">
            <a className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </a>
          </Link>
          <Link href="/">
            <a className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-blue-800 transition-colors shadow-md">
              <Home className="w-4 h-4" />
              Return Home
            </a>
          </Link>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-xs text-slate-400">
        Error Code: 404 • UniAttend System
      </div>
    </div>
  );
}