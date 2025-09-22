import React, { useState } from 'react';
import Header from './Header';
import Hero from './Hero';
import ProductCatalog from './ProductCatalog';
import ProductDetail from './ProductDetail';
import InfoPage from './InfoPage';
import Footer from './Footer';
import FAQ from './FAQ';
import WebsiteReviews from './WebsiteReviews';
import Chatbot from './Chatbot';
import { User, Product, InfoPageType } from '../types';
import { useProducts } from '../hooks/useProducts';

interface MainAppProps {
  user: User;
  onLogout: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ user, onLogout }) => {
  // Remove cart state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentInfoPage, setCurrentInfoPage] = useState<InfoPageType['type'] | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { products, isLoading } = useProducts();

  // Remove cart handlers

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const scrollToProducts = () => {
    const productsSection = document.getElementById('products-section');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header 
        user={user} 
        onLogout={onLogout}
        onInfoPageSelect={setCurrentInfoPage}
        onCategorySelect={handleCategorySelect}
        onScrollToProducts={scrollToProducts}
      />
      
      {currentInfoPage ? (
        <InfoPage 
          type={currentInfoPage}
          onBack={() => setCurrentInfoPage(null)}
        />
      ) : selectedProduct ? (
        <ProductDetail
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
          isInWishlist={wishlist.includes(selectedProduct.id)}
          onToggleWishlist={() => toggleWishlist(selectedProduct.id)}
        />
      ) : (
        <>
          <Hero />
          <ProductCatalog 
            products={products}
            isLoading={isLoading}
            onProductSelect={setSelectedProduct}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
          <FAQ />
          <WebsiteReviews />
          <Footer onInfoPageSelect={setCurrentInfoPage} />
        </>
      )}

      {/* Remove Cart component */}
      
      <Chatbot />
    </div>
  );
};

export default MainApp;