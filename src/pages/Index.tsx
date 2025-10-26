import { Button } from "@/components/ui/button";
import BusinessCard from "@/components/BusinessCard";
import SearchBar from "@/components/SearchBar";
import { ArrowRight, Building2, Shield, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-business.jpg";

const Index = () => {
  const featuredBusinesses = [
    {
      title: "TechStart SaaS Platform",
      industry: "Technology",
      location: "San Francisco, CA",
      revenue: "$850K",
      price: "2.5M",
      profit: "$320K",
      description: "Established B2B SaaS platform with 500+ active clients and recurring revenue model. Strong growth trajectory.",
      featured: true,
    },
    {
      title: "Organic Coffee Chain",
      industry: "Hospitality",
      location: "Portland, OR",
      revenue: "$1.2M",
      price: "950K",
      profit: "$280K",
      description: "Popular coffee chain with 3 locations, loyal customer base, and prime real estate. Turnkey operation.",
      featured: true,
    },
    {
      title: "E-Commerce Fashion Brand",
      industry: "E-commerce",
      location: "New York, NY",
      revenue: "$2.1M",
      price: "1.8M",
      profit: "$580K",
      description: "Direct-to-consumer fashion brand with strong social media presence and automated fulfillment systems.",
      featured: true,
    },
  ];

  const allBusinesses = [
    {
      title: "Digital Marketing Agency",
      industry: "Services",
      location: "Austin, TX",
      revenue: "$450K",
      price: "380K",
      profit: "$160K",
      description: "Full-service digital marketing agency with 15+ long-term clients and experienced team in place.",
    },
    {
      title: "Manufacturing Supply Co.",
      industry: "Manufacturing",
      location: "Chicago, IL",
      revenue: "$3.5M",
      price: "2.8M",
      profit: "$820K",
      description: "B2B manufacturing supplier with established contracts and efficient production facilities.",
    },
    {
      title: "Boutique Fitness Studio",
      industry: "Hospitality",
      location: "Miami, FL",
      revenue: "$380K",
      price: "290K",
      profit: "$125K",
      description: "Modern fitness studio with strong membership base and excellent location in growing neighborhood.",
    },
    {
      title: "Mobile App Development",
      industry: "Technology",
      location: "Seattle, WA",
      revenue: "$680K",
      price: "520K",
      profit: "$240K",
      description: "Mobile-first development studio specializing in iOS and Android apps for enterprise clients.",
    },
    {
      title: "Retail Pet Supply Store",
      industry: "Retail",
      location: "Denver, CO",
      revenue: "$920K",
      price: "650K",
      profit: "$310K",
      description: "Well-established pet supply store with grooming services and loyal community following.",
    },
    {
      title: "Online Education Platform",
      industry: "E-commerce",
      location: "Boston, MA",
      revenue: "$1.5M",
      price: "1.2M",
      profit: "$480K",
      description: "Growing online education marketplace with 50+ instructors and thousands of active students.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">BizMarket</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">Browse</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">Sell</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">Resources</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">About</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-foreground hover:text-primary">
              Sign In
            </Button>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              List Your Business
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/5" />
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
              Buy & Sell Businesses
              <span className="block text-primary mt-2">With Confidence</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The trusted marketplace connecting business owners with qualified buyers. 
              Discover opportunities, make informed decisions, and close deals securely.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-8 text-lg">
                Browse Businesses
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2">
                Sell Your Business
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <SearchBar />
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Secure Transactions</h3>
              <p className="text-muted-foreground">
                Verified businesses and secure escrow services for peace of mind
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10">
                <TrendingUp className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Proven Track Record</h3>
              <p className="text-muted-foreground">
                $2.5B+ in successful business transactions on our platform
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                <Building2 className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Expert Support</h3>
              <p className="text-muted-foreground">
                Dedicated advisors to guide you through every step
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Featured Opportunities</h2>
            <p className="text-xl text-muted-foreground">
              Hand-picked businesses with exceptional growth potential
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {featuredBusinesses.map((business, index) => (
              <BusinessCard key={index} {...business} />
            ))}
          </div>
        </div>
      </section>

      {/* All Listings */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Browse All Listings</h2>
            <p className="text-xl text-muted-foreground">
              Explore hundreds of businesses across various industries
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allBusinesses.map((business, index) => (
              <BusinessCard key={index} {...business} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="h-12 px-8 border-2">
              Load More Businesses
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary via-primary to-primary/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Find Your Next Opportunity?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of entrepreneurs who have successfully bought or sold businesses on our platform.
          </p>
          <Button size="lg" className="bg-white hover:bg-white/90 text-primary h-14 px-8 text-lg font-semibold">
            Get Started Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold text-foreground">BizMarket</span>
              </div>
              <p className="text-muted-foreground">
                The trusted marketplace for buying and selling businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Buyers</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Browse Businesses</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Financing Options</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Sellers</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">List Your Business</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Valuation Tools</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Seller Resources</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 BizMarket. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;