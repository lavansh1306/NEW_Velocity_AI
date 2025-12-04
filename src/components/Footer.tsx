import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const footerLinks = {
  Product: ["Features", "Architecture", "Security", "Integrations"],
  Company: ["About", "Careers", "Blog", "Press"],
  Resources: ["Documentation", "API Reference", "Support", "Status", ],
  Legal: ["Privacy", "Terms", "Compliance", "DPA"]
};

export const Footer = () => {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
              <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
                <span className="text-lg font-bold text-white">V</span>
              </div>
              <span className="text-xl font-bold">Velocity AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Turn AI time savings into strategic impact with enterprise-grade workforce intelligence.
            </p>
            {/* Use Cases button moved to header nav */}
          </div>
          
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 font-semibold">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Velocity AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
