import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-white py-8">
      <div className="max-w-[1800px] mx-auto px-8">
        <div className="flex items-center justify-between">
          <p className="text-xs font-light text-gray-500">
            &copy; {new Date().getFullYear()} Velocity AI. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs font-light text-gray-500">
            <Link to="#" className="hover:text-gray-900 transition">Privacy</Link>
            <Link to="#" className="hover:text-gray-900 transition">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
