import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";


export const Footer = () => {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xl font-bold"></span>
            </div>
            <p className="text-sm text-muted-foreground">
            </p>
            {/* Use Cases button moved to header nav */}
          </div>

      
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Velocity AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
